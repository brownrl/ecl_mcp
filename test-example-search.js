#!/usr/bin/env node

/**
 * Test Example Search Functionality
 */

import { getDatabase, closeDatabase } from './src/db.js';
import { searchExamples } from './src/search/example-search.js';

const db = getDatabase(true);

console.log('='.repeat(80));
console.log('Testing Example Search with Fuzzy Matching');
console.log('='.repeat(80));

const tests = [
    { query: 'button', label: 'Exact: button' },
    { query: 'buitton', label: 'Typo: buitton (should find button)' },
    { query: 'mega menu', label: 'Multi-word: mega menu' },
    { query: 'megamenu', label: 'No space: megamenu' },
    { query: 'mega-menu', label: 'Hyphenated: mega-menu' },
    { query: 'dropdown', label: 'dropdown' },
    { query: 'accordion', label: 'accordion' },
    { query: 'accordian', label: 'Typo: accordian (should find accordion)' },
    { query: 'text field', label: 'Multi-word: text field' },
    { query: 'textfield', label: 'No space: textfield' },
];

for (const test of tests) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Test: ${test.label}`);
    console.log(`Query: "${test.query}"`);
    console.log('─'.repeat(80));

    const result = searchExamples(db, { query: test.query, limit: 5 });

    if (result.success && result.data.results.length > 0) {
        console.log(`✅ Found ${result.data.results.length} example(s):`);
        result.data.results.forEach((ex, i) => {
            console.log(`  ${i + 1}. ${ex.component} (${ex.language}) - ${ex.complexity || 'N/A'}`);
            console.log(`     Score: ${ex.relevance_score}, Complete: ${ex.is_complete}, Length: ${ex.code_length} chars`);
        });
    } else {
        console.log(`❌ No results found`);
        if (result.suggestions) {
            console.log('Suggestions:');
            result.suggestions.forEach(s => console.log(`  - ${s}`));
        }
    }
}

console.log('\n' + '='.repeat(80));
console.log('Testing with filters');
console.log('='.repeat(80));

const filterTests = [
    { query: 'button', language: 'html', label: 'Button + HTML only' },
    { query: 'button', complexity: 'basic', label: 'Button + Basic complexity' },
    { query: 'button', completeOnly: true, label: 'Button + Complete only' },
];

for (const test of filterTests) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Test: ${test.label}`);
    console.log('─'.repeat(80));

    const result = searchExamples(db, test);

    if (result.success && result.data.results.length > 0) {
        console.log(`✅ Found ${result.data.results.length} example(s):`);
        result.data.results.slice(0, 3).forEach((ex, i) => {
            console.log(`  ${i + 1}. ${ex.component} (${ex.language}) - ${ex.complexity || 'N/A'}`);
        });
    } else {
        console.log(`❌ No results found`);
    }
}

closeDatabase(db);

console.log('\n' + '='.repeat(80));
console.log('✅ All tests complete!');
console.log('='.repeat(80));
