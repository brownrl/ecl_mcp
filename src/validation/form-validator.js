/**
 * Form-Specific Validator for ECL Components
 * Validates form structure, helper text positioning, labels, and accessibility
 * Based on November 20, 2025 form structure feedback
 */

/**
 * Validate form element structure according to ECL requirements
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {string} component - Component name
 * @param {Array} errors - Array to push errors to
 * @param {Array} warnings - Array to push warnings to
 */
export function validateFormStructure($, component, errors, warnings) {
  const formValidations = {
    'Text Field': validateTextField,
    'Select': validateSelect,
    'Text Area': validateTextArea,
    'Checkbox': validateCheckbox,
    'Radio': validateRadio,
    'Complete Forms': validateCompleteForm
  };

  const validator = formValidations[component];
  if (validator) {
    validator($, errors, warnings);
  }
  
  // Run universal form validations
  validateFormTagClasses($, errors, warnings);
  validateFormGroupSpacing($, errors, warnings);
  validateHelperTextPosition($, errors, warnings);
  validateLabelStructure($, errors, warnings);
  validateRequiredIndicators($, errors, warnings);
  validateAriaAttributes($, errors, warnings);
}

/**
 * Check for incorrect class="ecl-form" on form element
 */
function validateFormTagClasses($, errors, warnings) {
  const formsWithClass = $('form.ecl-form');
  
  if (formsWithClass.length > 0) {
    errors.push({
      type: 'form_structure',
      message: 'Form element should NOT have class="ecl-form". This class does not exist in ECL CSS.',
      severity: 'error',
      element: 'form',
      fix: 'Remove class="ecl-form" from the <form> tag'
    });
  }
}

/**
 * Check for utility margin classes on form groups
 */
function validateFormGroupSpacing($, errors, warnings) {
  const formGroupsWithUtilities = $('.ecl-form-group').filter((i, el) => {
    const classes = $(el).attr('class') || '';
    return /ecl-u-m[btlr]?-/.test(classes);
  });
  
  if (formGroupsWithUtilities.length > 0) {
    warnings.push({
      type: 'form_spacing',
      message: `Found ${formGroupsWithUtilities.length} .ecl-form-group elements with utility margin classes. ECL provides proper spacing by default.`,
      severity: 'warning',
      element: '.ecl-form-group',
      fix: 'Remove ecl-u-mb-*, ecl-u-mt-*, etc. classes from .ecl-form-group elements'
    });
  }
}

/**
 * CRITICAL: Validate helper text position (must come BEFORE input)
 */
function validateHelperTextPosition($, errors, warnings) {
  // Find all form groups
  $('.ecl-form-group').each((i, formGroup) => {
    const $formGroup = $(formGroup);
    const $label = $formGroup.find('label.ecl-form-label').first();
    const $helpBlock = $formGroup.find('.ecl-help-block').first();
    const $input = $formGroup.find('input.ecl-text-input, input.ecl-text-input, textarea.ecl-text-area, select.ecl-select').first();
    
    if ($label.length && $helpBlock.length && $input.length) {
      // Get direct children of form-group to find order
      const children = $formGroup.children().toArray();
      
      // Find actual indices
      let labelIndex = -1;
      let helpIndex = -1;
      let inputIndex = -1;
      
      children.forEach((child, index) => {
        const $child = $(child);
        
        // Check if this child is or contains the label
        if ($child.is('label.ecl-form-label') || $child.find('label.ecl-form-label').length > 0) {
          labelIndex = index;
        }
        
        // Check if this child is or contains the help block
        if ($child.is('.ecl-help-block') || $child.find('.ecl-help-block').length > 0) {
          helpIndex = index;
        }
        
        // Check if this child is or contains the input
        if ($child.is('input.ecl-text-input, textarea.ecl-text-area') || 
            $child.hasClass('ecl-select__container') ||
            $child.find('input.ecl-text-input, textarea.ecl-text-area, select.ecl-select').length > 0) {
          inputIndex = index;
        }
      });
      
      // Correct order: label → help → input
      if (labelIndex >= 0 && helpIndex >= 0 && inputIndex >= 0) {
        if (helpIndex > inputIndex) {
          errors.push({
            type: 'helper_text_position',
            message: 'Helper text (.ecl-help-block) MUST come between label and input, not after the input. This is CRITICAL for ECL styling.',
            severity: 'error',
            element: '.ecl-help-block',
            fix: 'Move .ecl-help-block to be after the label but before the input element',
            example: '<label>Label</label>\n<div class="ecl-help-block">Helper text</div>\n<input>'
          });
        } else if (helpIndex < labelIndex) {
          errors.push({
            type: 'helper_text_position',
            message: 'Helper text (.ecl-help-block) should come AFTER the label',
            severity: 'error',
            element: '.ecl-help-block',
            fix: 'Move .ecl-help-block to be after the label element'
          });
        }
      }
    }
  });
}

/**
 * Validate label structure: must have 'for' and 'id' attributes
 */
function validateLabelStructure($, errors, warnings) {
  $('label.ecl-form-label').each((i, label) => {
    const $label = $(label);
    const forAttr = $label.attr('for');
    const idAttr = $label.attr('id');
    
    if (!forAttr) {
      errors.push({
        type: 'label_attributes',
        message: 'Form label is missing "for" attribute',
        severity: 'error',
        element: 'label',
        fix: 'Add for="input-id" attribute to the label'
      });
    }
    
    if (!idAttr) {
      warnings.push({
        type: 'label_attributes',
        message: 'Form label is missing "id" attribute (needed for proper ARIA relationships)',
        severity: 'warning',
        element: 'label',
        fix: 'Add id="input-id-label" attribute to the label'
      });
    }
    
    // Check for multi-line labels (newlines between label text and required indicator)
    const html = $label.html() || '';
    if (html.includes('\n') && html.includes('ecl-form-label__required')) {
      warnings.push({
        type: 'label_format',
        message: 'Label should be single-line with inline required indicator (no newlines)',
        severity: 'warning',
        element: 'label',
        fix: 'Put label text and required indicator on same line: <label>Name<span class="ecl-form-label__required">*</span></label>'
      });
    }
  });
}

/**
 * Validate required field indicators
 */
function validateRequiredIndicators($, errors, warnings) {
  // Check for incorrect required indicator styles
  $('label.ecl-form-label--required').each((i, label) => {
    warnings.push({
      type: 'required_indicator',
      message: 'Using class="ecl-form-label--required" on label. Should use <span class="ecl-form-label__required"> instead.',
      severity: 'warning',
      element: 'label',
      fix: 'Use: <label>Name<span class="ecl-form-label__required" role="note" aria-label="required">*</span></label>'
    });
  });
  
  // Check required indicators for proper structure
  $('.ecl-form-label__required').each((i, span) => {
    const $span = $(span);
    const role = $span.attr('role');
    const ariaLabel = $span.attr('aria-label');
    
    if (!role || role !== 'note') {
      warnings.push({
        type: 'required_indicator',
        message: 'Required indicator missing role="note" attribute',
        severity: 'warning',
        element: '.ecl-form-label__required',
        fix: 'Add role="note" to the span'
      });
    }
    
    if (!ariaLabel || ariaLabel !== 'required') {
      warnings.push({
        type: 'required_indicator',
        message: 'Required indicator missing aria-label="required" attribute',
        severity: 'warning',
        element: '.ecl-form-label__required',
        fix: 'Add aria-label="required" to the span'
      });
    }
  });
}

/**
 * Validate ARIA attributes on form elements
 */
function validateAriaAttributes($, errors, warnings) {
  // Check inputs for aria-describedby matching helper text
  $('input.ecl-text-input, textarea.ecl-text-area, select.ecl-select').each((i, input) => {
    const $input = $(input);
    const inputId = $input.attr('id');
    const ariaDescribedby = $input.attr('aria-describedby');
    const $formGroup = $input.closest('.ecl-form-group, fieldset');
    const $helpBlock = $formGroup.find('.ecl-help-block').first();
    
    if ($helpBlock.length && !ariaDescribedby) {
      warnings.push({
        type: 'aria_attributes',
        message: `Input has helper text but missing aria-describedby attribute`,
        severity: 'warning',
        element: `#${inputId}`,
        fix: `Add aria-describedby="${inputId}-helper" to the input and id="${inputId}-helper" to the help block`
      });
    }
  });
  
  // Check for redundant aria-required when required attribute is present
  $('input[required][aria-required], textarea[required][aria-required], select[required][aria-required]').each((i, input) => {
    const $input = $(input);
    warnings.push({
      type: 'aria_redundant',
      message: 'Input has both required and aria-required attributes. HTML5 "required" is sufficient.',
      severity: 'warning',
      element: `#${$input.attr('id')}`,
      fix: 'Remove aria-required="true" attribute (keep "required")'
    });
  });
}

/**
 * Validate Text Field component
 */
function validateTextField($, errors, warnings) {
  const inputs = $('input.ecl-text-input');
  
  inputs.each((i, input) => {
    const $input = $(input);
    const placeholder = $input.attr('placeholder');
    
    if (!placeholder) {
      warnings.push({
        type: 'text_field_ux',
        message: 'Text input missing placeholder attribute',
        severity: 'warning',
        element: `#${$input.attr('id')}`,
        fix: 'Add placeholder="Expected input format" for better UX'
      });
    }
    
    // Check for multi-line attribute formatting
    const html = $.html(input);
    if (html.split('\n').length > 3) {
      warnings.push({
        type: 'code_style',
        message: 'Input element has multi-line attributes. ECL examples use single-line format.',
        severity: 'info',
        element: `#${$input.attr('id')}`,
        fix: 'Put all attributes on one line for consistency with ECL examples'
      });
    }
  });
}

/**
 * Validate Select component
 */
function validateSelect($, errors, warnings) {
  const selects = $('.ecl-select');
  
  selects.each((i, select) => {
    const $select = $(select);
    const $container = $select.closest('.ecl-select__container');
    const $icon = $container.find('.ecl-select__icon');
    
    if ($container.length === 0) {
      errors.push({
        type: 'select_structure',
        message: 'Select element missing .ecl-select__container wrapper',
        severity: 'error',
        element: 'select',
        fix: 'Wrap select in <div class="ecl-select__container ecl-select__container--m">...</div>'
      });
    }
    
    if ($icon.length === 0) {
      errors.push({
        type: 'select_icon',
        message: 'Select missing dropdown icon',
        severity: 'error',
        element: '.ecl-select__container',
        fix: 'Add <div class="ecl-select__icon"><svg>...</svg></div> after select element'
      });
    } else {
      // Check icon structure
      const $button = $icon.find('button');
      if ($button.length > 0) {
        errors.push({
          type: 'select_icon_structure',
          message: 'Select icon should be SVG only, not wrapped in a button',
          severity: 'error',
          element: '.ecl-select__icon',
          fix: 'Remove button wrapper, use just <svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-180">...</svg>'
        });
      }
    }
  });
}

/**
 * Validate Text Area component
 */
function validateTextArea($, errors, warnings) {
  const textareas = $('textarea.ecl-text-area');
  
  textareas.each((i, textarea) => {
    const $textarea = $(textarea);
    const placeholder = $textarea.attr('placeholder');
    const rows = $textarea.attr('rows');
    
    if (!placeholder) {
      warnings.push({
        type: 'textarea_ux',
        message: 'Textarea missing placeholder attribute',
        severity: 'warning',
        element: `#${$textarea.attr('id')}`,
        fix: 'Add placeholder="Your message..." for better UX'
      });
    }
    
    if (!rows) {
      warnings.push({
        type: 'textarea_structure',
        message: 'Textarea missing rows attribute',
        severity: 'warning',
        element: `#${$textarea.attr('id')}`,
        fix: 'Add rows="6" attribute for proper sizing'
      });
    }
    
    // Check for self-closing textarea (wrong)
    const html = $.html(textarea);
    if (html.endsWith('/>')) {
      errors.push({
        type: 'textarea_syntax',
        message: 'Textarea should not be self-closing (needs closing tag)',
        severity: 'error',
        element: `#${$textarea.attr('id')}`,
        fix: 'Use <textarea>...</textarea> not <textarea />'
      });
    }
  });
}

/**
 * Validate Checkbox component
 */
function validateCheckbox($, errors, warnings) {
  const checkboxes = $('.ecl-checkbox');
  
  checkboxes.each((i, checkbox) => {
    const $checkbox = $(checkbox);
    const $input = $checkbox.find('input.ecl-checkbox__input');
    const $label = $checkbox.find('label.ecl-checkbox__label');
    const $box = $label.find('.ecl-checkbox__box');
    const $icon = $box.find('.ecl-checkbox__icon');
    
    if ($input.length === 0) {
      errors.push({
        type: 'checkbox_structure',
        message: 'Checkbox missing input element',
        severity: 'error',
        element: '.ecl-checkbox'
      });
    }
    
    if ($label.length === 0) {
      errors.push({
        type: 'checkbox_structure',
        message: 'Checkbox missing label element',
        severity: 'error',
        element: '.ecl-checkbox'
      });
    }
    
    if ($box.length === 0) {
      errors.push({
        type: 'checkbox_structure',
        message: 'Checkbox label missing .ecl-checkbox__box span',
        severity: 'error',
        element: '.ecl-checkbox__label',
        fix: 'Add <span class="ecl-checkbox__box"><svg>...</svg></span> inside label'
      });
    }
    
    if ($icon.length === 0 && $box.length > 0) {
      errors.push({
        type: 'checkbox_icon',
        message: 'Checkbox missing check icon SVG',
        severity: 'error',
        element: '.ecl-checkbox__box',
        fix: 'Add <svg class="ecl-icon ecl-icon--s ecl-checkbox__icon"><use xlink:href="icons.svg#check"></use></svg>'
      });
    }
  });
  
  // Check for single checkbox wrapped in fieldset (wrong)
  $('fieldset').each((i, fieldset) => {
    const $fieldset = $(fieldset);
    const checkboxes = $fieldset.find('.ecl-checkbox');
    
    if (checkboxes.length === 1 && !$fieldset.find('legend').length) {
      warnings.push({
        type: 'checkbox_fieldset',
        message: 'Single checkbox should NOT be wrapped in fieldset. Fieldsets are for checkbox groups only.',
        severity: 'warning',
        element: 'fieldset',
        fix: 'Remove fieldset wrapper for single checkbox'
      });
    }
  });
}

/**
 * Validate Radio component
 */
function validateRadio($, errors, warnings) {
  const radios = $('.ecl-radio');
  
  // Radio buttons should always be in a fieldset
  radios.each((i, radio) => {
    const $radio = $(radio);
    const $fieldset = $radio.closest('fieldset');
    
    if ($fieldset.length === 0) {
      errors.push({
        type: 'radio_structure',
        message: 'Radio buttons must be wrapped in a fieldset',
        severity: 'error',
        element: '.ecl-radio',
        fix: 'Wrap radio group in <fieldset class="ecl-form-group"><legend>...</legend>...</fieldset>'
      });
    }
  });
}

/**
 * Validate complete form structure
 */
function validateCompleteForm($, errors, warnings) {
  const forms = $('form');
  
  forms.each((i, form) => {
    const $form = $(form);
    const formGroups = $form.find('.ecl-form-group');
    
    if (formGroups.length === 0) {
      warnings.push({
        type: 'form_structure',
        message: 'Form contains no .ecl-form-group elements',
        severity: 'warning',
        element: 'form'
      });
    }
    
    // Check for submit button
    const submitButtons = $form.find('button[type="submit"], input[type="submit"]');
    if (submitButtons.length === 0) {
      warnings.push({
        type: 'form_structure',
        message: 'Form missing submit button',
        severity: 'warning',
        element: 'form',
        fix: 'Add submit button: <button type="submit" class="ecl-button ecl-button--primary">...</button>'
      });
    }
  });
}

/**
 * Get form-specific troubleshooting advice
 * @param {Array} errors - Validation errors
 * @param {Array} warnings - Validation warnings
 * @returns {Object} Troubleshooting guide
 */
export function getFormTroubleshooting(errors, warnings) {
  const issues = [...errors, ...warnings];
  const advice = [];
  
  // Helper text positioning issues
  if (issues.some(i => i.type === 'helper_text_position')) {
    advice.push({
      symptom: 'Labels floating above inputs with huge gaps',
      cause: 'Helper text is positioned AFTER the input instead of BEFORE',
      fix: 'Move .ecl-help-block to be between label and input',
      priority: 'CRITICAL'
    });
  }
  
  // Spacing issues
  if (issues.some(i => i.type === 'form_spacing')) {
    advice.push({
      symptom: 'Excessive spacing between form fields',
      cause: 'Extra utility margin classes on .ecl-form-group',
      fix: 'Remove ecl-u-mb-*, ecl-u-mt-* classes from form groups',
      priority: 'HIGH'
    });
  }
  
  // Select icon issues
  if (issues.some(i => i.type === 'select_icon_structure')) {
    advice.push({
      symptom: 'Select dropdown icon is interactive or looks wrong',
      cause: 'Icon wrapped in button element',
      fix: 'Use just SVG: <div class="ecl-select__icon"><svg>...</svg></div>',
      priority: 'HIGH'
    });
  }
  
  // Checkbox issues
  if (issues.some(i => i.type === 'checkbox_icon' || i.type === 'checkbox_structure')) {
    advice.push({
      symptom: 'Checkboxes without visible boxes',
      cause: 'Missing .ecl-checkbox__box or SVG icon sprite not loading',
      fix: 'Verify checkbox structure and SVG sprite path',
      priority: 'HIGH'
    });
  }
  
  // Required indicator issues
  if (issues.some(i => i.type === 'required_indicator')) {
    advice.push({
      symptom: 'Required indicators (*) not styled properly',
      cause: 'Missing .ecl-form-label__required class or using wrong class on label',
      fix: 'Use <span class="ecl-form-label__required" role="note" aria-label="required">*</span>',
      priority: 'MEDIUM'
    });
  }
  
  return {
    total_issues: issues.length,
    critical_issues: errors.length,
    troubleshooting_advice: advice,
    quick_fixes: advice.filter(a => a.priority === 'CRITICAL' || a.priority === 'HIGH')
  };
}
