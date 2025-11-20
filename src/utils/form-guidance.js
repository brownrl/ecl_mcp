/**
 * Form Guidance and Troubleshooting for ECL Components
 * Provides best practices, common mistakes, and fixes
 */

import { getDatabase } from '../db.js';

/**
 * Get all form templates with metadata
 * @returns {Array} Form template examples
 */
export function getFormTemplates() {
  const db = getDatabase();
  
  const templates = db.prepare(`
    SELECT 
      ce.id,
      ce.example_type as template_type,
      ce.code as html_code,
      ce.description,
      c.name as component_name,
      c.category
    FROM code_examples ce
    JOIN components c ON ce.component_id = c.id
    WHERE ce.example_type LIKE 'form-%'
    ORDER BY ce.position
  `).all();
  
  return templates.map(t => ({
    id: t.id,
    template_type: t.template_type,
    component_name: t.component_name,
    category: t.category,
    description: t.description,
    html_code: t.html_code,
    usage: getTemplateUsage(t.template_type)
  }));
}

/**
 * Get specific form template by type
 * @param {string} templateType - Template identifier (e.g., 'form-text-input-required')
 * @returns {Object|null} Template details
 */
export function getFormTemplate(templateType) {
  const db = getDatabase();
  
  const template = db.prepare(`
    SELECT 
      ce.id,
      ce.example_type as template_type,
      ce.code as html_code,
      ce.description,
      c.name as component_name,
      c.category
    FROM code_examples ce
    JOIN components c ON ce.component_id = c.id
    WHERE ce.example_type = ?
  `).get(templateType);
  
  if (!template) {
    return null;
  }
  
  return {
    id: template.id,
    template_type: template.template_type,
    component_name: template.component_name,
    category: template.category,
    description: template.description,
    html_code: template.html_code,
    usage: getTemplateUsage(template.template_type),
    critical_notes: getCriticalNotesForTemplate(template.template_type),
    common_mistakes: getCommonMistakesForTemplate(template.template_type)
  };
}

/**
 * Get usage guidance for template type
 */
function getTemplateUsage(templateType) {
  const usageMap = {
    'form-text-input-required': 'Use for mandatory text input fields like name, company, etc.',
    'form-text-input-optional': 'Use for optional text input fields',
    'form-email-input': 'Use for email address inputs with HTML5 validation',
    'form-select-dropdown': 'Use for dropdown selection fields with options',
    'form-textarea': 'Use for multi-line text input like messages or descriptions',
    'form-checkbox-single': 'Use for single checkbox options (newsletter, terms acceptance, etc.)',
    'form-checkbox-group': 'Use for multiple related checkboxes where user can select several options',
    'form-radio-group': 'Use for mutually exclusive options where user selects one choice',
    'form-submit-button': 'Use for form submission'
  };
  
  return usageMap[templateType] || 'Form component template';
}

/**
 * Get critical notes for specific template
 */
function getCriticalNotesForTemplate(templateType) {
  const notes = {
    'form-text-input-required': [
      'Helper text MUST come between label and input',
      'Label must have both "for" and "id" attributes',
      'Required indicator must use .ecl-form-label__required span'
    ],
    'form-select-dropdown': [
      'Select must be wrapped in .ecl-select__container',
      'Icon is SVG only, NOT wrapped in a button',
      'Use corner-arrow icon rotated 180°'
    ],
    'form-checkbox-single': [
      'Single checkbox does NOT need fieldset wrapper',
      'Must include SVG check icon in .ecl-checkbox__box'
    ],
    'form-checkbox-group': [
      'Multiple checkboxes MUST be in a fieldset',
      'Use <legend> instead of <label> for group heading'
    ],
    'form-radio-group': [
      'Radio buttons MUST be in a fieldset with legend',
      'All radios must have same "name" attribute'
    ]
  };
  
  return notes[templateType] || [];
}

/**
 * Get common mistakes for template
 */
function getCommonMistakesForTemplate(templateType) {
  const mistakes = {
    'form-text-input-required': [
      '❌ Putting helper text after input instead of before',
      '❌ Using multi-line label with indented required indicator',
      '❌ Adding utility margin classes to .ecl-form-group'
    ],
    'form-select-dropdown': [
      '❌ Wrapping dropdown icon in a button element',
      '❌ Missing .ecl-select__container wrapper',
      '❌ Using wrong icon or wrong rotation'
    ],
    'form-checkbox-single': [
      '❌ Wrapping single checkbox in fieldset',
      '❌ Missing .ecl-checkbox__box span',
      '❌ Forgetting SVG check icon'
    ]
  };
  
  return mistakes[templateType] || [];
}

/**
 * Get complete form guidance from database
 * @returns {Object} Comprehensive form guidance
 */
export function getCompleteFormGuidance() {
  const db = getDatabase();
  
  // Get all form-related guidance
  const guidance = db.prepare(`
    SELECT 
      ug.guidance_type,
      ug.content,
      ug.priority,
      p.title as source_page
    FROM usage_guidance ug
    JOIN pages p ON ug.page_id = p.id
    WHERE p.component_name = 'Complete Forms'
    ORDER BY ug.priority DESC, ug.id
  `).all();
  
  // Organize by type
  const organized = {
    critical: [],
    best_practices: [],
    caveats: [],
    all_guidance: guidance
  };
  
  guidance.forEach(g => {
    const parsed = parseGuidanceContent(g.content);
    const entry = {
      title: parsed.title,
      content: parsed.content,
      priority: g.priority,
      type: g.guidance_type
    };
    
    if (g.guidance_type === 'limitation') {
      organized.critical.push(entry);
    } else if (g.guidance_type === 'best-practice') {
      organized.best_practices.push(entry);
    } else if (g.guidance_type === 'caveat') {
      organized.caveats.push(entry);
    }
  });
  
  return {
    overview: 'ECL form components require exact structure for proper styling and accessibility',
    critical_requirements: organized.critical,
    best_practices: organized.best_practices,
    troubleshooting: organized.caveats,
    template_count: getFormTemplates().length,
    form_validation_available: true
  };
}

/**
 * Parse guidance content to extract title and content
 */
function parseGuidanceContent(content) {
  const lines = content.split('\n');
  const title = lines[0];
  const contentText = lines.slice(1).join('\n').trim();
  
  return { title, content: contentText };
}

/**
 * Search form guidance by keyword
 * @param {string} query - Search query
 * @returns {Array} Matching guidance entries
 */
export function searchFormGuidance(query) {
  const db = getDatabase();
  
  const results = db.prepare(`
    SELECT 
      ug.id,
      ug.guidance_type,
      ug.content,
      ug.priority,
      p.title as source_page
    FROM usage_guidance ug
    JOIN pages p ON ug.page_id = p.id
    WHERE p.component_name = 'Complete Forms'
      AND ug.content LIKE ?
    ORDER BY ug.priority DESC
  `).all(`%${query}%`);
  
  return results.map(r => {
    const parsed = parseGuidanceContent(r.content);
    return {
      id: r.id,
      title: parsed.title,
      content: parsed.content,
      type: r.guidance_type,
      priority: r.priority,
      relevance: calculateRelevance(parsed.content, query)
    };
  }).sort((a, b) => b.relevance - a.relevance);
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevance(content, query) {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  let score = 0;
  
  // Exact phrase match
  if (lowerContent.includes(lowerQuery)) {
    score += 10;
  }
  
  // Individual word matches
  const words = lowerQuery.split(/\s+/);
  words.forEach(word => {
    const matches = (lowerContent.match(new RegExp(word, 'g')) || []).length;
    score += matches;
  });
  
  return score;
}

/**
 * Get form validation checklist
 * @returns {Object} Validation checklist
 */
export function getFormValidationChecklist() {
  return {
    structure: [
      { item: 'No class="ecl-form" on form element', required: true },
      { item: 'Helper text comes AFTER label, BEFORE input', required: true },
      { item: 'Labels have both "for" and "id" attributes', required: true },
      { item: 'No utility margin classes on .ecl-form-group', required: true }
    ],
    accessibility: [
      { item: 'Required indicators use .ecl-form-label__required span with role="note"', required: true },
      { item: 'Inputs reference helper text with aria-describedby', required: true },
      { item: 'No redundant aria-required="true" (use HTML5 required)', required: false },
      { item: 'Icon-only buttons have aria-label', required: true }
    ],
    components: {
      select: [
        { item: 'Wrapped in .ecl-select__container', required: true },
        { item: 'Icon is SVG only (no button wrapper)', required: true },
        { item: 'Uses corner-arrow icon rotated 180°', required: true }
      ],
      checkbox: [
        { item: 'Single checkbox: no fieldset wrapper', required: true },
        { item: 'Multiple checkboxes: wrapped in fieldset with legend', required: true },
        { item: 'Includes SVG check icon in .ecl-checkbox__box', required: true }
      ],
      radio: [
        { item: 'Always wrapped in fieldset with legend', required: true },
        { item: 'All radios have same name attribute', required: true }
      ],
      inputs: [
        { item: 'All text inputs have placeholders', required: false },
        { item: 'Textareas have rows attribute', required: true },
        { item: 'Elements are compact (single-line)', required: false }
      ]
    },
    visual_checks: [
      { symptom: 'Labels floating with huge gaps', likely_cause: 'Helper text after input' },
      { symptom: 'Excessive spacing between fields', likely_cause: 'Utility classes on form-group' },
      { symptom: 'Checkboxes without visible boxes', likely_cause: 'Missing SVG icon or wrong structure' },
      { symptom: 'Select looks like plain input', likely_cause: 'Missing container or icon' },
      { symptom: 'Required * not styled', likely_cause: 'Wrong class on required indicator' }
    ]
  };
}

/**
 * Get form troubleshooting guide
 * @param {string} issue - Description of the issue
 * @returns {Object} Troubleshooting advice
 */
export function troubleshootFormIssue(issue) {
  const troubleshootingMap = {
    'spacing': {
      symptoms: ['Large gaps between form elements', 'Inconsistent spacing', 'Too much whitespace'],
      causes: [
        'Utility margin classes added to .ecl-form-group',
        'Extra wrapper divs disrupting ECL spacing',
        'Helper text in wrong position'
      ],
      fixes: [
        'Remove all ecl-u-mb-*, ecl-u-mt-* classes from .ecl-form-group',
        'Ensure helper text is between label and input',
        'Use only the exact ECL structure from templates'
      ]
    },
    'helper-text': {
      symptoms: ['Helper text appears below input', 'Visual gap between label and input', 'Wrong spacing'],
      causes: [
        'Helper text (.ecl-help-block) positioned after input instead of before',
        'Most common and critical form mistake'
      ],
      fixes: [
        'CRITICAL: Move .ecl-help-block to be after label but before input',
        'Correct order: <label> → <div class="ecl-help-block"> → <input>',
        'Use ecl_validate_component_usage to check structure'
      ]
    },
    'select': {
      symptoms: ['Dropdown has no arrow icon', 'Icon is clickable/interactive', 'Select looks wrong'],
      causes: [
        'Missing .ecl-select__container wrapper',
        'Icon wrapped in button element (wrong)',
        'Wrong icon or rotation'
      ],
      fixes: [
        'Wrap select in <div class="ecl-select__container ecl-select__container--m">',
        'Icon should be SVG only: <div class="ecl-select__icon"><svg>...</svg></div>',
        'Use corner-arrow icon with ecl-icon--rotate-180'
      ]
    },
    'checkbox': {
      symptoms: ['No checkbox visible', 'Checkbox box not showing', 'Wrong spacing for single checkbox'],
      causes: [
        'Missing .ecl-checkbox__box span',
        'SVG check icon not included',
        'Single checkbox wrapped in fieldset (wrong)'
      ],
      fixes: [
        'Add <span class="ecl-checkbox__box"><svg>...</svg></span> inside label',
        'Include SVG: <use xlink:href="icons.svg#check"></use>',
        'Remove fieldset for single checkboxes (only use for groups)'
      ]
    },
    'required': {
      symptoms: ['Required * not styled', 'Asterisk looks plain', 'Inconsistent required indicators'],
      causes: [
        'Using class="ecl-form-label--required" on label (wrong)',
        'Plain text asterisk without span',
        'Missing role or aria-label attributes'
      ],
      fixes: [
        'Use: <span class="ecl-form-label__required" role="note" aria-label="required">*</span>',
        'Place directly after label text (no newlines)',
        'Do not use class on label element'
      ]
    },
    'accessibility': {
      symptoms: ['Screen reader issues', 'Accessibility warnings', 'Missing ARIA'],
      causes: [
        'Labels missing "for" or "id" attributes',
        'Inputs not connected to helper text with aria-describedby',
        'Redundant aria-required with required attribute'
      ],
      fixes: [
        'Add both for="input-id" and id="input-label" to labels',
        'Connect helper text: aria-describedby="input-helper"',
        'Remove aria-required="true" when using HTML5 required'
      ]
    }
  };
  
  // Try to match issue to a category
  const lowerIssue = issue.toLowerCase();
  let matchedCategory = null;
  
  for (const [category, data] of Object.entries(troubleshootingMap)) {
    if (lowerIssue.includes(category) || 
        data.symptoms.some(s => lowerIssue.includes(s.toLowerCase())) ||
        data.causes.some(c => lowerIssue.includes(c.toLowerCase()))) {
      matchedCategory = category;
      break;
    }
  }
  
  if (matchedCategory) {
    return {
      issue_category: matchedCategory,
      ...troubleshootingMap[matchedCategory],
      related_templates: getRelatedTemplates(matchedCategory)
    };
  }
  
  // Return general advice if no match
  return {
    issue_category: 'general',
    message: 'No specific match found. Try these general steps:',
    fixes: [
      'Validate structure with ecl_validate_component_usage tool',
      'Compare your code with ecl_get_form_templates',
      'Check ecl_get_complete_form_guidance for common mistakes',
      'Ensure helper text is between label and input',
      'Remove utility margin classes from .ecl-form-group',
      'Verify all templates match ECL examples exactly'
    ],
    all_categories: Object.keys(troubleshootingMap)
  };
}

/**
 * Get templates related to an issue category
 */
function getRelatedTemplates(category) {
  const templateMap = {
    'select': ['form-select-dropdown'],
    'checkbox': ['form-checkbox-single', 'form-checkbox-group'],
    'required': ['form-text-input-required', 'form-email-input'],
    'helper-text': ['form-text-input-required', 'form-text-input-optional'],
    'accessibility': ['form-text-input-required', 'form-checkbox-single']
  };
  
  return templateMap[category] || [];
}

/**
 * Get complete contact form example
 * @returns {Object} Complete form with all elements
 */
export function getCompleteContactForm() {
  const db = getDatabase();
  
  const example = db.prepare(`
    SELECT 
      p.id,
      p.title,
      cs.heading,
      cs.content as description,
      cs.code_example as html_code
    FROM pages p
    JOIN content_sections cs ON p.id = cs.page_id
    WHERE p.component_name = 'Complete Forms'
      AND p.title = 'Complete Contact Form'
  `).get();
  
  if (!example) {
    return null;
  }
  
  return {
    id: example.id,
    title: example.title,
    heading: example.heading,
    description: example.description,
    html_code: example.html_code,
    included_components: [
      'Text input (required)',
      'Email input (required)',
      'Select dropdown (required)',
      'Textarea (required)',
      'Checkbox (optional)',
      'Submit button'
    ],
    demonstrates: [
      'Proper form structure (no class="ecl-form")',
      'Helper text positioning (between label and input)',
      'Required field indicators (.ecl-form-label__required)',
      'ARIA attributes (aria-describedby)',
      'Select dropdown with icon',
      'Single checkbox (no fieldset)',
      'Complete ECL button structure'
    ],
    usage: 'Use this as a reference for building any ECL form. All structure is correct.',
    validation_status: 'Fully validated against ECL requirements'
  };
}
