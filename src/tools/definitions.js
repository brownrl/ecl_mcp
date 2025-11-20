
/**
 * ECL Tools Definitions
 * Consolidated to 7 high-quality, unified tools
 */

export const toolDefinitions = [
    // 1. Unified Search Tool
    {
        name: 'ecl_search',
        description: 'Unified search for components, APIs, examples, guidance, tokens, and icons.',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query',
                },
                type: {
                    type: 'string',
                    enum: ['component', 'api', 'example', 'guidance', 'token', 'icon', 'typography'],
                    description: 'Type of content to search for',
                },
                filters: {
                    type: 'object',
                    description: 'Optional filters specific to the search type (e.g., category, tag, complexity, language)',
                    properties: {
                        category: { type: 'string' },
                        tag: { type: 'string' },
                        complexity: { type: 'string' },
                        language: { type: 'string' },
                        requiresJs: { type: 'boolean' },
                        apiType: { type: 'string' },
                        guidanceType: { type: 'string' },
                    },
                },
                limit: {
                    type: 'number',
                    description: 'Max results (default: 20)',
                },
            },
            required: ['query', 'type'],
        },
    },

    // 2. Unified Component Details
    {
        name: 'ecl_get_component',
        description: 'Get complete component information including metadata, API, examples, guidance, and nesting rules.',
        inputSchema: {
            type: 'object',
            properties: {
                component: {
                    type: 'string',
                    description: 'Component name or page ID',
                },
                include: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['details', 'api', 'examples', 'guidance', 'nesting'],
                    },
                    description: 'Information to include (default: ["details"])',
                },
            },
            required: ['component'],
        },
    },

    // 3. Unified Code Generator
    {
        name: 'ecl_generate_code',
        description: 'Generate code for components, pages, playgrounds, and forms.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['component', 'example', 'page', 'playground', 'form'],
                    description: 'Type of code to generate',
                },
                name: {
                    type: 'string',
                    description: 'Name of the component, page type, or form template',
                },
                options: {
                    type: 'object',
                    description: 'Generation options (variant, framework, customization, components list, etc.)',
                    properties: {
                        variant: { type: 'string' },
                        framework: { type: 'string' },
                        customization: { type: 'object' },
                        components: { type: 'array', items: { type: 'string' } },
                        pageTitle: { type: 'string' },
                        preset: { type: 'string' },
                        exampleType: { type: 'string' },
                    },
                },
            },
            required: ['type'],
        },
    },

    // 4. Unified Validator
    {
        name: 'ecl_validate',
        description: 'Validate ECL code for usage, accessibility, structure, and conflicts.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['usage', 'accessibility', 'quality', 'conflicts', 'structure'],
                    description: 'Type of validation to perform',
                },
                code: {
                    type: 'string',
                    description: 'HTML/JS/CSS code to validate (required for usage, accessibility, quality, structure)',
                },
                context: {
                    type: 'object',
                    description: 'Contextual information (component name, components list for conflicts)',
                    properties: {
                        component: { type: 'string' },
                        components: { type: 'array', items: { type: 'string' } },
                        wcagLevel: { type: 'string' },
                    },
                },
            },
            required: ['type'],
        },
    },

    // 5. Unified Resource/Asset Tool
    {
        name: 'ecl_get_resources',
        description: 'Get ECL resources including CDN URLs, logos, icons, typography guides, and setup instructions.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['cdn', 'logo', 'icon', 'typography', 'tags', 'tokens', 'setup', 'patterns'],
                    description: 'Type of resource to retrieve',
                },
                id: {
                    type: 'string',
                    description: 'Specific ID (icon ID, token name, pattern ID)',
                },
                options: {
                    type: 'object',
                    description: 'Resource options (preset, variant, language, version, category)',
                    properties: {
                        preset: { type: 'string' },
                        variant: { type: 'string' },
                        language: { type: 'string' },
                        version: { type: 'string' },
                        category: { type: 'string' },
                        size: { type: 'string' },
                        method: { type: 'string' },
                    },
                },
            },
            required: ['type'],
        },
    },

    // 6. Unified Relationship Tool
    {
        name: 'ecl_analyze_relationships',
        description: 'Analyze component relationships, dependencies, conflicts, and alternatives.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['dependencies', 'related', 'similar', 'graph', 'alternatives'],
                    description: 'Type of analysis',
                },
                component: {
                    type: 'string',
                    description: 'Component name (required for dependencies, related, similar, alternatives)',
                },
                options: {
                    type: 'object',
                    description: 'Analysis options (depth, relationship type, components list for graph)',
                    properties: {
                        depth: { type: 'number' },
                        relationshipType: { type: 'string' },
                        components: { type: 'array', items: { type: 'string' } },
                        format: { type: 'string' },
                    },
                },
            },
            required: ['type'],
        },
    },

    // 7. System Tool
    {
        name: 'ecl_system_info',
        description: 'Get system health status and information.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
];
