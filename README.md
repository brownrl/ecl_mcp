# EC Europa Component Library MCP Server

A Model Context Protocol (MCP) server that provides AI agents with access to the European Commission's Component Library documentation.

## Features

- **Full-text search** across 159 documentation pages
- **Structured data** with categories and hierarchical paths
- **Code examples extraction** - 270 clean HTML examples from 85 pages
- **Complete coverage** of EC components, forms, media, navigation, utilities, and layouts

## Installation

Install directly from GitHub:

```bash
npm install github:brownrl/eco_mcp
```

## Usage

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "ecl": {
      "command": "node",
      "args": [
        "/path/to/your/project/node_modules/eco_mcp/index.js"
      ]
    }
  }
}
```

Or use npx to run directly from GitHub without installation:

```json
{
  "mcpServers": {
    "ecl": {
      "command": "npx",
      "args": [
        "-y",
        "github:brownrl/eco_mcp"
      ]
    }
  }
}
```

## Available Tools

### `about`
Get information about this MCP server and what it provides.

### `search`
Search the EC Europa Component Library documentation.

**Parameters:**
- `query` (required): Search query to find relevant documentation pages
- `limit` (optional): Maximum number of results to return (default: 10)

**Returns:**
- Page title
- URL
- Category
- Hierarchical path
- Content snippet with search term highlighted

### `get_page`
Get the complete HTML content of a specific documentation page by URL.

**Parameters:**
- `url` (required): The full URL of the page to retrieve (from search results)

**Returns:**
- Page title, URL, category
- Complete HTML content

### `get_examples`
Get code examples from a specific documentation page by URL. Returns only the code blocks with their labels, making it faster than parsing full HTML.

**Parameters:**
- `url` (required): The full URL of the page to retrieve examples from (from search results)

**Returns:**
- Page title, URL, category
- List of code examples with labels
- Clean HTML (syntax highlighting stripped)

## Database

The server uses a SQLite database (`ecl-database.sqlite`) containing:
- 159 crawled documentation pages
- Full HTML content
- 270 extracted code examples from 85 pages
- Metadata (titles, categories, hierarchical paths)
- FTS5 full-text search index

## Updating Documentation

To re-crawl the documentation:

```bash
node crawl.js
```

This will:
- Fetch any new URLs from `pages-to-crawl.txt`
- Update metadata for existing pages (without re-fetching HTML)
- Extract and store hierarchical path information
- Extract code examples and store them separately for fast retrieval

## Example Workflow

```
1. Search for "table component"
2. Get examples: get_examples("https://ec.europa.eu/component-library/ec/components/table/code/")
3. Returns 5 clean HTML table examples with labels (Default, Zebra, Multi-header, Sort, Enhanced mobile)
```

## License

ISC
