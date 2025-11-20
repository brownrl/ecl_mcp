#!/usr/bin/env node
/**
 * Enhance Button Examples with Icon Support
 * 
 * Adds comprehensive button examples including:
 * - Icon buttons with proper CDN paths
 * - All variants (primary, secondary, tertiary, ghost)
 * - Icon positions (before/after text, icon-only)
 * - Proper accessibility attributes
 * - Real CDN icon sprite paths
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'ecl-database.sqlite');
const db = new Database(dbPath);

// Get Buttons page IDs
const pages = db.prepare('SELECT id FROM pages WHERE title = ?').all('Buttons');
const pageId = pages[0]?.id;

if (!pageId) {
  console.error('❌ Buttons page not found');
  process.exit(1);
}

console.log(`✅ Found Buttons page: ${pageId}`);

// Icon button examples with proper CDN paths
const iconButtonExamples = [
  {
    variant: 'primary-icon-before',
    use_case: 'Primary action with icon before text',
    code: `<button class="ecl-button ecl-button--primary" type="button">
  <span class="ecl-button__container">
    <svg class="ecl-icon ecl-icon--xs ecl-button__icon ecl-button__icon--before" focusable="false" aria-hidden="true" data-ecl-icon>
      <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.1/dist/images/icons/sprites/icons.svg#general--external-link"></use>
    </svg>
    <span class="ecl-button__label" data-ecl-label>Visit external site</span>
  </span>
</button>`
  },
  {
    variant: 'primary-icon-after',
    use_case: 'Primary action with icon after text',
    code: `<button class="ecl-button ecl-button--primary" type="button">
  <span class="ecl-button__container">
    <span class="ecl-button__label" data-ecl-label>Download file</span>
    <svg class="ecl-icon ecl-icon--xs ecl-button__icon ecl-button__icon--after" focusable="false" aria-hidden="true" data-ecl-icon>
      <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.1/dist/images/icons/sprites/icons.svg#general--download"></use>
    </svg>
  </span>
</button>`
  },
  {
    variant: 'secondary-icon-before',
    use_case: 'Secondary action with icon before text',
    code: `<button class="ecl-button ecl-button--secondary" type="button">
  <span class="ecl-button__container">
    <svg class="ecl-icon ecl-icon--xs ecl-button__icon ecl-button__icon--before" focusable="false" aria-hidden="true" data-ecl-icon>
      <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.1/dist/images/icons/sprites/icons.svg#ui--corner-arrow"></use>
    </svg>
    <span class="ecl-button__label" data-ecl-label>Go back</span>
  </span>
</button>`
  },
  {
    variant: 'secondary-icon-after',
    use_case: 'Secondary action with icon after text',
    code: `<button class="ecl-button ecl-button--secondary" type="button">
  <span class="ecl-button__container">
    <span class="ecl-button__label" data-ecl-label>Next step</span>
    <svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-90 ecl-button__icon ecl-button__icon--after" focusable="false" aria-hidden="true" data-ecl-icon>
      <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.1/dist/images/icons/sprites/icons.svg#ui--corner-arrow"></use>
    </svg>
  </span>
</button>`
  },
  {
    variant: 'ghost-icon-before',
    use_case: 'Ghost button with icon before text',
    code: `<button class="ecl-button ecl-button--ghost" type="button">
  <span class="ecl-button__container">
    <svg class="ecl-icon ecl-icon--xs ecl-button__icon ecl-button__icon--before" focusable="false" aria-hidden="true" data-ecl-icon>
      <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.1/dist/images/icons/sprites/icons.svg#ui--close"></use>
    </svg>
    <span class="ecl-button__label" data-ecl-label>Cancel</span>
  </span>
</button>`
  },
  {
    variant: 'icon-only-primary',
    use_case: 'Icon-only primary button with accessible label',
    code: `<button class="ecl-button ecl-button--primary ecl-button--icon-only" type="button" aria-label="Search">
  <span class="ecl-button__container">
    <span class="ecl-button__label" data-ecl-label="true">Search</span>
    <svg class="ecl-icon ecl-icon--xs ecl-button__icon" focusable="false" aria-hidden="true" data-ecl-icon>
      <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.1/dist/images/icons/sprites/icons.svg#general--search"></use>
    </svg>
  </span>
</button>`
  },
  {
    variant: 'icon-only-secondary',
    use_case: 'Icon-only secondary button with accessible label',
    code: `<button class="ecl-button ecl-button--secondary ecl-button--icon-only" type="button" aria-label="Close dialog">
  <span class="ecl-button__container">
    <span class="ecl-button__label" data-ecl-label="true">Close</span>
    <svg class="ecl-icon ecl-icon--xs ecl-button__icon" focusable="false" aria-hidden="true" data-ecl-icon>
      <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.1/dist/images/icons/sprites/icons.svg#ui--close"></use>
    </svg>
  </span>
</button>`
  },
  {
    variant: 'icon-only-ghost',
    use_case: 'Icon-only ghost button for subtle actions',
    code: `<button class="ecl-button ecl-button--ghost ecl-button--icon-only" type="button" aria-label="More options">
  <span class="ecl-button__container">
    <span class="ecl-button__label" data-ecl-label="true">More</span>
    <svg class="ecl-icon ecl-icon--xs ecl-button__icon" focusable="false" aria-hidden="true" data-ecl-icon>
      <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.1/dist/images/icons/sprites/icons.svg#ui--more"></use>
    </svg>
  </span>
</button>`
  },
  {
    variant: 'disabled-with-icon',
    use_case: 'Disabled button with icon',
    code: `<button class="ecl-button ecl-button--primary" type="button" disabled>
  <span class="ecl-button__container">
    <svg class="ecl-icon ecl-icon--xs ecl-button__icon ecl-button__icon--before" focusable="false" aria-hidden="true" data-ecl-icon>
      <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.1/dist/images/icons/sprites/icons.svg#general--check"></use>
    </svg>
    <span class="ecl-button__label" data-ecl-label>Submitted</span>
  </span>
</button>`
  },
  {
    variant: 'call-to-action-icon',
    use_case: 'Call-to-action button with external link icon',
    code: `<button class="ecl-button ecl-button--call" type="button">
  <span class="ecl-button__container">
    <span class="ecl-button__label" data-ecl-label>Apply now</span>
    <svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-90 ecl-button__icon ecl-button__icon--after" focusable="false" aria-hidden="true" data-ecl-icon>
      <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.1/dist/images/icons/sprites/icons.svg#ui--corner-arrow"></use>
    </svg>
  </span>
</button>`
  }
];

console.log(`\n📝 Adding ${iconButtonExamples.length} enhanced button examples...`);

const insertExample = db.prepare(`
  INSERT INTO code_examples (page_id, example_type, language, code, description, position)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertEnhanced = db.prepare(`
  INSERT INTO enhanced_code_examples (example_id, variant, use_case, complexity, complete_example, accessibility_notes)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Get max position
const maxPos = db.prepare('SELECT MAX(position) as max FROM code_examples WHERE page_id = ?').get(pageId);
let position = (maxPos?.max || 0) + 1;

db.transaction(() => {
  for (const example of iconButtonExamples) {
    // Insert code example
    const result = insertExample.run(
      pageId,
      'component',
      'html',
      example.code,
      example.use_case,
      position++
    );
    
    // Insert enhanced metadata
    insertEnhanced.run(
      result.lastInsertRowid,
      example.variant,
      example.use_case,
      'intermediate',
      1, // complete_example
      example.variant.includes('icon-only') 
        ? 'Icon-only buttons require aria-label for accessibility. The label span with data-ecl-label="true" is visually hidden but provides context for assistive technologies.'
        : 'Icon buttons improve visual clarity. SVG icons must have focusable="false" and aria-hidden="true". Use xlink:href with CDN icon sprite paths.'
    );
    
    console.log(`  ✅ Added: ${example.variant}`);
  }
})();

// Add guidance about icon buttons
const guidanceInsert = db.prepare(`
  INSERT INTO usage_guidance (page_id, guidance_type, content, priority)
  VALUES (?, ?, ?, ?)
`);

const iconGuidance = [
  {
    type: 'best-practice',
    content: 'Icon Button CDN Paths: Always use the full CDN path for icon sprites: https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.1/dist/images/icons/sprites/icons.svg#[icon-name]. Replace preset-ec with preset-eu for EU sites.',
    priority: 110
  },
  {
    type: 'best-practice',
    content: 'Icon Button Accessibility: Icon-only buttons MUST include aria-label attribute AND a visually-hidden label span with data-ecl-label="true". SVG icons must have focusable="false" and aria-hidden="true".',
    priority: 108
  },
  {
    type: 'do',
    content: 'Icon Button Structure: All icon buttons require the container span wrapper: <span class="ecl-button__container">. Icons use ecl-button__icon with optional ecl-button__icon--before or ecl-button__icon--after for positioning.',
    priority: 106
  },
  {
    type: 'note',
    content: 'Icon Rotation: Use ecl-icon--rotate-90, ecl-icon--rotate-180, or ecl-icon--rotate-270 classes to rotate icons. Common for corner-arrow icon to point in different directions.',
    priority: 104
  },
  {
    type: 'note',
    content: 'Available ECL Icons: Common button icons include ui--corner-arrow, general--external-link, general--download, general--search, ui--close, ui--more, general--check. Browse all icons at: https://ec.europa.eu/component-library/ec/resources/icons/',
    priority: 102
  }
];

console.log('\n📚 Adding icon button guidance...');

for (const guide of iconGuidance) {
  guidanceInsert.run(pageId, guide.type, guide.content, guide.priority);
  console.log(`  ✅ Added ${guide.type}: ${guide.content.substring(0, 60)}...`);
}

// Verify additions
const count = db.prepare('SELECT COUNT(*) as count FROM code_examples WHERE page_id = ?').get(pageId);
const guidanceCount = db.prepare('SELECT COUNT(*) as count FROM usage_guidance WHERE page_id = ?').get(pageId);

console.log(`\n✅ Button examples enhanced successfully!`);
console.log(`   Total code examples: ${count.count}`);
console.log(`   Guidance entries: ${guidanceCount.count}`);
console.log(`\n🎯 Icon button variants added:`);
iconButtonExamples.forEach(ex => console.log(`   - ${ex.variant}`));

db.close();
