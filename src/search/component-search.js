/**
 * Component Search - Multi-mode search for ECL components
 * Supports: name, category, feature, tag-based search
 */

import Database from 'better-sqlite3';

/**
 * Search components with multiple filters
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query (optional)
 * @param {string} params.category - Filter by category (optional)
 * @param {string} params.tag - Filter by tag (optional)
 * @param {string} params.complexity - Filter by complexity (optional)
 * @param {boolean} params.requiresJs - Filter by JS requirement (optional)
 * @param {number} params.limit - Result limit (default 20)
 * @returns {Object} Search results with metadata
 */
export function searchComponents(db, params = {}) {
  const startTime = Date.now();
  const {
    query = '',
    category = null,
    tag = null,
    complexity = null,
    requiresJs = null,
    limit = 20
  } = params;

  try {
    let sql = `
      SELECT DISTINCT
        p.id,
        p.url,
        p.title,
        p.category,
        cm.component_name,
        cm.component_type,
        cm.complexity,
        cm.requires_js,
        cm.status,
        GROUP_CONCAT(DISTINCT ct.tag) as tags
      FROM pages p
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      LEFT JOIN component_tags ct ON p.id = ct.page_id
      WHERE 1=1
    `;

    const queryParams = [];

    // Full-text search if query provided
    if (query && query.trim()) {
      sql += ` AND p.id IN (
        SELECT rowid FROM pages_fts 
        WHERE pages_fts MATCH ?
      )`;
      queryParams.push(query.trim());
    }

    // Filter by category
    if (category) {
      sql += ` AND p.category = ?`;
      queryParams.push(category);
    }

    // Filter by tag
    if (tag) {
      sql += ` AND ct.tag LIKE ?`;
      queryParams.push(`%${tag}%`);
    }

    // Filter by complexity
    if (complexity) {
      sql += ` AND cm.complexity = ?`;
      queryParams.push(complexity);
    }

    // Filter by JS requirement
    if (requiresJs !== null) {
      sql += ` AND cm.requires_js = ?`;
      queryParams.push(requiresJs ? 1 : 0);
    }

    sql += `
      GROUP BY p.id
      ORDER BY 
        CASE 
          WHEN p.title LIKE ? THEN 1
          WHEN cm.component_name LIKE ? THEN 2
          ELSE 3
        END,
        p.title
      LIMIT ?
    `;

    const searchPattern = query ? `%${query}%` : '%';
    queryParams.push(searchPattern, searchPattern, limit);

    const results = db.prepare(sql).all(...queryParams);

    // Enhance results with additional metadata
    const enhanced = results.map(row => ({
      id: row.id,
      url: row.url,
      title: row.title,
      category: row.category,
      component_name: row.component_name,
      component_type: row.component_type,
      complexity: row.complexity,
      requires_js: Boolean(row.requires_js),
      status: row.status,
      tags: row.tags ? row.tags.split(',') : []
    }));

    return {
      success: true,
      data: {
        results: enhanced,
        count: enhanced.length,
        query: {
          text: query,
          category,
          tag,
          complexity,
          requiresJs
        }
      },
      metadata: {
        tool: 'search_components',
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
        code: 'SEARCH_ERROR',
        message: error.message,
        details: { query, category, tag }
      }],
      metadata: {
        tool: 'search_components',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Get component details by ID or name
 */
export function getComponentDetails(db, identifier) {
  const startTime = Date.now();

  try {
    // Try by ID first, then by name
    let component;
    if (typeof identifier === 'number' || /^\d+$/.test(identifier)) {
      component = db.prepare(`
        SELECT p.*, cm.*
        FROM pages p
        LEFT JOIN component_metadata cm ON p.id = cm.page_id
        WHERE p.id = ?
      `).get(identifier);
    } else {
      component = db.prepare(`
        SELECT p.*, cm.*
        FROM pages p
        LEFT JOIN component_metadata cm ON p.id = cm.page_id
        WHERE cm.component_name LIKE ? OR p.title LIKE ?
        LIMIT 1
      `).get(`%${identifier}%`, `%${identifier}%`);
    }

    if (!component) {
      return {
        success: false,
        data: null,
        errors: [{ code: 'NOT_FOUND', message: 'Component not found' }],
        metadata: {
          tool: 'get_component_details',
          execution_time_ms: Date.now() - startTime
        }
      };
    }

    // Get tags
    const tags = db.prepare(`
      SELECT tag, tag_type FROM component_tags WHERE page_id = ?
    `).all(component.id);

    // Get guidance
    const guidance = db.prepare(`
      SELECT guidance_type, content FROM usage_guidance WHERE page_id = ?
    `).all(component.id);

    // Get API
    const api = db.prepare(`
      SELECT api_type, name, data_type, required, default_value, description
      FROM component_api WHERE page_id = ?
    `).all(component.id);

    // Get code examples count
    const exampleCount = db.prepare(`
      SELECT COUNT(*) as count FROM code_examples WHERE page_id = ?
    `).get(component.id).count;

    return {
      success: true,
      data: {
        id: component.id,
        url: component.url,
        title: component.title,
        category: component.category,
        component_name: component.component_name,
        component_type: component.component_type,
        complexity: component.complexity,
        requires_js: Boolean(component.requires_js),
        status: component.status,
        tags: tags.map(t => ({ tag: t.tag, type: t.tag_type })),
        guidance: guidance.reduce((acc, g) => {
          if (!acc[g.guidance_type]) acc[g.guidance_type] = [];
          acc[g.guidance_type].push(g.content);
          return acc;
        }, {}),
        api: api,
        example_count: exampleCount
      },
      metadata: {
        tool: 'get_component_details',
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
        code: 'DETAILS_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'get_component_details',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}
