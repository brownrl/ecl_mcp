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
const fs = require('fs');

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
        description: 'Get a specific code example by its ID. Use this after search_examples to retrieve the full code for a specific example.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'The example ID from search_examples results',
            },
          },
          required: ['id'],
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

### Step 3: Find & Add Components OR list all of the recipes.

\`\`\`
search_examples(query="card")
\`\`\`

or

\`\`\`
list_recipes()
\`\`\`


---

## 🛠️ Tools

**Start here:** \`get_starter_template\` - Complete HTML boilerplate

**Find components:** \`search_examples\`, \`get_example\`, \`search_documentation_pages\`, \`get_documentation_page\`

**Advanced:** \`list_recipes\`, \`recipe_get\`, \`get_documentation_pages_list\`, \`get_documentation_page_examples\`

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

    // Read template from file
    const templatePath = path.join(__dirname, 'starter_template.html');
    let template;
    try {
      template = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error reading template file: ${error.message}`,
          },
        ],
        isError: true,
      };
    }

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
        results: results.map((result) => ({
          id: result.id,
          label: result.label || 'Untitled Example',
          page_title: result.page_title,
          category: result.category,
          url: result.url,
          snippet: result.snippet,
          get_example_call: `get_example(id=${result.id})`,
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
    const id = args.id;

    if (!id) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Must provide "id" parameter.\n\nExample: get_example(id=123)\n\nUse search_examples() first to find example IDs.',
          },
        ],
        isError: true,
      };
    }

    try {
      // Get example with page info
      const result = await dbAll(
        `SELECT 
          e.id,
          e.code,
          e.label,
          e.position,
          p.title as page_title,
          p.url as page_url,
          p.category
         FROM examples e
         JOIN pages p ON e.page_id = p.id
         WHERE e.id = ?
         LIMIT 1`,
        [id]
      );

      if (result.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `Example not found: ID ${id}\n\nUse search_examples() to find available examples.`,
            },
          ],
        };
      }

      const example = result[0];
      let output = `# Example: ${example.label || 'Untitled'}\n\n`;
      output += `**Example ID:** ${example.id}\n`;
      output += `**From:** ${example.page_title}\n`;
      output += `**URL:** ${example.page_url}\n`;
      output += `**Category:** ${example.category}\n\n`;
      output += `## Code\n\n`;
      output += `\`\`\`html\n${example.code}\n\`\`\`\n`;

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
