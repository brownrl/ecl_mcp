/**
 * Example Reconstruction System
 * 
 * Reconstructs complete, runnable ECL examples with all dependencies
 */

import * as cheerio from 'cheerio';
import { getAllResources } from '../utils/asset-library.js';

/**
 * Get complete example with all dependencies
 * @param {Database} db - SQLite database instance
 * @param {string} component - Component name
 * @param {Object} options - Options
 * @param {string} options.exampleType - Type of example (basic/advanced/interactive)
 * @param {string} options.variant - Component variant
 * @returns {Object} Complete example with HTML/CSS/JS
 */
export function getCompleteExample(db, component, options = {}) {
  try {
    const { exampleType, variant } = options;

    // Find component examples
    // NOTE: p.component_name is actually the CATEGORY, p.title is the actual component name
    const query = `
      SELECT 
        ce.id,
        ce.code,
        ce.language,
        ce.description,
        ece.variant,
        ece.use_case,
        ece.complexity,
        ece.complete_example,
        ece.requires_data,
        ece.interactive,
        ece.accessibility_notes,
        p.title as component_name,
        p.component_name as category,
        p.url,
        p.category
      FROM code_examples ce
      JOIN pages p ON ce.page_id = p.id
      LEFT JOIN enhanced_code_examples ece ON ce.id = ece.example_id
      WHERE LOWER(p.title) = LOWER(?)
      ORDER BY 
        CASE 
          WHEN ece.complexity = 'simple' THEN 1
          WHEN ece.complexity = 'moderate' THEN 2
          WHEN ece.complexity = 'complex' THEN 3
          ELSE 4
        END,
        ce.id
    `;

    const examples = db.prepare(query).all(component);

    if (examples.length === 0) {
      return {
        success: false,
        error: `No examples found for component: ${component}`,
        suggestion: 'Try searching for the component first to verify it exists'
      };
    }

    // Group by language
    const byLanguage = {
      html: [],
      js: [],
      css: []
    };

    examples.forEach(ex => {
      const lang = ex.language?.toLowerCase() || 'html';
      if (byLanguage[lang]) {
        byLanguage[lang].push(ex);
      }
    });

    // Filter by variant if specified
    let selectedExample = examples[0];
    if (variant) {
      const variantMatch = examples.find(ex =>
        ex.variant && ex.variant.toLowerCase().includes(variant.toLowerCase())
      );
      if (variantMatch) {
        selectedExample = variantMatch;
      }
    }

    // Filter by example type if specified
    if (exampleType) {
      const typeMatch = examples.find(ex =>
        ex.use_case && ex.use_case.toLowerCase().includes(exampleType.toLowerCase())
      );
      if (typeMatch) {
        selectedExample = typeMatch;
      }
    }

    // Get HTML example
    const htmlExample = byLanguage.html.find(ex => ex.id === selectedExample.id) || byLanguage.html[0];
    const jsExample = byLanguage.js[0];
    const cssExample = byLanguage.css[0];

    // Analyze HTML to extract dependencies
    const dependencies = extractDependencies(htmlExample?.code || '');

    // Build complete example
    const completeCode = buildCompleteExample({
      html: htmlExample?.code || '',
      js: jsExample?.code || '',
      css: cssExample?.code || '',
      component,
      dependencies
    });

    // Extract customization points
    const customizationPoints = extractCustomizationPoints(htmlExample?.code || '', component);

    // Get related examples
    const relatedExamples = examples
      .filter(ex => ex.id !== selectedExample.id)
      .slice(0, 5)
      .map(ex => ({
        id: ex.id,
        variant: ex.variant,
        use_case: ex.use_case,
        complexity: ex.complexity
      }));

    return {
      success: true,
      component: selectedExample.component_name,
      example_title: selectedExample.use_case || `${component} example`,
      variant: selectedExample.variant,
      complexity: selectedExample.complexity,
      complete_code: completeCode,
      dependencies: dependencies,
      preview_url: selectedExample.url,
      explanation: generateExplanation(selectedExample, dependencies),
      customization_points: customizationPoints,
      related_examples: relatedExamples,
      accessibility_notes: selectedExample.accessibility_notes
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to get complete example: ${error.message}`
    };
  }
}

/**
 * Extract dependencies from HTML code
 * @param {string} html - HTML code
 * @returns {Array} Dependencies
 */
function extractDependencies(html) {
  const stylesheets = [];
  const scripts = [];
  const $ = cheerio.load(html);
  const resources = getAllResources('ec'); // Default to EC preset

  // Check for ECL stylesheet references
  if (html.includes('ecl-ec.css') || html.includes('ecl-')) {
    stylesheets.push({
      name: 'ECL EC Styles',
      cdn_url: resources.styles.main,
      npm_package: '@ecl/preset-ec',
      required: true
    });
  }

  // Check for ECL JavaScript references
  if (html.includes('ecl-ec.js') || html.includes('ECL.')) {
    scripts.push({
      name: 'ECL EC Scripts',
      cdn_url: resources.scripts.main,
      npm_package: '@ecl/preset-ec',
      required: true
    });
  }

  // Check for specific component scripts
  const componentClasses = [];
  $('.ecl-accordion, .ecl-modal, .ecl-dropdown, .ecl-tabs, .ecl-carousel').each((i, el) => {
    const classes = $(el).attr('class')?.split(' ') || [];
    componentClasses.push(...classes.filter(c => c.startsWith('ecl-')));
  });

  if (componentClasses.length > 0) {
    scripts.push({
      name: 'ECL Component JavaScript',
      description: 'Required for interactive components',
      required: true
    });
  }

  return {
    stylesheets,
    scripts
  };
}

/**
 * Build complete, runnable example
 * @param {Object} parts - Code parts
 * @returns {Object} Complete code
 */
function buildCompleteExample({ html, js, css, component, dependencies }) {
  const resources = getAllResources('ec'); // Default to EC preset

  // Build complete HTML page
  const completeHtml = `<!doctype html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8" />
  <title>ECL ${component} Example</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  
  <!-- ECL EC Styles -->
  <link rel="stylesheet" href="${resources.styles.main}" />
  <link rel="stylesheet" href="${resources.styles.utilities}" />
  ${css ? `\n  <style>\n${css}\n  </style>` : ''}
  
  <!-- Font fix -->
  <style>
    html { font-family: Arial, sans-serif !important; }
  </style>
  
  <script>
    document.documentElement.classList.remove('no-js');
    document.documentElement.classList.add('has-js');
  </script>
</head>
<body>
  <!-- Component Example -->
  <div class="ecl-container">
    ${html}
  </div>
  
  <!-- ECL EC Scripts -->
  <script src="${resources.scripts.main}"></script>
  ${js ? `\n  <script>\n${js}\n  </script>` : ''}
  <script>
    if (typeof ECL !== 'undefined') {
      ECL.autoInit();
    }
  </script>
</body>
</html>`;

  return {
    html: html,
    css: css || '/* No custom CSS required */',
    js: js || '/* No custom JavaScript required */',
    complete_html: completeHtml,
    dependencies: dependencies
  };
}

/**
 * Extract customization points from HTML
 * @param {string} html - HTML code
 * @param {string} component - Component name
 * @returns {Array} Customization points
 */
function extractCustomizationPoints(html, component) {
  const points = [];
  const $ = cheerio.load(html);

  // Common customization points
  const customizations = {
    button: [
      { property: 'variant', description: 'Button style', example_values: ['primary', 'secondary', 'ghost', 'call'] },
      { property: 'type', description: 'Button type', example_values: ['submit', 'button', 'reset'] },
      { property: 'disabled', description: 'Disabled state', example_values: ['true', 'false'] },
      { property: 'icon', description: 'Optional icon', example_values: ['arrow-right', 'download', 'external'] }
    ],
    card: [
      { property: 'image', description: 'Card image', example_values: ['url', 'none'] },
      { property: 'tags', description: 'Category tags', example_values: ['multiple tags'] },
      { property: 'meta', description: 'Metadata', example_values: ['date', 'author', 'location'] }
    ],
    link: [
      { property: 'variant', description: 'Link style', example_values: ['default', 'standalone', 'cta'] },
      { property: 'icon', description: 'Icon position', example_values: ['before', 'after', 'none'] },
      { property: 'external', description: 'External link', example_values: ['true', 'false'] }
    ]
  };

  const componentLower = component.toLowerCase();
  if (customizations[componentLower]) {
    points.push(...customizations[componentLower]);
  }

  // Extract from HTML classes
  const classes = [];
  $('[class*="ecl-"]').each((i, el) => {
    const classList = $(el).attr('class')?.split(' ') || [];
    classes.push(...classList.filter(c => c.startsWith('ecl-')));
  });

  // Find variant classes
  const variantClasses = classes.filter(c => c.includes('--'));
  if (variantClasses.length > 0) {
    variantClasses.forEach(vc => {
      const [base, variant] = vc.split('--');
      points.push({
        property: 'class',
        description: `CSS class: ${vc}`,
        example_values: [variant]
      });
    });
  }

  return points;
}

/**
 * Generate explanation for the example
 * @param {Object} example - Example data
 * @param {Array} dependencies - Dependencies
 * @returns {string} Explanation
 */
function generateExplanation(example, dependencies) {
  const parts = [];

  parts.push(`This is a ${example.complexity || 'standard'} example of the ${example.component_name} component.`);

  if (example.use_case) {
    parts.push(`Use case: ${example.use_case}`);
  }

  if (dependencies.length > 0) {
    const required = dependencies.filter(d => d.required);
    if (required.length > 0) {
      parts.push(`Required dependencies: ${required.map(d => d.name).join(', ')}`);
    }
  }

  if (example.interactive) {
    parts.push('This component requires JavaScript for interactive functionality.');
  }

  if (example.accessibility_notes) {
    parts.push(`Accessibility: ${example.accessibility_notes}`);
  }

  return parts.join(' ');
}
