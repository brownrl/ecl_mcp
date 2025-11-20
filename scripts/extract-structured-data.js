#!/usr/bin/env node

/**
 * ECL MCP Server - Phase 2: Data Extraction
 * Extracts structured data from crawled HTML pages
 * 
 * Run: node scripts/extract-structured-data.js
 */

import Database from 'better-sqlite3';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'ecl-database.sqlite');

console.log('🔍 ECL Data Extraction - Phase 2');
console.log('Database:', DB_PATH);
console.log('');

const db = new Database(DB_PATH);

// Statistics
const stats = {
  pagesProcessed: 0,
  metadataExtracted: 0,
  apiExtracted: 0,
  tokensExtracted: 0,
  guidanceExtracted: 0,
  relationshipsExtracted: 0,
  tagsExtracted: 0,
  examplesEnhanced: 0,
  accessibilityExtracted: 0,
  errors: []
};

/**
 * Extract component metadata (type, complexity, requirements)
 */
function extractMetadata(page, $) {
  try {
    const componentName = page.title.replace(/^(EC - )?/, '').trim();
    
    // Determine component type
    let componentType = 'component';
    if (page.category === 'Utilities') componentType = 'utility';
    if (page.category === 'Guidelines') componentType = 'pattern';
    
    // Check if requires JavaScript
    const requiresJs = page.raw_html.toLowerCase().includes('ecl.init') || 
                       page.raw_html.toLowerCase().includes('javascript') ||
                       $('.ecl-accordion, .ecl-modal, .ecl-carousel, .ecl-expandable').length > 0;
    
    // Determine complexity based on content
    const codeExampleCount = db.prepare('SELECT COUNT(*) as count FROM code_examples WHERE page_id = ?').get(page.id).count;
    const contentSectionCount = db.prepare('SELECT COUNT(*) as count FROM content_sections WHERE page_id = ?').get(page.id).count;
    
    let complexity = 'simple';
    if (codeExampleCount > 5 || contentSectionCount > 10 || requiresJs) {
      complexity = 'moderate';
    }
    if (codeExampleCount > 10 || contentSectionCount > 15 || 
        componentName.toLowerCase().includes('carousel') ||
        componentName.toLowerCase().includes('modal')) {
      complexity = 'complex';
    }
    
    // Insert metadata
    db.prepare(`
      INSERT INTO component_metadata (page_id, component_name, component_type, complexity, status, requires_js)
      VALUES (?, ?, ?, ?, 'stable', ?)
    `).run(page.id, componentName, componentType, complexity, requiresJs ? 1 : 0);
    
    stats.metadataExtracted++;
    return true;
  } catch (error) {
    stats.errors.push({ type: 'metadata', page: page.title, error: error.message });
    return false;
  }
}

/**
 * Extract API documentation (attributes, props, events)
 */
function extractAPI(page, $) {
  try {
    let extracted = 0;
    
    // Look for tables with API documentation
    $('table').each((i, table) => {
      const $table = $(table);
      const headers = [];
      
      // Get headers
      $table.find('thead th, thead td').each((j, th) => {
        headers.push($(th).text().trim().toLowerCase());
      });
      
      // Check if this looks like an API table
      const isApiTable = headers.some(h => 
        h.includes('attribute') || h.includes('prop') || h.includes('name') ||
        h.includes('type') || h.includes('default') || h.includes('required')
      );
      
      if (!isApiTable) return;
      
      // Determine API type from context
      const prevHeading = $table.prevAll('h2, h3').first().text().toLowerCase();
      let apiType = 'attribute';
      if (prevHeading.includes('prop')) apiType = 'prop';
      if (prevHeading.includes('event')) apiType = 'event';
      if (prevHeading.includes('method')) apiType = 'method';
      if (prevHeading.includes('slot')) apiType = 'slot';
      if (prevHeading.includes('css') || prevHeading.includes('variable')) apiType = 'css-variable';
      
      // Extract rows
      $table.find('tbody tr').each((j, row) => {
        const $row = $(row);
        const cells = [];
        $row.find('td').each((k, cell) => {
          cells.push($(cell).text().trim());
        });
        
        if (cells.length < 2) return; // Need at least name and something else
        
        // Map cells to fields based on headers
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('attribute'));
        const typeIdx = headers.findIndex(h => h.includes('type'));
        const requiredIdx = headers.findIndex(h => h.includes('required'));
        const defaultIdx = headers.findIndex(h => h.includes('default'));
        const descIdx = headers.findIndex(h => h.includes('description') || h.includes('desc'));
        
        const name = cells[nameIdx] || cells[0];
        const dataType = typeIdx >= 0 ? cells[typeIdx] : null;
        const required = requiredIdx >= 0 ? (cells[requiredIdx].toLowerCase().includes('yes') || cells[requiredIdx] === '✓' ? 1 : 0) : 0;
        const defaultValue = defaultIdx >= 0 ? cells[defaultIdx] : null;
        const description = descIdx >= 0 ? cells[descIdx] : (cells[1] || null);
        
        if (!name || name === '-') return;
        
        db.prepare(`
          INSERT INTO component_api (page_id, api_type, name, data_type, required, default_value, description)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(page.id, apiType, name, dataType, required, defaultValue, description);
        
        extracted++;
      });
    });
    
    stats.apiExtracted += extracted;
    return extracted > 0;
  } catch (error) {
    stats.errors.push({ type: 'api', page: page.title, error: error.message });
    return false;
  }
}

/**
 * Extract design tokens from guidelines pages
 */
function extractDesignTokens(page, $) {
  if (page.category !== 'Guidelines') return false;
  
  try {
    let extracted = 0;
    const pageName = page.title.toLowerCase();
    
    // Color tokens
    if (pageName.includes('colour') || pageName.includes('color')) {
      // Look for color swatches or color definitions
      $('.ecl-color, [class*="color"], [class*="colour"]').each((i, elem) => {
        const $elem = $(elem);
        const name = $elem.find('[class*="label"], [class*="name"]').text().trim();
        const value = $elem.attr('style') || $elem.find('[class*="value"]').text().trim();
        
        if (name && value) {
          db.prepare(`
            INSERT OR IGNORE INTO design_tokens (category, token_name, value, source_page_id)
            VALUES ('color', ?, ?, ?)
          `).run(name, value, page.id);
          extracted++;
        }
      });
    }
    
    // Typography tokens
    if (pageName.includes('typography')) {
      $('h1, h2, h3, h4, h5, h6, .ecl-u-type-*').each((i, elem) => {
        const $elem = $(elem);
        const tagName = elem.tagName.toLowerCase();
        const classes = $elem.attr('class') || '';
        
        if (classes.includes('ecl-u-type')) {
          const tokenName = classes.match(/ecl-u-type-[^\s]+/)?.[0];
          if (tokenName) {
            db.prepare(`
              INSERT OR IGNORE INTO design_tokens (category, token_name, css_variable, value, source_page_id)
              VALUES ('typography', ?, ?, 'See ECL typography scale', ?)
            `).run(tokenName, tokenName, page.id);
            extracted++;
          }
        }
      });
    }
    
    // Spacing tokens
    if (pageName.includes('spacing')) {
      $('[class*="ecl-u-"]').each((i, elem) => {
        const classes = $(elem).attr('class') || '';
        const spacingClasses = classes.match(/ecl-u-(m|p)[a-z]*-[^\s]+/g);
        
        if (spacingClasses) {
          spacingClasses.forEach(cls => {
            db.prepare(`
              INSERT OR IGNORE INTO design_tokens (category, token_name, css_variable, value, source_page_id)
              VALUES ('spacing', ?, ?, 'See ECL spacing scale', ?)
            `).run(cls, cls, page.id);
            extracted++;
          });
        }
      });
    }
    
    stats.tokensExtracted += extracted;
    return extracted > 0;
  } catch (error) {
    stats.errors.push({ type: 'tokens', page: page.title, error: error.message });
    return false;
  }
}

/**
 * Extract usage guidance (Do's, Don'ts, When to use, etc.)
 */
function extractGuidance(page, $) {
  try {
    let extracted = 0;
    
    // Map heading text to guidance types
    const guidanceMap = {
      'when to use': 'when-to-use',
      'when not to use': 'when-not-to-use',
      'do': 'do',
      'don\'t': 'dont',
      'donts': 'dont',
      'best practice': 'best-practice',
      'caveat': 'caveat',
      'limitation': 'limitation',
      'note': 'note'
    };
    
    // Look for sections with guidance
    $('h2, h3, h4').each((i, heading) => {
      const $heading = $(heading);
      const headingText = $heading.text().trim().toLowerCase();
      
      let guidanceType = null;
      for (const [key, value] of Object.entries(guidanceMap)) {
        if (headingText.includes(key)) {
          guidanceType = value;
          break;
        }
      }
      
      if (!guidanceType) return;
      
      // Get content after heading until next heading
      let $current = $heading.next();
      while ($current.length && !$current.is('h1, h2, h3, h4, h5, h6')) {
        const content = $current.text().trim();
        
        if (content) {
          // Handle lists
          if ($current.is('ul, ol')) {
            $current.find('li').each((j, li) => {
              const itemContent = $(li).text().trim();
              if (itemContent) {
                db.prepare(`
                  INSERT INTO usage_guidance (page_id, guidance_type, content)
                  VALUES (?, ?, ?)
                `).run(page.id, guidanceType, itemContent);
                extracted++;
              }
            });
          } else if (content.length > 10) {
            db.prepare(`
              INSERT INTO usage_guidance (page_id, guidance_type, content)
              VALUES (?, ?, ?)
            `).run(page.id, guidanceType, content);
            extracted++;
          }
        }
        
        $current = $current.next();
      }
    });
    
    stats.guidanceExtracted += extracted;
    return extracted > 0;
  } catch (error) {
    stats.errors.push({ type: 'guidance', page: page.title, error: error.message });
    return false;
  }
}

/**
 * Detect component relationships by analyzing content
 */
function detectRelationships(page, $) {
  try {
    let extracted = 0;
    const html = page.raw_html.toLowerCase();
    const componentName = page.title.replace(/^(EC - )?/, '').trim().toLowerCase();
    
    // Get all component pages
    const allPages = db.prepare('SELECT id, title FROM pages WHERE category = ?').all('Components');
    
    // Look for mentions of other components
    allPages.forEach(otherPage => {
      if (otherPage.id === page.id) return;
      
      const otherName = otherPage.title.replace(/^(EC - )?/, '').trim().toLowerCase();
      const mentions = (html.match(new RegExp(otherName, 'gi')) || []).length;
      
      if (mentions === 0) return;
      
      // Determine relationship type
      let relationshipType = 'suggests';
      
      if (html.includes(`require ${otherName}`) || html.includes(`requires ${otherName}`)) {
        relationshipType = 'requires';
      } else if (html.includes(`alternative to ${otherName}`) || html.includes(`instead of ${otherName}`)) {
        relationshipType = 'alternative';
      } else if (html.includes(`contain ${otherName}`) || html.includes(`contains ${otherName}`)) {
        relationshipType = 'contains';
      } else if (html.includes(`conflict ${otherName}`) || html.includes(`conflicts with ${otherName}`)) {
        relationshipType = 'conflicts';
      }
      
      // Only add if mentioned multiple times or strong relationship
      if (mentions >= 2 || relationshipType !== 'suggests') {
        db.prepare(`
          INSERT OR IGNORE INTO component_relationships (source_page_id, target_page_id, relationship_type, description)
          VALUES (?, ?, ?, ?)
        `).run(page.id, otherPage.id, relationshipType, `Mentioned ${mentions} times`);
        extracted++;
      }
    });
    
    stats.relationshipsExtracted += extracted;
    return extracted > 0;
  } catch (error) {
    stats.errors.push({ type: 'relationships', page: page.title, error: error.message });
    return false;
  }
}

/**
 * Generate tags for components
 */
function generateTags(page, $) {
  try {
    let extracted = 0;
    const componentName = page.title.replace(/^(EC - )?/, '').trim().toLowerCase();
    const html = page.raw_html.toLowerCase();
    
    // Category tags
    db.prepare(`INSERT OR IGNORE INTO component_tags (page_id, tag, tag_type) VALUES (?, ?, 'category')`).run(page.id, page.category.toLowerCase());
    extracted++;
    
    // Feature tags
    const featureTags = [
      { keyword: 'interactive', tag: 'interactive' },
      { keyword: 'form', tag: 'form' },
      { keyword: 'navigation', tag: 'navigation' },
      { keyword: 'layout', tag: 'layout' },
      { keyword: 'media', tag: 'media' },
      { keyword: 'data', tag: 'data-display' },
      { keyword: 'feedback', tag: 'feedback' },
      { keyword: 'overlay', tag: 'overlay' },
      { keyword: 'animation', tag: 'animated' },
    ];
    
    featureTags.forEach(({ keyword, tag }) => {
      if (html.includes(keyword) || componentName.includes(keyword)) {
        db.prepare(`INSERT OR IGNORE INTO component_tags (page_id, tag, tag_type) VALUES (?, ?, 'feature')`).run(page.id, tag);
        extracted++;
      }
    });
    
    // Accessibility tags
    if (html.includes('aria-') || html.includes('accessibility') || html.includes('wcag')) {
      db.prepare(`INSERT OR IGNORE INTO component_tags (page_id, tag, tag_type) VALUES (?, 'accessible', 'accessibility')`).run(page.id);
      extracted++;
    }
    
    // Interaction tags
    if (html.includes('click') || html.includes('hover') || html.includes('focus')) {
      db.prepare(`INSERT OR IGNORE INTO component_tags (page_id, tag, tag_type) VALUES (?, 'user-input', 'interaction')`).run(page.id);
      extracted++;
    }
    
    stats.tagsExtracted += extracted;
    return extracted > 0;
  } catch (error) {
    stats.errors.push({ type: 'tags', page: page.title, error: error.message });
    return false;
  }
}

/**
 * Enhance existing code examples with metadata
 */
function enhanceCodeExamples(page, $) {
  try {
    const examples = db.prepare('SELECT id, language, code FROM code_examples WHERE page_id = ?').all(page.id);
    
    examples.forEach(example => {
      const code = example.code.toLowerCase();
      
      // Determine complexity
      const lines = code.split('\n').length;
      let complexity = 'basic';
      if (lines > 20) complexity = 'intermediate';
      if (lines > 50) complexity = 'advanced';
      
      // Check if complete
      const isComplete = code.includes('<!doctype') || 
                         (code.includes('<html') && code.includes('</html>'));
      
      // Check if requires data
      const requiresData = code.includes('data-') || 
                           code.includes('{{') || 
                           code.includes('{%');
      
      // Check if interactive
      const isInteractive = code.includes('ecl.init') || 
                            code.includes('addeventlistener') ||
                            code.includes('onclick');
      
      db.prepare(`
        INSERT INTO enhanced_code_examples (example_id, complexity, complete_example, requires_data, interactive)
        VALUES (?, ?, ?, ?, ?)
      `).run(example.id, complexity, isComplete ? 1 : 0, requiresData ? 1 : 0, isInteractive ? 1 : 0);
      
      stats.examplesEnhanced++;
    });
    
    return examples.length > 0;
  } catch (error) {
    stats.errors.push({ type: 'examples', page: page.title, error: error.message });
    return false;
  }
}

/**
 * Extract accessibility requirements
 */
function extractAccessibility(page, $) {
  try {
    let extracted = 0;
    const html = page.raw_html.toLowerCase();
    
    // Look for ARIA attributes
    const ariaAttrs = html.match(/aria-[a-z-]+/g);
    if (ariaAttrs && ariaAttrs.length > 0) {
      const uniqueAria = [...new Set(ariaAttrs)];
      uniqueAria.forEach(attr => {
        db.prepare(`
          INSERT INTO accessibility_requirements (page_id, requirement_type, description)
          VALUES (?, 'aria', ?)
        `).run(page.id, `Uses ${attr} attribute`);
        extracted++;
      });
    }
    
    // Look for keyboard accessibility mentions
    if (html.includes('keyboard') || html.includes('tab') || html.includes('focus')) {
      db.prepare(`
        INSERT INTO accessibility_requirements (page_id, requirement_type, description)
        VALUES (?, 'keyboard', 'Keyboard navigation supported')
      `).run(page.id);
      extracted++;
    }
    
    // Look for WCAG mentions
    const wcagMatch = html.match(/wcag\s*([\d.]+)\s*(a|aa|aaa)?/i);
    if (wcagMatch) {
      db.prepare(`
        INSERT INTO accessibility_requirements (page_id, requirement_type, wcag_criterion, description)
        VALUES (?, 'wcag-aa', ?, 'Meets WCAG requirements')
      `).run(page.id, wcagMatch[0]);
      extracted++;
    }
    
    stats.accessibilityExtracted += extracted;
    return extracted > 0;
  } catch (error) {
    stats.errors.push({ type: 'accessibility', page: page.title, error: error.message });
    return false;
  }
}

/**
 * Main extraction process
 */
async function extractData() {
  console.log('📋 Fetching pages from database...');
  const pages = db.prepare('SELECT * FROM pages ORDER BY category, title').all();
  console.log(`Found ${pages.length} pages to process\n`);
  
  console.log('Starting extraction...\n');
  
  for (const page of pages) {
    try {
      const $ = cheerio.load(page.raw_html);
      
      // Run extractors
      extractMetadata(page, $);
      extractAPI(page, $);
      extractDesignTokens(page, $);
      extractGuidance(page, $);
      detectRelationships(page, $);
      generateTags(page, $);
      enhanceCodeExamples(page, $);
      extractAccessibility(page, $);
      
      stats.pagesProcessed++;
      
      // Progress update every 20 pages
      if (stats.pagesProcessed % 20 === 0) {
        console.log(`Progress: ${stats.pagesProcessed}/${pages.length} pages processed`);
      }
      
    } catch (error) {
      stats.errors.push({ type: 'page', page: page.title, error: error.message });
      console.error(`❌ Error processing ${page.title}:`, error.message);
    }
  }
  
  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('✅ Extraction Complete!');
  console.log('='.repeat(60));
  console.log(`\n📊 Statistics:`);
  console.log(`  Pages processed: ${stats.pagesProcessed}/${pages.length}`);
  console.log(`  Metadata extracted: ${stats.metadataExtracted}`);
  console.log(`  API entries: ${stats.apiExtracted}`);
  console.log(`  Design tokens: ${stats.tokensExtracted}`);
  console.log(`  Guidance items: ${stats.guidanceExtracted}`);
  console.log(`  Relationships: ${stats.relationshipsExtracted}`);
  console.log(`  Tags: ${stats.tagsExtracted}`);
  console.log(`  Examples enhanced: ${stats.examplesEnhanced}`);
  console.log(`  Accessibility items: ${stats.accessibilityExtracted}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors: ${stats.errors.length}`);
    console.log('\nFirst 5 errors:');
    stats.errors.slice(0, 5).forEach(err => {
      console.log(`  - [${err.type}] ${err.page}: ${err.error}`);
    });
  }
  
  console.log('\n🎉 Phase 2 data extraction complete!');
}

// Run extraction
try {
  await extractData();
} catch (error) {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
} finally {
  db.close();
}
