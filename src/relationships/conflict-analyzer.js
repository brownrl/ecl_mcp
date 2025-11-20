/**
 * Component Conflict Analysis
 * Detect and analyze potential conflicts between components
 */

import Database from 'better-sqlite3';

/**
 * Analyze conflicts between components
 * @param {Database} db - SQLite database instance
 * @param {string[]} components - Array of component names to analyze
 * @param {Object} options - Analysis options
 * @param {boolean} options.include_warnings - Include warning-level conflicts
 * @param {boolean} options.include_recommendations - Include recommendations
 * @returns {Object} Conflict analysis results
 */
export function analyzeComponentConflicts(db, components, options = {}) {
  const startTime = Date.now();

  try {
    if (!Array.isArray(components) || components.length < 2) {
      return {
        success: false,
        error: 'at least 2 components required for conflict analysis',
        metadata: { execution_time_ms: Date.now() - startTime }
      };
    }

    const {
      include_warnings = true,
      include_recommendations = true
    } = options;

    // Find all components
    const componentData = db.prepare(`
      SELECT 
        p.id, 
        p.component_name, 
        p.title,
        cm.component_type,
        cm.complexity,
        cm.status,
        cm.variant,
        cm.requires_js,
        cm.framework_specific
      FROM pages p
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE LOWER(p.component_name) IN (${components.map(() => '?').join(',')})
    `).all(...components.map(c => c.toLowerCase()));

    // Deduplicate by component_name (keep first occurrence)
    const seen = new Set();
    const uniqueComponents = componentData.filter(c => {
      const name = c.component_name.toLowerCase();
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });

    // Validate all requested components were found
    const foundNames = uniqueComponents.map(c => c.component_name.toLowerCase());
    const requestedNames = components.map(c => c.toLowerCase());
    const missing = requestedNames.filter(name => !foundNames.includes(name));
    
    if (missing.length > 0) {
      return {
        success: false,
        error: `Component(s) not found: ${missing.join(', ')}`,
        metadata: { execution_time_ms: Date.now() - startTime }
      };
    }

    // Get usage guidance for all components
    const pageIds = uniqueComponents.map(c => c.id);
    const guidance = db.prepare(`
      SELECT page_id, guidance_type, content
      FROM usage_guidance
      WHERE page_id IN (${pageIds.map(() => '?').join(',')})
    `).all(...pageIds);

    // Map guidance to components
    const guidanceMap = {};
    guidance.forEach(g => {
      if (!guidanceMap[g.page_id]) {
        guidanceMap[g.page_id] = [];
      }
      guidanceMap[g.page_id].push(g);
    });

    // Analyze conflicts
    const conflicts = [];
    const warnings = [];
    const recommendations = [];

    // Check explicit conflicts in guidance
    uniqueComponents.forEach((comp1, idx1) => {
      uniqueComponents.forEach((comp2, idx2) => {
        if (idx1 >= idx2) return; // Avoid duplicates

        const comp1Guidance = guidanceMap[comp1.id] || [];
        const comp2Guidance = guidanceMap[comp2.id] || [];

        // Check if comp1 mentions avoiding comp2
        comp1Guidance.forEach(g => {
          const content = g.content.toLowerCase();
          const comp2Name = comp2.component_name.toLowerCase();

          if (content.includes(comp2Name)) {
            if (content.includes("don't use with") || 
                content.includes("incompatible") ||
                content.includes("conflicts with") ||
                content.includes("avoid using with")) {
              conflicts.push({
                severity: 'error',
                component1: comp1.component_name,
                component2: comp2.component_name,
                issue: `${comp1.component_name} is incompatible with ${comp2.component_name}`,
                details: extractRelevantGuidance(content, comp2Name),
                recommendation: `Remove one of these components or use an alternative`
              });
            } else if (include_warnings && 
                      (content.includes('caution') || 
                       content.includes('careful') ||
                       content.includes('warning'))) {
              warnings.push({
                severity: 'warning',
                component1: comp1.component_name,
                component2: comp2.component_name,
                issue: `Potential issue when combining these components`,
                details: extractRelevantGuidance(content, comp2Name),
                recommendation: `Review guidance before using together`
              });
            }
          }
        });

        // Check reverse direction
        comp2Guidance.forEach(g => {
          const content = g.content.toLowerCase();
          const comp1Name = comp1.component_name.toLowerCase();

          if (content.includes(comp1Name)) {
            if (content.includes("don't use with") || 
                content.includes("incompatible") ||
                content.includes("conflicts with")) {
              // Check if already added
              const exists = conflicts.some(c => 
                (c.component1 === comp1.component_name && c.component2 === comp2.component_name) ||
                (c.component1 === comp2.component_name && c.component2 === comp1.component_name)
              );

              if (!exists) {
                conflicts.push({
                  severity: 'error',
                  component1: comp2.component_name,
                  component2: comp1.component_name,
                  issue: `${comp2.component_name} is incompatible with ${comp1.component_name}`,
                  details: extractRelevantGuidance(content, comp1Name),
                  recommendation: `Remove one of these components or use an alternative`
                });
              }
            }
          }
        });
      });
    });

    // Check for complexity conflicts
    const complexComponents = uniqueComponents.filter(c => c.complexity === 'complex');
    if (complexComponents.length > 3) {
      warnings.push({
        severity: 'warning',
        issue: `High complexity combination`,
        details: `Using ${complexComponents.length} complex components together may impact performance`,
        components: complexComponents.map(c => c.component_name),
        recommendation: 'Consider simplifying the design or lazy-loading some components'
      });
    }

    // Check for JavaScript conflicts
    const jsComponents = uniqueComponents.filter(c => c.requires_js);
    if (jsComponents.length > 5) {
      warnings.push({
        severity: 'warning',
        issue: 'Multiple JavaScript dependencies',
        details: `${jsComponents.length} components require JavaScript initialization`,
        components: jsComponents.map(c => c.component_name),
        recommendation: 'Ensure proper initialization order with ECL.autoInit() or initialize individually'
      });
    }

    // Generate recommendations if requested
    if (include_recommendations) {
      // Check for better alternatives
      uniqueComponents.forEach(comp => {
        const compGuidance = guidanceMap[comp.id] || [];
        compGuidance.forEach(g => {
          const content = g.content.toLowerCase();
          
          if (content.includes('instead') || content.includes('alternative')) {
            const alternatives = extractAlternatives(content);
            if (alternatives.length > 0) {
              recommendations.push({
                type: 'alternative',
                component: comp.component_name,
                suggestion: `Consider alternatives to ${comp.component_name}`,
                alternatives: alternatives,
                reason: extractRelevantGuidance(content, 'alternative')
              });
            }
          }
        });
      });

      // Check for commonly paired components
      const allTags = db.prepare(`
        SELECT page_id, tag
        FROM component_tags
        WHERE page_id IN (${pageIds.map(() => '?').join(',')})
          AND tag_type = 'feature'
      `).all(...pageIds);

      const tagCounts = {};
      allTags.forEach(t => {
        tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
      });

      // Find shared feature tags
      const sharedTags = Object.entries(tagCounts)
        .filter(([tag, count]) => count >= 2)
        .map(([tag]) => tag);

      if (sharedTags.length > 0) {
        recommendations.push({
          type: 'compatibility',
          suggestion: 'Components share common features',
          shared_features: sharedTags,
          reason: 'These components are designed to work together'
        });
      }
    }

    // Calculate overall risk score
    const riskScore = calculateRiskScore(conflicts, warnings);

    return {
      success: true,
      components: components,
      analysis: {
        conflicts: conflicts,
        warnings: include_warnings ? warnings : undefined,
        recommendations: include_recommendations ? recommendations : undefined,
        risk_score: riskScore,
        risk_level: getRiskLevel(riskScore)
      },
      summary: {
        total_conflicts: conflicts.length,
        total_warnings: warnings.length,
        components_analyzed: components.length,
        safe_to_combine: conflicts.length === 0
      },
      metadata: {
        execution_time_ms: Date.now() - startTime
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Conflict analysis failed: ${error.message}`,
      metadata: { execution_time_ms: Date.now() - startTime }
    };
  }
}

/**
 * Extract relevant guidance around a keyword
 */
function extractRelevantGuidance(content, keyword) {
  const sentences = content.split(/[.!?]+/);
  const relevantSentences = sentences.filter(s => 
    s.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return relevantSentences
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .join('. ') + '.';
}

/**
 * Extract alternative components from guidance
 */
function extractAlternatives(content) {
  const alternatives = [];
  
  // Look for patterns like "use X instead" or "X is an alternative"
  const patterns = [
    /use\s+(?:the\s+)?([a-z-]+)\s+instead/gi,
    /([a-z-]+)\s+is\s+an\s+alternative/gi,
    /alternative\s+is\s+(?:the\s+)?([a-z-]+)/gi,
    /consider\s+using\s+(?:the\s+)?([a-z-]+)/gi
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const alt = match[1].trim();
      if (alt && !alternatives.includes(alt)) {
        alternatives.push(alt);
      }
    }
  });

  return alternatives;
}

/**
 * Calculate risk score (0-100)
 */
function calculateRiskScore(conflicts, warnings) {
  let score = 0;
  
  // Each conflict adds significant risk
  score += conflicts.length * 30;
  
  // Each warning adds moderate risk
  score += warnings.length * 10;
  
  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Get risk level from score
 */
function getRiskLevel(score) {
  if (score === 0) return 'none';
  if (score < 20) return 'low';
  if (score < 50) return 'moderate';
  if (score < 80) return 'high';
  return 'critical';
}

/**
 * Suggest component alternatives
 * @param {Database} db - SQLite database instance
 * @param {string} componentName - Component to find alternatives for
 * @param {Object} options - Options
 * @returns {Object} Alternative suggestions
 */
export function suggestAlternatives(db, componentName, options = {}) {
  const startTime = Date.now();

  try {
    // Find component
    const component = db.prepare(`
      SELECT 
        p.id, 
        p.component_name, 
        p.title,
        cm.complexity,
        cm.status,
        cm.requires_js
      FROM pages p
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE LOWER(p.component_name) = LOWER(?)
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
    const tags = db.prepare(`
      SELECT tag, tag_type
      FROM component_tags
      WHERE page_id = ?
    `).all(component.id);

    // Find components with similar tags
    const featureTags = tags.filter(t => t.tag_type === 'feature').map(t => t.tag);
    
    if (featureTags.length === 0) {
      return {
        success: true,
        component: {
          name: componentName
        },
        alternatives: [],
        message: 'No feature tags found to compare',
        metadata: { execution_time_ms: Date.now() - startTime }
      };
    }

    const alternatives = db.prepare(`
      SELECT DISTINCT
        p.id,
        p.component_name,
        p.title,
        p.url,
        cm.complexity,
        COUNT(DISTINCT ct.tag) as shared_features
      FROM pages p
      JOIN component_tags ct ON p.id = ct.page_id
      LEFT JOIN component_metadata cm ON p.id = cm.page_id
      WHERE ct.tag IN (${featureTags.map(() => '?').join(',')})
        AND p.id != ?
      GROUP BY p.id
      HAVING shared_features >= ?
      ORDER BY shared_features DESC
      LIMIT 5
    `).all(...featureTags, component.id, Math.min(2, featureTags.length));

    // Get shared tags for each alternative
    alternatives.forEach(alt => {
      const altTags = db.prepare(`
        SELECT tag
        FROM component_tags
        WHERE page_id = ? AND tag IN (${featureTags.map(() => '?').join(',')})
      `).all(alt.id, ...featureTags);
      
      alt.shared_tags = altTags.map(t => t.tag);
      alt.similarity_score = ((alt.shared_features / featureTags.length) * 100).toFixed(1);
    });

    return {
      success: true,
      component: {
        name: componentName,
        feature_tags: featureTags
      },
      alternatives: alternatives,
      metadata: { execution_time_ms: Date.now() - startTime }
    };

  } catch (error) {
    return {
      success: false,
      error: `Alternative suggestion failed: ${error.message}`,
      metadata: { execution_time_ms: Date.now() - startTime }
    };
  }
}
