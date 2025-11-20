/**
 * Tag-Based Component Discovery
 * Find components by tags and categorization
 */

import Database from 'better-sqlite3';

/**
 * Find components by tag
 * @param {Database} db - SQLite database instance
 * @param {string|string[]} tags - Single tag or array of tags to search for
 * @param {Object} options - Search options
 * @param {string} options.tag_type - Filter by tag type (feature, category, accessibility, interaction)
 * @param {string} options.match_mode - 'any' (default) or 'all' for multiple tags
 * @param {boolean} options.include_metadata - Include component metadata
 * @returns {Object} Search results with components grouped by tag
 */
export function findComponentsByTag(db, tags, options = {}) {
  const startTime = Date.now();

  try {
    // Normalize tags to array
    const tagArray = Array.isArray(tags) ? tags : [tags];
    
    if (tagArray.length === 0) {
      return {
        success: false,
        error: 'At least one tag is required',
        metadata: { execution_time_ms: Date.now() - startTime }
      };
    }

    const {
      tag_type = null,
      match_mode = 'any',
      include_metadata = true
    } = options;

    // Build query based on match mode
    let sql, params;

    if (match_mode === 'all' && tagArray.length > 1) {
      // Find components that have ALL specified tags
      sql = `
        SELECT DISTINCT
          p.id,
          p.component_name,
          p.title,
          p.url,
          p.category
        FROM pages p
        WHERE p.id IN (
          SELECT ct.page_id
          FROM component_tags ct
          WHERE ct.tag IN (${tagArray.map(() => '?').join(',')})
            ${tag_type ? 'AND ct.tag_type = ?' : ''}
          GROUP BY ct.page_id
          HAVING COUNT(DISTINCT ct.tag) = ?
        )
        ORDER BY p.component_name
      `;
      
      params = [...tagArray];
      if (tag_type) params.push(tag_type);
      params.push(tagArray.length);
      
    } else {
      // Find components that have ANY of the specified tags
      sql = `
        SELECT DISTINCT
          p.id,
          p.component_name,
          p.title,
          p.url,
          p.category,
          ct.tag,
          ct.tag_type
        FROM pages p
        JOIN component_tags ct ON p.id = ct.page_id
        WHERE ct.tag IN (${tagArray.map(() => '?').join(',')})
          ${tag_type ? 'AND ct.tag_type = ?' : ''}
        ORDER BY p.component_name, ct.tag
      `;
      
      params = [...tagArray];
      if (tag_type) params.push(tag_type);
    }

    const results = db.prepare(sql).all(...params);

    // Get component metadata if requested
    if (include_metadata && results.length > 0) {
      const pageIds = [...new Set(results.map(r => r.id))];
      
      const metadata = db.prepare(`
        SELECT 
          page_id,
          component_type,
          complexity,
          status,
          variant,
          requires_js,
          framework_specific
        FROM component_metadata
        WHERE page_id IN (${pageIds.map(() => '?').join(',')})
      `).all(...pageIds);

      // Create metadata lookup
      const metadataMap = {};
      metadata.forEach(m => {
        metadataMap[m.page_id] = m;
      });

      // Attach metadata to results
      results.forEach(r => {
        if (metadataMap[r.id]) {
          r.metadata = metadataMap[r.id];
        }
      });
    }

    // Group results by component
    const componentMap = {};
    results.forEach(r => {
      if (!componentMap[r.id]) {
        componentMap[r.id] = {
          id: r.id,
          component_name: r.component_name,
          title: r.title,
          url: r.url,
          category: r.category,
          metadata: r.metadata,
          matched_tags: []
        };
      }
      
      if (r.tag && !componentMap[r.id].matched_tags.includes(r.tag)) {
        componentMap[r.id].matched_tags.push(r.tag);
      }
    });

    const components = Object.values(componentMap);

    // Get all tags for found components for exploration
    const allTags = db.prepare(`
      SELECT DISTINCT tag, tag_type
      FROM component_tags
      WHERE page_id IN (${components.map(() => '?').join(',')})
      ORDER BY tag_type, tag
    `).all(...components.map(c => c.id));

    // Group tags by type
    const tagsByType = {};
    allTags.forEach(t => {
      if (!tagsByType[t.tag_type]) {
        tagsByType[t.tag_type] = [];
      }
      if (!tagsByType[t.tag_type].includes(t.tag)) {
        tagsByType[t.tag_type].push(t.tag);
      }
    });

    return {
      success: true,
      query: {
        tags: tagArray,
        tag_type: tag_type,
        match_mode: match_mode
      },
      results: {
        components: components,
        count: components.length,
        tags_in_results: tagsByType
      },
      metadata: {
        execution_time_ms: Date.now() - startTime,
        match_mode: match_mode
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Tag search failed: ${error.message}`,
      metadata: { execution_time_ms: Date.now() - startTime }
    };
  }
}

/**
 * Get all available tags
 * @param {Database} db - SQLite database instance
 * @param {Object} options - Options
 * @param {string} options.tag_type - Filter by type
 * @param {boolean} options.include_counts - Include usage counts
 * @returns {Object} Available tags grouped by type
 */
export function getAvailableTags(db, options = {}) {
  const startTime = Date.now();

  try {
    const { tag_type = null, include_counts = true } = options;

    let sql = `
      SELECT 
        tag,
        tag_type,
        ${include_counts ? 'COUNT(DISTINCT page_id) as component_count' : '1 as component_count'}
      FROM component_tags
      ${tag_type ? 'WHERE tag_type = ?' : ''}
      GROUP BY tag, tag_type
      ORDER BY tag_type, tag
    `;

    const params = tag_type ? [tag_type] : [];
    const tags = db.prepare(sql).all(...params);

    // Group by type
    const grouped = {};
    tags.forEach(t => {
      if (!grouped[t.tag_type]) {
        grouped[t.tag_type] = [];
      }
      grouped[t.tag_type].push({
        tag: t.tag,
        component_count: t.component_count
      });
    });

    return {
      success: true,
      tags: grouped,
      total_tags: tags.length,
      metadata: { execution_time_ms: Date.now() - startTime }
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to get tags: ${error.message}`,
      metadata: { execution_time_ms: Date.now() - startTime }
    };
  }
}

/**
 * Find similar components based on shared tags
 * @param {Database} db - SQLite database instance
 * @param {string} componentName - Component to find similar to
 * @param {Object} options - Options
 * @param {number} options.min_shared_tags - Minimum shared tags (default: 2)
 * @param {number} options.limit - Max results (default: 10)
 * @returns {Object} Similar components with similarity scores
 */
export function findSimilarComponents(db, componentName, options = {}) {
  const startTime = Date.now();

  try {
    const { min_shared_tags = 2, limit = 10 } = options;

    // Find the component
    const component = db.prepare(`
      SELECT id, component_name, title
      FROM pages
      WHERE LOWER(component_name) = LOWER(?)
      LIMIT 1
    `).get(componentName);

    if (!component) {
      return {
        success: false,
        error: `Component '${componentName}' not found`,
        metadata: { execution_time_ms: Date.now() - startTime }
      };
    }

    // Get component's tags
    const componentTags = db.prepare(`
      SELECT tag, tag_type
      FROM component_tags
      WHERE page_id = ?
    `).all(component.id);

    if (componentTags.length === 0) {
      return {
        success: true,
        component: component.component_name,
        similar_components: [],
        message: 'No tags found for component',
        metadata: { execution_time_ms: Date.now() - startTime }
      };
    }

    // Find components with shared tags
    const similar = db.prepare(`
      SELECT 
        p.id,
        p.component_name,
        p.title,
        p.url,
        COUNT(DISTINCT ct.tag) as shared_tags,
        GROUP_CONCAT(DISTINCT ct.tag) as shared_tag_list
      FROM pages p
      JOIN component_tags ct ON p.id = ct.page_id
      WHERE ct.tag IN (${componentTags.map(() => '?').join(',')})
        AND p.id != ?
      GROUP BY p.id
      HAVING shared_tags >= ?
      ORDER BY shared_tags DESC
      LIMIT ?
    `).all(
      ...componentTags.map(t => t.tag),
      component.id,
      min_shared_tags,
      limit
    );

    // Calculate similarity scores
    const totalTags = componentTags.length;
    similar.forEach(s => {
      s.similarity_score = (s.shared_tags / totalTags * 100).toFixed(1);
      s.shared_tags_array = s.shared_tag_list ? s.shared_tag_list.split(',') : [];
      delete s.shared_tag_list;
    });

    return {
      success: true,
      component: {
        name: component.component_name,
        title: component.title,
        tags: componentTags.map(t => t.tag),
        tag_count: componentTags.length
      },
      similar_components: similar,
      count: similar.length,
      metadata: { execution_time_ms: Date.now() - startTime }
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to find similar components: ${error.message}`,
      metadata: { execution_time_ms: Date.now() - startTime }
    };
  }
}
