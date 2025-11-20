/**
 * Code Example Search - Find and retrieve code examples
 */

import Database from 'better-sqlite3';

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching (e.g., "buitton" -> "button")
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[len2][len1];
}

/**
 * Calculate fuzzy match score (0-100)
 * Higher is better
 */
function fuzzyMatchScore(query, target) {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  // Exact match
  if (queryLower === targetLower) return 100;

  // Starts with
  if (targetLower.startsWith(queryLower)) return 90;

  // Contains
  if (targetLower.includes(queryLower)) return 80;

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(queryLower, targetLower);
  const maxLen = Math.max(queryLower.length, targetLower.length);

  // If distance is very small relative to length, it's likely a typo
  if (distance <= 2 && maxLen > 3) {
    return 70 - (distance * 10);
  }

  // Check word-level matching
  const queryWords = queryLower.split(/\s+/);
  const targetWords = targetLower.split(/\s+/);
  let wordMatches = 0;

  for (const qWord of queryWords) {
    for (const tWord of targetWords) {
      const dist = levenshteinDistance(qWord, tWord);
      if (dist === 0) {
        wordMatches += 20;
      } else if (dist === 1 && qWord.length > 3) {
        wordMatches += 15;
      } else if (dist === 2 && qWord.length > 5) {
        wordMatches += 10;
      }
    }
  }

  return Math.min(wordMatches, 65);
}

/**
 * Search code examples
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query (searches component names)
 * @param {string} params.component - Filter by component (alias for query)
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
    // Use query or component (they're aliases for component name search)
    const searchTerm = query || component || '';

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
        cm.component_type,
        cm.component_name as metadata_component_name
      FROM code_examples ce
      LEFT JOIN enhanced_code_examples ece ON ce.id = ece.example_id
      JOIN pages p ON ce.page_id = p.id
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE 1=1
    `;

    const queryParams = [];

    // For fuzzy matching, we'll get all results if searching by term,
    // then score them in JavaScript
    const doingFuzzySearch = searchTerm && searchTerm.trim();

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
    `;

    // Don't limit in SQL if we're doing fuzzy search - we need all results to score
    if (!doingFuzzySearch) {
      sql += ` LIMIT ?`;
      queryParams.push(limit);
    }

    const results = db.prepare(sql).all(...queryParams);

    // Calculate fuzzy match scores
    let scored = results.map(row => {
      const title = row.component_name || '';
      const metaName = row.metadata_component_name || '';

      let score = 0;

      if (doingFuzzySearch) {
        // Use fuzzy matching for both title and metadata name
        const titleScore = fuzzyMatchScore(searchTerm, title);
        const metaScore = fuzzyMatchScore(searchTerm, metaName);
        score = Math.max(titleScore, metaScore);
      }

      return { ...row, score };
    });

    // Filter out very low scores (below 40) if doing fuzzy search
    if (doingFuzzySearch) {
      scored = scored.filter(row => row.score >= 40);
    }

    // Sort by score, then by completeness, then by component name
    if (doingFuzzySearch) {
      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.complete_example !== a.complete_example) return b.complete_example - a.complete_example;
        return a.component_name.localeCompare(b.component_name);
      });
    }

    // Apply final limit
    scored = scored.slice(0, limit);

    // Format results
    const formatted = scored.map(row => ({
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
      code: row.code,  // Return full code instead of preview
      code_length: row.code.length,
      relevance_score: row.score
    }));

    // Generate smart suggestions if no results found
    let suggestions = null;
    if (formatted.length === 0 && searchTerm) {
      suggestions = [];

      // Get all unique component names for suggestion matching
      const allComponents = db.prepare(`
        SELECT DISTINCT p.title, cm.component_name
        FROM pages p
        LEFT JOIN component_metadata cm ON p.id = cm.page_id
        WHERE p.category IN ('forms', 'navigation', 'content', 'media', 'banners', 'site-wide')
      `).all();

      // Find close matches
      const closeMatches = [];
      for (const comp of allComponents) {
        const title = comp.title || comp.component_name || '';
        const score = fuzzyMatchScore(searchTerm, title);
        if (score >= 30 && score < 40) {  // Close but not good enough
          closeMatches.push({ name: title, score });
        }
      }

      // Sort by score and take top 3
      closeMatches.sort((a, b) => b.score - a.score);
      const topMatches = closeMatches.slice(0, 3);

      if (topMatches.length > 0) {
        suggestions.push(`Did you mean: ${topMatches.map(m => `"${m.name}"`).join(', ')}?`);
      }

      suggestions.push('Try broader terms like "form", "navigation", or "button"');
      suggestions.push('Use ecl_search with type="component" to browse all available components');
    }

    return {
      success: true,
      data: {
        results: formatted,
        count: formatted.length,
        query: { text: searchTerm, language, complexity, completeOnly, interactiveOnly }
      },
      metadata: {
        tool: 'search_code_examples',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        version: '2.0'
      },
      ...(suggestions && { suggestions })
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
      // Normalize the search term: lowercase, remove spaces and hyphens
      const normalized = componentIdentifier.toLowerCase().replace(/[\s-]/g, '');

      // Prioritize exact match, then prefix match, then contains
      const page = db.prepare(`
        SELECT p.id
        FROM pages p
        LEFT JOIN component_metadata cm ON p.id = cm.page_id
        WHERE REPLACE(REPLACE(LOWER(cm.component_name), ' ', ''), '-', '') LIKE '%' || ? || '%'
           OR REPLACE(REPLACE(LOWER(p.title), ' ', ''), '-', '') LIKE '%' || ? || '%'
        ORDER BY
          CASE
            WHEN REPLACE(REPLACE(LOWER(cm.component_name), ' ', ''), '-', '') = ? THEN 1
            WHEN REPLACE(REPLACE(LOWER(p.title), ' ', ''), '-', '') = ? THEN 1
            WHEN REPLACE(REPLACE(LOWER(cm.component_name), ' ', ''), '-', '') LIKE ? || '%' THEN 2
            WHEN REPLACE(REPLACE(LOWER(p.title), ' ', ''), '-', '') LIKE ? || '%' THEN 2
            ELSE 3
          END
        LIMIT 1
      `).get(normalized, normalized, normalized, normalized, normalized, normalized);

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
        code: ex.code,  // Return full code instead of preview
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
