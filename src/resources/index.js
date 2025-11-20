
/**
 * ECL Resources
 * Definitions and handlers for ECL resources
 */

export const resourceDefinitions = [
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
];

/**
 * Handle resource read requests
 * @param {string} uri - Resource URI
 * @param {Object} eclData - ECL data object
 * @returns {Object} Resource content
 */
export function handleResourceRequest(uri, eclData) {
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
}
