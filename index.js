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
        name: 'about',
        description: 'Get information about this MCP server and what it provides. **START HERE** - Returns comprehensive overview of all 159 ECL documentation pages, complete component catalog (70+ UI components, 24 form components, 21 navigation components), and AI agent workflow guide. Essential first call to understand what\'s available before searching.',
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

This MCP server provides comprehensive access to the European Commission's official Component Library (ECL) documentation.

## 📊 What's Available

**Database Stats:**
- **159 total pages** of documentation
- **85 pages with code examples** (270 total examples)
- **70 UI Components** with usage guidelines and code
- **24 Form Components** for user input
- **21 Navigation Components** for site structure
- **19 Utility Classes** for styling
- **8 Media Components** for rich content
- **7 Site-Wide Components** (headers, footers, page structure)
- **7 Design Guidelines** (typography, colors, spacing, etc.)

---

## 🎯 For AI Coding Agents: Quick Navigation Guide

### Essential Components (Start Here)
**Site Structure:**
- Site Header (core/standardised/harmonised variants)
- Site Footer
- Page Header
- Breadcrumb

**Most Common UI:**
- Button (primary/secondary/tertiary/ghost/call-to-action)
- Card (for content blocks)
- Accordion (collapsible sections)
- Banner (alerts, messages)
- Modal (dialogs)
- Table (data display)

**Form Components:**
- Text Field, Text Area
- Select, Checkbox, Radio
- Datepicker, File Upload
- Search Form
- Rating Field, Range

**Navigation:**
- Menu, Mega Menu
- Tabs
- Pagination
- Navigation List
- Inpage Navigation

**Content Display:**
- List, List Illustration
- Blockquote
- File (document links)
- Timeline
- Fact Figures
- News Ticker

**Interactive:**
- Expandable
- Popover
- Loading Indicator
- Category Filter
- Carousel

**Media:**
- Gallery, Featured Item
- Media Container

**Utilities:**
- Spacing (margin/padding)
- Typography (text sizing/styling)
- Background, Border, Shadow
- Display, Float, Dimension
- Screen Reader, Print utilities

---

## 🚀 Quick Start Workflow for AI Agents

### Step 1: Get Your HTML Foundation
\`\`\`
Call: get_starter_template(title="My Page")
Returns: Complete HTML with ECL CDN links and ECL.autoInit()
\`\`\`

### Step 2: Find Components You Need
\`\`\`
Call: search(query="site header")
Returns: Relevant pages with URLs
\`\`\`

### Step 3: Get Component Code
\`\`\`
Call: get_examples(url="<url-from-search>")
Returns: Ready-to-use HTML code blocks
\`\`\`

### Step 4: Insert and Done
Paste component code into your template body. Components with \`data-ecl-auto-init\` will initialize automatically.

---

## 🛠️ Available Tools

### 1. **about** (you're here!)
Get overview of ECL, component catalog, and workflow guidance.

### 2. **search** ⭐ PRIMARY TOOL
Search 159 pages by keyword. Returns matching pages with snippets.
- Example: \`search(query="button primary")\`
- Example: \`search(query="form validation")\`
- Example: \`search(query="responsive grid")\`

### 3. **get_examples** ⭐ MOST USEFUL FOR CODE
Extract clean, copy-paste ready HTML from any component page.
- Requires URL from search results
- Returns labeled code blocks
- Much faster than get_page

### 4. **get_starter_template** ⭐ START HERE FOR NEW PROJECTS
Generate complete HTML boilerplate with:
- Official EC CDN links (v4.11.1)
- Required CSS (reset, main, utilities, print)
- ECL JavaScript with auto-initialization
- Proper meta tags and structure

### 5. **get_page**
Retrieve full HTML documentation page (verbose, rarely needed).
Use \`get_examples\` instead for code.

### 6. **index**
Get complete list of all 159 pages with URLs, categories, and hierarchy.
Useful for building navigation or seeing everything at once.

---

## ⚠️ CRITICAL: Always Use Official EC CDN

**Base URL:** \`https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/\`

**Required CSS (load in <head>):**
1. \`styles/optional/ecl-reset.css\` - CSS reset (load first)
2. \`styles/ecl-ec.css\` - Main component styles
3. \`styles/optional/ecl-ec-utilities.css\` - Utility classes
4. \`styles/ecl-ec-print.css\` - Print styles (media="print")

**Required JS (load before </body>):**
1. \`scripts/ecl-ec.js\` - ECL component library
2. Call \`ECL.autoInit();\` after loading

**Assets:**
- Icons: \`images/icons/sprites/icons.svg\`
- Logos: \`images/logo/positive/logo-ec--en.svg\` (or negative variant)

**Never use:** jsdelivr, cdnjs, unpkg, or other third-party CDNs. Only use official EC CDN.

---

## 🎨 Component JavaScript Requirements

Components with \`data-ecl-auto-init\` attributes are automatically initialized by \`ECL.autoInit()\`:
- ✅ Interactive components (Accordion, Tabs, Menu, Modal, Datepicker, etc.)
- ✅ No manual initialization needed
- ✅ Works out of the box with starter template

Static components (Button, Card, Banner, etc.) require no JavaScript.

---

## 📝 Common Search Queries to Get Started

**Page Layouts:**
- \`search(query="site header")\` → Full page headers
- \`search(query="site footer")\` → Full page footers
- \`search(query="page header")\` → Content page headers

**Forms:**
- \`search(query="text field")\` → Input fields
- \`search(query="form checkbox radio")\` → Form controls
- \`search(query="datepicker")\` → Date selection

**UI Patterns:**
- \`search(query="button primary")\` → Button variants
- \`search(query="card")\` → Content cards
- \`search(query="modal dialog")\` → Popup dialogs
- \`search(query="accordion expandable")\` → Collapsible sections

**Navigation:**
- \`search(query="menu navigation")\` → Site menus
- \`search(query="breadcrumb")\` → Breadcrumb trails
- \`search(query="tabs")\` → Tabbed interfaces

**Styling:**
- \`search(query="spacing margin padding")\` → Layout utilities
- \`search(query="typography")\` → Text styling
- \`search(query="grid layout")\` → Page layouts

**Guidelines:**
- \`search(query="colors")\` → Color palette
- \`search(query="getting started")\` → Setup guides

---

## 💡 Pro Tips for AI Agents

1. **Always start with** \`get_starter_template\` for new projects
2. **Use search first**, then \`get_examples\` with the URLs returned
3. **Avoid get_page** unless you need full documentation context
4. **Check for variants** - most components have multiple styles (primary/secondary, etc.)
5. **Look for "api" pages** - components with JavaScript have API documentation
6. **Combine utilities** - use spacing/typography utilities with components
7. **Full page pattern** = site-header + breadcrumb + page-header + content + site-footer

---

## 📦 Typical Full Page Structure

\`\`\`html
<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <!-- Meta tags, title -->
  <!-- ECL CSS (reset, main, utilities, print) -->
</head>
<body>
  <!-- Site Header (search: "site header") -->
  
  <!-- Breadcrumb (search: "breadcrumb") -->
  
  <!-- Page Header (search: "page header") -->
  
  <main>
    <!-- Your content components here -->
    <!-- Cards, Tables, Forms, etc. -->
  </main>
  
  <!-- Site Footer (search: "site footer") -->
  
  <!-- ECL JS + ECL.autoInit() -->
</body>
</html>
\`\`\`

---

## 🔍 When to Use Each Tool

| Task | Tool | Example |
|------|------|---------|
| Starting new project | \`get_starter_template\` | Get HTML boilerplate |
| Finding components | \`search\` | "button primary" |
| Getting component code | \`get_examples\` | Use URL from search |
| Seeing all available docs | \`index\` | Browse full catalog |
| Deep documentation dive | \`get_page\` | Full page context |
| Checking what's available | \`about\` | You're here! |

**Recommended flow:** \`about\` → \`get_starter_template\` → \`search\` → \`get_examples\` → implement

---

## 📚 Documentation Types

Each component typically has:
- **usage** - Guidelines, best practices, when to use
- **code** - HTML examples with variants
- **api** - JavaScript API (for interactive components)

Example paths:
- \`components > button > usage\`
- \`components > button > code\`
- \`navigation > tabs > api\`

---

**Version:** ECL v4.11.1  
**Last Updated:** Database contains 159 pages, 270 code examples  
**Official Docs:** https://ec.europa.eu/component-library/`,
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
