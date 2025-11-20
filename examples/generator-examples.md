# Code Generation Examples

This guide demonstrates how to use the ECL MCP Server's code generation tools to create customized components, complete examples, and interactive playgrounds.

## Table of Contents

- [Get Complete Examples](#get-complete-examples)
- [Generate Custom Components](#generate-custom-components)
- [Create Interactive Playgrounds](#create-interactive-playgrounds)
- [Advanced Use Cases](#advanced-use-cases)

---

## Get Complete Examples

### Basic Usage

Get a complete, runnable example for any component:

```javascript
const example = await ecl_get_complete_example({
  component: "button"
});

console.log(example.complete_code.complete_html);
// Returns full HTML page ready to save and open in browser
```

**Response Structure:**
```javascript
{
  success: true,
  component: "button",
  example_title: "Primary button example",
  variant: "primary",
  complexity: "simple",
  complete_code: {
    html: "<button class='ecl-button ecl-button--primary'>Primary button</button>",
    js: "// No JavaScript required",
    css: "/* No custom CSS required */",
    complete_html: "<!doctype html>...<full page>..."
  },
  dependencies: {
    stylesheets: [
      {
        name: "ECL EC Styles",
        cdn_url: "https://cdn.jsdelivr.net/npm/@ecl/preset-ec@latest/dist/styles/ecl-ec.css",
        npm_package: "@ecl/preset-ec",
        required: true
      }
    ],
    scripts: [...]
  },
  preview_url: "https://ec.europa.eu/component-library/ec/components/button/",
  explanation: "A primary button for main actions...",
  customization_points: ["variant", "size", "icon", "disabled state"],
  related_examples: [...],
  accessibility_notes: "Buttons must have accessible text..."
}
```

### Filter by Variant

Get a specific variant of a component:

```javascript
const example = await ecl_get_complete_example({
  component: "button",
  variant: "secondary"
});

// Returns secondary button example
console.log(example.variant); // "secondary"
```

### Filter by Example Type

Get examples for specific use cases:

```javascript
const example = await ecl_get_complete_example({
  component: "card",
  example_type: "with-image"
});

// Returns card example with image
```

### Save to File

Save the complete HTML to a file for testing:

```javascript
const fs = require('fs');
const example = await ecl_get_complete_example({
  component: "modal"
});

fs.writeFileSync('modal-example.html', example.complete_code.complete_html);
console.log('Example saved! Open modal-example.html in your browser.');
```

---

## Generate Custom Components

### Basic Component Generation

Generate a simple component:

```javascript
const result = await ecl_generate_component({
  component: "button"
});

console.log(result.generated_code.html);
// <button class="ecl-button ecl-button--primary" type="submit">Primary button</button>

console.log(result.usage_instructions);
// Step-by-step guide on how to use this button
```

### Customize Variant and Size

```javascript
const button = await ecl_generate_component({
  component: "button",
  customization: {
    variant: "secondary",
    size: "large"
  }
});

console.log(button.generated_code.html);
// <button class="ecl-button ecl-button--secondary ecl-button--large">...</button>
```

### Customize Content (String)

Simple text replacement:

```javascript
const button = await ecl_generate_component({
  component: "button",
  customization: {
    content: "Submit Application"
  }
});

console.log(button.generated_code.html);
// <button class="ecl-button ecl-button--primary">Submit Application</button>
```

### Customize Content (Object)

Component-specific customization:

#### Button with Label and Icon

```javascript
const button = await ecl_generate_component({
  component: "button",
  customization: {
    content: {
      label: "Download Report",
      icon: "download",
      iconPosition: "before"
    }
  }
});
```

#### Card with Title and Description

```javascript
const card = await ecl_generate_component({
  component: "card",
  customization: {
    content: {
      title: "Latest News",
      description: "Stay updated with the latest developments from the European Commission.",
      image: "/images/news-header.jpg"
    }
  }
});
```

#### Link with Label and URL

```javascript
const link = await ecl_generate_component({
  component: "link",
  customization: {
    content: {
      label: "Read more about our policies",
      href: "https://ec.europa.eu/policies"
    }
  }
});
```

### Add Custom Attributes

```javascript
const button = await ecl_generate_component({
  component: "button",
  customization: {
    variant: "primary",
    content: "Submit Form",
    attributes: {
      type: "submit",
      disabled: false,
      "data-action": "submit-form",
      "aria-label": "Submit the contact form"
    }
  }
});
```

### Multiple Customizations

Combine multiple customization options:

```javascript
const button = await ecl_generate_component({
  component: "button",
  customization: {
    variant: "primary",
    size: "large",
    content: "Create Account",
    attributes: {
      type: "button",
      "data-tracking": "signup-cta"
    }
  }
});

console.log(button.generated_code.html);
// Fully customized button with all options applied
```

### Include Explanatory Comments

```javascript
const button = await ecl_generate_component({
  component: "button",
  customization: {
    variant: "primary"
  },
  include_comments: true
});

// HTML will include helpful comments
// <!-- Variant: primary -->
// <button class="ecl-button ecl-button--primary">...</button>
```

### Framework Conversion (Coming Soon)

```javascript
const button = await ecl_generate_component({
  component: "button",
  framework: "react"  // Currently returns vanilla HTML
});

// Future: Will return React component code
// export const Button = () => { ... }
```

### Understanding the Response

```javascript
const result = await ecl_generate_component({
  component: "button",
  customization: { variant: "secondary", content: "Cancel" }
});

// Result structure:
{
  success: true,
  component: "button",
  generated_code: {
    html: "<button>...</button>",
    js: "// Optional initialization code",
    css: "/* Optional custom CSS */"
  },
  customization_applied: {
    variant: "secondary",
    content: "Cancel"
  },
  usage_instructions: "1. Add HTML to your page\n2. Include ECL styles...",
  accessibility_notes: "Ensure button has visible text or aria-label...",
  next_steps: [
    "Test button in different browsers",
    "Verify keyboard navigation works",
    "Add event handlers for click actions"
  ]
}
```

---

## Create Interactive Playgrounds

### Single Component Playground

Create a testing environment for one component:

```javascript
const playground = await ecl_create_playground({
  components: ["button"]
});

const fs = require('fs');
fs.writeFileSync('button-playground.html', playground.html_file);

console.log(`Playground created: ${playground.file_size} bytes`);
console.log(`Components: ${playground.components_included.join(', ')}`);
```

### Multiple Components

Test multiple components together:

```javascript
const playground = await ecl_create_playground({
  components: ["button", "card", "link", "tag"]
});

fs.writeFileSync('components-playground.html', playground.html_file);
// Open in browser to see all 4 components with examples
```

### Include All Variants

Show all variants of each component:

```javascript
const playground = await ecl_create_playground({
  components: ["button"],
  include_all_variants: true
});

// Playground will show:
// - Primary button
// - Secondary button
// - Text button
// - Small, medium, large sizes
// - With/without icons
// etc.
```

### Add Custom Code

Inject your own HTML/CSS/JS for testing:

```javascript
const playground = await ecl_create_playground({
  components: ["button", "card"],
  custom_code: `
    <section class="my-custom-section">
      <h2>My Custom Integration Test</h2>
      <p>Testing button inside a card:</p>
      <div class="ecl-card">
        <div class="ecl-card__body">
          <button class="ecl-button ecl-button--primary">
            Custom Integration
          </button>
        </div>
      </div>
    </section>
    
    <style>
      .my-custom-section {
        margin: 2rem 0;
        padding: 2rem;
        background: #f5f5f5;
      }
    </style>
    
    <script>
      console.log('Custom code loaded');
      document.querySelector('.ecl-button').addEventListener('click', () => {
        alert('Button clicked!');
      });
    </script>
  `
});
```

### Playground Features

The generated playground includes:

1. **Sticky Navigation** - Jump between components easily
2. **Collapsible Code Viewers** - See the HTML for each example
3. **ECL Styling** - Official ECL styles from CDN
4. **Auto-Initialization** - Interactive components work automatically
5. **Responsive Design** - Works on desktop and mobile
6. **ECL Branding** - Uses official blue/yellow color scheme

### Understanding the Response

```javascript
const result = await ecl_create_playground({
  components: ["button", "card"]
});

// Result structure:
{
  success: true,
  html_file: "<!doctype html>...<full page>...",
  components_included: ["button", "card"],
  file_size: 15234,  // bytes
  instructions: "Open the HTML file in a browser to test components..."
}
```

---

## Advanced Use Cases

### Use Case 1: Rapid Prototyping

Quickly prototype a page with multiple components:

```javascript
// Step 1: Get examples for layout inspiration
const cardExample = await ecl_get_complete_example({
  component: "card",
  example_type: "with-image"
});

const buttonExample = await ecl_get_complete_example({
  component: "button",
  variant: "primary"
});

// Step 2: Generate customized versions
const customCard = await ecl_generate_component({
  component: "card",
  customization: {
    content: {
      title: "New Product Launch",
      description: "Discover our latest innovation in sustainable technology.",
      image: "/images/product.jpg"
    }
  }
});

const customButton = await ecl_generate_component({
  component: "button",
  customization: {
    variant: "primary",
    size: "large",
    content: "Learn More"
  }
});

// Step 3: Create a playground to test the combination
const playground = await ecl_create_playground({
  components: ["card", "button"],
  custom_code: `
    <div style="max-width: 400px; margin: 2rem auto;">
      ${customCard.generated_code.html}
      <div style="margin-top: 1rem; text-align: center;">
        ${customButton.generated_code.html}
      </div>
    </div>
  `
});

fs.writeFileSync('prototype.html', playground.html_file);
```

### Use Case 2: Component Documentation

Generate documentation with live examples:

```javascript
const components = ["button", "link", "tag", "badge"];
const examples = [];

// Generate examples for each component
for (const component of components) {
  const example = await ecl_get_complete_example({ component });
  examples.push({
    component,
    code: example.complete_code.html,
    usage: example.explanation,
    accessibility: example.accessibility_notes,
    customization: example.customization_points
  });
}

// Create a documentation playground
const customCode = examples.map(ex => `
  <section id="${ex.component}">
    <h2>${ex.component.charAt(0).toUpperCase() + ex.component.slice(1)}</h2>
    <p>${ex.usage}</p>
    
    <h3>Example</h3>
    <div class="example-container">
      ${ex.code}
    </div>
    
    <h3>Customization Options</h3>
    <ul>
      ${ex.customization.map(opt => `<li>${opt}</li>`).join('\n      ')}
    </ul>
    
    <h3>Accessibility</h3>
    <p>${ex.accessibility}</p>
  </section>
`).join('\n');

const playground = await ecl_create_playground({
  components,
  custom_code: customCode
});

fs.writeFileSync('component-docs.html', playground.html_file);
```

### Use Case 3: A/B Testing Variants

Generate multiple variants for A/B testing:

```javascript
const variants = ["primary", "secondary", "text"];
const buttons = [];

for (const variant of variants) {
  const button = await ecl_generate_component({
    component: "button",
    customization: {
      variant,
      content: "Click Here",
      attributes: {
        "data-variant": variant,
        "data-tracking": `button-${variant}`
      }
    }
  });
  buttons.push(button);
}

// Create playground to compare visually
const playground = await ecl_create_playground({
  components: ["button"],
  custom_code: `
    <h2>Button Variant Comparison</h2>
    <div style="display: flex; gap: 1rem; margin: 2rem 0;">
      ${buttons.map(b => b.generated_code.html).join('\n      ')}
    </div>
    
    <script>
      document.querySelectorAll('[data-variant]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          console.log('Clicked:', e.target.dataset.variant);
          // Send to analytics
        });
      });
    </script>
  `
});

fs.writeFileSync('ab-test.html', playground.html_file);
```

### Use Case 4: Accessibility Testing

Test accessibility across components:

```javascript
const components = ["button", "link", "card", "modal"];
const playground = await ecl_create_playground({
  components,
  custom_code: `
    <style>
      .accessibility-test {
        outline: 2px solid blue;
        outline-offset: 4px;
      }
      
      .focus-visible {
        outline: 3px solid orange !important;
      }
    </style>
    
    <script>
      // Track focus for accessibility testing
      document.addEventListener('focusin', (e) => {
        document.querySelectorAll('.focus-visible').forEach(el => {
          el.classList.remove('focus-visible');
        });
        e.target.classList.add('focus-visible');
        console.log('Focused:', e.target.tagName, e.target.className);
      });
      
      // Keyboard navigation test
      document.addEventListener('keydown', (e) => {
        console.log('Key pressed:', e.key, 'on', e.target.tagName);
      });
      
      // ARIA attributes report
      function checkAccessibility() {
        const report = [];
        document.querySelectorAll('[class*="ecl-"]').forEach(el => {
          const aria = {};
          for (const attr of el.attributes) {
            if (attr.name.startsWith('aria-') || attr.name === 'role') {
              aria[attr.name] = attr.value;
            }
          }
          if (Object.keys(aria).length > 0) {
            report.push({
              element: el.tagName,
              classes: el.className,
              aria
            });
          }
        });
        console.table(report);
      }
      
      console.log('Accessibility testing enabled. Run checkAccessibility() to see report.');
    </script>
  `
});

fs.writeFileSync('accessibility-test.html', playground.html_file);
```

### Use Case 5: Automated Code Generation

Generate components from a configuration file:

```javascript
const config = {
  hero: {
    type: "card",
    content: {
      title: "Welcome to Our Platform",
      description: "Build better digital experiences with ECL components."
    }
  },
  cta: {
    type: "button",
    customization: {
      variant: "primary",
      size: "large",
      content: "Get Started"
    }
  },
  secondaryCta: {
    type: "button",
    customization: {
      variant: "secondary",
      content: "Learn More"
    }
  }
};

const generated = {};

for (const [key, spec] of Object.entries(config)) {
  const result = await ecl_generate_component({
    component: spec.type,
    customization: spec.customization || { content: spec.content }
  });
  generated[key] = result.generated_code.html;
}

// Assemble page
const pageHtml = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Auto-Generated Page</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ecl/preset-ec@latest/dist/styles/ecl-ec.css">
</head>
<body>
  <div class="ecl-container">
    ${generated.hero}
    <div style="margin-top: 2rem; display: flex; gap: 1rem;">
      ${generated.cta}
      ${generated.secondaryCta}
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync('auto-generated.html', pageHtml);
```

---

## Tips and Best Practices

### 1. Save Examples for Reference

Always save complete examples when learning:

```javascript
const example = await ecl_get_complete_example({ component: "modal" });
fs.writeFileSync(`examples/${example.component}.html`, example.complete_code.complete_html);
```

### 2. Check Customization Points First

Before customizing, check what's available:

```javascript
const example = await ecl_get_complete_example({ component: "card" });
console.log("Can customize:", example.customization_points);
// Then customize based on available options
```

### 3. Use Playgrounds for Experimentation

When unsure, create a playground to test:

```javascript
const playground = await ecl_create_playground({
  components: ["button"],
  include_all_variants: true
});
// Visual comparison of all options
```

### 4. Read Accessibility Notes

Always check accessibility requirements:

```javascript
const button = await ecl_generate_component({ component: "button" });
console.log("Accessibility:", button.accessibility_notes);
console.log("Usage:", button.usage_instructions);
```

### 5. Test in Real Browsers

Generated code should always be tested:

```javascript
const playground = await ecl_create_playground({
  components: ["modal", "dropdown"],
  custom_code: "<!-- Your integration test -->"
});
fs.writeFileSync('test.html', playground.html_file);
// Open in Chrome, Firefox, Safari, Edge
```

---

## Error Handling

### Invalid Component

```javascript
const result = await ecl_generate_component({
  component: "nonexistent"
});

if (!result.success) {
  console.error("Error:", result.error);
  // "Failed to generate: Component 'nonexistent' not found"
}
```

### Empty Components Array

```javascript
const result = await ecl_create_playground({
  components: []
});

if (!result.success) {
  console.error("Error:", result.error);
  // "At least one component is required"
}
```

### Graceful Degradation

```javascript
try {
  const example = await ecl_get_complete_example({
    component: "button",
    variant: "ultra-rare-variant"
  });
  
  // Falls back to first available example
  console.log("Got variant:", example.variant);
} catch (error) {
  console.error("Failed:", error.message);
}
```

---

## Next Steps

- Explore **[TOOLS.md](../TOOLS.md)** for complete API reference
- Check **[PROGRESS.md](../PROGRESS.md)** for implementation details
- See **[search-examples.md](./search-examples.md)** for finding components
- See **[validation-examples.md](./validation-examples.md)** for quality checking
