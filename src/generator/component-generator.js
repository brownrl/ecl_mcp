/**
 * Component Generator
 * 
 * Generates ECL components with customization options
 */

import * as cheerio from 'cheerio';

/**
 * Generate component with customization
 * @param {Database} db - SQLite database instance
 * @param {string} component - Component name
 * @param {Object} options - Generation options
 * @returns {Object} Generated code
 */
export function generateComponent(db, component, options = {}) {
  try {
    const { customization = {}, framework = 'vanilla', includeComments = false } = options;

    // Get component template
    const template = getComponentTemplate(db, component);

    if (!template.success) {
      return template;
    }

    // Apply customization
    const generated = applyCustomization(template.code, component, customization, includeComments);

    // Get usage instructions
    const instructions = getUsageInstructions(db, component, customization);

    // Get accessibility notes
    const accessibilityNotes = getAccessibilityNotes(db, component);

    // Generate framework-specific code if needed
    const code = framework === 'vanilla'
      ? generated
      : convertToFramework(generated, component, framework);

    return {
      success: true,
      component,
      framework,
      generated_code: code,
      usage_instructions: instructions,
      accessibility_notes: accessibilityNotes,
      next_steps: generateNextSteps(component, customization)
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to generate component: ${error.message}`
    };
  }
}

/**
 * Get component template from database
 * @param {Database} db - Database instance
 * @param {string} component - Component name
 * @returns {Object} Template data
 */
function getComponentTemplate(db, component) {
  try {
    // Get simplest example as template
    // NOTE: p.component_name is actually the CATEGORY, p.title is the actual component name
    
    // Try multiple name variations to match singular/plural forms and utilities
    const componentStr = String(component).toLowerCase().trim();
    const componentVariations = [
      componentStr,
      componentStr + 's',                     // Add 's' for plural
      componentStr.replace(/s$/, ''),         // Remove trailing 's' if present
      componentStr.replace(/\s+/g, ''),       // Remove spaces (for utilities like "disable scroll" → "disablescroll")
      componentStr.replace(/\s+/g, '-'),      // Replace spaces with hyphens (for "screen reader" → "screen-reader")
      componentStr.replace(/\([^)]*\)/g, '').trim(), // Remove parentheses (for "Stacks (Flex)" → "Stacks")
    ];

    // Build WHERE clause with both exact matches and LIKE patterns
    const exactMatches = componentVariations.map(() => 'LOWER(p.title) = ?').join(' OR ');
    const exactMatchesComponent = componentVariations.map(() => 'LOWER(p.component_name) = ?').join(' OR ');
    const likePatterns = componentVariations.map(() => 'LOWER(p.title) LIKE ?').join(' OR ');
    
    const query = `
      SELECT 
        ce.code,
        ce.language,
        ece.complexity
      FROM code_examples ce
      JOIN pages p ON ce.page_id = p.id
      LEFT JOIN enhanced_code_examples ece ON ce.id = ece.example_id
      WHERE (
        ${exactMatches}
        OR ${exactMatchesComponent}
        OR ${likePatterns}
      )
        AND ce.language = 'html'
      ORDER BY 
        CASE 
          WHEN ece.complexity = 'simple' THEN 1
          WHEN ece.complexity = 'moderate' THEN 2
          ELSE 3
        END
      LIMIT 1
    `;

    const params = [
      ...componentVariations,                              // Exact title matches
      ...componentVariations,                              // Exact component_name matches  
      ...componentVariations.map(v => `%${v}%`)           // LIKE patterns for title
    ];
    
    const template = db.prepare(query).get(...params);

    if (!template) {
      return {
        success: false,
        error: `No template found for component: ${component}`
      };
    }

    return {
      success: true,
      code: template.code
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to get template: ${error.message}`
    };
  }
}

/**
 * Apply customization to template
 * @param {string} template - Base template
 * @param {string} component - Component name
 * @param {Object} customization - Customization options
 * @param {boolean} includeComments - Include explanatory comments
 * @returns {Object} Generated code
 */
function applyCustomization(template, component, customization, includeComments) {
  const $ = cheerio.load(template, null, false);

  const { variant, size, color, content, attributes } = customization;

  // Find main component element
  const selector = `.ecl-${component}`;
  const $component = $(selector).first();

  if ($component.length === 0) {
    // Return template as-is if we can't find component
    return {
      html: template,
      js: null,
      css: null
    };
  }

  // Apply variant
  if (variant) {
    const variantClass = `ecl-${component}--${variant}`;
    $component.addClass(variantClass);

    if (includeComments) {
      $component.before(`<!-- Variant: ${variant} -->\n`);
    }
  }

  // Apply size
  if (size) {
    const sizeClass = `ecl-${component}--${size}`;
    $component.addClass(sizeClass);
  }

  // Apply custom attributes
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      $component.attr(key, value);
    });
  }

  // Apply content customization (component-specific)
  if (content) {
    applyContentCustomization($, $component, component, content);
  }

  // Add accessibility attributes if missing
  enhanceAccessibility($, $component, component);

  const html = $.html();

  // Generate JavaScript if needed
  const js = generateComponentJS(component, customization);

  return {
    html: html,
    js: js,
    css: null // CSS is handled by ECL stylesheets
  };
}

/**
 * Apply content customization
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Cheerio} $component - Component element
 * @param {string} component - Component name
 * @param {Object} content - Content customization
 */
function applyContentCustomization($, $component, component, content) {
  // Handle string content (simple text replacement)
  if (typeof content === 'string') {
    content = { text: content };
  }

  switch (component.toLowerCase()) {
    case 'button':
      const buttonText = content.label || content.text;
      if (buttonText) {
        $component.find('.ecl-button__label').text(buttonText);
        if ($component.find('.ecl-button__label').length === 0) {
          $component.text(buttonText);
        }
      }
      if (content.icon) {
        addIcon($, $component, content.icon, content.iconPosition || 'after');
      }
      break;

    case 'card':
      if (content.title) {
        $component.find('.ecl-card__title').text(content.title);
      }
      if (content.description) {
        $component.find('.ecl-card__description').text(content.description);
      }
      if (content.image) {
        const $img = $component.find('.ecl-card__image img');
        if ($img.length > 0) {
          $img.attr('src', content.image);
        }
      }
      break;

    case 'link':
      if (content.label) {
        $component.find('.ecl-link__label').text(content.label);
      }
      if (content.href) {
        $component.attr('href', content.href);
      }
      break;

    default:
      // Generic content replacement
      if (content.text) {
        $component.text(content.text);
      }
  }
}

/**
 * Add icon to component
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Cheerio} $component - Component element
 * @param {string} iconName - Icon name
 * @param {string} position - Icon position (before/after)
 */
function addIcon($, $component, iconName, position) {
  const iconHtml = `
    <svg class="ecl-icon ecl-icon--xs ecl-button__icon" focusable="false" aria-hidden="true">
      <use xlink:href="/icons.svg#${iconName}"></use>
    </svg>
  `;

  if (position === 'before') {
    $component.prepend(iconHtml);
    $component.addClass('ecl-button--icon-before');
  } else {
    $component.append(iconHtml);
    $component.addClass('ecl-button--icon-after');
  }
}

/**
 * Enhance accessibility attributes
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Cheerio} $component - Component element
 * @param {string} component - Component name
 */
function enhanceAccessibility($, $component, component) {
  const tagName = $component.prop('tagName')?.toLowerCase();

  // Add role if appropriate
  if (component === 'button' && tagName !== 'button') {
    $component.attr('role', 'button');
    if (!$component.attr('tabindex')) {
      $component.attr('tabindex', '0');
    }
  }

  // Ensure links have meaningful text
  if (tagName === 'a' && !$component.attr('aria-label')) {
    const text = $component.text().trim();
    if (!text || text.length < 3) {
      $component.attr('aria-label', `${component} link`);
    }
  }

  // Add aria-label to icon-only buttons
  if (component === 'button' && $component.find('.ecl-icon').length > 0) {
    const hasText = $component.text().trim().length > 0;
    if (!hasText && !$component.attr('aria-label')) {
      $component.attr('aria-label', 'Button');
    }
  }
}

/**
 * Generate component JavaScript
 * @param {string} component - Component name
 * @param {Object} customization - Customization options
 * @returns {string|null} JavaScript code
 */
function generateComponentJS(component, customization) {
  const interactiveComponents = ['accordion', 'modal', 'dropdown', 'tabs', 'carousel'];

  if (!interactiveComponents.includes(component.toLowerCase())) {
    return null;
  }

  return `// Initialize ${component}
document.addEventListener('DOMContentLoaded', function() {
  if (typeof ECL !== 'undefined' && ECL.${component}) {
    const elements = document.querySelectorAll('.ecl-${component}');
    elements.forEach(function(element) {
      new ECL.${component}(element);
    });
  }
});`;
}

/**
 * Get usage instructions
 * @param {Database} db - Database instance
 * @param {string} component - Component name
 * @param {Object} customization - Customization options
 * @returns {string} Usage instructions
 */
function getUsageInstructions(db, component, customization) {
  const instructions = [];

  instructions.push(`1. Include ECL EC stylesheet in your HTML <head>`);
  instructions.push(`2. Add the generated ${component} HTML to your page`);

  const interactiveComponents = ['accordion', 'modal', 'dropdown', 'tabs', 'carousel'];
  if (interactiveComponents.includes(component.toLowerCase())) {
    instructions.push(`3. Include ECL EC JavaScript before closing </body>`);
    instructions.push(`4. Initialize the ${component} component (see generated JS)`);
  }

  instructions.push(`5. Test for accessibility and responsiveness`);

  return instructions.join('\n');
}

/**
 * Get accessibility notes
 * @param {Database} db - Database instance
 * @param {string} component - Component name
 * @returns {string} Accessibility notes
 */
function getAccessibilityNotes(db, component) {
  try {
    const query = `
      SELECT ar.requirement_text, ar.requirement_level
      FROM accessibility_requirements ar
      JOIN pages p ON ar.page_id = p.id
      WHERE LOWER(p.title) = LOWER(?)
      ORDER BY 
        CASE ar.requirement_level
          WHEN 'must' THEN 1
          WHEN 'should' THEN 2
          ELSE 3
        END
      LIMIT 5
    `;

    const requirements = db.prepare(query).all(component);

    if (requirements.length === 0) {
      return 'Follow WCAG 2.1 Level AA guidelines for accessibility.';
    }

    return requirements.map((r, i) =>
      `${i + 1}. ${r.requirement_text}`
    ).join('\n');

  } catch (error) {
    return 'Follow WCAG 2.1 Level AA guidelines for accessibility.';
  }
}

/**
 * Generate next steps
 * @param {string} component - Component name
 * @param {Object} customization - Customization options
 * @returns {Array<string>} Next steps
 */
function generateNextSteps(component, customization) {
  const steps = [
    'Test the component in different browsers',
    'Verify keyboard navigation works correctly',
    'Check color contrast meets WCAG standards',
    'Test with screen readers'
  ];

  if (!customization.content) {
    steps.unshift('Replace placeholder content with real data');
  }

  return steps;
}

/**
 * Convert to framework-specific code
 * @param {Object} code - Generated code
 * @param {string} component - Component name
 * @param {string} framework - Target framework
 * @returns {Object} Framework-specific code
 */
function convertToFramework(code, component, framework) {
  // For now, return vanilla code with note
  // Framework conversion would require knowledge of ECL's React/Vue packages
  return {
    ...code,
    html: code.html,
    note: `Framework conversion to ${framework} is not yet implemented. Use vanilla HTML/JS code.`
  };
}
