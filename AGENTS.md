# AGENTS.md - Guide for AI Agents Working in ECL MCP Server

## Project Overview

This is an **MCP (Model Context Protocol) server** that provides comprehensive knowledge about the **Europa Component Library (ECL)** - the design system for the European Commission. The server exposes ECL's 50+ components, design guidelines, setup instructions, and code generation tools through the MCP protocol.

**Technology Stack:**
- Node.js (>=18.0.0) with ES modules
- @modelcontextprotocol/sdk v1.0.4
- Pure JavaScript (no TypeScript, no build step)
- Stdio-based MCP server

**Project Type:** MCP server / Design system knowledge base

## Essential Commands

### Development
```bash
npm start          # Start the server
npm run dev        # Start with auto-restart (--watch flag)
npm install        # Install dependencies
```

### Testing the Server
```bash
node index.js      # Run directly - should output "ECL MCP Server running on stdio"
```

**Note:** There are no test scripts, linters, or build tools configured. This is intentional - it's a simple, single-file server.

## Code Organization

```
ecl_mcp/
├── index.js           # Main server implementation (single file)
├── ecl-data.json      # Complete ECL component database
├── package.json       # NPM configuration
├── README.md          # User documentation
├── SETUP.md           # Installation instructions
└── .gitignore         # Git ignore rules
```

### File Structure

**`index.js` (720 lines)** - Complete MCP server implementation:
- Lines 1-28: Imports, ECL data loading, initialization
- Lines 30-42: Server instance creation
- Lines 44-80: Resource listing (5 resources)
- Lines 82-178: Resource content handlers
- Lines 180-290: Tool definitions (7 tools)
- Lines 292-716: Tool request handlers
- Lines 718-728: Server startup

**`ecl-data.json`** - Structured data containing:
- Metadata: version (4.11.1), name, description
- Installation methods: npm, yarn, CDN patterns
- Setup: HTML template, dependencies, JavaScript init
- Components: 54 components across 6 categories
- Guidelines: typography, colours, images, iconography, spacing
- Utilities and resources
- Important implementation notes

## Data Schema

### Component Structure
Every component in `ecl-data.json` has these fields:

```javascript
{
  "name": "Button",                    // Display name
  "category": "content",               // Category (forms/navigation/content/media/banners/site-wide)
  "url": "https://...",                // Official ECL documentation URL
  "description": "Brief description",  // What the component is
  "usage": "When to use it",          // Usage guidance
  "auto_init": "Button",              // Optional: JS initialization class name
  "example": "<button>...</button>",  // Optional: HTML code example
  "variants": ["primary", "secondary"],// Optional: Available variants
  "dependencies": ["pikaday"],        // Optional: External dependencies
  "sizes": ["xs", "s", "m", "l"],     // Optional: Available sizes (icons only)
  "format": "DD/MM/YYYY"              // Optional: Data format (datepicker)
}
```

### Component Categories
- **content** (26 components): accordion, button, card, icon, modal, table, tag, etc.
- **navigation** (9 components): breadcrumb, menu, pagination, tabs, links
- **forms** (11 components): checkbox, text-field, datepicker, file-upload, select, etc.
- **banners** (2 components): banner, carousel
- **media** (3 components): gallery, featured-item, media-container
- **site-wide** (3 components): site-header, site-footer, page-header

### Component Naming Convention
Components are keyed by **kebab-case slugs**: `accordion`, `text-field`, `inpage-navigation`, `list-illustration`

## MCP Server Architecture

### Available Resources (5)
Resources are read-only content accessible via URIs:

1. `ecl://overview` - ECL metadata and important notes
2. `ecl://installation` - Installation and setup instructions
3. `ecl://components` - Complete component list
4. `ecl://guidelines` - Design guidelines
5. `ecl://setup-template` - Ready-to-use HTML template

### Available Tools (7)
Tools are callable functions with parameters:

1. **`get_component`** - Get detailed component info
   - Param: `component_name` (string)
   - Returns: Full component data

2. **`search_components`** - Search by category/keyword
   - Param: `query` (string)
   - Returns: Matching components with metadata

3. **`generate_component_code`** - Generate HTML code
   - Params: `component_name` (string), `variant` (optional string)
   - Returns: HTML with comments for variants and auto-init

4. **`get_setup_guide`** - Get setup instructions
   - Param: `method` (enum: "npm", "cdn", "complete")
   - Returns: Setup guide for chosen method

5. **`list_components_by_category`** - List by category
   - Param: `category` (enum: forms/navigation/content/media/banners/site-wide)
   - Returns: All components in category

6. **`get_guidelines`** - Get design guidelines
   - Param: `guideline_type` (enum: typography/colours/colors/images/iconography/spacing/all)
   - Returns: Requested guideline data
   - Note: Accepts both "colours" and "colors"

7. **`get_javascript_init`** - Get JS initialization code
   - Param: `component_name` (optional string)
   - Returns: Auto-init patterns or general JS guidance

## Code Patterns and Conventions

### ES Modules
This project uses **ES modules** (`"type": "module"` in package.json):
```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import fs from 'fs/promises';
```

Always use `.js` extensions in import paths and `fs/promises` for async file operations.

### Error Handling Pattern
All tool handlers follow this pattern:
```javascript
try {
  // Tool logic
  return {
    content: [{
      type: 'text',
      text: 'Response data'
    }]
  };
} catch (error) {
  return {
    content: [{
      type: 'text',
      text: `Error: ${error.message}`
    }],
    isError: true
  };
}
```

### Component Name Normalization
Always normalize component names before lookup:
```javascript
const componentName = args.component_name.toLowerCase().replace(/\s+/g, '-');
const component = eclData.components[componentName];
```

This allows users to input "Text Field", "text field", or "text-field" interchangeably.

### JSON Response Formatting
All structured data responses use pretty-printed JSON:
```javascript
text: JSON.stringify(data, null, 2)
```

### Request Handler Pattern
All request handlers use the MCP SDK schema pattern:
```javascript
server.setRequestHandler(SchemaName, async (request) => {
  const { params } = request;
  // Handler logic
  return { ... };
});
```

### Stdio Transport
The server uses stdio transport for communication:
```javascript
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('ECL MCP Server running on stdio');
```

**Important:** Use `console.error()` for logging (not `console.log()`) to avoid interfering with stdio protocol.

## Important Gotchas

### 1. ECL Data Loading is Synchronous at Startup
The server loads `ecl-data.json` at startup. If this file is missing or malformed, the server exits immediately:
```javascript
try {
  const data = await fs.readFile(eclDataPath, 'utf-8');
  eclData = JSON.parse(data);
} catch (error) {
  console.error('Error loading ECL data:', error);
  process.exit(1);  // Hard exit
}
```

**Never modify the server without ensuring `ecl-data.json` is valid.**

### 2. Component Lookup is Case-Sensitive in the Data
While user input is normalized, the internal keys in `ecl-data.json` must be kebab-case. If you add components, use: `text-field`, not `Text-Field` or `text_field`.

### 3. Auto-init Values Match ECL JavaScript Classes
The `auto_init` field contains ECL's JavaScript class names (e.g., "Accordion", "Datepicker"). These must match ECL's actual implementation. Don't invent auto-init values.

### 4. Colour vs Color Spelling
ECL uses British spelling "colours" in the data, but the tool accepts both:
```javascript
const guidelineKey = type === 'colors' ? 'colours' : type;
```

When adding guideline types, maintain this pattern.

### 5. No Component Validation in generate_component_code
The code generation tool doesn't validate variants or dependencies - it just returns the example with comments. It's informational, not a full template engine.

### 6. Resource URIs are Hardcoded
The 5 resources have fixed URIs (`ecl://overview`, etc.). If you add resources, update both `ListResourcesRequestSchema` handler and `ReadResourceRequestSchema` handler.

### 7. Tool Schemas Must Match Handler Logic
If you modify tool parameters in `ListToolsRequestSchema`, you must also update the corresponding handler in `CallToolRequestSchema`. The SDK doesn't auto-validate this.

### 8. Server Runs Forever
The stdio server runs indefinitely until killed. There's no timeout or shutdown mechanism. This is standard for MCP servers.

## ECL-Specific Knowledge

### ECL Version
This server is based on **ECL v4.11.1 (EU variant)**. The EC (European Commission) variant exists but is not included.

### Critical ECL Implementation Notes
When helping users implement ECL:

1. **SVG Sprites:** Must be hosted on the same domain (CORS issues)
2. **CDN vs Local:** Recommend local hosting over CDN
3. **Pikaday Dependency:** Datepicker requires separate Pikaday and Moment.js installation
4. **Cookie Consent:** Required before production deployment
5. **Auto-init Pattern:** Components need `data-ecl-auto-init="[ClassName]"` and `ECL.autoInit()` call

### JavaScript Initialization
ECL components with interactive behavior need JavaScript:
```html
<!-- Add to component root -->
<div data-ecl-auto-init="Accordion">...</div>

<!-- Call at page end -->
<script src="/scripts/ecl-eu.js"></script>
<script>
  ECL.autoInit();
</script>
```

Components requiring JS: Accordion, Banner, Carousel, Category Filter, Datepicker, Expandable, File Upload, Gallery, Inpage Navigation, Mega Menu, Menu, Message, Modal, Navigation List, Notification, Popover, Tabs, Timeline

### Form Component Pattern
All ECL form components follow this wrapper pattern:
```html
<div class="ecl-form-group">
  <label class="ecl-form-label">Label</label>
  <div class="ecl-[component]">
    <!-- Component markup -->
  </div>
</div>
```

## Modifying This Project

### Adding a New Component to ecl-data.json
1. Add entry with kebab-case key
2. Include all required fields: name, category, url, description, usage
3. Add optional fields: auto_init (if JS needed), example, variants, dependencies
4. Ensure URL points to official ECL documentation
5. Test with `get_component` and `search_components` tools

### Adding a New Tool
1. Add tool definition in `ListToolsRequestSchema` handler
2. Add tool handler in `CallToolRequestSchema` handler
3. Follow error handling pattern with try-catch
4. Return structured content with `type: 'text'`
5. Update README.md with tool documentation

### Adding a New Resource
1. Add resource entry in `ListResourcesRequestSchema` handler
2. Add URI handler in `ReadResourceRequestSchema` handler
3. Use consistent `ecl://` URI scheme
4. Return appropriate mimeType (application/json or text/html)

### Modifying ecl-data.json
This file is the **single source of truth**. All tool responses derive from it. Changes here automatically affect all tools. No code changes needed unless you're adding new top-level sections.

### Code Style Notes
- No semicolons enforced (some present, some absent - inconsistent but functional)
- Use 2-space indentation
- Use arrow functions for handlers
- No TypeScript types or JSDoc (intentionally simple)
- No external utilities or helpers (inline all logic)

## Configuration for MCP Clients

### Claude Desktop
```json
{
  "mcpServers": {
    "ecl": {
      "command": "node",
      "args": ["/absolute/path/to/ecl_mcp/index.js"]
    }
  }
}
```

Config locations:
- **Linux:** `~/.config/Claude/claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

### Cline (VS Code Extension)
Add to VS Code settings.json:
```json
{
  "mcp.servers": {
    "ecl": {
      "command": "node",
      "args": ["/absolute/path/to/ecl_mcp/index.js"]
    }
  }
}
```

**Important:** Always use absolute paths. Relative paths may fail depending on client working directory.

## Debugging and Testing

### Manual Testing
Run the server and check for startup message:
```bash
node index.js
# Should output: ECL MCP Server running on stdio
```

If it exits immediately, check:
1. `ecl-data.json` exists and is valid JSON
2. Node version is >=18.0.0
3. Dependencies are installed (`npm install`)

### Testing with MCP Inspector
Use the official MCP Inspector tool:
```bash
npx @modelcontextprotocol/inspector node index.js
```

This provides a UI to test tools and resources interactively.

### Common Issues

**"Cannot find module '@modelcontextprotocol/sdk'"**
- Run: `npm install`

**"Error loading ECL data"**
- Check `ecl-data.json` exists in project root
- Validate JSON syntax
- Check file permissions

**Server starts but tools don't work in client**
- Verify absolute path in client config
- Restart the MCP client application
- Check client logs for connection errors

**Changes not reflected**
- Restart the server (it doesn't hot-reload)
- If using `npm run dev`, it should auto-restart on file changes

## Project Context

### Purpose
This server bridges the gap between AI assistants and ECL documentation. Instead of web scraping or hallucinating component APIs, the AI can query structured, verified ECL data.

### Target Users
- Developers building EU Commission websites
- Teams implementing ECL design system
- AI assistants helping with ECL integration

### Maintenance
The project is maintained by Simon Hengchen (simon.hengchen@ext.ec.europa.eu). Updates should track official ECL releases.

### Future Enhancements (Not Yet Implemented)
- Component preview generation
- Accessibility guideline integration
- EC variant support (currently EU only)
- Component dependency graph
- Code validation for generated snippets

## Quick Reference

### Most Common Operations

**Find a component:**
```javascript
// Tool: search_components
{ "query": "button" }
```

**Get component details:**
```javascript
// Tool: get_component
{ "component_name": "accordion" }
```

**Generate HTML:**
```javascript
// Tool: generate_component_code
{ "component_name": "button", "variant": "primary" }
```

**List forms:**
```javascript
// Tool: list_components_by_category
{ "category": "forms" }
```

**Setup guide:**
```javascript
// Tool: get_setup_guide
{ "method": "complete" }
```

### Key Data Locations

- **All components:** `eclData.components[componentSlug]`
- **Guidelines:** `eclData.guidelines[guidelineType]`
- **Installation:** `eclData.installation`
- **Setup:** `eclData.setup`
- **Version:** `eclData.version`
- **Important notes:** `eclData.important_notes`

### Response Patterns

**Success with data:**
```javascript
return {
  content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
};
```

**Success with plain text:**
```javascript
return {
  content: [{ type: 'text', text: 'Plain text response' }]
};
```

**Error:**
```javascript
return {
  content: [{ type: 'text', text: `Error: ${error.message}` }],
  isError: true
};
```

**Not found:**
```javascript
return {
  content: [{ type: 'text', text: 'Component "xyz" not found. Use search_components to find available components.' }]
};
```

## Summary

This is a **simple, single-file MCP server** with no build process, no tests, and no complex tooling. The entire implementation is in `index.js` (720 lines), and all data is in `ecl-data.json`. When making changes:

1. **Read the code first** - it's straightforward and well-structured
2. **Test manually** - just run `node index.js`
3. **Keep it simple** - don't add unnecessary complexity
4. **Respect the data schema** - components have specific required fields
5. **Follow MCP patterns** - use the SDK properly for tools and resources

The server's value is in the **curated ECL data**, not complex code. Focus on data accuracy and completeness over clever abstractions.
