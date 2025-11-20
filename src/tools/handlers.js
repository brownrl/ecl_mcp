
import { getDatabase, closeDatabase } from '../db.js';
import * as Search from '../search/index.js';
import * as Validation from '../validation/index.js';
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
        if (['ecl_search', 'ecl_get_component', 'ecl_generate_code', 'ecl_validate', 'ecl_analyze_relationships', 'ecl_system_info'].includes(name)) {
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
                case 'api':
                    result = Search.searchAPI(db, { query, ...filters, limit });
                    break;
                case 'example':
                    result = Search.searchExamples(db, { component: query, ...filters, limit });
                    break;
                case 'guidance':
                    result = Search.searchGuidance(db, { query, ...filters, limit });
                    break;
                case 'token':
                    result = Search.searchDesignTokens(db, { query, ...filters, limit });
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

            if (include.includes('details')) {
                results.details = Search.getComponentDetails(db, component);
            }
            if (include.includes('api')) {
                results.api = Search.getComponentAPI(db, component);
            }
            if (include.includes('examples')) {
                results.examples = Search.getComponentExamples(db, component);
            }
            if (include.includes('guidance')) {
                results.guidance = Search.getComponentGuidance(db, component);
            }
            if (include.includes('nesting')) {
                results.nesting = Utils.getComponentNestingRules(component);
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

        // 4. Unified Validator
        if (name === 'ecl_validate') {
            const { type, code, context = {} } = args;
            let result;

            switch (type) {
                case 'usage':
                    result = await Validation.validateComponentUsage(db, context.component, code, null, null);
                    break;
                case 'accessibility':
                    result = await Validation.checkAccessibility(db, code, context.component, context.wcagLevel);
                    break;
                case 'quality':
                    result = await Validation.analyzeEclCode(db, code);
                    break;
                case 'conflicts':
                    result = await Validation.checkConflicts(db, context.components, null);
                    break;
                case 'structure':
                    if (context.component && ['Text Field', 'Select', 'Checkbox', 'Radio'].some(c => context.component.includes(c))) {
                        const cheerio = await import('cheerio');
                        const $ = cheerio.load(code);
                        const errors = [];
                        const warnings = [];
                        Validation.validateFormStructure($, context.component, errors, warnings);
                        result = { errors, warnings, isValid: errors.length === 0 };
                    } else {
                        result = { message: "Structure validation currently only supported for form components." };
                    }
                    break;
                default:
                    throw new Error(`Unknown validation type: ${type}`);
            }

            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        // 5. Unified Resource/Asset Tool
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
                case 'tokens':
                    if (id) {
                        result = Search.getToken(db, id);
                    } else if (options.category) {
                        result = Search.getTokensByCategory(db, options.category);
                    } else {
                        result = Search.getTokenCategories(db);
                    }
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

        // 6. Unified Relationship Tool
        if (name === 'ecl_analyze_relationships') {
            const { type, component, options = {} } = args;
            let result;

            switch (type) {
                case 'dependencies':
                    result = Relationships.analyzeComponentDependencies(db, component, { recursive: options.depth > 1 });
                    break;
                case 'related':
                    result = Search.findRelatedComponents(db, component, options.relationshipType);
                    break;
                case 'similar':
                    result = Relationships.findSimilarComponents(db, component, { limit: 10 });
                    break;
                case 'graph':
                    result = Relationships.buildRelationshipGraph(db, {
                        components: options.components,
                        max_depth: options.depth,
                        format: options.format
                    });
                    break;
                case 'alternatives':
                    result = Relationships.suggestAlternatives(db, component);
                    break;
                default:
                    throw new Error(`Unknown relationship analysis type: ${type}`);
            }

            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        // 7. System Tool
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
