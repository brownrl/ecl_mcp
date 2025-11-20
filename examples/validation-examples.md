# ECL Validation Examples

Complete examples demonstrating the validation and diagnostics tools.

## Table of Contents

- [Component Validation](#component-validation)
- [Accessibility Checking](#accessibility-checking)
- [Code Analysis](#code-analysis)
- [Conflict Detection](#conflict-detection)
- [Complete Pre-Deployment Workflow](#complete-pre-deployment-workflow)

---

## Component Validation

### Example 1: Valid Button

```javascript
const validation = await ecl_validate_component_usage({
  component: "button",
  htmlCode: `
    <button type="button" class="ecl-button ecl-button--primary">
      <span class="ecl-button__label">Submit</span>
    </button>
  `
});
```

**Result:**
```json
{
  "success": true,
  "data": {
    "component_name": "button",
    "quality_score": 95,
    "issues": [],
    "warnings": [],
    "suggestions": [
      {
        "type": "best_practice",
        "message": "Consider adding data-ecl-auto-init for JavaScript initialization"
      }
    ]
  }
}
```

### Example 2: Invalid Button (Missing Type)

```javascript
const validation = await ecl_validate_component_usage({
  component: "button",
  htmlCode: `<button class="ecl-button">Click me</button>`
});
```

**Result:**
```json
{
  "success": true,
  "data": {
    "component_name": "button",
    "quality_score": 70,
    "issues": [
      {
        "severity": "error",
        "message": "Button missing type attribute",
        "line": 1,
        "fix": "Add type=\"button\" or type=\"submit\" to button element",
        "example": "<button type=\"button\" class=\"ecl-button\">Click me</button>"
      }
    ],
    "warnings": [
      {
        "severity": "warning",
        "message": "Button missing proper structure",
        "fix": "Wrap text in <span class=\"ecl-button__label\">",
        "example": "<button type=\"button\" class=\"ecl-button\"><span class=\"ecl-button__label\">Click me</span></button>"
      }
    ]
  }
}
```

### Example 3: Card with JavaScript

```javascript
const validation = await ecl_validate_component_usage({
  component: "card",
  htmlCode: `
    <article class="ecl-card" data-ecl-auto-init="Card">
      <div class="ecl-card__image">
        <img src="image.jpg" alt="Card image" class="ecl-card__image-media" />
      </div>
      <div class="ecl-card__body">
        <h1 class="ecl-card__title">Card Title</h1>
        <p class="ecl-card__description">Description text</p>
      </div>
    </article>
  `,
  jsCode: `
    ECL.autoInit();
  `
});
```

**Result:**
```json
{
  "success": true,
  "data": {
    "component_name": "card",
    "quality_score": 90,
    "issues": [],
    "warnings": [],
    "suggestions": [
      {
        "type": "enhancement",
        "message": "Consider adding a call-to-action link in the card footer"
      }
    ],
    "guidance": {
      "dos": [
        "Use semantic HTML elements",
        "Always include alt text for images",
        "Keep card content concise"
      ],
      "donts": [
        "Don't nest interactive elements",
        "Don't use inline styles",
        "Avoid overly complex card layouts"
      ]
    }
  }
}
```

---

## Accessibility Checking

### Example 1: WCAG AA Compliance Check

```javascript
const accessibility = await ecl_check_accessibility({
  htmlCode: `
    <html lang="en">
      <head><title>Page Title</title></head>
      <body>
        <main id="main-content">
          <h1>Main Heading</h1>
          <img src="logo.png" alt="Company logo" />
          <button type="button" class="ecl-button">
            <span class="ecl-button__label">Click me</span>
          </button>
        </main>
      </body>
    </html>
  `,
  targetLevel: "AA"
});
```

**Result:**
```json
{
  "success": true,
  "data": {
    "wcag_a_compliant": true,
    "wcag_aa_compliant": true,
    "wcag_aaa_compliant": false,
    "compliance_level": "AA",
    "issues": [],
    "recommendations": [
      {
        "wcag_criterion": "2.4.8",
        "message": "Consider adding breadcrumbs for better navigation",
        "suggestion": "Help users understand their location in the site"
      }
    ],
    "wcag_details": {
      "level_a": { "passed": 9, "total": 9 },
      "level_aa": { "passed": 5, "total": 5 },
      "level_aaa": { "passed": 2, "total": 3 }
    }
  }
}
```

### Example 2: Failed Accessibility Check

```javascript
const accessibility = await ecl_check_accessibility({
  htmlCode: `
    <div>
      <img src="logo.png" />
      <div onclick="handleClick()">Click here</div>
      <input type="text" />
    </div>
  `,
  targetLevel: "A"
});
```

**Result:**
```json
{
  "success": true,
  "data": {
    "wcag_a_compliant": false,
    "wcag_aa_compliant": false,
    "wcag_aaa_compliant": false,
    "compliance_level": "None",
    "issues": [
      {
        "severity": "critical",
        "wcag_criterion": "1.1.1",
        "message": "Image missing alt attribute",
        "element": "<img src=\"logo.png\" />",
        "fix": "Add descriptive alt text to image",
        "example": "<img src=\"logo.png\" alt=\"Company logo\" />"
      },
      {
        "severity": "critical",
        "wcag_criterion": "2.1.1",
        "message": "Interactive element not keyboard accessible",
        "element": "<div onclick=\"handleClick()\">",
        "fix": "Use button element or add tabindex and keyboard handler",
        "example": "<button type=\"button\" onclick=\"handleClick()\">Click here</button>"
      },
      {
        "severity": "critical",
        "wcag_criterion": "4.1.2",
        "message": "Form input missing label",
        "element": "<input type=\"text\" />",
        "fix": "Add label element or aria-label attribute",
        "example": "<label for=\"name\">Name:</label><input type=\"text\" id=\"name\" />"
      },
      {
        "severity": "critical",
        "wcag_criterion": "2.4.2",
        "message": "Page missing title element",
        "fix": "Add <title> element in <head>",
        "example": "<head><title>Page Title</title></head>"
      }
    ],
    "recommendations": [],
    "wcag_details": {
      "level_a": { "passed": 5, "total": 9 },
      "level_aa": { "passed": 0, "total": 5 },
      "level_aaa": { "passed": 0, "total": 3 }
    }
  }
}
```

### Example 3: Component-Specific Accessibility

```javascript
const accessibility = await ecl_check_accessibility({
  htmlCode: `
    <button type="button" class="ecl-button ecl-button--ghost">
      <svg class="ecl-icon">
        <use href="icons.svg#close"></use>
      </svg>
    </button>
  `,
  component: "button",
  targetLevel: "AA"
});
```

**Result:**
```json
{
  "success": true,
  "data": {
    "wcag_a_compliant": false,
    "wcag_aa_compliant": false,
    "compliance_level": "None",
    "issues": [
      {
        "severity": "critical",
        "wcag_criterion": "4.1.2",
        "message": "Icon-only button missing accessible label",
        "element": "<button type=\"button\" class=\"ecl-button ecl-button--ghost\">",
        "fix": "Add aria-label or visually hidden text",
        "example": "<button type=\"button\" class=\"ecl-button\" aria-label=\"Close\">...</button>"
      }
    ],
    "recommendations": [
      {
        "message": "For icon buttons, ECL recommends using aria-label for screen readers"
      }
    ]
  }
}
```

---

## Code Analysis

### Example 1: High-Quality ECL Code

```javascript
const analysis = await ecl_analyze_ecl_code({
  htmlCode: `
    <div class="ecl-container">
      <button type="button" class="ecl-button ecl-button--primary" data-ecl-auto-init="Button">
        <span class="ecl-button__label">Submit</span>
      </button>
    </div>
  `,
  jsCode: `
    // Initialize ECL components
    ECL.autoInit();
    
    // Event delegation for buttons
    document.addEventListener('click', function(e) {
      if (e.target.closest('.ecl-button')) {
        handleButtonClick(e);
      }
    });
  `,
  cssCode: `
    .custom-component {
      color: var(--ecl-color-primary);
      padding: var(--ecl-spacing-m);
      font-family: var(--ecl-font-family);
    }
  `
});
```

**Result:**
```json
{
  "success": true,
  "data": {
    "components_detected": ["button"],
    "design_tokens_used": [
      "ecl-color-primary",
      "ecl-spacing-m",
      "ecl-font-family"
    ],
    "overall_quality_score": 95,
    "best_practices": {
      "score": 100,
      "issues": []
    },
    "maintainability": {
      "score": 95,
      "issues": []
    },
    "performance": {
      "score": 90,
      "issues": []
    },
    "recommendations": [
      "Excellent use of ECL design tokens",
      "Proper component initialization with data-ecl-auto-init",
      "Good use of event delegation"
    ],
    "conflicts": []
  }
}
```

### Example 2: Poor Quality Code with Issues

```javascript
const analysis = await ecl_analyze_ecl_code({
  htmlCode: `
    <div style="margin-top: 20px; color: #003399;">
      <button class="ecl-button" onclick="alert('clicked')">Click</button>
      <div class="card">
        <img src="image.jpg" />
      </div>
    </div>
  `,
  jsCode: `
    // Direct DOM manipulation
    document.querySelector('.card').innerHTML = '<div>New content</div>';
    document.getElementById('test').style.color = 'red';
    
    // Direct event handlers
    document.querySelector('.button').onclick = function() {
      alert('clicked');
    };
  `,
  cssCode: `
    .custom {
      color: #003399 !important;
      background: #ff0000 !important;
      padding: 16px !important;
      margin: 24px !important;
      font-size: 14px !important;
    }
  `
});
```

**Result:**
```json
{
  "success": true,
  "data": {
    "components_detected": ["button"],
    "design_tokens_used": [],
    "overall_quality_score": 45,
    "best_practices": {
      "score": 40,
      "issues": [
        {
          "severity": "error",
          "message": "Inline styles detected (3 instances)",
          "fix": "Use ECL utility classes or design tokens",
          "example": "class=\"ecl-u-mt-m\" instead of style=\"margin-top: 20px\""
        },
        {
          "severity": "error",
          "message": "Direct event handler in HTML (onclick)",
          "fix": "Use addEventListener in JavaScript",
          "example": "element.addEventListener('click', handleClick)"
        }
      ]
    },
    "maintainability": {
      "score": 35,
      "issues": [
        {
          "severity": "error",
          "message": "Hardcoded color values (2 instances: #003399, #ff0000)",
          "fix": "Use ECL design tokens",
          "example": "color: var(--ecl-color-primary)"
        },
        {
          "severity": "error",
          "message": "Hardcoded spacing values (2 instances: 16px, 24px)",
          "fix": "Use ECL spacing tokens",
          "example": "padding: var(--ecl-spacing-m)"
        },
        {
          "severity": "warning",
          "message": "Direct DOM manipulation (2 instances)",
          "fix": "Use component APIs or data binding",
          "example": "Use ECL component methods instead of innerHTML"
        }
      ]
    },
    "performance": {
      "score": 60,
      "issues": [
        {
          "severity": "warning",
          "message": "Excessive use of !important (5 instances)",
          "fix": "Review CSS specificity and remove !important",
          "example": "Use more specific selectors instead"
        }
      ]
    },
    "recommendations": [
      "Replace inline styles with ECL utility classes",
      "Use ECL design tokens instead of hardcoded values",
      "Remove direct event handlers, use addEventListener",
      "Avoid direct DOM manipulation, use component APIs",
      "Reduce use of !important in CSS"
    ],
    "conflicts": []
  }
}
```

### Example 3: Component Detection

```javascript
const analysis = await ecl_analyze_ecl_code({
  htmlCode: `
    <header class="ecl-site-header">
      <div class="ecl-container">
        <button class="ecl-button ecl-button--primary">Primary</button>
        <button class="ecl-button ecl-button--secondary">Secondary</button>
      </div>
    </header>
    <main>
      <article class="ecl-card">
        <div class="ecl-card__body">
          <h2 class="ecl-card__title">Title</h2>
        </div>
      </article>
      <div class="ecl-accordion" data-ecl-auto-init="Accordion">
        <div class="ecl-accordion__item">
          <h3 class="ecl-accordion__title">Item 1</h3>
        </div>
      </div>
    </main>
  `
});
```

**Result:**
```json
{
  "success": true,
  "data": {
    "components_detected": [
      "site-header",
      "button",
      "card",
      "accordion"
    ],
    "design_tokens_used": [],
    "overall_quality_score": 85,
    "recommendations": [
      "4 ECL components detected",
      "Consider adding design tokens for custom styling",
      "Good use of semantic HTML elements"
    ]
  }
}
```

---

## Conflict Detection

### Example 1: No Conflicts

```javascript
const conflicts = await ecl_check_conflicts({
  components: ["button", "card", "site-header"]
});
```

**Result:**
```json
{
  "success": true,
  "data": {
    "conflicts": [],
    "warnings": [],
    "compatibility": {
      "browser_support": "All modern browsers",
      "javascript_required": false,
      "known_issues": []
    }
  }
}
```

### Example 2: Potential Conflicts

```javascript
const conflicts = await ecl_check_conflicts({
  components: ["modal", "dropdown", "tooltip"],
  htmlCode: `
    <div class="ecl-modal">
      <div class="ecl-dropdown">
        <button class="ecl-dropdown__toggle">Toggle</button>
      </div>
    </div>
  `
});
```

**Result:**
```json
{
  "success": true,
  "data": {
    "conflicts": [
      {
        "severity": "warning",
        "components": ["modal", "dropdown"],
        "message": "Modal and dropdown may have z-index conflicts",
        "fix": "Ensure modal z-index is higher than dropdown, or close dropdown before opening modal",
        "documentation": "https://ec.europa.eu/component-library/..."
      }
    ],
    "warnings": [
      {
        "severity": "warning",
        "components": ["modal", "tooltip"],
        "message": "Multiple overlay components may cause focus management issues",
        "recommendation": "Ensure proper focus trap in modal"
      }
    ],
    "compatibility": {
      "browser_support": "All modern browsers",
      "javascript_required": true,
      "known_issues": [
        "iOS Safari may have issues with nested modals"
      ]
    }
  }
}
```

---

## Complete Pre-Deployment Workflow

```javascript
// Step 1: Validate all components
async function validatePage(pageHtml, pageJs, pageCss) {
  const results = {
    validation: [],
    accessibility: null,
    quality: null,
    conflicts: null,
    readyToDeploy: false
  };

  // 1. Validate each component
  const components = ["button", "card", "site-header"];
  for (const component of components) {
    const validation = await ecl_validate_component_usage({
      component: component,
      htmlCode: pageHtml,
      jsCode: pageJs
    });
    results.validation.push({
      component,
      score: validation.data.quality_score,
      issues: validation.data.issues.length
    });
  }

  // 2. Check WCAG AA compliance
  results.accessibility = await ecl_check_accessibility({
    htmlCode: pageHtml,
    targetLevel: "AA"
  });

  // 3. Analyze code quality (target: >85)
  results.quality = await ecl_analyze_ecl_code({
    htmlCode: pageHtml,
    jsCode: pageJs,
    cssCode: pageCss
  });

  // 4. Check for component conflicts
  results.conflicts = await ecl_check_conflicts({
    components: components,
    htmlCode: pageHtml
  });

  // 5. Determine if ready to deploy
  const avgValidationScore = results.validation.reduce((sum, v) => sum + v.score, 0) / results.validation.length;
  
  results.readyToDeploy = 
    avgValidationScore > 85 &&
    results.accessibility.data.wcag_aa_compliant &&
    results.quality.data.overall_quality_score > 85 &&
    results.conflicts.data.conflicts.length === 0;

  return results;
}

// Run validation
const pageHtml = `...`; // Your HTML
const pageJs = `...`;   // Your JavaScript
const pageCss = `...`;  // Your CSS

const results = await validatePage(pageHtml, pageJs, pageCss);

if (results.readyToDeploy) {
  console.log("✅ Page is ready to deploy!");
} else {
  console.log("❌ Page has issues:");
  console.log("- Validation scores:", results.validation);
  console.log("- WCAG AA compliant:", results.accessibility.data.wcag_aa_compliant);
  console.log("- Quality score:", results.quality.data.overall_quality_score);
  console.log("- Conflicts:", results.conflicts.data.conflicts.length);
}
```

**Example Output:**
```
✅ Page is ready to deploy!
- Average validation score: 90
- WCAG AA compliant: true
- Quality score: 88
- Conflicts: 0
```

---

## Best Practices

### 1. Validate Early and Often
```javascript
// Run validation during development, not just before deployment
const validation = await ecl_validate_component_usage({
  component: "button",
  htmlCode: myButtonHtml
});

if (validation.data.issues.length > 0) {
  console.log("Fix these issues:", validation.data.issues);
}
```

### 2. Target WCAG AA as Minimum
```javascript
// Always check for WCAG AA compliance
const accessibility = await ecl_check_accessibility({
  htmlCode: pageHtml,
  targetLevel: "AA" // Minimum for most projects
});

if (!accessibility.data.wcag_aa_compliant) {
  console.error("WCAG AA compliance required!");
}
```

### 3. Monitor Quality Scores
```javascript
// Set quality thresholds for your project
const QUALITY_THRESHOLD = 85;

const quality = await ecl_analyze_ecl_code({ htmlCode, jsCode, cssCode });

if (quality.data.overall_quality_score < QUALITY_THRESHOLD) {
  console.warn(`Quality score ${quality.data.overall_quality_score} below threshold ${QUALITY_THRESHOLD}`);
}
```

### 4. Check Conflicts for Complex UIs
```javascript
// Always check conflicts when using multiple interactive components
const conflicts = await ecl_check_conflicts({
  components: ["modal", "dropdown", "tooltip", "accordion"],
  htmlCode: pageHtml
});

if (conflicts.data.conflicts.length > 0) {
  console.error("Component conflicts detected:", conflicts.data.conflicts);
}
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: ECL Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - name: Install ECL MCP Server
        run: npm install
      - name: Run ECL Validation
        run: node validate.js
        env:
          QUALITY_THRESHOLD: 85
          WCAG_LEVEL: AA
```

### Validation Script (validate.js)

```javascript
import { validateComponentUsage, checkAccessibility, analyzeEclCode } from './src/validation/index.js';
import { getDatabase } from './src/db.js';
import { readFileSync } from 'fs';

const db = getDatabase(true);
const html = readFileSync('./dist/index.html', 'utf-8');
const js = readFileSync('./dist/main.js', 'utf-8');
const css = readFileSync('./dist/styles.css', 'utf-8');

// Run validations
const accessibility = await checkAccessibility(db, html, null, process.env.WCAG_LEVEL || 'AA');
const quality = await analyzeEclCode(db, html, js, css);

const threshold = parseInt(process.env.QUALITY_THRESHOLD) || 85;

// Check results
const passed = 
  accessibility.data.wcag_aa_compliant &&
  quality.data.overall_quality_score >= threshold;

if (!passed) {
  console.error('❌ Validation failed');
  console.error('WCAG AA:', accessibility.data.wcag_aa_compliant);
  console.error('Quality score:', quality.data.overall_quality_score);
  process.exit(1);
}

console.log('✅ Validation passed');
process.exit(0);
```
