/**
 * Diagnostic Patterns for ECL Component Validation
 * 
 * This module contains validation patterns for common ECL mistakes,
 * accessibility issues, and best practice violations.
 */

export const DIAGNOSTIC_PATTERNS = {
  // ============================================================================
  // ARIA and Accessibility Patterns
  // ============================================================================
  
  'missing-aria-label-button': {
    pattern: /<button[^>]*(?!aria-label|aria-labelledby)[^>]*>(\s*<\/button>|<\/button>|\s*$)/i,
    severity: 'error',
    components: ['button'],
    message: 'Interactive buttons without visible text must have aria-label',
    fix: 'Add aria-label="descriptive text" attribute to the button',
    wcag: '4.1.2',
    example: '<button class="ecl-button" aria-label="Close dialog">...</button>'
  },

  'missing-alt-text': {
    pattern: /<img[^>]*(?!alt=)[^>]*>/i,
    severity: 'error',
    components: ['*'],
    message: 'Images must have alt attribute for accessibility',
    fix: 'Add alt="description" or alt="" for decorative images',
    wcag: '1.1.1',
    example: '<img src="..." alt="European Commission logo" />'
  },

  'empty-heading': {
    pattern: /<h[1-6][^>]*>\s*<\/h[1-6]>/i,
    severity: 'error',
    components: ['*'],
    message: 'Heading elements must contain text content',
    fix: 'Add descriptive text inside the heading element',
    wcag: '2.4.6',
    example: '<h2 class="ecl-u-type-heading-2">Section Title</h2>'
  },

  'incorrect-role': {
    pattern: /role="button"[^>]*>(?!<button)/i,
    severity: 'warning',
    components: ['button', 'link'],
    message: 'Use native <button> element instead of role="button"',
    fix: 'Replace with <button> element for better accessibility',
    wcag: '4.1.2',
    example: '<button class="ecl-button">Click me</button>'
  },

  // ============================================================================
  // ECL Class Naming (BEM) Patterns
  // ============================================================================

  'incorrect-bem-element': {
    pattern: /class="[^"]*ecl-[^_\s]+_[^_\s]+/,
    severity: 'warning',
    components: ['*'],
    message: 'ECL uses double underscore (__) for BEM elements, not single',
    fix: 'Change single underscore to double: ecl-component__element',
    example: 'class="ecl-button__icon" (not ecl-button_icon)'
  },

  'incorrect-bem-modifier': {
    pattern: /class="[^"]*ecl-[^-\s]+-[^-\s]+-[^-\s]+-/,
    severity: 'warning',
    components: ['*'],
    message: 'ECL uses double dash (--) for BEM modifiers',
    fix: 'Use double dash for modifiers: ecl-component--modifier',
    example: 'class="ecl-button--primary" (not ecl-button-primary)'
  },

  'missing-ecl-prefix': {
    pattern: /class="(?!ecl-)[a-z]+-button/,
    severity: 'error',
    components: ['*'],
    message: 'ECL components must use "ecl-" prefix',
    fix: 'Add "ecl-" prefix to component classes',
    example: 'class="ecl-button" (not "button")'
  },

  // ============================================================================
  // Required Attributes
  // ============================================================================

  'button-without-type': {
    pattern: /<button[^>]*(?!type=)[^>]*>/i,
    severity: 'warning',
    components: ['button'],
    message: 'Button should have explicit type attribute',
    fix: 'Add type="button", type="submit", or type="reset"',
    example: '<button type="button" class="ecl-button">Click</button>'
  },

  'link-without-href': {
    pattern: /<a[^>]*class="ecl-link"[^>]*(?!href=)[^>]*>/i,
    severity: 'error',
    components: ['link'],
    message: 'Links must have href attribute',
    fix: 'Add href attribute or use <button> if not a navigation element',
    example: '<a href="/page" class="ecl-link">Link text</a>'
  },

  'input-without-label': {
    pattern: /<input[^>]*(?!aria-label|aria-labelledby|id=)[^>]*>/i,
    severity: 'error',
    components: ['text-input', 'form'],
    message: 'Input fields must be associated with a label',
    fix: 'Add <label> with for attribute or use aria-label',
    wcag: '3.3.2',
    example: '<label for="name">Name:</label><input id="name" type="text" />'
  },

  'form-without-method': {
    pattern: /<form[^>]*(?!method=)[^>]*>/i,
    severity: 'warning',
    components: ['form'],
    message: 'Forms should have explicit method attribute',
    fix: 'Add method="get" or method="post"',
    example: '<form method="post" action="/submit">...</form>'
  },

  // ============================================================================
  // Component-Specific Required Structure
  // ============================================================================

  'icon-without-class': {
    pattern: /<svg[^>]*class="ecl-icon[^>]*(?!ecl-icon--[a-z])/i,
    severity: 'warning',
    components: ['icon'],
    message: 'ECL icons should include size modifier class',
    fix: 'Add size class like ecl-icon--s, ecl-icon--m, etc.',
    example: '<svg class="ecl-icon ecl-icon--m">...</svg>'
  },

  'button-without-label': {
    pattern: /<button[^>]*class="ecl-button"[^>]*>\s*<svg[^>]*ecl-icon/i,
    severity: 'warning',
    components: ['button'],
    message: 'Icon-only buttons should have ecl-button__label for screen readers',
    fix: 'Add <span class="ecl-button__label" data-ecl-label>Text</span>',
    example: '<button class="ecl-button"><span class="ecl-button__label">Close</span><svg class="ecl-icon">...</svg></button>'
  },

  // Disabled - too many false positives with regex
  // 'card-missing-container': {
  //   pattern: /<[^>]*class="ecl-card__[^"]*"(?![^<]*ecl-card[^<]*)/,
  //   severity: 'error',
  //   components: ['card'],
  //   message: 'Card elements must be inside ecl-card container',
  //   fix: 'Wrap card elements in <div class="ecl-card">',
  //   example: '<div class="ecl-card"><div class="ecl-card__body">...</div></div>'
  // },

  // ============================================================================
  // JavaScript Initialization
  // ============================================================================

  'missing-data-ecl-auto-init': {
    pattern: /<[^>]*class="ecl-(modal|carousel|accordion|expandable|dropdown|datepicker|file-upload|select)"[^>]*(?!data-ecl-auto-init)/i,
    severity: 'error',
    components: ['modal', 'carousel', 'accordion', 'expandable', 'dropdown', 'datepicker', 'file-upload', 'select'],
    message: 'Interactive ECL components require data-ecl-auto-init attribute',
    fix: 'Add data-ecl-auto-init="ComponentName" attribute',
    example: '<div class="ecl-modal" data-ecl-auto-init="Modal">...</div>'
  },

  'manual-init-without-id': {
    pattern: /<[^>]*class="ecl-(modal|carousel)"[^>]*(?!id=|data-ecl-auto-init)/i,
    severity: 'warning',
    components: ['modal', 'carousel', 'accordion'],
    message: 'Manually initialized components should have unique ID',
    fix: 'Add id attribute for JavaScript initialization',
    example: '<div id="myModal" class="ecl-modal">...</div>'
  },

  // ============================================================================
  // Responsive and Layout
  // ============================================================================

  'grid-without-container': {
    pattern: /<[^>]*class="ecl-row"(?![^<]*ecl-container)/,
    severity: 'warning',
    components: ['grid'],
    message: 'Grid rows should be inside ecl-container',
    fix: 'Wrap rows in <div class="ecl-container">',
    example: '<div class="ecl-container"><div class="ecl-row">...</div></div>'
  },

  'col-without-row': {
    pattern: /<[^>]*class="ecl-col-[^"]*"(?![^<]*ecl-row)/,
    severity: 'error',
    components: ['grid'],
    message: 'Grid columns must be inside ecl-row',
    fix: 'Wrap columns in <div class="ecl-row">',
    example: '<div class="ecl-row"><div class="ecl-col-12">...</div></div>'
  },

  // ============================================================================
  // Typography and Content
  // ============================================================================

  'hardcoded-heading-style': {
    pattern: /<h[1-6][^>]*style="[^"]*font-size/i,
    severity: 'warning',
    components: ['*'],
    message: 'Avoid inline styles on headings, use ECL typography utilities',
    fix: 'Use classes like ecl-u-type-heading-1, ecl-u-type-heading-2, etc.',
    example: '<h2 class="ecl-u-type-heading-2">Heading</h2>'
  },

  'non-semantic-heading': {
    pattern: /<(div|span)[^>]*class="[^"]*heading/i,
    severity: 'warning',
    components: ['*'],
    message: 'Use semantic heading tags (<h1>-<h6>) instead of styled divs',
    fix: 'Replace with proper heading element',
    wcag: '1.3.1',
    example: '<h2 class="ecl-u-type-heading-2">Heading</h2>'
  },

  // ============================================================================
  // Common Anti-Patterns
  // ============================================================================

  'nested-links': {
    pattern: /<a[^>]*>.*<a[^>]*>/i,
    severity: 'error',
    components: ['link'],
    message: 'Links cannot be nested inside other links',
    fix: 'Restructure HTML to avoid nested links',
    wcag: '4.1.1',
    example: 'Use separate links or buttons for complex interactions'
  },

  'div-as-button': {
    pattern: /<div[^>]*onclick|<span[^>]*onclick/i,
    severity: 'error',
    components: ['*'],
    message: 'Use <button> element for clickable elements, not div/span',
    fix: 'Replace with <button> element',
    wcag: '4.1.2',
    example: '<button class="ecl-button" type="button">Click</button>'
  },

  'multiple-h1': {
    pattern: /<h1[^>]*>.*<\/h1>.*<h1[^>]*>/is,
    severity: 'warning',
    components: ['*'],
    message: 'Page should typically have only one <h1> element',
    fix: 'Use <h2>-<h6> for subsequent headings',
    wcag: '2.4.6',
    example: 'One <h1> per page, then <h2>, <h3>, etc.'
  },

  'tabindex-greater-than-zero': {
    pattern: /tabindex="[1-9]/i,
    severity: 'error',
    components: ['*'],
    message: 'Avoid positive tabindex values, use 0 or -1',
    fix: 'Use tabindex="0" for focusable or tabindex="-1" for non-tabbable',
    wcag: '2.4.3',
    example: 'tabindex="0" (adds to tab order) or tabindex="-1" (programmatic focus only)'
  },

  'placeholder-as-label': {
    pattern: /<input[^>]*placeholder="[^"]*"[^>]*(?!aria-label|aria-labelledby|<label)/i,
    severity: 'error',
    components: ['text-input', 'form'],
    message: 'Placeholder is not a substitute for label',
    fix: 'Add proper <label> element in addition to placeholder',
    wcag: '3.3.2',
    example: '<label for="email">Email:</label><input id="email" type="email" placeholder="you@example.com" />'
  },

  'title-as-label': {
    pattern: /<[^>]*title="[^"]*"(?!aria-label|aria-labelledby)/i,
    severity: 'warning',
    components: ['*'],
    message: 'Title attribute is not accessible, use aria-label instead',
    fix: 'Use aria-label for screen readers, title for tooltip only',
    wcag: '4.1.2',
    example: '<button aria-label="Close" title="Close dialog">X</button>'
  },

  // ============================================================================
  // Performance and Best Practices
  // ============================================================================

  'inline-style-color': {
    pattern: /style="[^"]*color:\s*#[0-9a-fA-F]{3,6}/i,
    severity: 'warning',
    components: ['*'],
    message: 'Avoid hardcoded colors, use ECL design tokens',
    fix: 'Use CSS variables like var(--ecl-color-primary)',
    example: 'Use ECL color utility classes or CSS variables'
  },

  'inline-style-spacing': {
    pattern: /style="[^"]*(margin|padding):\s*\d+px/i,
    severity: 'warning',
    components: ['*'],
    message: 'Avoid hardcoded spacing, use ECL spacing utilities',
    fix: 'Use classes like ecl-u-mt-m, ecl-u-mb-l, etc.',
    example: '<div class="ecl-u-mt-m ecl-u-mb-l">...</div>'
  },

  'empty-class-attribute': {
    pattern: /class="\s*"/,
    severity: 'warning',
    components: ['*'],
    message: 'Remove empty class attributes',
    fix: 'Delete class="" or add appropriate classes',
    example: 'Remove unnecessary class="" attributes'
  },

  'duplicate-id': {
    pattern: /id="([^"]*)">.*id="\1"/is,
    severity: 'error',
    components: ['*'],
    message: 'ID attributes must be unique within the page',
    fix: 'Ensure each ID is used only once',
    wcag: '4.1.1',
    example: 'Use unique IDs: id="modal-1", id="modal-2"'
  }
};

/**
 * WCAG 2.1 Success Criteria Reference
 */
export const WCAG_CRITERIA = {
  '1.1.1': {
    name: 'Non-text Content',
    level: 'A',
    description: 'All non-text content has a text alternative'
  },
  '1.3.1': {
    name: 'Info and Relationships',
    level: 'A',
    description: 'Information, structure, and relationships can be programmatically determined'
  },
  '2.4.3': {
    name: 'Focus Order',
    level: 'A',
    description: 'Focusable components receive focus in an order that preserves meaning'
  },
  '2.4.6': {
    name: 'Headings and Labels',
    level: 'AA',
    description: 'Headings and labels describe topic or purpose'
  },
  '3.3.2': {
    name: 'Labels or Instructions',
    level: 'A',
    description: 'Labels or instructions are provided when content requires user input'
  },
  '4.1.1': {
    name: 'Parsing',
    level: 'A',
    description: 'Elements have complete start and end tags, are nested correctly'
  },
  '4.1.2': {
    name: 'Name, Role, Value',
    level: 'A',
    description: 'UI components have accessible name and role'
  }
};

/**
 * Component-Specific Required Attributes
 */
export const REQUIRED_ATTRIBUTES = {
  button: {
    required: ['type'],
    recommended: ['aria-label'],
    conditional: {
      'icon-only': ['aria-label']
    }
  },
  link: {
    required: ['href'],
    recommended: [],
    conditional: {
      'external': ['target', 'rel']
    }
  },
  modal: {
    required: ['data-ecl-auto-init', 'aria-modal', 'role'],
    recommended: ['aria-labelledby'],
    conditional: {}
  },
  accordion: {
    required: ['data-ecl-auto-init'],
    recommended: [],
    conditional: {}
  },
  input: {
    required: ['id', 'type'],
    recommended: ['aria-label', 'aria-describedby'],
    conditional: {
      'required': ['aria-required']
    }
  }
};
