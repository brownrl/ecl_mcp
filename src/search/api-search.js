/**
 * API Search - Search component APIs (attributes, props, methods, events)
 */

import Database from 'better-sqlite3';

/**
 * Search component API documentation
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query for API name or description
 * @param {string} params.component - Filter by component name
 * @param {string} params.apiType - Filter by API type (attribute, prop, method, event, etc.)
 * @param {boolean} params.requiredOnly - Show only required items
 * @param {number} params.limit - Result limit (default 50)
 */
export function searchAPI(db, params = {}) {
  const startTime = Date.now();
  const {
    query = '',
    component = null,
    apiType = null,
    requiredOnly = false,
    limit = 50
  } = params;

  try {
    let sql = `
      SELECT 
        ca.*,
        p.title as component_name,
        p.url as component_url,
        cm.component_type
      FROM component_api ca
      JOIN pages p ON ca.page_id = p.id
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE 1=1
    `;

    const queryParams = [];

    // Search by name or description
    if (query && query.trim()) {
      sql += ` AND (ca.name LIKE ? OR ca.description LIKE ?)`;
      const searchPattern = `%${query.trim()}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    // Filter by component
    if (component) {
      sql += ` AND (p.title LIKE ? OR cm.component_name LIKE ?)`;
      const compPattern = `%${component}%`;
      queryParams.push(compPattern, compPattern);
    }

    // Filter by API type
    if (apiType) {
      sql += ` AND ca.api_type = ?`;
      queryParams.push(apiType);
    }

    // Filter required only
    if (requiredOnly) {
      sql += ` AND ca.required = 1`;
    }

    sql += `
      ORDER BY 
        ca.required DESC,
        p.title,
        ca.api_type,
        ca.name
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
          apis: []
        };
      }
      acc[key].apis.push({
        api_type: row.api_type,
        name: row.name,
        data_type: row.data_type,
        required: Boolean(row.required),
        default_value: row.default_value,
        description: row.description,
        options: row.options
      });
      return acc;
    }, {});

    return {
      success: true,
      data: {
        results: Object.values(grouped),
        total_count: results.length,
        component_count: Object.keys(grouped).length,
        query: { text: query, component, apiType, requiredOnly }
      },
      metadata: {
        tool: 'search_api',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        version: '2.0'
      }
    };

  } catch (error) {
    return {
      success: false,
      data: { results: [], total_count: 0 },
      errors: [{
        code: 'API_SEARCH_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'search_api',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Get all API for a specific component
 */
export function getComponentAPI(db, componentIdentifier) {
  const startTime = Date.now();

  try {
    // Find the component
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
          metadata: { tool: 'get_component_api', execution_time_ms: Date.now() - startTime }
        };
      }
      pageId = page.id;
    }

    // Get component info
    const component = db.prepare(`
      SELECT p.title, p.url, cm.component_name, cm.complexity
      FROM pages p
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE p.id = ?
    `).get(pageId);

    // Get all API entries
    const apis = db.prepare(`
      SELECT * FROM component_api WHERE page_id = ? ORDER BY api_type, required DESC, name
    `).all(pageId);

    // Group by API type
    const grouped = apis.reduce((acc, api) => {
      const type = api.api_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push({
        name: api.name,
        data_type: api.data_type,
        required: Boolean(api.required),
        default_value: api.default_value,
        description: api.description,
        options: api.options
      });
      return acc;
    }, {});

    return {
      success: true,
      data: {
        component: component.component_name || component.title,
        url: component.url,
        complexity: component.complexity,
        api: grouped,
        total_entries: apis.length
      },
      metadata: {
        tool: 'get_component_api',
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
        code: 'API_GET_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'get_component_api',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}
