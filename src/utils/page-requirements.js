/**
 * ECL Page Requirements Generator
 * 
 * Provides complete boilerplate code needed for valid ECL pages
 */

/**
 * Get ECL page requirements and boilerplate
 * @param {Object} options - Page options
 * @param {string} options.preset - ECL preset: 'ec' (European Commission) or 'eu' (European Union)
 * @param {boolean} options.include_reset - Include ECL reset CSS
 * @param {boolean} options.include_optional - Include optional ECL utilities
 * @param {string[]} options.components - Components that will be used (for JS dependencies)
 * @param {string} options.cdn_version - ECL version (default: '4.11.1')
 * @returns {Object} Complete page requirements
 */
export function getPageRequirements(options = {}) {
  const {
    preset = 'ec',
    include_reset = true,
    include_optional = false,
    components = [],
    cdn_version = '4.11.1'
  } = options;

  const startTime = Date.now();

  // Determine which components need JavaScript
  const interactiveComponents = [
    'accordion', 'banner', 'carousel', 'category-filter', 'datepicker',
    'expandable', 'file-upload', 'gallery', 'inpage-navigation', 'mega-menu',
    'menu', 'message', 'modal', 'navigation-list', 'notification', 'popover',
    'tabs', 'timeline', 'site-header', 'site header', 'header', 'search'
  ];

  const needsJS = components.some(comp => {
    const normalized = comp.toLowerCase().replace(/\s+/g, '-');
    return interactiveComponents.some(ic => 
      normalized.includes(ic) || ic.includes(normalized)
    );
  });

  // Build CDN URLs
  const cdnBase = `https://cdn.jsdelivr.net/npm/@ecl/preset-${preset}@${cdn_version}`;
  
  const stylesheets = [
    {
      name: `ECL ${preset.toUpperCase()} Main Styles`,
      url: `${cdnBase}/dist/styles/ecl-${preset}.css`,
      media: 'screen',
      required: true,
      description: 'Core ECL styles including all components'
    }
  ];

  if (include_reset) {
    stylesheets.unshift({
      name: `ECL ${preset.toUpperCase()} Reset/Normalize`,
      url: `${cdnBase}/dist/styles/optional/ecl-reset.css`,
      media: 'screen',
      required: false,
      description: 'CSS reset based on normalize.css - recommended for new projects'
    });
  }

  if (include_optional) {
    stylesheets.push({
      name: 'ECL Print Styles',
      url: `${cdnBase}/dist/styles/ecl-${preset}-print.css`,
      media: 'print',
      required: false,
      description: 'Optimized styles for printing'
    });
  }

  const scripts = [];
  
  if (needsJS) {
    scripts.push({
      name: `ECL ${preset.toUpperCase()} JavaScript`,
      url: `${cdnBase}/dist/scripts/ecl-${preset}.js`,
      required: true,
      defer: true,
      description: 'ECL component JavaScript for interactive elements',
      components_requiring: components.filter(c => 
        interactiveComponents.some(ic => c.toLowerCase().includes(ic.toLowerCase()))
      )
    });
  }

  // Build complete HTML boilerplate
  const htmlBoilerplate = generateHTMLBoilerplate(preset, stylesheets, scripts, cdn_version);

  // Generate initialization script
  const initScript = generateInitScript(components);

  // Font loading requirements
  const fontRequirements = {
    primary_font: 'Arial, sans-serif',
    fallback_fonts: 'sans-serif',
    implementation: 'CSS custom property defined but NOT auto-applied',
    required_fix: 'Add font-family: Arial, sans-serif to html or body element',
    css_variable: '--ecl-font-family-default',
    warning: 'ECL reset.css does NOT set base font-family - you must add it manually'
  };

  // Icon sprite requirements
  const iconRequirements = {
    sprite_url: `${cdnBase}/dist/images/icons/sprites/icons.svg`,
    cors_note: 'Icons must be hosted on same domain or with CORS headers',
    usage_pattern: '<svg class="ecl-icon ecl-icon--m"><use xlink:href="/path/to/icons.svg#icon-name"></use></svg>',
    recommendation: 'Download sprite and host locally for production',
    available_sizes: ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl']
  };

  return {
    success: true,
    data: {
      preset: preset.toUpperCase(),
      cdn_version,
      stylesheets,
      scripts,
      html_boilerplate: htmlBoilerplate,
      initialization_script: initScript,
      font_requirements: fontRequirements,
      icon_requirements: iconRequirements,
      critical_notes: [
        '⚠️  ECL reset.css does NOT set base font-family - add <style>html { font-family: Arial, sans-serif !important; }</style>',
        '📍 Add class="no-js" to <html>, JavaScript will change to "has-js"',
        '🔧 Interactive components need data-ecl-auto-init attribute',
        '⚡ Call ECL.autoInit() after DOM is loaded for interactive components',
        '🎨 Icon sprites must be same-origin or served with CORS headers'
      ],
      next_steps: [
        '1. Copy the HTML boilerplate to start your page',
        '2. Add the font-family fix in <head>',
        '3. Add your content inside <main class="ecl-container">',
        '4. For interactive components, include the initialization script',
        '5. Test with ECL validation tools before deployment'
      ]
    },
    metadata: {
      tool: 'ecl_get_page_requirements',
      execution_time_ms: Date.now() - startTime,
      version: '2.0'
    }
  };
}

/**
 * Generate complete HTML boilerplate
 */
function generateHTMLBoilerplate(preset, stylesheets, scripts, version) {
  const styleLinks = stylesheets.map(s => 
    `  <link rel="stylesheet" href="${s.url}" media="${s.media}" />`
  ).join('\n');

  const scriptTags = scripts.map(s => 
    `  <script src="${s.url}"${s.defer ? ' defer' : ''}></script>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ECL ${preset.toUpperCase()} Page</title>
  
  <!-- ECL ${preset.toUpperCase()} Styles (v${version}) -->
${styleLinks}
  
  <!-- CRITICAL FIX: ECL reset.css does NOT set base font-family -->
  <style>
    html {
      font-family: Arial, sans-serif !important;
    }
  </style>
  
  <!-- Change no-js to has-js when JavaScript loads -->
  <script>
    document.documentElement.classList.remove('no-js');
    document.documentElement.classList.add('has-js');
  </script>
</head>
<body>
  <!-- Your ECL components go here -->
  <main class="ecl-container">
    <h1 class="ecl-u-type-heading-1">Page Title</h1>
    <p class="ecl-u-type-paragraph">Your content here.</p>
  </main>
  
  <!-- ECL ${preset.toUpperCase()} Scripts -->
${scriptTags}
${scripts.length > 0 ? `  
  <!-- Initialize ECL components -->
  <script>
    if (typeof ECL !== 'undefined') {
      ECL.autoInit();
    }
  </script>` : ''}
</body>
</html>`;
}

/**
 * Generate initialization script for specific components
 */
function generateInitScript(components) {
  if (!components || components.length === 0) {
    return `// No interactive components detected
// If you add interactive components later, use:
// ECL.autoInit();`;
  }

  const componentClasses = components.map(c => {
    const normalized = c.toLowerCase().replace(/\s+/g, '-');
    return normalized.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
  });

  return `// Initialize ECL components automatically
ECL.autoInit();

// Or initialize specific components manually:
${componentClasses.map(cls => `// ECL.${cls}.initAll();`).join('\n')}

// Or initialize a specific instance:
${componentClasses.map(cls => `// const ${cls.toLowerCase()}Element = document.querySelector('.ecl-${cls.toLowerCase()}');
// if (${cls.toLowerCase()}Element) {
//   new ECL.${cls}(${cls.toLowerCase()}Element);
// }`).join('\n\n')}`;
}

/**
 * Get CDN resources for offline development
 * @param {string} preset - 'ec' or 'eu'
 * @param {string} version - ECL version
 * @returns {Object} Download URLs for all resources
 */
export function getCDNResources(preset = 'ec', version = '4.11.1') {
  const base = `https://cdn.jsdelivr.net/npm/@ecl/preset-${preset}@${version}`;
  
  return {
    success: true,
    data: {
      preset: preset.toUpperCase(),
      version,
      resources: {
        styles: {
          main: `${base}/dist/styles/ecl-${preset}.css`,
          print: `${base}/dist/styles/ecl-${preset}-print.css`,
          reset: `${base}/dist/styles/optional/ecl-reset.css`
        },
        scripts: {
          main: `${base}/dist/scripts/ecl-${preset}.js`
        },
        images: {
          icons_sprite: `${base}/dist/images/icons/sprites/icons.svg`,
          logo_sprite: `${base}/dist/images/logo/sprites/logo.svg`
        },
        fonts: {
          note: 'ECL uses system fonts (Arial, sans-serif) - no web fonts needed'
        }
      },
      download_instructions: [
        '1. Download resources from URLs above',
        '2. Place in your project structure:',
        '   - CSS: /styles/',
        '   - JS: /scripts/',
        '   - Icons: /images/icons/',
        '   - Logos: /images/logo/',
        '3. Update HTML to reference local paths',
        '4. Ensure icon sprites are served from same origin (no CORS issues)'
      ]
    }
  };
}
