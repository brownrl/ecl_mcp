/**
 * Extract ECL Utility Classes from Usage Pages
 * 
 * Many ECL utilities don't have code examples - they're CSS utility classes
 * that you add to existing elements. This script extracts class names and
 * usage information from the raw HTML of usage pages.
 */

import Database from 'better-sqlite3';
import * as cheerio from 'cheerio';

const db = new Database('ecl-database.sqlite');

// Utilities that are pure CSS classes (no standalone code examples)
const utilityPages = [
  { id: 68, name: 'clearfix', component_name: 'clearfix' },
  { id: 69, name: 'dimension', component_name: 'dimension' },
  { id: 70, name: 'disablescroll', component_name: 'disablescroll' },
  { id: 71, name: 'display', component_name: 'display' },
  { id: 72, name: 'float', component_name: 'float' },
  { id: 74, name: 'html-tag', component_name: 'html-tag' },
  { id: 76, name: 'screen-reader', component_name: 'screen-reader' },
  { id: 77, name: 'shadow', component_name: 'shadow' },
  { id: 80, name: 'z-index', component_name: 'z-index' }
];

console.log('🔧 Extracting ECL Utility Classes\n');
console.log('='.repeat(80));

const insertStmt = db.prepare(`
  INSERT INTO code_examples (page_id, code, language, example_type, description)
  VALUES (?, ?, ?, ?, ?)
`);

const guidanceStmt = db.prepare(`
  INSERT INTO usage_guidance (page_id, guidance_type, content)
  VALUES (?, ?, ?)
`);

let totalExamples = 0;
let totalGuidance = 0;

utilityPages.forEach(util => {
  console.log(`\nProcessing: ${util.name}`);
  
  try {
    // Get the raw HTML
    const page = db.prepare('SELECT raw_html FROM pages WHERE id = ?').get(util.id);
    
    if (!page || !page.raw_html) {
      console.log(`  ⚠️  No HTML found`);
      return;
    }
    
    const $ = cheerio.load(page.raw_html);
    const classes = new Set();
    const descriptions = [];
    
    // Find all ECL utility classes mentioned in the page
    $('[class*="ecl-u-"]').each((i, elem) => {
      const classList = $(elem).attr('class');
      if (classList) {
        classList.split(/\s+/).forEach(cls => {
          if (cls.startsWith('ecl-u-')) {
            classes.add(cls);
          }
        });
      }
    });
    
    // Also search in code blocks and text content
    $('code, pre').each((i, elem) => {
      const text = $(elem).text();
      const matches = text.match(/ecl-u-[a-z0-9-]+/g);
      if (matches) {
        matches.forEach(cls => classes.add(cls));
      }
    });
    
    // Extract usage descriptions
    $('.ecl-u-type-paragraph, p').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.length > 20 && text.length < 500) {
        descriptions.push(text);
      }
    });
    
    console.log(`  Found ${classes.size} utility classes`);
    
    if (classes.size > 0) {
      // Create examples for each class or as a comprehensive list
      const classList = Array.from(classes).sort();
      
      // Create a comprehensive example
      const exampleCode = classList.map(cls => {
        const purpose = cls.replace('ecl-u-', '').replace(/-/g, ' ');
        return `<!-- ${purpose} -->\n<div class="${cls}">Content</div>`;
      }).join('\n\n');
      
      const description = `${util.name.charAt(0).toUpperCase() + util.name.slice(1)} utility classes for ECL. Available classes: ${classList.join(', ')}`;
      
      insertStmt.run(
        util.id,
        exampleCode,
        'html',
        'utility-class',
        description
      );
      totalExamples++;
      console.log(`  ✅ Created comprehensive example`);
      
      // Add each class as a separate simple example
      classList.slice(0, 5).forEach(cls => {
        const simpleExample = `<div class="${cls}">Content</div>`;
        const simpleDesc = `Use the ${cls} utility class to apply ${cls.replace('ecl-u-', '').replace(/-/g, ' ')} styling`;
        
        insertStmt.run(
          util.id,
          simpleExample,
          'html',
          'utility-class-single',
          simpleDesc
        );
        totalExamples++;
      });
    }
    
    // Add usage guidance
    if (descriptions.length > 0) {
      const guidanceText = descriptions.slice(0, 3).join('\n\n');
      guidanceStmt.run(
        util.id,
        'usage',
        guidanceText
      );
      totalGuidance++;
      console.log(`  ✅ Added usage guidance`);
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n✅ Complete!`);
console.log(`   Total examples created: ${totalExamples}`);
console.log(`   Total guidance entries: ${totalGuidance}\n`);

db.close();
