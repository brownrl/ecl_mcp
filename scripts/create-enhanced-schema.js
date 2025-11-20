#!/usr/bin/env node

/**
 * ECL MCP Server - Phase 2: Enhanced Database Schema
 * Creates 8 new tables to support semantic search and structured data
 * 
 * Run: node scripts/create-enhanced-schema.js
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'ecl-database.sqlite');

console.log('📊 ECL Database Schema Enhancement');
console.log('Database:', DB_PATH);
console.log('');

const db = new Database(DB_PATH);

try {
  console.log('Creating enhanced schema...\n');

  // Table 1: component_metadata
  console.log('1/8 Creating component_metadata table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS component_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      component_name TEXT NOT NULL,
      component_type TEXT CHECK(component_type IN ('component', 'utility', 'pattern')),
      complexity TEXT CHECK(complexity IN ('simple', 'moderate', 'complex')),
      status TEXT CHECK(status IN ('stable', 'experimental', 'deprecated')),
      variant TEXT,
      requires_js BOOLEAN DEFAULT 0,
      framework_specific BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_component_metadata_page ON component_metadata(page_id);
    CREATE INDEX IF NOT EXISTS idx_component_metadata_name ON component_metadata(component_name);
    CREATE INDEX IF NOT EXISTS idx_component_metadata_type ON component_metadata(component_type);
  `);

  // Table 2: component_api
  console.log('2/8 Creating component_api table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS component_api (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      api_type TEXT CHECK(api_type IN ('attribute', 'prop', 'method', 'event', 'slot', 'css-variable')),
      name TEXT NOT NULL,
      data_type TEXT,
      required BOOLEAN DEFAULT 0,
      default_value TEXT,
      description TEXT,
      options TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_component_api_page ON component_api(page_id);
    CREATE INDEX IF NOT EXISTS idx_component_api_name ON component_api(name);
    CREATE INDEX IF NOT EXISTS idx_component_api_type ON component_api(api_type);
  `);

  // Table 3: design_tokens
  console.log('3/8 Creating design_tokens table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS design_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL CHECK(category IN ('color', 'spacing', 'typography', 'breakpoint', 'shadow', 'border-radius', 'z-index', 'timing')),
      token_name TEXT NOT NULL,
      css_variable TEXT,
      value TEXT NOT NULL,
      description TEXT,
      usage_context TEXT,
      source_page_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_page_id) REFERENCES pages(id) ON DELETE SET NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_design_tokens_name ON design_tokens(token_name);
    CREATE INDEX IF NOT EXISTS idx_design_tokens_category ON design_tokens(category);
  `);

  // Table 4: usage_guidance
  console.log('4/8 Creating usage_guidance table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_guidance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      guidance_type TEXT NOT NULL CHECK(guidance_type IN ('when-to-use', 'when-not-to-use', 'do', 'dont', 'best-practice', 'caveat', 'limitation', 'note')),
      content TEXT NOT NULL,
      priority INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_usage_guidance_page ON usage_guidance(page_id);
    CREATE INDEX IF NOT EXISTS idx_usage_guidance_type ON usage_guidance(guidance_type);
  `);

  // Table 5: component_relationships
  console.log('5/8 Creating component_relationships table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS component_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_page_id INTEGER NOT NULL,
      target_page_id INTEGER NOT NULL,
      relationship_type TEXT NOT NULL CHECK(relationship_type IN ('requires', 'suggests', 'alternative', 'contains', 'conflicts', 'extends')),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_page_id) REFERENCES pages(id) ON DELETE CASCADE,
      FOREIGN KEY (target_page_id) REFERENCES pages(id) ON DELETE CASCADE,
      UNIQUE(source_page_id, target_page_id, relationship_type)
    );
    CREATE INDEX IF NOT EXISTS idx_relationships_source ON component_relationships(source_page_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_target ON component_relationships(target_page_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_type ON component_relationships(relationship_type);
  `);

  // Table 6: component_tags
  console.log('6/8 Creating component_tags table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS component_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      tag_type TEXT CHECK(tag_type IN ('category', 'feature', 'use-case', 'platform', 'accessibility', 'interaction')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
      UNIQUE(page_id, tag)
    );
    CREATE INDEX IF NOT EXISTS idx_component_tags_page ON component_tags(page_id);
    CREATE INDEX IF NOT EXISTS idx_component_tags_tag ON component_tags(tag);
  `);

  // Table 7: enhanced_code_examples
  console.log('7/8 Creating enhanced_code_examples table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS enhanced_code_examples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      example_id INTEGER NOT NULL,
      variant TEXT,
      use_case TEXT,
      complexity TEXT CHECK(complexity IN ('basic', 'intermediate', 'advanced')),
      complete_example BOOLEAN DEFAULT 0,
      requires_data BOOLEAN DEFAULT 0,
      interactive BOOLEAN DEFAULT 0,
      accessibility_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (example_id) REFERENCES code_examples(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_enhanced_examples_id ON enhanced_code_examples(example_id);
    CREATE INDEX IF NOT EXISTS idx_enhanced_examples_variant ON enhanced_code_examples(variant);
  `);

  // Table 8: accessibility_requirements
  console.log('8/8 Creating accessibility_requirements table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS accessibility_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      requirement_type TEXT CHECK(requirement_type IN ('wcag-a', 'wcag-aa', 'wcag-aaa', 'aria', 'keyboard', 'screen-reader', 'best-practice')),
      wcag_criterion TEXT,
      description TEXT NOT NULL,
      implementation TEXT,
      testing_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_accessibility_page ON accessibility_requirements(page_id);
    CREATE INDEX IF NOT EXISTS idx_accessibility_type ON accessibility_requirements(requirement_type);
  `);

  console.log('\n✅ All 8 tables created successfully!');
  console.log('\nVerifying schema...');

  // Verify tables exist
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name LIKE 'component_%' OR name LIKE '%_guidance' OR name = 'design_tokens' OR name = 'accessibility_requirements'
    ORDER BY name
  `).all();

  console.log(`\nNew tables (${tables.length}/8):`);
  tables.forEach(t => console.log(`  - ${t.name}`));

  console.log('\n🎉 Schema enhancement complete!');
  console.log('\nNext step: Run data extraction script');

} catch (error) {
  console.error('\n❌ Error creating schema:', error.message);
  process.exit(1);
} finally {
  db.close();
}
