# ECL MCP Server Enhancement Plan

**Version:** 1.0  
**Date:** January 2025  
**Goal:** Transform the ECL MCP from a simple documentation server into a comprehensive, semantic-aware coding assistant for the Europa Component Library (EC variant)

---

## Executive Summary

This plan outlines the transformation of the ECL MCP server from Phase 1 (basic crawler + SQLite storage) into a world-class MCP server that provides **semantic tools, not just documents**. The enhancements will enable AI coding agents to:

- Understand ECL component relationships and dependencies
- Access structured API information instantly
- Get contextual code examples with complete implementations
- Validate component usage and accessibility compliance
- Navigate design tokens and styling systems
- Receive expert-level guidance on component selection and best practices

**Current State:**
- ✅ 169 pages crawled (130 components, 24 utilities, 7 guidelines, 8 resources)
- ✅ 756 code examples extracted (672 HTML, 80 JS, 4 CSS/other)
- ✅ 685 content sections indexed
- ✅ SQLite database with FTS5 full-text search
- ✅ Resumable crawler with 100% success rate

**Target State:**
- 🎯 Multi-mode search (topic, component, function, example, design token)
- 🎯 Structured JSON responses with metadata
- 🎯 Component relationship mapping
- 🎯 Usage validation and diagnostics
- 🎯 Accessibility compliance checking
- 🎯 Design token extraction and queries
- 🎯 Interactive example reconstruction
- 🎯 Cross-reference capabilities
- 🎯 "Why" explanations (caveats, limitations, notes)
- 🎯 Smart component suggestions

---

## Database Analysis Results

From the Phase 1 crawl, we discovered:

### Categories (169 total pages)
- **Components:** 130 pages (accordion, banner, blockquote, button, card, carousel, category-filter, content-item, date-block, expandable, fact-figures, file, icon, label, list, list-illustration, loading-indicator, modal, news-ticker, notification, popover, separator, social-media-follow, etc.)
- **Utilities:** 24 pages (background, border, clearfix, dimension, disablescroll, display, float, html-tag, layout, media, print, screen-reader, shadow, spacing, typography, z-index)
- **Guidelines:** 7 pages (Typography, Colours, Images, Iconography, Logos, Spacing)
- **Resources:** 8 pages (Getting Started, What's New, etc.)

### Content Structure Patterns
- **Common H2 Headings:** "When to use" (56), "Don'ts" (56), "Do's" (55), "When not to use" (53), "API" (25), "Setup" (24)
- **Code Languages:** HTML (672), JavaScript (80), CSS (2), Unknown (2)
- **Usage Pages:** Most components have dedicated `/usage` and `/code` pages

### Key Insights
1. Components have consistent structure: Do's, Don'ts, When to use, When not to use
2. 25 components have "API" sections that need structured extraction
3. Utilities include design system primitives (spacing, typography, colors)
4. Guidelines pages contain design tokens
5. Multiple code examples per component (avg ~5.8 examples per page)

---

## Phase 2: Database Schema Enhancement & Data Extraction

**Goal:** Restructure the database to support semantic queries and extract structured information from existing HTML.

**Estimated Effort:** 3-4 hours  
**Dependencies:** Phase 1 (Complete ✅)

### 2.1: Enhanced Database Schema

**New Tables:**

1. **`component_metadata`** - Enhanced component information
   ```sql
   - id (PRIMARY KEY)
   - name (TEXT, UNIQUE)
   - category (TEXT) -- components/utilities/guidelines
   - type (TEXT) -- navigation/form/data-display/layout/feedback/media/utility
   - description (TEXT)
   - usage_url (TEXT)
   - code_url (TEXT)
   - has_api (BOOLEAN)
   - has_javascript (BOOLEAN)
   - complexity (TEXT) -- simple/moderate/complex
   - responsive (BOOLEAN)
   - accessibility_notes (TEXT)
   ```

2. **`component_api`** - Structured API documentation
   ```sql
   - id (PRIMARY KEY)
   - component_id (FOREIGN KEY)
   - api_type (TEXT) -- method/option/event/property
   - name (TEXT)
   - signature (TEXT)
   - parameters (JSON)
   - returns (TEXT)
   - description (TEXT)
   - example (TEXT)
   - required (BOOLEAN)
   - default_value (TEXT)
   ```

3. **`design_tokens`** - Extracted design system values
   ```sql
   - id (PRIMARY KEY)
   - category (TEXT) -- color/spacing/typography/breakpoint/shadow/border
   - token_name (TEXT)
   - token_value (TEXT)
   - css_variable (TEXT)
   - sass_variable (TEXT)
   - description (TEXT)
   - usage_context (TEXT)
   ```

4. **`usage_guidance`** - Structured Do's/Don'ts/When to use
   ```sql
   - id (PRIMARY KEY)
   - component_id (FOREIGN KEY)
   - guidance_type (TEXT) -- dos/donts/when_to_use/when_not_to_use/notes/caveats/limitations
   - content (TEXT)
   - position (INTEGER)
   ```

5. **`component_relationships`** - Component dependencies and suggestions
   ```sql
   - id (PRIMARY KEY)
   - component_id (FOREIGN KEY)
   - related_component_id (FOREIGN KEY)
   - relationship_type (TEXT) -- requires/suggests/alternative/contains/used_with
   - description (TEXT)
   ```

6. **`component_tags`** - Taxonomy for cross-referencing
   ```sql
   - id (PRIMARY KEY)
   - component_id (FOREIGN KEY)
   - tag (TEXT) -- e.g., "interactive", "form-element", "navigation", "responsive"
   ```

7. **`enhanced_code_examples`** - Improved code example structure
   ```sql
   - id (PRIMARY KEY)
   - component_id (FOREIGN KEY)
   - example_title (TEXT)
   - example_type (TEXT) -- basic/advanced/interactive/responsive/accessible
   - html_code (TEXT)
   - js_code (TEXT)
   - css_code (TEXT)
   - description (TEXT)
   - preview_url (TEXT)
   - complexity (TEXT)
   - features (JSON) -- array of features demonstrated
   ```

8. **`accessibility_requirements`** - WCAG compliance information
   ```sql
   - id (PRIMARY KEY)
   - component_id (FOREIGN KEY)
   - wcag_level (TEXT) -- A/AA/AAA
   - requirement (TEXT)
   - how_to_comply (TEXT)
   - aria_attributes (JSON)
   - keyboard_interaction (TEXT)
   ```

**Indexes & FTS:**
- Create indexes on all foreign keys
- Add FTS5 tables for component_metadata, design_tokens, usage_guidance
- Compound indexes for common query patterns

### 2.2: Data Extraction Script

Create `scripts/extract-structured-data.js` to:

1. **Parse existing HTML pages** from `pages` table
2. **Extract component metadata** (type classification, complexity)
3. **Parse API sections** into structured format
4. **Extract design tokens** from Guidelines pages (colors, spacing, typography)
5. **Structure usage guidance** (Do's, Don'ts, When to use/not use)
6. **Identify component relationships** from content mentions
7. **Enhance code examples** with metadata and grouping
8. **Extract accessibility information** from content

**Key Parsing Logic:**
- Use Cheerio to parse HTML from database
- Regex patterns for API method signatures
- CSS/SCSS parsing for design token extraction
- Natural language processing for relationship detection
- Heuristics for component type classification

### 2.3: Data Validation & Quality Checks

- Verify all components have metadata
- Check API extractions for completeness
- Validate design token values
- Ensure code examples are grouped correctly
- Report missing or incomplete data

**Success Criteria:**
- ✅ All 8 new tables created with proper indexes
- ✅ All 130 components have structured metadata
- ✅ 25+ API sections extracted and structured
- ✅ 50+ design tokens catalogued
- ✅ 756 code examples enhanced with metadata
- ✅ All usage guidance categorized
- ✅ Initial component relationships identified

---

## Phase 3: Multi-Mode Search Implementation

**Goal:** Implement semantic search tools that go beyond simple text matching.

**Estimated Effort:** 4-5 hours  
**Dependencies:** Phase 2

### 3.1: Search Tool Architecture

Create `src/search/` directory with modular search engines:

1. **`ComponentSearch.js`** - Component-specific queries
2. **`DesignTokenSearch.js`** - Design system lookups
3. **`ExampleSearch.js`** - Code example matching
4. **`ApiSearch.js`** - API method/option lookup
5. **`GuidanceSearch.js`** - Usage guidance and best practices
6. **`CrossReferenceSearch.js`** - Relationship and tag-based queries

### 3.2: Search Modes & Tools

**Tool 1: `search_components`**
```javascript
{
  name: "search_components",
  parameters: {
    query: string,            // Text search query
    category?: string,        // Filter: components/utilities/guidelines
    type?: string,           // Filter: navigation/form/data-display/etc.
    has_api?: boolean,       // Filter: only components with APIs
    has_javascript?: boolean, // Filter: interactive components
    complexity?: string,     // Filter: simple/moderate/complex
    tags?: string[]          // Filter by tags
  },
  returns: {
    components: [{
      name, category, type, description,
      usage_url, code_url, complexity,
      tags, example_count, api_count,
      related_components
    }]
  }
}
```

**Tool 2: `search_design_tokens`**
```javascript
{
  name: "search_design_tokens",
  parameters: {
    query?: string,          // Text search
    category?: string,       // Filter: color/spacing/typography/etc.
    token_name?: string      // Exact token lookup
  },
  returns: {
    tokens: [{
      token_name, token_value, category,
      css_variable, sass_variable,
      description, usage_context,
      used_by_components: []
    }]
  }
}
```

**Tool 3: `search_code_examples`**
```javascript
{
  name: "search_code_examples",
  parameters: {
    component?: string,      // Filter by component
    query?: string,          // Search in code/description
    example_type?: string,   // basic/advanced/interactive/etc.
    has_javascript?: boolean,
    complexity?: string,
    features?: string[]      // Filter by demonstrated features
  },
  returns: {
    examples: [{
      component_name, example_title, example_type,
      html_code, js_code, css_code,
      description, complexity, features,
      preview_url
    }]
  }
}
```

**Tool 4: `search_api`**
```javascript
{
  name: "search_api",
  parameters: {
    component?: string,      // Filter by component
    api_type?: string,       // method/option/event/property
    name?: string,           // Search by API name
    query?: string           // Search in description
  },
  returns: {
    api_items: [{
      component_name, api_type, name,
      signature, parameters, returns,
      description, example, required, default_value
    }]
  }
}
```

**Tool 5: `get_component_guidance`**
```javascript
{
  name: "get_component_guidance",
  parameters: {
    component: string,       // Component name (required)
    guidance_type?: string   // Filter: dos/donts/when_to_use/etc.
  },
  returns: {
    component: string,
    guidance: {
      dos: [string],
      donts: [string],
      when_to_use: [string],
      when_not_to_use: [string],
      notes: [string],
      caveats: [string],
      limitations: [string]
    }
  }
}
```

**Tool 6: `find_related_components`**
```javascript
{
  name: "find_related_components",
  parameters: {
    component: string,              // Component name
    relationship_type?: string      // Filter: requires/suggests/alternative/etc.
  },
  returns: {
    component: string,
    relationships: [{
      related_component, relationship_type,
      description, why_related
    }]
  }
}
```

### 3.3: Smart Query Processing

Implement query intelligence:

1. **Query expansion** - "button" also searches "btn", "cta", "action"
2. **Fuzzy matching** - Handle typos and partial matches
3. **Relevance ranking** - Score results by relevance
4. **Context awareness** - Remember previous queries in conversation
5. **Suggestion system** - "Did you mean..." for unclear queries

### 3.4: Response Formatting

All search tools return **structured JSON**, not raw text:

```javascript
{
  query: { /* original query params */ },
  results_count: number,
  results: [ /* structured data */ ],
  suggestions: [ /* related searches */ ],
  metadata: {
    execution_time_ms: number,
    source: "ecl_database",
    version: "4.x"
  }
}
```

**Success Criteria:**
- ✅ 6 search tools implemented and registered with MCP
- ✅ All tools return structured JSON responses
- ✅ Query intelligence (expansion, fuzzy, ranking) working
- ✅ Average query time < 50ms
- ✅ Test coverage for all search modes

---

## Phase 4: Validation & Diagnostic Tools

**Goal:** Transform the MCP from passive documentation to active code assistant with validation and diagnostics.

**Estimated Effort:** 4-5 hours  
**Dependencies:** Phase 2, Phase 3

### 4.1: Component Usage Validator

**Tool: `validate_component_usage`**

Analyzes code snippets to check for common ECL mistakes:

```javascript
{
  name: "validate_component_usage",
  parameters: {
    component: string,       // Component name
    html_code: string,       // User's HTML code
    js_code?: string,        // User's JS code (if applicable)
    context?: string         // Additional context
  },
  returns: {
    is_valid: boolean,
    errors: [{
      severity: "error" | "warning" | "info",
      message: string,
      line?: number,
      suggestion: string,
      doc_link: string
    }],
    suggestions: [{
      type: "improvement" | "accessibility" | "best_practice",
      message: string,
      example_code: string
    }],
    score: number // 0-100
  }
}
```

**Validation Checks:**
1. **Required HTML structure** - Correct classes, nesting, attributes
2. **Required attributes** - data-*, aria-*, id, role, etc.
3. **CSS class naming** - Proper BEM/ECL conventions
4. **JavaScript initialization** - Correct API usage for interactive components
5. **Accessibility requirements** - ARIA attributes, keyboard support
6. **Responsive classes** - Proper breakpoint usage
7. **Common mistakes** - Known anti-patterns from usage guidance

### 4.2: Accessibility Compliance Checker

**Tool: `check_accessibility`**

Validates component accessibility against WCAG standards:

```javascript
{
  name: "check_accessibility",
  parameters: {
    html_code: string,
    component?: string,      // If known
    wcag_level?: "A" | "AA" | "AAA"
  },
  returns: {
    compliance_level: "A" | "AA" | "AAA" | "none",
    passed_checks: number,
    total_checks: number,
    issues: [{
      wcag_criterion: string,
      level: "A" | "AA" | "AAA",
      severity: "critical" | "serious" | "moderate" | "minor",
      issue: string,
      how_to_fix: string,
      example: string
    }],
    recommendations: [string]
  }
}
```

**Accessibility Checks:**
1. **Semantic HTML** - Proper heading hierarchy, landmarks
2. **ARIA attributes** - Required aria-* attributes present
3. **Keyboard navigation** - Tabindex, focus management
4. **Color contrast** - Text/background ratios (if colors detected)
5. **Alt text** - Images have descriptive alt attributes
6. **Form labels** - Inputs properly labeled
7. **Interactive states** - Focus indicators, hover states

### 4.3: Code Quality Analyzer

**Tool: `analyze_ecl_code`**

General code quality analysis for ECL implementations:

```javascript
{
  name: "analyze_ecl_code",
  parameters: {
    html_code: string,
    js_code?: string,
    css_code?: string
  },
  returns: {
    quality_score: number, // 0-100
    components_detected: [{
      name: string,
      confidence: number,
      location: string
    }],
    design_tokens_used: [string],
    best_practices: {
      followed: [string],
      violated: [string],
      suggestions: [string]
    },
    performance_notes: [string],
    maintainability_score: number
  }
}
```

**Analysis Features:**
1. **Component detection** - Automatically identify ECL components in code
2. **Design token usage** - Check if proper variables are used
3. **Best practices** - Compare against official guidelines
4. **Performance** - Identify heavy/inefficient patterns
5. **Maintainability** - Check for hardcoded values, magic numbers

### 4.4: Smart Suggestions Engine

**Tool: `suggest_components`**

Recommends components based on requirements:

```javascript
{
  name: "suggest_components",
  parameters: {
    requirement: string,     // What developer wants to build
    context?: string,        // Additional context
    constraints?: {
      no_javascript?: boolean,
      simple_only?: boolean,
      accessibility_level?: string
    }
  },
  returns: {
    suggestions: [{
      component: string,
      confidence: number,
      reason: string,
      example_url: string,
      alternatives: [string],
      considerations: [string]
    }],
    related_utilities: [string],
    design_patterns: [string]
  }
}
```

**Suggestion Logic:**
1. **Keyword matching** - Map requirements to component capabilities
2. **Use case analysis** - Match against "When to use" guidance
3. **Complexity assessment** - Suggest simple solutions first
4. **Accessibility consideration** - Factor in WCAG requirements
5. **Alternative recommendations** - Provide multiple options

### 4.5: Diagnostic Pattern Database

Create `src/diagnostics/patterns.js` with common issues:

```javascript
const DIAGNOSTIC_PATTERNS = {
  "missing-aria-label": {
    pattern: /<button[^>]*(?!aria-label)[^>]*>/,
    severity: "error",
    component: ["button", "link"],
    message: "Interactive elements should have aria-label or visible text",
    fix: 'Add aria-label="descriptive text" attribute'
  },
  "incorrect-bem": {
    pattern: /class="ecl-[^_]+_[^_]+_/,
    severity: "warning",
    message: "ECL uses double underscore (__) for BEM elements",
    fix: "Change single underscore to double: ecl-button__icon"
  },
  // ... 50+ diagnostic patterns
};
```

### 4.6: Validator Testing Suite

Create comprehensive tests:
- Unit tests for each validation rule
- Integration tests with real ECL code examples
- False positive/negative detection
- Performance benchmarks

**Success Criteria:**
- ✅ 4 validation/diagnostic tools implemented
- ✅ 50+ diagnostic patterns identified and coded
- ✅ Accessibility checker validates against WCAG 2.1 AA
- ✅ Component suggestion accuracy > 90%
- ✅ Comprehensive test coverage (>85%)
- ✅ Documentation for all validation rules

---

## Phase 5: Interactive Examples & Code Generation

**Goal:** Enable AI agents to generate complete, working ECL implementations with all necessary code (HTML/CSS/JS).

**Estimated Effort:** 4-5 hours  
**Dependencies:** Phase 2

### 5.1: Example Reconstruction System

Build system to reconstruct complete, runnable examples:

**Tool: `get_complete_example`**

```javascript
{
  name: "get_complete_example",
  parameters: {
    component: string,
    example_type?: string,   // basic/advanced/interactive/etc.
    variant?: string         // If component has variants
  },
  returns: {
    component: string,
    example_title: string,
    complete_code: {
      html: string,          // Complete HTML with all wrappers
      css: string,           // All required CSS (inline or links)
      js: string,            // All required JavaScript
      dependencies: [{       // External dependencies
        name: string,
        version: string,
        cdn_url: string,
        npm_package: string
      }]
    },
    preview_url: string,
    explanation: string,
    customization_points: [{
      property: string,
      description: string,
      example_values: [string]
    }],
    related_examples: [string]
  }
}
```

**Features:**
1. **Complete HTML** - Not just snippets, but full working markup
2. **CSS dependencies** - All required stylesheets identified
3. **JS initialization** - Proper script tags and initialization code
4. **CDN links** - Direct links to ECL assets
5. **Customization guide** - What can be changed and how

### 5.2: Code Generator

**Tool: `generate_component`**

AI-friendly component generator:

```javascript
{
  name: "generate_component",
  parameters: {
    component: string,
    customization?: {
      variant?: string,
      size?: string,
      color?: string,
      content?: object,      // Component-specific content
      attributes?: object     // Additional HTML attributes
    },
    framework?: "vanilla" | "react" | "vue", // If ECL has framework versions
    include_comments?: boolean
  },
  returns: {
    generated_code: {
      html: string,
      js?: string,
      css?: string
    },
    usage_instructions: string,
    accessibility_notes: string,
    next_steps: [string]
  }
}
```

**Generation Logic:**
1. **Template system** - Base templates for each component
2. **Content injection** - Insert user's custom content
3. **Variant selection** - Apply correct classes for variants
4. **Accessibility** - Auto-add required ARIA attributes
5. **Best practices** - Follow ECL guidelines automatically

### 5.3: Multi-Framework Support

If ECL has framework-specific implementations, create adapters:

**React Example:**
```javascript
generate_component({
  component: "button",
  framework: "react",
  customization: { variant: "primary", label: "Submit" }
})
// Returns:
// import { Button } from '@ecl/react-component-button';
// <Button variant="primary" label="Submit" />
```

**Vue Example:**
```javascript
generate_component({
  component: "button",
  framework: "vue",
  customization: { variant: "primary", label: "Submit" }
})
// Returns:
// <ecl-button variant="primary">Submit</ecl-button>
```

### 5.4: Example Playground Generator

**Tool: `create_playground`**

Generates standalone HTML files for testing:

```javascript
{
  name: "create_playground",
  parameters: {
    components: [string],    // Multiple components to include
    custom_code?: string,    // Additional custom code
    include_all_variants?: boolean
  },
  returns: {
    html_file: string,       // Complete standalone HTML
    instructions: string,
    file_size: string,
    components_included: [string]
  }
}
```

**Playground Features:**
- Self-contained HTML file (no external dependencies if possible)
- All ECL CSS/JS inlined or from CDN
- Multiple components demonstrated
- Interactive controls for variants
- Responsive preview modes

### 5.5: Code Snippet Library

Create `src/templates/` with reusable code templates:

```
templates/
├── components/
│   ├── button.js          // Button variants and states
│   ├── card.js            // Card layouts
│   ├── form.js            // Form patterns
│   └── ...
├── patterns/
│   ├── hero-section.js    // Common page patterns
│   ├── navigation.js      // Navigation patterns
│   └── ...
└── utilities/
    ├── spacing.js         // Spacing utilities
    ├── typography.js      // Typography helpers
    └── ...
```

Each template includes:
- Base HTML structure
- Variations and modifiers
- Accessibility requirements
- Usage notes
- Customization parameters

### 5.6: Example Metadata Enhancement

Update database extraction to capture:
- **Example context** - What scenario the example demonstrates
- **Complexity level** - Beginner/intermediate/advanced
- **Features demonstrated** - List of ECL features shown
- **Dependencies** - What other components are used
- **Browser support** - Any browser-specific notes

**Success Criteria:**
- ✅ Complete example reconstruction for all 130 components
- ✅ Code generator produces valid ECL markup
- ✅ 756 examples enhanced with complete code
- ✅ Playground generator creates working HTML files
- ✅ Template library covers all common patterns
- ✅ Multi-framework support (if applicable)

---

## Phase 6: Cross-Reference & Relationship System

**Goal:** Enable agents to understand component dependencies, relationships, and complex scenarios.

**Estimated Effort:** 3-4 hours  
**Dependencies:** Phase 2

### 6.1: Relationship Mapping

**Automated Relationship Detection:**

Create `scripts/detect-relationships.js` to analyze:

1. **Code Dependencies** - Components that use other components
   - Example: Modal → Button, Card → Icon
   
2. **Visual Hierarchy** - Parent/child relationships
   - Example: Grid → Card, Form → Input, Navigation → Link

3. **Functional Groups** - Components used together
   - Example: Search bar + Filter + Results list
   - Example: Header + Navigation + Logo

4. **Alternatives** - Similar components for different use cases
   - Example: Button vs Link, Modal vs Popover

5. **Utility Relationships** - Which utilities work with which components
   - Example: Spacing utilities + any component
   - Example: Typography utilities + text-heavy components

**Relationship Types:**
```javascript
const RELATIONSHIP_TYPES = {
  REQUIRES: "Component A requires Component B",
  SUGGESTS: "Component A works well with Component B",
  CONTAINS: "Component A typically contains Component B",
  ALTERNATIVE: "Component B is an alternative to Component A",
  CONFLICTS: "Component A shouldn't be used with Component B",
  EXTENDS: "Component A is a variant/extension of Component B"
};
```

### 6.2: Cross-Reference Tools

**Tool: `what_components_use`**

Find which components use a specific component:

```javascript
{
  name: "what_components_use",
  parameters: {
    component: string,       // Component to search for
    relationship_type?: string
  },
  returns: {
    component: string,
    used_by: [{
      component_name: string,
      relationship: string,
      context: string,
      examples: [string]
    }],
    usage_count: number
  }
}
```

**Tool: `what_affects`**

Find what components/options affect a specific feature:

```javascript
{
  name: "what_affects",
  parameters: {
    feature: string,         // e.g., "responsive behavior", "accessibility"
    component?: string       // Filter by component
  },
  returns: {
    feature: string,
    affected_by: [{
      type: "component" | "utility" | "design_token" | "api_option",
      name: string,
      how_it_affects: string,
      example: string
    }]
  }
}
```

**Tool: `find_patterns`**

Discover common usage patterns:

```javascript
{
  name: "find_patterns",
  parameters: {
    components: [string],    // Components to analyze together
    context?: string         // Usage context (navigation, forms, etc.)
  },
  returns: {
    patterns: [{
      name: string,
      description: string,
      components_used: [string],
      code_example: string,
      when_to_use: string,
      considerations: [string]
    }],
    official_examples: [string]
  }
}
```

### 6.3: Dependency Graph

Build visual dependency graph data:

**Tool: `get_dependency_graph`**

```javascript
{
  name: "get_dependency_graph",
  parameters: {
    component?: string,      // Start from specific component
    depth?: number,          // How many levels deep
    direction?: "dependencies" | "dependents" | "both"
  },
  returns: {
    graph: {
      nodes: [{
        id: string,
        name: string,
        type: string,
        complexity: string
      }],
      edges: [{
        from: string,
        to: string,
        relationship: string
      }]
    },
    summary: {
      total_dependencies: number,
      direct_dependencies: number,
      complexity_score: number
    }
  }
}
```

### 6.4: Conflict Detection

**Tool: `check_conflicts`**

Identify potential conflicts between components:

```javascript
{
  name: "check_conflicts",
  parameters: {
    components: [string],    // Components to check together
    context?: string
  },
  returns: {
    has_conflicts: boolean,
    conflicts: [{
      type: "style" | "behavior" | "accessibility" | "performance",
      severity: "error" | "warning" | "info",
      description: string,
      affected_components: [string],
      resolution: string
    }],
    warnings: [string],
    recommendations: [string]
  }
}
```

**Conflict Types to Detect:**
1. **CSS conflicts** - Competing styles or classes
2. **JavaScript conflicts** - Multiple initializations, event conflicts
3. **Accessibility conflicts** - Competing ARIA roles
4. **Z-index conflicts** - Overlapping elements
5. **Responsive conflicts** - Breakpoint mismatches

### 6.5: Tag System

Create comprehensive tagging:

**Component Tags:**
- **By Purpose:** navigation, form, data-display, feedback, media, layout
- **By Interactivity:** static, interactive, animated
- **By Complexity:** simple, moderate, complex
- **By Accessibility:** wcag-a, wcag-aa, wcag-aaa, keyboard-accessible
- **By Responsiveness:** mobile-first, responsive, desktop-only
- **By JavaScript:** no-js, requires-js, progressive-enhancement

**Tool: `search_by_tags`**

```javascript
{
  name: "search_by_tags",
  parameters: {
    tags: [string],          // Tags to search for
    match: "all" | "any"     // Match all tags or any tag
  },
  returns: {
    components: [{
      name: string,
      matching_tags: [string],
      all_tags: [string],
      relevance_score: number
    }]
  }
}
```

### 6.6: Usage Context Analysis

**Tool: `analyze_usage_context`**

Understand when and where components are typically used:

```javascript
{
  name: "analyze_usage_context",
  parameters: {
    component: string
  },
  returns: {
    common_contexts: [{
      context: string,        // e.g., "navigation", "hero section"
      frequency: number,
      typically_paired_with: [string],
      examples: [string]
    }],
    page_sections: [string], // header, footer, sidebar, main content
    use_cases: [{
      scenario: string,
      recommendation: string,
      alternatives: [string]
    }]
  }
}
```

**Success Criteria:**
- ✅ Relationship detection script identifies 200+ relationships
- ✅ 6 cross-reference tools implemented
- ✅ Dependency graph data generated for all components
- ✅ Conflict detection covers 5 conflict types
- ✅ Comprehensive tagging system (500+ tags)
- ✅ Usage context analysis for all components

---

## Phase 7: Design Token System & Styling Intelligence

**Goal:** Extract and expose ECL's design system for AI agents to understand colors, spacing, typography, and styling patterns.

**Estimated Effort:** 3-4 hours  
**Dependencies:** Phase 2

### 7.1: Design Token Extraction

Parse Guidelines pages to extract design tokens:

**Color Tokens:**
```javascript
{
  token_name: "primary-blue",
  token_value: "#004494",
  css_variable: "var(--ecl-color-primary)",
  sass_variable: "$ecl-color-primary",
  category: "color",
  subcategory: "brand",
  usage_context: "Primary actions, links, headers",
  accessibility: {
    contrast_ratios: {
      white: "7.2:1",
      black: "3.1:1"
    },
    wcag_compliance: "AA"
  }
}
```

**Spacing Tokens:**
```javascript
{
  token_name: "spacing-m",
  token_value: "16px",
  css_variable: "var(--ecl-spacing-m)",
  sass_variable: "$ecl-spacing-m",
  category: "spacing",
  usage_context: "Medium gaps between elements",
  responsive_variants: {
    mobile: "12px",
    tablet: "16px",
    desktop: "16px"
  }
}
```

**Typography Tokens:**
```javascript
{
  token_name: "heading-1",
  category: "typography",
  properties: {
    font_size: "2.5rem",
    line_height: "1.2",
    font_weight: "600",
    font_family: "Arial, sans-serif"
  },
  css_variable: "var(--ecl-typography-heading-1)",
  responsive_variants: { /* breakpoint variations */ }
}
```

**Other Token Categories:**
- **Breakpoints** - Responsive breakpoints (mobile, tablet, desktop)
- **Shadows** - Box shadow values
- **Borders** - Border widths, styles, radii
- **Z-index** - Layering system
- **Transitions** - Animation timings

### 7.2: Design Token Tools

**Tool: `get_design_token`**

Retrieve specific design tokens:

```javascript
{
  name: "get_design_token",
  parameters: {
    category?: string,       // Filter by category
    token_name?: string,     // Specific token lookup
    search?: string          // Search in usage context
  },
  returns: {
    tokens: [{
      token_name, token_value, category,
      css_variable, sass_variable,
      usage_context, examples,
      used_by_components: [string]
    }]
  }
}
```

**Tool: `find_color`**

Smart color lookup:

```javascript
{
  name: "find_color",
  parameters: {
    query: string,           // "blue", "primary", "background", etc.
    purpose?: string         // "text", "background", "border", "accent"
  },
  returns: {
    colors: [{
      name: string,
      hex: string,
      rgb: string,
      css_variable: string,
      usage: string,
      accessibility: {
        good_on_white: boolean,
        good_on_black: boolean,
        wcag_level: string
      },
      examples: [string]
    }],
    recommendations: [string]
  }
}
```

**Tool: `calculate_spacing`**

Help with spacing calculations:

```javascript
{
  name: "calculate_spacing",
  parameters: {
    context: string,         // What spacing is needed for
    size?: "xs" | "s" | "m" | "l" | "xl"
  },
  returns: {
    recommended_spacing: {
      token_name: string,
      value: string,
      css_variable: string,
      css_class: string      // e.g., "ecl-u-mt-m"
    },
    alternatives: [/* similar tokens */],
    responsive_behavior: string
  }
}
```

**Tool: `get_typography_scale`**

Access typography system:

```javascript
{
  name: "get_typography_scale",
  parameters: {
    element?: string,        // "heading", "paragraph", "small", etc.
    level?: number           // For headings: 1-6
  },
  returns: {
    typography: [{
      name: string,
      font_size: string,
      line_height: string,
      font_weight: string,
      css_class: string,      // e.g., "ecl-u-type-heading-1"
      when_to_use: string,
      example: string
    }]
  }
}
```

### 7.3: Style Validation

**Tool: `validate_styling`**

Check if custom styles match ECL design system:

```javascript
{
  name: "validate_styling",
  parameters: {
    css_code: string,        // CSS to validate
    strict?: boolean         // Enforce only ECL tokens
  },
  returns: {
    is_valid: boolean,
    issues: [{
      line: number,
      property: string,
      value: string,
      issue: "non-standard-value" | "hardcoded-value" | "deprecated",
      suggestion: string,
      ecl_token: string
    }],
    score: number,           // 0-100
    improvements: [string]
  }
}
```

**Validation Checks:**
1. **Hardcoded colors** - Suggest ECL color tokens
2. **Magic numbers** - Suggest spacing tokens
3. **Custom fonts** - Use ECL typography scale
4. **Non-responsive values** - Suggest responsive alternatives
5. **Deprecated tokens** - Warn about old design system values

### 7.4: Style Recommendation Engine

**Tool: `recommend_styles`**

Suggest appropriate styles for components:

```javascript
{
  name: "recommend_styles",
  parameters: {
    component: string,
    desired_effect: string   // "emphasize", "mute", "highlight", etc.
  },
  returns: {
    recommendations: [{
      property: string,
      token: string,
      value: string,
      reason: string,
      css_code: string
    }],
    examples: [string]
  }
}
```

### 7.5: Responsive Design Helper

**Tool: `get_responsive_utilities`**

Access responsive utilities and breakpoints:

```javascript
{
  name: "get_responsive_utilities",
  parameters: {
    component?: string,
    property?: string        // "display", "spacing", "typography", etc.
  },
  returns: {
    breakpoints: [{
      name: string,
      min_width: string,
      max_width: string
    }],
    utilities: [{
      utility_class: string,
      description: string,
      responsive_variants: [string],
      example: string
    }],
    best_practices: [string]
  }
}
```

### 7.6: Design Token Documentation Generator

Create comprehensive design token documentation:

**Output Format:**
```markdown
# ECL Design Tokens

## Colors
### Brand Colors
- **Primary Blue** (`#004494`)
  - CSS: `var(--ecl-color-primary)`
  - SCSS: `$ecl-color-primary`
  - Usage: Primary actions, links
  - WCAG AA compliant on white background
  - Used by: Button, Link, Header

## Spacing Scale
...
```

**Success Criteria:**
- ✅ All design tokens extracted from Guidelines pages
- ✅ 50+ color tokens catalogued with accessibility data
- ✅ Complete spacing scale documented
- ✅ Typography system fully mapped
- ✅ 6 design token tools implemented
- ✅ Style validation with 90%+ accuracy
- ✅ Responsive utilities documented

---

## Phase 8: MCP Server Integration & Optimization

**Goal:** Integrate all new features into the MCP server with proper architecture, error handling, and performance optimization.

**Estimated Effort:** 4-5 hours  
**Dependencies:** Phases 2-7

### 8.1: MCP Server Architecture Refactor

Restructure `index.js` into modular architecture:

```
src/
├── server.js              // Main MCP server entry point
├── database/
│   ├── connection.js      // Database connection management
│   ├── migrations.js      // Schema migrations
│   └── queries.js         // Common query helpers
├── search/
│   ├── ComponentSearch.js
│   ├── DesignTokenSearch.js
│   ├── ExampleSearch.js
│   ├── ApiSearch.js
│   ├── GuidanceSearch.js
│   └── CrossReferenceSearch.js
├── validation/
│   ├── ComponentValidator.js
│   ├── AccessibilityChecker.js
│   ├── CodeAnalyzer.js
│   └── patterns.js
├── generation/
│   ├── ExampleGenerator.js
│   ├── ComponentGenerator.js
│   ├── PlaygroundGenerator.js
│   └── templates/
├── tools/
│   ├── index.js           // Tool registry
│   ├── search-tools.js
│   ├── validation-tools.js
│   ├── generation-tools.js
│   ├── design-token-tools.js
│   └── cross-reference-tools.js
├── utils/
│   ├── logger.js
│   ├── cache.js
│   ├── error-handler.js
│   └── response-formatter.js
└── config/
    ├── database.js
    └── server.js
```

### 8.2: Tool Registration

Update MCP tool registration to include all new tools:

**Tool Categories:**
1. **Search Tools** (6 tools)
   - `search_components`
   - `search_design_tokens`
   - `search_code_examples`
   - `search_api`
   - `get_component_guidance`
   - `find_related_components`

2. **Validation Tools** (4 tools)
   - `validate_component_usage`
   - `check_accessibility`
   - `analyze_ecl_code`
   - `check_conflicts`

3. **Generation Tools** (3 tools)
   - `get_complete_example`
   - `generate_component`
   - `create_playground`

4. **Design Token Tools** (5 tools)
   - `get_design_token`
   - `find_color`
   - `calculate_spacing`
   - `get_typography_scale`
   - `validate_styling`

5. **Cross-Reference Tools** (6 tools)
   - `what_components_use`
   - `what_affects`
   - `find_patterns`
   - `get_dependency_graph`
   - `search_by_tags`
   - `analyze_usage_context`

6. **Helper Tools** (4 tools)
   - `suggest_components`
   - `recommend_styles`
   - `get_responsive_utilities`
   - `explain_component` (new)

**Total: 28 specialized tools**

### 8.3: Response Format Standardization

Create consistent response format for all tools:

```javascript
{
  success: boolean,
  data: {
    // Tool-specific response data
  },
  metadata: {
    tool: string,
    execution_time_ms: number,
    source: "ecl_database",
    version: "4.x",
    cache_hit: boolean,
    query_count: number
  },
  suggestions?: [string],   // Related queries or actions
  warnings?: [string],      // Non-critical issues
  errors?: [{              // If success === false
    code: string,
    message: string,
    details: object
  }]
}
```

### 8.4: Performance Optimization

**Caching Strategy:**
1. **In-memory cache** for frequently accessed data
   - Component metadata
   - Design tokens
   - Common queries
   - Cache TTL: 1 hour

2. **Query optimization**
   - Prepared statements for common queries
   - Index usage verification
   - Query plan analysis

3. **Lazy loading**
   - Load code examples only when requested
   - Defer relationship calculation until needed

**Performance Targets:**
- Simple queries: < 10ms
- Complex queries: < 50ms
- Code generation: < 100ms
- Full component analysis: < 200ms

### 8.5: Error Handling & Logging

**Error Categories:**
1. **Database errors** - Connection, query failures
2. **Validation errors** - Invalid input parameters
3. **Not found errors** - Component/token doesn't exist
4. **Parse errors** - Code parsing failures
5. **System errors** - Unexpected failures

**Logging Levels:**
- **DEBUG** - Detailed execution flow
- **INFO** - Tool invocations, cache hits
- **WARN** - Recoverable errors, deprecated features
- **ERROR** - Failures, exceptions

**Log Output:**
```
logs/
├── mcp-server.log         // Main server log
├── tool-usage.log         // Tool invocation tracking
├── performance.log        // Slow query tracking
└── error.log              // Error-only log
```

### 8.6: Configuration Management

Create `config/server.js`:

```javascript
module.exports = {
  database: {
    path: './ecl-database.sqlite',
    wal_mode: true,
    cache_size: 10000
  },
  cache: {
    enabled: true,
    ttl: 3600,  // 1 hour
    max_size: 100 * 1024 * 1024  // 100MB
  },
  performance: {
    slow_query_threshold_ms: 100,
    max_concurrent_queries: 10
  },
  logging: {
    level: 'info',
    max_file_size: '10M',
    max_files: 5
  },
  features: {
    legacy_json_support: true,  // Keep ecl-data.json support
    code_generation: true,
    validation: true,
    playground_generation: true
  }
};
```

### 8.7: Backward Compatibility

Maintain support for existing tools:
- Keep `search_ecl` tool as alias to `search_components`
- Support both JSON and SQLite data sources
- Environment variable to choose data source: `ECL_DATA_SOURCE=sqlite|json`

### 8.8: Health Check & Diagnostics

**Tool: `mcp_health_check`**

```javascript
{
  name: "mcp_health_check",
  returns: {
    status: "healthy" | "degraded" | "unhealthy",
    database: {
      connected: boolean,
      size_mb: number,
      tables_count: number,
      last_crawl: string
    },
    cache: {
      enabled: boolean,
      hit_rate: number,
      size_mb: number
    },
    performance: {
      avg_query_time_ms: number,
      slow_queries_24h: number
    },
    tools: {
      total: number,
      available: [string]
    }
  }
}
```

### 8.9: Testing Suite

Create comprehensive tests:

```
tests/
├── unit/
│   ├── search/          // Test each search module
│   ├── validation/      // Test validators
│   ├── generation/      // Test generators
│   └── utils/           // Test utilities
├── integration/
│   ├── mcp-tools.test.js    // Test tool integration
│   ├── database.test.js     // Test database queries
│   └── performance.test.js  // Performance benchmarks
└── fixtures/
    ├── components/      // Sample component data
    └── code-examples/   // Sample code for validation
```

**Test Coverage Goals:**
- Unit tests: > 85%
- Integration tests: All 28 tools
- Performance tests: All queries < target times

**Success Criteria:**
- ✅ Modular architecture implemented
- ✅ All 28 tools registered and functional
- ✅ Standardized response format across all tools
- ✅ Caching reduces avg query time by 50%
- ✅ Comprehensive error handling and logging
- ✅ Configuration management system
- ✅ Backward compatibility maintained
- ✅ Health check tool implemented
- ✅ Test coverage > 85%
- ✅ Performance targets met

---

## Phase 9: Documentation, NPM Package & End-User Experience

**Goal:** Package the MCP server for easy installation and use, with comprehensive documentation.

**Estimated Effort:** 3-4 hours  
**Dependencies:** Phase 8

### 9.1: End-User Documentation

Create comprehensive documentation:

**README.md** - Main documentation
```markdown
# ECL MCP Server

Expert-level Europa Component Library knowledge for AI coding agents.

## Features
- 28 specialized tools for ECL development
- 130+ components, 24 utilities, 7 guidelines
- 756 code examples with complete implementations
- Design token system with 50+ tokens
- Component validation and diagnostics
- Accessibility compliance checking
- Code generation and playground creation

## Installation
npm install ecl-mcp-server

## Quick Start
[Usage instructions]

## Available Tools
[Complete tool reference]
```

**TOOLS.md** - Detailed tool documentation
- Each tool documented with:
  - Purpose and use cases
  - Parameter descriptions
  - Response format
  - Example usage
  - Common patterns

**ARCHITECTURE.md** - Technical documentation
- System architecture
- Database schema
- Tool implementation details
- Performance characteristics
- Extension guide

**CHANGELOG.md** - Version history
- Phase 1: Initial crawler
- Phase 2-9: All enhancements

### 9.2: NPM Package Configuration

**package.json enhancements:**

```json
{
  "name": "ecl-mcp-server",
  "version": "2.0.0",
  "description": "MCP Server providing expert-level knowledge of Europa Component Library (ECL) v4 for AI coding agents",
  "main": "src/server.js",
  "bin": {
    "ecl-mcp": "./bin/cli.js",
    "ecl-mcp-crawl": "./scripts/crawl-ecl.js",
    "ecl-mcp-extract": "./scripts/extract-structured-data.js"
  },
  "scripts": {
    "start": "node src/server.js",
    "crawl": "node scripts/crawl-ecl.js",
    "extract": "node scripts/extract-structured-data.js",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "db:migrate": "node scripts/migrate-database.js",
    "db:status": "node scripts/database-status.js",
    "health": "node scripts/health-check.js"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "ecl",
    "europa-component-library",
    "european-commission",
    "design-system",
    "ai-assistant",
    "claude",
    "cursor",
    "coding-agent"
  ],
  "engines": {
    "node": ">=16.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/ecl-mcp-server"
  },
  "author": "European Commission Developer",
  "license": "MIT"
}
```

### 9.3: CLI Tools for End Users

**bin/cli.js** - Main CLI interface

```javascript
#!/usr/bin/env node

Commands:
- ecl-mcp start           // Start MCP server
- ecl-mcp crawl           // Update ECL data
- ecl-mcp extract         // Re-extract structured data
- ecl-mcp status          // Show database status
- ecl-mcp health          // Health check
- ecl-mcp search <query>  // Test search functionality
- ecl-mcp info <component> // Get component info
```

**scripts/database-status.js** - Database information

Shows:
- Database size
- Table counts
- Last crawl date
- Component count
- Example count
- Token count
- Index health

**scripts/health-check.js** - System diagnostics

Checks:
- Database connectivity
- Table integrity
- Index status
- Cache performance
- Query performance

### 9.4: Setup Scripts

**scripts/setup.js** - First-time setup

```javascript
// Automated setup:
1. Check Node.js version
2. Verify dependencies installed
3. Check if database exists
4. If no database:
   - Offer to download pre-built database OR
   - Offer to run crawler
5. Run database migrations
6. Verify data integrity
7. Run health check
8. Display success message
```

**scripts/update-ecl.js** - Update ECL data

```javascript
// Smart update:
1. Check last crawl date
2. If > 30 days, suggest update
3. Run incremental crawl (only changed pages)
4. Re-extract structured data
5. Update database
6. Preserve user customizations
7. Show changes summary
```

### 9.5: Pre-built Database Distribution

**Options for distribution:**

1. **Include in NPM package** (if < 50MB)
   - Pros: Instant setup
   - Cons: Larger package size

2. **Download on first run**
   - Pros: Smaller npm package
   - Cons: Requires internet on setup

3. **Both options available**
   - Default: download
   - Flag: `--include-database` for bundled version

**Recommendation:** Download on first run with caching

### 9.6: Configuration File

**ecl-mcp.config.js** - User configuration

```javascript
module.exports = {
  // Data source
  dataSource: 'sqlite',  // 'sqlite' or 'json'
  
  // Database
  databasePath: './ecl-database.sqlite',
  
  // Server
  port: 3000,
  
  // Features
  enableCache: true,
  enableValidation: true,
  enableCodeGeneration: true,
  
  // Logging
  logLevel: 'info',
  logPath: './logs',
  
  // Performance
  maxConcurrentQueries: 10,
  slowQueryThreshold: 100,
  
  // Crawler (for updates)
  crawlerDelay: 2000,
  crawlerUserAgent: 'ECL-MCP-Bot',
  
  // Customization
  customComponents: [],      // User-defined components
  customTokens: []           // User-defined tokens
};
```

### 9.7: Integration Examples

Create example integrations:

**examples/claude-desktop/**
```json
// Claude Desktop config
{
  "mcpServers": {
    "ecl": {
      "command": "npx",
      "args": ["ecl-mcp-server"]
    }
  }
}
```

**examples/cursor/**
```
// Cursor integration instructions
```

**examples/programmatic/**
```javascript
// Use as a library
const EclMcpServer = require('ecl-mcp-server');
const server = new EclMcpServer(config);
await server.start();
```

### 9.8: Migration Guide

**MIGRATION.md** - Upgrading from Phase 1

```markdown
# Migrating from v1.x to v2.x

## Breaking Changes
- None! v2.x is fully backward compatible

## New Features
- 27 new specialized tools
- Enhanced database schema
- Performance improvements

## Migration Steps
1. Update package: npm install ecl-mcp-server@latest
2. Run: ecl-mcp db:migrate
3. Optional: ecl-mcp extract (to populate new tables)
4. Restart MCP server

## Configuration Changes
[List of new config options]
```

### 9.9: Contribution Guide

**CONTRIBUTING.md**

```markdown
# Contributing to ECL MCP Server

## Adding New Tools
[Template and guidelines]

## Updating ECL Data
[How to run crawler for new ECL versions]

## Testing
[How to write tests]

## Code Style
[Linting and formatting rules]
```

### 9.10: Publishing Checklist

Before publishing to NPM:

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Examples working
- [ ] Database optimized
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] License file included
- [ ] .npmignore configured (exclude logs, tests)
- [ ] Version bumped
- [ ] Changelog updated
- [ ] README badges added
- [ ] GitHub repository setup
- [ ] CI/CD configured
- [ ] npm publish --dry-run successful

**Success Criteria:**
- ✅ Comprehensive documentation (4 main docs)
- ✅ NPM package properly configured
- ✅ CLI tools functional
- ✅ Setup script provides smooth first-run experience
- ✅ Configuration system flexible
- ✅ Integration examples for major AI tools
- ✅ Migration guide for existing users
- ✅ Contribution guidelines
- ✅ Ready for npm publish
- ✅ All checklist items completed

---

## Phase 10: Semantic Search (OPTIONAL)

**Goal:** Add AI-powered semantic search for handling fuzzy, high-level, or conceptual queries.

**Estimated Effort:** 6-8 hours  
**Dependencies:** Phase 2, 3  
**Status:** OPTIONAL - Requires external API (OpenAI/Anthropic/local embeddings)

### 10.1: Embedding Strategy

**Options:**

1. **OpenAI Embeddings** (Recommended)
   - API: `text-embedding-3-small`
   - Cost: ~$0.02 per 1M tokens
   - Quality: Excellent
   - Setup: Simple

2. **Anthropic Embeddings**
   - Use Claude API
   - Cost: Higher
   - Quality: Excellent

3. **Local Embeddings**
   - Model: `all-MiniLM-L6-v2` via transformers.js
   - Cost: Free
   - Quality: Good
   - Setup: More complex

**Recommendation:** Start with OpenAI, provide local as option

### 10.2: Embedding Generation

**What to embed:**

1. **Component descriptions** (130 components)
2. **Usage guidance** (Do's, Don'ts, When to use)
3. **Code examples with descriptions** (756 examples)
4. **Design token usage contexts** (50+ tokens)
5. **API documentation** (25+ components)

**Embedding storage:**

New table: `embeddings`
```sql
CREATE TABLE embeddings (
  id INTEGER PRIMARY KEY,
  entity_type TEXT,      -- 'component'/'example'/'guidance'/'token'
  entity_id INTEGER,
  content_text TEXT,
  embedding BLOB,        -- Serialized vector
  embedding_model TEXT,  -- Model used
  created_at TIMESTAMP
);
CREATE INDEX idx_embeddings_entity ON embeddings(entity_type, entity_id);
```

**Generation script:**

```javascript
// scripts/generate-embeddings.js
// - Batch process all content
// - Rate limit API calls
// - Store vectors in database
// - Show progress
// - Resume capability
```

### 10.3: Semantic Search Tool

**Tool: `semantic_search`**

```javascript
{
  name: "semantic_search",
  parameters: {
    query: string,           // Natural language query
    entity_type?: string,    // Filter: component/example/guidance/token
    top_k?: number,          // Number of results (default: 10)
    min_similarity?: number  // Minimum similarity threshold (0-1)
  },
  returns: {
    results: [{
      entity_type: string,
      entity: object,        // Full entity data
      similarity: number,    // 0-1 similarity score
      relevance_explanation: string,
      related_entities: [string]
    }],
    query_interpretation: string,
    alternative_queries: [string]
  }
}
```

**Use Cases:**
- "How do I create a user profile section?" → Suggests Card, Avatar, List
- "Need something for error messages" → Suggests Notification, Banner, Alert
- "What's the best way to show progress?" → Loading Indicator, Progress Bar
- "How to make a hero section" → Examples with Headers, Buttons, Images

### 10.4: Hybrid Search

Combine FTS + Semantic for best results:

```javascript
// Hybrid search algorithm:
1. Run FTS search (fast, exact matches)
2. Run semantic search (slower, conceptual matches)
3. Merge results with scoring:
   - FTS exact match: 1.0
   - FTS partial match: 0.7
   - Semantic high similarity (>0.8): 0.9
   - Semantic medium similarity (>0.6): 0.7
4. Deduplicate and rank
5. Return top K results
```

**Tool: `smart_search`**

Automatically chooses best search strategy:
- Specific terms → FTS
- Vague queries → Semantic
- Complex queries → Hybrid

### 10.5: Query Understanding

**Natural Language Processing:**

Extract intent from queries:
- "I need..." → Component suggestion
- "How do I..." → Example search
- "What's the best way..." → Pattern search
- "Show me..." → Direct retrieval
- "Why would I..." → Guidance search

**Query expansion:**
- Synonyms: "button" → "btn", "cta", "action"
- Related concepts: "form" → "input", "validation", "submit"
- ECL terminology: "primary button" → button with primary variant

### 10.6: Configuration

Add to `ecl-mcp.config.js`:

```javascript
{
  semanticSearch: {
    enabled: false,              // Off by default
    provider: 'openai',          // 'openai'/'anthropic'/'local'
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
    cacheEmbeddings: true,
    embeddingDimensions: 1536,
    similarityThreshold: 0.6
  }
}
```

### 10.7: Cost Management

**Strategies to minimize API costs:**

1. **Cache embeddings** - Generate once, reuse forever
2. **Batch processing** - Process multiple items per API call
3. **Lazy generation** - Only embed on first search if needed
4. **Local fallback** - Use local model as free alternative
5. **Smart caching** - Cache common query embeddings

**Cost estimation:**
- One-time embedding: ~$0.50 for all ECL content
- Ongoing: ~$0.01 per 100 queries

### 10.8: Implementation Priority

**If implementing semantic search:**

Priority order:
1. Component descriptions (highest value)
2. Usage guidance (high value)
3. Code examples (medium value)
4. Design tokens (lower value)

Can implement incrementally - start with just component search.

### 10.9: Testing Semantic Search

**Test queries:**
- "I need something to show alerts to users"
- "Best way to display a list of articles"
- "How do I make a navigation menu"
- "Component for uploading files"
- "What should I use for page layout"

**Success metrics:**
- Top 3 results include correct answer: >95%
- Average similarity score: >0.7
- Response time: <200ms

### 10.10: Documentation

If implemented, document:
- How to enable semantic search
- API key setup
- Cost implications
- When to use vs FTS
- Example queries
- Troubleshooting

**Success Criteria (if implemented):**
- ✅ Embedding generation script functional
- ✅ All content embedded (~1000 items)
- ✅ Semantic search tool integrated
- ✅ Hybrid search performs better than FTS alone
- ✅ Query understanding extracts intent accurately
- ✅ Cost < $1 per 1000 queries
- ✅ Response time < 200ms
- ✅ Test queries success rate > 95%

**Note:** This phase is optional and should only be implemented if:
- User has API keys for embedding service OR
- User wants to set up local embeddings OR
- FTS search proves insufficient for vague queries

---

## Summary & Timeline

### Overall Timeline

**Total Estimated Time:** 30-37 hours (excluding optional Phase 10)

| Phase | Description | Hours | Dependencies |
|-------|-------------|-------|--------------|
| 1 | Crawler & Database (Complete ✅) | - | None |
| 2 | Database Schema Enhancement | 3-4h | Phase 1 |
| 3 | Multi-Mode Search | 4-5h | Phase 2 |
| 4 | Validation & Diagnostics | 4-5h | Phase 2, 3 |
| 5 | Interactive Examples & Generation | 4-5h | Phase 2 |
| 6 | Cross-Reference & Relationships | 3-4h | Phase 2 |
| 7 | Design Token System | 3-4h | Phase 2 |
| 8 | MCP Integration & Optimization | 4-5h | Phase 2-7 |
| 9 | Documentation & NPM Package | 3-4h | Phase 8 |
| 10 | Semantic Search (OPTIONAL) | 6-8h | Phase 2, 3 |

### Recommended Work Sessions

**Session 1 (4-5 hours):** Phase 2 - Database Schema Enhancement
- Create all 8 new tables
- Write data extraction script
- Extract structured data from existing HTML
- Validate data quality
- **Checkpoint:** Database schema complete, data extracted

**Session 2 (4-5 hours):** Phase 3 - Multi-Mode Search
- Implement 6 search tools
- Create search modules
- Test query processing
- Optimize performance
- **Checkpoint:** All search tools functional

**Session 3 (4-5 hours):** Phase 4 - Validation & Diagnostics
- Implement 4 validation tools
- Create diagnostic patterns
- Build validation logic
- Test against real ECL code
- **Checkpoint:** Validation system working

**Session 4 (4-5 hours):** Phase 5 - Code Generation
- Implement 3 generation tools
- Create code templates
- Build example reconstruction
- Test generated code
- **Checkpoint:** Code generation functional

**Session 5 (3-4 hours):** Phase 6 - Cross-Reference
- Implement relationship detection
- Create 6 cross-reference tools
- Build dependency graph
- Test relationship accuracy
- **Checkpoint:** Cross-reference system complete

**Session 6 (3-4 hours):** Phase 7 - Design Tokens
- Extract design tokens from Guidelines
- Implement 6 design token tools
- Create style validation
- Test token lookups
- **Checkpoint:** Design token system functional

**Session 7 (4-5 hours):** Phase 8 - Integration
- Refactor MCP server architecture
- Register all 28 tools
- Implement caching
- Add error handling
- Performance optimization
- **Checkpoint:** Production-ready MCP server

**Session 8 (3-4 hours):** Phase 9 - Documentation
- Write comprehensive docs
- Configure NPM package
- Create CLI tools
- Build examples
- Final testing
- **Checkpoint:** Ready for npm publish

**Optional Session 9 (6-8 hours):** Phase 10 - Semantic Search
- Generate embeddings
- Implement semantic search
- Build hybrid search
- Test and optimize
- **Checkpoint:** Advanced semantic search working

### Deliverables

**Code Artifacts:**
- 28 specialized MCP tools
- 8 enhanced database tables
- Modular search/validation/generation systems
- Comprehensive test suite (>85% coverage)
- CLI tools for end-users
- Configuration system

**Documentation:**
- README.md (comprehensive user guide)
- TOOLS.md (complete tool reference)
- ARCHITECTURE.md (technical documentation)
- MIGRATION.md (upgrade guide)
- CONTRIBUTING.md (contributor guide)
- CHANGELOG.md (version history)

**Data:**
- Enhanced SQLite database (estimated ~25-30 MB)
- 130+ component metadata entries
- 756 enhanced code examples
- 50+ design tokens
- 200+ component relationships
- 500+ tags

**NPM Package:**
- Published to npm registry
- Semantic versioning
- Pre-built database option
- CLI tools included
- Examples and documentation

### Success Metrics

**Functionality:**
- ✅ 28 tools implemented and tested
- ✅ All tools return structured JSON
- ✅ Average query time < 50ms
- ✅ Validation accuracy > 90%
- ✅ Code generation produces valid markup
- ✅ Test coverage > 85%

**Data Quality:**
- ✅ 100% of components have metadata
- ✅ All API sections extracted and structured
- ✅ All design tokens catalogued
- ✅ Component relationships mapped
- ✅ Comprehensive tagging system

**User Experience:**
- ✅ One-command installation
- ✅ Automatic setup on first run
- ✅ Clear error messages
- ✅ Comprehensive documentation
- ✅ Easy integration with AI tools
- ✅ Simple update mechanism

**Performance:**
- ✅ Simple queries: < 10ms
- ✅ Complex queries: < 50ms
- ✅ Code generation: < 100ms
- ✅ Cache hit rate: > 80%
- ✅ Database size: < 50 MB

### Risk Assessment

**Low Risk:**
- ✅ Phase 1 already complete and proven
- ✅ SQLite is stable and well-supported
- ✅ Cheerio HTML parsing is reliable
- ✅ ECL documentation structure is consistent

**Medium Risk:**
- ⚠️ API extraction complexity (25 components with APIs)
- ⚠️ Relationship detection accuracy
- ⚠️ Design token extraction from visual guidelines
- **Mitigation:** Manual verification, iterative refinement

**Low-Medium Risk:**
- ⚠️ Validation rule completeness (50+ patterns)
- **Mitigation:** Start with most common issues, expand over time

**Optional/Deferred:**
- 🔵 Semantic search (Phase 10) - Not critical, can add later

### Future Enhancements (Beyond This Plan)

Potential future work:
1. **ECL v5 support** when released
2. **Visual regression testing** for generated components
3. **Interactive playground** web interface
4. **Component composition builder** (drag-and-drop)
5. **Real-time ECL updates** via webhook
6. **Multi-language support** (if ECL adds languages)
7. **Team collaboration features** (shared components/patterns)
8. **Analytics** (track most-used components/tools)
9. **AI-powered refactoring** (upgrade old ECL code)
10. **Browser extension** for inline ECL help

---

## Getting Started

### For the Developer (You)

**Next Steps:**
1. Review this plan in detail
2. Ask any questions or request clarifications
3. We'll create `ENHANCEMENT-PLAN-PROGRESS.md` to track progress
4. Begin with Session 1 (Phase 2)
5. After each session, update progress document
6. Take breaks between phases as needed

**Working Together:**
- We'll tackle each phase systematically
- After completing each phase, we'll update progress
- We'll test thoroughly at each checkpoint
- We can adjust the plan as we discover new requirements
- We'll take breaks between major phases

### For End-Users (After Completion)

**Installation:**
```bash
npm install ecl-mcp-server
```

**First Use:**
```bash
ecl-mcp start
# Automatic setup runs on first start
```

**Integration:**
Add to your AI tool's MCP configuration and start building with ECL!

---

## Conclusion

This enhancement plan transforms the ECL MCP Server from a basic documentation crawler into a **world-class, expert-level coding assistant** for the Europa Component Library.

**Key Transformations:**
- **From:** Text search only → **To:** 28 specialized semantic tools
- **From:** Raw documentation → **To:** Structured, queryable knowledge
- **From:** Passive reference → **To:** Active validation and code generation
- **From:** Component info → **To:** Complete design system understanding
- **From:** Simple lookup → **To:** Cross-reference and relationship intelligence

**Value Proposition:**
AI coding agents using this MCP will have instant access to comprehensive ECL expertise, enabling them to:
- Build ECL applications faster and more accurately
- Avoid common mistakes through validation
- Generate production-ready code
- Ensure accessibility compliance
- Follow ECL best practices automatically
- Understand complex component relationships
- Access the complete design system

**The Result:**
A developer using an AI agent with this MCP will feel like they have an ECL expert pair programmer who knows every component, every pattern, every design token, and every best practice—available instantly, every time.

---

**Ready to begin? Let's build something amazing! 🚀**

