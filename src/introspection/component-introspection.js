/**
 * Component Introspection Tools
 * 
 * Provides deep component analysis:
 * - List all variants and examples for a component
 * - Find related pages (usage, code, api, playground)
 * - Discover component nesting rules
 * - Aggregate data across all component pages
 */

/**
 * Get all pages related to a component
 * Groups by component name across usage/code/api/playground pages
 */
export function getComponentPages(db, componentName) {
  const startTime = Date.now();
  
  try {
    // Normalize component name
    const normalized = componentName.toLowerCase().replace(/[\s-]/g, '');
    
    // Find all pages for this component
    const pages = db.prepare(`
      SELECT DISTINCT
        p.id,
        p.title,
        p.url,
        p.category,
        cm.component_name,
        cm.component_type,
        cm.complexity,
        cm.status,
        cm.requires_js
      FROM pages p
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE REPLACE(REPLACE(LOWER(cm.component_name), ' ', ''), '-', '') = ?
         OR REPLACE(REPLACE(LOWER(p.title), ' ', ''), '-', '') = ?
      ORDER BY p.url
    `).all(normalized, normalized);
    
    if (pages.length === 0) {
      return {
        success: false,
        data: null,
        errors: [{ code: 'NOT_FOUND', message: `Component "${componentName}" not found` }],
        metadata: {
          tool: 'get_component_pages',
          execution_time_ms: Date.now() - startTime
        }
      };
    }
    
    // Categorize pages by type (usage, code, api, playground)
    const pagesByType = {
      usage: [],
      code: [],
      api: [],
      playground: [],
      other: []
    };
    
    pages.forEach(page => {
      const url = page.url.toLowerCase();
      if (url.includes('/usage')) pagesByType.usage.push(page);
      else if (url.includes('/code')) pagesByType.code.push(page);
      else if (url.includes('/api')) pagesByType.api.push(page);
      else if (url.includes('/playground')) pagesByType.playground.push(page);
      else pagesByType.other.push(page);
    });
    
    // Aggregate counts across all pages
    const pageIds = pages.map(p => p.id);
    const placeholders = pageIds.map(() => '?').join(',');
    
    const totalExamples = db.prepare(`
      SELECT COUNT(*) as count FROM code_examples WHERE page_id IN (${placeholders})
    `).get(...pageIds).count;
    
    const totalGuidance = db.prepare(`
      SELECT COUNT(DISTINCT guidance_type) as count FROM usage_guidance WHERE page_id IN (${placeholders})
    `).get(...pageIds).count;
    
    const totalAPI = db.prepare(`
      SELECT COUNT(*) as count FROM component_api WHERE page_id IN (${placeholders})
    `).get(...pageIds).count;
    
    return {
      success: true,
      data: {
        component_name: pages[0].component_name || pages[0].title,
        page_count: pages.length,
        pages_by_type: pagesByType,
        aggregated_counts: {
          examples: totalExamples,
          guidance_types: totalGuidance,
          api_entries: totalAPI
        },
        primary_page: pages[0]
      },
      metadata: {
        tool: 'get_component_pages',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database'
      }
    };
    
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [{ code: 'QUERY_ERROR', message: error.message }],
      metadata: {
        tool: 'get_component_pages',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Discover component variants from code examples
 * Analyzes example descriptions and code to find variant patterns
 */
export function discoverComponentVariants(db, componentName) {
  const startTime = Date.now();
  
  try {
    // Get all pages for component
    const pagesResult = getComponentPages(db, componentName);
    if (!pagesResult.success) {
      return pagesResult;
    }
    
    const pageIds = Object.values(pagesResult.data.pages_by_type)
      .flat()
      .map(p => p.id);
    
    if (pageIds.length === 0) {
      return {
        success: false,
        data: null,
        errors: [{ code: 'NOT_FOUND', message: 'No pages found for component' }],
        metadata: {
          tool: 'discover_component_variants',
          execution_time_ms: Date.now() - startTime
        }
      };
    }
    
    // Get all examples for this component
    const placeholders = pageIds.map(() => '?').join(',');
    const examples = db.prepare(`
      SELECT 
        id,
        page_id,
        example_type,
        language,
        description,
        SUBSTR(code, 1, 200) as code_snippet
      FROM code_examples
      WHERE page_id IN (${placeholders})
      ORDER BY position
    `).all(...pageIds);
    
    // Analyze descriptions for variant keywords
    const variantKeywords = [
      'primary', 'secondary', 'tertiary', 'ghost', 'cta',
      'small', 'medium', 'large', 'xs', 's', 'm', 'l', 'xl',
      'horizontal', 'vertical', 'inline', 'block',
      'default', 'inverted', 'outlined', 'filled',
      'success', 'error', 'warning', 'info',
      'zebra', 'striped', 'sortable', 'responsive',
      'with icon', 'icon only', 'with label', 'without label'
    ];
    
    const detectedVariants = new Set();
    const variantExamples = {};
    
    examples.forEach(ex => {
      const text = (ex.description || '').toLowerCase();
      const code = (ex.code_snippet || '').toLowerCase();
      
      variantKeywords.forEach(keyword => {
        if (text.includes(keyword) || code.includes(keyword)) {
          detectedVariants.add(keyword);
          if (!variantExamples[keyword]) {
            variantExamples[keyword] = [];
          }
          variantExamples[keyword].push({
            id: ex.id,
            description: ex.description,
            language: ex.language
          });
        }
      });
    });
    
    return {
      success: true,
      data: {
        component_name: pagesResult.data.component_name,
        total_examples: examples.length,
        detected_variants: Array.from(detectedVariants).sort(),
        variant_count: detectedVariants.size,
        variant_examples: variantExamples,
        examples_by_language: examples.reduce((acc, ex) => {
          acc[ex.language] = (acc[ex.language] || 0) + 1;
          return acc;
        }, {})
      },
      metadata: {
        tool: 'discover_component_variants',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        note: 'Variants detected from example descriptions and code analysis'
      }
    };
    
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [{ code: 'QUERY_ERROR', message: error.message }],
      metadata: {
        tool: 'discover_component_variants',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Find component nesting and container requirements
 * Analyzes code examples to detect parent-child relationships
 */
export function analyzeComponentNesting(db, componentName) {
  const startTime = Date.now();
  
  try {
    // Get component pages
    const pagesResult = getComponentPages(db, componentName);
    if (!pagesResult.success) {
      return pagesResult;
    }
    
    const pageIds = Object.values(pagesResult.data.pages_by_type)
      .flat()
      .map(p => p.id);
    
    // Get HTML examples
    const placeholders = pageIds.map(() => '?').join(',');
    const examples = db.prepare(`
      SELECT code, description
      FROM code_examples
      WHERE page_id IN (${placeholders})
        AND language IN ('html', 'jsx', 'twig')
      LIMIT 50
    `).all(...pageIds);
    
    // Analyze code for common patterns
    const patterns = {
      containers: ['ecl-container', 'ecl-row', 'ecl-col'],
      wrappers: ['ecl-form-group', 'ecl-card', 'ecl-modal'],
      nested_components: [],
      required_parents: [],
      common_siblings: []
    };
    
    const detectedContainers = new Set();
    const detectedWrappers = new Set();
    const detectedNested = new Set();
    
    examples.forEach(ex => {
      const code = ex.code || '';
      
      // Find containers
      patterns.containers.forEach(container => {
        if (code.includes(container)) {
          detectedContainers.add(container);
        }
      });
      
      // Find wrappers
      patterns.wrappers.forEach(wrapper => {
        if (code.includes(wrapper)) {
          detectedWrappers.add(wrapper);
        }
      });
      
      // Find nested ECL components
      const eclClassMatches = code.matchAll(/class="[^"]*ecl-([a-z-]+)/g);
      for (const match of eclClassMatches) {
        const component = match[1].split('--')[0]; // Get base component name
        if (component && component !== componentName.toLowerCase()) {
          detectedNested.add(component);
        }
      }
    });
    
    return {
      success: true,
      data: {
        component_name: pagesResult.data.component_name,
        examples_analyzed: examples.length,
        common_containers: Array.from(detectedContainers),
        common_wrappers: Array.from(detectedWrappers),
        nested_components: Array.from(detectedNested).slice(0, 20), // Top 20
        nesting_notes: [
          detectedContainers.size > 0 ? `Often used inside: ${Array.from(detectedContainers).join(', ')}` : 'No container requirements detected',
          detectedWrappers.size > 0 ? `Commonly wrapped in: ${Array.from(detectedWrappers).join(', ')}` : 'No wrapper requirements detected',
          detectedNested.size > 0 ? `Often contains: ${Array.from(detectedNested).slice(0, 5).join(', ')}` : 'Typically used standalone'
        ]
      },
      metadata: {
        tool: 'analyze_component_nesting',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        note: 'Nesting patterns detected from code example analysis'
      }
    };
    
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [{ code: 'QUERY_ERROR', message: error.message }],
      metadata: {
        tool: 'analyze_component_nesting',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}
