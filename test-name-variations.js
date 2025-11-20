import Database from 'better-sqlite3';

const db = new Database('ecl-database.sqlite');

const component = 'stacks';
const componentStr = String(component).toLowerCase();
const componentVariations = [
  componentStr,
  componentStr + 's',
  componentStr.replace(/s$/, ''),
  componentStr.replace(/\s+/g, ''),
  componentStr.replace(/\s+/g, '-'),
  componentStr.replace(/\([^)]*\)/g, '').trim(),
];

console.log('Testing variations for "stacks":');
console.log('Variations:', componentVariations);

const query = `
  SELECT DISTINCT p.title, p.component_name
  FROM pages p
  LEFT JOIN code_examples ce ON p.id = ce.page_id
  WHERE (
    LOWER(p.title) IN (${componentVariations.map(() => '?').join(', ')})
    OR LOWER(p.component_name) IN (${componentVariations.map(() => '?').join(', ')})
  )
`;

const params = [
  ...componentVariations.map(v => v.toLowerCase()),
  ...componentVariations.map(v => v.toLowerCase())
];

const results = db.prepare(query).all(...params);
console.log('\nResults:', results);

// Also try searching for the page directly
console.log('\n\nDirect search for "Stacks (Flex)":');
const direct = db.prepare(`
  SELECT p.id, p.title, p.component_name, COUNT(ce.id) as examples
  FROM pages p
  LEFT JOIN code_examples ce ON p.id = ce.page_id
  WHERE LOWER(p.title) LIKE '%stack%'
  GROUP BY p.id
`).all();
console.log(direct);

db.close();
