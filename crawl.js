const https = require('https');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { promisify } = require('util');

// Open database
const db = new sqlite3.Database('./ecl-database.sqlite');
const dbGet = promisify(db.get.bind(db));
const dbRun = promisify(db.run.bind(db));

// Wrapper for INSERT that returns lastID
function dbInsert(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

// Read pages to crawl with categories
function parsePagesToCrawl() {
  const lines = fs.readFileSync('./pages-to-crawl.txt', 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line);

  const pages = [];
  let currentCategory = null;

  for (const line of lines) {
    if (line.startsWith('http')) {
      pages.push({ url: line, category: currentCategory });
    } else {
      currentCategory = line;
    }
  }

  return pages;
}

const pagesToCrawl = parsePagesToCrawl();
console.log(`Found ${pagesToCrawl.length} URLs to crawl`);

// Fetch HTML from URL
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Extract title from HTML
function extractTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/i);
  if (!match) return '';

  const fullTitle = match[1].trim();
  // Split on " - " and take the first part
  const parts = fullTitle.split(' - ');
  return parts[0].trim();
}

// Strip HTML tags and decode entities to get plain text
function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove styles
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')       // Remove navigation
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '') // Remove headers
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // Remove footers
    .replace(/<[^>]+>/g, ' ')                          // Remove all tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')                              // Normalize whitespace
    .trim();
}

// Extract code examples from HTML
function extractCodeExamples(html) {
  const examples = [];
  const preRegex = /<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi;
  let match;
  let index = 0;

  while ((match = preRegex.exec(html)) !== null) {
    let code = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Strip syntax highlighting spans (e.g., <span class="token tag">)
    code = code.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '');

    // Normalize whitespace: collapse all line breaks and multiple spaces into single spaces
    code = code.replace(/\s+/g, ' ');

    // List of inline elements that shouldn't cause line breaks
    const inlineTags = ['span', 'a', 'strong', 'em', 'b', 'i', 'code', 'small', 'svg', 'use', 'path'];
    
    // List of inline container elements that should keep their content on one line
    const inlineContainers = ['label', 'legend', 'button'];

    // Add line breaks only after block-level closing tags (but NOT after inline containers)
    const blockPattern = new RegExp(`</((?!(?:${inlineTags.join('|')}|${inlineContainers.join('|')})[>\\s])[^>]+)>`, 'g');
    code = code.replace(blockPattern, '</$1>\n');

    // Add line breaks before block-level opening tags (but not if preceded by opening tag or inside inline containers)
    const blockOpenPattern = new RegExp(`([^>])\\s*<((?!(?:${inlineTags.join('|')}|${inlineContainers.join('|')}|/)[>\\s])[a-z][^>]*)>`, 'gi');
    code = code.replace(blockOpenPattern, '$1\n<$2>');

    // Clean up multiple newlines
    code = code.replace(/\n{2,}/g, '\n');

    // Basic indentation
    const lines = code.split('\n');
    let indent = 0;
    const formatted = lines.map(line => {
      line = line.trim();
      if (!line) return '';

      // Check if this is a closing tag
      if (line.match(/^<\/[^>]+>/)) {
        indent = Math.max(0, indent - 1);
      }

      const indented = '  '.repeat(indent) + line;

      // Check if this line opens a tag that should increase indent
      // Must start with <tag, not be self-closing, and not have closing tag on same line
      if (line.match(/^<[a-z]/i) && !line.match(/\/>$/) && !line.match(/<\/[^>]+>$/)) {
        indent++;
      }

      return indented;
    }).filter(line => line);

    code = formatted.join('\n');

    // Try to find a heading before this code block
    const beforeCode = html.substring(0, match.index);
    const headingMatch = beforeCode.match(/<h[2-6][^>]*>([^<]+)<\/h[2-6]>(?:(?!<h[2-6]).)*$/is);
    const label = headingMatch ? headingMatch[1].trim() : null;

    examples.push({
      code: code.trim(),
      label,
      position: index++
    });
  }

  return examples;
}

// Extract hierarchy from URL
function extractHierarchy(url) {
  const prefix = 'https://ec.europa.eu/component-library/ec/';
  if (!url.startsWith(prefix)) {
    return [null, null, null, null];
  }

  const path = url.substring(prefix.length);
  const parts = path.split('/').filter(p => p);

  return [
    parts[0] || null,
    parts[1] || null,
    parts[2] || null,
    parts[3] || null
  ];
}

// Main crawl function
async function crawl() {
  let crawled = 0;
  let updated = 0;
  let rebuilt = 0;

  // Clear existing examples (they will be re-added)
  console.log('🗑️  Clearing existing examples...');
  await dbRun('DELETE FROM examples');

  for (const page of pagesToCrawl) {
    try {
      const [h1, h2, h3, h4] = extractHierarchy(page.url);

      // Check if already exists
      const existing = await dbGet('SELECT id, html, title FROM pages WHERE url = ?', [page.url]);

      if (existing) {
        // Update metadata, rebuild content, and rebuild examples from stored HTML
        console.log(`🔄 Rebuilding: ${existing.title}`);
        const content = stripHtml(existing.html);
        
        await dbRun(
          'UPDATE pages SET category = ?, hierarchy_1 = ?, hierarchy_2 = ?, hierarchy_3 = ?, hierarchy_4 = ?, content = ? WHERE id = ?',
          [page.category, h1, h2, h3, h4, content, existing.id]
        );
        
        // Update FTS with lowercased content
        await dbRun(
          'UPDATE pages_fts SET content = LOWER(?) WHERE rowid = ?',
          [content, existing.id]
        );
        
        // Extract and save code examples from stored HTML
        const examples = extractCodeExamples(existing.html);
        for (const example of examples) {
          await dbRun(
            'INSERT INTO examples (page_id, code, label, position) VALUES (?, ?, ?, ?)',
            [existing.id, example.code, example.label, example.position]
          );
        }
        
        rebuilt++;
        console.log(`  ✅ Rebuilt ${examples.length} examples`);
        continue;
      }

      // Fetch new page
      console.log(`📥 Fetching [${page.category}]: ${page.url}`);
      const html = await fetchPage(page.url);
      const title = extractTitle(html);
      const content = stripHtml(html);

      // Save to database
      const pageId = await dbInsert(
        'INSERT INTO pages (url, title, html, content, category, hierarchy_1, hierarchy_2, hierarchy_3, hierarchy_4) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [page.url, title, html, content, page.category, h1, h2, h3, h4]
      );

      // Update FTS with lowercased content for case-insensitive search
      await dbRun(
        'INSERT INTO pages_fts(rowid, title, content) VALUES (?, LOWER(?), LOWER(?))',
        [pageId, title, content]
      );

      // Extract and save code examples
      const examples = extractCodeExamples(html);
      for (const example of examples) {
        await dbRun(
          'INSERT INTO examples (page_id, code, label, position) VALUES (?, ?, ?, ?)',
          [pageId, example.code, example.label, example.position]
        );
      }

      console.log(`✅ Saved: ${title || page.url} (${examples.length} examples)`);
      crawled++;

      // Be nice to the server
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Error crawling ${page.url}:`, error.message);
    }
  }

  console.log(`\n✨ Done! Crawled: ${crawled}, Rebuilt: ${rebuilt}, Updated: ${updated}`);
  db.close();
}

crawl();
