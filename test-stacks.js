import { generateComponent } from './src/generator/index.js';
import Database from 'better-sqlite3';

const db = new Database('ecl-database.sqlite');

console.log('Testing different variations of "Stacks":\n');

const variations = ['Stacks', 'stacks', 'Stacks (Flex)', 'stack', 'flex'];

variations.forEach(name => {
  const result = generateComponent(db, name);
  console.log(`"${name}": ${result.success ? '✅ SUCCESS (' + (result.generated_code?.html || result.generated_code)?.length + ' bytes)' : '❌ ' + result.error}`);
});

db.close();
