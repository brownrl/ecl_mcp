#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { startCleanupJob } from './src/utils/cache.js';
import { resourceDefinitions, handleResourceRequest } from './src/resources/index.js';
import { toolDefinitions, handleToolCall } from './src/tools/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ECL data
const eclDataPath = path.join(__dirname, 'ecl-data.json');
let eclData;

try {
  const data = await fs.readFile(eclDataPath, 'utf-8');
  eclData = JSON.parse(data);
} catch (error) {
  console.error('Error loading ECL data:', error);
  process.exit(1);
}

// Create server instance
const server = new Server(
  {
    name: 'ecl-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: resourceDefinitions,
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return handleResourceRequest(request.params.uri, eclData);
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolDefinitions,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return handleToolCall(name, args, eclData);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Start cache cleanup job (runs every 5 minutes)
  startCleanupJob();

  console.error('ECL MCP Server running on stdio');
  console.error('Cache cleanup job started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
