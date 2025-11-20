#!/usr/bin/env node

/**
 * Extract Design Tokens from ECL Guideline Pages
 * 
 * Parses content_sections for Colours, Spacing, and Typography pages
 * to extract design tokens and populate the design_tokens table.
 * 
 * Token Categories:
 * - color: Primary, Secondary, Status, Neutral, Other colors
 * - spacing: Inner component and layout spacing values
 * - typography: Font sizes, weights, line heights
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', 'ecl-database.sqlite');

const db = new Database(DB_PATH);

// Track statistics
const stats = {
  colors: 0,
  spacing: 0,
  typography: 0,
  total: 0
};

/**
 * Extract color tokens from Colours page (id=7)
 * Pattern: "ColorName--ecl-color-name#HEXCOPY"
 */
function extractColorTokens() {
  console.log('\n📊 Extracting color tokens...');

  const sections = db.prepare(`
    SELECT heading, content 
    FROM content_sections 
    WHERE page_id = 7 
    ORDER BY position
  `).all();

  const insertStmt = db.prepare(`
    INSERT INTO design_tokens (
      category, token_name, value, css_variable, 
      description, usage_context, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const seen = new Set(); // Track inserted tokens to avoid duplicates

  for (const section of sections) {
    const heading = section.heading;
    const content = section.content;

    // Match pattern: "Primary-180--ecl-color-primary-180#051036COPY"
    // Format: ColorName--ecl-color-variable#HEXCOPY
    const colorRegex = /([\w\s()-]+?)--ecl-color-([\w-]+)#([0-9A-F]{6})COPY/g;
    let match;

    while ((match = colorRegex.exec(content)) !== null) {
      const [_, displayName, cssVar, hexValue] = match;

      // Clean up display name (remove extra spaces, handle "(Primary)" annotations)
      const cleanName = displayName.trim().replace(/\s+/g, ' ');
      const cssVariable = `--ecl-color-${cssVar}`;
      const value = `#${hexValue}`;

      // Skip if already seen
      if (seen.has(cleanName)) continue;
      seen.add(cleanName);

      // Determine usage context from heading
      let usageContext = heading;
      if (cleanName.includes('(Primary)') || cleanName.includes('(Neutral)')) {
        usageContext += ' - Base color';
      }

      insertStmt.run(
        'color',
        cleanName,
        value,
        cssVariable,
        `${heading} color token`,
        usageContext
      );

      stats.colors++;
      stats.total++;
    }
  }

  console.log(`   ✓ Extracted ${stats.colors} color tokens`);
}

/**
 * Extract spacing tokens from Spacing page (id=11)
 * Pattern: "NameSize" followed by "64px - 4rem"
 */
function extractSpacingTokens() {
  console.log('\n📏 Extracting spacing tokens...');

  const sections = db.prepare(`
    SELECT heading, content 
    FROM content_sections 
    WHERE page_id = 11 
    ORDER BY position
  `).all();

  const insertStmt = db.prepare(`
    INSERT INTO design_tokens (
      category, token_name, value, css_variable, 
      description, usage_context, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run.bind(db.prepare(`
    INSERT INTO design_tokens (
      category, token_name, value, css_variable, 
      description, usage_context, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `));

  // Find spacing values section
  const spacingSection = sections.find(s => s.heading === 'Spacing values');
  if (!spacingSection) {
    console.warn('   ⚠️  Spacing values section not found');
    return;
  }

  // Pattern: "6xl64px - 4rem" (no spaces between name and size)
  const spacingRegex = /(\d*x?[ls])(\d+)px\s*-\s*([\d.]+)rem/g;
  let match;

  while ((match = spacingRegex.exec(spacingSection.content)) !== null) {
    const [_, sizeName, pxValue, remValue] = match;

    const name = sizeName;
    const value = `${pxValue}px`;
    const cssVariable = `--ecl-spacing-${name}`;
    const description = `Spacing token: ${pxValue}px / ${remValue}rem`;

    // Determine usage context
    let usageContext = 'Layout and component spacing';
    if (['6xl', '5xl', '4xl', '3xl', '2xl', 'xl'].includes(name)) {
      usageContext = 'Layout spacing - vertical relationships between components';
    } else {
      usageContext = 'Inner component spacing - fixed horizontal or vertical spacing';
    }

    insertStmt(
      'spacing',
      name,
      value,
      cssVariable,
      description,
      usageContext
    );

    stats.spacing++;
    stats.total++;
  }

  console.log(`   ✓ Extracted ${stats.spacing} spacing tokens`);
}

/**
 * Extract typography tokens from Typography page (id=6)
 * Includes font sizes, weights, and line heights for headings and body text
 */
function extractTypographyTokens() {
  console.log('\n🔤 Extracting typography tokens...');

  const sections = db.prepare(`
    SELECT heading, content 
    FROM content_sections 
    WHERE page_id = 6 
    ORDER BY position
  `).all();

  const insertStmt = db.prepare(`
    INSERT INTO design_tokens (
      category, token_name, value, css_variable, 
      description, usage_context, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  // Extract base font size
  const modularSection = sections.find(s => s.heading === 'Modular type scale');
  if (modularSection && modularSection.content.includes('16px (1rem)')) {
    insertStmt.run(
      'typography',
      'body-base',
      '16px',
      '--ecl-font-size-base',
      'Base font size for body text - default browser size ensuring readability',
      'Body text, default text'
    );
    stats.typography++;
    stats.total++;
  }

  // Extract font weights
  const weightSection = sections.find(s => s.heading === 'Weight');
  if (weightSection) {
    insertStmt.run(
      'typography',
      'font-weight-regular',
      '400',
      '--ecl-font-weight-regular',
      'Regular font weight for body text',
      'Body text, paragraphs'
    );

    insertStmt.run(
      'typography',
      'font-weight-bold',
      '700',
      '--ecl-font-weight-bold',
      'Bold font weight for headings and emphasis',
      'Headings, important text'
    );

    stats.typography += 2;
    stats.total += 2;
  }

  // Extract heading sizes
  // Pattern: "3XL - 2.5rem - 40px"
  const sizeRegex = /(\d*X?L)\s*-\s*([\d.]+)rem\s*-\s*(\d+)px/g;

  for (const section of sections) {
    if (section.heading.startsWith('Heading ')) {
      const headingLevel = section.heading.match(/Heading (\d)/)?.[1];
      if (!headingLevel) continue;

      let match;
      const sizes = [];

      while ((match = sizeRegex.exec(section.content)) !== null) {
        const [_, sizeName, remValue, pxValue] = match;
        sizes.push({ sizeName, remValue, pxValue });
      }

      // Process unique sizes (desktop variants)
      const uniqueSizes = [...new Map(sizes.map(s => [s.sizeName, s])).values()];

      for (const { sizeName, remValue, pxValue } of uniqueSizes) {
        const name = `heading-${headingLevel}-${sizeName.toLowerCase()}`;
        const cssVariable = `--ecl-font-size-${name}`;
        const description = `Heading ${headingLevel} font size: ${pxValue}px / ${remValue}rem`;
        const usageContext = `h${headingLevel} elements`;

        insertStmt.run(
          'typography',
          name,
          `${pxValue}px`,
          cssVariable,
          description,
          usageContext
        );

        stats.typography++;
        stats.total++;
      }
    }
  }

  // Extract line height ratios
  const lineHeightSection = sections.find(s => s.heading === 'Line height');
  if (lineHeightSection) {
    insertStmt.run(
      'typography',
      'line-height-body',
      '1.5',
      '--ecl-line-height-body',
      'Line height ratio for body text - 1:1.5 ratio',
      'Paragraphs, standard copy'
    );

    insertStmt.run(
      'typography',
      'line-height-heading',
      '1.2',
      '--ecl-line-height-heading',
      'Line height ratio for headings - 1:1.2 ratio',
      'All heading levels'
    );

    stats.typography += 2;
    stats.total += 2;
  }

  console.log(`   ✓ Extracted ${stats.typography} typography tokens`);
}

/**
 * Main extraction process
 */
function main() {
  console.log('🚀 ECL Design Token Extraction');
  console.log('================================\n');

  try {
    // Clear existing tokens
    const existing = db.prepare('SELECT COUNT(*) as count FROM design_tokens').get();
    if (existing.count > 0) {
      console.log(`⚠️  Found ${existing.count} existing tokens - clearing...`);
      db.prepare('DELETE FROM design_tokens').run();
    }

    // Extract all token types
    extractColorTokens();
    extractSpacingTokens();
    extractTypographyTokens();

    // Display summary
    console.log('\n✅ Extraction Complete!');
    console.log('================================');
    console.log(`   Colors:     ${stats.colors}`);
    console.log(`   Spacing:    ${stats.spacing}`);
    console.log(`   Typography: ${stats.typography}`);
    console.log(`   ─────────────────────────`);
    console.log(`   Total:      ${stats.total}\n`);

    // Verify database
    const finalCount = db.prepare('SELECT COUNT(*) as count FROM design_tokens').get();
    console.log(`📊 Database now contains ${finalCount.count} design tokens`);

    // Show category breakdown
    const breakdown = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM design_tokens 
      GROUP BY category 
      ORDER BY category
    `).all();

    console.log('\nCategory Breakdown:');
    breakdown.forEach(row => {
      console.log(`   ${row.category.padEnd(12)}: ${row.count}`);
    });

  } catch (error) {
    console.error('\n❌ Error during extraction:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run extraction
main();
