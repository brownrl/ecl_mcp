#!/usr/bin/env node

/**
 * ECL MCP Server CLI Wrapper
 * 
 * This script provides a simple command-line interface for the ECL MCP server.
 * It can be executed directly via npx or after installing from GitHub.
 * 
 * Usage:
 *   ecl-mcp [--help] [--version]
 * 
 * The server runs in stdio mode for MCP protocol communication.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
ECL MCP Server - Europa Component Library Knowledge Base

Usage:
  ecl-mcp                Start the MCP server (stdio mode)
  ecl-mcp --help         Show this help message
  ecl-mcp --version      Show version information

The server provides 40+ specialized tools for working with ECL components:
  • 14 semantic search tools for components, API, examples, and guidance
  • 7 relationship and dependency tools
  • 4 validation and diagnostic tools (WCAG compliance, code quality)
  • 3 code generation tools (components, examples, playgrounds)
  • 4 design token tools
  • And more...

For use with MCP clients like Claude Desktop, Cline, and other AI coding assistants.

Documentation: https://github.com/brownrl/eco_mcp
ECL Official: https://ec.europa.eu/component-library/
  `);
    process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
    // Read version from package.json
    const packageJsonPath = join(__dirname, '..', 'package.json');
    try {
        const packageJson = await import(packageJsonPath, { assert: { type: 'json' } });
        console.log(`ECL MCP Server v${packageJson.default.version}`);
    } catch (error) {
        console.log('ECL MCP Server (version unknown)');
    }
    process.exit(0);
}

// Start the main server
const serverPath = join(__dirname, '..', 'index.js');

try {
    await import(serverPath);
} catch (error) {
    console.error('Failed to start ECL MCP Server:', error.message);
    process.exit(1);
}
