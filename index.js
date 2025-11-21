#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const sqlite3 = require('sqlite3');
const { promisify } = require('util');

// Open database
const db = new sqlite3.Database('./ecl-database.sqlite');
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
        name: 'about',
        description: 'Get information about this MCP server and what it provides',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'search',
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
        name: 'get_page',
        description: 'Get the complete HTML content of a specific documentation page by URL. Use this after searching to retrieve full code examples and detailed documentation.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The full URL of the page to retrieve (from search results)',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'get_examples',
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
        description: 'Get a basic HTML starter template with proper ECL CDN setup, ready to use. Use this as the foundation before adding ECL components. Returns a complete HTML page with correct script tags, CSS links, and CDN URLs.',
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
        name: 'index',
        description: 'Get the complete list of all pages in the ECL documentation database. Returns URL, title, category, and hierarchy information for all 159 pages.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'about') {
    return {
      content: [
        {
          type: 'text',
          text: `# EC Europa Component Library MCP Server

This MCP server provides access to the European Commission's Component Library documentation.

## What it does:
- Maintains a local database of 159 pages from the EC Europa Component Library
- Includes documentation for components, forms, media, navigation, site-wide elements, and utilities
- Each page contains usage guidelines, code examples, and API documentation where available
- Full-text search across all documentation content

## Available tools:
1. **about** - Get information about this server (you're using it now!)
2. **search** - Search the documentation by keyword or phrase (returns snippets)
3. **get_page** - Get the complete HTML content of a specific page by URL
4. **get_examples** - Get just the code examples from a page (faster than parsing full HTML)
5. **get_starter_template** - Get a ready-to-use HTML starter template with ECL CDN setup
6. **index** - Get the complete list of all pages with URL, title, category, and hierarchy

## Quick Start for Creating ECL Pages:

### ⚠️ IMPORTANT: Use the Official EC CDN (NOT jsdelivr or other CDNs!)
**Base URL:** https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/

**Required Resources:**
- CSS: \`styles/optional/ecl-reset.css\` (load first)
- CSS: \`styles/ecl-ec.css\` (main styles)
- CSS: \`styles/optional/ecl-ec-utilities.css\` (spacing, typography utilities)
- CSS: \`styles/ecl-ec-print.css\` (print styles, media="print")
- JS: \`scripts/ecl-ec.js\` (load at end of body)
- Icons: \`images/icons/sprites/icons.svg\` (for SVG sprite references)
- Logos: \`images/logo/positive/logo-ec--en.svg\` or \`images/logo/negative/logo-ec--en.svg\`

### Minimal HTML Template:
\`\`\`html
<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Page Title</title>
  <script>
    var cl = document.querySelector('html').classList;
    cl.remove('no-js');
    cl.add('has-js');
  </script>
  <link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/optional/ecl-reset.css" media="screen">
  <link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/ecl-ec.css" media="screen">
  <link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/optional/ecl-ec-utilities.css" media="screen">
  <link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/ecl-ec-print.css" media="print">
</head>
<body>
  <!-- ECL components here -->
  
  <script src="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/scripts/ecl-ec.js"></script>
  <script>
    ECL.autoInit();
  </script>
</body>
</html>
\`\`\`

### Usage Flow:
1. Call **get_starter_template** to get a complete HTML boilerplate
2. Use **search** to find components you need (e.g., "site header", "button", "footer")
3. Use **get_examples** to get component HTML code
4. Insert component code into the body of your starter template
5. All components use \`data-ecl-auto-init\` attributes and are initialized by \`ECL.autoInit()\`

## Documentation structure:
- Getting Started guides (search "getting started" for full setup docs)
- Guidelines (typography, colours, images, iconography, logos, spacing)
- Components (accordion, banner, buttons, cards, etc.)
- Form Components (checkbox, datepicker, select, text fields, etc.)
- Media Components (featured items, galleries, media containers)
- Navigation Components (breadcrumbs, menus, tabs, pagination, etc.)
- Site Wide Components (headers, footers)
- Utilities (background, border, spacing, typography, layout, etc.)`,
        },
      ],
    };
  }

  if (name === 'get_page') {
    const url = args.url;

    try {
      const result = await dbAll(
        'SELECT url, title, category, html FROM pages WHERE url = ? LIMIT 1',
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
      let output = `# ${page.title}\n\n`;
      output += `**URL:** ${page.url}\n`;
      output += `**Category:** ${page.category}\n\n`;
      output += `## HTML Content\n\n${page.html}`;

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

  if (name === 'get_examples') {
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <script>
    var cl = document.querySelector('html').classList;
    cl.remove('no-js');
    cl.add('has-js');
  </script>
  <link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/optional/ecl-reset.css" media="screen">
  <link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/ecl-ec.css" media="screen">
  <link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/optional/ecl-ec-utilities.css" media="screen">
  <link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/ecl-ec-print.css" media="print">
</head>
<body>
  <!-- Add ECL components here -->
  <!-- Use search tool to find components, then get_examples to get their HTML -->
  
  <script src="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/scripts/ecl-ec.js"></script>
  <script>
    ECL.autoInit();
  </script>
</body>
</html>`;

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

  if (name === 'index') {
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

  if (name === 'search') {
    const query = args.query.toLowerCase(); // Lowercase since FTS content is lowercased
    const limit = args.limit || 10;

    try {
      // Use FTS5 with lowercased query for case-insensitive search
      let results = await dbAll(
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
        [query, limit]
      );

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No results found for: "${query}"`,
            },
          ],
        };
      }

      // Format results with more readable snippets
      let output = `# Search Results for "${query}"\n\nFound ${results.length} result(s):\n\n`;
      
      results.forEach((result, index) => {
        output += `## ${index + 1}. ${result.title}\n`;
        output += `**URL:** ${result.url}\n`;
        output += `**Category:** ${result.category}\n`;
        
        // Show hierarchy path
        const hierarchy = [
          result.hierarchy_1,
          result.hierarchy_2,
          result.hierarchy_3,
          result.hierarchy_4,
        ].filter(h => h).join(' > ');
        
        if (hierarchy) {
          output += `**Path:** ${hierarchy}\n`;
        }
        
        output += `**Snippet:** ${result.snippet}\n\n`;
      });

      output += `\n---\n💡 **Tip:** New to ECL? Call 'get_starter_template' for a ready-to-use HTML boilerplate, or search "getting started" for full setup documentation.\n`;

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
            text: `Error searching: ${error.message}`,
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
