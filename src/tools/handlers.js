
import { getDatabase, closeDatabase } from '../db.js';
import * as Search from '../search/index.js';
import * as Generator from '../generator/index.js';
import * as Relationships from '../relationships/index.js';
import * as Utils from '../utils/index.js';
import { performHealthCheck } from '../utils/health-check.js';
import { globalTracker } from '../utils/performance.js';
import { getLogoUrl } from '../utils/asset-library.js';

/**
 * Handle tool calls
 * @param {string} name - Tool name
 * @param {Object} args - Tool arguments
 * @param {Object} eclData - ECL data object
 * @returns {Object} Tool response
 */
export async function handleToolCall(name, args, eclData) {
    let db = null;

    try {
        // Initialize database for tools that need it
        if (['ecl_search', 'ecl_get_component', 'ecl_generate_code', 'ecl_system_info'].includes(name)) {
            db = getDatabase(true); // readonly
        }

        // 1. Unified Search Tool
        if (name === 'ecl_search') {
            const { query, type, filters = {}, limit } = args;
            let result;

            switch (type) {
                case 'component':
                    result = Search.searchComponents(db, { query, ...filters, limit });
                    break;
                case 'example':
                    result = Search.searchExamples(db, { query, ...filters, limit });
                    break;
                case 'guidance':
                    result = Search.searchGuidance(db, { query, ...filters, limit });
                    break;
                case 'icon':
                    result = Utils.searchIcons(query, { ...filters, limit });
                    break;
                case 'typography':
                    result = Utils.searchTypographyUtilities(query);
                    break;
                default:
                    throw new Error(`Unknown search type: ${type}`);
            }

            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        // 2. Unified Component Details
        if (name === 'ecl_get_component') {
            const { component, include = ['details'] } = args;
            const results = {};
            let componentId = component;
            let detailsData = null;

            // Always fetch details first if requested, or if we need to resolve the ID
            // If details is NOT requested but others are, we might want to resolve ID first anyway to ensure consistency
            // But for now, let's assume if details is requested, we use its ID.

            if (include.includes('details')) {
                const detailsResult = Search.getComponentDetails(db, component);
                results.details = detailsResult;

                if (detailsResult.success && detailsResult.data) {
                    componentId = detailsResult.data.id;
                    detailsData = detailsResult.data;
                }
            } else {
                // If details not requested, try to resolve ID quickly to ensure consistency across other calls
                // We can use getComponentDetails internally just for ID resolution if needed, 
                // or just let them rely on the string (but that risks inconsistency as seen).
                // Let's do a quick lookup if it's a string
                if (typeof component === 'string') {
                    const resolved = Search.getComponentDetails(db, component);
                    if (resolved.success && resolved.data) {
                        componentId = resolved.data.id;
                    }
                }
            }

            if (include.includes('api')) {
            }

            if (include.includes('examples')) {
                results.examples = Search.getComponentExamples(db, componentId);
            }
            if (include.includes('guidance')) {
                results.guidance = Search.getComponentGuidance(db, componentId);
            }
            if (include.includes('nesting')) {
                // Nesting rules might still need the name if they are static map based
                // But let's pass the original component name/ID as fallback
                results.nesting = Utils.getComponentNestingRules(detailsData ? detailsData.component_name : component);
            }

            return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
        }

        // 3. Unified Code Generator
        if (name === 'ecl_generate_code') {
            const { type, name: itemName, options = {} } = args;
            let result;

            switch (type) {
                case 'component':
                    result = Generator.generateComponent(db, itemName, {
                        customization: options.customization,
                        framework: options.framework || 'vanilla',
                        includeComments: true
                    });
                    break;
                case 'example':
                    result = Generator.getCompleteExample(db, itemName, {
                        exampleType: options.exampleType,
                        variant: options.variant
                    });
                    break;
                case 'page':
                    result = Generator.generateCompletePage(db, {
                        preset: options.preset,
                        pageType: itemName, // e.g., 'basic', 'landing'
                        pageTitle: options.pageTitle,
                        components: options.components || [],
                        content: options.customization || {},
                        cdnVersion: options.version,
                        includeReset: true
                    });
                    break;
                case 'playground':
                    result = Generator.createPlayground(db, options.components || [], {
                        customCode: options.customization?.code,
                        includeAllVariants: options.includeAllVariants
                    });
                    break;
                case 'form':
                    if (itemName === 'contact') {
                        result = Utils.getCompleteContactForm();
                    } else {
                        result = Utils.getFormTemplate(itemName);
                    }
                    break;
                default:
                    throw new Error(`Unknown generation type: ${type}`);
            }

            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        // 4. Unified Resource/Asset Tool
        if (name === 'ecl_get_resources') {
            const { type, id, options = {} } = args;
            let result;

            switch (type) {
                case 'cdn':
                    result = Utils.getCDNResources(options.preset, options.version);
                    break;
                case 'logo':
                    result = getLogoUrl({
                        preset: options.preset || 'ec',
                        variant: options.variant || 'positive',
                        language: options.language || 'en'
                    });
                    break;
                case 'icon':
                    if (id) {
                        result = Utils.getIconById(id, { preset: options.preset, size: options.size });
                    } else {
                        result = Utils.getAllIcons();
                    }
                    break;
                case 'typography':
                    result = Utils.getTypographyGuide();
                    break;
                case 'tags':
                    result = Relationships.getAvailableTags(db, { tag_type: options.category });
                    break;
                case 'setup':
                    // Re-implementing basic setup guide logic here for simplicity
                    if (options.method === 'npm') {
                        result = { npm: eclData.installation.npm, yarn: eclData.installation.yarn };
                    } else if (options.method === 'cdn') {
                        result = { pattern: eclData.installation.cdn_pattern, example: eclData.installation.cdn_example };
                    } else {
                        result = eclData.setup;
                    }
                    break;
                case 'patterns':
                    if (id) {
                        result = Utils.getPagePattern(id);
                    } else {
                        result = Utils.getAllPagePatterns();
                    }
                    break;
                default:
                    throw new Error(`Unknown resource type: ${type}`);
            }

            // Handle string results (like logo URL) vs object results
            const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            return { content: [{ type: 'text', text }] };
        }

        // 5. System Tool
        if (name === 'ecl_system_info') {
            const startTime = Date.now();
            const health = performHealthCheck(db);
            const executionTime = Date.now() - startTime;

            globalTracker.track('ecl_system_info', executionTime, true);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: health.status === 'healthy',
                            data: health,
                            metadata: {
                                tool: 'ecl_system_info',
                                execution_time_ms: executionTime,
                                source: 'system',
                                version: '2.0'
                            }
                        }, null, 2),
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
            isError: true,
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
        if (db) {
            closeDatabase(db);
        }
    }
}
