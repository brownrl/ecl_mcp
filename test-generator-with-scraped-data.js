import { generateComponent } from './src/generator/index.js';
import Database from 'better-sqlite3';

const db = new Database('ecl-database.sqlite');

console.log('Testing component generator with scraped blockquote data...\n');

const result = generateComponent(db, 'blockquote', {
  customization: { variant: 'basic' }
});

if (result.success) {
  console.log('✅ Generation successful!\n');
  
  const code = result.generated_code.html || result.generated_code;
  
  // Verify it has the correct structure from scraped data
  const checks = [
    { test: code.includes('<figure class="ecl-blockquote">'), desc: 'Root element is <figure>' },
    { test: code.includes('ecl-blockquote__body'), desc: 'Body wrapper present' },
    { test: code.includes('<blockquote class="ecl-blockquote__quote">'), desc: 'Nested blockquote element' },
    { test: code.includes('ecl-blockquote__citation'), desc: 'Citation with correct class' },
    { test: code.includes('ecl-blockquote__attribution'), desc: 'Attribution footer' },
    { test: code.includes('ecl-blockquote__author'), desc: 'Author cite element' }
  ];
  
  console.log('Structure validation:');
  checks.forEach(check => {
    console.log(`  ${check.test ? '✅' : '❌'} ${check.desc}`);
  });
  
  console.log('\nGenerated HTML (first 500 chars):');
  console.log(code.substring(0, 500));
  
} else {
  console.log('❌ Generation failed:', result.error);
}

db.close();
