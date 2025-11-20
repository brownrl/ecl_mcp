#!/usr/bin/env node

/**
 * ECL Crawler - Scrapes EC variant of Europa Component Library
 * 
 * Usage: node scripts/crawl-ecl.js
 * 
 * Features:
 * - Crawls https://ec.europa.eu/component-library/ec/
 * - Saves raw HTML and structured data to SQLite
 * - Resumes from interruption (tracks visited URLs)
 * - 2-second delay between requests
 * - Logs progress to logs/crawl.log
 */

import https from 'https';
import { URL } from 'url';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Configuration
const BASE_URL = 'https://ec.europa.eu/component-library/ec/';
const DB_PATH = path.join(projectRoot, 'ecl-database.sqlite');
const LOG_PATH = path.join(projectRoot, 'logs', 'crawl.log');
const DELAY_MS = 2000;

// Initialize database
let db;

function initDatabase() {
  db = new Database(DB_PATH);

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS crawl_urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      crawled_at TEXT,
      status TEXT DEFAULT 'pending',
      error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      title TEXT,
      raw_html TEXT,
      category TEXT,
      component_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS content_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      section_type TEXT,
      heading TEXT,
      content TEXT,
      code_example TEXT,
      position INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id)
    );

    CREATE TABLE IF NOT EXISTS components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT,
      description TEXT,
      url TEXT,
      usage_guidelines TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS code_examples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      component_id INTEGER,
      page_id INTEGER,
      example_type TEXT,
      language TEXT,
      code TEXT,
      description TEXT,
      position INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (component_id) REFERENCES components(id),
      FOREIGN KEY (page_id) REFERENCES pages(id)
    );

    CREATE INDEX IF NOT EXISTS idx_crawl_urls_status ON crawl_urls(status);
    CREATE INDEX IF NOT EXISTS idx_pages_category ON pages(category);
    CREATE INDEX IF NOT EXISTS idx_pages_component ON pages(component_name);
    CREATE INDEX IF NOT EXISTS idx_content_sections_page ON content_sections(page_id);
    CREATE INDEX IF NOT EXISTS idx_code_examples_component ON code_examples(component_id);
    CREATE INDEX IF NOT EXISTS idx_code_examples_page ON code_examples(page_id);

    -- Full-text search virtual table
    CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
      url,
      title,
      category,
      component_name,
      content,
      content=pages,
      content_rowid=id
    );

    -- Triggers to keep FTS in sync
    CREATE TRIGGER IF NOT EXISTS pages_fts_insert AFTER INSERT ON pages BEGIN
      INSERT INTO pages_fts(rowid, url, title, category, component_name, content)
      VALUES (new.id, new.url, new.title, new.category, new.component_name, new.raw_html);
    END;

    CREATE TRIGGER IF NOT EXISTS pages_fts_update AFTER UPDATE ON pages BEGIN
      UPDATE pages_fts SET 
        url = new.url,
        title = new.title,
        category = new.category,
        component_name = new.component_name,
        content = new.raw_html
      WHERE rowid = new.id;
    END;

    CREATE TRIGGER IF NOT EXISTS pages_fts_delete AFTER DELETE ON pages BEGIN
      DELETE FROM pages_fts WHERE rowid = old.id;
    END;
  `);

  log('Database initialized');
}

// Logging
async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  await fs.appendFile(LOG_PATH, logMessage);
}

// Fetch URL with proper error handling and redirect following
function fetchUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error('Too many redirects'));
      return;
    }

    https.get(url, { timeout: 30000 }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).href;
        return fetchUrl(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
      }

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', reject).on('timeout', () => {
      reject(new Error('Request timeout'));
    });
  });
}

// Extract links from HTML
function extractLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = new Set();

  $('a[href]').each((i, elem) => {
    const href = $(elem).attr('href');
    if (!href) return;

    try {
      const absoluteUrl = new URL(href, baseUrl).href;

      // Only include EC component library links
      if (absoluteUrl.startsWith(BASE_URL)) {
        // Normalize URL (remove fragments, trailing slashes)
        const normalized = absoluteUrl.split('#')[0].replace(/\/$/, '');
        links.add(normalized);
      }
    } catch (e) {
      // Invalid URL, skip
    }
  });

  return Array.from(links);
}

// Parse page structure
function parsePage(html, url) {
  const $ = cheerio.load(html);

  // Extract basic page info
  const title = $('h1').first().text().trim() || $('title').text().trim();

  // Try to determine category and component name from URL
  const urlParts = url.replace(BASE_URL, '').split('/').filter(p => p);
  let category = null;
  let componentName = null;

  if (urlParts.length > 0) {
    category = urlParts[0]; // e.g., "components", "guidelines", etc.
    if (urlParts.length > 1) {
      componentName = urlParts[1]; // e.g., "button", "accordion"
    }
  }

  // Extract all sections with headings
  const sections = [];
  let sectionIndex = 0;

  $('h2, h3, h4').each((i, elem) => {
    const $heading = $(elem);
    const heading = $heading.text().trim();
    const sectionType = elem.name; // h2, h3, h4

    // Get content until next heading
    let content = '';
    let codeExample = '';

    $heading.nextUntil('h2, h3, h4').each((j, nextElem) => {
      const $elem = $(nextElem);

      if ($elem.is('pre, code')) {
        codeExample += $elem.text() + '\n\n';
      } else {
        content += $elem.text().trim() + '\n';
      }
    });

    sections.push({
      sectionType,
      heading,
      content: content.trim(),
      codeExample: codeExample.trim(),
      position: sectionIndex++
    });
  });

  // Extract all code blocks from main content only (exclude navigation, header, footer)
  const codeBlocks = [];

  // Try to find main content container
  const $mainContent = $('main, [role="main"], #main-content, .main-content, article').first();
  const $codeContext = $mainContent.length > 0 ? $mainContent : $('body');

  $codeContext.find('pre code, pre, code.code-block').each((i, elem) => {
    const $elem = $(elem);

    // Skip if inside navigation, header, footer, or sidebar
    if ($elem.closest('nav, header, footer, aside, [role="navigation"]').length > 0) {
      return;
    }

    const code = $elem.text().trim();
    if (code.length > 10) { // Ignore very short snippets
      const language = $elem.attr('class')?.match(/language-(\w+)/)?.[1] ||
        (code.includes('<!DOCTYPE') || code.includes('<html') ? 'html' : 'unknown');

      codeBlocks.push({
        code,
        language,
        position: i
      });
    }
  });

  return {
    title,
    category,
    componentName,
    sections,
    codeBlocks
  };
}

// Save page to database
function savePage(url, html, parsedData) {
  const insertPage = db.prepare(`
    INSERT OR REPLACE INTO pages (url, title, raw_html, category, component_name, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const result = insertPage.run(
    url,
    parsedData.title,
    html,
    parsedData.category,
    parsedData.componentName
  );

  const pageId = result.lastInsertRowid;

  // Save sections
  const insertSection = db.prepare(`
    INSERT INTO content_sections (page_id, section_type, heading, content, code_example, position)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const section of parsedData.sections) {
    insertSection.run(
      pageId,
      section.sectionType,
      section.heading,
      section.content,
      section.codeExample,
      section.position
    );
  }

  // Save code examples
  const insertCode = db.prepare(`
    INSERT INTO code_examples (page_id, example_type, language, code, position)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const codeBlock of parsedData.codeBlocks) {
    insertCode.run(
      pageId,
      'code_block',
      codeBlock.language,
      codeBlock.code,
      codeBlock.position
    );
  }

  return pageId;
}

// Mark URL as crawled
function markUrlCrawled(url, status, error = null) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO crawl_urls (url, crawled_at, status, error)
    VALUES (?, CURRENT_TIMESTAMP, ?, ?)
  `);
  stmt.run(url, status, error);
}

// Check if URL was already crawled
function isUrlCrawled(url) {
  const stmt = db.prepare(`
    SELECT status FROM crawl_urls WHERE url = ? AND status = 'completed'
  `);
  return stmt.get(url) !== undefined;
}

// Add URL to queue if not seen
function queueUrl(url) {
  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO crawl_urls (url, status)
      VALUES (?, 'pending')
    `);
    stmt.run(url);
  } catch (e) {
    // URL already exists, ignore
  }
}

// Get pending URLs
function getPendingUrls(limit = 100) {
  const stmt = db.prepare(`
    SELECT url FROM crawl_urls WHERE status = 'pending' LIMIT ?
  `);
  return stmt.all(limit).map(row => row.url);
}

// Crawl a single page
async function crawlPage(url) {
  if (isUrlCrawled(url)) {
    log(`⏭️  Skipping already crawled: ${url}`);
    return [];
  }

  try {
    log(`🔍 Crawling: ${url}`);

    const response = await fetchUrl(url);

    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode}`);
    }

    // Parse and save
    const parsedData = parsePage(response.body, url);
    savePage(url, response.body, parsedData);

    // Extract links for further crawling
    const links = extractLinks(response.body, url);

    // Mark as completed
    markUrlCrawled(url, 'completed');

    log(`✅ Completed: ${url} (found ${links.length} links, ${parsedData.codeBlocks.length} code examples)`);

    return links;

  } catch (error) {
    log(`❌ Error crawling ${url}: ${error.message}`);
    markUrlCrawled(url, 'error', error.message);
    return [];
  }
}

// Main crawler
async function crawl() {
  await log('=== ECL Crawler Started ===');
  await log(`Base URL: ${BASE_URL}`);
  await log(`Database: ${DB_PATH}`);
  await log(`Delay: ${DELAY_MS}ms between requests`);

  initDatabase();

  // Start with base URL
  queueUrl(BASE_URL);

  let totalCrawled = 0;
  let totalErrors = 0;

  while (true) {
    const pendingUrls = getPendingUrls(10); // Process in batches

    if (pendingUrls.length === 0) {
      break; // No more URLs to crawl
    }

    for (const url of pendingUrls) {
      const newLinks = await crawlPage(url);
      totalCrawled++;

      // Queue new links
      for (const link of newLinks) {
        queueUrl(link);
      }

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }

    // Progress update
    const pending = getPendingUrls(1).length > 0;
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM crawl_urls
    `).get();

    await log(`📊 Progress: ${stats.completed} completed, ${stats.errors} errors, ${stats.pending} pending`);
  }

  // Final statistics
  const finalStats = db.prepare(`
    SELECT 
      COUNT(*) as total_urls,
      (SELECT COUNT(*) FROM pages) as total_pages,
      (SELECT COUNT(*) FROM content_sections) as total_sections,
      (SELECT COUNT(*) FROM code_examples) as total_code_examples
    FROM crawl_urls
  `).get();

  await log('=== Crawl Completed ===');
  await log(`Total URLs processed: ${finalStats.total_urls}`);
  await log(`Pages saved: ${finalStats.total_pages}`);
  await log(`Content sections: ${finalStats.total_sections}`);
  await log(`Code examples: ${finalStats.total_code_examples}`);
  await log(`Database size: ${(await fs.stat(DB_PATH)).size / 1024 / 1024} MB`);

  db.close();
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await log('⚠️  Crawler interrupted by user. Progress saved. Run again to resume.');
  if (db) db.close();
  process.exit(0);
});

process.on('unhandledRejection', async (error) => {
  await log(`💥 Unhandled error: ${error.message}`);
  if (db) db.close();
  process.exit(1);
});

// Start crawling
crawl().catch(async (error) => {
  await log(`💥 Fatal error: ${error.message}`);
  console.error(error);
  if (db) db.close();
  process.exit(1);
});
