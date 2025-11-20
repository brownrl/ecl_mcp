
/**
 * ECL Tools Definitions
 * Consolidated to 6 high-quality, unified tools
 */

export const toolDefinitions = [
    // 1. Unified Search Tool
    {
        name: 'ecl_search',
        description: 'Unified search for components, code examples, usage guidance, icons, and typography utilities.',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query',
                },
                type: {
                    type: 'string',
                    enum: ['component', 'example', 'guidance', 'icon', 'typography'],
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
        description: 'Get complete component information including metadata, code examples, usage guidance, and nesting rules.',
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
                        enum: ['details', 'examples', 'guidance', 'nesting'],
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

    // 4. Unified Resource/Asset Tool
    {
        name: 'ecl_get_resources',
        description: 'Get ECL resources including CDN URLs, logos, icons, typography guides, and setup instructions.',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['cdn', 'logo', 'icon', 'typography', 'tags', 'setup', 'patterns'],
                    description: 'Type of resource to retrieve',
                },
                id: {
                    type: 'string',
                    description: 'Specific ID (icon ID, pattern ID)',
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

    // 5. System Tool
    {
        name: 'ecl_system_info',
        description: 'Get system health status and information.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
];
