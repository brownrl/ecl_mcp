/**
 * Health Check Tool for ECL MCP Server
 * 
 * Provides system health status, database metrics, cache statistics,
 * and performance information
 */

import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { globalCache } from './cache.js';
import { globalTracker } from './performance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', '..', 'ecl-database.sqlite');

/**
 * Perform health check
 * @param {Database} db - Database instance
 */
export function performHealthCheck(db) {
    const startTime = Date.now();

    try {
        // Database health
        const dbHealth = checkDatabase(db);

        // Cache health
        const cacheHealth = checkCache();

        // Performance metrics
        const perfMetrics = checkPerformance();

        // Tool availability
        const toolStatus = checkTools(db);

        // Overall status
        const status = determineOverallStatus(dbHealth, cacheHealth, perfMetrics);

        return {
            status,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: dbHealth,
            cache: cacheHealth,
            performance: perfMetrics,
            tools: toolStatus,
            system: {
                node_version: process.version,
                platform: process.platform,
                memory_usage: getMemoryUsage()
            },
            execution_time_ms: Date.now() - startTime
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Check database health
 */
function checkDatabase(db) {
    try {
        // Check if database file exists
        const exists = existsSync(DB_PATH);
        if (!exists) {
            return {
                connected: false,
                error: 'Database file not found'
            };
        }

        // Get database file size
        const stats = statSync(DB_PATH);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        // Test database connection with simple query
        const tableCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM sqlite_master 
      WHERE type='table'
    `).get();

        // Get record counts for main tables
        const pages = db.prepare('SELECT COUNT(*) as count FROM pages').get();
        const components = db.prepare('SELECT COUNT(*) as count FROM component_metadata').get();
        const tokens = db.prepare('SELECT COUNT(*) as count FROM design_tokens').get();
        const examples = db.prepare('SELECT COUNT(*) as count FROM enhanced_code_examples').get();
        const tags = db.prepare('SELECT COUNT(*) as count FROM component_tags').get();

        // Check last crawl time (from most recent page)
        const lastPage = db.prepare(`
      SELECT created_at 
      FROM pages 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get();

        return {
            connected: true,
            path: DB_PATH,
            size_mb: parseFloat(sizeMB),
            tables_count: tableCount.count,
            records: {
                pages: pages.count,
                components: components.count,
                tokens: tokens.count,
                examples: examples.count,
                tags: tags.count
            },
            last_crawl: lastPage ? lastPage.created_at : 'unknown'
        };
    } catch (error) {
        return {
            connected: false,
            error: error.message
        };
    }
}

/**
 * Check cache health
 */
function checkCache() {
    try {
        const stats = globalCache.getStats();
        const size = globalCache.size();

        return {
            enabled: true,
            entries: stats.entries,
            size_mb: parseFloat(size.mb),
            max_size_mb: parseFloat((globalCache.maxSize / (1024 * 1024)).toFixed(2)),
            utilization: stats.utilization,
            hit_rate: stats.hitRate,
            statistics: {
                hits: stats.hits,
                misses: stats.misses,
                evictions: stats.evictions,
                expired: stats.expired
            }
        };
    } catch (error) {
        return {
            enabled: false,
            error: error.message
        };
    }
}

/**
 * Check performance metrics
 */
function checkPerformance() {
    try {
        const metrics = globalTracker.getMetrics();
        const slowQueries = globalTracker.getSlowQueries(5);
        const slowTools = globalTracker.getSlowTools(5);

        return {
            avg_query_time: metrics.avgQueryTime,
            p95_query_time: metrics.p95QueryTime,
            p99_query_time: metrics.p99QueryTime,
            slow_queries_count: metrics.slowQueries,
            slow_query_threshold: metrics.slowQueryThreshold,
            total_calls: metrics.totalCalls,
            error_rate: metrics.errorRate,
            recent_slow_queries: slowQueries.map(q => ({
                tool: q.tool,
                time_ms: q.time,
                timestamp: q.timestamp
            })),
            slowest_tools: slowTools.map(t => ({
                tool: t.name,
                avg_time_ms: parseFloat(t.avgTime.toFixed(2)),
                calls: t.calls
            }))
        };
    } catch (error) {
        return {
            error: error.message
        };
    }
}

/**
 * Check tool availability
 */
function checkTools(db) {
    try {
        // Count available tools by category
        const tools = {
            search: 14,
            validation: 4,
            generation: 3,
            relationships: 7,
            tokens: 4,
            legacy: 7,
            utility: 1  // health check
        };

        const total = Object.values(tools).reduce((sum, count) => sum + count, 0);

        return {
            total,
            available: tools,
            status: 'operational'
        };
    } catch (error) {
        return {
            total: 0,
            error: error.message,
            status: 'degraded'
        };
    }
}

/**
 * Get memory usage information
 */
function getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
        rss_mb: (usage.rss / 1024 / 1024).toFixed(2),
        heap_used_mb: (usage.heapUsed / 1024 / 1024).toFixed(2),
        heap_total_mb: (usage.heapTotal / 1024 / 1024).toFixed(2),
        external_mb: (usage.external / 1024 / 1024).toFixed(2)
    };
}

/**
 * Determine overall system status
 */
function determineOverallStatus(dbHealth, cacheHealth, perfMetrics) {
    // Critical: Database must be connected
    if (!dbHealth.connected) {
        return 'unhealthy';
    }

    // Check if performance is degraded
    const avgTime = parseFloat(perfMetrics.avg_query_time);
    const errorRate = parseFloat(perfMetrics.error_rate);

    if (avgTime > 200 || errorRate > 10) {
        return 'degraded';
    }

    // Check cache
    if (cacheHealth.enabled) {
        const utilization = parseFloat(cacheHealth.utilization);
        const hitRate = parseFloat(cacheHealth.hit_rate);

        if (utilization > 95 || hitRate < 20) {
            return 'degraded';
        }
    }

    return 'healthy';
}
