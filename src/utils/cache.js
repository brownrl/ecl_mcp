/**
 * LRU Cache Implementation for ECL MCP Server
 * 
 * Provides in-memory caching with:
 * - Least Recently Used (LRU) eviction policy
 * - Time-to-live (TTL) expiration
 * - Size-based eviction
 * - Cache statistics tracking
 */

export class LRUCache {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB default
        this.ttl = options.ttl || 3600 * 1000; // 1 hour default (in milliseconds)
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            sets: 0,
            deletes: 0,
            expired: 0
        };
        this.currentSize = 0;
    }

    /**
     * Calculate approximate size of a value in bytes
     */
    _estimateSize(value) {
        const jsonString = JSON.stringify(value);
        // Rough estimate: 2 bytes per character in JSON string
        return jsonString.length * 2;
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {*} Cached value or null if not found/expired
     */
    get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.currentSize -= entry.size;
            this.stats.expired++;
            this.stats.misses++;
            return null;
        }

        // Update access time (LRU)
        entry.lastAccessed = Date.now();

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);

        this.stats.hits++;
        return entry.value;
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} customTTL - Optional custom TTL in milliseconds
     */
    set(key, value, customTTL = null) {
        const size = this._estimateSize(value);
        const ttl = customTTL || this.ttl;

        // Remove existing entry if present
        if (this.cache.has(key)) {
            const oldEntry = this.cache.get(key);
            this.currentSize -= oldEntry.size;
            this.cache.delete(key);
        }

        // Evict entries if we exceed max size
        while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
            this._evictLRU();
        }

        // Don't cache if single item exceeds max size
        if (size > this.maxSize) {
            return false;
        }

        const entry = {
            value,
            size,
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            expiresAt: Date.now() + ttl
        };

        this.cache.set(key, entry);
        this.currentSize += size;
        this.stats.sets++;

        return true;
    }

    /**
     * Evict least recently used entry
     */
    _evictLRU() {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
            const entry = this.cache.get(firstKey);
            this.cache.delete(firstKey);
            this.currentSize -= entry.size;
            this.stats.evictions++;
        }
    }

    /**
     * Delete specific key
     * @param {string} key - Cache key to delete
     */
    delete(key) {
        const entry = this.cache.get(key);
        if (entry) {
            this.cache.delete(key);
            this.currentSize -= entry.size;
            this.stats.deletes++;
            return true;
        }
        return false;
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
        this.currentSize = 0;
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            sets: 0,
            deletes: 0,
            expired: 0
        };
    }

    /**
     * Check if key exists and is not expired
     * @param {string} key - Cache key
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.currentSize -= entry.size;
            this.stats.expired++;
            return false;
        }

        return true;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

        return {
            ...this.stats,
            totalRequests,
            hitRate: hitRate.toFixed(2) + '%',
            entries: this.cache.size,
            currentSize: this.currentSize,
            currentSizeMB: (this.currentSize / (1024 * 1024)).toFixed(2) + 'MB',
            maxSize: this.maxSize,
            maxSizeMB: (this.maxSize / (1024 * 1024)).toFixed(2) + 'MB',
            utilization: ((this.currentSize / this.maxSize) * 100).toFixed(2) + '%'
        };
    }

    /**
     * Remove expired entries
     */
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                expiredKeys.push(key);
            }
        }

        for (const key of expiredKeys) {
            const entry = this.cache.get(key);
            this.cache.delete(key);
            this.currentSize -= entry.size;
            this.stats.expired++;
        }

        return expiredKeys.length;
    }

    /**
     * Get all cache keys
     */
    keys() {
        return Array.from(this.cache.keys());
    }

    /**
     * Get cache size info
     */
    size() {
        return {
            entries: this.cache.size,
            bytes: this.currentSize,
            mb: (this.currentSize / (1024 * 1024)).toFixed(2)
        };
    }
}

/**
 * Global cache instance for ECL MCP Server
 */
export const globalCache = new LRUCache({
    maxSize: 100 * 1024 * 1024, // 100MB
    ttl: 3600 * 1000 // 1 hour
});

/**
 * Cache key generators for different data types
 */
export const CacheKeys = {
    component: (name) => `component:${name}`,
    componentMetadata: (name) => `component:metadata:${name}`,
    designToken: (name) => `token:${name}`,
    tokensByCategory: (category) => `tokens:category:${category}`,
    searchComponents: (query, category) => `search:components:${query}:${category || 'all'}`,
    searchTokens: (query, category) => `search:tokens:${query}:${category || 'all'}`,
    searchExamples: (query, component) => `search:examples:${query}:${component || 'all'}`,
    componentTags: (name) => `component:tags:${name}`,
    componentDependencies: (name) => `component:deps:${name}`,
    componentApi: (name) => `component:api:${name}`,
    componentGuidance: (name) => `component:guidance:${name}`,
    availableTags: (type) => `tags:available:${type || 'all'}`,
    relationshipGraph: (components) => `graph:${components.sort().join(',')}`,
    healthCheck: () => `health:check`,
    allComponents: () => `components:all`,
    allCategories: () => `categories:all`
};

/**
 * Cached function wrapper
 * Automatically caches function results
 * 
 * @param {Function} fn - Function to cache
 * @param {Function} keyGenerator - Function that generates cache key from arguments
 * @param {number} customTTL - Optional custom TTL in milliseconds
 */
export function cached(fn, keyGenerator, customTTL = null) {
    return async function (...args) {
        const key = keyGenerator(...args);

        // Check cache
        const cachedValue = globalCache.get(key);
        if (cachedValue !== null) {
            // Add cache hit metadata
            if (typeof cachedValue === 'object' && cachedValue.metadata) {
                cachedValue.metadata.cache_hit = true;
            }
            return cachedValue;
        }

        // Execute function
        const result = await fn(...args);

        // Cache result
        if (result && typeof result === 'object') {
            // Add cache miss metadata
            if (result.metadata) {
                result.metadata.cache_hit = false;
            }
            globalCache.set(key, result, customTTL);
        }

        return result;
    };
}

/**
 * Invalidate cache entries matching a pattern
 * @param {string|RegExp} pattern - Pattern to match cache keys
 */
export function invalidateCache(pattern) {
    const keys = globalCache.keys();
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let count = 0;

    for (const key of keys) {
        if (regex.test(key)) {
            globalCache.delete(key);
            count++;
        }
    }

    return count;
}

/**
 * Periodic cleanup job - call this every 5 minutes
 */
export function startCleanupJob(intervalMs = 5 * 60 * 1000) {
    return setInterval(() => {
        const expired = globalCache.cleanup();
        if (expired > 0) {
            console.error(`[Cache] Cleaned up ${expired} expired entries`);
        }
    }, intervalMs);
}
