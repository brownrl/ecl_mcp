/**
 * Relationship Search - Find component relationships and dependencies
 */

import Database from 'better-sqlite3';

/**
 * Find related components
 * @param {string|number} componentIdentifier - Component ID or name
 * @param {string} relationshipType - Filter by type (optional)
 */
export function findRelatedComponents(db, componentIdentifier, relationshipType = null) {
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
          metadata: { tool: 'find_related_components', execution_time_ms: Date.now() - startTime }
        };
      }
      pageId = page.id;
    }

    // Get component info
    const component = db.prepare(`
      SELECT p.title, cm.component_name
      FROM pages p
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE p.id = ?
    `).get(pageId);

    // Get relationships (outgoing)
    let sql = `
      SELECT 
        cr.relationship_type,
        cr.description,
        p.id as related_id,
        p.title as related_title,
        p.url as related_url,
        cm.component_name as related_name,
        cm.component_type,
        cm.complexity
      FROM component_relationships cr
      JOIN pages p ON cr.target_page_id = p.id
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE cr.source_page_id = ?
    `;

    const params = [pageId];

    if (relationshipType) {
      sql += ` AND cr.relationship_type = ?`;
      params.push(relationshipType);
    }

    sql += ` ORDER BY 
      CASE cr.relationship_type
        WHEN 'requires' THEN 1
        WHEN 'suggests' THEN 2
        WHEN 'contains' THEN 3
        WHEN 'alternative' THEN 4
        WHEN 'conflicts' THEN 5
        ELSE 6
      END,
      p.title
    `;

    const outgoing = db.prepare(sql).all(...params);

    // Get incoming relationships
    const incoming = db.prepare(`
      SELECT 
        cr.relationship_type,
        p.id as related_id,
        p.title as related_title,
        cm.component_name as related_name
      FROM component_relationships cr
      JOIN pages p ON cr.source_page_id = p.id
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE cr.target_page_id = ?
      ${relationshipType ? 'AND cr.relationship_type = ?' : ''}
    `).all(...(relationshipType ? [pageId, relationshipType] : [pageId]));

    // Group outgoing by type
    const grouped = outgoing.reduce((acc, rel) => {
      const type = rel.relationship_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push({
        id: rel.related_id,
        name: rel.related_name || rel.related_title,
        url: rel.related_url,
        type: rel.component_type,
        complexity: rel.complexity,
        description: rel.description
      });
      return acc;
    }, {});

    // Group incoming by type
    const incomingGrouped = incoming.reduce((acc, rel) => {
      const type = rel.relationship_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push({
        id: rel.related_id,
        name: rel.related_name || rel.related_title
      });
      return acc;
    }, {});

    return {
      success: true,
      data: {
        component: component.component_name || component.title,
        relationships: {
          outgoing: grouped,
          incoming: incomingGrouped
        },
        total_outgoing: outgoing.length,
        total_incoming: incoming.length
      },
      metadata: {
        tool: 'find_related_components',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        version: '2.0'
      },
      suggestions: outgoing.length === 0 && incoming.length === 0 ? [
        'No explicit relationships found for this component.',
        'Try searching for components with similar tags or use cases.'
      ] : []
    };

  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [{
        code: 'RELATIONSHIP_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'find_related_components',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Get component dependency graph
 * @param {string|number} componentIdentifier - Component ID or name
 * @param {number} depth - How many levels deep (default 2)
 */
export function getDependencyGraph(db, componentIdentifier, depth = 2) {
  const startTime = Date.now();

  try {
    // Find component
    let startPageId;
    if (typeof componentIdentifier === 'number' || /^\d+$/.test(componentIdentifier)) {
      startPageId = parseInt(componentIdentifier);
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
          metadata: { tool: 'get_dependency_graph', execution_time_ms: Date.now() - startTime }
        };
      }
      startPageId = page.id;
    }

    // Build graph recursively
    const visited = new Set();
    const graph = { nodes: [], edges: [] };

    function traverse(pageId, currentDepth) {
      if (currentDepth > depth || visited.has(pageId)) return;
      visited.add(pageId);

      // Get node info
      const node = db.prepare(`
        SELECT p.id, p.title, cm.component_name, cm.component_type
        FROM pages p
        LEFT JOIN component_metadata cm ON p.id = cm.page_id
        WHERE p.id = ?
      `).get(pageId);

      if (!node) return;

      graph.nodes.push({
        id: node.id,
        name: node.component_name || node.title,
        type: node.component_type,
        depth: currentDepth
      });

      // Get relationships (only 'requires' and 'contains' for dependencies)
      const rels = db.prepare(`
        SELECT target_page_id, relationship_type
        FROM component_relationships
        WHERE source_page_id = ?
        AND relationship_type IN ('requires', 'contains')
      `).all(pageId);

      rels.forEach(rel => {
        graph.edges.push({
          from: pageId,
          to: rel.target_page_id,
          type: rel.relationship_type
        });

        // Recurse
        traverse(rel.target_page_id, currentDepth + 1);
      });
    }

    traverse(startPageId, 0);

    return {
      success: true,
      data: {
        root_component: graph.nodes[0]?.name,
        graph: {
          nodes: graph.nodes,
          edges: graph.edges
        },
        total_nodes: graph.nodes.length,
        total_edges: graph.edges.length,
        max_depth: depth
      },
      metadata: {
        tool: 'get_dependency_graph',
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
        code: 'DEPENDENCY_GRAPH_ERROR',
        message: error.message
      }],
      metadata: {
        tool: 'get_dependency_graph',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}
