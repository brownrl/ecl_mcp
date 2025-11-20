/**
 * Database Helper
 * 
 * Provides database connection management for search modules
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get database connection
 * @param {boolean} readonly - Open in readonly mode (default: true)
 * @returns {Database} SQLite database instance
 */
export function getDatabase(readonly = true) {
  const dbPath = path.join(__dirname, '..', 'ecl-database.sqlite');
  return new Database(dbPath, { readonly });
}

/**
 * Close database connection
 * @param {Database} db - Database instance to close
 */
export function closeDatabase(db) {
  if (db && db.open) {
    db.close();
  }
}
