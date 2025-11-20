/**
 * Component Relationship Graph Builder
 * Create visualizable graph data structures
 */

import Database from 'better-sqlite3';

/**
 * Build component relationship graph
 * @param {Database} db - SQLite database instance
 * @param {Object} options - Graph options
 * @param {string[]} options.components - Specific components to include (null = all)
 * @param {string[]} options.relationship_types - Types to include (requires, suggests, etc.)
 * @param {number} options.max_depth - Maximum relationship depth (default: 2)
 * @param {string} options.format - Output format: 'cytoscape', 'd3', 'mermaid' (default: 'cytoscape')
 * @returns {Object} Graph data structure
 */
export function buildRelationshipGraph(db, options = {}) {
  const startTime = Date.now();

  try {
    const {
      components = null,
      relationship_types = ['requires', 'suggests', 'contains', 'alternative'],
      max_depth = 2,
      format = 'cytoscape'
    } = options;

    // Get components to include
    let componentList;
    if (components && components.length > 0) {
      componentList = db.prepare(`
        SELECT id, component_name, title
        FROM pages
        WHERE LOWER(component_name) IN (${components.map(() => '?').join(',')})
      `).all(...components.map(c => c.toLowerCase()));
    } else {
      // Get all components (limit for performance)
      componentList = db.prepare(`
        SELECT id, component_name, title
        FROM pages
        WHERE component_name IS NOT NULL
        LIMIT 100
      `).all();
    }

    if (componentList.length === 0) {
      return {
        success: false,
        error: 'No components found',
        metadata: { execution_time_ms: Date.now() - startTime }
      };
    }

    // Build node list
    const nodes = componentList.map(c => ({
      id: c.id,
      label: c.component_name,
      title: c.title
    }));

    // Get component metadata
    const nodeIds = nodes.map(n => n.id);
    const metadata = db.prepare(`
      SELECT page_id, component_type, complexity, requires_js
      FROM component_metadata
      WHERE page_id IN (${nodeIds.map(() => '?').join(',')})
    `).all(...nodeIds);

    // Attach metadata to nodes
    const metadataMap = {};
    metadata.forEach(m => {
      metadataMap[m.page_id] = m;
    });

    nodes.forEach(n => {
      const meta = metadataMap[n.id];
      if (meta) {
        n.data = {
          type: meta.component_type,
          complexity: meta.complexity,
          requires_js: meta.requires_js
        };
      }
    });

    // Get tags for categorization
    const tags = db.prepare(`
      SELECT page_id, tag, tag_type
      FROM component_tags
      WHERE page_id IN (${nodeIds.map(() => '?').join(',')})
    `).all(...nodeIds);

    const tagMap = {};
    tags.forEach(t => {
      if (!tagMap[t.page_id]) tagMap[t.page_id] = [];
      tagMap[t.page_id].push({ tag: t.tag, type: t.tag_type });
    });

    nodes.forEach(n => {
      if (tagMap[n.id]) {
        n.tags = tagMap[n.id];
        // Assign category for visualization
        const categoryTag = tagMap[n.id].find(t => t.type === 'category');
        if (categoryTag) {
          n.category = categoryTag.tag;
        }
      }
    });

    // Build edges (using implicit relationships from guidance and examples)
    const edges = buildImplicitRelationships(db, nodeIds, relationship_types);

    // Format based on requested output
    let graphData;
    switch (format) {
      case 'd3':
        graphData = formatForD3(nodes, edges);
        break;
      case 'mermaid':
        graphData = formatForMermaid(nodes, edges);
        break;
      case 'cytoscape':
      default:
        graphData = formatForCytoscape(nodes, edges);
        break;
    }

    return {
      success: true,
      graph: graphData,
      statistics: {
        nodes: nodes.length,
        edges: edges.length,
        components_analyzed: componentList.length,
        relationship_types: relationship_types
      },
      metadata: {
        execution_time_ms: Date.now() - startTime,
        format: format,
        max_depth: max_depth
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Graph building failed: ${error.message}`,
      metadata: { execution_time_ms: Date.now() - startTime }
    };
  }
}

/**
 * Build implicit relationships from content analysis
 */
function buildImplicitRelationships(db, nodeIds, relationshipTypes) {
  const edges = [];

  // Analyze usage guidance for relationships
  const guidance = db.prepare(`
    SELECT page_id, guidance_type, content
    FROM usage_guidance
    WHERE page_id IN (${nodeIds.map(() => '?').join(',')})
  `).all(...nodeIds);

  // Get component names for matching
  const components = db.prepare(`
    SELECT id, component_name
    FROM pages
    WHERE id IN (${nodeIds.map(() => '?').join(',')})
  `).all(...nodeIds);

  const componentMap = {};
  components.forEach(c => {
    componentMap[c.id] = c.component_name;
  });

  // Build reverse lookup
  const nameToId = {};
  components.forEach(c => {
    nameToId[c.component_name.toLowerCase()] = c.id;
  });

  // Analyze guidance for relationships
  guidance.forEach(g => {
    const content = g.content.toLowerCase();
    const sourceId = g.page_id;

    // Look for mentions of other components
    components.forEach(targetComp => {
      if (targetComp.id === sourceId) return;

      const targetName = targetComp.component_name.toLowerCase();
      if (content.includes(targetName)) {
        // Determine relationship type
        let relType = 'related';
        
        if (relationshipTypes.includes('requires') && 
            (content.includes('requires') || content.includes('must use'))) {
          relType = 'requires';
        } else if (relationshipTypes.includes('suggests') && 
                   (content.includes('recommended') || content.includes('suggested'))) {
          relType = 'suggests';
        } else if (relationshipTypes.includes('contains') && 
                   (content.includes('contains') || content.includes('includes'))) {
          relType = 'contains';
        } else if (relationshipTypes.includes('alternative') && 
                   (content.includes('alternative') || content.includes('instead of'))) {
          relType = 'alternative';
        }

        edges.push({
          source: sourceId,
          target: targetComp.id,
          type: relType,
          weight: calculateEdgeWeight(content, targetName)
        });
      }
    });
  });

  // Analyze code examples for component usage
  const examples = db.prepare(`
    SELECT page_id, code
    FROM code_examples
    WHERE page_id IN (${nodeIds.map(() => '?').join(',')})
      AND language = 'html'
  `).all(...nodeIds);

  examples.forEach(ex => {
    const sourceId = ex.page_id;
    const code = ex.code.toLowerCase();

    // Look for ECL class references
    components.forEach(targetComp => {
      if (targetComp.id === sourceId) return;

      const className = `ecl-${targetComp.component_name.toLowerCase()}`;
      if (code.includes(className)) {
        // Check if already exists
        const exists = edges.find(e => 
          e.source === sourceId && e.target === targetComp.id
        );

        if (!exists) {
          edges.push({
            source: sourceId,
            target: targetComp.id,
            type: 'uses',
            weight: 0.5
          });
        }
      }
    });
  });

  return edges;
}

/**
 * Calculate edge weight based on context
 */
function calculateEdgeWeight(content, componentName) {
  let weight = 0.3; // Base weight

  // Strong relationship indicators
  if (content.includes('requires ' + componentName)) weight += 0.5;
  if (content.includes('must use ' + componentName)) weight += 0.5;
  if (content.includes('depends on ' + componentName)) weight += 0.4;
  
  // Medium relationship indicators
  if (content.includes('recommended with ' + componentName)) weight += 0.3;
  if (content.includes('works well with ' + componentName)) weight += 0.3;
  
  // Weak relationship indicators
  if (content.includes('can use ' + componentName)) weight += 0.2;
  if (content.includes('optional ' + componentName)) weight += 0.1;

  return Math.min(weight, 1.0); // Cap at 1.0
}

/**
 * Format graph for Cytoscape.js
 */
function formatForCytoscape(nodes, edges) {
  return {
    elements: {
      nodes: nodes.map(n => ({
        data: {
          id: String(n.id),
          label: n.label,
          title: n.title,
          category: n.category || 'uncategorized',
          complexity: n.data?.complexity || 'moderate',
          requires_js: n.data?.requires_js || false,
          tags: n.tags || []
        }
      })),
      edges: edges.map((e, idx) => ({
        data: {
          id: `e${idx}`,
          source: String(e.source),
          target: String(e.target),
          type: e.type,
          weight: e.weight || 0.5
        }
      }))
    },
    style: getCytoscapeStyle()
  };
}

/**
 * Format graph for D3.js force-directed layout
 */
function formatForD3(nodes, edges) {
  return {
    nodes: nodes.map(n => ({
      id: String(n.id),
      name: n.label,
      group: n.category || 'default',
      complexity: n.data?.complexity,
      tags: n.tags
    })),
    links: edges.map(e => ({
      source: String(e.source),
      target: String(e.target),
      value: e.weight || 0.5,
      type: e.type
    }))
  };
}

/**
 * Format graph as Mermaid diagram syntax
 */
function formatForMermaid(nodes, edges) {
  let mermaid = 'graph TD\n';

  // Add nodes
  nodes.forEach(n => {
    const label = n.label.replace(/-/g, '_');
    mermaid += `  ${label}["${n.label}"]\n`;
  });

  mermaid += '\n';

  // Add edges
  const nameToLabel = {};
  nodes.forEach(n => {
    nameToLabel[n.id] = n.label.replace(/-/g, '_');
  });

  edges.forEach(e => {
    const source = nameToLabel[e.source];
    const target = nameToLabel[e.target];
    const arrow = e.type === 'requires' ? '==>' : '-->';
    const label = e.type !== 'related' ? `|${e.type}|` : '';
    
    mermaid += `  ${source} ${arrow}${label} ${target}\n`;
  });

  return {
    syntax: mermaid,
    format: 'mermaid',
    usage: 'Paste this into a Mermaid renderer or GitHub markdown'
  };
}

/**
 * Get Cytoscape.js default styles
 */
function getCytoscapeStyle() {
  return [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'background-color': '#004494',
        'color': '#fff',
        'text-valign': 'center',
        'text-halign': 'center'
      }
    },
    {
      selector: 'node[complexity="simple"]',
      style: { 'background-color': '#4CAF50' }
    },
    {
      selector: 'node[complexity="complex"]',
      style: { 'background-color': '#f44336' }
    },
    {
      selector: 'edge',
      style: {
        'width': 'data(weight)',
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    },
    {
      selector: 'edge[type="requires"]',
      style: {
        'line-color': '#f44336',
        'target-arrow-color': '#f44336',
        'line-style': 'solid'
      }
    },
    {
      selector: 'edge[type="suggests"]',
      style: {
        'line-color': '#2196F3',
        'target-arrow-color': '#2196F3',
        'line-style': 'dashed'
      }
    }
  ];
}
