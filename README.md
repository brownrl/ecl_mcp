# ECL MCP Server

A Model Context Protocol (MCP) server that provides comprehensive knowledge about the **Europa Component Library (ECL)** - the design system for the European Commission and websites managed by the Commission.

## Overview

This MCP server gives you instant access to:
- **169 crawled ECL pages** with full documentation
- **50+ ECL components** with semantic search and metadata
- **520+ usage guidance items** (do's, don'ts, best practices)
- **756 code examples** with complexity ratings and language filtering
- **783 accessibility requirements** (WCAG, ARIA, keyboard support)
- **30+ API documentation entries** (attributes, props, methods, events)
- **1,366 component tags** for advanced filtering
- **Complete setup guides** for NPM and CDN installation
- **Design guidelines** (typography, colors, spacing, iconography)
- **JavaScript initialization patterns** with auto-init support

### What Makes This Server Special

Unlike basic documentation servers, this MCP server provides:

1. **Semantic Search** - Multi-filter search across components, API, examples, and guidance
2. **Structured Data** - Rich metadata including complexity, JavaScript requirements, variants
3. **Cross-References** - Discover component relationships and dependencies
4. **Usage Guidance** - Know when to use (and when NOT to use) each component
5. **Code Examples** - Filter by language, complexity, completeness
6. **Accessibility First** - WCAG compliance data and implementation notes
7. **Design Tokens** - Access to design system tokens (colors, spacing, typography)
8. **Code Generation** - Generate customized components and interactive playgrounds
9. **Validation Tools** - Check WCAG compliance, code quality, and component conflicts
10. **Intelligent Responses** - Helpful suggestions when results are empty
9. **Component Validation** - Validate HTML/JS against ECL requirements with quality scoring
10. **Accessibility Checking** - Verify WCAG 2.1 compliance (Level A, AA, AAA)
11. **Code Analysis** - Detect components, find anti-patterns, check design token usage
12. **Conflict Detection** - Identify incompatible component combinations

## Installation

### Install Directly from GitHub

The easiest way to use this MCP server is to install it directly from GitHub using npm:

```bash
npm install git+https://github.com/brownrl/eco_mcp.git
```

This will install all dependencies and make the `ecl-mcp` command available.

### For Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/brownrl/eco_mcp.git
cd eco_mcp
npm install
```

## Usage

### Quick Start

After installation, you can run the server directly:

```bash
npx ecl-mcp
```

Or if installed globally:

```bash
ecl-mcp
```

For help and version information:

```bash
ecl-mcp --help
ecl-mcp --version
```

### MCP Client Configuration

Configure your MCP client to use this server:

#### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ecl": {
      "command": "npx",
      "args": ["ecl-mcp"],
      "type": "stdio"
    }
  }
}
```

#### Cline (VS Code Extension)

Add to your VS Code settings (`.vscode/settings.json` or User Settings):

```json
{
  "cline.mcpServers": {
    "ecl": {
      "command": "npx",
      "args": ["ecl-mcp"],
      "type": "stdio"
    }
  }
}
```

#### Other MCP Clients

For any MCP-compatible client, use:

- **Command**: `npx`
- **Args**: `["ecl-mcp"]`

Or with absolute path after global installation:

- **Command**: `ecl-mcp`
- **Args**: `[]`

### Development Mode

For development with auto-restart on file changes:

```bash
npm run dev
```

## Available Tools

This server provides **28 tools** organized in multiple categories:

- **3 Code Generation Tools** (Phase 5) - Generate customized components and interactive playgrounds
- **4 Validation Tools** (Phase 4) - Validate components, check accessibility, analyze code quality
- **14 Enhanced Search Tools** (Phase 3) - Semantic search with rich metadata (prefix: `ecl_*`)
- **7 Legacy Tools** (Phase 1) - Basic functionality for backward compatibility

For complete tool reference, see **[TOOLS.md](TOOLS.md)**

### Quick Reference

**Code Generation:**
- `ecl_get_complete_example` - Get runnable examples with all dependencies included
- `ecl_generate_component` - Generate customized components with variants, sizes, content
- `ecl_create_playground` - Create interactive multi-component testing environments

**Validation & Diagnostics:**
- `ecl_validate_component_usage` - Validate HTML/JS against ECL requirements with quality scoring
- `ecl_check_accessibility` - Verify WCAG 2.1 compliance (Level A, AA, AAA)
- `ecl_analyze_ecl_code` - Detect components, find anti-patterns, check design token usage
- `ecl_check_conflicts` - Identify incompatible component combinations

**Component Discovery:**
- `ecl_search_components` - Advanced multi-filter component search
- `ecl_get_component_details` - Complete component information

**API Documentation:**
- `ecl_search_api` - Search attributes, props, methods, events
- `ecl_get_component_api` - Get all API for a component

**Code Examples:**
- `ecl_search_code_examples` - Search by language, complexity, completeness
- `ecl_get_example` - Get complete code by ID
- `ecl_get_component_examples` - Get all examples for a component

**Usage Guidance:**
- `ecl_get_component_guidance` - Get do's, don'ts, best practices
- `ecl_search_guidance` - Search guidance across all components

**Component Relationships:**
- `ecl_find_related_components` - Find dependencies and conflicts
- `ecl_get_dependency_graph` - Build recursive dependency graph

**Design Tokens:**
- `ecl_search_design_tokens` - Search by name or category
- `ecl_get_tokens_by_category` - Get all tokens for category
- `ecl_get_token` - Get specific token details

---

## Legacy Tools (Phase 1)

### 1. `get_component`
Get detailed information about a specific ECL component.

**Parameters:**
- `component_name` (string): Name of the component (e.g., "button", "card", "accordion")

**Example:**
```json
{
  "component_name": "button"
}
```

### 2. `search_components`
Search for components by category, name, or keyword.

**Parameters:**
- `query` (string): Search query (category, keyword, or name)

**Example:**
```json
{
  "query": "forms"
}
```

### 3. `generate_component_code`
Generate ready-to-use HTML code for a component.

**Parameters:**
- `component_name` (string): Name of the component
- `variant` (string, optional): Component variant (e.g., "primary", "secondary")

**Example:**
```json
{
  "component_name": "button",
  "variant": "primary"
}
```

### 4. `get_setup_guide`
Get complete setup guide for integrating ECL.

**Parameters:**
- `method` (string): "npm", "cdn", or "complete"

**Example:**
```json
{
  "method": "complete"
}
```

### 5. `list_components_by_category`
List all components in a specific category.

**Parameters:**
- `category` (string): One of: "forms", "navigation", "content", "media", "banners", "site-wide"

**Example:**
```json
{
  "category": "forms"
}
```

### 6. `get_guidelines`
Get ECL design guidelines.

**Parameters:**
- `guideline_type` (string): One of: "typography", "colours", "colors", "images", "iconography", "spacing", "all"

**Example:**
```json
{
  "guideline_type": "typography"
}
```

### 7. `get_javascript_init`
Get JavaScript initialization code for components.

**Parameters:**
- `component_name` (string, optional): Specific component name

**Example:**
```json
{
  "component_name": "accordion"
}
```

## Available Resources

The server provides several resources that can be accessed directly:

- `ecl://overview` - Complete overview of ECL
- `ecl://installation` - Installation and setup guide
- `ecl://components` - List of all components
- `ecl://guidelines` - Design guidelines
- `ecl://setup-template` - Ready-to-use HTML template

## ECL Components Included

### Forms
Checkbox, Datepicker, File Upload, Radio, Range, Rating Field, Search Form, Select, Text Area, Text Field

### Navigation
Breadcrumb, Inpage Navigation, Links, Mega Menu, Menu, Navigation List, Pagination, Tabs

### Content
Accordion, Blockquote, Button, Card, Category Filter, Content Item, Date Block, Expandable, Fact & Figures, File, Icon, Label, List, List with Illustration, Loading Indicator, Message, Modal, News Ticker, Notification, Popover, Separator, Social Media Follow, Social Media Share, Splash Page, Table, Tag, Timeline

### Media
Featured Item, Gallery, Media Container

### Banners
Banner, Carousel

### Site-wide
Site Header, Page Header, Site Footer

## Features

### Core Capabilities
- ✅ **Comprehensive Database**: 169 crawled pages, 50+ components, 3,495 structured records
- ✅ **Semantic Search**: Multi-filter search across components, API, examples, and guidance
- ✅ **Rich Metadata**: Component complexity, JavaScript requirements, variants, status
- ✅ **Code Examples**: 756 examples with language, complexity, and completeness filtering
- ✅ **Usage Guidance**: 520+ do's, don'ts, best practices, and caveats
- ✅ **Accessibility Data**: 783 requirements with WCAG criteria and implementation notes
- ✅ **API Documentation**: 30+ entries covering attributes, props, methods, events
- ✅ **Component Tags**: 1,366 tags for advanced categorization
- ✅ **Design Tokens**: Token search by category (colors, spacing, typography)
- ✅ **Relationships**: Discover component dependencies and conflicts
- ✅ **Performance**: Query execution 0-50ms typical
- ✅ **Standardized Responses**: Consistent JSON format with metadata and suggestions

### Database Schema
```
8 New Tables (Phase 2):
├── component_metadata (169 records) - Component types and complexity
├── component_api (30 records) - Attributes, props, methods, events
├── design_tokens (0 records*) - Colors, spacing, typography tokens
├── usage_guidance (520 records) - Do's, don'ts, best practices
├── component_relationships (0 records*) - Requires/suggests/conflicts
├── component_tags (1,366 records) - Categorization tags
├── enhanced_code_examples (756 records) - Example metadata
└── accessibility_requirements (783 records) - WCAG, ARIA, keyboard support

*Needs refinement in future iterations
```

## Example Use Cases

### Finding and Understanding Components

```javascript
// 1. Search for interactive components requiring JavaScript
ecl_search_components({ 
  tag: "interactive", 
  requiresJs: true, 
  limit: 10 
})

// 2. Get complete details including tags, complexity, status
ecl_get_component_details({ component: "accordion" })

// 3. Check usage guidance (when to use, do's, don'ts)
ecl_get_component_guidance({ component: "accordion" })

// 4. Review accessibility requirements
// Returns WCAG criteria, ARIA patterns, keyboard support
```

### Building with Components

```javascript
// 1. Find form components
ecl_search_components({ category: "forms" })

// 2. Check component API
ecl_get_component_api({ component: "text-field" })

// 3. Get code examples filtered by complexity
ecl_search_code_examples({ 
  component: "text-field",
  language: "html",
  complexity: "basic"
})

// 4. Check for component dependencies
ecl_get_dependency_graph({ component: "form", maxDepth: 2 })
```

### Exploring Design Tokens

```javascript
// 1. List all token categories
ecl_get_token_categories()

// 2. Get all color tokens
ecl_get_tokens_by_category({ category: "color" })

// 3. Find specific token
ecl_get_token({ tokenName: "primary-color" })

// 4. Search tokens by keyword
ecl_search_design_tokens({ query: "spacing" })
```

### Accessibility Compliance

```javascript
// 1. Search for accessible components
ecl_search_components({ tag: "accessible" })

// 2. Get component details with accessibility data
ecl_get_component_details({ component: "button" })

// 3. Review WCAG requirements
// Returns accessibility_requirements with WCAG criteria
```

## ECL Version

This server is based on **ECL v4.11.1** (EU variant)

## Resources

- Official ECL Site: https://ec.europa.eu/component-library/
- GitHub: https://github.com/ec-europa/europa-component-library
- NPM: https://www.npmjs.com/org/ecl
- Playground: https://ec.europa.eu/component-library/playground/eu/

## License

MIT

## Important Notes

- Always host SVG sprites on the same domain to avoid CORS issues
- ECL uses Pikaday for datepicker - must be loaded separately
- Include Cookie Consent Kit before going live
- Recommended to host ECL resources locally rather than using CDN
- Use `data-ecl-auto-init` attribute for automatic component initialization
- Call `ECL.autoInit()` after page load for auto-initialization

## Support

For ECL-specific questions, refer to the official documentation at https://ec.europa.eu/component-library/

For issues with this MCP server, please check the code or create an issue in your repository.
