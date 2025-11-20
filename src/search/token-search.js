/**
 * Design Token Search - Search and retrieve ECL design tokens
 */

import Database from 'better-sqlite3';

/**
 * Search design tokens
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {string} params.category - Filter by category (color, spacing, typography, etc.)
 * @param {number} params.limit - Result limit (default 50)
 */
export function searchDesignTokens(db, params = {}) {
  const startTime = Date.now();
  const {
    query = '',
    category = null,
    limit = 50
  } = params;

  try {
    let sql = `
      SELECT 
        dt.*,
        p.title as source_page
      FROM design_tokens dt
      LEFT JOIN pages p ON dt.source_page_id = p.id
      WHERE 1=1
    `;

    const queryParams = [];

    // Search in token name or description
    if (query && query.trim()) {
      sql += ` AND (dt.token_name LIKE ? OR dt.description LIKE ? OR dt.css_variable LIKE ?)`;
      const searchPattern = `%${query.trim()}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // Filter by category
    if (category) {
      sql += ` AND dt.category = ?`;
      queryParams.push(category);
    }

    sql += ` ORDER BY dt.category, dt.token_name LIMIT ?`;
    queryParams.push(limit);

    const results = db.prepare(sql).all(...queryParams);

    // Group by category
    const grouped = results.reduce((acc, token) => {
      const cat = token.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({
        token_name: token.token_name,
        css_variable: token.css_variable,
        value: token.value,
        description: token.description,
        usage_context: token.usage_context,
        source_page: token.source_page
      });
      return acc;
    }, {});

    return {
      success: true,
      data: {
        results: grouped,
        total_count: results.length,
        categories: Object.keys(grouped),
        query: { text: query, category }
      },
      metadata: {
        tool: 'search_design_tokens',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        version: '2.0'
      }
    };

  } catch (error) {
    return {
      success: false,
      data: { results: {}, total_count: 0 },
      errors: [{
        code: 'TOKEN_SEARCH_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'search_design_tokens',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Get all tokens for a specific category
 * @param {string} category - Token category (color, spacing, typography, etc.)
 */
export function getTokensByCategory(db, category) {
  const startTime = Date.now();

  try {
    const tokens = db.prepare(`
      SELECT 
        token_name,
        css_variable,
        value,
        description,
        usage_context
      FROM design_tokens
      WHERE category = ?
      ORDER BY token_name
    `).all(category);

    return {
      success: true,
      data: {
        category,
        tokens,
        count: tokens.length
      },
      metadata: {
        tool: 'get_tokens_by_category',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        version: '2.0'
      },
      suggestions: tokens.length === 0 ? [
        `No tokens found for category: ${category}`,
        'Available categories: color, spacing, typography, breakpoint, shadow, border-radius, z-index, timing'
      ] : []
    };

  } catch (error) {
    return {
      success: false,
      data: { tokens: [], count: 0 },
      errors: [{
        code: 'TOKEN_CATEGORY_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'get_tokens_by_category',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Get specific token by name
 * @param {string} tokenName - Token name or CSS variable
 */
export function getToken(db, tokenName) {
  const startTime = Date.now();

  try {
    const token = db.prepare(`
      SELECT 
        dt.*,
        p.title as source_page,
        p.url as source_url
      FROM design_tokens dt
      LEFT JOIN pages p ON dt.source_page_id = p.id
      WHERE dt.token_name = ? OR dt.css_variable = ?
    `).get(tokenName, tokenName);

    if (!token) {
      return {
        success: false,
        data: null,
        errors: [{ code: 'NOT_FOUND', message: 'Token not found' }],
        metadata: { tool: 'get_token', execution_time_ms: Date.now() - startTime },
        suggestions: [
          'Token not found. Try searching with wildcards.',
          'Use search_design_tokens to find similar tokens.'
        ]
      };
    }

    return {
      success: true,
      data: {
        token_name: token.token_name,
        css_variable: token.css_variable,
        value: token.value,
        category: token.category,
        description: token.description,
        usage_context: token.usage_context,
        source: {
          page: token.source_page,
          url: token.source_url
        }
      },
      metadata: {
        tool: 'get_token',
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
        code: 'TOKEN_GET_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'get_token',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Get all available token categories with counts
 */
export function getTokenCategories(db) {
  const startTime = Date.now();

  try {
    const categories = db.prepare(`
      SELECT 
        category,
        COUNT(*) as count
      FROM design_tokens
      GROUP BY category
      ORDER BY category
    `).all();

    return {
      success: true,
      data: {
        categories: categories.map(c => ({
          name: c.category,
          count: c.count
        })),
        total_categories: categories.length,
        total_tokens: categories.reduce((sum, c) => sum + c.count, 0)
      },
      metadata: {
        tool: 'get_token_categories',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        version: '2.0'
      }
    };

  } catch (error) {
    return {
      success: false,
      data: { categories: [], total_categories: 0, total_tokens: 0 },
      errors: [{
        code: 'CATEGORIES_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'get_token_categories',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}
