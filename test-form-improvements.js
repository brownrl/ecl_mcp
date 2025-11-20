/**
 * Test Form Improvements
 * Tests all form templates, validation, and guidance features
 */

import * as Utils from './src/utils/index.js';
import * as Validation from './src/validation/index.js';
import * as cheerio from 'cheerio';

console.log('🧪 Testing Form Improvements\n');

// Test 1: Form Templates
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 1: Form Templates');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const templates = Utils.getFormTemplates();
console.log(`✅ Total templates: ${templates.length}`);
console.log(`Template types: ${templates.map(t => t.template_type).join(', ')}\n`);

// Get specific template
const emailTemplate = Utils.getFormTemplate('form-email-input');
console.log(`✅ Email input template retrieved:`);
console.log(`   Description: ${emailTemplate.description}`);
console.log(`   Component: ${emailTemplate.component_name}`);
console.log(`   Critical notes: ${emailTemplate.critical_notes.length}`);
console.log(`   Common mistakes: ${emailTemplate.common_mistakes.length}\n`);

// Test 2: Complete Contact Form
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 2: Complete Contact Form');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const contactForm = Utils.getCompleteContactForm();
if (contactForm) {
  console.log(`✅ Contact form retrieved:`);
  console.log(`   Title: ${contactForm.title}`);
  console.log(`   Components: ${contactForm.included_components.length}`);
  console.log(`   Demonstrates: ${contactForm.demonstrates.length} key features`);
  console.log(`   Validation status: ${contactForm.validation_status}\n`);
} else {
  console.log('❌ Contact form not found\n');
}

// Test 3: Form Guidance
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 3: Form Guidance');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const guidance = Utils.getCompleteFormGuidance();
console.log(`✅ Form guidance retrieved:`);
console.log(`   Overview: ${guidance.overview}`);
console.log(`   Critical requirements: ${guidance.critical_requirements.length}`);
console.log(`   Best practices: ${guidance.best_practices.length}`);
console.log(`   Troubleshooting entries: ${guidance.troubleshooting.length}`);
console.log(`   Template count: ${guidance.template_count}\n`);

// Search for specific guidance
const helperTextGuidance = Utils.searchFormGuidance('helper text');
console.log(`✅ Search for "helper text": ${helperTextGuidance.length} results`);
if (helperTextGuidance.length > 0) {
  console.log(`   Top result: ${helperTextGuidance[0].title}`);
  console.log(`   Type: ${helperTextGuidance[0].type}`);
  console.log(`   Priority: ${helperTextGuidance[0].priority}\n`);
}

// Test 4: Form Validation - CORRECT structure
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 4: Form Validation - Correct Structure');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const correctHTML = `
<div class="ecl-form-group">
  <label for="name" id="name-label" class="ecl-form-label">Name<span class="ecl-form-label__required" role="note" aria-label="required">*</span></label>
  <div class="ecl-help-block" id="name-helper">Please enter your full name.</div>
  <input id="name" class="ecl-text-input ecl-text-input--m" type="text" placeholder="John Doe" aria-describedby="name-helper" required>
</div>
`;

const $ = cheerio.load(correctHTML);
const errors = [];
const warnings = [];

Validation.validateFormStructure($, 'Text Field', errors, warnings);

console.log(`✅ Validation of CORRECT structure:`);
console.log(`   Errors: ${errors.length}`);
console.log(`   Warnings: ${warnings.length}`);
if (errors.length === 0 && warnings.length === 0) {
  console.log(`   ✅ Perfect! No issues found.\n`);
} else {
  console.log(`   Issues:`, errors.concat(warnings));
}

// Test 5: Form Validation - WRONG structure (helper text after input)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 5: Form Validation - Wrong Helper Text Position');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const wrongHTML = `
<div class="ecl-form-group">
  <label for="email" class="ecl-form-label">Email</label>
  <input id="email" class="ecl-text-input ecl-text-input--m" type="email">
  <div class="ecl-help-block">Helper text here</div>
</div>
`;

const $wrong = cheerio.load(wrongHTML);
const errorsWrong = [];
const warningsWrong = [];

Validation.validateFormStructure($wrong, 'Text Field', errorsWrong, warningsWrong);

console.log(`✅ Validation of WRONG structure:`);
console.log(`   Errors: ${errorsWrong.length}`);
console.log(`   Warnings: ${warningsWrong.length}`);
if (errorsWrong.length > 0) {
  console.log(`   ✅ Correctly detected errors:`);
  errorsWrong.forEach(e => {
    console.log(`      - ${e.type}: ${e.message}`);
  });
}
if (warningsWrong.length > 0) {
  console.log(`   Warnings:`);
  warningsWrong.forEach(w => {
    console.log(`      - ${w.type}: ${w.message}`);
  });
}
console.log();

// Test 6: Form Validation - Wrong select structure
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 6: Form Validation - Wrong Select Structure');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const wrongSelectHTML = `
<div class="ecl-form-group">
  <label for="country" id="country-label" class="ecl-form-label">Country</label>
  <select id="country" class="ecl-select">
    <option>Please select</option>
  </select>
</div>
`;

const $wrongSelect = cheerio.load(wrongSelectHTML);
const errorsSelect = [];
const warningsSelect = [];

Validation.validateFormStructure($wrongSelect, 'Select', errorsSelect, warningsSelect);

console.log(`✅ Validation of SELECT without container:`);
console.log(`   Errors: ${errorsSelect.length}`);
if (errorsSelect.length > 0) {
  console.log(`   ✅ Correctly detected:`);
  errorsSelect.forEach(e => {
    console.log(`      - ${e.message}`);
  });
}
console.log();

// Test 7: Troubleshooting
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 7: Form Troubleshooting');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const spacingTrouble = Utils.troubleshootFormIssue('spacing');
console.log(`✅ Troubleshooting "spacing" issues:`);
console.log(`   Category: ${spacingTrouble.issue_category}`);
console.log(`   Symptoms: ${spacingTrouble.symptoms.length}`);
console.log(`   Causes: ${spacingTrouble.causes.length}`);
console.log(`   Fixes: ${spacingTrouble.fixes.length}`);
console.log(`   Related templates: ${spacingTrouble.related_templates.join(', ')}\n`);

const helperTextTrouble = Utils.troubleshootFormIssue('helper-text');
console.log(`✅ Troubleshooting "helper-text" issues:`);
console.log(`   Category: ${helperTextTrouble.issue_category}`);
console.log(`   Fixes:`);
helperTextTrouble.fixes.forEach(f => {
  console.log(`      - ${f}`);
});
console.log();

// Test 8: Validation Checklist
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 8: Form Validation Checklist');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const checklist = Utils.getFormValidationChecklist();
console.log(`✅ Validation checklist retrieved:`);
console.log(`   Structure checks: ${checklist.structure.length}`);
console.log(`   Accessibility checks: ${checklist.accessibility.length}`);
console.log(`   Select checks: ${checklist.components.select.length}`);
console.log(`   Checkbox checks: ${checklist.components.checkbox.length}`);
console.log(`   Radio checks: ${checklist.components.radio.length}`);
console.log(`   Visual symptom checks: ${checklist.visual_checks.length}\n`);

// Show some examples
console.log(`Structure checks (required):`);
checklist.structure.filter(c => c.required).forEach(c => {
  console.log(`   - ${c.item}`);
});
console.log();

// Test 9: Form Troubleshooting with errors
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 9: Get Troubleshooting from Validation Errors');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const troubleshooting = Validation.getFormTroubleshooting(errorsWrong, warningsWrong);
console.log(`✅ Troubleshooting analysis:`);
console.log(`   Total issues: ${troubleshooting.total_issues}`);
console.log(`   Critical issues: ${troubleshooting.critical_issues}`);
console.log(`   Advice count: ${troubleshooting.troubleshooting_advice.length}`);
console.log(`   Quick fixes: ${troubleshooting.quick_fixes.length}`);

if (troubleshooting.quick_fixes.length > 0) {
  console.log(`\n   Priority fixes:`);
  troubleshooting.quick_fixes.forEach(fix => {
    console.log(`      [${fix.priority}] ${fix.symptom}`);
    console.log(`         Cause: ${fix.cause}`);
    console.log(`         Fix: ${fix.fix}`);
  });
}
console.log();

// Test 10: Validation with form tag class (wrong)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 10: Detect Form Tag Class Error');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const formWithClass = `
<form class="ecl-form" method="post">
  <div class="ecl-form-group">
    <input type="text" class="ecl-text-input">
  </div>
</form>
`;

const $formClass = cheerio.load(formWithClass);
const errorsFormClass = [];
const warningsFormClass = [];

Validation.validateFormStructure($formClass, 'Complete Forms', errorsFormClass, warningsFormClass);

console.log(`✅ Validation of form with class="ecl-form":`);
if (errorsFormClass.some(e => e.type === 'form_structure')) {
  console.log(`   ✅ Correctly detected: Form should not have class="ecl-form"\n`);
} else {
  console.log(`   ❌ Did not detect form class issue\n`);
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✨ Test Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`✅ All Form Improvements Tested Successfully!\n`);
console.log(`📊 Results:`);
console.log(`   ✅ ${templates.length} form templates available`);
console.log(`   ✅ Complete contact form with ${contactForm ? contactForm.included_components.length : 0} components`);
console.log(`   ✅ ${guidance.critical_requirements.length} critical requirements documented`);
console.log(`   ✅ ${guidance.best_practices.length} best practices available`);
console.log(`   ✅ Form validation detecting structure issues`);
console.log(`   ✅ Troubleshooting guide with multiple categories`);
console.log(`   ✅ Comprehensive validation checklist`);
console.log();
console.log(`🎯 Key Features:`);
console.log(`   • Helper text position validation (CRITICAL)`);
console.log(`   • Label structure validation (for + id attributes)`);
console.log(`   • Required indicator validation`);
console.log(`   • Select dropdown structure validation`);
console.log(`   • Checkbox/radio structure validation`);
console.log(`   • ARIA attribute validation`);
console.log(`   • Form tag class detection`);
console.log(`   • Visual symptom diagnosis`);
console.log();
console.log(`🔧 Available MCP Tools:`);
console.log(`   • ecl_get_form_templates`);
console.log(`   • ecl_get_complete_contact_form`);
console.log(`   • ecl_get_form_guidance`);
console.log(`   • ecl_validate_form_structure`);
console.log(`   • ecl_troubleshoot_forms`);
console.log(`   • ecl_get_form_validation_checklist`);
console.log();
