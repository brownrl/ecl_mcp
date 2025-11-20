/**
 * ECL Code Analyzer - General code quality and best practices checker
 * Detects ECL components, design tokens, and provides maintainability insights
 */

import * as cheerio from 'cheerio';

/**
 * Analyze ECL code for components, tokens, best practices, and quality
 * @param {object} db - Database connection
 * @param {string} htmlCode - HTML code to analyze
 * @param {string} jsCode - JavaScript code to analyze (optional)
 * @param {string} cssCode - CSS code to analyze (optional)
 * @returns {object} Analysis results with detected components, tokens, and recommendations
 */
export async function analyzeEclCode(db, htmlCode = '', jsCode = '', cssCode = '') {
  const startTime = Date.now();
  const analysis = {
    components_detected: [],
    design_tokens_used: [],
    best_practices: {
      score: 100,
      passed: [],
      failed: []
    },
    performance_notes: [],
    maintainability: {
      score: 100,
      issues: []
    },
    recommendations: []
  };

  try {
    // Detect ECL components in HTML
    if (htmlCode) {
      const $ = cheerio.load(htmlCode);
      const detectedComponents = detectComponents($, db);
      analysis.components_detected = detectedComponents;

      // Check for hardcoded values that should use design tokens
      checkForHardcodedValues($, analysis);

      // Check for inline styles
      checkInlineStyles($, analysis);

      // Check for proper ECL initialization
      checkEclInitialization($, analysis);

      // Check component composition patterns
      checkCompositionPatterns($, detectedComponents, analysis);
    }

    // Analyze JavaScript code
    if (jsCode) {
      analyzeJavaScript(jsCode, analysis);
    }

    // Analyze CSS code
    if (cssCode) {
      analyzeCss(cssCode, analysis);
    }

    // Detect design tokens in all code
    detectDesignTokens(htmlCode, jsCode, cssCode, analysis);

    // Calculate overall quality score
    const qualityScore = calculateQualityScore(analysis);

    // Generate contextual recommendations
    generateRecommendations(db, analysis);

    return {
      success: true,
      data: {
        components_detected: analysis.components_detected,
        design_tokens_used: analysis.design_tokens_used,
        best_practices: analysis.best_practices,
        performance_notes: analysis.performance_notes,
        maintainability: analysis.maintainability,
        overall_quality_score: qualityScore,
        recommendations: analysis.recommendations
      },
      metadata: {
        tool: 'ecl_analyze_ecl_code',
        execution_time_ms: Date.now() - startTime,
        code_analyzed: {
          html_length: htmlCode.length,
          js_length: jsCode.length,
          css_length: cssCode.length,
          total_components: analysis.components_detected.length,
          total_tokens: analysis.design_tokens_used.length
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      metadata: {
        tool: 'ecl_analyze_ecl_code',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Check for conflicts between ECL components
 * @param {object} db - Database connection
 * @param {array} components - Array of component names to check
 * @param {string} context - Usage context (optional)
 * @returns {object} Conflict check results
 */
export async function checkConflicts(db, components = [], context = '') {
  const startTime = Date.now();
  const conflicts = [];
  const warnings = [];

  try {
    // Known conflict patterns
    const conflictRules = [
      {
        components: ['modal', 'message'],
        severity: 'warning',
        message: 'Using modals and messages together may cause z-index conflicts',
        fix: 'Ensure modal z-index (1050) is higher than message z-index (1000)'
      },
      {
        components: ['accordion', 'tabs'],
        severity: 'warning',
        message: 'Nesting accordions inside tabs can cause accessibility issues',
        fix: 'Keep interactive components at the same nesting level'
      },
      {
        components: ['file-upload', 'file-upload'],
        severity: 'warning',
        message: 'Multiple file upload components may confuse users',
        fix: 'Consider using a single file upload with multiple file support'
      },
      {
        components: ['search-form', 'site-header'],
        severity: 'info',
        message: 'Search form is often integrated into site header',
        fix: 'Use the search form variation designed for headers'
      }
    ];

    // Check each rule
    for (const rule of conflictRules) {
      const hasAllComponents = rule.components.every(comp => 
        components.some(c => c.toLowerCase() === comp.toLowerCase())
      );

      if (hasAllComponents) {
        const conflict = {
          components: rule.components,
          severity: rule.severity,
          message: rule.message,
          fix: rule.fix
        };

        if (rule.severity === 'error') {
          conflicts.push(conflict);
        } else {
          warnings.push(conflict);
        }
      }
    }

    // Check database for component-specific conflicts
    const dbConflicts = checkDatabaseConflicts(db, components);
    conflicts.push(...dbConflicts.conflicts);
    warnings.push(...dbConflicts.warnings);

    return {
      success: true,
      data: {
        has_conflicts: conflicts.length > 0,
        conflicts: conflicts,
        warnings: warnings,
        components_checked: components,
        context: context
      },
      metadata: {
        tool: 'ecl_check_conflicts',
        execution_time_ms: Date.now() - startTime,
        total_conflicts: conflicts.length,
        total_warnings: warnings.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      metadata: {
        tool: 'ecl_check_conflicts',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

// Helper functions

function detectComponents($, db) {
  const components = [];
  const seen = new Set();

  // ECL component class patterns
  const componentPatterns = [
    /ecl-(?:button|link|tag|label)/,
    /ecl-(?:accordion|tabs|pagination|breadcrumb)/,
    /ecl-(?:card|banner|message|notification)/,
    /ecl-(?:form-group|text-input|select|checkbox|radio|file-upload)/,
    /ecl-(?:modal|dialog|popover|tooltip)/,
    /ecl-(?:site-header|page-header|footer)/,
    /ecl-(?:table|list|description-list)/,
    /ecl-(?:search-form|language-list|social-media-follow)/,
    /ecl-(?:timeline|inpage-navigation|skip-link)/
  ];

  $('[class*="ecl-"]').each((i, elem) => {
    const classes = $(elem).attr('class') || '';
    const classArray = classes.split(/\s+/);

    for (const cls of classArray) {
      for (const pattern of componentPatterns) {
        if (pattern.test(cls) && !seen.has(cls)) {
          const componentName = cls.replace(/^ecl-/, '').split(/__|--/)[0];
          if (!seen.has(componentName)) {
            components.push({
              name: componentName,
              class: cls,
              count: $(`.${cls}`).length,
              has_init: $(elem).attr('data-ecl-auto-init') !== undefined
            });
            seen.add(componentName);
          }
        }
      }
    }
  });

  return components;
}

function checkForHardcodedValues($, analysis) {
  // Check for hardcoded colors
  const colorPattern = /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/;
  
  $('[style]').each((i, elem) => {
    const style = $(elem).attr('style');
    if (colorPattern.test(style)) {
      analysis.maintainability.score -= 12;
      analysis.maintainability.issues.push({
        type: 'hardcoded_color',
        message: 'Hardcoded color values found in inline styles',
        fix: 'Use ECL design tokens for colors (e.g., --ecl-color-primary)',
        element: $(elem).prop('tagName').toLowerCase()
      });
    }
  });

  // Check for hardcoded spacing values
  const spacingPattern = /(?:margin|padding):\s*\d+px/;
  
  $('[style]').each((i, elem) => {
    const style = $(elem).attr('style');
    if (spacingPattern.test(style)) {
      analysis.maintainability.score -= 10;
      analysis.maintainability.issues.push({
        type: 'hardcoded_spacing',
        message: 'Hardcoded spacing values found in inline styles',
        fix: 'Use ECL spacing utilities (e.g., ecl-u-mt-m, ecl-u-p-l)',
        element: $(elem).prop('tagName').toLowerCase()
      });
    }
  });
}

function checkInlineStyles($, analysis) {
  const inlineStyleCount = $('[style]').length;
  
  if (inlineStyleCount > 0) {
    analysis.best_practices.score -= Math.min(inlineStyleCount * 15, 40);
    analysis.best_practices.failed.push({
      check: 'no_inline_styles',
      message: `Found ${inlineStyleCount} elements with inline styles`,
      recommendation: 'Use ECL utility classes instead of inline styles'
    });
  } else {
    analysis.best_practices.passed.push('no_inline_styles');
  }
}

function checkEclInitialization($, analysis) {
  const interactiveComponents = $(
    '[class*="ecl-accordion"], [class*="ecl-modal"], [class*="ecl-tabs"], ' +
    '[class*="ecl-file-upload"], [class*="ecl-select"], [class*="ecl-datepicker"]'
  );

  let uninitializedCount = 0;

  interactiveComponents.each((i, elem) => {
    const hasAutoInit = $(elem).attr('data-ecl-auto-init');
    const hasId = $(elem).attr('id');
    
    if (!hasAutoInit && !hasId) {
      uninitializedCount++;
    }
  });

  if (uninitializedCount > 0) {
    analysis.best_practices.score -= uninitializedCount * 10;
    analysis.best_practices.failed.push({
      check: 'component_initialization',
      message: `${uninitializedCount} interactive components missing initialization`,
      recommendation: 'Add data-ecl-auto-init attribute or provide ID for manual init'
    });
  } else if (interactiveComponents.length > 0) {
    analysis.best_practices.passed.push('component_initialization');
  }
}

function checkCompositionPatterns($, detectedComponents, analysis) {
  // Check for improper nesting
  const nestedInteractive = $('[class*="ecl-button"], [class*="ecl-link"]').filter((i, elem) => {
    return $(elem).parents('[class*="ecl-button"], [class*="ecl-link"]').length > 0;
  });

  if (nestedInteractive.length > 0) {
    analysis.best_practices.score -= 15;
    analysis.best_practices.failed.push({
      check: 'no_nested_interactive',
      message: 'Found nested interactive elements (buttons/links inside buttons/links)',
      recommendation: 'Keep interactive elements at the same level for accessibility'
    });
  } else {
    analysis.best_practices.passed.push('no_nested_interactive');
  }

  // Check for missing container elements
  const tables = $('table');
  tables.each((i, elem) => {
    const hasContainer = $(elem).parent().hasClass('ecl-table-responsive');
    if (!hasContainer) {
      analysis.performance_notes.push({
        type: 'missing_responsive_wrapper',
        message: 'Table found without responsive container',
        recommendation: 'Wrap tables in ecl-table-responsive for mobile support'
      });
    }
  });
}

function analyzeJavaScript(jsCode, analysis) {
  // Check for ECL initialization patterns
  const autoInitPattern = /ECL\.autoInit\(\)/;
  const hasAutoInit = autoInitPattern.test(jsCode);

  if (hasAutoInit) {
    analysis.best_practices.passed.push('uses_auto_init');
  }

  // Check for manual component initialization
  const manualInitPattern = /ECL\.\w+\.init\(/;
  const hasManualInit = manualInitPattern.test(jsCode);

  if (hasManualInit) {
    analysis.performance_notes.push({
      type: 'manual_initialization',
      message: 'Manual component initialization detected',
      recommendation: 'Consider using ECL.autoInit() for automatic initialization'
    });
  }

  // Check for direct DOM manipulation
  const domManipulation = /\.innerHTML\s*=|\.appendChild\(|\.removeChild\(/;
  if (domManipulation.test(jsCode)) {
    analysis.maintainability.score -= 15;
    analysis.maintainability.issues.push({
      type: 'direct_dom_manipulation',
      message: 'Direct DOM manipulation detected',
      fix: 'Use ECL component APIs when available'
    });
  }

  // Check for event delegation
  const eventDelegation = /\.addEventListener\(['"](click|change|input)['"]/;
  const directEvents = /\.onclick\s*=|\.onchange\s*=/;
  
  if (directEvents.test(jsCode) && !eventDelegation.test(jsCode)) {
    analysis.best_practices.score -= 15;
    analysis.best_practices.failed.push({
      check: 'event_delegation',
      message: 'Direct event handlers detected instead of event delegation',
      recommendation: 'Use addEventListener for better performance and maintainability'
    });
  }
}

function analyzeCss(cssCode, analysis) {
  // Check for !important usage
  const importantCount = (cssCode.match(/!important/g) || []).length;
  
  if (importantCount > 3) {
    analysis.maintainability.score -= Math.min(importantCount * 5, 30);
    analysis.maintainability.issues.push({
      type: 'excessive_important',
      message: `Found ${importantCount} uses of !important`,
      fix: 'Reduce !important usage by improving specificity'
    });
  }

  // Check for custom properties (design tokens)
  const customProps = cssCode.match(/--ecl-[a-z-]+/g) || [];
  if (customProps.length > 0) {
    analysis.best_practices.passed.push('uses_design_tokens');
  }

  // Check for vendor prefixes
  const vendorPrefixes = cssCode.match(/-webkit-|-moz-|-ms-|-o-/g) || [];
  if (vendorPrefixes.length > 5) {
    analysis.performance_notes.push({
      type: 'vendor_prefixes',
      message: 'Multiple vendor prefixes detected',
      recommendation: 'Use autoprefixer to manage vendor prefixes automatically'
    });
  }
}

function detectDesignTokens(htmlCode, jsCode, cssCode, analysis) {
  const allCode = htmlCode + jsCode + cssCode;
  const tokenPatterns = [
    /--ecl-color-[a-z-]+/g,
    /--ecl-spacing-[a-z-]+/g,
    /--ecl-font-[a-z-]+/g,
    /--ecl-breakpoint-[a-z-]+/g,
    /ecl-u-[a-z-]+/g
  ];

  const tokens = new Set();

  for (const pattern of tokenPatterns) {
    const matches = allCode.match(pattern) || [];
    matches.forEach(token => tokens.add(token));
  }

  analysis.design_tokens_used = Array.from(tokens).map(token => ({
    token: token,
    category: token.includes('color') ? 'color' :
              token.includes('spacing') ? 'spacing' :
              token.includes('font') ? 'typography' :
              token.includes('breakpoint') ? 'layout' :
              'utility'
  }));
}

function calculateQualityScore(analysis) {
  const weights = {
    best_practices: 0.4,
    maintainability: 0.4,
    performance: 0.2
  };

  const performanceScore = Math.max(100 - (analysis.performance_notes.length * 10), 0);

  return Math.round(
    (analysis.best_practices.score * weights.best_practices) +
    (analysis.maintainability.score * weights.maintainability) +
    (performanceScore * weights.performance)
  );
}

function generateRecommendations(db, analysis) {
  // Prioritize recommendations based on impact
  const highImpact = analysis.maintainability.issues
    .filter(issue => issue.type === 'hardcoded_color' || issue.type === 'hardcoded_spacing')
    .map(issue => ({
      priority: 'high',
      message: issue.message,
      fix: issue.fix
    }));

  const mediumImpact = analysis.best_practices.failed
    .map(fail => ({
      priority: 'medium',
      message: fail.message,
      recommendation: fail.recommendation
    }));

  const lowImpact = analysis.performance_notes
    .map(note => ({
      priority: 'low',
      message: note.message,
      recommendation: note.recommendation
    }));

  analysis.recommendations = [
    ...highImpact,
    ...mediumImpact.slice(0, 3),
    ...lowImpact.slice(0, 2)
  ];
}

function checkDatabaseConflicts(db, components) {
  const conflicts = [];
  const warnings = [];

  try {
    // Query database for component relationships
    const stmt = db.prepare(`
      SELECT DISTINCT r.relationship_type, r.notes
      FROM component_relationships r
      JOIN component_metadata c1 ON r.component_id = c1.id
      JOIN component_metadata c2 ON r.related_component_id = c2.id
      WHERE c1.component_name IN (${components.map(() => '?').join(',')})
        AND c2.component_name IN (${components.map(() => '?').join(',')})
        AND r.relationship_type IN ('conflicts_with', 'incompatible_with')
    `);

    const results = stmt.all(...components, ...components);

    results.forEach(row => {
      if (row.relationship_type === 'conflicts_with') {
        conflicts.push({
          components: components,
          severity: 'error',
          message: row.notes || 'Components have known conflicts',
          fix: 'Review component documentation for alternative approaches'
        });
      } else if (row.relationship_type === 'incompatible_with') {
        warnings.push({
          components: components,
          severity: 'warning',
          message: row.notes || 'Components may have compatibility issues',
          fix: 'Test thoroughly or use alternative components'
        });
      }
    });
  } catch (error) {
    // Database query failed, return empty results
  }

  return { conflicts, warnings };
}
