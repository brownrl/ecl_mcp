/**
 * ECL Component Usage Validator
 * 
 * Validates HTML/JS code against ECL component requirements,
 * checking for proper structure, attributes, and best practices.
 */

import * as cheerio from 'cheerio';
import { DIAGNOSTIC_PATTERNS, REQUIRED_ATTRIBUTES, WCAG_CRITERIA } from './patterns.js';
import { validateEnhancedStructure } from './structure-validator.js';
import { validateFormStructure } from './form-validator.js';

/**
 * Validate component usage
 * @param {Object} db - Database connection
 * @param {string} component - Component name
 * @param {string} htmlCode - HTML code to validate
 * @param {string} [jsCode] - Optional JavaScript code
 * @param {string} [context] - Additional context
 * @returns {Object} Validation result
 */
export async function validateComponentUsage(db, component, htmlCode, jsCode = '', context = '') {
  const startTime = Date.now();
  const errors = [];
  const warnings = [];
  const suggestions = [];

  try {
    // Get component metadata from database
    const componentData = await getComponentData(db, component);
    if (!componentData) {
      return {
        success: false,
        errors: [{
          code: 'COMPONENT_NOT_FOUND',
          message: `Component "${component}" not found in database`,
          severity: 'error'
        }]
      };
    }

    // Parse HTML
    const $ = cheerio.load(htmlCode);

    // Run enhanced structure validation (NEW)
    validateEnhancedStructure($, component, errors, warnings);
    
    // Run form-specific validation (NEW)
    validateFormStructure($, component, errors, warnings);

    // Run validation checks
    await runStructureValidation($, component, componentData, errors, warnings);
    await runAttributeValidation($, component, errors, warnings);
    await runAccessibilityValidation($, component, errors, warnings);
    await runBestPracticeValidation($, component, htmlCode, errors, warnings, suggestions);

    if (jsCode) {
      await runJavaScriptValidation(jsCode, component, componentData, errors, warnings);
    }

    // Check against common patterns
    runPatternChecks(htmlCode, component, errors, warnings);

    // Get component guidance from database
    const guidance = await getComponentGuidance(db, component);
    if (guidance) {
      addContextualSuggestions(guidance, suggestions);
    }

    // Calculate quality score
    const score = calculateQualityScore(errors, warnings);

    return {
      success: true,
      data: {
        component,
        is_valid: errors.length === 0,
        score,
        errors: errors.map(e => ({
          severity: e.severity || 'error',
          message: e.message,
          line: e.line,
          suggestion: e.suggestion,
          doc_link: e.doc_link,
          wcag_criterion: e.wcag
        })),
        warnings: warnings.map(w => ({
          severity: 'warning',
          message: w.message,
          line: w.line,
          suggestion: w.suggestion
        })),
        suggestions: suggestions.map(s => ({
          type: s.type || 'improvement',
          message: s.message,
          example_code: s.example
        }))
      },
      metadata: {
        tool: 'validate_component_usage',
        execution_time_ms: Date.now() - startTime,
        source: 'ecl-database',
        version: '2.0',
        checks_performed: {
          structure: true,
          attributes: true,
          accessibility: true,
          best_practices: true,
          javascript: !!jsCode
        }
      }
    };

  } catch (error) {
    return {
      success: false,
      errors: [{
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.stack
      }],
      metadata: {
        tool: 'validate_component_usage',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Get component data from database
 * Handles fuzzy matching (singular/plural, case-insensitive)
 */
async function getComponentData(db, componentName) {
  // Try exact match first
  let stmt = db.prepare(`
    SELECT * FROM component_metadata 
    WHERE LOWER(component_name) = LOWER(?)
    LIMIT 1
  `);
  let result = stmt.get(componentName);
  if (result) return result;

  // Try singular/plural variations
  const variations = [
    componentName,
    componentName + 's',
    componentName.replace(/s$/, ''),
    componentName.charAt(0).toUpperCase() + componentName.slice(1),
    componentName.charAt(0).toUpperCase() + componentName.slice(1) + 's',
    componentName.charAt(0).toUpperCase() + componentName.slice(1).replace(/s$/, '')
  ];

  stmt = db.prepare(`
    SELECT * FROM component_metadata 
    WHERE LOWER(component_name) IN (${variations.map(() => 'LOWER(?)').join(',')})
    LIMIT 1
  `);
  result = stmt.get(...variations);
  if (result) return result;

  // Try partial match as last resort
  stmt = db.prepare(`
    SELECT * FROM component_metadata 
    WHERE LOWER(component_name) LIKE LOWER(?)
    LIMIT 1
  `);
  return stmt.get(`%${componentName}%`);
}

/**
 * Get component guidance
 */
async function getComponentGuidance(db, componentName) {
  const component = await getComponentData(db, componentName);
  if (!component) return null;

  const stmt = db.prepare(`
    SELECT guidance_type, content 
    FROM usage_guidance 
    WHERE page_id = ?
    ORDER BY priority
  `);
  return stmt.all(component.page_id);
}

/**
 * Validate HTML structure
 */
async function runStructureValidation($, component, componentData, errors, warnings) {
  // Check for required ECL class
  const eclClass = `ecl-${component.toLowerCase()}`;
  const mainElement = $(`.${eclClass}`);

  if (mainElement.length === 0) {
    errors.push({
      severity: 'error',
      message: `Missing required class "${eclClass}"`,
      suggestion: `Add class="${eclClass}" to the main component element`,
      doc_link: componentData.code_url
    });
  }

  // Check for proper nesting (component-specific rules)
  if (component === 'card') {
    validateCardStructure($, errors, warnings);
  } else if (component === 'button') {
    validateButtonStructure($, errors, warnings);
  } else if (component === 'modal') {
    validateModalStructure($, errors, warnings);
  }
}

/**
 * Validate required and recommended attributes
 */
async function runAttributeValidation($, component, errors, warnings) {
  const requirements = REQUIRED_ATTRIBUTES[component.toLowerCase()];
  if (!requirements) return;

  const mainElement = $(`.ecl-${component.toLowerCase()}`).first();
  if (mainElement.length === 0) return;

  // Check required attributes
  for (const attr of requirements.required) {
    if (!mainElement.attr(attr)) {
      errors.push({
        severity: 'error',
        message: `Missing required attribute: ${attr}`,
        suggestion: `Add ${attr} attribute to the ${component} element`
      });
    }
  }

  // Check recommended attributes
  for (const attr of requirements.recommended) {
    if (!mainElement.attr(attr)) {
      warnings.push({
        severity: 'warning',
        message: `Recommended attribute missing: ${attr}`,
        suggestion: `Consider adding ${attr} for better accessibility`
      });
    }
  }
}

/**
 * Validate accessibility requirements
 */
async function runAccessibilityValidation($, component, errors, warnings) {
  // Check for alt text on images
  $('img').each((i, elem) => {
    const $img = $(elem);
    if (!$img.attr('alt') && $img.attr('alt') !== '') {
      errors.push({
        severity: 'error',
        message: 'Image missing alt attribute',
        suggestion: 'Add alt="description" or alt="" for decorative images',
        wcag: '1.1.1'
      });
    }
  });

  // Check for proper heading hierarchy
  const headings = $('h1, h2, h3, h4, h5, h6').toArray().map(el => parseInt(el.name[1]));
  if (headings.length > 1) {
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] - headings[i - 1] > 1) {
        warnings.push({
          severity: 'warning',
          message: `Heading hierarchy skips from h${headings[i - 1]} to h${headings[i]}`,
          suggestion: 'Maintain sequential heading levels for screen readers',
          wcag: '2.4.6'
        });
      }
    }
  }

  // Check for form labels
  $('input, select, textarea').each((i, elem) => {
    const $input = $(elem);
    const id = $input.attr('id');
    const hasLabel = $input.attr('aria-label') || $input.attr('aria-labelledby');
    const hasVisibleLabel = id && $(`label[for="${id}"]`).length > 0;

    if (!hasLabel && !hasVisibleLabel) {
      errors.push({
        severity: 'error',
        message: 'Form input missing label',
        suggestion: 'Add <label> element or aria-label attribute',
        wcag: '3.3.2'
      });
    }
  });

  // Check for button accessibility
  $('button').each((i, elem) => {
    const $button = $(elem);
    const hasText = $button.text().trim().length > 0;
    const hasLabel = $button.attr('aria-label') || $button.attr('aria-labelledby');

    if (!hasText && !hasLabel) {
      errors.push({
        severity: 'error',
        message: 'Button has no accessible text',
        suggestion: 'Add visible text or aria-label attribute',
        wcag: '4.1.2'
      });
    }
  });
}

/**
 * Validate best practices
 */
async function runBestPracticeValidation($, component, htmlCode, errors, warnings, suggestions) {
  // Check for inline styles
  $('[style]').each((i, elem) => {
    warnings.push({
      severity: 'warning',
      message: 'Inline styles detected',
      suggestion: 'Use ECL utility classes instead of inline styles'
    });
  });

  // Check for proper ECL utility usage
  const utilityPattern = /ecl-u-[a-z-]+/g;
  const utilities = htmlCode.match(utilityPattern) || [];
  if (utilities.length > 0) {
    suggestions.push({
      type: 'improvement',
      message: `Using ${utilities.length} ECL utility classes - good practice`
    });
  }

  // Check for responsive classes
  const responsivePattern = /ecl-col-(xs|sm|md|lg|xl)-\d+/g;
  const responsiveClasses = htmlCode.match(responsivePattern) || [];
  if (responsiveClasses.length > 0) {
    suggestions.push({
      type: 'improvement',
      message: 'Responsive grid classes detected - ensures mobile compatibility'
    });
  }
}

/**
 * Validate JavaScript initialization
 */
async function runJavaScriptValidation(jsCode, component, componentData, errors, warnings) {
  // Check if component requires JavaScript
  if (componentData.has_javascript) {
    // Check for proper ECL initialization
    const autoInitPattern = /data-ecl-auto-init/;
    const manualInitPattern = new RegExp(`new\\s+ECL\\.${component}`, 'i');

    if (!autoInitPattern.test(jsCode) && !manualInitPattern.test(jsCode)) {
      warnings.push({
        severity: 'warning',
        message: `Component ${component} requires JavaScript initialization`,
        suggestion: 'Add data-ecl-auto-init attribute or use ECL.ComponentName in JavaScript'
      });
    }
  }

  // Check for common JavaScript mistakes
  if (jsCode.includes('onclick=')) {
    warnings.push({
      severity: 'warning',
      message: 'Inline onclick handler detected',
      suggestion: 'Use addEventListener for better maintainability'
    });
  }
}

/**
 * Run pattern-based checks
 */
function runPatternChecks(htmlCode, component, errors, warnings) {
  for (const [patternName, pattern] of Object.entries(DIAGNOSTIC_PATTERNS)) {
    // Check if pattern applies to this component
    if (pattern.components && !pattern.components.includes('*') &&
      !pattern.components.includes(component.toLowerCase())) {
      continue;
    }

    // Test the pattern
    if (pattern.pattern.test(htmlCode)) {
      const issue = {
        message: pattern.message,
        suggestion: pattern.fix,
        doc_link: pattern.example,
        wcag: pattern.wcag
      };

      if (pattern.severity === 'error') {
        errors.push({ severity: 'error', ...issue });
      } else {
        warnings.push({ severity: 'warning', ...issue });
      }
    }
  }
}

/**
 * Add contextual suggestions from component guidance
 */
function addContextualSuggestions(guidance, suggestions) {
  const dos = guidance.filter(g => g.guidance_type === 'dos');
  const donts = guidance.filter(g => g.guidance_type === 'donts');

  if (dos.length > 0) {
    suggestions.push({
      type: 'best_practice',
      message: `Best practices: ${dos.slice(0, 2).map(d => d.content).join('; ')}`
    });
  }

  if (donts.length > 0) {
    suggestions.push({
      type: 'best_practice',
      message: `Avoid: ${donts.slice(0, 2).map(d => d.content).join('; ')}`
    });
  }
}

/**
 * Calculate quality score
 */
function calculateQualityScore(errors, warnings) {
  let score = 100;
  score -= errors.length * 15;  // Each error: -15 points
  score -= warnings.length * 5;  // Each warning: -5 points
  return Math.max(0, score);
}

/**
 * Component-specific structure validators
 */
function validateCardStructure($, errors, warnings) {
  $('.ecl-card').each((i, card) => {
    const $card = $(card);

    // Check for card body
    if ($card.find('.ecl-card__body').length === 0) {
      warnings.push({
        message: 'Card should contain ecl-card__body element',
        suggestion: 'Add <div class="ecl-card__body">...</div>'
      });
    }
  });
}

function validateButtonStructure($, errors, warnings) {
  $('.ecl-button').each((i, button) => {
    const $button = $(button);

    // Check if button has icon
    if ($button.find('.ecl-icon').length > 0) {
      // Icon button should have label
      if ($button.find('.ecl-button__label').length === 0) {
        warnings.push({
          message: 'Icon button should include ecl-button__label for accessibility',
          suggestion: 'Add <span class="ecl-button__label">Label text</span>'
        });
      }
    }
  });
}

function validateModalStructure($, errors, warnings) {
  $('.ecl-modal').each((i, modal) => {
    const $modal = $(modal);

    // Check for required ARIA attributes
    if (!$modal.attr('role') || $modal.attr('role') !== 'dialog') {
      errors.push({
        message: 'Modal must have role="dialog"',
        suggestion: 'Add role="dialog" to modal element',
        wcag: '4.1.2'
      });
    }

    if (!$modal.attr('aria-modal')) {
      errors.push({
        message: 'Modal must have aria-modal="true"',
        suggestion: 'Add aria-modal="true" to modal element',
        wcag: '4.1.2'
      });
    }
  });
}
