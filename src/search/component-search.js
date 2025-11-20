/**
 * Component Search - Multi-mode search for ECL components
 * Supports: name, category, feature, tag-based search
 */

import Database from 'better-sqlite3';

/**
 * Search synonyms/aliases for common component terms
 * Maps user queries to actual component names
 */
const COMPONENT_SYNONYMS = {
  // Form input synonyms
  'text input': ['Text field', 'text field'],
  'input': ['Text field', 'text field', 'text input'],
  'textbox': ['Text field', 'text field'],
  'input field': ['Text field', 'text field'],
  'input box': ['Text field', 'text field'],
  'text box': ['Text field', 'text field'],
  'email input': ['Text field', 'text field'],
  'number input': ['Text field', 'text field'],

  // Textarea synonyms
  'textarea': ['Text area', 'text area'],
  'text area': ['Text area'],
  'multiline': ['Text area', 'text area'],
  'multiline input': ['Text area', 'text area'],

  // Select/dropdown synonyms
  'dropdown': ['Select', 'select'],
  'select': ['Select'],
  'select dropdown': ['Select', 'select'],
  'select box': ['Select', 'select'],
  'select menu': ['Select', 'select'],
  'dropdown menu': ['Select', 'select'],

  // Alert/message synonyms
  'alert': ['Message', 'message', 'Notification', 'notification'],
  'message': ['Message', 'Notification'],
  'notification': ['Notification', 'Message'],
  'toast': ['Message', 'message', 'Notification'],

  // Tag/badge synonyms
  'badge': ['Tag', 'tag', 'Label', 'label'],
  'tag': ['Tag', 'Label'],
  'label': ['Tag', 'tag', 'Label'],

  // Common variations
  'form field': ['Text field', 'text field', 'Select', 'select', 'Text area'],
  'form input': ['Text field', 'text field', 'Select', 'select', 'Text area']
};

/**
 * Detect special query intents (variants, options, nesting, etc.)
 * @param {string} query - Search query
 * @returns {Object|null} - Intent detection result with component name and intent type
 */
function detectQueryIntent(query) {
  const queryLower = query.toLowerCase().trim();
  
  // Intent keywords
  const variantKeywords = ['variant', 'variants', 'type', 'types', 'kind', 'kinds', 'option', 'options', 'style', 'styles'];
  const nestingKeywords = ['inside', 'within', 'contain', 'contains', 'child', 'children', 'nested', 'nesting'];
  const exampleKeywords = ['example', 'examples', 'sample', 'samples', 'demo', 'demos'];
  
  // Check for variant queries: "button variants", "card types", "icon options"
  const variantPattern = new RegExp(`(\\w+)\\s+(${variantKeywords.join('|')})`, 'i');
  const variantMatch = queryLower.match(variantPattern);
  
  if (variantMatch) {
    return {
      intent: 'variants',
      component: variantMatch[1],
      suggestion: `Use ecl_get_component with include: ["variants"] to discover ${variantMatch[1]} variants`
    };
  }
  
  // Check for nesting queries: "what goes inside card", "button children"
  const nestingPattern = new RegExp(`(${nestingKeywords.join('|')})\\s+(\\w+)|\\b(\\w+)\\s+(${nestingKeywords.join('|')})`, 'i');
  const nestingMatch = queryLower.match(nestingPattern);
  
  if (nestingMatch) {
    const component = nestingMatch[2] || nestingMatch[3];
    return {
      intent: 'nesting',
      component: component,
      suggestion: `Use ecl_get_component with include: ["nesting"] to analyze ${component} nesting patterns`
    };
  }
  
  // Check for example queries: "button examples", "card samples"
  const examplePattern = new RegExp(`(\\w+)\\s+(${exampleKeywords.join('|')})`, 'i');
  const exampleMatch = queryLower.match(examplePattern);
  
  if (exampleMatch) {
    return {
      intent: 'examples',
      component: exampleMatch[1],
      suggestion: `Use ecl_get_component with include: ["examples"] or ecl_search with type: "example" to find ${exampleMatch[1]} examples`
    };
  }
  
  return null;
}

/**
 * Expand query with synonyms
 * @param {string} query - Original search query
 * @returns {Array<string>} - Array of queries including synonyms
 */
function expandQueryWithSynonyms(query) {
  const queries = [query]; // Always include original query
  const queryLower = query.toLowerCase().trim();

  // Check for exact synonym match
  if (COMPONENT_SYNONYMS[queryLower]) {
    queries.push(...COMPONENT_SYNONYMS[queryLower]);
  }

  // Check for partial matches (multi-word queries)
  Object.entries(COMPONENT_SYNONYMS).forEach(([synonym, expansions]) => {
    if (queryLower.includes(synonym) || synonym.includes(queryLower)) {
      queries.push(...expansions);
    }
  });

  return [...new Set(queries)]; // Remove duplicates
}

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
    // Detect special query intents (variants, nesting, examples)
    const intent = query ? detectQueryIntent(query) : null;
    
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
      // Expand query with synonyms
      const expandedQueries = expandQueryWithSynonyms(query);

      // Build OR conditions for all expanded queries
      const orConditions = [];

      expandedQueries.forEach(expandedQuery => {
        orConditions.push(`p.title LIKE ?`);
        queryParams.push(`%${expandedQuery.trim()}%`);

        orConditions.push(`cm.component_name LIKE ?`);
        queryParams.push(`%${expandedQuery.trim()}%`);

        orConditions.push(`ct.tag LIKE ?`);
        queryParams.push(`%${expandedQuery.trim()}%`);
      });

      sql += ` AND (${orConditions.join(' OR ')})`;
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
    `;

    // Fetch more results to allow for JS-based re-ranking
    // We'll apply the limit after scoring
    const maxFetch = 100;

    const queryParamsWithSearch = [...queryParams];
    // We removed the ORDER BY clauses that used parameters, so we don't need to push them
    // But we still need to handle the parameters if we had them.
    // Wait, the previous code pushed searchPattern twice for the ORDER BY.
    // We need to remove those pushes if we remove the ORDER BY.

    // Let's reconstruct the query execution cleanly.
    const results = db.prepare(sql).all(...queryParams);

    // Enhance results with additional metadata and calculate score
    const searchTerms = query ? query.toLowerCase().split(/\s+/).filter(t => t.length > 0) : [];
    const expandedQueries = query ? expandQueryWithSynonyms(query) : [];
    const allSearchTerms = [...new Set([...searchTerms, ...expandedQueries.flatMap(eq => eq.toLowerCase().split(/\s+/))])];

    let enhanced = results.map(row => {
      const item = {
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
      };

      // Calculate Relevance Score
      let score = 0;
      if (query) {
        const titleLower = (item.title || '').toLowerCase();
        const nameLower = (item.component_name || '').toLowerCase();
        const queryLower = query.toLowerCase();

        // Check against all expanded queries for exact matches
        expandedQueries.forEach(expandedQuery => {
          const expLower = expandedQuery.toLowerCase();

          // 1. Exact full phrase match (Highest)
          if (titleLower === expLower || nameLower === expLower) score += 1000;

          // 2. Starts with query
          else if (titleLower.startsWith(expLower) || nameLower.startsWith(expLower)) score += 800;

          // 3. Contains full query phrase
          else if (titleLower.includes(expLower) || nameLower.includes(expLower)) score += 600;
        });

        // 4. Word overlap (High value per word)
        let matchedWords = 0;
        let titleMatchedWords = 0;
        let nameMatchedWords = 0;

        allSearchTerms.forEach(term => {
          if (!term || term.length < 2) return; // Skip very short terms

          const inTitle = titleLower.includes(term);
          const inName = nameLower.includes(term);

          if (inTitle || inName) {
            matchedWords++;
            if (inTitle) titleMatchedWords++;
            if (inName) nameMatchedWords++;

            score += 100; // Base points for word match

            // Bonus for exact word match (not partial)
            const titleWords = titleLower.split(/\s+/);
            const nameWords = nameLower.split(/\s+/);

            if (titleWords.includes(term)) score += 50;
            if (nameWords.includes(term)) score += 50;

            // Bonus for starting with the word
            if (titleWords.some(w => w.startsWith(term))) score += 25;
            if (nameWords.some(w => w.startsWith(term))) score += 25;
          }
        });

        // Major bonus for matching all words from original query
        if (matchedWords >= searchTerms.length && searchTerms.length > 0) score += 200;

        // Bonus for title/component_name having more word matches than tags
        score += (titleMatchedWords * 30);
        score += (nameMatchedWords * 30);

        // 5. Category match (Low)
        if (item.category && item.category.toLowerCase().includes(queryLower)) score += 10;

        // 6. Tag match (Lower priority to avoid false positives)
        const tagMatches = item.tags.filter(t =>
          allSearchTerms.some(term => t.toLowerCase().includes(term))
        ).length;
        score += (tagMatches * 5); // Much lower than title/name matches
      }

      return { ...item, score };
    });

    // Sort by score (descending) then title (ascending)
    if (query) {
      enhanced.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.title.localeCompare(b.title);
      });
    } else {
      // Default sort if no query
      enhanced.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Apply limit
    enhanced = enhanced.slice(0, limit);

    const response = {
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

    // Add intent detection suggestion if query had special intent and no results
    if (intent && enhanced.length === 0) {
      response.data.suggestion = intent.suggestion;
      response.data.detected_intent = intent.intent;
      response.data.component_hint = intent.component;
    }

    return response;

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
      // Use DISTINCT to prevent duplicate rows from multiple component_metadata entries
      component = db.prepare(`
        SELECT DISTINCT
          p.id, p.url, p.title, p.category,
          cm.component_name, cm.component_type, cm.complexity, cm.status, cm.variant,
          cm.requires_js, cm.framework_specific
        FROM pages p
        LEFT JOIN component_metadata cm ON p.id = cm.page_id
        WHERE p.id = ?
        LIMIT 1
      `).get(identifier);
    } else {
      // Normalize the search term: lowercase, remove spaces and hyphens
      const normalized = identifier.toLowerCase().replace(/[\s-]/g, '');

      // Prioritize exact match, then prefix match, then contains
      // Use explicit column selection to avoid id column conflict between pages and component_metadata
      // Use DISTINCT to prevent duplicate rows from multiple component_metadata entries
      component = db.prepare(`
        SELECT DISTINCT
          p.id, p.url, p.title, p.category,
          cm.component_name, cm.component_type, cm.complexity, cm.status, cm.variant,
          cm.requires_js, cm.framework_specific
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

      // Aggregate example count across all related pages for the component
      // Find all page IDs for this component (usage, code, api, playground)
      const normalized = (component.component_name || component.title).toLowerCase().replace(/\s|-/, '');
      const relatedPages = db.prepare(`
        SELECT DISTINCT p.id
        FROM pages p
        LEFT JOIN component_metadata cm ON p.id = cm.page_id
        WHERE REPLACE(REPLACE(LOWER(cm.component_name), ' ', ''), '-', '') = ?
           OR REPLACE(REPLACE(LOWER(p.title), ' ', ''), '-', '') = ?
      `).all(normalized, normalized);

      let exampleCount = 0;
      if (relatedPages.length > 0) {
        const pageIds = relatedPages.map(p => p.id);
        const placeholders = pageIds.map(() => '?').join(',');
        exampleCount = db.prepare(`
          SELECT COUNT(*) as count FROM code_examples WHERE page_id IN (${placeholders})
        `).get(...pageIds).count;
      }

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
