/**
 * Playground Generator
 * 
 * Creates standalone HTML files for testing ECL components
 */

/**
 * Create playground file
 * @param {Database} db - SQLite database instance
 * @param {Array<string>} components - Components to include
 * @param {Object} options - Generation options
 * @returns {Object} Playground HTML
 */
export function createPlayground(db, components, options = {}) {
  try {
    const { customCode, includeAllVariants = false } = options;
    
    // Validate components
    if (!components || components.length === 0) {
      return {
        success: false,
        error: 'At least one component must be specified'
      };
    }
    
    // Get examples for each component
    const componentExamples = [];
    
    for (const component of components) {
      const examples = getComponentExamples(db, component, includeAllVariants);
      if (examples.length > 0) {
        componentExamples.push({
          component,
          examples
        });
      }
    }
    
    if (componentExamples.length === 0) {
      return {
        success: false,
        error: 'No examples found for specified components'
      };
    }
    
    // Build playground HTML
    const html = buildPlaygroundHTML(componentExamples, customCode);
    
    // Calculate file size
    const fileSize = new Blob([html]).size;
    const fileSizeKB = (fileSize / 1024).toFixed(2);
    
    return {
      success: true,
      html_file: html,
      instructions: generateInstructions(),
      file_size: `${fileSizeKB} KB`,
      components_included: components,
      examples_count: componentExamples.reduce((sum, c) => sum + c.examples.length, 0)
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Failed to create playground: ${error.message}`
    };
  }
}

/**
 * Get examples for a component
 * @param {Database} db - Database instance
 * @param {string} component - Component name
 * @param {boolean} includeAll - Include all variants
 * @returns {Array} Examples
 */
function getComponentExamples(db, component, includeAll) {
  try {
    const query = `
      SELECT 
        ce.code,
        ce.language,
        ece.variant,
        ece.use_case,
        ece.complexity
      FROM code_examples ce
      JOIN pages p ON ce.page_id = p.id
      LEFT JOIN enhanced_code_examples ece ON ce.id = ece.example_id
      WHERE LOWER(p.component_name) = LOWER(?)
        AND ce.language = 'html'
      ORDER BY 
        CASE 
          WHEN ece.complexity = 'simple' THEN 1
          WHEN ece.complexity = 'moderate' THEN 2
          ELSE 3
        END
      ${includeAll ? '' : 'LIMIT 3'}
    `;
    
    return db.prepare(query).all(component);
    
  } catch (error) {
    return [];
  }
}

/**
 * Build playground HTML
 * @param {Array} componentExamples - Component examples
 * @param {string} customCode - Custom code to include
 * @returns {string} Complete HTML
 */
function buildPlaygroundHTML(componentExamples, customCode) {
  const exampleSections = componentExamples.map(({ component, examples }) => {
    const exampleHTML = examples.map((ex, idx) => `
      <div class="playground-example">
        <h3 class="playground-example__title">
          ${component} ${ex.variant ? `- ${ex.variant}` : ''} 
          ${ex.use_case ? `(${ex.use_case})` : ''}
        </h3>
        <div class="playground-example__demo">
          ${ex.code}
        </div>
        <details class="playground-example__code">
          <summary>View Code</summary>
          <pre><code class="language-html">${escapeHtml(ex.code)}</code></pre>
        </details>
      </div>
    `).join('\n');
    
    return `
      <section class="playground-section" id="${component.toLowerCase()}">
        <h2 class="playground-section__title">${component}</h2>
        ${exampleHTML}
      </section>
    `;
  }).join('\n');
  
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8" />
  <title>ECL Component Playground</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  
  <!-- ECL EC Styles -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@latest/dist/styles/ecl-ec.css" />
  
  <style>
    /* Playground Styles */
    body {
      font-family: Arial, sans-serif;
      line-height: 1.5;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    
    .playground-header {
      background-color: #004494;
      color: white;
      padding: 2rem;
      text-align: center;
    }
    
    .playground-header__title {
      margin: 0;
      font-size: 2rem;
    }
    
    .playground-nav {
      background-color: white;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .playground-nav__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .playground-nav__link {
      color: #004494;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .playground-nav__link:hover {
      background-color: #f0f0f0;
    }
    
    .playground-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .playground-section {
      background-color: white;
      margin-bottom: 2rem;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .playground-section__title {
      margin-top: 0;
      color: #004494;
      border-bottom: 2px solid #ffd617;
      padding-bottom: 0.5rem;
    }
    
    .playground-example {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .playground-example:last-child {
      border-bottom: none;
    }
    
    .playground-example__title {
      color: #333;
      font-size: 1.2rem;
    }
    
    .playground-example__demo {
      padding: 2rem;
      background-color: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      margin: 1rem 0;
    }
    
    .playground-example__code {
      margin-top: 1rem;
    }
    
    .playground-example__code summary {
      cursor: pointer;
      color: #004494;
      font-weight: bold;
      padding: 0.5rem;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    
    .playground-example__code pre {
      background-color: #282c34;
      color: #abb2bf;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      margin: 0.5rem 0 0 0;
    }
    
    .playground-example__code code {
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }
    
    .playground-footer {
      background-color: #333;
      color: white;
      padding: 2rem;
      text-align: center;
      margin-top: 4rem;
    }
  </style>
</head>
<body>
  <header class="playground-header">
    <h1 class="playground-header__title">ECL Component Playground</h1>
    <p>Interactive examples of Europa Component Library components</p>
  </header>
  
  <nav class="playground-nav">
    <ul class="playground-nav__list">
      ${componentExamples.map(({ component }) => 
        `<li><a href="#${component.toLowerCase()}" class="playground-nav__link">${component}</a></li>`
      ).join('\n      ')}
    </ul>
  </nav>
  
  <div class="playground-container">
    ${exampleSections}
    
    ${customCode ? `
    <section class="playground-section">
      <h2 class="playground-section__title">Custom Code</h2>
      <div class="playground-example__demo">
        ${customCode}
      </div>
    </section>
    ` : ''}
  </div>
  
  <footer class="playground-footer">
    <p>Generated by ECL MCP Server • <a href="https://ec.europa.eu/component-library/" style="color: #ffd617;">ECL Documentation</a></p>
  </footer>
  
  <!-- ECL EC Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@latest/dist/scripts/ecl-ec.js"></script>
  
  <script>
    // Initialize all ECL components
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof ECL !== 'undefined' && ECL.autoInit) {
        ECL.autoInit();
      }
    });
    
    // Smooth scroll for navigation
    document.querySelectorAll('.playground-nav__link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Escape HTML for code display
 * @param {string} html - HTML to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(html) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate usage instructions
 * @returns {string} Instructions
 */
function generateInstructions() {
  return `How to use this playground:

1. Save the HTML to a file (e.g., ecl-playground.html)
2. Open the file in your web browser
3. Interact with the examples to see how components behave
4. Click "View Code" under each example to see the HTML
5. Use the navigation menu to jump between components

Note: All ECL styles and scripts are loaded from CDN, so you need an internet connection.`;
}
