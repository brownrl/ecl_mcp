/**
 * ECL Typography Guide
 * 
 * Comprehensive typography documentation including utility classes,
 * font families, sizes, weights, and troubleshooting.
 */

/**
 * ECL Typography System
 */
const TYPOGRAPHY_SYSTEM = {
    font_families: {
        primary: {
            name: 'Arial',
            fallback: 'sans-serif',
            usage: 'Primary font for all body text and UI elements',
            css: 'font-family: Arial, sans-serif;',
            note: 'ECL uses a utility-first approach. Apply typography utilities to elements directly.'
        },
        monospace: {
            name: 'Courier New',
            fallback: 'monospace',
            usage: 'Code blocks, technical content',
            css: 'font-family: "Courier New", monospace;',
            note: 'Not provided by ECL utilities. Set manually in custom CSS.'
        }
    },

    heading_classes: {
        'ecl-u-type-heading-1': {
            element: 'h1',
            font_size: '2.5rem',
            line_height: '1.2',
            font_weight: '600',
            usage: 'Page title, main heading'
        },
        'ecl-u-type-heading-2': {
            element: 'h2',
            font_size: '2rem',
            line_height: '1.25',
            font_weight: '600',
            usage: 'Section heading'
        },
        'ecl-u-type-heading-3': {
            element: 'h3',
            font_size: '1.5rem',
            line_height: '1.3',
            font_weight: '600',
            usage: 'Subsection heading'
        },
        'ecl-u-type-heading-4': {
            element: 'h4',
            font_size: '1.25rem',
            line_height: '1.4',
            font_weight: '600',
            usage: 'Minor heading'
        },
        'ecl-u-type-heading-5': {
            element: 'h5',
            font_size: '1rem',
            line_height: '1.5',
            font_weight: '600',
            usage: 'Small heading'
        },
        'ecl-u-type-heading-6': {
            element: 'h6',
            font_size: '0.875rem',
            line_height: '1.5',
            font_weight: '600',
            usage: 'Smallest heading'
        }
    },

    paragraph_classes: {
        'ecl-u-type-paragraph': {
            font_size: '1rem',
            line_height: '1.5',
            usage: 'Standard body text'
        },
        'ecl-u-type-paragraph-lead': {
            font_size: '1.25rem',
            line_height: '1.5',
            usage: 'Introductory paragraph, larger text'
        },
        'ecl-u-type-paragraph-s': {
            font_size: '0.875rem',
            line_height: '1.5',
            usage: 'Small text, captions, footnotes'
        },
        'ecl-u-type-paragraph-xs': {
            font_size: '0.75rem',
            line_height: '1.5',
            usage: 'Extra small text, legal notices'
        }
    },

    font_weights: {
        'ecl-u-type-regular': {
            weight: '400',
            usage: 'Normal text weight'
        },
        'ecl-u-type-medium': {
            weight: '500',
            usage: 'Medium emphasis'
        },
        'ecl-u-type-bold': {
            weight: '700',
            usage: 'Strong emphasis, important text'
        }
    },

    text_styles: {
        'ecl-u-type-uppercase': {
            transform: 'uppercase',
            usage: 'All caps text'
        },
        'ecl-u-type-lowercase': {
            transform: 'lowercase',
            usage: 'All lowercase text'
        },
        'ecl-u-type-capitalize': {
            transform: 'capitalize',
            usage: 'Capitalize first letter of each word'
        }
    },

    text_alignment: {
        'ecl-u-type-align-left': 'Left-aligned text',
        'ecl-u-type-align-center': 'Center-aligned text',
        'ecl-u-type-align-right': 'Right-aligned text'
    },

    color_utilities: {
        'ecl-u-type-color-grey': 'Grey text color',
        'ecl-u-type-color-primary': 'Primary brand color',
        'ecl-u-type-color-secondary': 'Secondary color',
        'ecl-u-type-color-error': 'Error state color',
        'ecl-u-type-color-success': 'Success state color',
        'ecl-u-type-color-warning': 'Warning state color',
        'ecl-u-type-color-info': 'Info state color'
    }
};

/**
 * Get complete typography guide
 */
export function getTypographyGuide() {
    const startTime = Date.now();

    return {
        success: true,
        data: {
            system: TYPOGRAPHY_SYSTEM,
            critical_notes: [
                {
                    type: 'important',
                    message: 'ECL uses a UTILITY-FIRST approach for typography',
                    solution: 'Apply ECL typography utility classes directly to your HTML elements',
                    example: '<p class="ecl-u-type-paragraph">Your text</p>',
                    priority: 'CRITICAL',
                    avoid: 'Do NOT use inline styles or global CSS resets on the html tag'
                },
                {
                    type: 'warning',
                    message: 'Paragraph tags without ECL classes will use browser defaults',
                    solution: 'Always use ecl-u-type-paragraph or ecl-u-type-paragraph-lead classes on <p> tags',
                    correct_example: '<p class="ecl-u-type-paragraph">Text with Arial font</p>',
                    incorrect_example: '<p>Text with Times New Roman (browser default)</p>',
                    impact: 'Unclassed paragraphs will appear in Times New Roman or other browser defaults'
                },
                {
                    type: 'info',
                    message: 'ECL provides comprehensive typography utilities',
                    available_utilities: [
                        'ecl-u-type-paragraph (standard body text)',
                        'ecl-u-type-paragraph-lead (larger intro text)',
                        'ecl-u-type-heading-1 through ecl-u-type-heading-6',
                        'ecl-u-type-bold, ecl-u-type-medium (font weights)',
                        'ecl-u-type-color-* (text colors)'
                    ]
                }
            ],
            semantic_html_vs_utilities: {
                recommendation: 'Use semantic HTML elements (h1-h6, p) with ECL utility classes',
                examples: {
                    correct: '<h1 class="ecl-u-type-heading-1">Page Title</h1>',
                    avoid: '<div class="ecl-u-type-heading-1">Page Title</div>',
                    reason: 'Semantic HTML improves accessibility and SEO'
                }
            },
            common_patterns: [
                {
                    name: 'Page Title with Lead Paragraph',
                    html: `<h1 class="ecl-u-type-heading-1">Page Title</h1>
<p class="ecl-u-type-paragraph-lead">This is an introductory paragraph with larger text to draw attention.</p>
<p class="ecl-u-type-paragraph">This is the standard body text that follows.</p>`
                },
                {
                    name: 'Section with Heading',
                    html: `<section>
  <h2 class="ecl-u-type-heading-2">Section Title</h2>
  <p class="ecl-u-type-paragraph">Section content goes here.</p>
</section>`
                },
                {
                    name: 'Bold Text',
                    html: `<p class="ecl-u-type-paragraph">
  This is normal text with <strong class="ecl-u-type-bold">bold emphasis</strong>.
</p>`
                },
                {
                    name: 'Colored Text',
                    html: `<p class="ecl-u-type-paragraph ecl-u-type-color-error">
  This is an error message in red.
</p>`
                }
            ],
            troubleshooting: [
                {
                    problem: 'Text appears in Times New Roman or serif font',
                    cause: 'Missing ECL typography utility class on the element',
                    solution: 'Add the appropriate ECL utility class: <p class="ecl-u-type-paragraph">Your text</p>',
                    explanation: 'ECL uses a utility-first approach. Each element needs its own typography class.',
                    avoid: 'Do NOT add inline styles to the html tag. This is not the ECL way.'
                },
                {
                    problem: 'Heading sizes not working',
                    cause: 'Missing ECL utilities CSS file',
                    solution: 'Include ecl-ec-utilities.css or ecl-eu-utilities.css in your HTML'
                },
                {
                    problem: 'Cannot change font family',
                    cause: 'ECL does not provide font-family utility classes',
                    solution: 'Set font-family directly in custom CSS or inline styles'
                },
                {
                    problem: 'Line height too tight or loose',
                    cause: 'ECL line-height is fixed per class',
                    solution: 'Use custom CSS to override: .my-custom-class { line-height: 1.6; }'
                }
            ],
            best_practices: [
                'ALWAYS apply ECL typography utility classes to text elements (utility-first approach)',
                'Use ecl-u-type-paragraph for all standard paragraph text',
                'Use ecl-u-type-paragraph-lead for introductory/lead paragraphs',
                'Apply ecl-u-type-heading-* classes to heading elements (h1-h6)',
                'Combine semantic HTML with ECL utility classes: <h1 class="ecl-u-type-heading-1">',
                'Maintain heading hierarchy (h1 → h2 → h3, no skipping levels)',
                'Use ecl-u-type-bold for emphasis, not just visual styling',
                'Never use inline styles or global CSS resets - use ECL utilities instead',
                'Test typography in multiple browsers to ensure consistency'
            ],
            accessibility_notes: [
                'Use proper heading hierarchy for screen readers',
                'Avoid using color alone to convey meaning',
                'Ensure sufficient color contrast (WCAG AA: 4.5:1 for normal text)',
                'Use semantic HTML elements for better accessibility',
                'Provide alternative text descriptions when using icons with text'
            ]
        },
        metadata: {
            tool: 'ecl_get_typography_guide',
            execution_time_ms: Date.now() - startTime,
            source: 'ecl-static-data',
            version: '2.0',
            ecl_version: '4.11.0'
        }
    };
}

/**
 * Search typography utilities
 */
export function searchTypographyUtilities(query) {
    const startTime = Date.now();
    const searchTerm = query.toLowerCase();
    const results = [];

    // Search through all typography categories
    const categories = ['heading_classes', 'paragraph_classes', 'font_weights', 'text_styles', 'text_alignment', 'color_utilities'];

    for (const category of categories) {
        const items = TYPOGRAPHY_SYSTEM[category];

        for (const [className, details] of Object.entries(items)) {
            const matchesClass = className.toLowerCase().includes(searchTerm);
            const matchesUsage = typeof details === 'object' && details.usage && details.usage.toLowerCase().includes(searchTerm);
            const matchesDescription = typeof details === 'string' && details.toLowerCase().includes(searchTerm);

            if (matchesClass || matchesUsage || matchesDescription) {
                results.push({
                    class: className,
                    category: category.replace(/_/g, ' '),
                    details: typeof details === 'object' ? details : { description: details },
                    example: generateTypographyExample(className, category, details)
                });
            }
        }
    }

    return {
        success: true,
        data: {
            results,
            count: results.length,
            query: searchTerm
        },
        metadata: {
            tool: 'ecl_search_typography',
            execution_time_ms: Date.now() - startTime,
            source: 'ecl-static-data',
            version: '2.0'
        }
    };
}

/**
 * Generate typography example
 */
function generateTypographyExample(className, category, details) {
    if (category === 'heading_classes') {
        const element = details.element || 'h1';
        return `<${element} class="${className}">Heading Text</${element}>`;
    } else if (category === 'paragraph_classes') {
        return `<p class="${className}">This is sample paragraph text.</p>`;
    } else if (category === 'font_weights') {
        return `<p class="ecl-u-type-paragraph ${className}">Text with ${details.usage}</p>`;
    } else if (category === 'text_styles') {
        return `<p class="ecl-u-type-paragraph ${className}">Transformed text</p>`;
    } else if (category === 'text_alignment') {
        return `<p class="ecl-u-type-paragraph ${className}">Aligned text</p>`;
    } else if (category === 'color_utilities') {
        return `<p class="ecl-u-type-paragraph ${className}">Colored text</p>`;
    }
    return `<p class="${className}">Sample text</p>`;
}
