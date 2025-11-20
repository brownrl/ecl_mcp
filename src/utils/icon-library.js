/**
 * ECL Icon Information Tool
 * 
 * Provides comprehensive information about ECL icons including
 * IDs, CDN paths, categories, and usage examples.
 */

/**
 * ECL Icon Library
 * Based on ECL 4.11.0 icon set
 */
const ECL_ICONS = {
    // UI Icons
    ui: [
        { id: 'corner-arrow', name: 'Corner Arrow', description: 'Navigation arrow, commonly rotated for different directions', keywords: ['arrow', 'chevron', 'navigate', 'direction'] },
        { id: 'close', name: 'Close', description: 'Close button, dismiss action', keywords: ['close', 'dismiss', 'cancel', 'x', 'exit'] },
        { id: 'more', name: 'More', description: 'More options menu', keywords: ['more', 'options', 'menu', 'dots', 'ellipsis'] },
        { id: 'check', name: 'Check', description: 'Confirmation, success state', keywords: ['check', 'checkmark', 'tick', 'confirm', 'success', 'done'] },
        { id: 'error', name: 'Error', description: 'Error indicator', keywords: ['error', 'warning', 'alert', 'x', 'cross'] },
        { id: 'warning', name: 'Warning', description: 'Warning indicator', keywords: ['warning', 'alert', 'caution', 'attention'] },
        { id: 'info', name: 'Info', description: 'Information indicator', keywords: ['info', 'information', 'help', 'question'] },
        { id: 'success', name: 'Success', description: 'Success indicator', keywords: ['success', 'check', 'done', 'complete'] },
        { id: 'external-link', name: 'External Link', description: 'Link opens in new window', keywords: ['external', 'link', 'new-window', 'open'] },
        { id: 'print', name: 'Print', description: 'Print action', keywords: ['print', 'printer', 'output'] },
        { id: 'edit', name: 'Edit', description: 'Edit action', keywords: ['edit', 'pencil', 'modify', 'change'] },
        { id: 'delete', name: 'Delete', description: 'Delete action', keywords: ['delete', 'remove', 'trash', 'bin'] },
        { id: 'copy', name: 'Copy', description: 'Copy to clipboard', keywords: ['copy', 'duplicate', 'clipboard'] },
        { id: 'share', name: 'Share', description: 'Share action', keywords: ['share', 'send', 'forward'] },
        { id: 'fullscreen', name: 'Fullscreen', description: 'Expand to fullscreen', keywords: ['fullscreen', 'expand', 'maximize'] },
        { id: 'plus', name: 'Plus', description: 'Add, expand, or positive action', keywords: ['plus', 'add', 'expand', 'increase', 'more', 'create', 'new'] },
        { id: 'minus', name: 'Minus', description: 'Remove, collapse, or negative action', keywords: ['minus', 'remove', 'collapse', 'decrease', 'less', 'subtract'] },
        { id: 'chevron-up', name: 'Chevron Up', description: 'Upward arrow or collapse indicator', keywords: ['chevron', 'arrow', 'up', 'collapse'] },
        { id: 'chevron-down', name: 'Chevron Down', description: 'Downward arrow or expand indicator', keywords: ['chevron', 'arrow', 'down', 'expand'] },
        { id: 'chevron-left', name: 'Chevron Left', description: 'Left arrow or back navigation', keywords: ['chevron', 'arrow', 'left', 'back', 'previous'] },
        { id: 'chevron-right', name: 'Chevron Right', description: 'Right arrow or forward navigation', keywords: ['chevron', 'arrow', 'right', 'forward', 'next'] }
    ],

    // General Icons
    general: [
        { id: 'search', name: 'Search', description: 'Search functionality' },
        { id: 'download', name: 'Download', description: 'Download file' },
        { id: 'upload', name: 'Upload', description: 'Upload file' },
        { id: 'calendar', name: 'Calendar', description: 'Date picker, calendar events' },
        { id: 'email', name: 'Email', description: 'Email address, contact' },
        { id: 'phone', name: 'Phone', description: 'Phone number, call' },
        { id: 'location', name: 'Location', description: 'Geographic location, address' },
        { id: 'home', name: 'Home', description: 'Home page, main navigation' },
        { id: 'menu', name: 'Menu', description: 'Navigation menu' },
        { id: 'user', name: 'User', description: 'User account, profile' },
        { id: 'settings', name: 'Settings', description: 'Settings, preferences' },
        { id: 'help', name: 'Help', description: 'Help, support' },
        { id: 'star', name: 'Star', description: 'Favorite, rating' },
        { id: 'tag', name: 'Tag', description: 'Tag, label, category' },
        { id: 'filter', name: 'Filter', description: 'Filter options' },
        { id: 'sort', name: 'Sort', description: 'Sort functionality' },
        { id: 'video', name: 'Video', description: 'Video content' },
        { id: 'image', name: 'Image', description: 'Image content' },
        { id: 'document', name: 'Document', description: 'Document file' },
        { id: 'folder', name: 'Folder', description: 'Folder, directory' },
        { id: 'link', name: 'Link', description: 'Hyperlink' }
    ],

    // File Type Icons
    files: [
        { id: 'file-pdf', name: 'PDF File', description: 'PDF document' },
        { id: 'file-word', name: 'Word File', description: 'Microsoft Word document' },
        { id: 'file-excel', name: 'Excel File', description: 'Microsoft Excel spreadsheet' },
        { id: 'file-powerpoint', name: 'PowerPoint File', description: 'Microsoft PowerPoint presentation' },
        { id: 'file-zip', name: 'ZIP File', description: 'Compressed archive' },
        { id: 'file-video', name: 'Video File', description: 'Video file' },
        { id: 'file-audio', name: 'Audio File', description: 'Audio file' },
        { id: 'file-image', name: 'Image File', description: 'Image file' }
    ],

    // Social Media Icons
    social: [
        { id: 'facebook', name: 'Facebook', description: 'Facebook social media' },
        { id: 'twitter', name: 'Twitter/X', description: 'Twitter/X social media' },
        { id: 'linkedin', name: 'LinkedIn', description: 'LinkedIn social media' },
        { id: 'youtube', name: 'YouTube', description: 'YouTube video platform' },
        { id: 'instagram', name: 'Instagram', description: 'Instagram social media' },
        { id: 'rss', name: 'RSS', description: 'RSS feed' }
    ]
};

/**
 * Get all ECL icons
 */
export function getAllIcons() {
    const startTime = Date.now();

    const allIcons = [];
    for (const [category, icons] of Object.entries(ECL_ICONS)) {
        for (const icon of icons) {
            allIcons.push({
                ...icon,
                category,
                cdn_path_ec: `https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.0/dist/images/icons/sprites/icons.svg#${category}--${icon.id}`,
                cdn_path_eu: `https://cdn.jsdelivr.net/npm/@ecl/preset-eu@4.11.0/dist/images/icons/sprites/icons.svg#${category}--${icon.id}`,
                usage_pattern: `<svg class="ecl-icon ecl-icon--xs" focusable="false" aria-hidden="true">
  <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.0/dist/images/icons/sprites/icons.svg#${category}--${icon.id}"></use>
</svg>`
            });
        }
    }

    return {
        success: true,
        data: {
            icons: allIcons,
            total: allIcons.length,
            categories: Object.keys(ECL_ICONS),
            sizes: ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl'],
            rotation_classes: ['ecl-icon--rotate-90', 'ecl-icon--rotate-180', 'ecl-icon--rotate-270'],
            flip_classes: ['ecl-icon--flip-horizontal', 'ecl-icon--flip-vertical']
        },
        metadata: {
            tool: 'ecl_get_icon_library',
            execution_time_ms: Date.now() - startTime,
            source: 'ecl-static-data',
            version: '2.0',
            ecl_version: '4.11.0'
        }
    };
}

/**
 * Search icons by query
 */
export function searchIcons(query, options = {}) {
    const startTime = Date.now();
    const { category = null, limit = 20 } = options;

    const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    const results = [];
    const scored = [];

    for (const [cat, icons] of Object.entries(ECL_ICONS)) {
        if (category && cat !== category) {
            continue;
        }

        for (const icon of icons) {
            let score = 0;
            let matchedTerms = 0;

            // Check each search term
            searchTerms.forEach(term => {
                const inId = icon.id.toLowerCase().includes(term);
                const inName = icon.name.toLowerCase().includes(term);
                const inDesc = icon.description.toLowerCase().includes(term);
                const inKeywords = icon.keywords?.some(k => k.toLowerCase().includes(term)) || false;

                if (inId) {
                    score += 100; // Highest priority: ID match
                    matchedTerms++;
                } else if (inName) {
                    score += 80; // High priority: Name match
                    matchedTerms++;
                } else if (inKeywords) {
                    score += 50; // Medium priority: Keyword match
                    matchedTerms++;
                } else if (inDesc) {
                    score += 20; // Low priority: Description match
                    matchedTerms++;
                }
            });

            // Only include if at least one term matched (support multi-keyword)
            // OR if it's a single term search and it matches
            const shouldInclude = matchedTerms > 0;

            if (shouldInclude) {
                scored.push({
                    icon: {
                        ...icon,
                        category: cat,
                        cdn_path_ec: `https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.0/dist/images/icons/sprites/icons.svg#${cat}--${icon.id}`,
                        cdn_path_eu: `https://cdn.jsdelivr.net/npm/@ecl/preset-eu@4.11.0/dist/images/icons/sprites/icons.svg#${cat}--${icon.id}`,
                        usage_example: generateIconUsageExample(cat, icon.id)
                    },
                    score,
                    matchedTerms
                });
            }
        }
    }

    // Sort by score (descending), then by matched terms (descending)
    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.matchedTerms - a.matchedTerms;
    });

    // Apply limit and extract icons
    const limitedResults = scored.slice(0, limit).map(s => s.icon);

    return {
        success: true,
        data: {
            results: limitedResults,
            count: limitedResults.length,
            query: query,
            search_terms: searchTerms,
            category_filter: category
        },
        metadata: {
            tool: 'ecl_search_icons',
            execution_time_ms: Date.now() - startTime,
            source: 'ecl-static-data',
            version: '2.1'
        }
    };
}

/**
 * Get icon by ID
 */
export function getIconById(iconId, options = {}) {
    const startTime = Date.now();
    const { preset = 'ec', size = 'xs' } = options;

    // Search for icon in all categories
    for (const [category, icons] of Object.entries(ECL_ICONS)) {
        const icon = icons.find(i => i.id === iconId);

        if (icon) {
            const presetName = preset === 'eu' ? 'preset-eu' : 'preset-ec';
            const cdnPath = `https://cdn.jsdelivr.net/npm/@ecl/${presetName}@4.11.0/dist/images/icons/sprites/icons.svg#${category}--${iconId}`;

            return {
                success: true,
                data: {
                    ...icon,
                    category,
                    cdn_path: cdnPath,
                    usage_examples: {
                        standalone: generateStandaloneIconExample(category, iconId, size),
                        button_before: generateButtonIconExample(category, iconId, 'before'),
                        button_after: generateButtonIconExample(category, iconId, 'after'),
                        button_only: generateIconOnlyButtonExample(category, iconId)
                    },
                    accessibility_notes: [
                        'Always include focusable="false" on SVG elements',
                        'Use aria-hidden="true" for decorative icons',
                        'For icon-only buttons, add aria-label to the button element',
                        'Include visually-hidden text for screen readers when needed'
                    ],
                    size_classes: ['ecl-icon--xs', 'ecl-icon--s', 'ecl-icon--m', 'ecl-icon--l'],
                    rotation_options: generateRotationExamples(category, iconId),
                    cors_warning: 'Icon sprites must be hosted on the same domain or use CORS-enabled CDN'
                },
                metadata: {
                    tool: 'ecl_get_icon_by_id',
                    execution_time_ms: Date.now() - startTime,
                    source: 'ecl-static-data',
                    version: '2.0'
                }
            };
        }
    }

    return {
        success: false,
        data: { icon: null },
        errors: [{
            code: 'ICON_NOT_FOUND',
            message: `Icon "${iconId}" not found in ECL icon library`
        }],
        metadata: {
            tool: 'ecl_get_icon_by_id',
            execution_time_ms: Date.now() - startTime
        }
    };
}

/**
 * Generate usage examples
 */
function generateIconUsageExample(category, iconId) {
    return `<!-- Standalone icon -->
<svg class="ecl-icon ecl-icon--xs" focusable="false" aria-hidden="true">
  <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.0/dist/images/icons/sprites/icons.svg#${category}--${iconId}"></use>
</svg>`;
}

function generateStandaloneIconExample(category, iconId, size) {
    return `<svg class="ecl-icon ecl-icon--${size}" focusable="false" aria-hidden="true">
  <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.0/dist/images/icons/sprites/icons.svg#${category}--${iconId}"></use>
</svg>`;
}

function generateButtonIconExample(category, iconId, position) {
    const iconClass = position === 'before' ? 'ecl-button__icon--before' : 'ecl-button__icon--after';

    return position === 'before'
        ? `<button class="ecl-button ecl-button--primary" type="button">
  <span class="ecl-button__container">
    <svg class="ecl-icon ecl-icon--xs ecl-button__icon ${iconClass}" focusable="false" aria-hidden="true">
      <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.0/dist/images/icons/sprites/icons.svg#${category}--${iconId}"></use>
    </svg>
    <span class="ecl-button__label" data-ecl-label>Button text</span>
  </span>
</button>`
        : `<button class="ecl-button ecl-button--primary" type="button">
  <span class="ecl-button__container">
    <span class="ecl-button__label" data-ecl-label>Button text</span>
    <svg class="ecl-icon ecl-icon--xs ecl-button__icon ${iconClass}" focusable="false" aria-hidden="true">
      <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.0/dist/images/icons/sprites/icons.svg#${category}--${iconId}"></use>
    </svg>
  </span>
</button>`;
}

function generateIconOnlyButtonExample(category, iconId) {
    return `<button class="ecl-button ecl-button--primary ecl-button--icon-only" type="button" aria-label="Descriptive label">
  <span class="ecl-button__container">
    <span class="ecl-button__label" data-ecl-label="true">Label</span>
    <svg class="ecl-icon ecl-icon--xs ecl-button__icon" focusable="false" aria-hidden="true">
      <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.0/dist/images/icons/sprites/icons.svg#${category}--${iconId}"></use>
    </svg>
  </span>
</button>`;
}

function generateRotationExamples(category, iconId) {
    return {
        rotate_90: `<svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-90" focusable="false" aria-hidden="true">
  <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.0/dist/images/icons/sprites/icons.svg#${category}--${iconId}"></use>
</svg>`,
        rotate_180: `<svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-180" focusable="false" aria-hidden="true">
  <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.0/dist/images/icons/sprites/icons.svg#${category}--${iconId}"></use>
</svg>`,
        rotate_270: `<svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-270" focusable="false" aria-hidden="true">
  <use xlink:href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.0/dist/images/icons/sprites/icons.svg#${category}--${iconId}"></use>
</svg>`
    };
}
