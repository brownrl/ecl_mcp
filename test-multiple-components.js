import Database from 'better-sqlite3';

const db = new Database('ecl-database.sqlite');

const testComponents = ['button', 'card', 'icon', 'tab', 'link', 'notification'];

testComponents.forEach(component => {
  const query = `
    SELECT 
      p.title,
      ce.id as example_id,
      LENGTH(ce.code) as code_length
    FROM code_examples ce
    JOIN pages p ON ce.page_id = p.id
    WHERE (
      LOWER(p.title) = LOWER(?)
      OR LOWER(p.title) = LOWER(? || 's')
      OR LOWER(p.title) = LOWER(RTRIM(?, 's'))
      OR LOWER(p.component_name) = LOWER(?)
    )
      AND ce.language = 'html'
    LIMIT 1
  `;
  
  const result = db.prepare(query).get(component, component, component, component);
  
  if (result) {
    console.log(`✅ ${component.padEnd(15)} → Found "${result.title}" (example ${result.example_id}, ${result.code_length} bytes)`);
  } else {
    console.log(`❌ ${component.padEnd(15)} → NOT FOUND`);
  }
});

db.close();
