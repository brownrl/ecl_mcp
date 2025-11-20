/**
 * Performance Monitoring for ECL MCP Server
 * 
 * Tracks query execution times, slow queries, and tool usage statistics
 */

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOGS_DIR = join(__dirname, '..', '..', 'logs');

/**
 * Performance tracker class
 */
export class PerformanceTracker {
    constructor(options = {}) {
        this.slowQueryThreshold = options.slowQueryThreshold || 100; // ms
        this.logSlowQueries = options.logSlowQueries !== false;
        this.toolStats = new Map(); // tool name -> stats
        this.queryTimes = []; // Recent query times for averaging
        this.maxQueryTimes = options.maxQueryTimes || 1000; // Keep last 1000 queries
        this.slowQueries = []; // Recent slow queries
        this.maxSlowQueries = options.maxSlowQueries || 100;
    }

    /**
     * Track a tool execution
     * @param {string} toolName - Name of the tool
     * @param {number} executionTime - Execution time in milliseconds
     * @param {boolean} success - Whether execution succeeded
     * @param {object} metadata - Additional metadata
     */
    track(toolName, executionTime, success = true, metadata = {}) {
        // Update tool stats
        if (!this.toolStats.has(toolName)) {
            this.toolStats.set(toolName, {
                calls: 0,
                totalTime: 0,
                avgTime: 0,
                minTime: Infinity,
                maxTime: 0,
                errors: 0,
                slowCalls: 0,
                lastCalled: null
            });
        }

        const stats = this.toolStats.get(toolName);
        stats.calls++;
        stats.totalTime += executionTime;
        stats.avgTime = stats.totalTime / stats.calls;
        stats.minTime = Math.min(stats.minTime, executionTime);
        stats.maxTime = Math.max(stats.maxTime, executionTime);
        stats.lastCalled = new Date().toISOString();

        if (!success) {
            stats.errors++;
        }

        // Track slow queries
        if (executionTime > this.slowQueryThreshold) {
            stats.slowCalls++;

            const slowQuery = {
                tool: toolName,
                time: executionTime,
                timestamp: new Date().toISOString(),
                success,
                ...metadata
            };

            this.slowQueries.push(slowQuery);

            // Keep only recent slow queries
            if (this.slowQueries.length > this.maxSlowQueries) {
                this.slowQueries.shift();
            }

            // Log slow query
            if (this.logSlowQueries) {
                this._logSlowQuery(slowQuery);
            }
        }

        // Track for average calculation
        this.queryTimes.push(executionTime);
        if (this.queryTimes.length > this.maxQueryTimes) {
            this.queryTimes.shift();
        }
    }

    /**
     * Log slow query to file
     */
    async _logSlowQuery(query) {
        try {
            await fs.mkdir(LOGS_DIR, { recursive: true });
            const logPath = join(LOGS_DIR, 'slow-queries.log');
            const logLine = `[${query.timestamp}] ${query.tool}: ${query.time}ms ${query.success ? 'SUCCESS' : 'ERROR'}\n`;
            await fs.appendFile(logPath, logLine);
        } catch (error) {
            console.error('[Performance] Failed to log slow query:', error.message);
        }
    }

    /**
     * Get statistics for a specific tool
     * @param {string} toolName - Tool name
     */
    getToolStats(toolName) {
        return this.toolStats.get(toolName) || null;
    }

    /**
     * Get all tool statistics
     */
    getAllStats() {
        const stats = {};
        for (const [tool, data] of this.toolStats.entries()) {
            stats[tool] = { ...data };
        }
        return stats;
    }

    /**
     * Get overall performance metrics
     */
    getMetrics() {
        const totalCalls = Array.from(this.toolStats.values())
            .reduce((sum, stats) => sum + stats.calls, 0);

        const totalErrors = Array.from(this.toolStats.values())
            .reduce((sum, stats) => sum + stats.errors, 0);

        const avgQueryTime = this.queryTimes.length > 0
            ? this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length
            : 0;

        const p95Time = this._calculatePercentile(this.queryTimes, 95);
        const p99Time = this._calculatePercentile(this.queryTimes, 99);

        return {
            totalCalls,
            totalErrors,
            errorRate: totalCalls > 0 ? ((totalErrors / totalCalls) * 100).toFixed(2) + '%' : '0%',
            avgQueryTime: avgQueryTime.toFixed(2) + 'ms',
            p95QueryTime: p95Time.toFixed(2) + 'ms',
            p99QueryTime: p99Time.toFixed(2) + 'ms',
            slowQueries: this.slowQueries.length,
            slowQueryThreshold: this.slowQueryThreshold + 'ms',
            recentQueries: this.queryTimes.length,
            toolCount: this.toolStats.size
        };
    }

    /**
     * Calculate percentile from array of numbers
     */
    _calculatePercentile(arr, percentile) {
        if (arr.length === 0) return 0;

        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    /**
     * Get slow queries
     * @param {number} limit - Max number of slow queries to return
     */
    getSlowQueries(limit = 10) {
        return this.slowQueries.slice(-limit).reverse();
    }

    /**
     * Get top slowest tools by average time
     * @param {number} limit - Number of tools to return
     */
    getSlowTools(limit = 10) {
        const tools = Array.from(this.toolStats.entries())
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.avgTime - a.avgTime)
            .slice(0, limit);

        return tools;
    }

    /**
     * Get most frequently called tools
     * @param {number} limit - Number of tools to return
     */
    getMostUsedTools(limit = 10) {
        const tools = Array.from(this.toolStats.entries())
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.calls - a.calls)
            .slice(0, limit);

        return tools;
    }

    /**
     * Reset all statistics
     */
    reset() {
        this.toolStats.clear();
        this.queryTimes = [];
        this.slowQueries = [];
    }

    /**
     * Export statistics to JSON
     */
    exportStats() {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.getMetrics(),
            toolStats: this.getAllStats(),
            slowQueries: this.slowQueries,
            recentQueryTimes: this.queryTimes.slice(-100) // Last 100 queries
        };
    }

    /**
     * Save statistics to file
     */
    async saveStats(filename = 'performance-stats.json') {
        try {
            await fs.mkdir(LOGS_DIR, { recursive: true });
            const filePath = join(LOGS_DIR, filename);
            await fs.writeFile(filePath, JSON.stringify(this.exportStats(), null, 2));
            return filePath;
        } catch (error) {
            console.error('[Performance] Failed to save stats:', error.message);
            return null;
        }
    }
}

/**
 * Global performance tracker instance
 */
export const globalTracker = new PerformanceTracker({
    slowQueryThreshold: 100,
    logSlowQueries: true
});

/**
 * Performance monitoring decorator for async functions
 * Automatically tracks execution time
 * 
 * @param {string} toolName - Name of the tool/function
 * @param {Function} fn - Function to monitor
 */
export function monitored(toolName, fn) {
    return async function (...args) {
        const startTime = Date.now();
        let success = true;
        let error = null;

        try {
            const result = await fn(...args);
            return result;
        } catch (err) {
            success = false;
            error = err;
            throw err;
        } finally {
            const executionTime = Date.now() - startTime;
            globalTracker.track(toolName, executionTime, success, {
                error: error ? error.message : null
            });
        }
    };
}

/**
 * Measure execution time of a function
 * Returns [result, executionTime]
 * 
 * @param {Function} fn - Function to measure
 */
export async function measure(fn) {
    const startTime = Date.now();
    const result = await fn();
    const executionTime = Date.now() - startTime;
    return [result, executionTime];
}

/**
 * Generate performance report
 */
export function generateReport() {
    const metrics = globalTracker.getMetrics();
    const slowTools = globalTracker.getSlowTools(5);
    const mostUsed = globalTracker.getMostUsedTools(5);
    const slowQueries = globalTracker.getSlowQueries(10);

    const report = {
        generated: new Date().toISOString(),
        summary: metrics,
        slowestTools: slowTools.map(t => ({
            name: t.name,
            avgTime: t.avgTime.toFixed(2) + 'ms',
            maxTime: t.maxTime.toFixed(2) + 'ms',
            calls: t.calls,
            slowCalls: t.slowCalls
        })),
        mostUsedTools: mostUsed.map(t => ({
            name: t.name,
            calls: t.calls,
            avgTime: t.avgTime.toFixed(2) + 'ms',
            errors: t.errors
        })),
        recentSlowQueries: slowQueries.map(q => ({
            tool: q.tool,
            time: q.time.toFixed(2) + 'ms',
            timestamp: q.timestamp,
            success: q.success
        }))
    };

    return report;
}

/**
 * Print performance report to console
 */
export function printReport() {
    const report = generateReport();

    console.error('\n' + '='.repeat(60));
    console.error('  PERFORMANCE REPORT');
    console.error('='.repeat(60));

    console.error('\nSUMMARY:');
    console.error(`  Total Calls:      ${report.summary.totalCalls}`);
    console.error(`  Total Errors:     ${report.summary.totalErrors} (${report.summary.errorRate})`);
    console.error(`  Avg Query Time:   ${report.summary.avgQueryTime}`);
    console.error(`  P95 Query Time:   ${report.summary.p95QueryTime}`);
    console.error(`  P99 Query Time:   ${report.summary.p99QueryTime}`);
    console.error(`  Slow Queries:     ${report.summary.slowQueries} (>${report.summary.slowQueryThreshold})`);

    if (report.slowestTools.length > 0) {
        console.error('\nSLOWEST TOOLS:');
        report.slowestTools.forEach((tool, i) => {
            console.error(`  ${i + 1}. ${tool.name}`);
            console.error(`     Avg: ${tool.avgTime}, Max: ${tool.maxTime}, Calls: ${tool.calls}, Slow: ${tool.slowCalls}`);
        });
    }

    if (report.mostUsedTools.length > 0) {
        console.error('\nMOST USED TOOLS:');
        report.mostUsedTools.forEach((tool, i) => {
            console.error(`  ${i + 1}. ${tool.name} - ${tool.calls} calls (Avg: ${tool.avgTime}, Errors: ${tool.errors})`);
        });
    }

    if (report.recentSlowQueries.length > 0) {
        console.error('\nRECENT SLOW QUERIES:');
        report.recentSlowQueries.slice(0, 5).forEach((query, i) => {
            console.error(`  ${i + 1}. ${query.tool} - ${query.time} at ${query.timestamp}`);
        });
    }

    console.error('\n' + '='.repeat(60) + '\n');
}
