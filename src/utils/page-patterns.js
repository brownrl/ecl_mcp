/**
 * ECL Page Structure Patterns
 * 
 * Common page templates with component hierarchies,
 * nesting rules, and visual structure guides.
 */

/**
 * Page structure patterns
 */
const PAGE_PATTERNS = {
    'news-article': {
        name: 'News Article Page',
        description: 'Standard news or press release article with breadcrumb navigation and metadata',
        structure: [
            { level: 0, component: 'Site Header', required: true, note: 'Fixed site-wide header with navigation' },
            { level: 0, component: 'Breadcrumb', required: true, note: 'Navigation path to current page' },
            { level: 0, component: 'Page Header', required: true, note: 'Article title, metadata, and image' },
            { level: 0, component: 'Content Section', required: true, note: 'Main article content' },
            { level: 1, component: 'Typography', parent: 'Content Section', note: 'Headings and paragraphs' },
            { level: 1, component: 'Featured Media', parent: 'Content Section', optional: true, note: 'Images or video' },
            { level: 1, component: 'Quote', parent: 'Content Section', optional: true, note: 'Pull quotes or blockquotes' },
            { level: 0, component: 'Tag List', optional: true, note: 'Article tags or categories' },
            { level: 0, component: 'Social Share', optional: true, note: 'Social media sharing buttons' },
            { level: 0, component: 'Related Content', optional: true, note: 'Related articles or links' },
            { level: 0, component: 'Site Footer', required: true, note: 'Site-wide footer' }
        ],
        html_template: `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <!-- Head content from ecl_get_page_requirements -->
</head>
<body>
  <!-- Site Header -->
  <header class="ecl-site-header" data-ecl-auto-init="SiteHeader">
    <!-- Site header content -->
  </header>

  <!-- Breadcrumb -->
  <nav class="ecl-breadcrumb" aria-label="Breadcrumb">
    <!-- Breadcrumb items -->
  </nav>

  <!-- Page Header -->
  <div class="ecl-page-header">
    <div class="ecl-container">
      <div class="ecl-page-header__body">
        <h1 class="ecl-page-header__title">Article Title</h1>
        <p class="ecl-page-header__description">Article subtitle or summary</p>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <main class="ecl-container">
    <article class="ecl-u-mt-xl">
      <p class="ecl-u-type-paragraph-lead">Lead paragraph text</p>
      <p class="ecl-u-type-paragraph">Article content...</p>
      <!-- More content -->
    </article>

    <!-- Tags -->
    <div class="ecl-u-mt-xl">
      <!-- Tag components -->
    </div>
  </main>

  <!-- Site Footer -->
  <footer class="ecl-footer">
    <!-- Footer content -->
  </footer>
</body>
</html>`
    },

    'landing-page': {
        name: 'Landing Page',
        description: 'Homepage or campaign landing page with hero banner and content sections',
        structure: [
            { level: 0, component: 'Site Header', required: true },
            { level: 0, component: 'Page Banner', required: true, note: 'Hero section with CTA' },
            { level: 0, component: 'Content Sections', required: true },
            { level: 1, component: 'Featured Items', parent: 'Content Sections', note: 'Highlighted content cards' },
            { level: 1, component: 'Cards Grid', parent: 'Content Sections', note: '2-4 column card layout' },
            { level: 0, component: 'Call to Action', optional: true, note: 'CTA banner or section' },
            { level: 0, component: 'Site Footer', required: true }
        ],
        html_template: `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <!-- Head content -->
</head>
<body>
  <!-- Site Header -->
  <header class="ecl-site-header" data-ecl-auto-init="SiteHeader">
    <!-- Header -->
  </header>

  <!-- Hero Banner -->
  <section class="ecl-page-banner" data-ecl-auto-init="PageBanner">
    <div class="ecl-container">
      <h1 class="ecl-u-type-heading-1">Welcome</h1>
      <p class="ecl-u-type-paragraph-lead">Compelling message</p>
      <button class="ecl-button ecl-button--call">Learn More</button>
    </div>
  </section>

  <!-- Content Sections -->
  <main class="ecl-container ecl-u-pv-2xl">
    <!-- Featured Items -->
    <section class="ecl-u-mb-2xl">
      <h2 class="ecl-u-type-heading-2">Featured Content</h2>
      <div class="ecl-row">
        <!-- Cards in grid -->
      </div>
    </section>
  </main>

  <!-- Site Footer -->
  <footer class="ecl-footer">
    <!-- Footer -->
  </footer>
</body>
</html>`
    },

    'list-page': {
        name: 'List/Index Page',
        description: 'Filterable list or index page with search and pagination',
        structure: [
            { level: 0, component: 'Site Header', required: true },
            { level: 0, component: 'Breadcrumb', required: true },
            { level: 0, component: 'Page Header', required: true },
            { level: 0, component: 'Search Form', optional: true, note: 'Filter or search interface' },
            { level: 0, component: 'Filter Sidebar', optional: true, note: 'Faceted navigation' },
            { level: 0, component: 'Content List', required: true },
            { level: 1, component: 'List Items', parent: 'Content List', note: 'Repeating list items or cards' },
            { level: 0, component: 'Pagination', required: true, note: 'Navigate between pages' },
            { level: 0, component: 'Site Footer', required: true }
        ],
        html_template: `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <!-- Head content -->
</head>
<body>
  <!-- Site Header -->
  <header class="ecl-site-header" data-ecl-auto-init="SiteHeader">
    <!-- Header -->
  </header>

  <!-- Breadcrumb -->
  <nav class="ecl-breadcrumb" aria-label="Breadcrumb">
    <!-- Breadcrumb -->
  </nav>

  <!-- Page Header -->
  <div class="ecl-page-header">
    <div class="ecl-container">
      <h1 class="ecl-page-header__title">Content List</h1>
    </div>
  </div>

  <!-- Main Content -->
  <main class="ecl-container">
    <!-- Search/Filter -->
    <div class="ecl-u-mb-l">
      <!-- Search form -->
    </div>

    <!-- Results List -->
    <div class="ecl-row">
      <!-- List items or cards -->
    </div>

    <!-- Pagination -->
    <nav class="ecl-pagination" aria-label="Pagination">
      <!-- Pagination controls -->
    </nav>
  </main>

  <!-- Site Footer -->
  <footer class="ecl-footer">
    <!-- Footer -->
  </footer>
</body>
</html>`
    },

    'documentation-page': {
        name: 'Documentation Page',
        description: 'Technical documentation with sidebar navigation and code examples',
        structure: [
            { level: 0, component: 'Site Header', required: true },
            { level: 0, component: 'Breadcrumb', required: true },
            { level: 0, component: 'Page Layout (Sidebar)', required: true },
            { level: 1, component: 'Inpage Navigation', parent: 'Page Layout', required: true, note: 'Table of contents' },
            { level: 1, component: 'Main Content', parent: 'Page Layout', required: true },
            { level: 2, component: 'Typography', parent: 'Main Content', note: 'Headings, paragraphs' },
            { level: 2, component: 'Code Blocks', parent: 'Main Content', note: 'Syntax-highlighted code' },
            { level: 2, component: 'Tables', parent: 'Main Content', optional: true },
            { level: 2, component: 'Accordion', parent: 'Main Content', optional: true, note: 'Expandable sections' },
            { level: 0, component: 'Site Footer', required: true }
        ],
        html_template: `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <!-- Head content -->
</head>
<body>
  <!-- Site Header -->
  <header class="ecl-site-header" data-ecl-auto-init="SiteHeader">
    <!-- Header -->
  </header>

  <!-- Breadcrumb -->
  <nav class="ecl-breadcrumb" aria-label="Breadcrumb">
    <!-- Breadcrumb -->
  </nav>

  <!-- Page Content -->
  <div class="ecl-container">
    <div class="ecl-row">
      <!-- Sidebar Navigation -->
      <aside class="ecl-col-12 ecl-col-md-3">
        <nav class="ecl-inpage-navigation" data-ecl-auto-init="InpageNavigation">
          <!-- Table of contents -->
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="ecl-col-12 ecl-col-md-9">
        <h1 class="ecl-u-type-heading-1">Documentation Title</h1>
        <p class="ecl-u-type-paragraph">Content...</p>
        <!-- Code examples, tables, etc -->
      </main>
    </div>
  </div>

  <!-- Site Footer -->
  <footer class="ecl-footer">
    <!-- Footer -->
  </footer>
</body>
</html>`
    },

    'search-results': {
        name: 'Search Results Page',
        description: 'Search results with filters and result metadata',
        structure: [
            { level: 0, component: 'Site Header', required: true },
            { level: 0, component: 'Search Form', required: true, note: 'Prominent search box' },
            { level: 0, component: 'Filter Sidebar', optional: true },
            { level: 0, component: 'Results Summary', required: true, note: 'Count and search term' },
            { level: 0, component: 'Result Items', required: true },
            { level: 1, component: 'Result Card', parent: 'Result Items', note: 'Title, snippet, metadata' },
            { level: 0, component: 'Pagination', required: true },
            { level: 0, component: 'Site Footer', required: true }
        ],
        html_template: `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <!-- Head content -->
</head>
<body>
  <!-- Site Header -->
  <header class="ecl-site-header" data-ecl-auto-init="SiteHeader">
    <!-- Header -->
  </header>

  <!-- Search Section -->
  <section class="ecl-u-bg-grey-5 ecl-u-pv-l">
    <div class="ecl-container">
      <!-- Search form -->
      <p class="ecl-u-type-paragraph-s">Found 142 results for "keyword"</p>
    </div>
  </section>

  <!-- Main Content -->
  <main class="ecl-container ecl-u-pv-2xl">
    <div class="ecl-row">
      <!-- Optional Filters -->
      <aside class="ecl-col-12 ecl-col-md-3">
        <!-- Filter options -->
      </aside>

      <!-- Results -->
      <div class="ecl-col-12 ecl-col-md-9">
        <!-- Result items -->
        
        <!-- Pagination -->
        <nav class="ecl-pagination ecl-u-mt-xl" aria-label="Pagination">
          <!-- Pagination -->
        </nav>
      </div>
    </div>
  </main>

  <!-- Site Footer -->
  <footer class="ecl-footer">
    <!-- Footer -->
  </footer>
</body>
</html>`
    }
};

/**
 * Component nesting rules
 */
const NESTING_RULES = {
    'Site Header': {
        level: 'page',
        position: 'top',
        children_allowed: ['Menu', 'Search Form', 'Language Selector'],
        parent_forbidden: ['Main', 'Section', 'Article'],
        note: 'Must be direct child of <body>, before main content'
    },
    'Site Footer': {
        level: 'page',
        position: 'bottom',
        children_allowed: ['Footer Section', 'Link List', 'Social Media Links'],
        parent_forbidden: ['Main', 'Section', 'Article'],
        note: 'Must be direct child of <body>, after main content'
    },
    'Breadcrumb': {
        level: 'navigation',
        position: 'after-header',
        parent_recommended: 'body',
        note: 'Place after Site Header, before Page Header'
    },
    'Page Header': {
        level: 'page-section',
        position: 'top-of-content',
        children_allowed: ['Typography', 'Meta Information', 'Image'],
        note: 'Use once per page, contains page title'
    },
    'Card': {
        level: 'component',
        parent_recommended: 'Grid Container',
        children_required: ['Card Body'],
        children_optional: ['Card Header', 'Card Footer', 'Card Image'],
        note: 'Nest inside grid (.ecl-row) for layouts'
    },
    'Accordion': {
        level: 'component',
        parent_recommended: 'Main',
        children_required: ['Accordion Item'],
        note: 'Each item requires header and content'
    },
    'Modal': {
        level: 'overlay',
        parent_recommended: 'body',
        children_required: ['Modal Container', 'Modal Content'],
        note: 'Place at end of <body>, initialized with JavaScript'
    }
};

/**
 * Get all page patterns
 */
export function getAllPagePatterns() {
    const startTime = Date.now();

    return {
        success: true,
        data: {
            patterns: Object.entries(PAGE_PATTERNS).map(([key, pattern]) => ({
                id: key,
                ...pattern,
                component_count: pattern.structure.filter(s => s.required).length,
                optional_count: pattern.structure.filter(s => s.optional).length
            })),
            nesting_rules: NESTING_RULES,
            general_guidelines: [
                'Always start with Site Header and end with Site Footer',
                'Use Breadcrumb for navigational context (except on homepage)',
                'Wrap main content in <main class="ecl-container">',
                'Use Page Header for page titles and metadata',
                'Maintain semantic HTML structure (header, nav, main, article, section, footer)',
                'Apply ECL utility classes to semantic elements',
                'Test component hierarchy with ecl_validate_component_usage',
                'Use ecl_generate_complete_page for quick page scaffolding'
            ]
        },
        metadata: {
            tool: 'ecl_get_page_structure_patterns',
            execution_time_ms: Date.now() - startTime,
            source: 'ecl-static-data',
            version: '2.0',
            ecl_version: '4.11.1'
        }
    };
}

/**
 * Get specific page pattern
 */
export function getPagePattern(patternId) {
    const startTime = Date.now();
    const pattern = PAGE_PATTERNS[patternId];

    if (!pattern) {
        return {
            success: false,
            data: { pattern: null },
            errors: [{
                code: 'PATTERN_NOT_FOUND',
                message: `Page pattern "${patternId}" not found`,
                available: Object.keys(PAGE_PATTERNS)
            }],
            metadata: {
                tool: 'ecl_get_page_pattern',
                execution_time_ms: Date.now() - startTime
            }
        };
    }

    return {
        success: true,
        data: {
            pattern: {
                id: patternId,
                ...pattern,
                implementation_steps: generateImplementationSteps(pattern),
                required_components: pattern.structure.filter(s => s.required).map(s => s.component),
                optional_components: pattern.structure.filter(s => s.optional).map(s => s.component)
            }
        },
        metadata: {
            tool: 'ecl_get_page_pattern',
            execution_time_ms: Date.now() - startTime,
            source: 'ecl-static-data',
            version: '2.0'
        }
    };
}

/**
 * Generate implementation steps
 */
function generateImplementationSteps(pattern) {
    return [
        {
            step: 1,
            action: 'Create HTML boilerplate',
            command: 'Use ecl_get_page_requirements tool to generate complete page structure'
        },
        {
            step: 2,
            action: 'Add required components',
            components: pattern.structure.filter(s => s.required).map(s => s.component),
            command: 'Use ecl_get_complete_example for each component'
        },
        {
            step: 3,
            action: 'Add optional components',
            components: pattern.structure.filter(s => s.optional).map(s => s.component),
            note: 'Based on your content needs'
        },
        {
            step: 4,
            action: 'Validate structure',
            command: 'Use ecl_validate_component_usage to check hierarchy and attributes'
        },
        {
            step: 5,
            action: 'Test in browser',
            checklist: [
                'All components render correctly',
                'JavaScript initialization works',
                'Responsive layout adapts to mobile',
                'No console errors',
                'Font rendering is correct'
            ]
        }
    ];
}

/**
 * Get component nesting rules
 */
export function getComponentNestingRules(componentName) {
    const startTime = Date.now();
    const rules = NESTING_RULES[componentName];

    if (!rules) {
        return {
            success: false,
            data: { rules: null },
            errors: [{
                code: 'RULES_NOT_FOUND',
                message: `No specific nesting rules found for "${componentName}"`,
                note: 'Component may follow general HTML nesting rules'
            }],
            metadata: {
                tool: 'ecl_get_nesting_rules',
                execution_time_ms: Date.now() - startTime
            }
        };
    }

    return {
        success: true,
        data: {
            component: componentName,
            rules,
            examples: generateNestingExamples(componentName, rules)
        },
        metadata: {
            tool: 'ecl_get_nesting_rules',
            execution_time_ms: Date.now() - startTime,
            source: 'ecl-static-data',
            version: '2.0'
        }
    };
}

/**
 * Generate nesting examples
 */
function generateNestingExamples(componentName, rules) {
    const examples = {
        correct: `<!-- Correct nesting for ${componentName} -->`,
        incorrect: `<!-- Incorrect nesting for ${componentName} -->`
    };

    if (componentName === 'Card' && rules.parent_recommended === 'Grid Container') {
        examples.correct = `<div class="ecl-row">
  <div class="ecl-col-12 ecl-col-md-4">
    <article class="ecl-card">
      <div class="ecl-card__body">
        <!-- Card content -->
      </div>
    </article>
  </div>
</div>`;
        examples.incorrect = `<!-- Don't place cards directly in body -->
<article class="ecl-card">
  <div class="ecl-card__body">
    <!-- Card content -->
  </div>
</article>`;
    }

    return examples;
}
