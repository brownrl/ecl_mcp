/**
 * Test Suite for Relationship Tools (Phase 6)
 */

import Database from 'better-sqlite3';
import * as Relationships from './src/relationships/index.js';

const db = new Database('./ecl-database.sqlite', { readonly: true });

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passCount++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failCount++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('\n=== Testing Tag-Based Component Discovery ===\n');

// Test 1: Find components by single tag
test('Find components by single tag (form)', () => {
  const result = Relationships.findComponentsByTag(db, 'form');
  assert(result.success === true, 'Should succeed');
  assert(result.results.components.length > 0, 'Should find components');
  assert(result.results.components.every(c => c.matched_tags.includes('form')), 'All should have form tag');
});

// Test 2: Find components by multiple tags (ANY mode)
test('Find components by multiple tags (ANY mode)', () => {
  const result = Relationships.findComponentsByTag(db, ['form', 'navigation']);
  assert(result.success === true, 'Should succeed');
  assert(result.results.components.length > 0, 'Should find components');
  assert(result.query.match_mode === 'any', 'Should use ANY mode');
});

// Test 3: Find components by multiple tags (ALL mode)
test('Find components by multiple tags (ALL mode)', () => {
  const result = Relationships.findComponentsByTag(db, ['form', 'navigation'], { match_mode: 'all' });
  assert(result.success === true, 'Should succeed');
  // Should find fewer components than ANY mode
  const anyResult = Relationships.findComponentsByTag(db, ['form', 'navigation']);
  assert(result.results.components.length <= anyResult.results.components.length, 'ALL mode should return fewer or equal results');
});

// Test 4: Filter by tag type
test('Filter by tag type (feature)', () => {
  const result = Relationships.findComponentsByTag(db, 'form', { tag_type: 'feature' });
  assert(result.success === true, 'Should succeed');
  assert(result.results.components.length > 0, 'Should find components');
});

// Test 5: Get available tags
test('Get all available tags', () => {
  const result = Relationships.getAvailableTags(db);
  assert(result.success === true, 'Should succeed');
  assert(Object.keys(result.tags).length > 0, 'Should have tag types');
  assert(result.total_tags > 0, 'Should have tags');
});

// Test 6: Get available tags by type
test('Get available tags by type (feature)', () => {
  const result = Relationships.getAvailableTags(db, { tag_type: 'feature' });
  assert(result.success === true, 'Should succeed');
  assert(result.tags.feature !== undefined, 'Should have feature tags');
});

// Test 7: Find similar components
test('Find similar components (button)', () => {
  const result = Relationships.findSimilarComponents(db, 'button');
  assert(result.success === true, 'Should succeed');
  assert(result.component.name === 'button', 'Should identify component');
  assert(result.component.tags.length > 0, 'Should have tags');
  // Similar components may or may not exist depending on tag overlap
});

// Test 8: Find similar components with min shared tags
test('Find similar components with min_shared_tags=3', () => {
  const result = Relationships.findSimilarComponents(db, 'button', { min_shared_tags: 3 });
  assert(result.success === true, 'Should succeed');
  // All similar components should have at least 3 shared tags
  assert(result.similar_components.every(c => c.shared_tags >= 3), 'All should have min 3 shared tags');
});

// Test 9: Error handling - empty tags
test('Error handling - empty tags array', () => {
  const result = Relationships.findComponentsByTag(db, []);
  assert(result.success === false, 'Should fail');
  assert(result.error.includes('required'), 'Should mention required');
});

// Test 10: Error handling - component not found for similarity
test('Error handling - component not found for similarity', () => {
  const result = Relationships.findSimilarComponents(db, 'nonexistent-component-xyz');
  assert(result.success === false, 'Should fail');
  assert(result.error.includes('not found'), 'Should mention not found');
});

console.log('\n=== Testing Dependency Analysis ===\n');

// Test 11: Analyze component dependencies
test('Analyze dependencies (button)', () => {
  const result = Relationships.analyzeComponentDependencies(db, 'button');
  assert(result.success === true, 'Should succeed');
  assert(result.component.name === 'button', 'Should identify component');
  assert(result.dependencies !== undefined, 'Should have dependencies');
  assert(result.dependencies.required !== undefined, 'Should have required dependencies');
  assert(result.installation_notes.length > 0, 'Should have installation notes');
});

// Test 12: Analyze dependencies without suggestions
test('Analyze dependencies without suggestions', () => {
  const result = Relationships.analyzeComponentDependencies(db, 'button', { include_suggestions: false });
  assert(result.success === true, 'Should succeed');
  assert(result.dependencies.suggested === undefined, 'Should not include suggestions');
});

// Test 13: Analyze dependencies without conflicts
test('Analyze dependencies without conflicts', () => {
  const result = Relationships.analyzeComponentDependencies(db, 'button', { include_conflicts: false });
  assert(result.success === true, 'Should succeed');
  assert(result.dependencies.conflicts === undefined, 'Should not include conflicts');
});

// Test 14: Analyze dependencies recursively
test('Analyze dependencies recursively', () => {
  const result = Relationships.analyzeComponentDependencies(db, 'button', { recursive: true });
  assert(result.success === true, 'Should succeed');
  assert(result.dependency_chain !== undefined, 'Should have dependency chain');
  assert(Array.isArray(result.dependency_chain), 'Chain should be array');
});

// Test 15: Error handling - component not found for dependency analysis
test('Error handling - component not found for dependencies', () => {
  const result = Relationships.analyzeComponentDependencies(db, 'nonexistent-component-xyz');
  assert(result.success === false, 'Should fail');
  assert(result.error.includes('not found'), 'Should mention not found');
});

console.log('\n=== Testing Relationship Graph Building ===\n');

// Test 16: Build relationship graph (default format)
test('Build relationship graph (cytoscape)', () => {
  const result = Relationships.buildRelationshipGraph(db, { 
    components: ['button', 'card', 'accordion'],
    format: 'cytoscape'
  });
  assert(result.success === true, 'Should succeed');
  assert(result.graph !== undefined, 'Should have graph');
  assert(result.graph.elements !== undefined, 'Should have elements');
  assert(result.graph.elements.nodes.length > 0, 'Should have nodes');
  assert(result.statistics.nodes > 0, 'Should count nodes');
});

// Test 17: Build relationship graph (D3 format)
test('Build relationship graph (D3 format)', () => {
  const result = Relationships.buildRelationshipGraph(db, { 
    components: ['button', 'card'],
    format: 'd3'
  });
  assert(result.success === true, 'Should succeed');
  assert(result.graph.nodes !== undefined, 'Should have nodes');
  assert(result.graph.links !== undefined, 'Should have links');
  assert(Array.isArray(result.graph.nodes), 'Nodes should be array');
  assert(Array.isArray(result.graph.links), 'Links should be array');
});

// Test 18: Build relationship graph (Mermaid format)
test('Build relationship graph (Mermaid format)', () => {
  const result = Relationships.buildRelationshipGraph(db, { 
    components: ['button', 'card'],
    format: 'mermaid'
  });
  assert(result.success === true, 'Should succeed');
  assert(result.graph.syntax !== undefined, 'Should have syntax');
  assert(result.graph.syntax.includes('graph TD'), 'Should be Mermaid syntax');
  assert(result.graph.format === 'mermaid', 'Should identify format');
});

// Test 19: Build graph with relationship type filter
test('Build graph with relationship type filter', () => {
  const result = Relationships.buildRelationshipGraph(db, { 
    components: ['button', 'card', 'accordion'],
    relationship_types: ['requires', 'suggests']
  });
  assert(result.success === true, 'Should succeed');
  assert(result.statistics.relationship_types.length === 2, 'Should filter types');
});

// Test 20: Error handling - no components found
test('Error handling - no components for graph', () => {
  const result = Relationships.buildRelationshipGraph(db, { 
    components: ['nonexistent-xyz', 'nonexistent-abc']
  });
  assert(result.success === false, 'Should fail');
  assert(result.error.includes('No components found'), 'Should mention no components');
});

console.log('\n=== Testing Conflict Analysis ===\n');

// Test 21: Analyze conflicts between components
test('Analyze conflicts (button + card)', () => {
  const result = Relationships.analyzeComponentConflicts(db, ['button', 'card']);
  assert(result.success === true, 'Should succeed');
  assert(result.components.length === 2, 'Should analyze 2 components');
  assert(result.analysis !== undefined, 'Should have analysis');
  assert(result.analysis.risk_score !== undefined, 'Should have risk score');
  assert(result.analysis.risk_level !== undefined, 'Should have risk level');
  assert(result.summary.safe_to_combine !== undefined, 'Should indicate safety');
});

// Test 22: Analyze conflicts without warnings
test('Analyze conflicts without warnings', () => {
  const result = Relationships.analyzeComponentConflicts(db, ['button', 'card'], { 
    include_warnings: false 
  });
  assert(result.success === true, 'Should succeed');
  assert(result.analysis.warnings === undefined, 'Should not include warnings');
});

// Test 23: Analyze conflicts without recommendations
test('Analyze conflicts without recommendations', () => {
  const result = Relationships.analyzeComponentConflicts(db, ['button', 'card'], { 
    include_recommendations: false 
  });
  assert(result.success === true, 'Should succeed');
  assert(result.analysis.recommendations === undefined, 'Should not include recommendations');
});

// Test 24: Error handling - less than 2 components
test('Error handling - need at least 2 components for conflict analysis', () => {
  const result = Relationships.analyzeComponentConflicts(db, ['button']);
  assert(result.success === false, 'Should fail');
  assert(result.error.includes('at least 2'), 'Should mention minimum 2');
});

// Test 25: Error handling - component not found in conflict analysis
test('Error handling - component not found in conflict analysis', () => {
  const result = Relationships.analyzeComponentConflicts(db, ['button', 'nonexistent-xyz']);
  assert(result.success === false, 'Should fail');
  assert(result.error.includes('not found'), 'Should mention not found');
});

console.log('\n=== Testing Alternative Suggestions ===\n');

// Test 26: Suggest alternatives for component
test('Suggest alternatives (button)', () => {
  const result = Relationships.suggestAlternatives(db, 'button');
  assert(result.success === true, 'Should succeed');
  assert(result.component.name === 'button', 'Should identify component');
  assert(Array.isArray(result.alternatives), 'Alternatives should be array');
  // Alternatives may or may not exist depending on tag similarity
});

// Test 27: Error handling - component not found for alternatives
test('Error handling - component not found for alternatives', () => {
  const result = Relationships.suggestAlternatives(db, 'nonexistent-component-xyz');
  assert(result.success === false, 'Should fail');
  assert(result.error.includes('not found'), 'Should mention not found');
});

console.log('\n=== Test Summary ===\n');
console.log(`Total: ${passCount + failCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);

db.close();
process.exit(failCount > 0 ? 1 : 0);
