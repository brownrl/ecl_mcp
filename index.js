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
import { getDatabase, closeDatabase } from './src/db.js';
import * as Search from './src/search/index.js';
import * as Validation from './src/validation/index.js';
import * as Generator from './src/generator/index.js';
import * as Relationships from './src/relationships/index.js';
import * as Utils from './src/utils/index.js';
import { performHealthCheck } from './src/utils/health-check.js';
import { globalCache, startCleanupJob } from './src/utils/cache.js';
import { globalTracker } from './src/utils/performance.js';

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
    resources: [
      {
        uri: 'ecl://overview',
        mimeType: 'application/json',
        name: 'ECL Overview',
        description: 'Complete overview of Europa Component Library',
      },
      {
        uri: 'ecl://installation',
        mimeType: 'application/json',
        name: 'ECL Installation Guide',
        description: 'How to install and set up ECL in your project',
      },
      {
        uri: 'ecl://components',
        mimeType: 'application/json',
        name: 'ECL Components List',
        description: 'List of all available ECL components',
      },
      {
        uri: 'ecl://guidelines',
        mimeType: 'application/json',
        name: 'ECL Guidelines',
        description: 'Design guidelines for typography, colors, spacing, etc.',
      },
      {
        uri: 'ecl://setup-template',
        mimeType: 'text/html',
        name: 'ECL HTML Setup Template',
        description: 'Ready-to-use HTML template with ECL integration',
      },
    ],
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === 'ecl://overview') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              name: eclData.name,
              description: eclData.description,
              version: eclData.version,
              resources: eclData.resources,
              important_notes: eclData.important_notes,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (uri === 'ecl://installation') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              installation: eclData.installation,
              setup: eclData.setup,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (uri === 'ecl://components') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              components: eclData.components,
              total_count: Object.keys(eclData.components).length,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (uri === 'ecl://guidelines') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              guidelines: eclData.guidelines,
              utilities: eclData.utilities,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (uri === 'ecl://setup-template') {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/html',
          text: eclData.setup.html_template,
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ===== LEGACY TOOLS (Phase 1 - for backward compatibility) =====
      {
        name: 'get_component',
        description: '[LEGACY] Get basic component info from JSON. Use ecl_get_component_details for complete information.',
        inputSchema: {
          type: 'object',
          properties: {
            component_name: {
              type: 'string',
              description: 'Name of the ECL component (e.g., "button", "card", "accordion")',
            },
          },
          required: ['component_name'],
        },
      },
      {
        name: 'search_components',
        description: '[LEGACY] Basic component search. Use ecl_search_components for advanced filtering.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (can be category like "forms", "navigation" or keyword like "input", "menu")',
            },
          },
          required: ['query'],
        },
      },

      // ===== ENHANCED COMPONENT SEARCH (Phase 3) =====
      {
        name: 'ecl_search_components',
        description: 'Advanced component search with filters (category, tags, complexity, JS requirements). Returns structured metadata.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (component name, description keyword)',
            },
            category: {
              type: 'string',
              description: 'Filter by category (e.g., "forms", "navigation", "content")',
            },
            tag: {
              type: 'string',
              description: 'Filter by tag (e.g., "interactive", "form-control", "responsive")',
            },
            complexity: {
              type: 'string',
              enum: ['basic', 'intermediate', 'advanced'],
              description: 'Filter by complexity level',
            },
            requiresJs: {
              type: 'boolean',
              description: 'Filter components that require/don\'t require JavaScript',
            },
            limit: {
              type: 'number',
              description: 'Max results (default: 20)',
            },
          },
        },
      },
      {
        name: 'ecl_get_component_details',
        description: 'Get complete component information including metadata, tags, guidance (do/don\'t), API docs, and code examples.',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component name or page ID',
            },
          },
          required: ['component'],
        },
      },

      // ===== API DOCUMENTATION SEARCH (Phase 3) =====
      {
        name: 'ecl_search_api',
        description: 'Search component API documentation (attributes, props, methods, events, slots, CSS variables).',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (API name, description keyword)',
            },
            apiType: {
              type: 'string',
              enum: ['attribute', 'prop', 'method', 'event', 'slot', 'css-variable'],
              description: 'Filter by API type',
            },
            required: {
              type: 'boolean',
              description: 'Filter by required/optional status',
            },
            limit: {
              type: 'number',
              description: 'Max results (default: 50)',
            },
          },
        },
      },
      {
        name: 'ecl_get_component_api',
        description: 'Get all API documentation for a specific component (all attributes, props, methods, events).',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component name or page ID',
            },
          },
          required: ['component'],
        },
      },

      // ===== CODE EXAMPLE SEARCH (Phase 3) =====
      {
        name: 'ecl_search_code_examples',
        description: 'Search code examples by component, language, complexity, or completeness.',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Filter by component name',
            },
            language: {
              type: 'string',
              enum: ['html', 'javascript', 'css', 'jsx', 'vue', 'twig'],
              description: 'Filter by programming language',
            },
            complexity: {
              type: 'string',
              enum: ['basic', 'intermediate', 'advanced'],
              description: 'Filter by complexity level',
            },
            completeExample: {
              type: 'boolean',
              description: 'Filter by complete vs snippet examples',
            },
            interactive: {
              type: 'boolean',
              description: 'Filter by interactive examples',
            },
            limit: {
              type: 'number',
              description: 'Max results (default: 30)',
            },
          },
        },
      },
      {
        name: 'ecl_get_example',
        description: 'Get complete code for a specific example by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            exampleId: {
              type: 'number',
              description: 'Example ID from code_examples table',
            },
          },
          required: ['exampleId'],
        },
      },
      {
        name: 'ecl_get_component_examples',
        description: 'Get all code examples for a specific component.',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component name or page ID',
            },
          },
          required: ['component'],
        },
      },

      // ===== USAGE GUIDANCE (Phase 3) =====
      {
        name: 'ecl_get_component_guidance',
        description: 'Get usage guidance for a component (when to use, when not to use, do\'s, don\'ts, best practices, caveats).',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component name or page ID',
            },
          },
          required: ['component'],
        },
      },
      {
        name: 'ecl_search_guidance',
        description: 'Search guidance content across all components by keyword.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (guidance content keyword)',
            },
            guidanceType: {
              type: 'string',
              enum: ['when-to-use', 'when-not-to-use', 'do', 'dont', 'best-practice', 'caveat', 'limitation', 'note'],
              description: 'Filter by guidance type',
            },
            limit: {
              type: 'number',
              description: 'Max results (default: 30)',
            },
          },
        },
      },

      // ===== COMPONENT RELATIONSHIPS (Phase 3) =====
      {
        name: 'ecl_find_related_components',
        description: 'Find components related to a given component (requires, suggests, alternatives, contains, conflicts).',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component name or page ID',
            },
            relationshipType: {
              type: 'string',
              enum: ['requires', 'suggests', 'alternative', 'contains', 'conflicts', 'extends'],
              description: 'Filter by relationship type',
            },
          },
          required: ['component'],
        },
      },
      {
        name: 'ecl_get_dependency_graph',
        description: 'Build recursive dependency graph for a component (what it requires and what requires it).',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component name or page ID',
            },
            maxDepth: {
              type: 'number',
              description: 'Maximum recursion depth (default: 3)',
            },
          },
          required: ['component'],
        },
      },

      // ===== DESIGN TOKENS (Phase 3) =====
      {
        name: 'ecl_search_design_tokens',
        description: 'Search design tokens (colors, spacing, typography, breakpoints, etc.) by name or category.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (token name, CSS variable, or value)',
            },
            category: {
              type: 'string',
              enum: ['color', 'spacing', 'typography', 'breakpoint', 'shadow', 'border-radius', 'z-index', 'timing'],
              description: 'Filter by token category',
            },
            limit: {
              type: 'number',
              description: 'Max results (default: 50)',
            },
          },
        },
      },
      {
        name: 'ecl_get_tokens_by_category',
        description: 'Get all design tokens for a specific category.',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['color', 'spacing', 'typography', 'breakpoint', 'shadow', 'border-radius', 'z-index', 'timing'],
              description: 'Token category',
            },
          },
          required: ['category'],
        },
      },
      {
        name: 'ecl_get_token',
        description: 'Get a specific design token by exact name or CSS variable.',
        inputSchema: {
          type: 'object',
          properties: {
            tokenName: {
              type: 'string',
              description: 'Token name or CSS variable (e.g., "primary-color" or "--ecl-color-primary")',
            },
          },
          required: ['tokenName'],
        },
      },
      {
        name: 'ecl_get_token_categories',
        description: 'List all design token categories with counts.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'generate_component_code',
        description: 'Generate ready-to-use HTML code for an ECL component with optional customization',
        inputSchema: {
          type: 'object',
          properties: {
            component_name: {
              type: 'string',
              description: 'Name of the ECL component',
            },
            variant: {
              type: 'string',
              description: 'Optional variant (e.g., "primary", "secondary" for buttons)',
            },
          },
          required: ['component_name'],
        },
      },
      {
        name: 'get_setup_guide',
        description: 'Get complete setup guide for integrating ECL into a project',
        inputSchema: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              enum: ['npm', 'cdn', 'complete'],
              description: 'Installation method: npm, cdn, or complete guide',
            },
          },
          required: ['method'],
        },
      },
      {
        name: 'list_components_by_category',
        description: 'List all components in a specific category',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['forms', 'navigation', 'content', 'media', 'banners', 'site-wide'],
              description: 'Component category',
            },
          },
          required: ['category'],
        },
      },
      {
        name: 'get_guidelines',
        description: 'Get ECL design guidelines for typography, colors, spacing, etc.',
        inputSchema: {
          type: 'object',
          properties: {
            guideline_type: {
              type: 'string',
              enum: ['typography', 'colours', 'colors', 'images', 'iconography', 'spacing', 'all'],
              description: 'Type of guideline to retrieve',
            },
          },
          required: ['guideline_type'],
        },
      },
      {
        name: 'get_javascript_init',
        description: 'Get JavaScript initialization code for ECL components',
        inputSchema: {
          type: 'object',
          properties: {
            component_name: {
              type: 'string',
              description: 'Component name to get initialization code for (optional - returns general info if not provided)',
            },
          },
        },
      },

      // ===== VALIDATION & DIAGNOSTICS (Phase 4) =====
      {
        name: 'ecl_validate_component_usage',
        description: 'Validate ECL component HTML/JS code against requirements. Checks structure, attributes, accessibility, best practices, and returns quality score.',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component name to validate',
            },
            html_code: {
              type: 'string',
              description: 'HTML code to validate',
            },
            js_code: {
              type: 'string',
              description: 'Optional JavaScript code to validate',
            },
            context: {
              type: 'string',
              description: 'Optional usage context for contextual validation',
            },
          },
          required: ['component', 'html_code'],
        },
      },
      {
        name: 'ecl_check_accessibility',
        description: 'Check HTML code for WCAG 2.1 accessibility compliance (Level A, AA, AAA). Validates ARIA, keyboard access, contrast, focus, and component-specific requirements.',
        inputSchema: {
          type: 'object',
          properties: {
            html_code: {
              type: 'string',
              description: 'HTML code to check for accessibility',
            },
            component: {
              type: 'string',
              description: 'Optional component name for component-specific checks',
            },
            wcag_level: {
              type: 'string',
              enum: ['A', 'AA', 'AAA'],
              description: 'Target WCAG level (default: AA)',
            },
          },
          required: ['html_code'],
        },
      },
      {
        name: 'ecl_analyze_ecl_code',
        description: 'Analyze ECL code for components, design tokens, best practices, and maintainability. Returns quality score and recommendations.',
        inputSchema: {
          type: 'object',
          properties: {
            html_code: {
              type: 'string',
              description: 'HTML code to analyze',
            },
            js_code: {
              type: 'string',
              description: 'Optional JavaScript code to analyze',
            },
            css_code: {
              type: 'string',
              description: 'Optional CSS code to analyze',
            },
          },
          required: ['html_code'],
        },
      },
      {
        name: 'ecl_check_conflicts',
        description: 'Check for conflicts or compatibility issues between ECL components. Identifies z-index conflicts, nesting issues, and incompatible combinations.',
        inputSchema: {
          type: 'object',
          properties: {
            components: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of component names to check for conflicts',
            },
            context: {
              type: 'string',
              description: 'Optional usage context',
            },
          },
          required: ['components'],
        },
      },

      // ===== CODE GENERATION (Phase 5) =====
      {
        name: 'ecl_get_complete_example',
        description: 'Get a complete, runnable example for a component with all dependencies (HTML/CSS/JS). Returns full working code with CDN links, initialization scripts, and customization guide.',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component name',
            },
            example_type: {
              type: 'string',
              description: 'Type of example (basic/advanced/interactive)',
            },
            variant: {
              type: 'string',
              description: 'Component variant (e.g., primary/secondary)',
            },
          },
          required: ['component'],
        },
      },
      {
        name: 'ecl_generate_component',
        description: 'Generate customized ECL component code with options. Applies variants, sizes, content, attributes, and ensures accessibility compliance.',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component name to generate',
            },
            customization: {
              type: 'object',
              description: 'Customization options (variant, size, color, content, attributes)',
            },
            framework: {
              type: 'string',
              enum: ['vanilla', 'react', 'vue'],
              description: 'Target framework (default: vanilla)',
            },
            include_comments: {
              type: 'boolean',
              description: 'Include explanatory comments in generated code',
            },
          },
          required: ['component'],
        },
      },
      {
        name: 'ecl_create_playground',
        description: 'Create a standalone HTML playground file with multiple ECL components for testing. Returns complete HTML file with navigation, examples, and code viewers.',
        inputSchema: {
          type: 'object',
          properties: {
            components: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of component names to include in playground',
            },
            custom_code: {
              type: 'string',
              description: 'Optional custom HTML code to include',
            },
            include_all_variants: {
              type: 'boolean',
              description: 'Include all variants of each component (default: false)',
            },
          },
          required: ['components'],
        },
      },

      // ===== PAGE UTILITIES (Phase 10) =====
      {
        name: 'ecl_get_page_requirements',
        description: 'Get complete ECL page requirements and boilerplate code. Returns DOCTYPE, html structure, CSS/JS links with CDN URLs, font requirements, icon sprite setup, and initialization scripts. Critical for starting new ECL projects.',
        inputSchema: {
          type: 'object',
          properties: {
            preset: {
              type: 'string',
              enum: ['ec', 'eu'],
              description: 'ECL preset: "ec" (European Commission) or "eu" (European Union). Default: "ec"',
            },
            include_reset: {
              type: 'boolean',
              description: 'Include ECL reset/normalize CSS (default: true)',
            },
            include_optional: {
              type: 'boolean',
              description: 'Include optional ECL utilities like print styles (default: false)',
            },
            components: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Components you plan to use (determines JavaScript requirements)',
            },
            cdn_version: {
              type: 'string',
              description: 'ECL version to use (default: "4.11.1")',
            },
          },
        },
      },
      {
        name: 'ecl_get_cdn_resources',
        description: 'Get all ECL CDN resource URLs for offline development. Returns download URLs for CSS, JavaScript, icons, logos, and fonts. Useful for local hosting or offline development.',
        inputSchema: {
          type: 'object',
          properties: {
            preset: {
              type: 'string',
              enum: ['ec', 'eu'],
              description: 'ECL preset: "ec" or "eu". Default: "ec"',
            },
            version: {
              type: 'string',
              description: 'ECL version (default: "4.11.1")',
            },
          },
        },
      },
      {
        name: 'ecl_generate_complete_page',
        description: 'Generate a complete, ready-to-use ECL page with all boilerplate, selected components, and initialization code. Returns full HTML file that can be saved and opened in a browser. Includes DOCTYPE, CSS links, JavaScript initialization, and font fixes.',
        inputSchema: {
          type: 'object',
          properties: {
            preset: {
              type: 'string',
              enum: ['ec', 'eu'],
              description: 'ECL preset: "ec" or "eu". Default: "ec"',
            },
            page_type: {
              type: 'string',
              enum: ['basic', 'landing', 'article', 'search-results', 'list-page'],
              description: 'Page template type. Default: "basic"',
            },
            page_title: {
              type: 'string',
              description: 'Page title for <title> tag. Default: "European Commission Page"',
            },
            components: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of component names to include (e.g., ["Site header", "Breadcrumb", "Button"])',
            },
            content: {
              type: 'object',
              description: 'Content placeholders: { mainHeading, leadParagraph }',
            },
            cdn_version: {
              type: 'string',
              description: 'ECL version (default: "4.11.1")',
            },
            include_reset: {
              type: 'boolean',
              description: 'Include font-family reset fix (default: true)',
            },
            include_print: {
              type: 'boolean',
              description: 'Include print stylesheet (default: false)',
            },
          },
        },
      },
      {
        name: 'ecl_get_icon_library',
        description: 'Get comprehensive ECL icon library with all available icons, categories, CDN paths, and usage examples. Returns complete list of UI, general, file type, and social media icons with proper xlink:href patterns.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'ecl_search_icons',
        description: 'Search ECL icon library by name, ID, or description. Returns matching icons with CDN paths for both EC and EU presets, usage examples, and accessibility guidelines.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search term (icon name, ID, or description)',
            },
            category: {
              type: 'string',
              enum: ['ui', 'general', 'files', 'social'],
              description: 'Filter by icon category',
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 20)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'ecl_get_icon_by_id',
        description: 'Get detailed information about a specific ECL icon including CDN paths, usage examples for different contexts (standalone, button, icon-only), rotation options, and accessibility notes.',
        inputSchema: {
          type: 'object',
          properties: {
            icon_id: {
              type: 'string',
              description: 'Icon ID (e.g., "search", "download", "corner-arrow")',
            },
            preset: {
              type: 'string',
              enum: ['ec', 'eu'],
              description: 'ECL preset for CDN path (default: "ec")',
            },
            size: {
              type: 'string',
              enum: ['xs', 's', 'm', 'l'],
              description: 'Icon size class (default: "xs")',
            },
          },
          required: ['icon_id'],
        },
      },
      {
        name: 'ecl_get_typography_guide',
        description: 'Get complete ECL typography documentation including all utility classes, font families, sizes, weights, line heights, semantic HTML usage, troubleshooting, and critical notes about ECL font-family gaps.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'ecl_search_typography',
        description: 'Search ECL typography utilities by class name or usage. Returns matching heading classes, paragraph classes, font weights, text styles, and color utilities with examples.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search term (class name or usage description)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'ecl_get_page_structure_patterns',
        description: 'Get common ECL page structure patterns with component hierarchies, nesting rules, and HTML templates. Includes patterns for news articles, landing pages, list pages, documentation, and search results.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'ecl_get_page_pattern',
        description: 'Get detailed structure pattern for a specific page type including required/optional components, nesting hierarchy, implementation steps, and complete HTML template.',
        inputSchema: {
          type: 'object',
          properties: {
            pattern_id: {
              type: 'string',
              enum: ['news-article', 'landing-page', 'list-page', 'documentation-page', 'search-results'],
              description: 'Page pattern type',
            },
          },
          required: ['pattern_id'],
        },
      },
      {
        name: 'ecl_get_component_nesting_rules',
        description: 'Get nesting rules for a specific ECL component including allowed parents, required children, position guidelines, and correct/incorrect examples.',
        inputSchema: {
          type: 'object',
          properties: {
            component_name: {
              type: 'string',
              description: 'Component name (e.g., "Card", "Accordion", "Site Header")',
            },
          },
          required: ['component_name'],
        },
      },

      // ===== FORM COMPONENTS (Phase 7) =====
      {
        name: 'ecl_get_form_templates',
        description: 'Get validated form component templates with exact ECL structure. Returns all 9 form templates (text input, email, select, textarea, checkbox, radio, button) with critical notes about correct structure.',
        inputSchema: {
          type: 'object',
          properties: {
            template_type: {
              type: 'string',
              enum: ['form-text-input-required', 'form-text-input-optional', 'form-email-input', 'form-select-dropdown', 'form-textarea', 'form-checkbox-single', 'form-checkbox-group', 'form-radio-group', 'form-submit-button'],
              description: 'Specific template type (optional - omit to get all templates)',
            },
          },
        },
      },
      {
        name: 'ecl_get_complete_contact_form',
        description: 'Get complete validated contact form example with all form elements. Includes text inputs, email, select dropdown, textarea, checkbox, and submit button. All structure is correct and validated.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'ecl_get_form_guidance',
        description: 'Get comprehensive form structure guidance including critical requirements, best practices, and common mistakes. Covers helper text positioning, label structure, required indicators, and accessibility.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for specific guidance (optional)',
            },
          },
        },
      },
      {
        name: 'ecl_validate_form_structure',
        description: 'Validate form HTML structure against ECL requirements. Checks for helper text positioning, label attributes, required indicators, select dropdown structure, checkbox/radio structure, and accessibility attributes.',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              enum: ['Text Field', 'Select', 'Text Area', 'Checkbox', 'Radio', 'Complete Forms'],
              description: 'Form component type to validate',
            },
            html_code: {
              type: 'string',
              description: 'HTML code to validate',
            },
          },
          required: ['component', 'html_code'],
        },
      },
      {
        name: 'ecl_troubleshoot_forms',
        description: 'Get troubleshooting advice for common form issues. Analyzes symptoms and provides causes, fixes, and related templates. Covers spacing issues, helper text problems, select dropdowns, checkboxes, required indicators, and accessibility.',
        inputSchema: {
          type: 'object',
          properties: {
            issue: {
              type: 'string',
              description: 'Description of the form issue (e.g., "spacing", "helper-text", "select", "checkbox", "required", "accessibility")',
            },
          },
          required: ['issue'],
        },
      },
      {
        name: 'ecl_get_form_validation_checklist',
        description: 'Get comprehensive form validation checklist. Includes structure requirements, accessibility checks, component-specific validations, and visual symptom checks.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // ===== RELATIONSHIPS & DEPENDENCIES (Phase 6) =====
      {
        name: 'ecl_find_components_by_tag',
        description: 'Find components by tags (feature, category, accessibility, interaction). Supports searching with multiple tags and different match modes.',
        inputSchema: {
          type: 'object',
          properties: {
            tags: {
              oneOf: [
                { type: 'string' },
                {
                  type: 'array',
                  items: { type: 'string' }
                }
              ],
              description: 'Single tag or array of tags to search for',
            },
            tag_type: {
              type: 'string',
              description: 'Filter by tag type: feature, category, accessibility, interaction',
            },
            match_mode: {
              type: 'string',
              description: 'Match mode: "any" (default) or "all" for multiple tags',
            },
            include_metadata: {
              type: 'boolean',
              description: 'Include component metadata (default: true)',
            },
          },
          required: ['tags'],
        },
      },
      {
        name: 'ecl_get_available_tags',
        description: 'Get all available tags for categorizing and discovering components. Returns tags grouped by type with usage counts.',
        inputSchema: {
          type: 'object',
          properties: {
            tag_type: {
              type: 'string',
              description: 'Filter by tag type: feature, category, accessibility, interaction',
            },
            include_counts: {
              type: 'boolean',
              description: 'Include component counts per tag (default: true)',
            },
          },
        },
      },
      {
        name: 'ecl_find_similar_components',
        description: 'Find components similar to a given component based on shared tags. Returns similarity scores and shared features.',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component name to find similar components for',
            },
            min_shared_tags: {
              type: 'number',
              description: 'Minimum shared tags required (default: 2)',
            },
            limit: {
              type: 'number',
              description: 'Maximum results to return (default: 10)',
            },
          },
          required: ['component'],
        },
      },
      {
        name: 'ecl_analyze_dependencies',
        description: 'Analyze component dependencies including required ECL assets, JavaScript needs, other components, and accessibility requirements.',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component name to analyze',
            },
            include_suggestions: {
              type: 'boolean',
              description: 'Include suggested components (default: true)',
            },
            include_conflicts: {
              type: 'boolean',
              description: 'Include conflicting components (default: true)',
            },
            recursive: {
              type: 'boolean',
              description: 'Follow full dependency chain (default: false)',
            },
          },
          required: ['component'],
        },
      },
      {
        name: 'ecl_build_relationship_graph',
        description: 'Build a visualizable graph of component relationships. Returns graph data in Cytoscape, D3, or Mermaid format.',
        inputSchema: {
          type: 'object',
          properties: {
            components: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Specific components to include (null = all)',
            },
            relationship_types: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Types to include: requires, suggests, contains, alternative',
            },
            max_depth: {
              type: 'number',
              description: 'Maximum relationship depth (default: 2)',
            },
            format: {
              type: 'string',
              description: 'Output format: cytoscape (default), d3, mermaid',
            },
          },
        },
      },
      {
        name: 'ecl_analyze_conflicts',
        description: 'Analyze potential conflicts between multiple components. Returns conflicts, warnings, risk scores, and recommendations.',
        inputSchema: {
          type: 'object',
          properties: {
            components: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of component names to check for conflicts (minimum 2)',
            },
            include_warnings: {
              type: 'boolean',
              description: 'Include warning-level conflicts (default: true)',
            },
            include_recommendations: {
              type: 'boolean',
              description: 'Include recommendations (default: true)',
            },
          },
          required: ['components'],
        },
      },
      {
        name: 'ecl_suggest_alternatives',
        description: 'Suggest alternative components based on feature similarity. Useful when a component conflicts or doesn\'t fit requirements.',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component name to find alternatives for',
            },
          },
          required: ['component'],
        },
      },

      // ===== SYSTEM HEALTH & DIAGNOSTICS (Phase 8) =====
      {
        name: 'ecl_health_check',
        description: 'Get system health status including database, cache, performance metrics, and tool availability.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Database connection for Phase 3 tools
  let db = null;

  try {
    // Initialize database for Phase 3 tools
    if (name.startsWith('ecl_')) {
      db = getDatabase(true); // readonly
    }
    if (name === 'get_component') {
      const componentName = args.component_name.toLowerCase().replace(/\s+/g, '-');
      const component = eclData.components[componentName];

      if (!component) {
        return {
          content: [
            {
              type: 'text',
              text: `Component "${args.component_name}" not found. Use search_components to find available components.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                name: component.name,
                category: component.category,
                description: component.description,
                usage: component.usage,
                url: component.url,
                variants: component.variants,
                dependencies: component.dependencies,
                auto_init: component.auto_init,
                example: component.example,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'search_components') {
      const query = args.query.toLowerCase();
      const results = [];

      for (const [key, component] of Object.entries(eclData.components)) {
        if (
          key.includes(query) ||
          component.name.toLowerCase().includes(query) ||
          component.category.includes(query) ||
          component.description.toLowerCase().includes(query)
        ) {
          results.push({
            id: key,
            name: component.name,
            category: component.category,
            description: component.description,
            url: component.url,
          });
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                query: args.query,
                count: results.length,
                results: results,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'generate_component_code') {
      const componentName = args.component_name.toLowerCase().replace(/\s+/g, '-');
      const component = eclData.components[componentName];

      if (!component) {
        return {
          content: [
            {
              type: 'text',
              text: `Component "${args.component_name}" not found.`,
            },
          ],
        };
      }

      let code = component.example || `<!-- ${component.name} component -->\n<!-- See documentation: ${component.url} -->`;

      if (args.variant && component.variants) {
        code += `\n\n<!-- Available variants: ${component.variants.join(', ')} -->`;
      }

      if (component.auto_init) {
        code += `\n\n<!-- Auto-initialization: Add data-ecl-auto-init="${component.auto_init}" to the root element -->`;
      }

      return {
        content: [
          {
            type: 'text',
            text: code,
          },
        ],
      };
    }

    if (name === 'get_setup_guide') {
      const method = args.method;

      if (method === 'npm') {
        return {
          content: [
            {
              type: 'text',
              text: `# ECL Setup with NPM

## Installation
\`\`\`bash
${eclData.installation.npm}
# or
${eclData.installation.yarn}
\`\`\`

## Setup
1. Install the package in your project
2. Import or copy the CSS and JS files to your public directory
3. Reference them in your HTML:

\`\`\`html
<link rel="stylesheet" href="/styles/ecl-eu.css" media="screen" />
<script src="/scripts/ecl-eu.js"></script>
<script>
  ECL.autoInit();
</script>
\`\`\`

## Optional Dependencies
${eclData.setup.dependencies.pikaday}: ${eclData.setup.dependencies.moment}
`,
            },
          ],
        };
      }

      if (method === 'cdn') {
        return {
          content: [
            {
              type: 'text',
              text: `# ECL Setup with CDN

## CDN Pattern
${eclData.installation.cdn_pattern}

## Example
${eclData.installation.cdn_example}

## Important Notes
${eclData.important_notes.filter((note) => note.includes('CDN') || note.includes('SVG')).join('\n')}

## Setup
\`\`\`html
<link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v${eclData.version}/eu/styles/ecl-eu.css" media="screen" />
<script src="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v${eclData.version}/eu/scripts/ecl-eu.js"></script>
<script>
  ECL.autoInit();
</script>
\`\`\`
`,
            },
          ],
        };
      }

      // complete
      return {
        content: [
          {
            type: 'text',
            text: `# Complete ECL Setup Guide

## Installation Options

### NPM (Recommended)
\`\`\`bash
${eclData.installation.npm}
\`\`\`

### CDN
${eclData.installation.cdn_pattern}

## Complete HTML Template
\`\`\`html
${eclData.setup.html_template}
\`\`\`

## Optional Styles
${eclData.setup.optional_styles.map((s) => `- **${s.name}**: ${s.description}`).join('\n')}

## JavaScript Initialization
- **Auto-init**: ${eclData.setup.javascript.auto_init}
- **Data attribute**: ${eclData.setup.javascript.data_attribute}

## Important Notes
${eclData.important_notes.map((note) => `- ${note}`).join('\n')}

## Resources
- Playground: ${eclData.resources.playground}
- GitHub: ${eclData.resources.github}
- NPM: ${eclData.resources.npm_org}
`,
          },
        ],
      };
    }

    if (name === 'list_components_by_category') {
      const category = args.category;
      const components = Object.entries(eclData.components)
        .filter(([_, comp]) => comp.category === category)
        .map(([key, comp]) => ({
          id: key,
          name: comp.name,
          description: comp.description,
          url: comp.url,
        }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                category: category,
                count: components.length,
                components: components,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'get_guidelines') {
      const type = args.guideline_type.toLowerCase();

      if (type === 'all') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  guidelines: eclData.guidelines,
                  utilities: eclData.utilities,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Handle both 'colours' and 'colors'
      const guidelineKey = type === 'colors' ? 'colours' : type;
      const guideline = eclData.guidelines[guidelineKey];

      if (!guideline) {
        return {
          content: [
            {
              type: 'text',
              text: `Guideline type "${args.guideline_type}" not found. Available: typography, colours, images, iconography, spacing`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(guideline, null, 2),
          },
        ],
      };
    }

    if (name === 'get_javascript_init') {
      const componentName = args.component_name
        ? args.component_name.toLowerCase().replace(/\s+/g, '-')
        : null;

      if (componentName) {
        const component = eclData.components[componentName];

        if (!component) {
          return {
            content: [
              {
                type: 'text',
                text: `Component "${args.component_name}" not found.`,
              },
            ],
          };
        }

        if (!component.auto_init) {
          return {
            content: [
              {
                type: 'text',
                text: `Component "${component.name}" does not require JavaScript initialization.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `# JavaScript Initialization for ${component.name}

## Auto-initialization
Add the data attribute to the root element:
\`\`\`html
data-ecl-auto-init="${component.auto_init}"
\`\`\`

## Complete Example
\`\`\`html
${component.example || `<!-- Add data-ecl-auto-init="${component.auto_init}" to the component root -->`}
\`\`\`

## Global Initialization
Add to the end of your page:
\`\`\`html
<script src="/scripts/ecl-eu.js"></script>
<script>
  ECL.autoInit();
</script>
\`\`\`

For manual initialization, see: ${component.url}
`,
            },
          ],
        };
      }

      // General JavaScript info
      return {
        content: [
          {
            type: 'text',
            text: `# ECL JavaScript Initialization

## Auto-initialization (Recommended)
1. Add data attribute to component root element:
   \`\`\`html
   data-ecl-auto-init="[ComponentName]"
   \`\`\`

2. Call ECL.autoInit() after page load:
   \`\`\`html
   <script src="/scripts/ecl-eu.js"></script>
   <script>
     ECL.autoInit();
   </script>
   \`\`\`

## Components requiring JavaScript
${Object.entries(eclData.components)
                .filter(([_, comp]) => comp.auto_init)
                .map(([_, comp]) => `- **${comp.name}**: data-ecl-auto-init="${comp.auto_init}"`)
                .join('\n')}

## Dependencies
${Object.entries(eclData.setup.dependencies)
                .map(([key, value]) => `- **${key}**: ${value}`)
                .join('\n')}

For manual initialization details, check individual component documentation.
`,
          },
        ],
      };
    }

    // ===== PHASE 3 ENHANCED SEARCH TOOLS =====

    // Component Search
    if (name === 'ecl_search_components') {
      const result = Search.searchComponents(db, args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_component_details') {
      const result = Search.getComponentDetails(db, args.component);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // API Search
    if (name === 'ecl_search_api') {
      const result = Search.searchAPI(db, args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_component_api') {
      const result = Search.getComponentAPI(db, args.component);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Code Example Search
    if (name === 'ecl_search_code_examples') {
      const result = Search.searchExamples(db, args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_example') {
      const result = Search.getExample(db, args.exampleId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_component_examples') {
      const result = Search.getComponentExamples(db, args.component);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Guidance Search
    if (name === 'ecl_get_component_guidance') {
      const result = Search.getComponentGuidance(db, args.component);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_search_guidance') {
      const result = Search.searchGuidance(db, args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Relationship Search
    if (name === 'ecl_find_related_components') {
      const result = Search.findRelatedComponents(db, args.component, args.relationshipType);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_dependency_graph') {
      const result = Search.getDependencyGraph(db, args.component, args.maxDepth);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Design Token Search
    if (name === 'ecl_search_design_tokens') {
      const result = Search.searchDesignTokens(db, args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_tokens_by_category') {
      const result = Search.getTokensByCategory(db, args.category);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_token') {
      const result = Search.getToken(db, args.tokenName);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_token_categories') {
      const result = Search.getTokenCategories(db);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Validation & Diagnostics
    if (name === 'ecl_validate_component_usage') {
      const result = await Validation.validateComponentUsage(
        db,
        args.component,
        args.html_code,
        args.js_code,
        args.context
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_check_accessibility') {
      const result = await Validation.checkAccessibility(
        db,
        args.html_code,
        args.component,
        args.wcag_level
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_analyze_ecl_code') {
      const result = await Validation.analyzeEclCode(
        db,
        args.html_code,
        args.js_code,
        args.css_code
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_check_conflicts') {
      const result = await Validation.checkConflicts(
        db,
        args.components,
        args.context
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Code Generation (Phase 5)
    if (name === 'ecl_get_complete_example') {
      const result = Generator.getCompleteExample(
        db,
        args.component,
        {
          exampleType: args.example_type,
          variant: args.variant
        }
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_generate_component') {
      const result = Generator.generateComponent(
        db,
        args.component,
        {
          customization: args.customization,
          framework: args.framework || 'vanilla',
          includeComments: args.include_comments || false
        }
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_create_playground') {
      const result = Generator.createPlayground(
        db,
        args.components,
        {
          customCode: args.custom_code,
          includeAllVariants: args.include_all_variants || false
        }
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Relationships & Dependencies (Phase 6)
    if (name === 'ecl_find_components_by_tag') {
      const result = Relationships.findComponentsByTag(
        db,
        args.tags,
        {
          tag_type: args.tag_type,
          match_mode: args.match_mode || 'any',
          include_metadata: args.include_metadata !== false
        }
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_available_tags') {
      const result = Relationships.getAvailableTags(
        db,
        {
          tag_type: args.tag_type,
          include_counts: args.include_counts !== false
        }
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_find_similar_components') {
      const result = Relationships.findSimilarComponents(
        db,
        args.component,
        {
          min_shared_tags: args.min_shared_tags || 2,
          limit: args.limit || 10
        }
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_analyze_dependencies') {
      const result = Relationships.analyzeComponentDependencies(
        db,
        args.component,
        {
          include_suggestions: args.include_suggestions !== false,
          include_conflicts: args.include_conflicts !== false,
          recursive: args.recursive || false
        }
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_build_relationship_graph') {
      const result = Relationships.buildRelationshipGraph(
        db,
        {
          components: args.components,
          relationship_types: args.relationship_types || ['requires', 'suggests', 'contains', 'alternative'],
          max_depth: args.max_depth || 2,
          format: args.format || 'cytoscape'
        }
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_analyze_conflicts') {
      const result = Relationships.analyzeComponentConflicts(
        db,
        args.components,
        {
          include_warnings: args.include_warnings !== false,
          include_recommendations: args.include_recommendations !== false
        }
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_suggest_alternatives') {
      const result = Relationships.suggestAlternatives(
        db,
        args.component
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_health_check') {
      const startTime = Date.now();
      const health = performHealthCheck(db);
      const executionTime = Date.now() - startTime;

      // Track performance
      globalTracker.track('ecl_health_check', executionTime, true);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: health.status === 'healthy',
              data: health,
              metadata: {
                tool: 'ecl_health_check',
                execution_time_ms: executionTime,
                source: 'system',
                version: '2.0'
              }
            }, null, 2),
          },
        ],
      };
    }

    // Page Utilities (Phase 10)
    if (name === 'ecl_get_page_requirements') {
      const result = Utils.getPageRequirements({
        preset: args.preset,
        include_reset: args.include_reset,
        include_optional: args.include_optional,
        components: args.components,
        cdn_version: args.cdn_version
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_cdn_resources') {
      const result = Utils.getCDNResources(
        args.preset,
        args.version
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_generate_complete_page') {
      const result = Generator.generateCompletePage(db, {
        preset: args.preset,
        pageType: args.page_type,
        pageTitle: args.page_title,
        components: args.components || [],
        content: args.content || {},
        cdnVersion: args.cdn_version,
        includeReset: args.include_reset,
        includePrint: args.include_print
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Icon Library Tools
    if (name === 'ecl_get_icon_library') {
      const result = Utils.getAllIcons();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_search_icons') {
      const result = Utils.searchIcons(args.query, {
        category: args.category,
        limit: args.limit
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_icon_by_id') {
      const result = Utils.getIconById(args.icon_id, {
        preset: args.preset,
        size: args.size
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Typography Tools
    if (name === 'ecl_get_typography_guide') {
      const result = Utils.getTypographyGuide();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_search_typography') {
      const result = Utils.searchTypographyUtilities(args.query);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Page Structure Pattern Tools
    if (name === 'ecl_get_page_structure_patterns') {
      const result = Utils.getAllPagePatterns();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_page_pattern') {
      const result = Utils.getPagePattern(args.pattern_id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_component_nesting_rules') {
      const result = Utils.getComponentNestingRules(args.component_name);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    // Form Tools
    if (name === 'ecl_get_form_templates') {
      if (args.template_type) {
        const result = Utils.getFormTemplate(args.template_type);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } else {
        const result = Utils.getFormTemplates();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    }

    if (name === 'ecl_get_complete_contact_form') {
      const result = Utils.getCompleteContactForm();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_form_guidance') {
      if (args.query) {
        const result = Utils.searchFormGuidance(args.query);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } else {
        const result = Utils.getCompleteFormGuidance();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    }

    if (name === 'ecl_validate_form_structure') {
      const cheerio = await import('cheerio');
      const $ = cheerio.load(args.html_code);
      const errors = [];
      const warnings = [];
      
      Validation.validateFormStructure($, args.component, errors, warnings);
      
      const troubleshooting = Validation.getFormTroubleshooting(errors, warnings);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              component: args.component,
              errors,
              warnings,
              troubleshooting,
              is_valid: errors.length === 0,
              summary: {
                error_count: errors.length,
                warning_count: warnings.length,
                critical_issues: errors.filter(e => e.severity === 'error').length
              }
            }, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_troubleshoot_forms') {
      const result = Utils.troubleshootFormIssue(args.issue);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'ecl_get_form_validation_checklist') {
      const result = Utils.getFormValidationChecklist();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Unknown tool: ${name}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  } finally {
    // Clean up database connection
    if (db) {
      closeDatabase(db);
    }
  }
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
