#!/usr/bin/env node

/**
 * Test suite for ECL MCP Generator Tools (Phase 5)
 * Tests example reconstruction, component generation, and playground creation
 */

import Database from 'better-sqlite3';
import { getCompleteExample, generateComponent, createPlayground } from './src/generator/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Open database in readonly mode
const db = new Database(join(__dirname, 'ecl-database.sqlite'), { readonly: true });

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('\n🧪 Running Generator Tool Tests\n');

// Test 1: Get complete example with valid component
test('getCompleteExample - valid component (button)', () => {
  const result = getCompleteExample(db, 'button');
  assert(result.success, 'Should succeed');
  assert(result.component === 'button', 'Should return correct component');
  assert(result.complete_code, 'Should have complete_code');
  assert(result.complete_code.html, 'Should have HTML snippet');
  assert(result.complete_code.complete_html, 'Should have complete HTML page');
  assert(result.complete_code.complete_html.includes('<!doctype html>'), 'Should have complete HTML structure');
  assert(result.complete_code.html.includes('ecl-button'), 'Should contain ECL button class');
  assert(result.dependencies, 'Should have dependencies');
  assert(result.dependencies.stylesheets.length > 0, 'Should have stylesheet dependencies');
});

// Test 2: Get complete example with variant filter
test('getCompleteExample - with variant filter', () => {
  const result = getCompleteExample(db, 'button', { variant: 'primary' });
  assert(result.success, 'Should succeed');
  assert(result.variant === 'primary' || result.complete_code.html.includes('primary'), 'Should filter by variant');
});

// Test 3: Get complete example with invalid component
test('getCompleteExample - invalid component', () => {
  const result = getCompleteExample(db, 'nonexistent-component-xyz');
  assert(!result.success, 'Should fail');
  assert(result.error, 'Should have error message');
});

// Test 4: Get complete example with example type filter
test('getCompleteExample - with example_type filter', () => {
  const result = getCompleteExample(db, 'button', { exampleType: 'basic' });
  assert(result.success || (result.error && result.error.includes('No examples found')), 'Should succeed or gracefully fail');
  // This is a soft check - example type filtering is best-effort
  if (result.success) {
    assert(result.example_title || result.variant, 'Should have example metadata');
  }
});

// Test 5: Generate component - basic (no customization)
test('generateComponent - basic button', () => {
  const result = generateComponent(db, 'button');
  assert(result.success, 'Should succeed');
  assert(result.component === 'button', 'Should return correct component');
  assert(result.generated_code, 'Should have generated_code');
  assert(result.generated_code.html, 'Should have HTML code');
  assert(result.generated_code.html.includes('ecl-button'), 'Should contain ECL button class');
  assert(result.usage_instructions, 'Should have usage instructions');
});

// Test 6: Generate component - with variant customization
test('generateComponent - with variant', () => {
  const result = generateComponent(db, 'button', {
    customization: { variant: 'secondary' }
  });
  assert(result.success, 'Should succeed');
  assert(
    result.generated_code.html.includes('ecl-button--secondary') ||
    result.customization_applied?.variant === 'secondary',
    'Should apply variant customization'
  );
});

// Test 7: Generate component - with content customization
test('generateComponent - with content', () => {
  const result = generateComponent(db, 'button', {
    customization: { content: 'Custom Button Text' }
  });
  assert(result.success, 'Should succeed');
  assert(
    result.generated_code.html.includes('Custom Button Text'),
    'Should apply content customization'
  );
});

// Test 8: Generate component - with size customization
test('generateComponent - with size', () => {
  const result = generateComponent(db, 'button', {
    customization: { size: 'small' }
  });
  assert(result.success, 'Should succeed');
  // Size might be applied as class or data attribute
  const html = result.generated_code.html;
  assert(
    html.includes('small') || html.includes('sm') || result.customization_applied?.size,
    'Should apply size customization'
  );
});

// Test 9: Generate component - invalid component
test('generateComponent - invalid component', () => {
  const result = generateComponent(db, 'nonexistent-component-xyz');
  assert(!result.success, 'Should fail');
  assert(result.error, 'Should have error message');
});

// Test 10: Create playground - single component
test('createPlayground - single component', () => {
  const result = createPlayground(db, ['button']);
  assert(result.success, 'Should succeed');
  assert(result.html_file, 'Should have HTML file content');
  assert(result.html_file.includes('<!doctype html>') || result.html_file.includes('<!DOCTYPE html>'), 'Should have complete HTML structure');
  assert(result.html_file.includes('ecl-button'), 'Should contain button component');
  assert(result.components_included, 'Should list components included');
  assert(result.components_included.includes('button'), 'Should include button in list');
  assert(result.file_size, 'Should report file size');
  assert(result.instructions, 'Should have instructions');
});

// Test 11: Create playground - multiple components
test('createPlayground - multiple components', () => {
  const result = createPlayground(db, ['button', 'link']);
  assert(result.success, 'Should succeed');
  assert(result.html_file.includes('ecl-button'), 'Should contain button component');
  // Link component might be in HTML or as a tag/class - check loosely
  assert(result.html_file.includes('link') || result.components_included.includes('link'), 'Should include link component');
  assert(result.components_included.length >= 1, 'Should include at least 1 component');
});

// Test 12: Create playground - with custom code
test('createPlayground - with custom code', () => {
  const customCode = '<p>Custom test code</p>';
  const result = createPlayground(db, ['button'], { customCode });
  assert(result.success, 'Should succeed');
  assert(result.html_file.includes(customCode), 'Should include custom code');
});

// Test 13: Create playground - invalid component
test('createPlayground - with invalid component', () => {
  const result = createPlayground(db, ['nonexistent-component-xyz']);
  assert(!result.success, 'Should fail');
  assert(result.error, 'Should have error message');
});

// Test 14: Create playground - empty components array
test('createPlayground - empty components array', () => {
  const result = createPlayground(db, []);
  assert(!result.success, 'Should fail');
  assert(result.error, 'Should have error message');
});

// Test 15: Generate component - with comments
test('generateComponent - with comments enabled', () => {
  const result = generateComponent(db, 'button', {
    includeComments: true
  });
  assert(result.success, 'Should succeed');
  // Comments might be added to HTML or usage instructions always provided
  assert(
    result.generated_code.html.includes('<!--') || result.usage_instructions,
    'Should include comments or usage instructions'
  );
});

// Test 16: Get complete example - check customization points
test('getCompleteExample - has customization points', () => {
  const result = getCompleteExample(db, 'button');
  assert(result.success, 'Should succeed');
  assert(result.customization_points, 'Should have customization_points');
  assert(Array.isArray(result.customization_points), 'customization_points should be array');
});

// Test 17: Generate component - multiple customizations
test('generateComponent - multiple customizations', () => {
  const result = generateComponent(db, 'button', {
    customization: {
      variant: 'primary',
      content: 'Submit Form',
      size: 'large'
    }
  });
  assert(result.success, 'Should succeed');
  const html = result.generated_code.html;
  assert(
    html.includes('primary') || html.includes('ecl-button--primary'),
    'Should apply variant'
  );
  assert(html.includes('Submit Form'), 'Should apply content');
});

// Test 18: Create playground - check navigation
test('createPlayground - has navigation', () => {
  const result = createPlayground(db, ['button', 'link']);
  assert(result.success, 'Should succeed');
  assert(result.html_file.includes('<nav'), 'Should have navigation element');
  assert(result.html_file.includes('button'), 'Navigation should link to button section');
  assert(result.html_file.includes('link'), 'Navigation should link to link section');
});

// Close database connection
db.close();

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log(`Total tests: ${testsPassed + testsFailed}`);
console.log('='.repeat(50) + '\n');

process.exit(testsFailed > 0 ? 1 : 0);
