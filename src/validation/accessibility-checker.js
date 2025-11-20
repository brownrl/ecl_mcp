/**
 * ECL Accessibility Compliance Checker
 * 
 * Validates HTML code against WCAG 2.1 accessibility standards
 * (Level A, AA, AAA)
 */

import * as cheerio from 'cheerio';
import { WCAG_CRITERIA } from './patterns.js';

/**
 * Check accessibility compliance
 * @param {Object} db - Database connection
 * @param {string} htmlCode - HTML code to check
 * @param {string} [component] - Component name if known
 * @param {string} [wcagLevel] - Target WCAG level (A, AA, AAA)
 * @returns {Object} Accessibility check result
 */
export async function checkAccessibility(db, htmlCode, component = null, wcagLevel = 'AA') {
  const startTime = Date.now();
  const issues = [];
  const recommendations = [];
  let passedChecks = 0;
  let totalChecks = 0;

  try {
    const $ = cheerio.load(htmlCode);

    // Level A checks (required)
    await runLevelAChecks($, issues, recommendations, passedChecks, totalChecks);
    passedChecks = totalChecks - issues.filter(i => i.level === 'A').length;

    // Level AA checks (if targeting AA or AAA)
    if (wcagLevel === 'AA' || wcagLevel === 'AAA') {
      await runLevelAAChecks($, issues, recommendations, passedChecks, totalChecks);
    }

    // Level AAA checks (if targeting AAA)
    if (wcagLevel === 'AAA') {
      await runLevelAAAChecks($, issues, recommendations, passedChecks, totalChecks);
    }

    // Get component-specific accessibility requirements
    if (component) {
      const componentRequirements = await getAccessibilityRequirements(db, component);
      if (componentRequirements) {
        checkComponentRequirements($, componentRequirements, issues, recommendations);
      }
    }

    // Add general recommendations
    addGeneralRecommendations($, recommendations);

    // Determine compliance level
    const complianceLevel = determineComplianceLevel(issues);

    return {
      success: true,
      data: {
        compliance_level: complianceLevel,
        target_level: wcagLevel,
        wcag_a_compliant: !issues.some(i => i.level === 'A'),
        wcag_aa_compliant: !issues.some(i => ['A', 'AA'].includes(i.level)),
        wcag_aaa_compliant: issues.length === 0,
        passed_checks: passedChecks,
        total_checks: totalChecks,
        pass_rate: totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0,
        issues: issues.map(issue => ({
          wcag_criterion: issue.criterion,
          criterion_name: WCAG_CRITERIA[issue.criterion]?.name || 'Unknown',
          level: issue.level,
          severity: issue.severity,
          issue: issue.message,
          how_to_fix: issue.fix,
          example: issue.example,
          element: issue.element
        })),
        recommendations: recommendations.map(r => ({
          message: r.message,
          benefit: r.benefit,
          how_to: r.how_to
        }))
      },
      metadata: {
        tool: 'check_accessibility',
        execution_time_ms: Date.now() - startTime,
        source: 'wcag-2.1',
        version: '2.0',
        wcag_version: '2.1'
      }
    };

  } catch (error) {
    return {
      success: false,
      errors: [{
        code: 'ACCESSIBILITY_CHECK_ERROR',
        message: error.message,
        details: error.stack
      }],
      metadata: {
        tool: 'check_accessibility',
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * WCAG Level A Checks (Required)
 */
async function runLevelAChecks($, issues, recommendations, passedChecks, totalChecks) {
  // 1.1.1 Non-text Content (Level A)
  totalChecks++;
  $('img').each((i, elem) => {
    const $img = $(elem);
    if (!$img.attr('alt') && $img.attr('alt') !== '') {
      issues.push({
        criterion: '1.1.1',
        level: 'A',
        severity: 'critical',
        message: 'Image missing alt attribute',
        fix: 'Add alt="description" for meaningful images or alt="" for decorative images',
        example: '<img src="logo.png" alt="Company Logo" />',
        element: $.html($img)
      });
    }
  });

  // 1.3.1 Info and Relationships (Level A)
  totalChecks++;
  
  // Check form labels
  $('input, select, textarea').each((i, elem) => {
    const $input = $(elem);
    const id = $input.attr('id');
    const type = $input.attr('type');
    
    // Skip hidden inputs and buttons
    if (type === 'hidden' || type === 'submit' || type === 'button') return;
    
    const hasLabel = $input.attr('aria-label') || $input.attr('aria-labelledby');
    const hasVisibleLabel = id && $(`label[for="${id}"]`).length > 0;

    if (!hasLabel && !hasVisibleLabel) {
      issues.push({
        criterion: '1.3.1',
        level: 'A',
        severity: 'critical',
        message: 'Form input missing label',
        fix: 'Add <label> element with for attribute or aria-label',
        example: '<label for="name">Name:</label><input id="name" type="text" />',
        element: $.html($input)
      });
    }
  });

  // Check heading hierarchy
  const headings = [];
  $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
    headings.push({
      level: parseInt(elem.name[1]),
      text: $(elem).text(),
      html: $.html(elem)
    });
  });

  if (headings.length > 0) {
    totalChecks++;
    for (let i = 0; i < headings.length - 1; i++) {
      if (headings[i + 1].level - headings[i].level > 1) {
        issues.push({
          criterion: '1.3.1',
          level: 'A',
          severity: 'serious',
          message: `Heading hierarchy skips from h${headings[i].level} to h${headings[i+1].level}`,
          fix: 'Maintain sequential heading levels (h1 → h2 → h3, not h1 → h3)',
          example: '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>',
          element: headings[i+1].html
        });
        break;
      }
    }
  }

  // 2.1.1 Keyboard (Level A)
  totalChecks++;
  $('[onclick], [onmousedown], [onmouseover]').each((i, elem) => {
    const $elem = $(elem);
    const hasKeyboardHandler = $elem.attr('onkeydown') || $elem.attr('onkeyup') || $elem.attr('onkeypress');
    
    if (!hasKeyboardHandler && !['button', 'a', 'input'].includes(elem.tagName)) {
      issues.push({
        criterion: '2.1.1',
        level: 'A',
        severity: 'critical',
        message: 'Interactive element may not be keyboard accessible',
        fix: 'Add keyboard event handlers or use focusable elements like <button>',
        example: '<button type="button" onclick="handleClick()">Click</button>',
        element: $.html($elem)
      });
    }
  });

  // 2.4.1 Bypass Blocks (Level A)
  totalChecks++;
  const hasSkipLink = $('a[href^="#"]').first().text().toLowerCase().includes('skip');
  if (!hasSkipLink) {
    issues.push({
      criterion: '2.4.1',
      level: 'A',
      severity: 'moderate',
      message: 'Missing skip navigation link',
      fix: 'Add skip link at beginning of page for keyboard users',
      example: '<a href="#main-content" class="ecl-link ecl-link--skip">Skip to main content</a>',
      element: '<body>'
    });
  }

  // 3.3.2 Labels or Instructions (Level A) - Required field indicators
  totalChecks++;
  passedChecks++; // The HTML required attribute provides basic accessibility
  $('input[required], select[required], textarea[required]').each((i, elem) => {
    const $elem = $(elem);
    const hasAriaRequired = $elem.attr('aria-required') === 'true';
    const hasVisualIndicator = $elem.siblings('label').text().includes('*') ||
                                $elem.siblings('label').text().toLowerCase().includes('required') ||
                                $elem.parent().prev('label').text().includes('*') ||
                                $elem.parent().prev('label').text().toLowerCase().includes('required');
    
    // Only recommend aria-required, don't fail (HTML required attribute is WCAG compliant)
    if (!hasAriaRequired && !hasVisualIndicator) {
      recommendations.push({
        message: 'Add aria-required="true" to required fields for better screen reader support',
        benefit: 'Makes required fields more clearly announced to screen reader users',
        how_to: 'Add aria-required="true" to elements with the required attribute'
      });
    }
  });

  // 4.1.1 Parsing (Level A)
  totalChecks++;
  const duplicateIds = findDuplicateIds($);
  if (duplicateIds.length > 0) {
    duplicateIds.forEach(id => {
      issues.push({
        criterion: '4.1.1',
        level: 'A',
        severity: 'critical',
        message: `Duplicate ID found: "${id}"`,
        fix: 'Ensure all ID attributes are unique',
        example: 'Use unique IDs like id="modal-1", id="modal-2"',
        element: `id="${id}"`
      });
    });
  }

  // 4.1.2 Name, Role, Value (Level A)
  totalChecks++;
  $('button, [role="button"]').each((i, elem) => {
    const $button = $(elem);
    const hasText = $button.text().trim().length > 0;
    const hasLabel = $button.attr('aria-label') || $button.attr('aria-labelledby');

    if (!hasText && !hasLabel) {
      issues.push({
        criterion: '4.1.2',
        level: 'A',
        severity: 'critical',
        message: 'Button has no accessible name',
        fix: 'Add visible text or aria-label attribute',
        example: '<button aria-label="Close">×</button>',
        element: $.html($button)
      });
    }
  });
}

/**
 * WCAG Level AA Checks
 */
async function runLevelAAChecks($, issues, recommendations, passedChecks, totalChecks) {
  // 1.4.3 Contrast (Minimum) (Level AA)
  // Note: We can't check actual contrast without color values
  totalChecks++;
  $('[style*="color"]').each((i, elem) => {
    issues.push({
      criterion: '1.4.3',
      level: 'AA',
      severity: 'moderate',
      message: 'Inline color styles detected - verify contrast ratio',
      fix: 'Ensure text has 4.5:1 contrast ratio (3:1 for large text)',
      example: 'Use ECL color variables which meet WCAG AA standards',
      element: $.html($(elem))
    });
  });

  // 1.4.5 Images of Text (Level AA)
  totalChecks++;
  $('img').each((i, elem) => {
    const $img = $(elem);
    const alt = $img.attr('alt') || '';
    if (alt.length > 50) { // Heuristic: long alt text might indicate text in image
      issues.push({
        criterion: '1.4.5',
        level: 'AA',
        severity: 'moderate',
        message: 'Possible image of text detected',
        fix: 'Use actual text instead of images of text when possible',
        example: 'Replace text images with HTML/CSS text',
        element: $.html($img)
      });
    }
  });

  // 2.4.6 Headings and Labels (Level AA)
  totalChecks++;
  $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
    const $heading = $(elem);
    const text = $heading.text().trim();
    
    if (text.length === 0) {
      issues.push({
        criterion: '2.4.6',
        level: 'AA',
        severity: 'serious',
        message: 'Empty heading element',
        fix: 'Add descriptive text to heading or remove empty element',
        example: '<h2>Section Title</h2>',
        element: $.html($heading)
      });
    }
  });

  // 2.4.7 Focus Visible (Level AA)
  totalChecks++;
  $('[style*="outline: none"], [style*="outline:none"]').each((i, elem) => {
    issues.push({
      criterion: '2.4.7',
      level: 'AA',
      severity: 'serious',
      message: 'Focus indicator removed',
      fix: 'Do not remove outline without providing alternative focus indicator',
      example: 'Use :focus styles to provide custom focus indicator',
      element: $.html($(elem))
    });
  });

  // 3.2.4 Consistent Identification (Level AA)
  // Check for multiple navigation elements
  totalChecks++;
  const navElements = $('nav, [role="navigation"]');
  if (navElements.length > 1) {
    navElements.each((i, elem) => {
      const $nav = $(elem);
      if (!$nav.attr('aria-label') && !$nav.attr('aria-labelledby')) {
        issues.push({
          criterion: '3.2.4',
          level: 'AA',
          severity: 'moderate',
          message: 'Multiple navigation landmarks without labels',
          fix: 'Add aria-label to distinguish navigation regions',
          example: '<nav aria-label="Main navigation">...</nav>',
          element: $.html($nav)
        });
      }
    });
  }
}

/**
 * WCAG Level AAA Checks
 */
async function runLevelAAAChecks($, issues, recommendations, passedChecks, totalChecks) {
  // 1.4.6 Contrast (Enhanced) (Level AAA)
  totalChecks++;
  // Note: Requires actual color checking

  // 2.4.8 Location (Level AAA)
  totalChecks++;
  const hasBreadcrumb = $('.ecl-breadcrumb, [aria-label*="breadcrumb"]').length > 0;
  if (!hasBreadcrumb) {
    issues.push({
      criterion: '2.4.8',
      level: 'AAA',
      severity: 'minor',
      message: 'No breadcrumb navigation found',
      fix: 'Add breadcrumb navigation to help users understand their location',
      example: '<nav aria-label="Breadcrumb"><ol class="ecl-breadcrumb">...</ol></nav>',
      element: '<body>'
    });
  }

  // 2.5.5 Target Size (Level AAA)
  totalChecks++;
  // Note: Requires measuring actual element sizes
}

/**
 * Get component-specific accessibility requirements
 */
async function getAccessibilityRequirements(db, componentName) {
  try {
    // Try exact match first
    let component = db.prepare(`
      SELECT id, page_id FROM component_metadata 
      WHERE LOWER(component_name) = LOWER(?)
    `).get(componentName);

    // Try fuzzy matching if exact fails
    if (!component) {
      const variations = [
        componentName + 's',
        componentName.replace(/s$/, ''),
        componentName.charAt(0).toUpperCase() + componentName.slice(1),
        componentName.charAt(0).toUpperCase() + componentName.slice(1) + 's'
      ];
      
      component = db.prepare(`
        SELECT id, page_id FROM component_metadata 
        WHERE LOWER(component_name) IN (${variations.map(() => 'LOWER(?)').join(',')})
        LIMIT 1
      `).get(...variations);
    }

    if (!component) return null;

    return db.prepare(`
      SELECT * FROM accessibility_requirements 
      WHERE page_id = ?
    `).all(component.page_id);
  } catch (error) {
    return null;
  }
}

/**
 * Check component-specific requirements
 */
function checkComponentRequirements($, requirements, issues, recommendations) {
  for (const req of requirements) {
    // Check ARIA attributes
    if (req.aria_attributes) {
      try {
        const ariaAttrs = JSON.parse(req.aria_attributes);
        for (const attr of ariaAttrs) {
          const hasAttr = $(`[${attr}]`).length > 0;
          if (!hasAttr) {
            issues.push({
              criterion: '4.1.2',
              level: req.wcag_level || 'A',
              severity: 'serious',
              message: `Missing required ARIA attribute: ${attr}`,
              fix: req.how_to_comply || `Add ${attr} attribute`,
              example: req.requirement,
              element: 'component'
            });
          }
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // Add keyboard interaction as recommendation
    if (req.keyboard_interaction) {
      recommendations.push({
        message: `Keyboard interaction: ${req.keyboard_interaction}`,
        benefit: 'Ensures keyboard users can interact with component',
        how_to: req.how_to_comply
      });
    }
  }
}

/**
 * Add general recommendations
 */
function addGeneralRecommendations($, recommendations) {
  // Check for landmarks
  const hasMain = $('main, [role="main"]').length > 0;
  if (!hasMain) {
    recommendations.push({
      message: 'Add <main> landmark',
      benefit: 'Helps screen reader users navigate to main content quickly',
      how_to: 'Wrap main content in <main> element'
    });
  }

  // Check for language attribute
  const hasLang = $('html[lang]').length > 0;
  if (!hasLang) {
    recommendations.push({
      message: 'Add lang attribute to <html>',
      benefit: 'Helps screen readers pronounce content correctly',
      how_to: '<html lang="en"> for English content'
    });
  }

  // Check for page title
  const hasTitle = $('title').length > 0;
  if (!hasTitle || $('title').text().trim().length === 0) {
    recommendations.push({
      message: 'Add descriptive <title> element',
      benefit: 'Helps users identify page content and purpose',
      how_to: '<title>Page Name - Site Name</title>'
    });
  }
}

/**
 * Find duplicate IDs
 */
function findDuplicateIds($) {
  const ids = {};
  const duplicates = [];
  
  $('[id]').each((i, elem) => {
    const id = $(elem).attr('id');
    if (ids[id]) {
      if (!duplicates.includes(id)) {
        duplicates.push(id);
      }
    } else {
      ids[id] = true;
    }
  });
  
  return duplicates;
}

/**
 * Determine overall compliance level
 */
function determineComplianceLevel(issues) {
  const hasLevelA = issues.some(i => i.level === 'A');
  const hasLevelAA = issues.some(i => i.level === 'AA');
  const hasLevelAAA = issues.some(i => i.level === 'AAA');

  if (hasLevelA) return 'none';
  if (hasLevelAA) return 'A';
  if (hasLevelAAA) return 'AA';
  return 'AAA';
}
