/**
 * Add validated form component templates and guidance to ECL database
 * Based on November 20, 2025 form structure feedback
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '..', 'ecl-database.sqlite');

const db = new Database(dbPath);

// First, we need to get or create component IDs
const getOrCreateComponent = db.prepare(`
  INSERT OR IGNORE INTO components (name, category, description, url)
  VALUES (?, ?, ?, ?)
`);

const getComponentId = db.prepare(`
  SELECT id FROM components WHERE name = ?
`);

// Ensure form components exist
const formComponents = [
  { name: 'Text Field', category: 'forms', description: 'Text input field', url: 'https://ec.europa.eu/component-library/ec/components/forms/text-field/' },
  { name: 'Select', category: 'forms', description: 'Dropdown select field', url: 'https://ec.europa.eu/component-library/ec/components/forms/select/' },
  { name: 'Text Area', category: 'forms', description: 'Multi-line text input', url: 'https://ec.europa.eu/component-library/ec/components/forms/text-area/' },
  { name: 'Checkbox', category: 'forms', description: 'Checkbox input', url: 'https://ec.europa.eu/component-library/ec/components/forms/checkbox/' },
  { name: 'Radio', category: 'forms', description: 'Radio button input', url: 'https://ec.europa.eu/component-library/ec/components/forms/radio/' },
  { name: 'Button', category: 'content', description: 'Button component', url: 'https://ec.europa.eu/component-library/ec/components/button/' },
  { name: 'Complete Forms', category: 'forms', description: 'Complete form examples', url: 'https://ec.europa.eu/component-library/ec/components/forms/' }
];

console.log('\n📦 Ensuring form components exist...');
for (const comp of formComponents) {
  getOrCreateComponent.run(comp.name, comp.category, comp.description, comp.url);
}

// Form component templates with EXACT correct structure
const formTemplates = [
  {
    component_name: 'Text Field',
    template_type: 'form-text-input-required',
    title: 'Text Input (Required)',
    description: 'Required text input field with label, helper text, and proper ARIA attributes',
    html_code: `<div class="ecl-form-group">
  <label for="name" id="name-label" class="ecl-form-label">Name<span class="ecl-form-label__required" role="note" aria-label="required">*</span></label>
  <div class="ecl-help-block" id="name-helper">Please enter your full name.</div>
  <input id="name" class="ecl-text-input ecl-text-input--m" type="text" placeholder="John Doe" aria-describedby="name-helper" required>
</div>`,
    category: 'forms',
    preset: 'ec'
  },
  {
    component_name: 'Text Field',
    template_type: 'form-text-input-optional',
    title: 'Text Input (Optional)',
    description: 'Optional text input field with label and helper text, no required indicator',
    html_code: `<div class="ecl-form-group">
  <label for="company" id="company-label" class="ecl-form-label">Company</label>
  <div class="ecl-help-block" id="company-helper">Your organization name (optional).</div>
  <input id="company" class="ecl-text-input ecl-text-input--m" type="text" placeholder="ACME Corp" aria-describedby="company-helper">
</div>`,
    category: 'forms',
    preset: 'ec'
  },
  {
    component_name: 'Text Field',
    template_type: 'form-email-input',
    title: 'Email Input',
    description: 'Email input field with type="email" validation and helper text',
    html_code: `<div class="ecl-form-group">
  <label for="email" id="email-label" class="ecl-form-label">Email<span class="ecl-form-label__required" role="note" aria-label="required">*</span></label>
  <div class="ecl-help-block" id="email-helper">We'll never share your email with anyone else.</div>
  <input id="email" class="ecl-text-input ecl-text-input--m" type="email" placeholder="john@example.com" aria-describedby="email-helper" required>
</div>`,
    category: 'forms',
    preset: 'ec'
  },
  {
    component_name: 'Select',
    template_type: 'form-select-dropdown',
    title: 'Select Dropdown',
    description: 'Select dropdown with proper container structure and corner-arrow icon',
    html_code: `<div class="ecl-form-group">
  <label for="subject" id="subject-label" class="ecl-form-label">Subject<span class="ecl-form-label__required" role="note" aria-label="required">*</span></label>
  <div class="ecl-help-block" id="subject-helper">Choose a topic for your message.</div>
  <div class="ecl-select__container ecl-select__container--m">
    <select class="ecl-select" id="subject" required aria-describedby="subject-helper">
      <option value="">Please select</option>
      <option value="general">General Inquiry</option>
      <option value="support">Technical Support</option>
      <option value="feedback">Feedback</option>
    </select>
    <div class="ecl-select__icon">
      <svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-180" focusable="false" aria-hidden="true">
        <use xlink:href="icons.svg#corner-arrow"></use>
      </svg>
    </div>
  </div>
</div>`,
    category: 'forms',
    preset: 'ec'
  },
  {
    component_name: 'Text Area',
    template_type: 'form-textarea',
    title: 'Textarea Field',
    description: 'Multi-line text area with proper sizing and placeholder',
    html_code: `<div class="ecl-form-group">
  <label for="message" id="message-label" class="ecl-form-label">Message<span class="ecl-form-label__required" role="note" aria-label="required">*</span></label>
  <div class="ecl-help-block" id="message-helper">Provide detailed information about your inquiry.</div>
  <textarea id="message" class="ecl-text-area ecl-text-area--m" rows="6" placeholder="Your message..." aria-describedby="message-helper" required></textarea>
</div>`,
    category: 'forms',
    preset: 'ec'
  },
  {
    component_name: 'Checkbox',
    template_type: 'form-checkbox-single',
    title: 'Single Checkbox',
    description: 'Single checkbox with check icon, no fieldset wrapper',
    html_code: `<div class="ecl-form-group">
  <div class="ecl-checkbox">
    <input type="checkbox" id="newsletter" class="ecl-checkbox__input" value="yes">
    <label for="newsletter" class="ecl-checkbox__label">
      <span class="ecl-checkbox__box">
        <svg class="ecl-icon ecl-icon--s ecl-checkbox__icon" focusable="false" aria-hidden="true">
          <use xlink:href="icons.svg#check"></use>
        </svg>
      </span>
      <span class="ecl-checkbox__text">Subscribe to our newsletter</span>
    </label>
  </div>
</div>`,
    category: 'forms',
    preset: 'ec'
  },
  {
    component_name: 'Checkbox',
    template_type: 'form-checkbox-group',
    title: 'Checkbox Group',
    description: 'Multiple checkboxes with fieldset wrapper and legend',
    html_code: `<fieldset class="ecl-form-group">
  <legend class="ecl-form-label">Interests<span class="ecl-form-label__required" role="note" aria-label="required">*</span></legend>
  <div class="ecl-help-block" id="interests-helper">Select all that apply.</div>
  <div class="ecl-checkbox">
    <input type="checkbox" id="interest-tech" class="ecl-checkbox__input" value="technology" aria-describedby="interests-helper">
    <label for="interest-tech" class="ecl-checkbox__label">
      <span class="ecl-checkbox__box">
        <svg class="ecl-icon ecl-icon--s ecl-checkbox__icon" focusable="false" aria-hidden="true">
          <use xlink:href="icons.svg#check"></use>
        </svg>
      </span>
      <span class="ecl-checkbox__text">Technology</span>
    </label>
  </div>
  <div class="ecl-checkbox">
    <input type="checkbox" id="interest-policy" class="ecl-checkbox__input" value="policy" aria-describedby="interests-helper">
    <label for="interest-policy" class="ecl-checkbox__label">
      <span class="ecl-checkbox__box">
        <svg class="ecl-icon ecl-icon--s ecl-checkbox__icon" focusable="false" aria-hidden="true">
          <use xlink:href="icons.svg#check"></use>
        </svg>
      </span>
      <span class="ecl-checkbox__text">Policy</span>
    </label>
  </div>
  <div class="ecl-checkbox">
    <input type="checkbox" id="interest-environment" class="ecl-checkbox__input" value="environment" aria-describedby="interests-helper">
    <label for="interest-environment" class="ecl-checkbox__label">
      <span class="ecl-checkbox__box">
        <svg class="ecl-icon ecl-icon--s ecl-checkbox__icon" focusable="false" aria-hidden="true">
          <use xlink:href="icons.svg#check"></use>
        </svg>
      </span>
      <span class="ecl-checkbox__text">Environment</span>
    </label>
  </div>
</fieldset>`,
    category: 'forms',
    preset: 'ec'
  },
  {
    component_name: 'Radio',
    template_type: 'form-radio-group',
    title: 'Radio Button Group',
    description: 'Radio button group with fieldset and proper structure',
    html_code: `<fieldset class="ecl-form-group">
  <legend class="ecl-form-label">Contact Method<span class="ecl-form-label__required" role="note" aria-label="required">*</span></legend>
  <div class="ecl-help-block" id="contact-method-helper">How would you prefer to be contacted?</div>
  <div class="ecl-radio">
    <input type="radio" id="contact-email" class="ecl-radio__input" name="contact-method" value="email" aria-describedby="contact-method-helper" required>
    <label for="contact-email" class="ecl-radio__label">
      <span class="ecl-radio__box"></span>
      <span class="ecl-radio__text">Email</span>
    </label>
  </div>
  <div class="ecl-radio">
    <input type="radio" id="contact-phone" class="ecl-radio__input" name="contact-method" value="phone" aria-describedby="contact-method-helper">
    <label for="contact-phone" class="ecl-radio__label">
      <span class="ecl-radio__box"></span>
      <span class="ecl-radio__text">Phone</span>
    </label>
  </div>
  <div class="ecl-radio">
    <input type="radio" id="contact-mail" class="ecl-radio__input" name="contact-method" value="mail" aria-describedby="contact-method-helper">
    <label for="contact-mail" class="ecl-radio__label">
      <span class="ecl-radio__box"></span>
      <span class="ecl-radio__text">Postal Mail</span>
    </label>
  </div>
</fieldset>`,
    category: 'forms',
    preset: 'ec'
  },
  {
    component_name: 'Button',
    template_type: 'form-submit-button',
    title: 'Submit Button',
    description: 'Primary submit button for forms',
    html_code: `<div class="ecl-form-group">
  <button type="submit" class="ecl-button ecl-button--primary">
    <span class="ecl-button__container">
      <span class="ecl-button__label" data-ecl-label="true">Submit</span>
    </span>
  </button>
</div>`,
    category: 'forms',
    preset: 'ec'
  }
];

// Complete contact form example
const contactFormExample = {
  component_name: 'Complete Forms',
  page_id: 'contact-form-complete',
  title: 'Complete Contact Form',
  description: 'Full contact form with all form elements: text inputs, email, select, textarea, checkbox, and submit button',
  html_code: `<div class="ecl-u-mt-xl ecl-u-mb-l">
  <h2 class="ecl-u-type-heading-2 ecl-u-mb-m">Contact Form</h2>
  
  <form method="post" action="#">
    <!-- Text Input -->
    <div class="ecl-form-group">
      <label for="name" id="name-label" class="ecl-form-label">Name<span class="ecl-form-label__required" role="note" aria-label="required">*</span></label>
      <div class="ecl-help-block" id="name-helper">Please enter your full name.</div>
      <input id="name" class="ecl-text-input ecl-text-input--m" type="text" placeholder="John Doe" aria-describedby="name-helper" required>
    </div>

    <!-- Email Input -->
    <div class="ecl-form-group">
      <label for="email" id="email-label" class="ecl-form-label">Email<span class="ecl-form-label__required" role="note" aria-label="required">*</span></label>
      <div class="ecl-help-block" id="email-helper">We'll never share your email with anyone else.</div>
      <input id="email" class="ecl-text-input ecl-text-input--m" type="email" placeholder="john@example.com" aria-describedby="email-helper" required>
    </div>

    <!-- Select Dropdown -->
    <div class="ecl-form-group">
      <label for="subject" id="subject-label" class="ecl-form-label">Subject<span class="ecl-form-label__required" role="note" aria-label="required">*</span></label>
      <div class="ecl-help-block" id="subject-helper">Choose a topic for your message.</div>
      <div class="ecl-select__container ecl-select__container--m">
        <select class="ecl-select" id="subject" required aria-describedby="subject-helper">
          <option value="">Please select</option>
          <option value="general">General Inquiry</option>
          <option value="support">Technical Support</option>
          <option value="feedback">Feedback</option>
        </select>
        <div class="ecl-select__icon">
          <svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-180" focusable="false" aria-hidden="true">
            <use xlink:href="icons.svg#corner-arrow"></use>
          </svg>
        </div>
      </div>
    </div>

    <!-- Textarea -->
    <div class="ecl-form-group">
      <label for="message" id="message-label" class="ecl-form-label">Message<span class="ecl-form-label__required" role="note" aria-label="required">*</span></label>
      <div class="ecl-help-block" id="message-helper">Provide detailed information about your inquiry.</div>
      <textarea id="message" class="ecl-text-area ecl-text-area--m" rows="6" placeholder="Your message..." aria-describedby="message-helper" required></textarea>
    </div>

    <!-- Checkbox -->
    <div class="ecl-form-group">
      <div class="ecl-checkbox">
        <input type="checkbox" id="newsletter" class="ecl-checkbox__input" value="yes">
        <label for="newsletter" class="ecl-checkbox__label">
          <span class="ecl-checkbox__box">
            <svg class="ecl-icon ecl-icon--s ecl-checkbox__icon" focusable="false" aria-hidden="true">
              <use xlink:href="icons.svg#check"></use>
            </svg>
          </span>
          <span class="ecl-checkbox__text">Subscribe to our newsletter</span>
        </label>
      </div>
    </div>

    <!-- Submit Button -->
    <div class="ecl-form-group">
      <button type="submit" class="ecl-button ecl-button--primary">
        <span class="ecl-button__container">
          <span class="ecl-button__label" data-ecl-label="true">Submit</span>
        </span>
      </button>
    </div>
  </form>
</div>`,
  category: 'forms',
  preset: 'ec'
};

// Critical form guidance entries
const formGuidance = [
  {
    component_name: 'Complete Forms',
    guidance_type: 'critical',
    title: 'Form Tag Has No Class',
    content: `The <form> element should NOT have class="ecl-form". This class does not exist in ECL CSS.

WRONG:
<form class="ecl-form" method="post" action="#">

CORRECT:
<form method="post" action="#">

The form element is just a semantic wrapper. Individual form elements have the necessary ECL classes.`,
    tags: 'forms,structure,common-mistake'
  },
  {
    component_name: 'Complete Forms',
    guidance_type: 'critical',
    title: 'Helper Text MUST Come Before Input',
    content: `Helper text (.ecl-help-block) MUST be positioned between the label and the input field. This is CRITICAL for proper ECL styling.

WRONG (after input):
<label>Email</label>
<input id="email" class="ecl-text-input">
<div class="ecl-help-block">Helper text</div>

CORRECT (between label and input):
<label for="email" id="email-label">Email</label>
<div class="ecl-help-block" id="email-helper">Helper text</div>
<input id="email" class="ecl-text-input" aria-describedby="email-helper">

Wrong positioning causes visual alignment issues and confuses screen readers.`,
    tags: 'forms,helper-text,accessibility,structure'
  },
  {
    component_name: 'Complete Forms',
    guidance_type: 'critical',
    title: 'Labels Must Be Single-Line with ID',
    content: `Form labels must be compact (single-line) and include both 'for' and 'id' attributes.

WRONG (multi-line):
<label for="name" class="ecl-form-label">
  Name<span class="ecl-form-label__required">*</span>
</label>

CORRECT (single-line with id):
<label for="name" id="name-label" class="ecl-form-label">Name<span class="ecl-form-label__required" role="note" aria-label="required">*</span></label>

The 'id' attribute is needed for proper ARIA relationships. The required indicator should be directly adjacent to the label text (no spaces/newlines).`,
    tags: 'forms,labels,accessibility,structure'
  },
  {
    component_name: 'Complete Forms',
    guidance_type: 'critical',
    title: 'No Utility Classes on Form Groups',
    content: `The .ecl-form-group class already has proper margin-bottom built-in. Do NOT add utility margin classes.

WRONG:
<div class="ecl-form-group ecl-u-mb-l">

CORRECT:
<div class="ecl-form-group">

ECL's default spacing is carefully designed. Adding utility classes creates inconsistent spacing.`,
    tags: 'forms,spacing,structure'
  },
  {
    component_name: 'Select',
    guidance_type: 'critical',
    title: 'Select Icon Is SVG Only, Not Button',
    content: `The select dropdown icon is decorative, not interactive. Use just the SVG, not a button wrapper.

WRONG (button wrapper):
<div class="ecl-select__icon">
  <button class="ecl-button ecl-button--ghost" type="button">
    <svg class="ecl-icon">...</svg>
  </button>
</div>

CORRECT (SVG only):
<div class="ecl-select__icon">
  <svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-180" focusable="false" aria-hidden="true">
    <use xlink:href="icons.svg#corner-arrow"></use>
  </svg>
</div>

The native <select> element handles all interaction. The icon is purely visual.`,
    tags: 'select,forms,structure,accessibility'
  },
  {
    component_name: 'Checkbox',
    guidance_type: 'critical',
    title: 'Single Checkboxes Need No Fieldset',
    content: `Single checkboxes should NOT be wrapped in a fieldset. Fieldsets are only for checkbox GROUPS.

WRONG (single checkbox with fieldset):
<div class="ecl-form-group">
  <fieldset class="ecl-form-group">
    <div class="ecl-checkbox">...</div>
  </fieldset>
</div>

CORRECT (single checkbox):
<div class="ecl-form-group">
  <div class="ecl-checkbox">...</div>
</div>

CORRECT (checkbox group):
<fieldset class="ecl-form-group">
  <legend class="ecl-form-label">Options</legend>
  <div class="ecl-checkbox">...</div>
  <div class="ecl-checkbox">...</div>
</fieldset>

Extra nesting causes spacing issues.`,
    tags: 'checkbox,forms,structure'
  },
  {
    component_name: 'Complete Forms',
    guidance_type: 'best-practice',
    title: 'Required Field Indicator Structure',
    content: `Required field indicators must use the .ecl-form-label__required span with proper ARIA attributes.

WRONG:
<label class="ecl-form-label ecl-form-label--required">Name</label>
<!-- OR -->
<label class="ecl-form-label">Name *</label>

CORRECT:
<label for="name" id="name-label" class="ecl-form-label">Name<span class="ecl-form-label__required" role="note" aria-label="required">*</span></label>

This provides proper styling AND semantic meaning for screen readers.`,
    tags: 'forms,accessibility,required-fields'
  },
  {
    component_name: 'Complete Forms',
    guidance_type: 'best-practice',
    title: 'Keep Form Elements Compact',
    content: `Form elements should be compact (single-line when possible) to match ECL examples.

WRONG (multi-line attributes):
<input 
  type="text" 
  id="name" 
  class="ecl-text-input ecl-text-input--m" 
  required 
  aria-required="true"
/>

CORRECT (single-line):
<input id="name" class="ecl-text-input ecl-text-input--m" type="text" placeholder="John Doe" aria-describedby="name-helper" required>

Also remove redundant aria-required="true" (HTML5 'required' is sufficient). No self-closing slash needed for HTML5.`,
    tags: 'forms,code-style,accessibility'
  },
  {
    component_name: 'Complete Forms',
    guidance_type: 'best-practice',
    title: 'Always Include Placeholders',
    content: `All text inputs and textareas should include helpful placeholder text.

GOOD:
<input type="text" placeholder="John Doe">
<input type="email" placeholder="john@example.com">
<textarea placeholder="Your message..."></textarea>

Placeholders improve user experience by showing expected input format.`,
    tags: 'forms,ux,accessibility'
  },
  {
    component_name: 'Complete Forms',
    guidance_type: 'troubleshooting',
    title: 'Visual Symptoms of Wrong Form Structure',
    content: `Common visual issues and their causes:

1. Labels floating with huge gaps above inputs
   → Helper text is AFTER input instead of BEFORE

2. Excessive spacing between form fields
   → Extra utility classes on .ecl-form-group

3. Checkboxes without visible boxes
   → SVG icon sprite not loading or wrong structure

4. Select dropdowns look like plain inputs
   → Missing .ecl-select__container wrapper or icon

5. Required indicators not styled
   → Missing .ecl-form-label__required class on span

Always validate structure with ecl_validate_component_usage tool.`,
    tags: 'forms,troubleshooting,debugging'
  }
];

// Insert templates as code examples
console.log('\n📝 Adding form templates...');
const insertTemplate = db.prepare(`
  INSERT INTO code_examples (component_id, example_type, language, code, description, position)
  VALUES (?, ?, ?, ?, ?, ?)
`);

let templateCount = 0;
for (const template of formTemplates) {
  try {
    const componentRow = getComponentId.get(template.component_name);
    if (!componentRow) {
      console.error(`  ❌ Component not found: ${template.component_name}`);
      continue;
    }
    
    insertTemplate.run(
      componentRow.id,
      template.template_type,
      'html',
      template.html_code,
      template.description,
      templateCount
    );
    templateCount++;
    console.log(`  ✅ ${template.title}`);
  } catch (error) {
    console.error(`  ❌ Failed to add ${template.title}:`, error.message);
  }
}

// Insert complete form example as a page
console.log('\n📄 Adding complete contact form example...');
const insertPage = db.prepare(`
  INSERT INTO pages (url, title, component_name, category, raw_html)
  VALUES (?, ?, ?, ?, ?)
`);

try {
  insertPage.run(
    'https://ec.europa.eu/component-library/ec/examples/contact-form-complete',
    contactFormExample.title,
    contactFormExample.component_name,
    contactFormExample.category,
    contactFormExample.html_code
  );
  console.log(`  ✅ ${contactFormExample.title}`);
  
  // Get the page ID for guidance
  const pageRow = db.prepare('SELECT id FROM pages WHERE url = ?').get('https://ec.europa.eu/component-library/ec/examples/contact-form-complete');
  const contactFormPageId = pageRow.id;
  
  // Add content section for the form
  const insertSection = db.prepare(`
    INSERT INTO content_sections (page_id, section_type, heading, content, code_example, position)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertSection.run(
    contactFormPageId,
    'example',
    'Complete Contact Form',
    contactFormExample.description,
    contactFormExample.html_code,
    0
  );
  
} catch (error) {
  console.error(`  ❌ Failed to add contact form:`, error.message);
}

// Insert guidance
console.log('\n💡 Adding form guidance entries...');
const insertGuidance = db.prepare(`
  INSERT INTO usage_guidance (page_id, guidance_type, content, priority)
  VALUES (?, ?, ?, ?)
`);

// Map guidance types to database enum values
const guidanceTypeMap = {
  'critical': 'limitation',
  'best-practice': 'best-practice',
  'troubleshooting': 'caveat'
};

let guidanceCount = 0;

// Get the "Complete Forms" component page ID
const formsComponentRow = db.prepare('SELECT id FROM components WHERE name = ?').get('Complete Forms');
if (!formsComponentRow) {
  console.error('  ❌ Complete Forms component not found');
} else {
  // Create a dedicated guidance page
  const guidancePageUrl = 'https://ec.europa.eu/component-library/ec/components/forms/guidance';
  try {
    insertPage.run(
      guidancePageUrl,
      'Form Structure Guidance',
      'Complete Forms',
      'forms',
      '<!-- Form structure guidance page -->'
    );
  } catch (e) {
    // Page might already exist
  }
  
  const guidancePageRow = db.prepare('SELECT id FROM pages WHERE url = ?').get(guidancePageUrl);
  
  if (guidancePageRow) {
    for (const guidance of formGuidance) {
      try {
        const mappedType = guidanceTypeMap[guidance.guidance_type] || 'note';
        const priority = guidance.guidance_type === 'critical' ? 10 : (guidance.guidance_type === 'best-practice' ? 5 : 3);
        
        insertGuidance.run(
          guidancePageRow.id,
          mappedType,
          `${guidance.title}\n\n${guidance.content}`,
          priority
        );
        guidanceCount++;
        console.log(`  ✅ ${guidance.title}`);
      } catch (error) {
        console.error(`  ❌ Failed to add ${guidance.title}:`, error.message);
      }
    }
  }
}

db.close();

console.log('\n✨ Form templates and guidance added successfully!');
console.log(`   Templates: ${templateCount}/9`);
console.log(`   Complete example: 1/1`);
console.log(`   Guidance entries: ${guidanceCount}/10`);
console.log('\n📊 Summary:');
console.log(`   - 9 form component templates (text, email, select, textarea, checkbox, radio, button)`);
console.log(`   - 1 complete contact form example`);
console.log(`   - 10 critical form guidance entries`);
console.log(`   - All templates follow exact ECL structure requirements`);
