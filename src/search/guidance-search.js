/**
 * Guidance Search - Find usage guidance, best practices, do's and don'ts
 */

import Database from 'better-sqlite3';

/**
 * Get component guidance (when to use, best practices, do's, don'ts)
 * @param {string|number} componentIdentifier - Component ID or name
 */
export function getComponentGuidance(db, componentIdentifier) {
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
          metadata: { tool: 'get_component_guidance', execution_time_ms: Date.now() - startTime }
        };
      }
      pageId = page.id;
    }

    // Get component info
    const component = db.prepare(`
      SELECT p.title, p.url, cm.component_name, cm.component_type, cm.complexity
      FROM pages p
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE p.id = ?
    `).get(pageId);

    // Get all guidance
    const guidance = db.prepare(`
      SELECT guidance_type, content, priority
      FROM usage_guidance
      WHERE page_id = ?
      ORDER BY 
        CASE guidance_type
          WHEN 'when-to-use' THEN 1
          WHEN 'when-not-to-use' THEN 2
          WHEN 'best-practice' THEN 3
          WHEN 'do' THEN 4
          WHEN 'dont' THEN 5
          WHEN 'caveat' THEN 6
          WHEN 'limitation' THEN 7
          WHEN 'note' THEN 8
          ELSE 9
        END,
        priority DESC
    `).all(pageId);

    // Group by type
    const grouped = guidance.reduce((acc, g) => {
      const type = g.guidance_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(g.content);
      return acc;
    }, {});

    return {
      success: true,
      data: {
        component: component.component_name || component.title,
        url: component.url,
        component_type: component.component_type,
        complexity: component.complexity,
        guidance: grouped,
        total_items: guidance.length
      },
      metadata: {
        tool: 'get_component_guidance',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        version: '2.0'
      },
      suggestions: guidance.length === 0 ? [
        'This component may not have structured guidance yet.',
        'Check the component URL for additional documentation.'
      ] : []
    };

  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [{
        code: 'GUIDANCE_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'get_component_guidance',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Search guidance across all components
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {string} params.type - Filter by guidance type
 * @param {string} params.component - Filter by component
 * @param {number} params.limit - Result limit (default 30)
 */
export function searchGuidance(db, params = {}) {
  const startTime = Date.now();
  const {
    query = '',
    type = null,
    component = null,
    limit = 30
  } = params;

  try {
    let sql = `
      SELECT 
        ug.guidance_type,
        ug.content,
        p.title as component_name,
        p.url as component_url,
        cm.component_type
      FROM usage_guidance ug
      JOIN pages p ON ug.page_id = p.id
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE 1=1
    `;

    const queryParams = [];

    // Search in content
    if (query && query.trim()) {
      sql += ` AND ug.content LIKE ?`;
      queryParams.push(`%${query.trim()}%`);
    }

    // Filter by guidance type
    if (type) {
      sql += ` AND ug.guidance_type = ?`;
      queryParams.push(type);
    }

    // Filter by component
    if (component) {
      sql += ` AND (p.title LIKE ? OR cm.component_name LIKE ?)`;
      const compPattern = `%${component}%`;
      queryParams.push(compPattern, compPattern);
    }

    sql += `
      ORDER BY 
        CASE ug.guidance_type
          WHEN 'when-to-use' THEN 1
          WHEN 'when-not-to-use' THEN 2
          WHEN 'caveat' THEN 3
          WHEN 'limitation' THEN 4
          ELSE 5
        END,
        p.title
      LIMIT ?
    `;
    queryParams.push(limit);

    const results = db.prepare(sql).all(...queryParams);

    // Group by component
    const grouped = results.reduce((acc, row) => {
      const key = row.component_name;
      if (!acc[key]) {
        acc[key] = {
          component: row.component_name,
          component_url: row.component_url,
          component_type: row.component_type,
          guidance: {}
        };
      }
      const type = row.guidance_type;
      if (!acc[key].guidance[type]) acc[key].guidance[type] = [];
      acc[key].guidance[type].push(row.content);
      return acc;
    }, {});

    return {
      success: true,
      data: {
        results: Object.values(grouped),
        total_items: results.length,
        component_count: Object.keys(grouped).length,
        query: { text: query, type, component }
      },
      metadata: {
        tool: 'search_guidance',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        version: '2.0'
      }
    };

  } catch (error) {
    return {
      success: false,
      data: { results: [], total_items: 0 },
      errors: [{
        code: 'GUIDANCE_SEARCH_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'search_guidance',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}
