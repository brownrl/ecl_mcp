/**
 * Error Handling Utilities for ECL MCP Server
 * 
 * Provides standardized error types and error response formatting
 */

/**
 * Base error class for ECL MCP errors
 */
export class ECLError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp
        };
    }
}

/**
 * Database-related errors
 */
export class DatabaseError extends ECLError {
    constructor(message, details = {}) {
        super(message, 'DATABASE_ERROR', details);
    }
}

/**
 * Validation errors (invalid input parameters)
 */
export class ValidationError extends ECLError {
    constructor(message, details = {}) {
        super(message, 'VALIDATION_ERROR', details);
    }
}

/**
 * Not found errors (component/token doesn't exist)
 */
export class NotFoundError extends ECLError {
    constructor(message, details = {}) {
        super(message, 'NOT_FOUND', details);
    }
}

/**
 * Parse errors (code parsing failures)
 */
export class ParseError extends ECLError {
    constructor(message, details = {}) {
        super(message, 'PARSE_ERROR', details);
    }
}

/**
 * System errors (unexpected failures)
 */
export class SystemError extends ECLError {
    constructor(message, details = {}) {
        super(message, 'SYSTEM_ERROR', details);
    }
}

/**
 * Configuration errors
 */
export class ConfigError extends ECLError {
    constructor(message, details = {}) {
        super(message, 'CONFIG_ERROR', details);
    }
}

/**
 * Cache errors
 */
export class CacheError extends ECLError {
    constructor(message, details = {}) {
        super(message, 'CACHE_ERROR', details);
    }
}

/**
 * Format error for MCP response
 * @param {Error} error - Error object
 * @param {object} context - Additional context
 */
export function formatError(error, context = {}) {
    if (error instanceof ECLError) {
        return {
            code: error.code,
            message: error.message,
            details: { ...error.details, ...context },
            timestamp: error.timestamp
        };
    }

    // Handle standard errors
    return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: {
            type: error.constructor.name,
            ...context
        },
        timestamp: new Date().toISOString()
    };
}

/**
 * Format multiple errors
 * @param {Error[]} errors - Array of errors
 */
export function formatErrors(errors) {
    return errors.map(error => formatError(error));
}

/**
 * Create error response for MCP tools
 * @param {Error} error - Error object
 * @param {string} toolName - Name of the tool that failed
 * @param {object} metadata - Additional metadata
 */
export function createErrorResponse(error, toolName, metadata = {}) {
    const formattedError = formatError(error, { tool: toolName });

    return {
        success: false,
        data: null,
        errors: [formattedError],
        metadata: {
            tool: toolName,
            ...metadata,
            error_occurred: true
        },
        suggestions: getSuggestions(error, toolName)
    };
}

/**
 * Get helpful suggestions based on error type
 * @param {Error} error - Error object
 * @param {string} toolName - Tool name
 */
function getSuggestions(error, toolName) {
    const suggestions = [];

    if (error instanceof NotFoundError) {
        suggestions.push('Try searching with a different query or keyword');
        suggestions.push('Use search tools to find available components');
        suggestions.push('Check spelling and try singular/plural forms');
    }

    if (error instanceof ValidationError) {
        suggestions.push('Check that all required parameters are provided');
        suggestions.push('Verify parameter types and formats');
        suggestions.push('Review tool documentation for usage examples');
    }

    if (error instanceof DatabaseError) {
        suggestions.push('Check database connection and permissions');
        suggestions.push('Verify database file exists and is readable');
        suggestions.push('Try running the setup script again');
    }

    if (error instanceof ParseError) {
        suggestions.push('Check HTML/CSS syntax is valid');
        suggestions.push('Ensure code uses proper ECL class names');
        suggestions.push('Review ECL documentation for correct structure');
    }

    if (error instanceof SystemError) {
        suggestions.push('Check server logs for detailed error information');
        suggestions.push('Try restarting the MCP server');
        suggestions.push('Report this issue if it persists');
    }

    return suggestions;
}

/**
 * Validate required parameters
 * @param {object} params - Parameters object
 * @param {string[]} required - Required parameter names
 * @throws {ValidationError} If required parameters are missing
 */
export function validateRequired(params, required) {
    const missing = [];

    for (const param of required) {
        if (params[param] === undefined || params[param] === null || params[param] === '') {
            missing.push(param);
        }
    }

    if (missing.length > 0) {
        throw new ValidationError(
            `Missing required parameters: ${missing.join(', ')}`,
            { missing, provided: Object.keys(params) }
        );
    }
}

/**
 * Validate parameter types
 * @param {object} params - Parameters object
 * @param {object} types - Expected types { paramName: 'string' | 'number' | 'boolean' | 'array' | 'object' }
 * @throws {ValidationError} If parameter types don't match
 */
export function validateTypes(params, types) {
    const invalid = [];

    for (const [param, expectedType] of Object.entries(types)) {
        if (params[param] === undefined) continue; // Skip if not provided

        const actualType = Array.isArray(params[param]) ? 'array' : typeof params[param];

        if (actualType !== expectedType) {
            invalid.push({
                param,
                expected: expectedType,
                actual: actualType
            });
        }
    }

    if (invalid.length > 0) {
        throw new ValidationError(
            'Invalid parameter types',
            { invalid }
        );
    }
}

/**
 * Validate enum values
 * @param {*} value - Value to validate
 * @param {string[]} allowed - Allowed values
 * @param {string} paramName - Parameter name
 * @throws {ValidationError} If value not in allowed list
 */
export function validateEnum(value, allowed, paramName) {
    if (!allowed.includes(value)) {
        throw new ValidationError(
            `Invalid value for ${paramName}: ${value}`,
            {
                param: paramName,
                value,
                allowed
            }
        );
    }
}

/**
 * Safe async wrapper - catches errors and returns formatted response
 * @param {Function} fn - Async function to wrap
 * @param {string} toolName - Tool name for error reporting
 */
export function safeAsync(fn, toolName) {
    return async function (...args) {
        try {
            return await fn(...args);
        } catch (error) {
            console.error(`[${toolName}] Error:`, error);
            return createErrorResponse(error, toolName, {
                execution_time_ms: 0,
                source: 'ecl-database',
                version: '2.0'
            });
        }
    };
}

/**
 * Assert condition - throw ValidationError if false
 * @param {boolean} condition - Condition to check
 * @param {string} message - Error message
 * @param {object} details - Error details
 */
export function assert(condition, message, details = {}) {
    if (!condition) {
        throw new ValidationError(message, details);
    }
}

/**
 * Assert component exists
 * @param {object} component - Component object from database
 * @param {string} name - Component name searched for
 */
export function assertComponentExists(component, name) {
    if (!component) {
        throw new NotFoundError(
            `Component "${name}" not found`,
            {
                component_name: name,
                suggestion: 'Use ecl_search_components to find available components'
            }
        );
    }
}

/**
 * Assert token exists
 * @param {object} token - Token object from database
 * @param {string} name - Token name searched for
 */
export function assertTokenExists(token, name) {
    if (!token) {
        throw new NotFoundError(
            `Design token "${name}" not found`,
            {
                token_name: name,
                suggestion: 'Use ecl_search_design_tokens to find available tokens'
            }
        );
    }
}

/**
 * Log error to file (async, fire-and-forget)
 * @param {Error} error - Error to log
 * @param {object} context - Context information
 */
export async function logError(error, context = {}) {
    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const { dirname } = path.default;

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const logsDir = path.default.join(__dirname, '..', '..', 'logs');

        await fs.mkdir(logsDir, { recursive: true });

        const logEntry = {
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: error.message,
                code: error.code,
                stack: error.stack
            },
            context
        };

        const logPath = path.default.join(logsDir, 'error.log');
        await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
    } catch (logError) {
        console.error('[Error Logging] Failed to log error:', logError.message);
    }
}

/**
 * Create warnings array for non-critical issues
 * @param {...string} messages - Warning messages
 */
export function createWarnings(...messages) {
    return messages.map(msg => ({
        type: 'warning',
        message: msg,
        timestamp: new Date().toISOString()
    }));
}

/**
 * Error handler middleware for database operations
 * @param {Function} dbOperation - Database operation function
 */
export function withDatabaseErrorHandling(dbOperation) {
    return function (...args) {
        try {
            return dbOperation(...args);
        } catch (error) {
            if (error.code === 'SQLITE_ERROR' || error.code?.startsWith('SQLITE_')) {
                throw new DatabaseError(
                    `Database operation failed: ${error.message}`,
                    { sqliteCode: error.code, originalError: error.message }
                );
            }
            throw error;
        }
    };
}
