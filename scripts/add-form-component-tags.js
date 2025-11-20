#!/usr/bin/env node

/**
 * Add comprehensive tags to form components for better discoverability
 * Addresses P0 Critical issue from testing report
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'ecl-database.sqlite');

console.log('Adding comprehensive tags to form components...');
console.log('Database:', DB_PATH);

const db = new Database(DB_PATH);

// Component tag mappings - comprehensive synonyms and variations
const COMPONENT_TAGS = {
    'Text field': {
        tags: [
            'input', 'text-input', 'textbox', 'text-box', 'input-field',
            'text field', 'form-field', 'input-box', 'email-input',
            'number-input', 'user-input', 'field'
        ],
        types: ['feature', 'use-case', 'category']
    },
    'Text area': {
        tags: [
            'textarea', 'text-area', 'multiline', 'multiline-input',
            'text area', 'comment-box', 'message-box', 'user-input', 'field'
        ],
        types: ['feature', 'use-case', 'category']
    },
    'Select': {
        tags: [
            'select', 'dropdown', 'select-box', 'select-menu',
            'dropdown-menu', 'select dropdown', 'combobox', 'picker',
            'chooser', 'user-input', 'field'
        ],
        types: ['feature', 'use-case', 'category']
    },
    'Checkbox': {
        tags: [
            'checkbox', 'check-box', 'toggle', 'multi-select',
            'selection', 'user-input', 'field'
        ],
        types: ['feature', 'use-case', 'category']
    },
    'Radio': {
        tags: [
            'radio', 'radio-button', 'radio button', 'option',
            'single-select', 'user-input', 'field'
        ],
        types: ['feature', 'use-case', 'category']
    },
    'File upload': {
        tags: [
            'file', 'upload', 'file-upload', 'attachment', 'file-input',
            'user-input', 'field'
        ],
        types: ['feature', 'use-case', 'category']
    },
    'Datepicker': {
        tags: [
            'date', 'datepicker', 'date-picker', 'calendar',
            'date-input', 'user-input', 'field'
        ],
        types: ['feature', 'use-case', 'category']
    }
};

// Message/alert/notification component tags
const MESSAGE_TAGS = {
    'Message': {
        tags: [
            'message', 'alert', 'notification', 'toast', 'feedback',
            'info', 'warning', 'error', 'success', 'banner message'
        ],
        types: ['feature', 'use-case', 'category']
    },
    'Notification': {
        tags: [
            'notification', 'alert', 'message', 'toast', 'feedback',
            'popup', 'notice'
        ],
        types: ['feature', 'use-case', 'category']
    }
};

// Tag/badge/label component tags
const TAG_TAGS = {
    'Tag': {
        tags: [
            'tag', 'badge', 'label', 'chip', 'token', 'pill',
            'category-tag', 'status-tag'
        ],
        types: ['feature', 'use-case', 'category']
    },
    'Label': {
        tags: [
            'label', 'tag', 'badge', 'marker', 'indicator'
        ],
        types: ['feature', 'use-case', 'category']
    }
};

// Combine all tag mappings
const ALL_TAGS = { ...COMPONENT_TAGS, ...MESSAGE_TAGS, ...TAG_TAGS };

// Function to add tags to a component
function addTagsToComponent(componentName, tags, defaultType = 'feature') {
    // Find the component in the database
    const component = db.prepare(`
    SELECT p.id, p.title, cm.component_name
    FROM pages p
    JOIN component_metadata cm ON p.id = cm.page_id
    WHERE cm.component_name = ? OR p.title = ?
    LIMIT 1
  `).get(componentName, componentName);

    if (!component) {
        console.log(`⚠️  Component "${componentName}" not found in database`);
        return 0;
    }

    console.log(`\n📝 Adding tags to: ${component.title} (ID: ${component.id})`);

    let addedCount = 0;
    const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO component_tags (page_id, tag, tag_type)
    VALUES (?, ?, ?)
  `);

    tags.forEach(tag => {
        const result = insertStmt.run(component.id, tag, defaultType);
        if (result.changes > 0) {
            console.log(`  ✓ Added tag: "${tag}"`);
            addedCount++;
        }
    });

    return addedCount;
}

// Main execution
try {
    db.prepare('BEGIN TRANSACTION').run();

    let totalAdded = 0;

    Object.entries(ALL_TAGS).forEach(([componentName, config]) => {
        const added = addTagsToComponent(componentName, config.tags, config.types[0]);
        totalAdded += added;
    });

    db.prepare('COMMIT').run();

    console.log(`\n✅ Successfully added ${totalAdded} tags to form components!`);
    console.log('\nComponents with improved discoverability:');
    Object.keys(ALL_TAGS).forEach(name => console.log(`  - ${name}`));

} catch (error) {
    console.error('❌ Error adding tags:', error);
    db.prepare('ROLLBACK').run();
    process.exit(1);
} finally {
    db.close();
}
