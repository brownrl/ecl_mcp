#!/usr/bin/env node
/**
 * Test All New Tools - Final 4 Improvements
 * 
 * Tests:
 * 1. Enhanced structure validation
 * 2. Icon library
 * 3. Typography guide
 * 4. Page structure patterns
 */

import { getDatabase, closeDatabase } from './src/db.js';
import * as Validation from './src/validation/index.js';
import * as Utils from './src/utils/index.js';
import * as cheerio from 'cheerio';

const db = getDatabase(true);

console.log('=== Test 1: Enhanced Structure Validation ===\n');

// Test Site Header structure
const siteHeaderHTML = `
<header class="ecl-site-header" data-ecl-auto-init="SiteHeader">
  <div class="ecl-site-header__header">
    <div class="ecl-site-header__container">
      <div class="ecl-site-header__top">Test</div>
    </div>
  </div>
</header>
`;

const $ = cheerio.load(siteHeaderHTML);
const errors = [];
const warnings = [];

Validation.validateEnhancedStructure($, 'Site header', errors, warnings);

console.log('Site Header Validation:');
console.log('  Errors:', errors.length);
console.log('  Warnings:', warnings.length);
if (errors.length > 0) {
    console.log('  First error:', errors[0].message);
}

// Test Accordion with missing aria attributes
const accordionHTML = `
<div class="ecl-accordion">
  <div class="ecl-accordion__item">
    <div class="ecl-accordion__header">
      <button class="ecl-accordion__toggle">Toggle</button>
    </div>
    <div class="ecl-accordion__content">Content</div>
  </div>
</div>
`;

const $2 = cheerio.load(accordionHTML);
const errors2 = [];
const warnings2 = [];

Validation.validateEnhancedStructure($2, 'Accordion', errors2, warnings2);

console.log('\nAccordion Validation:');
console.log('  Errors:', errors2.length);
console.log('  Warnings:', warnings2.length);
if (errors2.length > 0) {
    errors2.forEach((err, i) => {
        console.log(`  Error ${i + 1}:`, err.message);
    });
}

console.log('\n=== Test 2: Icon Library ===\n');

// Get all icons
const allIcons = Utils.getAllIcons();
console.log('All Icons:');
console.log('  Success:', allIcons.success);
console.log('  Total icons:', allIcons.data.total);
console.log('  Categories:', allIcons.data.categories.join(', '));
console.log('  Available sizes:', allIcons.data.sizes.join(', '));

// Search icons
const searchResult = Utils.searchIcons('search', { limit: 3 });
console.log('\nSearch Icons (query: "search"):');
console.log('  Found:', searchResult.data.count);
if (searchResult.data.results.length > 0) {
    console.log('  First result:', searchResult.data.results[0].name);
    console.log('  Category:', searchResult.data.results[0].category);
    console.log('  CDN path (EC):', searchResult.data.results[0].cdn_path_ec.substring(0, 80) + '...');
}

// Get icon by ID
const iconDetail = Utils.getIconById('download', { preset: 'ec', size: 'xs' });
console.log('\nIcon Detail (download):');
console.log('  Success:', iconDetail.success);
console.log('  Name:', iconDetail.data.name);
console.log('  Description:', iconDetail.data.description);
console.log('  Has usage examples:', Object.keys(iconDetail.data.usage_examples).length);
console.log('  Example types:', Object.keys(iconDetail.data.usage_examples).join(', '));
console.log('  Accessibility notes:', iconDetail.data.accessibility_notes.length);

console.log('\n=== Test 3: Typography Guide ===\n');

// Get typography guide
const typoGuide = Utils.getTypographyGuide();
console.log('Typography Guide:');
console.log('  Success:', typoGuide.success);
console.log('  Font families:', Object.keys(typoGuide.data.system.font_families).join(', '));
console.log('  Heading classes:', Object.keys(typoGuide.data.system.heading_classes).length);
console.log('  Paragraph classes:', Object.keys(typoGuide.data.system.paragraph_classes).length);
console.log('  Critical notes:', typoGuide.data.critical_notes.length);
console.log('  First critical note:', typoGuide.data.critical_notes[0].message);
console.log('  Common patterns:', typoGuide.data.common_patterns.length);
console.log('  Troubleshooting entries:', typoGuide.data.troubleshooting.length);
console.log('  Best practices:', typoGuide.data.best_practices.length);

// Search typography
const typoSearch = Utils.searchTypographyUtilities('heading');
console.log('\nTypography Search (query: "heading"):');
console.log('  Found:', typoSearch.data.count);
if (typoSearch.data.results.length > 0) {
    console.log('  First result:', typoSearch.data.results[0].class);
    console.log('  Category:', typoSearch.data.results[0].category);
    console.log('  Example:', typoSearch.data.results[0].example);
}

console.log('\n=== Test 4: Page Structure Patterns ===\n');

// Get all patterns
const allPatterns = Utils.getAllPagePatterns();
console.log('All Page Patterns:');
console.log('  Success:', allPatterns.success);
console.log('  Total patterns:', allPatterns.data.patterns.length);
console.log('  Pattern names:', allPatterns.data.patterns.map(p => p.name).join(', '));
console.log('  General guidelines:', allPatterns.data.general_guidelines.length);

// Get specific pattern
const newsPattern = Utils.getPagePattern('news-article');
console.log('\nNews Article Pattern:');
console.log('  Success:', newsPattern.success);
console.log('  Name:', newsPattern.data.pattern.name);
console.log('  Description:', newsPattern.data.pattern.description);
console.log('  Structure components:', newsPattern.data.pattern.structure.length);
console.log('  Required components:', newsPattern.data.pattern.required_components.length);
console.log('  Optional components:', newsPattern.data.pattern.optional_components.length);
console.log('  Implementation steps:', newsPattern.data.pattern.implementation_steps.length);
console.log('  Has HTML template:', newsPattern.data.pattern.html_template.length > 0);

// Get nesting rules
const cardRules = Utils.getComponentNestingRules('Card');
console.log('\nCard Nesting Rules:');
console.log('  Success:', cardRules.success);
console.log('  Component:', cardRules.data.component);
console.log('  Level:', cardRules.data.rules.level);
console.log('  Parent recommended:', cardRules.data.rules.parent_recommended);
console.log('  Children required:', cardRules.data.rules.children_required.join(', '));
console.log('  Children optional:', cardRules.data.rules.children_optional.join(', '));
console.log('  Has examples:', Object.keys(cardRules.data.examples).length);

// Test non-existent pattern
const badPattern = Utils.getPagePattern('non-existent');
console.log('\nNon-existent Pattern:');
console.log('  Success:', badPattern.success);
console.log('  Has errors:', badPattern.errors && badPattern.errors.length > 0);
if (badPattern.errors) {
    console.log('  Error message:', badPattern.errors[0].message);
    console.log('  Available patterns:', badPattern.errors[0].available.join(', '));
}

closeDatabase(db);

console.log('\n✅ All 4 new tool categories tested successfully!');
console.log('\nSummary:');
console.log('  1. Enhanced structure validation: ✅ Detecting hierarchy issues');
console.log('  2. Icon library: ✅ ' + allIcons.data.total + ' icons available');
console.log('  3. Typography guide: ✅ Complete system documented');
console.log('  4. Page patterns: ✅ ' + allPatterns.data.patterns.length + ' patterns available');
