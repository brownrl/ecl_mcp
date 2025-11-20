import Database from 'better-sqlite3';

const db = new Database('ecl-database.sqlite');

const component = 'blockquote';

const query = `
  SELECT 
    p.id as page_id,
    p.title,
    p.component_name,
    ce.id as example_id,
    ce.code,
    ce.language,
    ece.complexity
  FROM code_examples ce
  JOIN pages p ON ce.page_id = p.id
  LEFT JOIN enhanced_code_examples ece ON ce.id = ece.example_id
  WHERE (
    LOWER(p.title) = LOWER(?)
    OR LOWER(p.title) = LOWER(? || 's')
    OR LOWER(p.title) = LOWER(RTRIM(?, 's'))
    OR LOWER(p.component_name) = LOWER(?)
  )
    AND ce.language = 'html'
  ORDER BY 
    CASE 
      WHEN ece.complexity = 'simple' THEN 1
      WHEN ece.complexity = 'moderate' THEN 2
      ELSE 3
    END
  LIMIT 1
`;

console.log('Testing query with component:', component);
const result = db.prepare(query).get(component, component, component, component);

if (result) {
  console.log('\n✅ FOUND!');
  console.log('Page ID:', result.page_id);
  console.log('Page Title:', result.title);
  console.log('Component Name:', result.component_name);
  console.log('Example ID:', result.example_id);
  console.log('Complexity:', result.complexity || 'not rated');
  console.log('Code length:', result.code.length, 'bytes');
  console.log('\nFirst 200 chars of code:');
  console.log(result.code.substring(0, 200));
} else {
  console.log('❌ NOT FOUND');
}

db.close();
