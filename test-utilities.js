import Database from 'better-sqlite3';
import { searchComponents } from './src/search/component-search.js';
import { generateComponent } from './src/generator/index.js';

const db = new Database('ecl-database.sqlite');

console.log('🔧 Testing ECL Utilities Access\n');
console.log('='.repeat(80));

// All utilities from the screenshot
const utilities = [
  'Background',
  'Border', 
  'Clearfix',
  'Dimension',
  'Disable scroll',
  'Display',
  'Float',
  'HTML tag styling',
  'Media',
  'Print',
  'Screen reader',
  'Shadow',
  'Spacing',
  'Typography',
  'Z-index',
  'Grid',
  'Stacks'
];

console.log('\n1️⃣  Testing Utility Generation:\n');

const results = {
  success: [],
  failed: []
};

utilities.forEach(utility => {
  const result = generateComponent(db, utility);
  
  if (result.success) {
    const code = result.generated_code?.html || result.generated_code;
    results.success.push({
      name: utility,
      size: code?.length || 0,
      hasCode: code && code.length > 0
    });
    console.log(`✅ ${utility.padEnd(25)} → ${code?.length || 0} bytes`);
  } else {
    results.failed.push({
      name: utility,
      error: result.error
    });
    console.log(`❌ ${utility.padEnd(25)} → ${result.error}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n2️⃣  Testing Search for Utilities:\n');

const searches = [
  { query: 'spacing margin padding', desc: 'Spacing utilities' },
  { query: 'grid layout', desc: 'Grid layout' },
  { query: 'typography font', desc: 'Typography utilities' },
  { query: 'display hide show', desc: 'Display utilities' }
];

searches.forEach(search => {
  const result = searchComponents(db, { query: search.query });
  const count = result.data?.results?.length || 0;
  console.log(`${count > 0 ? '✅' : '❌'} ${search.desc.padEnd(25)} → ${count} results`);
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 SUMMARY:\n`);
console.log(`✅ Working: ${results.success.length}/${utilities.length} utilities`);
console.log(`❌ Failed:  ${results.failed.length}/${utilities.length} utilities`);

if (results.failed.length > 0) {
  console.log('\n❌ FAILED UTILITIES:');
  results.failed.forEach(item => {
    console.log(`   - ${item.name}: ${item.error}`);
  });
}

console.log('');

db.close();
