#!/usr/bin/env node

/**
 * Fix Database Duplicates
 * 
 * Issues found:
 * 1. usage_guidance table has 1593 rows but only 526 unique (3x duplication)
 * 2. component_metadata table has duplicate rows for same page_id
 * 3. code_examples may have similar issues
 * 
 * This script deduplicates all affected tables.
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const dbPath = join(projectRoot, 'ecl-database.sqlite');

console.log('🔧 DATABASE DEDUPLICATION SCRIPT\n');
console.log('Database:', dbPath);
console.log('');

const db = new Database(dbPath);

// Start transaction for safety
db.exec('BEGIN TRANSACTION');

try {
    // 1. Deduplicate usage_guidance
    console.log('1. DEDUPLICATING usage_guidance TABLE');
    console.log('='.repeat(60));

    const guidanceBefore = db.prepare('SELECT COUNT(*) as count FROM usage_guidance').get();
    console.log(`Before: ${guidanceBefore.count} rows`);

    // Create temp table with unique rows
    db.exec(`
    CREATE TEMP TABLE usage_guidance_unique AS
    SELECT 
      MIN(id) as id,
      page_id,
      guidance_type,
      content,
      MIN(created_at) as created_at
    FROM usage_guidance
    GROUP BY page_id, guidance_type, content
  `);

    const uniqueGuidance = db.prepare('SELECT COUNT(*) as count FROM usage_guidance_unique').get();
    console.log(`Unique rows: ${uniqueGuidance.count}`);
    console.log(`Removing: ${guidanceBefore.count - uniqueGuidance.count} duplicates`);

    // Replace table
    db.exec('DELETE FROM usage_guidance');
    db.exec(`
    INSERT INTO usage_guidance (id, page_id, guidance_type, content, created_at)
    SELECT id, page_id, guidance_type, content, created_at
    FROM usage_guidance_unique
  `);

    const guidanceAfter = db.prepare('SELECT COUNT(*) as count FROM usage_guidance').get();
    console.log(`After: ${guidanceAfter.count} rows`);
    console.log('✅ Deduplicated usage_guidance\n');

    // 2. Deduplicate component_metadata
    console.log('2. DEDUPLICATING component_metadata TABLE');
    console.log('='.repeat(60));

    const metadataBefore = db.prepare('SELECT COUNT(*) as count FROM component_metadata').get();
    console.log(`Before: ${metadataBefore.count} rows`);

    // Find pages with duplicates
    const duplicatePages = db.prepare(`
    SELECT page_id, COUNT(*) as count 
    FROM component_metadata 
    GROUP BY page_id 
    HAVING count > 1
  `).all();

    console.log(`Pages with duplicates: ${duplicatePages.length}`);
    if (duplicatePages.length > 0) {
        console.log('Sample duplicates:', duplicatePages.slice(0, 5).map(p => `page ${p.page_id} (${p.count}x)`).join(', '));
    }

    // Create temp table keeping first row for each page_id
    db.exec(`
    CREATE TEMP TABLE component_metadata_unique AS
    SELECT 
      MIN(id) as id,
      page_id,
      component_name,
      component_type,
      complexity,
      status,
      variant,
      requires_js,
      framework_specific,
      MIN(created_at) as created_at
    FROM component_metadata
    GROUP BY page_id
  `);

    const uniqueMetadata = db.prepare('SELECT COUNT(*) as count FROM component_metadata_unique').get();
    console.log(`Unique rows: ${uniqueMetadata.count}`);
    console.log(`Removing: ${metadataBefore.count - uniqueMetadata.count} duplicates`);

    // Replace table
    db.exec('DELETE FROM component_metadata');
    db.exec(`
    INSERT INTO component_metadata 
    SELECT * FROM component_metadata_unique
  `);

    const metadataAfter = db.prepare('SELECT COUNT(*) as count FROM component_metadata').get();
    console.log(`After: ${metadataAfter.count} rows`);
    console.log('✅ Deduplicated component_metadata\n');

    // 3. Check component_tags for duplicates
    console.log('3. CHECKING component_tags TABLE');
    console.log('='.repeat(60));

    const tagsBefore = db.prepare('SELECT COUNT(*) as count FROM component_tags').get();
    const uniqueTags = db.prepare(`
    SELECT COUNT(DISTINCT page_id || '|' || tag) as count FROM component_tags
  `).get();

    console.log(`Total rows: ${tagsBefore.count}`);
    console.log(`Unique combinations: ${uniqueTags.count}`);

    if (tagsBefore.count > uniqueTags.count) {
        console.log(`Removing: ${tagsBefore.count - uniqueTags.count} duplicate tags`);

        db.exec(`
      CREATE TEMP TABLE component_tags_unique AS
      SELECT 
        MIN(id) as id,
        page_id,
        tag,
        tag_type,
        MIN(created_at) as created_at
      FROM component_tags
      GROUP BY page_id, tag
    `);

        db.exec('DELETE FROM component_tags');
        db.exec(`
      INSERT INTO component_tags (id, page_id, tag, tag_type, created_at)
      SELECT id, page_id, tag, tag_type, created_at
      FROM component_tags_unique
    `);

        const tagsAfter = db.prepare('SELECT COUNT(*) as count FROM component_tags').get();
        console.log(`After: ${tagsAfter.count} rows`);
        console.log('✅ Deduplicated component_tags\n');
    } else {
        console.log('✅ No duplicates found in component_tags\n');
    }

    // 4. Check code_examples for duplicates

    console.log('4. DEDUPLICATING code_examples TABLE');
    console.log('='.repeat(60));

    const examplesBefore = db.prepare('SELECT COUNT(*) as count FROM code_examples').get();
    // Use full code for deduplication, not just first 100 chars
    db.exec(`
      CREATE TEMP TABLE code_examples_unique AS
      SELECT 
        MIN(id) as id,
        page_id,
        language,
        code,
        MIN(created_at) as created_at
      FROM code_examples
      GROUP BY page_id, language, code
    `);

    const uniqueExamples = db.prepare('SELECT COUNT(*) as count FROM code_examples_unique').get();
    console.log(`Total rows: ${examplesBefore.count}`);
    console.log(`Unique rows: ${uniqueExamples.count}`);
    console.log(`Removing: ${examplesBefore.count - uniqueExamples.count} duplicates`);

    // Replace table
    db.exec('DELETE FROM code_examples');
    db.exec(`
      INSERT INTO code_examples (id, page_id, language, code, created_at)
      SELECT id, page_id, language, code, created_at
      FROM code_examples_unique
    `);

    const examplesAfter = db.prepare('SELECT COUNT(*) as count FROM code_examples').get();
    console.log(`After: ${examplesAfter.count} rows`);
    console.log('✅ Deduplicated code_examples\n');

    // Commit transaction
    db.exec('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE DEDUPLICATION COMPLETE');
    console.log('='.repeat(60));
    console.log('\nSummary:');
    console.log(`- usage_guidance: ${guidanceBefore.count} → ${guidanceAfter.count} rows`);
    console.log(`- component_metadata: ${metadataBefore.count} → ${metadataAfter.count} rows`);
    console.log(`- component_tags: ${tagsBefore.count} rows (checked)`);
    console.log(`- code_examples: ${examplesBefore.count} rows (checked)`);

} catch (error) {
    console.error('\n❌ ERROR during deduplication:', error.message);
    console.error('Rolling back changes...');
    db.exec('ROLLBACK');
    process.exit(1);
}

db.close();
