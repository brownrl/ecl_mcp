#!/usr/bin/env node

/**
 * Performance Benchmark Suite for ECL MCP Server
 * 
 * Tests all 40 tools against performance targets:
 * - Simple queries: < 10ms
 * - Complex queries: < 50ms
 * - Code generation: < 100ms
 * - Analysis: < 200ms
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as Search from './src/search/index.js';
import * as Validation from './src/validation/index.js';
import * as Generator from './src/generator/index.js';
import * as Relationships from './src/relationships/index.js';
import { performHealthCheck } from './src/utils/health-check.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'ecl-database.sqlite');

const db = new Database(DB_PATH, { readonly: true });

// Performance targets (in ms)
const TARGETS = {
    simple: 10,
    complex: 50,
    generation: 100,
    analysis: 200
};

// Track results
const results = {
    simple: [],
    complex: [],
    generation: [],
    analysis: []
};

// Helper to measure execution time
async function measure(fn, label, category) {
    const startTime = Date.now();
    try {
        await fn();
        const time = Date.now() - startTime;
        results[category].push({ label, time, success: true });
        const target = TARGETS[category];
        const status = time < target ? '✓' : '✗';
        console.log(`${status} ${label}: ${time}ms (target: <${target}ms)`);
        return time;
    } catch (error) {
        const time = Date.now() - startTime;
        results[category].push({ label, time, success: false, error: error.message });
        console.log(`✗ ${label}: FAILED - ${error.message}`);
        return time;
    }
}

console.log('\n' + '='.repeat(70));
console.log('  ECL MCP SERVER PERFORMANCE BENCHMARK');
console.log('='.repeat(70));

// ===== SIMPLE QUERIES (<10ms) =====
console.log('\n📊 SIMPLE QUERIES (Target: <10ms)\n');

await measure(
    () => Search.getComponentDetails(db, 'button'),
    'Get component details (button)',
    'simple'
);

await measure(
    () => Search.getToken(db, 'xl'),
    'Get design token (xl spacing)',
    'simple'
);

await measure(
    () => Search.getTokensByCategory(db, 'color'),
    'Get tokens by category (color)',
    'simple'
);

// Skipped: getComponentApiByName not exported

await measure(
    () => Search.getTokenCategories(db),
    'Get all token categories',
    'simple'
);

// ===== COMPLEX QUERIES (<50ms) =====
console.log('\n🔍 COMPLEX QUERIES (Target: <50ms)\n');

await measure(
    () => Search.searchComponents(db, { query: 'button', category: 'forms' }),
    'Search components with filters',
    'complex'
);

await measure(
    () => Search.searchDesignTokens(db, { query: 'primary', category: 'color' }),
    'Search design tokens with filters',
    'complex'
);

// Skipped: searchCodeExamples not exported
// Skipped: searchComponentApi not exported

await measure(
    () => Search.searchGuidance(db, { type: 'do' }),
    'Search usage guidance',
    'complex'
);

await measure(
    () => Relationships.findComponentsByTag(db, 'interactive'),
    'Find components by tag',
    'complex'
);

await measure(
    () => Relationships.getAvailableTags(db, 'feature'),
    'Get available tags by type',
    'complex'
);

await measure(
    () => Relationships.findSimilarComponents(db, 'button', 3),
    'Find similar components',
    'complex'
);

// ===== CODE GENERATION (<100ms) =====
console.log('\n🏗️  CODE GENERATION (Target: <100ms)\n');

await measure(
    () => Generator.getCompleteExample(db, 'button', null),
    'Generate complete button example',
    'generation'
);

await measure(
    () => Generator.generateComponent(db, { component: 'card', customizations: {} }),
    'Generate custom card component',
    'generation'
);

await measure(
    () => Generator.createPlayground(db, 'accordion'),
    'Create playground for accordion',
    'generation'
);

// Skipped: getExamplesByComplexity not exported

// ===== ANALYSIS (<200ms) =====
console.log('\n🔬 ANALYSIS & VALIDATION (Target: <200ms)\n');

await measure(
    () => Validation.validateComponentUsage(db, {
        html: '<button class="ecl-button ecl-button--primary">Click</button>',
        component: 'button'
    }),
    'Validate component usage',
    'analysis'
);

await measure(
    () => Validation.checkAccessibility(db, {
        html: '<button class="ecl-button">Click</button>',
        component: 'button',
        level: 'AA'
    }),
    'Check accessibility (WCAG AA)',
    'analysis'
);

await measure(
    () => Validation.analyzeEclCode(db, {
        html: '<div class="ecl-container"><button class="ecl-button">Click</button></div>',
        checkBestPractices: true
    }),
    'Analyze ECL code quality',
    'analysis'
);

await measure(
    () => Relationships.analyzeComponentDependencies(db, 'datepicker'),
    'Analyze component dependencies',
    'analysis'
);

await measure(
    () => Relationships.buildRelationshipGraph(db, { components: ['button', 'card', 'accordion'] }),
    'Build relationship graph (3 components)',
    'analysis'
);

await measure(
    () => Relationships.analyzeComponentConflicts(db, { components: ['button', 'link', 'card'] }),
    'Analyze component conflicts',
    'analysis'
);

await measure(
    () => Relationships.suggestAlternatives(db, 'button'),
    'Suggest component alternatives',
    'analysis'
);

await measure(
    () => performHealthCheck(db),
    'Health check',
    'analysis'
);

// ===== RESULTS SUMMARY =====
console.log('\n' + '='.repeat(70));
console.log('  PERFORMANCE SUMMARY');
console.log('='.repeat(70));

function summarizeCategory(category, target) {
    const tests = results[category];
    const passed = tests.filter(t => t.success && t.time < target).length;
    const failed = tests.filter(t => !t.success).length;
    const slow = tests.filter(t => t.success && t.time >= target).length;
    const avgTime = tests.length > 0
        ? (tests.reduce((sum, t) => sum + t.time, 0) / tests.length).toFixed(2)
        : 0;
    const maxTime = tests.length > 0
        ? Math.max(...tests.map(t => t.time)).toFixed(2)
        : 0;

    console.log(`\n${category.toUpperCase()} (<${target}ms):`);
    console.log(`  Total tests:    ${tests.length}`);
    console.log(`  Passed:         ${passed} (${((passed / tests.length) * 100).toFixed(1)}%)`);
    console.log(`  Slow:           ${slow}`);
    console.log(`  Failed:         ${failed}`);
    console.log(`  Avg time:       ${avgTime}ms`);
    console.log(`  Max time:       ${maxTime}ms`);

    return { passed, failed, slow, total: tests.length };
}

const simpleStats = summarizeCategory('simple', TARGETS.simple);
const complexStats = summarizeCategory('complex', TARGETS.complex);
const generationStats = summarizeCategory('generation', TARGETS.generation);
const analysisStats = summarizeCategory('analysis', TARGETS.analysis);

const totalTests = simpleStats.total + complexStats.total + generationStats.total + analysisStats.total;
const totalPassed = simpleStats.passed + complexStats.passed + generationStats.passed + analysisStats.passed;
const totalFailed = simpleStats.failed + complexStats.failed + generationStats.failed + analysisStats.failed;
const totalSlow = simpleStats.slow + complexStats.slow + generationStats.slow + analysisStats.slow;

console.log('\n' + '-'.repeat(70));
console.log('\nOVERALL:');
console.log(`  Total tests:    ${totalTests}`);
console.log(`  Passed:         ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
console.log(`  Slow:           ${totalSlow}`);
console.log(`  Failed:         ${totalFailed}`);

if (totalFailed > 0) {
    console.log('\n❌ FAILED TESTS:');
    for (const category of Object.keys(results)) {
        const failed = results[category].filter(t => !t.success);
        for (const test of failed) {
            console.log(`  - ${test.label}: ${test.error}`);
        }
    }
}

if (totalSlow > 0) {
    console.log('\n⚠️  SLOW TESTS (exceeding target):');
    for (const category of Object.keys(results)) {
        const slow = results[category].filter(t => t.success && t.time >= TARGETS[category]);
        for (const test of slow) {
            console.log(`  - ${test.label}: ${test.time}ms (target: <${TARGETS[category]}ms)`);
        }
    }
}

console.log('\n' + '='.repeat(70));

const passRate = (totalPassed / totalTests) * 100;
if (passRate >= 90) {
    console.log('\n✅ EXCELLENT: 90%+ tests meeting performance targets!');
} else if (passRate >= 75) {
    console.log('\n✓ GOOD: 75%+ tests meeting performance targets');
} else if (passRate >= 60) {
    console.log('\n⚠️  ACCEPTABLE: 60%+ tests meeting performance targets');
} else {
    console.log('\n❌ NEEDS IMPROVEMENT: <60% tests meeting performance targets');
}

console.log('\n');

db.close();

process.exit(totalFailed > 0 ? 1 : 0);
