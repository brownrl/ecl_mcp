# ECL MCP Server - Tool Reference

Complete reference for all available tools in the Europa Component Library MCP Server.

## Tool Categories

- **[Legacy Tools](#legacy-tools)** - Phase 1 basic tools (backward compatibility)
- **[Component Search](#component-search)** - Advanced component discovery and details
- **[API Documentation](#api-documentation)** - Search component APIs
- **[Code Examples](#code-examples)** - Find and retrieve code samples
- **[Usage Guidance](#usage-guidance)** - Best practices and do's/don'ts
- **[Component Relationships](#component-relationships)** - Discover component dependencies
- **[Design Tokens](#design-tokens)** - Search design system tokens
- **[Validation & Diagnostics](#validation--diagnostics)** - Validate components, check accessibility, analyze code quality
- **[Typography Best Practices](#typography-best-practices)** - Critical ECL font inheritance guidance
- **[Code Generation](#code-generation)** - Generate runnable examples, customize components, create playgrounds

---

## Legacy Tools

These tools provide basic functionality from Phase 1 and are maintained for backward compatibility. **Prefer the enhanced `ecl_*` tools for new integrations.**

### `get_component`

Get basic component information from the JSON data file.

**Parameters:**
- `component_name` (string, required) - Component name (e.g., "button", "card")

**Replaced by:** `ecl_get_component_details` (provides richer data)

---

### `search_components`

Basic component search by keyword.

**Parameters:**
- `query` (string, required) - Search query

**Replaced by:** `ecl_search_components` (supports advanced filtering)

---

### `generate_component_code`

Generate HTML code for a component.

**Parameters:**
- `component_name` (string, required) - Component name
- `variant` (string, optional) - Component variant

---

### `get_setup_guide`

Get ECL setup and installation guide.

**Parameters:**
- `method` (enum, required) - Installation method: `npm`, `cdn`, or `complete`

---

### `list_components_by_category`

List components in a specific category.

**Parameters:**
- `category` (enum, required) - Category: `forms`, `navigation`, `content`, `media`, `banners`, `site-wide`

---

### `get_guidelines`

Get design guidelines (typography, colors, spacing, etc.)

**Parameters:**
- `guideline_type` (enum, required) - Type: `typography`, `colours`, `colors`, `images`, `iconography`, `spacing`, `all`

---

### `get_javascript_init`

Get JavaScript initialization code.

**Parameters:**
- `component_name` (string, optional) - Component to get init code for

---

## Component Search

Enhanced component discovery with semantic filtering and rich metadata.

### `ecl_search_components`

Advanced multi-filter component search.

**Parameters:**
- `query` (string, optional) - Text search (component name, description)
- `category` (string, optional) - Filter by category (e.g., "forms", "navigation")
- `tag` (string, optional) - Filter by tag (e.g., "interactive", "responsive")
- `complexity` (enum, optional) - Filter by complexity: `basic`, `intermediate`, `advanced`
- `requiresJs` (boolean, optional) - Filter by JavaScript requirement
- `limit` (number, optional) - Max results (default: 20)

**Returns:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 16,
        "url": "https://...",
        "title": "Buttons",
        "category": "components",
        "component_name": "Buttons",
        "component_type": "component",
        "complexity": "complex",
        "requires_js": true,
        "status": "stable",
        "tags": ["accessible", "form", "navigation"]
      }
    ],
    "count": 1,
    "query": { ... }
  },
  "metadata": {
    "tool": "searchComponents",
    "execution_time_ms": 5,
    "source": "ecl-database",
    "version": "2.0"
  }
}
```

**Example queries:**
- `{ "query": "button" }` - Find all components with "button" in name/description
- `{ "category": "forms" }` - All form components
- `{ "tag": "interactive", "requiresJs": true }` - Interactive JS components
- `{ "complexity": "basic", "limit": 10 }` - Simple components

---

### `ecl_get_component_details`

Get complete component information including metadata, tags, guidance, API, and examples.

**Parameters:**
- `component` (string, required) - Component name or page ID

**Returns:**
```json
{
  "success": true,
  "data": {
    "id": 16,
    "url": "https://...",
    "title": "Buttons",
    "component_name": "Buttons",
    "component_type": "component",
    "complexity": "complex",
    "requires_js": true,
    "status": "stable",
    "tags": [
      { "tag": "form", "type": "feature" },
      { "tag": "accessible", "type": "accessibility" }
    ],
    "guidance_count": 15,
    "api_count": 5,
    "example_count": 8
  },
  "metadata": { ... }
}
```

**Notes:**
- Accepts component name (e.g., "button") or page ID (integer)
- Returns counts for related data (use specific tools to fetch)

---

## API Documentation

Search and retrieve component API documentation (attributes, props, methods, events).

### `ecl_search_api`

Search API documentation across all components.

**Parameters:**
- `query` (string, optional) - Search API names and descriptions
- `apiType` (enum, optional) - Filter by type: `attribute`, `prop`, `method`, `event`, `slot`, `css-variable`
- `required` (boolean, optional) - Filter by required/optional
- `limit` (number, optional) - Max results (default: 50)

**Returns:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "component": "Buttons",
        "component_url": "https://...",
        "component_type": "component",
        "apis": [
          {
            "api_type": "attribute",
            "name": "disabled",
            "data_type": "boolean",
            "required": false,
            "default_value": "false",
            "description": "Disable the button",
            "options": null
          }
        ]
      }
    ]
  },
  "metadata": { ... }
}
```

**Example queries:**
- `{ "apiType": "method" }` - All component methods
- `{ "required": true }` - All required API members
- `{ "query": "disabled" }` - API members related to "disabled"

---

### `ecl_get_component_api`

Get all API documentation for a specific component.

**Parameters:**
- `component` (string, required) - Component name or page ID

**Returns:**
```json
{
  "success": true,
  "data": {
    "component": "Buttons",
    "url": "https://...",
    "complexity": "complex",
    "api": {
      "attribute": [ ... ],
      "method": [ ... ],
      "event": [ ... ]
    },
    "total_entries": 12
  },
  "metadata": { ... }
}
```

---

## Code Examples

Search and retrieve code examples by language, complexity, and use case.

### `ecl_search_code_examples`

Search code examples with multiple filters.

**Parameters:**
- `component` (string, optional) - Filter by component name
- `language` (enum, optional) - Filter by language: `html`, `javascript`, `css`, `jsx`, `vue`, `twig`
- `complexity` (enum, optional) - Filter by complexity: `basic`, `intermediate`, `advanced`
- `completeExample` (boolean, optional) - Filter complete vs snippet examples
- `interactive` (boolean, optional) - Filter interactive examples
- `limit` (number, optional) - Max results (default: 30)

**Returns:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 570,
        "component": "Buttons",
        "component_url": "https://...",
        "language": "html",
        "complexity": "basic",
        "is_complete": true,
        "is_interactive": false,
        "code_preview": "<!doctype html>\n<html>..."
      }
    ],
    "count": 1
  },
  "metadata": { ... }
}
```

**Example queries:**
- `{ "language": "html", "complexity": "basic" }` - Simple HTML examples
- `{ "component": "button", "interactive": true }` - Interactive button examples
- `{ "completeExample": true }` - Complete working examples

---

### `ecl_get_example`

Get complete code for a specific example by ID.

**Parameters:**
- `exampleId` (number, required) - Example ID from `code_examples` table

**Returns:**
```json
{
  "success": true,
  "data": {
    "id": 570,
    "component": "Buttons",
    "language": "html",
    "complexity": "basic",
    "is_complete": true,
    "code": "<!doctype html>\n<html>...</html>"
  },
  "metadata": { ... }
}
```

---

### `ecl_get_component_examples`

Get all code examples for a specific component.

**Parameters:**
- `component` (string, required) - Component name or page ID

**Returns:**
```json
{
  "success": true,
  "data": {
    "component": "Buttons",
    "examples": [
      {
        "id": 570,
        "language": "html",
        "complexity": "basic",
        "code_preview": "..."
      }
    ],
    "count": 8,
    "by_language": {
      "html": 5,
      "javascript": 2,
      "css": 1
    }
  },
  "metadata": { ... }
}
```

---

## Usage Guidance

Retrieve usage guidance including when to use, do's, don'ts, and best practices.

### `ecl_get_component_guidance`

Get all usage guidance for a component.

**Parameters:**
- `component` (string, required) - Component name or page ID

**Returns:**
```json
{
  "success": true,
  "data": {
    "component": "Buttons",
    "url": "https://...",
    "guidance": {
      "when-to-use": [
        "when you need to present multiple sections..."
      ],
      "when-not-to-use": [
        "when content should always be visible..."
      ],
      "do": [
        "use clear action-oriented labels"
      ],
      "dont": [
        "don't use for navigation"
      ],
      "best-practice": [
        "ensure sufficient color contrast"
      ],
      "caveat": [
        "some mobile browsers may not support..."
      ]
    },
    "total_items": 15
  },
  "metadata": { ... }
}
```

**Guidance types:**
- `when-to-use` - Appropriate use cases
- `when-not-to-use` - When to avoid the component
- `do` - Recommended practices
- `dont` - Things to avoid
- `best-practice` - Best practices
- `caveat` - Important caveats
- `limitation` - Known limitations
- `note` - Additional notes

---

### `ecl_search_guidance`

Search guidance content across all components.

**Parameters:**
- `query` (string, optional) - Search guidance content
- `guidanceType` (enum, optional) - Filter by type (see types above)
- `limit` (number, optional) - Max results (default: 30)

**Returns:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "component": "Buttons",
        "component_url": "https://...",
        "guidance": {
          "do": [
            "use clear action-oriented labels"
          ]
        }
      }
    ]
  },
  "metadata": { ... }
}
```

---

## Component Relationships

Discover component dependencies and relationships (requires, suggests, alternatives, conflicts).

### `ecl_find_related_components`

Find components related to a given component.

**Parameters:**
- `component` (string, required) - Component name or page ID
- `relationshipType` (enum, optional) - Filter by type: `requires`, `suggests`, `alternative`, `contains`, `conflicts`, `extends`

**Returns:**
```json
{
  "success": true,
  "data": {
    "component": "Form",
    "relationships": {
      "outgoing": {
        "requires": [
          {
            "target_component": "Input",
            "target_url": "https://...",
            "description": "Forms require input fields"
          }
        ]
      },
      "incoming": {
        "contained-by": [
          {
            "source_component": "Page Template",
            "description": "Page templates contain forms"
          }
        ]
      }
    },
    "total_outgoing": 5,
    "total_incoming": 2
  },
  "metadata": { ... }
}
```

**Relationship types:**
- `requires` - Component depends on another
- `suggests` - Recommended companion component
- `alternative` - Alternative component for similar use case
- `contains` - Component contains another
- `conflicts` - Components that conflict
- `extends` - Component extends another

---

### `ecl_get_dependency_graph`

Build recursive dependency graph for a component.

**Parameters:**
- `component` (string, required) - Component name or page ID
- `maxDepth` (number, optional) - Maximum recursion depth (default: 3)

**Returns:**
```json
{
  "success": true,
  "data": {
    "root_component": "Form",
    "graph": {
      "nodes": [
        {
          "id": 1,
          "name": "Form",
          "type": "component",
          "depth": 0
        },
        {
          "id": 2,
          "name": "Input",
          "type": "component",
          "depth": 1
        }
      ],
      "edges": [
        {
          "from": 1,
          "to": 2,
          "type": "requires",
          "description": "Forms require input fields"
        }
      ]
    },
    "total_nodes": 5,
    "total_edges": 7,
    "max_depth": 3
  },
  "metadata": { ... }
}
```

---

## Design Tokens

Search and retrieve design system tokens (colors, spacing, typography, etc.)

### `ecl_search_design_tokens`

Search design tokens by name, CSS variable, or category.

**Parameters:**
- `query` (string, optional) - Search token names, CSS variables, or values
- `category` (enum, optional) - Filter by category: `color`, `spacing`, `typography`, `breakpoint`, `shadow`, `border-radius`, `z-index`, `timing`
- `limit` (number, optional) - Max results (default: 50)

**Returns:**
```json
{
  "success": true,
  "data": {
    "results": {
      "color": [
        {
          "token_name": "primary-color",
          "css_variable": "--ecl-color-primary",
          "value": "#004494",
          "description": "Primary brand color",
          "usage_context": "Buttons, links, highlights"
        }
      ]
    },
    "total_count": 15,
    "categories": ["color", "spacing"]
  },
  "metadata": { ... }
}
```

---

### `ecl_get_tokens_by_category`

Get all tokens for a specific category.

**Parameters:**
- `category` (enum, required) - Category: `color`, `spacing`, `typography`, etc.

**Returns:**
```json
{
  "success": true,
  "data": {
    "category": "color",
    "tokens": [
      {
        "token_name": "primary-color",
        "css_variable": "--ecl-color-primary",
        "value": "#004494",
        "description": "Primary brand color"
      }
    ],
    "count": 25
  },
  "metadata": { ... }
}
```

---

### `ecl_get_token`

Get a specific token by exact name or CSS variable.

**Parameters:**
- `tokenName` (string, required) - Token name or CSS variable (e.g., "primary-color" or "--ecl-color-primary")

**Returns:**
```json
{
  "success": true,
  "data": {
    "token_name": "primary-color",
    "css_variable": "--ecl-color-primary",
    "value": "#004494",
    "category": "color",
    "description": "Primary brand color",
    "usage_context": "Buttons, links, highlights"
  },
  "metadata": { ... }
}
```

---

### `ecl_get_token_categories`

List all design token categories with counts.

**Parameters:** None

**Returns:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "color",
        "count": 25,
        "description": "Color tokens for brand and UI elements"
      },
      {
        "category": "spacing",
        "count": 12,
        "description": "Spacing scale tokens"
      }
    ],
    "total_categories": 8,
    "total_tokens": 150
  },
  "metadata": { ... }
}
```

---

## Response Format

All Phase 3 tools (`ecl_*`) return a standardized response format:

```json
{
  "success": true|false,
  "data": { /* tool-specific payload */ },
  "metadata": {
    "tool": "toolName",
    "execution_time_ms": 5,
    "source": "ecl-database",
    "version": "2.0"
  },
  "suggestions": [ /* optional helpful hints */ ],
  "warnings": [ /* optional non-fatal issues */ ],
  "errors": [ /* optional error details */ ]
}
```

### Error Handling

When `success: false`, the `errors` array contains:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": { /* optional additional context */ }
}
```

**Common error codes:**
- `NOT_FOUND` - Resource not found
- `INVALID_INPUT` - Invalid parameter
- `DATABASE_ERROR` - Database query failed
- `QUERY_ERROR` - Malformed search query

---

## Best Practices

1. **Use Enhanced Tools** - Prefer `ecl_*` tools over legacy tools for richer data
2. **Combine Tools** - Use search tools to find, then detail tools to retrieve complete info
3. **Check Metadata** - Use `execution_time_ms` to identify slow queries
4. **Follow Suggestions** - Response suggestions guide next steps
5. **Handle Errors** - Check `success` flag and `errors` array
6. **Filter Smartly** - Use specific filters to reduce result sets
7. **Limit Results** - Set appropriate `limit` to avoid large payloads

## Example Workflows

### Finding a Component and Its Details

```javascript
// 1. Search for button components
ecl_search_components({ query: "button", limit: 5 })

// 2. Get complete details for specific component
ecl_get_component_details({ component: "button" })

// 3. Get usage guidance
ecl_get_component_guidance({ component: "button" })

// 4. Get code examples
ecl_get_component_examples({ component: "button" })
```

### Building a Component with Dependencies

```javascript
// 1. Find the component
ecl_search_components({ query: "form" })

// 2. Check dependencies
ecl_get_dependency_graph({ component: "form", maxDepth: 2 })

// 3. Get API documentation
ecl_get_component_api({ component: "form" })

// 4. Find complete code example
ecl_search_code_examples({ 
  component: "form", 
  completeExample: true,
  language: "html"
})
```

### Exploring Design Tokens

```javascript
// 1. List all categories
ecl_get_token_categories()

// 2. Get all color tokens
ecl_get_tokens_by_category({ category: "color" })

// 3. Find specific token
ecl_get_token({ tokenName: "primary-color" })
```

---

## Validation & Diagnostics

### `ecl_validate_component_usage`

Validate ECL component HTML/JavaScript against official guidelines and best practices.

**Parameters:**
- `component` (string, required) - Component name (e.g., "button", "card")
- `htmlCode` (string, required) - HTML code to validate
- `jsCode` (string, optional) - JavaScript code to validate
- `context` (string, optional) - Usage context (e.g., "form", "navigation")

**Returns:**
```json
{
  "success": true,
  "data": {
    "component_name": "button",
    "quality_score": 85,
    "issues": [
      {
        "severity": "error",
        "message": "Button missing type attribute",
        "line": 1,
        "fix": "Add type=\"button\" or type=\"submit\"",
        "example": "<button type=\"button\" class=\"ecl-button\">Click</button>"
      }
    ],
    "warnings": [],
    "suggestions": [
      {
        "type": "best_practice",
        "message": "Consider using ecl-button--primary for primary actions",
        "example": "<button class=\"ecl-button ecl-button--primary\">Submit</button>"
      }
    ],
    "guidance": {
      "dos": ["Use semantic HTML", "Include proper ARIA labels"],
      "donts": ["Don't use inline styles", "Don't omit type attribute"]
    }
  },
  "metadata": {
    "tool": "ecl_validate_component_usage",
    "execution_time_ms": 5
  }
}
```

**Use Cases:**
- Validate component implementation before deployment
- Code review assistance
- Learning ECL best practices
- CI/CD validation checks

---

### `ecl_check_accessibility`

Check WCAG 2.1 accessibility compliance at Level A, AA, or AAA.

**Parameters:**
- `htmlCode` (string, required) - HTML code to check
- `component` (string, optional) - Component name for context-aware checking
- `targetLevel` (string, optional) - Target WCAG level: "A", "AA" (default), "AAA"

**Returns:**
```json
{
  "success": true,
  "data": {
    "wcag_a_compliant": true,
    "wcag_aa_compliant": true,
    "wcag_aaa_compliant": false,
    "compliance_level": "AA",
    "issues": [
      {
        "severity": "critical",
        "wcag_criterion": "1.1.1",
        "message": "Image missing alt attribute",
        "element": "<img src=\"logo.png\">",
        "fix": "Add descriptive alt text",
        "example": "<img src=\"logo.png\" alt=\"Company logo\">"
      }
    ],
    "recommendations": [
      {
        "wcag_criterion": "2.4.4",
        "message": "Link text could be more descriptive",
        "suggestion": "Use meaningful link text instead of 'click here'"
      }
    ],
    "wcag_details": {
      "level_a": { "passed": 9, "total": 9 },
      "level_aa": { "passed": 5, "total": 5 },
      "level_aaa": { "passed": 2, "total": 3 }
    }
  },
  "metadata": {
    "tool": "ecl_check_accessibility",
    "execution_time_ms": 3
  }
}
```

**WCAG Criteria Checked:**

**Level A (9 criteria):**
- 1.1.1 Non-text Content
- 1.3.1 Info and Relationships
- 2.1.1 Keyboard
- 2.4.1 Bypass Blocks
- 2.4.2 Page Titled
- 2.4.3 Focus Order
- 2.4.4 Link Purpose
- 4.1.1 Parsing
- 4.1.2 Name, Role, Value

**Level AA (5 criteria):**
- 1.4.3 Contrast (Minimum)
- 1.4.5 Images of Text
- 2.4.5 Multiple Ways
- 2.4.6 Headings and Labels
- 2.4.7 Focus Visible

**Level AAA (3 criteria):**
- 1.4.6 Contrast (Enhanced)
- 2.4.8 Location
- 2.5.5 Target Size

**Use Cases:**
- Accessibility audits
- WCAG compliance verification
- Component accessibility validation
- Pre-deployment accessibility checks

---

### `ecl_analyze_ecl_code`

Analyze code quality, detect ECL components, find anti-patterns, and provide recommendations.

**Parameters:**
- `htmlCode` (string, required) - HTML code to analyze
- `jsCode` (string, optional) - JavaScript code to analyze
- `cssCode` (string, optional) - CSS code to analyze

**Returns:**
```json
{
  "success": true,
  "data": {
    "components_detected": ["button", "card", "site-header"],
    "design_tokens_used": [
      "ecl-color-primary",
      "ecl-spacing-m",
      "ecl-font-family"
    ],
    "overall_quality_score": 85,
    "best_practices": {
      "score": 90,
      "issues": [
        {
          "severity": "warning",
          "message": "Inline style detected",
          "fix": "Use ECL utility classes instead",
          "example": "class=\"ecl-u-mt-m\" instead of style=\"margin-top: 16px\""
        }
      ]
    },
    "maintainability": {
      "score": 85,
      "issues": [
        {
          "severity": "warning",
          "message": "Hardcoded color value #003399",
          "fix": "Use ECL design token: var(--ecl-color-primary)"
        }
      ]
    },
    "performance": {
      "score": 80,
      "issues": [
        {
          "severity": "warning",
          "message": "Excessive use of !important (3 instances)",
          "fix": "Review CSS specificity and remove !important"
        }
      ]
    },
    "recommendations": [
      "Consider using ECL utility classes for spacing",
      "Replace hardcoded colors with design tokens",
      "Use data-ecl-auto-init for component initialization"
    ],
    "conflicts": []
  },
  "metadata": {
    "tool": "ecl_analyze_ecl_code",
    "execution_time_ms": 4
  }
}
```

**Quality Scoring:**
- **90-100**: Excellent - Follows ECL best practices
- **85-89**: Good - Minor improvements possible
- **70-84**: Acceptable - Some issues to address
- **<70**: Needs work - Multiple issues detected

**Use Cases:**
- Code quality assessment
- Component detection and inventory
- Design token adoption tracking
- Technical debt identification
- Migration planning (detect components to upgrade)

---

### `ecl_check_conflicts`

Check for incompatible component combinations and known issues.

**Parameters:**
- `components` (array, required) - List of component names
- `htmlCode` (string, optional) - HTML code for additional context

**Returns:**
```json
{
  "success": true,
  "data": {
    "conflicts": [
      {
        "severity": "error",
        "components": ["modal", "dropdown"],
        "message": "Modal and dropdown z-index conflict",
        "fix": "Use modal with higher z-index or close dropdown before opening modal",
        "documentation": "https://ec.europa.eu/..."
      }
    ],
    "warnings": [
      {
        "severity": "warning",
        "components": ["accordion", "tabs"],
        "message": "Nested interactive components may confuse users",
        "recommendation": "Consider alternative layout"
      }
    ],
    "compatibility": {
      "browser_support": "All modern browsers",
      "javascript_required": true,
      "known_issues": []
    }
  },
  "metadata": {
    "tool": "ecl_check_conflicts",
    "execution_time_ms": 2
  }
}
```

**Use Cases:**
- Pre-deployment conflict detection
- Component composition validation
- Bug prevention
- Architecture review

---

## Common Workflows

### Complete Component Validation

```javascript
// 1. Search for component
const component = await ecl_search_components({ 
  query: "button",
  limit: 1 
});

// 2. Get component details
const details = await ecl_get_component_details({ 
  component: "button" 
});

// 3. Validate usage
const validation = await ecl_validate_component_usage({
  component: "button",
  htmlCode: "<button class=\"ecl-button\">Click</button>"
});

// 4. Check accessibility
const accessibility = await ecl_check_accessibility({
  htmlCode: "<button class=\"ecl-button\">Click</button>",
  component: "button",
  targetLevel: "AA"
});

// 5. Analyze code quality
const analysis = await ecl_analyze_ecl_code({
  htmlCode: "<button class=\"ecl-button\">Click</button>"
});
```

### Pre-Deployment Checklist

```javascript
// 1. Validate all components
const validation = await ecl_validate_component_usage({
  component: "card",
  htmlCode: cardHtml
});

// 2. Check WCAG AA compliance
const accessibility = await ecl_check_accessibility({
  htmlCode: pageHtml,
  targetLevel: "AA"
});

// 3. Analyze code quality (target: >85)
const quality = await ecl_analyze_ecl_code({
  htmlCode: pageHtml,
  jsCode: pageJs,
  cssCode: pagesCss
});

// 4. Check for component conflicts
const conflicts = await ecl_check_conflicts({
  components: ["modal", "dropdown", "tooltip"],
  htmlCode: pageHtml
});

// All checks passed?
const readyToDeploy = 
  validation.data.quality_score > 85 &&
  accessibility.data.wcag_aa_compliant &&
  quality.data.overall_quality_score > 85 &&
  conflicts.data.conflicts.length === 0;
```

---

## Typography Best Practices

### Critical: ECL Font Inheritance Issue

**Problem:** ECL CSS defines `--ecl-font-family-default: arial, sans-serif` but **does NOT automatically apply it** to all elements. Without proper setup, text will display in browser default fonts (typically Times New Roman).

**Solution:** Use one of these approaches:

#### Approach 1: Container-Level Font (Recommended)
Set `font-family: arial, sans-serif` on your main container element:

```html
<body>
  <main class="ecl-container" style="font-family: arial, sans-serif">
    <h1>This will be Arial</h1>
    <p>All text inherits Arial from container</p>
  </main>
</body>
```

**Advantages:**
- Single declaration affects all descendant elements
- Most practical for full pages
- Ensures consistent font inheritance
- Works with or without ECL utility classes

#### Approach 2: ECL Typography Utility Classes
Add ECL typography classes to each text element:

```html
<h1 class="ecl-u-type-heading-1">Heading in Arial</h1>
<h2 class="ecl-u-type-heading-2">Subheading in Arial</h2>
<p class="ecl-u-type-paragraph-m">Paragraph in Arial</p>
```

**Advantages:**
- Proper font, size, line-height, and spacing
- Follows ECL design system exactly
- Includes responsive typography

**Available Classes:**
- Headings: `ecl-u-type-heading-1` through `ecl-u-type-heading-6`
- Paragraphs: `ecl-u-type-paragraph-xs`, `ecl-u-type-paragraph-s`, `ecl-u-type-paragraph-m`, `ecl-u-type-paragraph-l`
- Body text: `ecl-u-type-{xs|s|m|l|xl}`

#### Approach 3: Body-Level Font
Set font on the body element:

```html
<body style="font-family: arial, sans-serif">
  <main class="ecl-container">
    <h1>All text inherits Arial</h1>
  </main>
</body>
```

**Advantages:**
- Affects entire page
- Simplest implementation

### Validation Patterns

The server includes 4 validation patterns to detect typography issues:

**1. Missing Typography Classes** (Warning)
```html
<!-- ❌ Will trigger warning -->
<h1>Heading without ECL class</h1>

<!-- ✅ Correct -->
<h1 class="ecl-u-type-heading-1">Heading with ECL class</h1>
```

**2. Body Without Font** (Warning)
```html
<!-- ❌ Will trigger warning -->
<body>
  <main>Content</main>
</body>

<!-- ✅ Correct -->
<body style="font-family: arial, sans-serif">
  <main>Content</main>
</body>
```

**3. Main Container Without Font** (Info)
```html
<!-- ⚠️ Will trigger suggestion -->
<main class="ecl-container">
  <h1>Content</h1>
</main>

<!-- ✅ Better -->
<main class="ecl-container" style="font-family: arial, sans-serif">
  <h1>Content</h1>
</main>
```

**4. Non-Arial Fonts** (Error)
```html
<!-- ❌ Will trigger error -->
<div style="font-family: times new roman">Bad font</div>

<!-- ✅ Correct -->
<div style="font-family: arial, sans-serif">Correct font</div>
```

### Querying Typography Guidance

You can query typography guidance using `ecl_get_component_guidance`:

```javascript
const guidance = await ecl_get_component_guidance({
  component: "Typography"
});

// Returns:
// - caveat: Font inheritance limitation explanation
// - best-practice: Container-level font recommendation
// - do: Typography class usage guidance
// - note: Three approaches to ensure Arial font
```

---

## Code Generation

Generate runnable examples, customize components, and create interactive playgrounds for testing.

### `ecl_get_complete_example`

Get a complete, runnable example for a component with all dependencies included.

**Parameters:**
- `component` (string, required) - Component name (e.g., "button", "card")
- `example_type` (string, optional) - Filter by example type/use case (e.g., "basic", "advanced")
- `variant` (string, optional) - Filter by variant (e.g., "primary", "secondary")

**Returns:**
- `success` (boolean) - Whether operation succeeded
- `component` (string) - Component name
- `example_title` (string) - Human-readable title
- `variant` (string) - Component variant
- `complexity` (string) - Example complexity level
- `complete_code` (object) - Code with dependencies
  - `html` (string) - HTML snippet
  - `js` (string) - JavaScript code
  - `css` (string) - CSS code
  - `complete_html` (string) - Full HTML page ready to run
- `dependencies` (object) - Required dependencies
  - `stylesheets` (array) - CSS dependencies with CDN URLs
  - `scripts` (array) - JavaScript dependencies with CDN URLs
- `preview_url` (string) - Official ECL documentation URL
- `explanation` (string) - Human-readable explanation
- `customization_points` (array) - What can be customized
- `related_examples` (array) - Similar examples
- `accessibility_notes` (string) - WCAG compliance notes

**Example:**
```javascript
const example = await ecl_get_complete_example({
  component: "button",
  variant: "primary"
});

// Returns complete HTML page ready to save and open
console.log(example.complete_code.complete_html);
// <!doctype html>
// <html>...full working page...</html>

// See what can be customized
console.log(example.customization_points);
// ["variant", "size", "icon", "disabled state"]
```

---

### `ecl_generate_component`

Generate a customized component with specific properties and configurations.

**Parameters:**
- `component` (string, required) - Component name (e.g., "button", "card")
- `customization` (object, optional) - Customization options
  - `variant` (string) - Component variant (e.g., "primary", "secondary")
  - `size` (string) - Component size (e.g., "small", "large")
  - `content` (string|object) - Content to insert
    - For button: string or `{label, icon, iconPosition}`
    - For card: `{title, description, image}`
    - For link: `{label, href}`
  - `attributes` (object) - HTML attributes to add (e.g., `{disabled: true}`)
- `framework` (string, optional) - Target framework: "vanilla" (default), "react", "vue"
- `include_comments` (boolean, optional) - Add explanatory comments (default: false)

**Returns:**
- `success` (boolean) - Whether operation succeeded
- `component` (string) - Component name
- `generated_code` (object) - Generated code
  - `html` (string) - HTML code
  - `js` (string) - JavaScript initialization code
  - `css` (string) - CSS code (if needed)
- `customization_applied` (object) - What customizations were applied
- `usage_instructions` (string) - Step-by-step usage guide
- `accessibility_notes` (string) - WCAG compliance information
- `next_steps` (array) - Suggested next actions

**Example:**
```javascript
// Generate a customized button
const button = await ecl_generate_component({
  component: "button",
  customization: {
    variant: "primary",
    size: "large",
    content: "Submit Form",
    attributes: { type: "submit" }
  },
  include_comments: true
});

console.log(button.generated_code.html);
// <button class="ecl-button ecl-button--primary ecl-button--large" type="submit">
//   Submit Form
// </button>

console.log(button.usage_instructions);
// Step-by-step guide on how to use this component
```

---

### `ecl_create_playground`

Create a standalone HTML playground with multiple components for testing and experimentation.

**Parameters:**
- `components` (array, required) - List of component names to include (e.g., ["button", "card", "link"])
- `custom_code` (string, optional) - Additional custom HTML/CSS/JS to inject
- `include_all_variants` (boolean, optional) - Include all variants of each component (default: false)

**Returns:**
- `success` (boolean) - Whether operation succeeded
- `html_file` (string) - Complete HTML file content
- `components_included` (array) - List of components included
- `file_size` (number) - Approximate file size in bytes
- `instructions` (string) - How to use the playground

**Features:**
- Styled navigation menu with jump links
- Each component in its own section
- Collapsible code viewers showing HTML
- ECL styles and scripts from CDN
- Auto-initialization of interactive components
- Responsive design

**Example:**
```javascript
// Create a playground with multiple components
const playground = await ecl_create_playground({
  components: ["button", "card", "link", "tag"],
  custom_code: "<h2>My Custom Section</h2><p>Testing ECL components</p>",
  include_all_variants: true
});

// Save to file
const fs = require('fs');
fs.writeFileSync('ecl-playground.html', playground.html_file);
console.log(`Playground created: ${playground.file_size} bytes`);

// Open in browser to test components interactively
```

**Use Cases:**
- Rapid prototyping with multiple components
- Testing component combinations
- Creating component demos for presentations
- Learning ECL through interactive examples
- Visual regression testing

---

## Version History

- **v4.0** - Phase 5: Code generation tools with customization and playground
- **v3.0** - Phase 4: Validation & diagnostics tools with WCAG 2.1 checking
- **v2.0** - Phase 3: Enhanced search tools with semantic capabilities
- **v1.0** - Phase 1: Basic documentation server with legacy tools
