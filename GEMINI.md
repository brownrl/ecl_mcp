# ECL MCP Server

This is a Model Context Protocol (MCP) server that provides comprehensive knowledge about the **Europa Component Library (ECL)** - the design system for the European Commission and websites managed by the Commission.

## Project Overview

This is a Node.js project that acts as a local server to provide a rich set of tools for interacting with the Europa Component Library (ECL). It uses the `@modelcontextprotocol/sdk` to implement the Model Context Protocol, making it compatible with clients like Gemini.

The server offers a wide range of functionalities, including:

*   **Component Search:** Advanced search for ECL components with various filters.
*   **Code Generation:** Generate customized components and interactive playgrounds.
*   **Validation:** Validate ECL component usage, check for accessibility issues, and analyze code quality.
*   **Documentation:** Access to setup guides, design guidelines, and component documentation.
*   **Data-driven:** The server is powered by a combination of a JSON file (`ecl-data.json`) and a SQLite database (`ecl-database.sqlite`) which contain scraped and structured data from the official ECL website.

## Building and Running

### Installation

To install the dependencies, run:

```bash
npm install
```

### Running the server

To start the server, run:

```bash
npm start
```

For development with auto-restart on file changes, use:

```bash
npm run dev
```

### Available Scripts

*   `npm start`: Starts the MCP server.
*   `npm run dev`: Starts the MCP server in watch mode.
*   `npm run crawl`: Crawls the ECL website to gather data.
*   `npm run extract`: Extracts structured data from the crawled data.

## Development Conventions

The project is structured with a clear separation of concerns:

*   **`src/`**: Contains the core logic of the server.
    *   **`db.js`**: Manages the SQLite database connection.
    *   **`generation/`**, **`generator/`**: Handles code generation.
    *   **`relationships/`**: Manages component relationships and dependencies.
    *   **`search/`**: Implements the search functionalities.
    *   **`tools/`**: Contains tool definitions and implementations.
    *   **`utils/`**: Provides utility functions.
    *   **`validation/`**: Implements the validation tools.
*   **`scripts/`**: Contains scripts for data crawling and extraction.
*   **`bin/`**: Contains the executable for the `ecl-mcp` command.
*   **`ecl-data.json`**: A JSON file containing scraped data from the ECL website.
*   **`ecl-database.sqlite`**: A SQLite database for structured data and advanced search capabilities.

The code is written in modern JavaScript (ESM) and follows a modular approach.
