/**
 * Code Example Search - Find and retrieve code examples
 */

import Database from 'better-sqlite3';

/**
 * Search code examples
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {string} params.component - Filter by component
 * @param {string} params.language - Filter by language (html, js, css)
 * @param {string} params.complexity - Filter by complexity (basic, intermediate, advanced)
 * @param {boolean} params.completeOnly - Only complete examples
 * @param {boolean} params.interactiveOnly - Only interactive examples
 * @param {number} params.limit - Result limit (default 20)
 */
export function searchExamples(db, params = {}) {
  const startTime = Date.now();
  const {
    query = '',
    component = null,
    language = null,
    complexity = null,
    completeOnly = false,
    interactiveOnly = false,
    limit = 20
  } = params;

  try {
    let sql = `
      SELECT 
        ce.id,
        ce.page_id,
        ce.language,
        ce.code,
        ece.variant,
        ece.use_case,
        ece.complexity,
        ece.complete_example,
        ece.requires_data,
        ece.interactive,
        p.title as component_name,
        p.url as component_url,
        cm.component_type
      FROM code_examples ce
      LEFT JOIN enhanced_code_examples ece ON ce.id = ece.example_id
      JOIN pages p ON ce.page_id = p.id
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE 1=1
    `;

    const queryParams = [];

    // Search in code
    if (query && query.trim()) {
      sql += ` AND ce.code LIKE ?`;
      queryParams.push(`%${query.trim()}%`);
    }

    // Filter by component
    if (component) {
      sql += ` AND (p.title LIKE ? OR cm.component_name LIKE ?)`;
      const compPattern = `%${component}%`;
      queryParams.push(compPattern, compPattern);
    }

    // Filter by language
    if (language) {
      sql += ` AND ce.language = ?`;
      queryParams.push(language.toLowerCase());
    }

    // Filter by complexity
    if (complexity) {
      sql += ` AND ece.complexity = ?`;
      queryParams.push(complexity);
    }

    // Filter complete only
    if (completeOnly) {
      sql += ` AND ece.complete_example = 1`;
    }

    // Filter interactive only
    if (interactiveOnly) {
      sql += ` AND ece.interactive = 1`;
    }

    sql += `
      ORDER BY 
        ece.complete_example DESC,
        p.title,
        ce.language
      LIMIT ?
    `;
    queryParams.push(limit);

    const results = db.prepare(sql).all(...queryParams);

    // Format results
    const formatted = results.map(row => ({
      id: row.id,
      component: row.component_name,
      component_url: row.component_url,
      component_type: row.component_type,
      language: row.language,
      variant: row.variant,
      use_case: row.use_case,
      complexity: row.complexity,
      is_complete: Boolean(row.complete_example),
      requires_data: Boolean(row.requires_data),
      is_interactive: Boolean(row.interactive),
      code_preview: row.code.substring(0, 200) + (row.code.length > 200 ? '...' : ''),
      code_length: row.code.length
    }));

    return {
      success: true,
      data: {
        results: formatted,
        count: formatted.length,
        query: { text: query, component, language, complexity, completeOnly, interactiveOnly }
      },
      metadata: {
        tool: 'search_code_examples',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        version: '2.0'
      }
    };

  } catch (error) {
    return {
      success: false,
      data: { results: [], count: 0 },
      errors: [{
        code: 'EXAMPLE_SEARCH_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'search_code_examples',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Get complete code example by ID
 */
export function getExample(db, exampleId) {
  const startTime = Date.now();

  try {
    const example = db.prepare(`
      SELECT 
        ce.*,
        ece.*,
        p.title as component_name,
        p.url as component_url
      FROM code_examples ce
      LEFT JOIN enhanced_code_examples ece ON ce.id = ece.example_id
      JOIN pages p ON ce.page_id = p.id
      WHERE ce.id = ?
    `).get(exampleId);

    if (!example) {
      return {
        success: false,
        data: null,
        errors: [{ code: 'NOT_FOUND', message: 'Example not found' }],
        metadata: { tool: 'get_example', execution_time_ms: Date.now() - startTime }
      };
    }

    return {
      success: true,
      data: {
        id: example.id,
        component: example.component_name,
        component_url: example.component_url,
        language: example.language,
        variant: example.variant,
        use_case: example.use_case,
        complexity: example.complexity,
        is_complete: Boolean(example.complete_example),
        requires_data: Boolean(example.requires_data),
        is_interactive: Boolean(example.interactive),
        accessibility_notes: example.accessibility_notes,
        code: example.code
      },
      metadata: {
        tool: 'get_example',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        version: '2.0'
      }
    };

  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [{
        code: 'EXAMPLE_GET_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'get_example',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Get all examples for a component
 */
export function getComponentExamples(db, componentIdentifier) {
  const startTime = Date.now();

  try {
    // Find component
    let pageId;
    if (typeof componentIdentifier === 'number' || /^\d+$/.test(componentIdentifier)) {
      pageId = parseInt(componentIdentifier);
    } else {
      const page = db.prepare(`
        SELECT p.id FROM pages p
        LEFT JOIN component_metadata cm ON p.id = cm.page_id
        WHERE cm.component_name LIKE ? OR p.title LIKE ?
        LIMIT 1
      `).get(`%${componentIdentifier}%`, `%${componentIdentifier}%`);
      
      if (!page) {
        return {
          success: false,
          data: null,
          errors: [{ code: 'NOT_FOUND', message: 'Component not found' }],
          metadata: { tool: 'get_component_examples', execution_time_ms: Date.now() - startTime }
        };
      }
      pageId = page.id;
    }

    // Get examples
    const examples = db.prepare(`
      SELECT 
        ce.id,
        ce.language,
        ce.code,
        ece.variant,
        ece.use_case,
        ece.complexity,
        ece.complete_example,
        ece.interactive
      FROM code_examples ce
      LEFT JOIN enhanced_code_examples ece ON ce.id = ece.example_id
      WHERE ce.page_id = ?
      ORDER BY 
        ece.complete_example DESC,
        ce.language,
        ece.complexity
    `).all(pageId);

    // Group by language
    const grouped = examples.reduce((acc, ex) => {
      const lang = ex.language;
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push({
        id: ex.id,
        variant: ex.variant,
        use_case: ex.use_case,
        complexity: ex.complexity,
        is_complete: Boolean(ex.complete_example),
        is_interactive: Boolean(ex.interactive),
        code_preview: ex.code.substring(0, 150) + '...',
        code_length: ex.code.length
      });
      return acc;
    }, {});

    return {
      success: true,
      data: {
        page_id: pageId,
        examples: grouped,
        total_count: examples.length,
        languages: Object.keys(grouped)
      },
      metadata: {
        tool: 'get_component_examples',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        version: '2.0'
      }
    };

  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [{
        code: 'COMPONENT_EXAMPLES_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'get_component_examples',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}
