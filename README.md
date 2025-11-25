# EC Europa Component Library MCP Server

A Model Context Protocol (MCP) server that provides AI agents with access to the European Commission's Component Library documentation.

## Features

- **Full-text search** across 159 documentation pages
- **Structured data** with categories and hierarchical paths
- **Code examples extraction** - 270 clean HTML examples from 85 pages
- **Complete coverage** of EC components, forms, media, navigation, utilities, and layouts

## Installation

Install from GitHub:

```bash
npm install github:brownrl/ecl_mcp
```

## Configuration

### Charm Crush

Create a `.crush.json` file in your project root:

```json
{
  "$schema": "https://charm.land/crush.json",
  "mcp": {
    "ecl": {
      "command": "npx",
      "type": "stdio",
      "args": [
        "ecl-mcp"
      ]
    }
  }
}
```

### VSCode with MCP Extension

Create a `.vscode/mcp.json` file in your project root:

```json
{
  "servers": {
    "ecl": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "ecl-mcp"
      ]
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ecl": {
      "command": "npx",
      "type": "stdio",
      "args": [
        "ecl-mcp"
      ]
    }
  }
}
```

## Available Tools

### `start_here`
**CALL THIS FIRST!** Essential setup guide with asset download script and quick start instructions. Returns complete workflow for building ECL pages. ALL other tools assume you have to read this first.

**Parameters:** None

---

### `search_documentation_pages`
Search the EC Europa Component Library documentation. Returns matching pages with their titles, URLs, categories, and hierarchy information.

**Parameters:**
- `query` (string, required): Search query to find relevant documentation pages
- `limit` (number, optional): Maximum number of results to return (default: 10)

---

### `get_documentation_page`
Get the complete HTML content of a specific documentation page by URL. Use this after searching to retrieve full code examples and detailed documentation.

**Parameters:**
- `url` (string, required): The full URL of the page to retrieve (from search results)
- `content` (boolean, optional): If true (default), returns cleaned page content. If false, returns raw HTML.

---

### `get_documentation_page_examples`
Get code examples from a specific documentation page by URL. Returns only the code blocks with their labels, making it faster than parsing full HTML.

**Parameters:**
- `url` (string, required): The full URL of the page to retrieve examples from (from search results)

---

### `get_starter_template`
Get a basic HTML starter template with proper ECL local assets setup, ready to use. Use this as the foundation before adding ECL components. Returns a complete HTML page with correct script tags, CSS links, and local asset URLs.

**Parameters:**
- `title` (string, optional): Page title (optional, defaults to "ECL Page")

---

### `get_documentation_pages_list`
Get the complete list of all pages in the ECL documentation database. Returns URL, title, category, and hierarchy information for all 159 pages.

**Parameters:** None

---

### `list_recipes`
List all ECL recipes - pre-built component combinations and patterns. Returns all recipes sorted by ID with metadata. More comprehensive than individual component docs.

**Parameters:** None

---

### `get_recipe`
Get the complete recipe by ID. Returns full markdown content with step-by-step instructions, code examples, and best practices. Use this after recipe_search to get implementation details.

**Parameters:**
- `id` (number, required): Recipe ID from recipe_search results

---

### `search_examples`
Search all code examples using natural language queries. Returns matching examples with their code, labels, and source page URLs. Useful for finding specific HTML patterns, component implementations, or usage examples.

**Parameters:**
- `query` (string, required): Search query to find relevant code examples (e.g., "button primary", "checkbox required", "form validation")
- `limit` (number, optional): Maximum number of results to return (default: 10)

---

### `get_example`
Get a specific code example by its ID. Use this after search_examples to retrieve the full code for a specific example.

**Parameters:**
- `id` (number, required): The example ID from search_examples results

---

## Database

The server uses a SQLite database (`ecl-database.sqlite`, ~21MB) containing:

**Documentation:**
- 159 crawled documentation pages
- Full HTML content and cleaned content versions
- Metadata (titles, categories, hierarchical paths)
- FTS5 full-text search index

**Code Examples:**
- 270 extracted code examples from 85 pages
- Labeled examples with positions
- Separate FTS5 index for fast code search

**Recipes:**
- Curated implementation patterns and workflows
- Step-by-step guides with code
- Difficulty levels and component lists
- FTS5 indexed for search

## Technical Details

**MCP Protocol:** Model Context Protocol v1.0  
**Transport:** stdio  
**ECL Version:** v4.11.1  
**Database:** SQLite 3 with FTS5 full-text search  
**CDN:** Official EC CDN (cdn1.fpfis.tech.ec.europa.eu)

## License

None, I'm just sharing this as-is for educational purposes. please clone and use as you see fit!
