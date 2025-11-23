#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const sqlite3 = require('sqlite3');
const { promisify } = require('util');
const path = require('path');

// Open database - use absolute path relative to this script
const dbPath = path.join(__dirname, 'ecl-database.sqlite');
const db = new sqlite3.Database(dbPath);
const dbAll = promisify(db.all.bind(db));

// Create MCP server
const server = new Server(
  {
    name: 'ecl-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool: about
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'start_here',
        description: 'CALL THIS FIRST! Essential setup guide with asset download script and quick start instructions. Returns complete workflow for building ECL pages. ALL other tools assume you have to read this first',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'search_documentation_pages',
        description: 'Search the EC Europa Component Library documentation. Returns matching pages with their titles, URLs, categories, and hierarchy information.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find relevant documentation pages',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 10)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_documentation_page',
        description: 'Get the complete HTML content of a specific documentation page by URL. Use this after searching to retrieve full code examples and detailed documentation.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The full URL of the page to retrieve (from search results)',
            },
            content: {
              type: 'boolean',
              description: 'If true (default), returns cleaned page content. If false, returns raw HTML.',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'get_documentation_page_examples',
        description: 'Get code examples from a specific documentation page by URL. Returns only the code blocks with their labels, making it faster than parsing full HTML.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The full URL of the page to retrieve examples from (from search results)',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'get_starter_template',
        description: 'Get a basic HTML starter template with proper ECL local assets setup, ready to use. Use this as the foundation before adding ECL components. Returns a complete HTML page with correct script tags, CSS links, and local asset URLs.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Page title (optional, defaults to "ECL Page")',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_documentation_pages_list',
        description: 'Get the complete list of all pages in the ECL documentation database. Returns URL, title, category, and hierarchy information for all 159 pages.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'list_recipes',
        description: 'List all ECL recipes - pre-built component combinations and patterns. Returns all recipes sorted by ID with metadata. More comprehensive than individual component docs.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_recipe',
        description: 'Get the complete recipe by ID. Returns full markdown content with step-by-step instructions, code examples, and best practices. Use this after recipe_search to get implementation details.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Recipe ID from recipe_search results',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'search_examples',
        description: 'Search all code examples using natural language queries. Returns matching examples with their code, labels, and source page URLs. Useful for finding specific HTML patterns, component implementations, or usage examples.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find relevant code examples (e.g., "button primary", "checkbox required", "form validation")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 10)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_example',
        description: 'Get a specific code example from a page by URL and label or index. Use this after search_examples to retrieve a targeted example without fetching the entire page.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The page URL (from search results)',
            },
            label: {
              type: 'string',
              description: 'The example label to match (e.g., "Primary button"). Case-insensitive partial matching supported.',
            },
            index: {
              type: 'number',
              description: 'The example index (0-based). Use when label is not unique or unknown.',
            },
          },
          required: ['url'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'start_here') {
    return {
      content: [
        {
          type: 'text',
          text: `# EC Europa Component Library MCP Server

Access the European Commission's official Component Library (ECL) documentation.

## ⚡ Quick Start

### Step 1: Download Assets (Required First!)

Create this script as \`download-ecl-assets.sh\`:

\`\`\`bash
#!/bin/bash

# ECL Assets Download Script
# Downloads all necessary ECL assets for local development

set -e

ECL_VERSION="4.11.1"
BASE_URL="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v\${ECL_VERSION}/ec"

echo "Downloading ECL v\${ECL_VERSION} assets..."

# Create directory structure
mkdir -p assets/css
mkdir -p assets/js
mkdir -p assets/icons
mkdir -p assets/images/logo/positive
mkdir -p assets/images/logo/negative

# Download CSS files
echo "Downloading CSS files..."
curl -o assets/css/ecl-reset.css "\${BASE_URL}/styles/optional/ecl-reset.css"
curl -o assets/css/ecl-ec.css "\${BASE_URL}/styles/ecl-ec.css"
curl -o assets/css/ecl-ec-utilities.css "\${BASE_URL}/styles/optional/ecl-ec-utilities.css"
curl -o assets/css/ecl-ec-print.css "\${BASE_URL}/styles/optional/ecl-ec-print.css"

# Download JavaScript
echo "Downloading JavaScript files..."
curl -o assets/js/ecl-ec.js "\${BASE_URL}/scripts/ecl-ec.js"

# Download icon sprite
echo "Downloading icon sprites..."
curl -o assets/icons/icons.svg "\${BASE_URL}/images/icons/sprites/icons.svg"
curl -o assets/icons/icons-social-media.svg "\${BASE_URL}/images/icons/sprites/icons-social-media.svg"

# Download logos
echo "Downloading logos..."
curl -o assets/icons/logo-ec.svg "\${BASE_URL}/images/logo/positive/logo-ec--en.svg"
curl -o assets/icons/logo-ec-negative.svg "\${BASE_URL}/images/logo/negative/logo-ec--en.svg"

# Download additional common logos
curl -o assets/images/logo/positive/logo-ec--mute.svg "\${BASE_URL}/images/logo/positive/logo-ec--mute.svg"
curl -o assets/images/logo/negative/logo-ec--mute.svg "\${BASE_URL}/images/logo/negative/logo-ec--mute.svg"

echo "Download complete!"
echo "Assets downloaded to assets/ directory"
\`\`\`

Then run:
\`\`\`bash
chmod +x download-ecl-assets.sh
./download-ecl-assets.sh
\`\`\`

### Step 2: Get Complete HTML Template
\`\`\`
get_starter_template(title="My Page")
\`\`\`
Returns full HTML page with header, footer, navigation, and ECL initialized.

### Step 3: Find & Add Components
\`\`\`
search_examples(query="card")
\`\`\`
Copy HTML into template's \`<main>\` section. Components auto-initialize.

---

## 🛠️ Tools

**Start here:** \`get_starter_template\` - Complete HTML boilerplate

**Find components:** \`search_examples\`, \`get_example\`, \`search_documentation_pages\`

**Advanced:** \`list_recipes\`, \`recipe_get\`, \`get_documentation_page\`, \`get_documentation_pages_list\`, \`get_documentation_page_examples\`

---

**ECL v4.11.1** | 159 pages, 270 examples | https://ec.europa.eu/component-library/`,
        },
      ],
    };
  }

  if (name === 'get_documentation_page') {
    const url = args.url;
    const useContent = args.content !== false; // Default to true

    try {
      const field = useContent ? 'content' : 'html';
      const result = await dbAll(
        `SELECT url, title, category, ${field} FROM pages WHERE url = ? LIMIT 1`,
        [url]
      );

      if (result.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `Page not found: "${url}"\n\nUse the search tool first to find available pages.`,
            },
          ],
        };
      }

      const page = result[0];
      const pageData = useContent ? page.content : page.html;
      const dataType = useContent ? 'Page Content' : 'Raw HTML';

      let output = `# ${page.title}\n\n`;
      output += `**URL:** ${page.url}\n`;
      output += `**Category:** ${page.category}\n`;
      output += `**Type:** ${dataType}\n\n`;
      output += `## ${dataType}\n\n${pageData}`;

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving page: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === 'get_documentation_page_examples') {
    const url = args.url;

    try {
      // Get page
      const pageResult = await dbAll(
        'SELECT id, title, category FROM pages WHERE url = ? LIMIT 1',
        [url]
      );

      if (pageResult.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `Page not found: "${url}"\n\nUse the search tool first to find available pages.`,
            },
          ],
        };
      }

      const page = pageResult[0];

      // Get examples
      const examples = await dbAll(
        'SELECT code, label, position FROM examples WHERE page_id = ? ORDER BY position',
        [page.id]
      );

      if (examples.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No code examples found for: ${page.title}\n\nThis page may not contain code examples, or it hasn't been crawled yet.`,
            },
          ],
        };
      }

      let output = `# Code Examples: ${page.title}\n\n`;
      output += `**URL:** ${url}\n`;
      output += `**Category:** ${page.category}\n`;
      output += `**Found ${examples.length} example(s)**\n\n`;

      examples.forEach((example, index) => {
        if (example.label) {
          output += `## Example ${index + 1}: ${example.label}\n\n`;
        } else {
          output += `## Example ${index + 1}\n\n`;
        }
        output += `\`\`\`html\n${example.code}\n\`\`\`\n\n`;
      });

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving examples: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === 'get_starter_template') {
    const title = args.title || 'ECL Page';

    const template = `<!DOCTYPE html>
<html lang="en" class="no-js">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Basic Web Page</title>
  <script>
    document.documentElement.classList.remove('no-js');
    document.documentElement.classList.add('has-js');
  </script>
  <link rel="stylesheet" href="assets/css/ecl-reset.css" />
  <link rel="stylesheet" href="assets/css/ecl-ec.css" />
  <link rel="stylesheet" href="assets/css/ecl-ec-utilities.css" />
  <link rel="stylesheet" href="assets/css/ecl-ec-print.css" media="print" />
</head>

<body>
  <header class="ecl-site-header ecl-site-header--has-menu" data-ecl-auto-init="SiteHeader">
    <div class="ecl-site-header__inner">
      <div class="ecl-site-header__background">
        <div class="ecl-site-header__header">
          <div class="ecl-site-header__container ecl-container">
            <div class="ecl-site-header__top" data-ecl-site-header-top>
              <a href="#main-content" class="ecl-link ecl-link--standalone ecl-site-header__logo-link">
                <picture class="ecl-picture ecl-site-header__picture">
                  <source srcset="assets/icons/logo-ec.svg" media="(min-width: 996px)">
                  <img class="ecl-site-header__logo-image" src="assets/icons/logo-ec.svg" alt="European Commission">
                </picture>
              </a>
              <div class="ecl-site-header__action">
                <div class="ecl-site-header__language">
                  <a class="ecl-button ecl-button--tertiary ecl-site-header__language-selector" href="#" role="button"
                    aria-label="Change language, current language is English - EN" aria-controls="language-list-overlay" aria-expanded="false" data-ecl-language-selector>
                    <span class="ecl-site-header__language-icon">
                      <svg class="ecl-icon ecl-icon--s ecl-site-header__icon" focusable="false" aria-hidden="false"
                        role="img">
                        <title>EN</title>
                        <use xlink:href="assets/icons/icons.svg#global"></use>
                      </svg>
                    </span>
                    EN
                  </a>
                  <div class="ecl-site-header__language-container" id="language-list-overlay" hidden data-ecl-language-list-overlay aria-labelledby="ecl-site-header__language-title" role="dialog">
                    <div class="ecl-site-header__language-header">
                      <div class="ecl-site-header__language-title" id="ecl-site-header__language-title">Select your language</div>
                      <button class="ecl-button ecl-button--tertiary ecl-site-header__language-close ecl-button--icon-only" type="button" data-ecl-language-list-close>
                        <span class="ecl-button__container">
                          <span class="ecl-button__label" data-ecl-label="true">Close</span>
                          <svg class="ecl-icon ecl-icon--m ecl-button__icon" focusable="false" aria-hidden="true" data-ecl-icon>
                            <use xlink:href="assets/icons/icons.svg#close"></use>
                          </svg>
                        </span>
                      </button>
                    </div>
                    <div class="ecl-site-header__language-content" data-ecl-language-list-content>
                      <ul class="ecl-site-header__language-list">
                        <li class="ecl-site-header__language-item">
                          <a href="#" class="ecl-link ecl-link--standalone ecl-link--no-visited ecl-site-header__language-link ecl-site-header__language-link--active" hreflang="en">
                            <span class="ecl-site-header__language-link-code">en</span>
                            <span class="ecl-site-header__language-link-label" lang="en">English</span>
                          </a>
                        </li>
                        <li class="ecl-site-header__language-item">
                          <a href="#" class="ecl-link ecl-link--standalone ecl-link--no-visited ecl-site-header__language-link" hreflang="fr">
                            <span class="ecl-site-header__language-link-code">fr</span>
                            <span class="ecl-site-header__language-link-label" lang="fr">français</span>
                          </a>
                        </li>
                        <li class="ecl-site-header__language-item">
                          <a href="#" class="ecl-link ecl-link--standalone ecl-link--no-visited ecl-site-header__language-link" hreflang="de">
                            <span class="ecl-site-header__language-link-code">de</span>
                            <span class="ecl-site-header__language-link-label" lang="de">Deutsch</span>
                          </a>
                        </li>
                        <li class="ecl-site-header__language-item">
                          <a href="#" class="ecl-link ecl-link--standalone ecl-link--no-visited ecl-site-header__language-link" hreflang="es">
                            <span class="ecl-site-header__language-link-code">es</span>
                            <span class="ecl-site-header__language-link-label" lang="es">español</span>
                          </a>
                        </li>
                        <li class="ecl-site-header__language-item">
                          <a href="#" class="ecl-link ecl-link--standalone ecl-link--no-visited ecl-site-header__language-link" hreflang="it">
                            <span class="ecl-site-header__language-link-code">it</span>
                            <span class="ecl-site-header__language-link-label" lang="it">italiano</span>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div class="ecl-site-header__search-container" role="search">
                  <a class="ecl-button ecl-button--tertiary ecl-site-header__search-toggle" href="#"
                    aria-controls="search-form-id" aria-expanded="false">
                    <svg class="ecl-icon ecl-icon--s ecl-site-header__icon" focusable="false" aria-hidden="false"
                      role="img">
                      <title>Search</title>
                      <use xlink:href="assets/icons/icons.svg#search"></use>
                    </svg>
                    Search
                  </a>
                  <form class="ecl-search-form ecl-site-header__search" role="search" id="search-form-id">
                    <div class="ecl-form-group">
                      <label for="search-input-id" id="search-input-id-label"
                        class="ecl-form-label ecl-search-form__label">Search</label>
                      <input id="search-input-id" class="ecl-text-input ecl-text-input--m ecl-search-form__text-input"
                        type="search" placeholder="Search">
                    </div>
                    <button class="ecl-button ecl-button--ghost ecl-search-form__button" type="submit">
                      <span class="ecl-button__container">
                        <svg class="ecl-icon ecl-icon--xs ecl-button__icon" focusable="false" aria-hidden="true">
                          <use xlink:href="assets/icons/icons.svg#search"></use>
                        </svg>
                        <span class="ecl-button__label">Search</span>
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="ecl-site-header__banner">
      <div class="ecl-container">
        <div class="ecl-site-header__site-name">European Commission ECL Page</div>
      </div>
    </div>
    <nav class="ecl-menu" data-ecl-menu data-ecl-auto-init="Menu" aria-expanded="false" role="navigation"
      aria-label="Main navigation">
      <div class="ecl-menu__overlay"></div>
      <div class="ecl-container ecl-menu__container">
        <button class="ecl-button ecl-button--tertiary ecl-menu__open ecl-button--icon-only" type="button"
          data-ecl-menu-open aria-expanded="false">
          <span class="ecl-button__container">
            <svg class="ecl-icon ecl-icon--m ecl-button__icon" focusable="false" aria-hidden="true" data-ecl-icon>
              <use xlink:href="assets/icons/icons.svg#hamburger"></use>
            </svg>
            <svg class="ecl-icon ecl-icon--m ecl-button__icon" focusable="false" aria-hidden="true" data-ecl-icon>
              <use xlink:href="assets/icons/icons.svg#close"></use>
            </svg>
            <span class="ecl-button__label" data-ecl-label="true">Menu</span>
          </span>
        </button>
        <section class="ecl-menu__inner" data-ecl-menu-inner aria-label="Menu">
          <header class="ecl-menu__inner-header">
            <button class="ecl-button ecl-button--ghost ecl-menu__close ecl-button--icon-only" type="submit"
              data-ecl-menu-close>
              <span class="ecl-button__container">
                <span class="ecl-button__label" data-ecl-label="true">Close</span>
                <svg class="ecl-icon ecl-icon--m ecl-button__icon" focusable="false" aria-hidden="true" data-ecl-icon>
                  <use xlink:href="assets/icons/icons.svg#close"></use>
                </svg>
              </span>
            </button>
            <div class="ecl-menu__title">Menu</div>
            <button class="ecl-button ecl-button--ghost ecl-menu__back" type="submit" data-ecl-menu-back>
              <span class="ecl-button__container">
                <svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-270 ecl-button__icon" focusable="false"
                  aria-hidden="true" data-ecl-icon>
                  <use xlink:href="assets/icons/icons.svg#corner-arrow"></use>
                </svg>
                <span class="ecl-button__label" data-ecl-label="true">Back</span>
              </span>
            </button>
          </header>
          <button class="ecl-button ecl-button--ghost ecl-menu__item ecl-menu__items-previous ecl-button--icon-only"
            type="button" data-ecl-menu-items-previous tabindex="-1">
            <span class="ecl-button__container">
              <svg class="ecl-icon ecl-icon--s ecl-icon--rotate-270 ecl-button__icon" focusable="false"
                aria-hidden="true" data-ecl-icon>
                <use xlink:href="assets/icons/icons.svg#corner-arrow"></use>
              </svg>
              <span class="ecl-button__label" data-ecl-label="true">Previous items</span>
            </span>
          </button>
          <button class="ecl-button ecl-button--ghost ecl-menu__item ecl-menu__items-next ecl-button--icon-only"
            type="button" data-ecl-menu-items-next tabindex="-1">
            <span class="ecl-button__container">
              <svg class="ecl-icon ecl-icon--s ecl-icon--rotate-90 ecl-button__icon" focusable="false"
                aria-hidden="true" data-ecl-icon>
                <use xlink:href="assets/icons/icons.svg#corner-arrow"></use>
              </svg>
              <span class="ecl-button__label" data-ecl-label="true">Next items</span>
            </span>
          </button>
          <ul class="ecl-menu__list" data-ecl-menu-list>
            <li class="ecl-menu__item ecl-menu__item--current" data-ecl-menu-item id="ecl-menu-item-0">
              <a href="/" class="ecl-link ecl-link--standalone ecl-menu__link ecl-menu__link--current"
                data-ecl-menu-link id="ecl-menu-item-0-link" aria-current="page">Home</a>
            </li>
            <li class="ecl-menu__item" data-ecl-menu-item id="ecl-menu-item-1">
              <a href="/about" class="ecl-link ecl-link--standalone ecl-menu__link" data-ecl-menu-link
                id="ecl-menu-item-1-link">About</a>
            </li>
            <li class="ecl-menu__item ecl-menu__item--has-children" data-ecl-menu-item data-ecl-has-children
              aria-haspopup aria-expanded="false" id="ecl-menu-item-2">
              <a href="/surveys" class="ecl-link ecl-link--standalone ecl-menu__link" data-ecl-menu-link
                id="ecl-menu-item-2-link">Surveys</a>
              <button class="ecl-button ecl-button--ghost ecl-menu__button-caret ecl-button--icon-only" type="button"
                data-ecl-menu-caret aria-label="Access item's children" aria-describedby="ecl-menu-item-2-link"
                aria-expanded="false">
                <span class="ecl-button__container">
                  <svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-180 ecl-button__icon" focusable="false"
                    aria-hidden="true" data-ecl-icon>
                    <use xlink:href="assets/icons/icons.svg#corner-arrow"></use>
                  </svg>
                </span>
              </button>
              <div class="ecl-menu__mega" data-ecl-menu-mega>
                <ul class="ecl-menu__sublist">
                  <li class="ecl-menu__subitem" data-ecl-menu-subitem>
                    <a href="/surveys/active" class="ecl-link ecl-link--standalone ecl-menu__sublink">Active Surveys</a>
                  </li>
                  <li class="ecl-menu__subitem" data-ecl-menu-subitem>
                    <a href="/surveys/results" class="ecl-link ecl-link--standalone ecl-menu__sublink">Survey
                      Results</a>
                  </li>
                  <li class="ecl-menu__subitem" data-ecl-menu-subitem>
                    <a href="/surveys/archive" class="ecl-link ecl-link--standalone ecl-menu__sublink">Archive</a>
                  </li>
                </ul>
              </div>
            </li>
            <li class="ecl-menu__item" data-ecl-menu-item id="ecl-menu-item-3">
              <a href="/resources" class="ecl-link ecl-link--standalone ecl-menu__link" data-ecl-menu-link
                id="ecl-menu-item-3-link">Resources</a>
            </li>
            <li class="ecl-menu__item" data-ecl-menu-item id="ecl-menu-item-4">
              <a href="/contact" class="ecl-link ecl-link--standalone ecl-menu__link" data-ecl-menu-link
                id="ecl-menu-item-4-link">Contact</a>
            </li>
          </ul>
        </section>
      </div>
    </nav>
  </header>

  <main id="main-content" class="ecl-u-type-m">
    <div class="ecl-container">
      <div class="ecl-u-pv-xl">
        <h1 class="ecl-u-type-heading-1">Sample Page</h1>
        <p class="ecl-u-type-paragraph-lead ecl-u-mt-m">This is a sample page demonstrating the Europa Component Library
          (ECL) with locally hosted assets.</p>

        <div class="ecl-u-mt-xl">
          <h2 class="ecl-u-type-heading-2">About This Page</h2>
          <p class="ecl-u-type-paragraph ecl-u-mt-m">This is a demonstration page built with the Europa Component
            Library (ECL). All assets including CSS, JavaScript, icons, and logos are hosted locally.</p>

          <div class="ecl-u-mt-l">
            <h3 class="ecl-u-type-heading-3">Components Included</h3>
            <ul class="ecl-unordered-list ecl-u-mt-m">
              <li class="ecl-unordered-list__item">Site Header with logo, language selector, and search</li>
              <li class="ecl-unordered-list__item">Responsive typography and spacing utilities</li>
              <li class="ecl-unordered-list__item">Site Footer with links and social media icons</li>
              <li class="ecl-unordered-list__item">ECL styling system with locally hosted assets</li>
            </ul>
          </div>

          <div class="ecl-u-mt-l">
            <h3 class="ecl-u-type-heading-3">Local Assets</h3>
            <p class="ecl-u-type-paragraph ecl-u-mt-m">All required assets are stored in the assets directory:</p>
            <ul class="ecl-unordered-list ecl-u-mt-m">
              <li class="ecl-unordered-list__item">CSS files: ecl-ec.css, ecl-reset.css</li>
              <li class="ecl-unordered-list__item">JavaScript: ecl-ec.js</li>
              <li class="ecl-unordered-list__item">Icons: SVG sprite files</li>
              <li class="ecl-unordered-list__item">Logo: European Commission logo (EN)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </main>

  <footer class="ecl-site-footer ecl-site-footer--split-columns">
    <div class="ecl-container ecl-site-footer__container">
      <div class="ecl-site-footer__row">
        <div class="ecl-site-footer__column">
          <div class="ecl-site-footer__section">
            <a href="#main-content" class="ecl-link ecl-link--standalone ecl-site-footer__logo-link">
              <picture class="ecl-picture ecl-site-footer__picture">
                <source srcset="assets/icons/logo-ec-negative.svg" media="(min-width: 996px)">
                <img class="ecl-site-footer__logo-image" src="assets/icons/logo-ec-negative.svg"
                  alt="European Commission">
              </picture>
            </a>
            <div class="ecl-site-footer__description">
              This site is managed by:<br />Europa Component Library Demo
            </div>
          </div>
        </div>
        <div class="ecl-site-footer__column">
          <div class="ecl-site-footer__section ecl-site-footer__section--separator">
            <ul class="ecl-site-footer__list ecl-site-footer__list--columns">
              <li class="ecl-site-footer__list-item"><a href="https://commission.europa.eu/about-european-commission_en"
                  class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">About the European
                  Commission</a></li>
              <li class="ecl-site-footer__list-item"><a href="https://commission.europa.eu/business-economy-euro_en"
                  class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">Business, Economy,
                  Euro</a></li>
              <li class="ecl-site-footer__list-item"><a href="https://commission.europa.eu/live-work-travel-eu_en"
                  class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">Live, work, travel in
                  the EU</a></li>
            </ul>
          </div>
          <div class="ecl-site-footer__section">
            <ul class="ecl-site-footer__list">
              <li class="ecl-site-footer__list-item"><a
                  href="https://commission.europa.eu/about-european-commission/contact_en"
                  class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">Contact the European
                  Commission</a></li>
              <li class="ecl-site-footer__list-item"><a href="https://commission.europa.eu/accessibility-statement_en"
                  class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">Accessibility</a></li>
            </ul>
          </div>
          <div class="ecl-site-footer__section ecl-site-footer__section--split-list">
            <ul class="ecl-site-footer__list">
              <li class="ecl-site-footer__list-item"><a href="https://commission.europa.eu/languages-our-websites_en"
                  class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">Languages on our
                  websites</a></li>
              <li class="ecl-site-footer__list-item"><a href="https://commission.europa.eu/cookies_en"
                  class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">Cookies</a></li>
              <li class="ecl-site-footer__list-item"><a href="https://commission.europa.eu/privacy-policy_en"
                  class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">Privacy policy</a></li>
              <li class="ecl-site-footer__list-item"><a href="https://commission.europa.eu/legal-notice_en"
                  class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">Legal notice</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </footer>

  <script src="assets/js/ecl-ec.js"></script>
  <script>
    ECL.autoInit();
  </script>
</body>

</html>
`;

    return {
      content: [
        {
          type: 'text',
          text: `# ECL HTML Starter Template

**Title:** ${title}

## Ready-to-use template:

\`\`\`html
${template}
\`\`\`

## Next Steps:
1. Save this as an HTML file
2. Use the 'search' tool to find components you need (e.g., "site header", "button", "footer")
3. Use 'get_examples' to retrieve component HTML code
4. Insert component code in the body section
5. All components with data-ecl-auto-init attributes will be initialized automatically

## CDN Resources Used:
- EC CDN: https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/
- CSS: Reset, Main styles, Utilities, Print styles
- JS: ECL JavaScript with autoInit

Icons and logos from same CDN:
- Icons: images/icons/sprites/icons.svg
- Logos: images/logo/positive/ or negative/`,
        },
      ],
    };
  }

  if (name === 'get_documentation_pages_list') {
    try {
      const results = await dbAll(
        `SELECT 
          url,
          title,
          category,
          hierarchy_1,
          hierarchy_2,
          hierarchy_3,
          hierarchy_4
         FROM pages
         ORDER BY category, hierarchy_1, hierarchy_2, hierarchy_3, hierarchy_4`
      );

      // Build JSON structure
      const pages = results.map(page => {
        const path = [
          page.hierarchy_1,
          page.hierarchy_2,
          page.hierarchy_3,
          page.hierarchy_4,
        ].filter(h => h);

        return {
          title: page.title,
          url: page.url,
          category: page.category,
          path: path,
          type: path[path.length - 1] || null, // Last element in path (e.g., "api", "code", "usage")
        };
      });

      const indexData = {
        total: results.length,
        pages: pages,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(indexData, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving index: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === 'search_documentation_pages') {
    const query = args.query.toLowerCase(); // Lowercase since FTS content is lowercased
    const limit = args.limit || 10;

    try {
      // Build smart FTS query:
      // 1. Try exact phrase first (quoted)
      // 2. Try normalized compound word (no spaces/hyphens)
      // 3. Fall back to AND for multi-word
      const words = query.split(/\s+/);
      let ftsQueries = [];

      if (words.length > 1) {
        // Try as exact phrase
        ftsQueries.push(`\"${query}\"`);
        // Try as compound word (datepicker, textfield, etc)
        ftsQueries.push(words.join(''));
        // Try with hyphen
        ftsQueries.push(words.join('-'));
        // Fall back to AND
        ftsQueries.push(words.join(' AND '));
      } else {
        ftsQueries.push(query);
      }

      // Try each query in order until we get results
      let results = [];
      for (const ftsQuery of ftsQueries) {
        try {
          results = await dbAll(
            `SELECT 
              p.id,
              p.url,
              p.title,
              p.category,
              p.hierarchy_1,
              p.hierarchy_2,
              p.hierarchy_3,
              p.hierarchy_4,
              snippet(pages_fts, 1, '<mark>', '</mark>', '...', 50) as snippet
             FROM pages_fts
             JOIN pages p ON pages_fts.rowid = p.id
             WHERE pages_fts MATCH ?
             ORDER BY rank
             LIMIT ?`,
            [ftsQuery, limit]
          );

          if (results.length > 0) {
            break; // Found results, stop trying
          }
        } catch (e) {
          // Query syntax error, try next variant
          continue;
        }
      }

      if (results.length === 0) {
        const words = query.split(/\s+/);
        const suggestion = words.length > 1 
          ? `Try searching with just one word (e.g., "${words[0]}" instead of "${query}")`
          : null;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                query: query,
                total: 0,
                results: [],
                suggestion: suggestion
              }, null, 2),
            },
          ],
        };
      }

      // Check for examples and sister pages for each page
      const resultsWithExamples = await Promise.all(
        results.map(async (result) => {
          const exampleCount = await dbAll(
            'SELECT COUNT(*) as count FROM examples WHERE page_id = ?',
            [result.id]
          );

          const hierarchy = [
            result.hierarchy_1,
            result.hierarchy_2,
            result.hierarchy_3,
            result.hierarchy_4,
          ].filter(h => h);

          // Find sister pages (same hierarchy except last field)
          // The last non-null hierarchy field is the page type (usage/code/api)
          let sisterPages = [];
          const sisterTypes = ['usage', 'code', 'api'];

          // Determine which hierarchy level contains the page type
          let pageType = null;
          let hierarchyLevel = null;

          if (result.hierarchy_4 && sisterTypes.includes(result.hierarchy_4)) {
            pageType = result.hierarchy_4;
            hierarchyLevel = 4;
          } else if (result.hierarchy_3 && sisterTypes.includes(result.hierarchy_3)) {
            pageType = result.hierarchy_3;
            hierarchyLevel = 3;
          } else if (result.hierarchy_2 && sisterTypes.includes(result.hierarchy_2)) {
            pageType = result.hierarchy_2;
            hierarchyLevel = 2;
          }

          if (pageType && hierarchyLevel) {
            // Build condition to match siblings
            const conditions = [];
            const params = [];

            // Match all hierarchy levels before the page type
            if (hierarchyLevel >= 2 && result.hierarchy_1) {
              conditions.push('hierarchy_1 = ?');
              params.push(result.hierarchy_1);
            }
            if (hierarchyLevel >= 3 && result.hierarchy_2) {
              conditions.push('hierarchy_2 = ?');
              params.push(result.hierarchy_2);
            }
            if (hierarchyLevel >= 4 && result.hierarchy_3) {
              conditions.push('hierarchy_3 = ?');
              params.push(result.hierarchy_3);
            }

            // Ensure levels after page type are null
            if (hierarchyLevel === 2) {
              conditions.push('hierarchy_3 IS NULL');
              conditions.push('hierarchy_4 IS NULL');
            } else if (hierarchyLevel === 3) {
              conditions.push('hierarchy_4 IS NULL');
            }

            const whereClause = conditions.join(' AND ');
            const hierarchyField = `hierarchy_${hierarchyLevel}`;

            const sisters = await dbAll(
              `SELECT url, title, ${hierarchyField} as page_type FROM pages WHERE ${whereClause} AND ${hierarchyField} != ?`,
              [...params, pageType]
            );

            sisterPages = sisters.map(s => ({
              type: s.page_type,
              url: s.url,
              title: s.title,
              get_page_call: `get_documentation_page(url="${s.url}")`
            }));
          }

          return {
            title: result.title,
            url: result.url,
            category: result.category,
            hierarchy: hierarchy,
            snippet: result.snippet,
            has_examples: exampleCount[0].count > 0,
            example_count: exampleCount[0].count,
            related_pages: sisterPages.length > 0 ? sisterPages : undefined,
            get_examples_call: exampleCount[0].count > 0
              ? `get_documentation_page_examples(url="${result.url}")`
              : null,
            get_page_call: `get_documentation_page(url="${result.url}")`
          };
        })
      );

      const output = {
        query: query,
        total: results.length,
        results: resultsWithExamples
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(output, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === 'list_recipes') {
    try {
      const results = await dbAll(
        `SELECT 
          id,
          title,
          description,
          difficulty,
          components_used,
          keywords,
          created_at
         FROM recipes
         ORDER BY id ASC`
      );

      const output = {
        total: results.length,
        recipes: results.map(recipe => ({
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          difficulty: recipe.difficulty,
          components_used: recipe.components_used,
          keywords: recipe.keywords,
          created_at: recipe.created_at,
          get_recipe_call: `get_recipe(id=${recipe.id})`
        }))
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(output, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing recipes: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === 'get_recipe') {
    const id = args.id;

    try {
      const result = await dbAll(
        `SELECT 
          id,
          title,
          description,
          markdown,
          html,
          keywords,
          difficulty,
          components_used,
          created_at
         FROM recipes
         WHERE id = ?
         LIMIT 1`,
        [id]
      );

      if (result.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `Recipe not found: ID ${id}\n\nUse 'recipe_search' to find available recipes.`,
            },
          ],
        };
      }

      const recipe = result[0];
      let output = `# ${recipe.title}\n\n`;
      output += `**Recipe ID:** ${recipe.id}\n`;
      output += `**Difficulty:** ${recipe.difficulty || 'Not specified'}\n`;
      output += `**Components Used:** ${recipe.components_used}\n`;
      output += `**Keywords:** ${recipe.keywords}\n`;
      output += `**Created:** ${recipe.created_at}\n\n`;
      output += `## Description\n${recipe.description}\n\n`;
      output += `---\n\n`;
      output += recipe.markdown;

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving recipe: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === 'search_examples') {
    const query = args.query.toLowerCase();
    const limit = args.limit || 10;

    try {
      let results = await dbAll(
        `SELECT 
          e.id,
          e.label,
          e.code,
          p.url,
          p.title as page_title,
          p.category,
          snippet(examples_fts, 1, '<mark>', '</mark>', '...', 80) as snippet
         FROM examples_fts
         JOIN examples e ON examples_fts.rowid = e.id
         JOIN pages p ON e.page_id = p.id
         WHERE examples_fts MATCH ?
         ORDER BY examples_fts.rank
         LIMIT ?`,
        [query, limit]
      );

      if (results.length === 0) {
        const words = query.split(/\s+/);
        const suggestion = words.length > 1 
          ? `Try searching with just one word (e.g., "${words[0]}" instead of "${query}")`
          : null;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                query: query,
                total: 0,
                results: [],
                suggestion: suggestion
              }, null, 2),
            },
          ],
        };
      }

      const output = {
        query: query,
        total: results.length,
        results: results.map((result, index) => ({
          index: index + 1,
          label: result.label || 'Untitled Example',
          page_title: result.page_title,
          category: result.category,
          url: result.url,
          snippet: result.snippet,
          code: result.code,
        }))
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(output, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching examples: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === 'get_example') {
    const url = args.url;
    const label = args.label;
    const index = args.index;

    // Need either label or index
    if (label === undefined && index === undefined) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Must provide either "label" or "index" parameter.\n\nExamples:\n- get_example(url="...", label="Primary button")\n- get_example(url="...", index=0)',
          },
        ],
        isError: true,
      };
    }

    try {
      // Get page
      const pageResult = await dbAll(
        'SELECT id, title, category FROM pages WHERE url = ? LIMIT 1',
        [url]
      );

      if (pageResult.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `Page not found: "${url}"\n\nUse the search tool first to find available pages.`,
            },
          ],
        };
      }

      const page = pageResult[0];

      // Get examples from this page
      const examples = await dbAll(
        'SELECT code, label, position FROM examples WHERE page_id = ? ORDER BY position',
        [page.id]
      );

      if (examples.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No code examples found for: ${page.title}\n\nThis page may not contain code examples.`,
            },
          ],
        };
      }

      let matchedExample = null;
      let matchedIndex = -1;

      // Match by index if provided
      if (index !== undefined) {
        if (index < 0 || index >= examples.length) {
          return {
            content: [
              {
                type: 'text',
                text: `Index out of range: ${index}\n\nThis page has ${examples.length} example(s) (indices 0-${examples.length - 1}).`,
              },
            ],
            isError: true,
          };
        }
        matchedExample = examples[index];
        matchedIndex = index;
      }
      // Match by label if provided
      else if (label !== undefined) {
        const lowerLabel = label.toLowerCase();

        // Try exact match first
        for (let i = 0; i < examples.length; i++) {
          if (examples[i].label && examples[i].label.toLowerCase() === lowerLabel) {
            matchedExample = examples[i];
            matchedIndex = i;
            break;
          }
        }

        // Try partial match if no exact match
        if (!matchedExample) {
          for (let i = 0; i < examples.length; i++) {
            if (examples[i].label && examples[i].label.toLowerCase().includes(lowerLabel)) {
              matchedExample = examples[i];
              matchedIndex = i;
              break;
            }
          }
        }

        // No match found
        if (!matchedExample) {
          let availableLabels = examples
            .map((ex, idx) => `  ${idx}. ${ex.label || '(no label)'}`)
            .join('\n');

          return {
            content: [
              {
                type: 'text',
                text: `Label not found: "${label}"\n\nAvailable examples on this page:\n${availableLabels}\n\nTry using the index parameter instead.`,
              },
            ],
            isError: true,
          };
        }
      }

      let output = `# Example: ${matchedExample.label || 'Untitled'}\n\n`;
      output += `**From:** ${page.title}\n`;
      output += `**URL:** ${url}\n`;
      output += `**Category:** ${page.category}\n`;
      output += `**Example Index:** ${matchedIndex} of ${examples.length}\n\n`;
      output += `\`\`\`html\n${matchedExample.code}\n\`\`\`\n`;

      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving example: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('EC Europa Component Library MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
