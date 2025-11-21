# Building an ECL News/Content Listing Page

**Recipe ID:** 3
**Difficulty:** intermediate
**Components Used:** site-header, site-footer, page-header, breadcrumb, search-form, content-item, content-block, label, pagination, utilities
**Keywords:** news listing, content listing, publications, press releases, content item, search form, list page, feed page, thumbnail layout, card vs content item, pagination, site header, site footer, page header, breadcrumb, labels, metadata, filtering, search, list layout, vertical stack, ai agent, step by step, production ready

## Description
Complete step-by-step guide for building a production-ready news/publications listing page using the Europa Component Library. Learn when to use Content Items vs Cards, implement search functionality, display metadata with labels, and create proper list layouts with thumbnails.

---

# Recipe: Building an ECL News/Content Listing Page

## Overview
This recipe provides a complete guide for building a production-ready news/publications listing page using the Europa Component Library (ECL). You'll learn the critical distinction between Cards and Content Items, and how to create list pages that display properly with thumbnail images and metadata.

## Prerequisites
- Access to ECL MCP Server tools
- Local development environment with Python 3 (for HTTPS server)
- Text editor or file writing capability
- Understanding of HTML structure and semantic markup

---

## What You'll Build

A complete news listing page with:
- **Site Header** (Simplified variant with logo and language selector)
- **Page Header** with breadcrumb navigation, metadata, title, and description
- **Search Form** with proper form group structure
- **Results Count** using typography utilities
- **Content Item List** with 12+ items featuring:
  - Thumbnail images positioned left
  - Labels (highlight, high, medium variants)
  - Primary metadata (date)
  - Titles as links
  - Descriptions
  - Secondary metadata with icons
- **Pagination** component
- **Site Footer** (Two-row structure)

---

## When to Use This Pattern

### ✅ Use Content Items for:
- News/press release listings
- Publication catalogs
- Event listings
- Blog/article feeds
- Search results pages
- Any vertical list with thumbnail + content side-by-side

### ❌ Don't Use Content Items for:
- Photo galleries (use Cards in grid)
- Feature highlights (use Cards)
- Dashboard widgets (use Cards)
- Equal-height grid layouts (use Cards)

---

## 🔴 CRITICAL DECISION: Cards vs Content Items

### The Most Common ECL Mistake

**Problem:** Cards show HUGE hero images when used in list layouts
**Cause:** Cards are designed for grid layouts with hero images
**Solution:** Use Content Items for list/feed pages

### Visual Difference

**Cards:**
```
┌─────────────────┐
│                 │
│   HUGE IMAGE    │
│                 │
├─────────────────┤
│ Title           │
│ Description     │
└─────────────────┘
```

**Content Items:**
```
┌────┐ Title
│IMG │ Description
└────┘ Metadata
```

### When to Use Each

| Feature | Cards | Content Items |
|---------|-------|---------------|
| Layout | Grid (2-4 columns) | Vertical list (stacked) |
| Image | Hero (full width) | Thumbnail (side) |
| Use Case | Galleries, features | News, search results |
| CSS Class | `ecl-card` | `ecl-content-item` |
| Grid Needed | Yes | No |

---

## Step 1: Discover Components

### Start with ECL About
```
Call: mcp_ecl_about
```

**Purpose:** Understand what components are available in ECL.

**What you'll learn:**
- 70+ UI components available
- Content Item vs Card distinction
- ECL version (v4.11.1)

---

## Step 2: Search for All Required Components

### Search for Components in Parallel
```
Call: mcp_ecl_search(query="site header", limit=3)
Call: mcp_ecl_search(query="site footer", limit=3)
Call: mcp_ecl_search(query="page header", limit=3)
Call: mcp_ecl_search(query="search form", limit=3)
Call: mcp_ecl_search(query="content item", limit=5)
Call: mcp_ecl_search(query="card", limit=3)
Call: mcp_ecl_search(query="label", limit=3)
Call: mcp_ecl_search(query="pagination", limit=3)
```

**Pro Tip:** Make all search calls simultaneously for maximum speed.

**What you get:**
- URLs to component documentation
- Multiple variants for each component
- Code page locations

---

## Step 3: Get Starter Template

### Generate HTML Boilerplate
```
Call: mcp_ecl_get_starter_template(title="Latest News & Publications")
```

**What you get:**
```html
<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Latest News & Publications</title>
  <script>
    var cl = document.querySelector('html').classList;
    cl.remove('no-js');
    cl.add('has-js');
  </script>
  <link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/ecl-ec.css" media="screen">
  <link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/optional/ecl-ec-utilities.css" media="screen">
  <link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/ecl-ec-print.css" media="print">
</head>
<body>

  <!-- Your content goes here -->

  <script src="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/scripts/ecl-ec.js"></script>
  <script>
    ECL.autoInit();
  </script>
</body>
</html>
```

### 🔴 CRITICAL: Utilities CSS Required

**The starter template includes `ecl-ec-utilities.css` - this is MANDATORY.**

**Without utilities CSS:**
- Typography utilities won't work (`ecl-u-type-*`)
- Spacing utilities won't work (`ecl-u-mt-*`, `ecl-u-pv-*`)
- Layout utilities won't work (`ecl-u-flex-*`)
- Display utilities won't work (`ecl-u-d-*`)

**File is "optional" but NOT optional if you use ANY `ecl-u-*` classes.**

---

## Step 4: Get Component Code Examples

### Retrieve All Component Examples in Parallel
```
Call: mcp_ecl_get_examples(url="<site-header-code-url>")
Call: mcp_ecl_get_examples(url="<site-footer-code-url>")
Call: mcp_ecl_get_examples(url="<page-header-code-url>")
Call: mcp_ecl_get_examples(url="<search-form-code-url>")
Call: mcp_ecl_get_examples(url="<content-item-code-url>")
Call: mcp_ecl_get_examples(url="<label-code-url>")
Call: mcp_ecl_get_examples(url="<pagination-code-url>")
```

**What you get for each:**
- Multiple variants (e.g., Standardised, Core, Harmonised for headers)
- Ready-to-use HTML snippets
- Labeled examples for easy identification

**Components to select:**
- Site Header: **Simplified variant** (logo + language, no mega menu)
- Site Footer: **Site footer variant** (two-row structure, not harmonised)
- Page Header: **Default with breadcrumb and meta**
- Search Form: **Default with button**
- Content Item: **Large picture left variant**

---

## Step 5: Assemble the Page Structure

### Overall HTML Structure
```html
<body>
  <!-- Site Header -->
  <header class="ecl-site-header ecl-site-header-with-logo-l">...</header>
  
  <!-- Page Header with Breadcrumb -->
  <div class="ecl-page-header ecl-page-header--breadcrumb">
    <div class="ecl-container ecl-page-header__container">
      <nav class="ecl-breadcrumb">...</nav>
      <div class="ecl-page-header__body">
        <div class="ecl-page-header__meta">...</div>
        <div class="ecl-page-header__info">
          <h1 class="ecl-page-header__title">News & Publications</h1>
        </div>
        <div class="ecl-page-header__description-container">
          <p class="ecl-page-header__description">...</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Main Content -->
  <main class="ecl-u-pv-xl">
    <div class="ecl-container">
      <!-- Search Form -->
      <form class="ecl-search-form">...</form>
      
      <!-- Results Text -->
      <p class="ecl-u-type-paragraph">Showing 1-12 of 156 results</p>
      
      <!-- Content Items (12+) -->
      <article class="ecl-content-item">...</article>
      <article class="ecl-content-item">...</article>
      <!-- More items... -->
      
      <!-- Pagination -->
      <nav class="ecl-pagination">...</nav>
    </div>
  </main>
  
  <!-- Site Footer -->
  <footer class="ecl-site-footer">...</footer>
  
  <script src="..."></script>
  <script>ECL.autoInit();</script>
</body>
```

---

## Step 6: Build the Search Form

### 🔴 CRITICAL: Search Form Must Use Form Group

**Problem:** Search text box appears "split and not shown well"
**Cause:** Missing `ecl-form-group` wrapper
**Solution:** Wrap input in form group div

### Correct Search Form Pattern

```html
<form class="ecl-search-form" role="search">
  <div class="ecl-form-group">
    <label for="search-input-id" class="ecl-form-label ecl-search-form__label">Search</label>
    <input 
      id="search-input-id" 
      class="ecl-text-input ecl-text-input--m ecl-search-form__text-input" 
      type="search" 
      name="search" 
      placeholder="Search news and publications">
  </div>
  <button class="ecl-button ecl-button--ghost ecl-search-form__button" type="submit" aria-label="Search">
    <span class="ecl-button__container">
      <span class="ecl-button__label" data-ecl-label="true">Search</span>
      <svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-90 ecl-button__icon ecl-button__icon--after" focusable="false" aria-hidden="true" data-ecl-icon>
        <use xlink:href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/images/icons/sprites/icons.svg#corner-arrow"></use>
      </svg>
    </span>
  </button>
</form>
```

**Key points:**
- **MUST** wrap input in `<div class="ecl-form-group">`
- Label should have `ecl-search-form__label` class
- Input has both `ecl-text-input--m` and `ecl-search-form__text-input`
- Button uses `ecl-button--ghost` variant
- Icon rotated 90 degrees for right-pointing arrow

### ❌ Wrong Pattern (Will Break)
```html
<form class="ecl-search-form" role="search">
  <!-- Missing form-group wrapper! -->
  <label for="search-input-id" class="ecl-form-label">Search</label>
  <input id="search-input-id" class="ecl-text-input ecl-text-input--m" type="search">
  <button class="ecl-button ecl-button--ghost" type="submit">Search</button>
</form>
```

---

## Step 7: Add Results Count with Typography Utilities

### Use Semantic HTML + Utility Classes

**Correct Pattern:**
```html
<p class="ecl-u-type-paragraph">Showing 1-12 of 156 results</p>
```

**Key points:**
- Use `<p>` tag (semantic HTML), NOT `<div>`
- Use `ecl-u-type-paragraph` utility class
- Requires `ecl-ec-utilities.css` to be loaded

### ❌ Wrong Pattern
```html
<div class="ecl-u-type-paragraph">Showing 1-12 of 156 results</div>
```

**Why this matters:**
- ECL designed for semantic HTML
- Screen readers expect proper tags
- Utilities enhance, don't replace semantics

---

## Step 8: Build Content Item List

### 🔴 CRITICAL: Content Item Structure

This is the most important pattern in this recipe.

### Complete Content Item Example

```html
<article class="ecl-content-item">
  <picture class="ecl-picture ecl-content-item__picture ecl-content-item__picture--large ecl-content-item__picture--left" 
           data-ecl-picture-link>
    <img class="ecl-content-item__image" 
         src="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/images/example-image.jpg" 
         alt="News article image">
  </picture>
  <div class="ecl-content-block ecl-content-item__content-block" 
       data-ecl-auto-init="ContentBlock" 
       data-ecl-content-block>
    <ul class="ecl-content-block__label-container" aria-label="Labels">
      <li class="ecl-content-block__label-item">
        <span class="ecl-label ecl-label--highlight">Press Release</span>
      </li>
    </ul>
    <ul class="ecl-content-block__primary-meta-container">
      <li class="ecl-content-block__primary-meta-item">15 November 2024</li>
    </ul>
    <div class="ecl-content-block__title" data-ecl-title-link>
      <a href="#" class="ecl-link ecl-link--standalone">
        European Commission Launches New Digital Strategy for 2025
      </a>
    </div>
    <div class="ecl-content-block__description">
      The European Commission today unveiled its comprehensive digital transformation strategy 
      aimed at improving citizen services and promoting digital innovation across member states.
    </div>
    <ul class="ecl-content-block__secondary-meta-container">
      <li class="ecl-content-block__secondary-meta-item">
        <svg class="ecl-icon ecl-icon--s ecl-content-block__secondary-meta-icon" 
             focusable="false" aria-hidden="true">
          <use xlink:href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/images/icons/sprites/icons.svg#calendar"></use>
        </svg>
        <span class="ecl-content-block__secondary-meta-label">Event: 20 Nov 2024</span>
      </li>
      <li class="ecl-content-block__secondary-meta-item">
        <svg class="ecl-icon ecl-icon--s ecl-content-block__secondary-meta-icon" 
             focusable="false" aria-hidden="true">
          <use xlink:href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/images/icons/sprites/icons.svg#location"></use>
        </svg>
        <span class="ecl-content-block__secondary-meta-label">Brussels</span>
      </li>
    </ul>
  </div>
</article>
```

### Content Item Anatomy

**1. Picture Element (Thumbnail)**
```html
<picture class="ecl-picture 
                ecl-content-item__picture 
                ecl-content-item__picture--large 
                ecl-content-item__picture--left" 
         data-ecl-picture-link>
  <img class="ecl-content-item__image" src="..." alt="...">
</picture>
```

**Required modifiers:**
- `ecl-content-item__picture--large` OR `--small` (size modifier)
- `ecl-content-item__picture--left` OR `--right` OR `--top` (position modifier)
- `data-ecl-picture-link` attribute

**Why modifiers matter:**
- Without size modifier: image won't scale properly
- Without position modifier: layout breaks
- `--left` places thumbnail on left side (most common for lists)

**2. Content Block**
```html
<div class="ecl-content-block ecl-content-item__content-block" 
     data-ecl-auto-init="ContentBlock" 
     data-ecl-content-block>
  <!-- All content goes here -->
</div>
```

**Required attributes:**
- `data-ecl-auto-init="ContentBlock"` - JavaScript initialization
- `data-ecl-content-block` - Component marker

**3. Labels Container**
```html
<ul class="ecl-content-block__label-container" aria-label="Labels">
  <li class="ecl-content-block__label-item">
    <span class="ecl-label ecl-label--highlight">Label Text</span>
  </li>
</ul>
```

**Label variants:**
- `ecl-label--highlight` - Yellow background (most important)
- `ecl-label--high` - Red background (urgent)
- `ecl-label--medium` - Orange background (moderate)
- `ecl-label--low` - Blue background (low priority)
- No modifier - Gray background (default)

**Must use `<ul>`/`<li>` structure** - `<div>`/`<span>` will break styling.

**4. Primary Meta (Date)**
```html
<ul class="ecl-content-block__primary-meta-container">
  <li class="ecl-content-block__primary-meta-item">15 November 2024</li>
</ul>
```

**Purpose:** Main metadata, typically publication date
**Must use:** `<ul>`/`<li>` structure

**5. Title with Link**
```html
<div class="ecl-content-block__title" data-ecl-title-link>
  <a href="#" class="ecl-link ecl-link--standalone">Title Text</a>
</div>
```

**Key points:**
- Title is `<div>` NOT `<h1>` (content block handles semantics)
- Must have `data-ecl-title-link` attribute
- Link should use `ecl-link--standalone` variant

**6. Description**
```html
<div class="ecl-content-block__description">
  Description text here. Can be multiple sentences but keep concise.
</div>
```

**Key points:**
- Description has NO `<p>` wrapper
- Text goes directly in div
- Keep to 1-3 sentences for readability

**7. Secondary Meta (With Icons)**
```html
<ul class="ecl-content-block__secondary-meta-container">
  <li class="ecl-content-block__secondary-meta-item">
    <svg class="ecl-icon ecl-icon--s ecl-content-block__secondary-meta-icon" 
         focusable="false" aria-hidden="true">
      <use xlink:href="path/to/icons.svg#calendar"></use>
    </svg>
    <span class="ecl-content-block__secondary-meta-label">Event: 20 Nov 2024</span>
  </li>
</ul>
```

**Key points:**
- Icons use `ecl-icon--s` (small size), NOT `ecl-icon--xs`
- Each item has icon + label
- Common icons: `calendar`, `location`, `file`, `generic-lang`
- Must use `<ul>`/`<li>` structure

---

## Step 9: Common Content Item Variations

### Variation 1: Multiple Labels

```html
<ul class="ecl-content-block__label-container" aria-label="Labels">
  <li class="ecl-content-block__label-item">
    <span class="ecl-label ecl-label--highlight">Press Release</span>
  </li>
  <li class="ecl-content-block__label-item">
    <span class="ecl-label ecl-label--high">Urgent</span>
  </li>
</ul>
```

### Variation 2: Picture Right Instead of Left

```html
<picture class="ecl-picture 
                ecl-content-item__picture 
                ecl-content-item__picture--large 
                ecl-content-item__picture--right"
         data-ecl-picture-link>
  <img class="ecl-content-item__image" src="..." alt="...">
</picture>
```

**Note:** Change `--left` to `--right`

### Variation 3: Small Thumbnail

```html
<picture class="ecl-picture 
                ecl-content-item__picture 
                ecl-content-item__picture--small 
                ecl-content-item__picture--left"
         data-ecl-picture-link>
  <img class="ecl-content-item__image" src="..." alt="...">
</picture>
```

**Note:** Change `--large` to `--small`

### Variation 4: Picture on Top (Mobile-style)

```html
<picture class="ecl-picture 
                ecl-content-item__picture 
                ecl-content-item__picture--large 
                ecl-content-item__picture--top"
         data-ecl-picture-link>
  <img class="ecl-content-item__image" src="..." alt="...">
</picture>
```

**Note:** Use `--top` for stacked layout

### Variation 5: No Picture

```html
<article class="ecl-content-item">
  <!-- No picture element -->
  <div class="ecl-content-block ecl-content-item__content-block" 
       data-ecl-auto-init="ContentBlock" 
       data-ecl-content-block>
    <!-- Content only -->
  </div>
</article>
```

---

## Step 10: Add Pagination

### Standard Pagination Pattern

```html
<nav class="ecl-pagination" aria-label="Pagination" data-ecl-auto-init="Pagination">
  <ul class="ecl-pagination__list">
    <li class="ecl-pagination__item ecl-pagination__item--previous">
      <a href="?page=1" class="ecl-link ecl-link--standalone ecl-link--icon ecl-link--icon-before ecl-pagination__link" aria-label="Go to previous page">
        <svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-270 ecl-link__icon" focusable="false" aria-hidden="true">
          <use xlink:href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/images/icons/sprites/icons.svg#corner-arrow"></use>
        </svg>
        <span class="ecl-link__label">Previous</span>
      </a>
    </li>
    <li class="ecl-pagination__item">
      <a href="?page=1" class="ecl-link ecl-link--standalone ecl-pagination__link" aria-label="Go to page 1">
        <span class="ecl-link__label">1</span>
      </a>
    </li>
    <li class="ecl-pagination__item ecl-pagination__item--current">
      <span class="ecl-pagination__text ecl-pagination__text--summary" aria-current="page" aria-label="Page 2">2</span>
    </li>
    <li class="ecl-pagination__item">
      <a href="?page=3" class="ecl-link ecl-link--standalone ecl-pagination__link" aria-label="Go to page 3">
        <span class="ecl-link__label">3</span>
      </a>
    </li>
    <li class="ecl-pagination__item ecl-pagination__item--next">
      <a href="?page=3" class="ecl-link ecl-link--standalone ecl-link--icon ecl-link--icon-after ecl-pagination__link" aria-label="Go to next page">
        <span class="ecl-link__label">Next</span>
        <svg class="ecl-icon ecl-icon--xs ecl-icon--rotate-90 ecl-link__icon" focusable="false" aria-hidden="true">
          <use xlink:href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/images/icons/sprites/icons.svg#corner-arrow"></use>
        </svg>
      </a>
    </li>
  </ul>
</nav>
```

**Key points:**
- Add `data-ecl-auto-init="Pagination"` for JavaScript
- Current page uses `aria-current="page"`
- Previous/Next use rotated arrow icons
- Each link has descriptive `aria-label`

---

## Step 11: Build the Site Footer

### 🔴 CRITICAL: Site Footer vs Harmonised Footer

**Two different footer types:**
- **Harmonised Footer** (`ecl-footer ecl-footer--harmonised`) - Simpler, fewer sections
- **Site Footer** (`ecl-site-footer`) - Full EC footer with two-row layout

**For news listing pages, use Site Footer.**

### Site Footer Pattern (Two-Row Structure)

```html
<footer class="ecl-site-footer">
  <div class="ecl-container ecl-site-footer__container">
    <!-- FIRST ROW: Site branding and navigation -->
    <div class="ecl-site-footer__row">
      <div class="ecl-site-footer__column">
        <div class="ecl-site-footer__section ecl-site-footer__section--site-info">
          <div class="ecl-site-footer__title">
            <a href="#" class="ecl-link ecl-link--standalone ecl-site-footer__title-link">
              News & Publications
            </a>
          </div>
          <div class="ecl-site-footer__description">
            This site is managed by:<br />European Commission
          </div>
        </div>
      </div>
      <div class="ecl-site-footer__column">
        <div class="ecl-site-footer__section">
          <div class="ecl-site-footer__title">Contact</div>
          <ul class="ecl-site-footer__list">
            <li class="ecl-site-footer__list-item">
              <a href="#" class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">
                Contact form
              </a>
            </li>
            <li class="ecl-site-footer__list-item">
              <a href="#" class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">
                Press inquiries
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div class="ecl-site-footer__column">
        <div class="ecl-site-footer__section">
          <div class="ecl-site-footer__title">About this site</div>
          <ul class="ecl-site-footer__list">
            <li class="ecl-site-footer__list-item">
              <a href="#" class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">
                About the Commission
              </a>
            </li>
            <li class="ecl-site-footer__list-item">
              <a href="#" class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">
                Accessibility statement
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- SECOND ROW: Logo and legal links -->
    <div class="ecl-site-footer__row">
      <div class="ecl-site-footer__column">
        <div class="ecl-site-footer__section">
          <a href="https://commission.europa.eu" 
             class="ecl-link ecl-link--standalone ecl-site-footer__logo-link" 
             aria-label="European Commission">
            <picture class="ecl-picture ecl-site-footer__picture">
              <source srcset="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/images/logo/negative/logo-ec--en.svg" 
                      media="(min-width: 996px)">
              <img class="ecl-site-footer__logo-image" 
                   src="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/images/logo/negative/logo-ec--en.svg" 
                   alt="European Commission logo">
            </picture>
          </a>
        </div>
      </div>
      <div class="ecl-site-footer__column">
        <div class="ecl-site-footer__section ecl-site-footer__section--split-list">
          <ul class="ecl-site-footer__list ecl-site-footer__list--inline">
            <li class="ecl-site-footer__list-item">
              <a href="#" class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">
                Privacy policy
              </a>
            </li>
            <li class="ecl-site-footer__list-item">
              <a href="#" class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">
                Legal notice
              </a>
            </li>
            <li class="ecl-site-footer__list-item">
              <a href="#" class="ecl-link ecl-link--standalone ecl-link--inverted ecl-site-footer__link">
                Cookies
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</footer>
```

**Key structural points:**
- Two separate `ecl-site-footer__row` divs
- First row: Site branding section with `--site-info` modifier + navigation columns
- Second row: EC logo + legal links with `--split-list` modifier
- All links use `ecl-link--inverted` for light text on dark background
- Picture element for responsive EC logo

**Why not harmonised footer?**
- Harmonised footer has simpler structure (one content section)
- Site footer provides full EC branding and comprehensive footer
- Site footer matches the pattern from successful ECL examples

---

## Step 12: Component Auto-Initialization

### Critical JavaScript Setup

**Components requiring auto-init:**
- **Site Header** - `data-ecl-auto-init="SiteHeader"`
- **Breadcrumb** - `data-ecl-auto-init="Breadcrumb"`
- **Content Block** - `data-ecl-auto-init="ContentBlock"` (on each content item)
- **Pagination** - `data-ecl-auto-init="Pagination"`

**Footer script (REQUIRED):**
```html
<script src="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/scripts/ecl-ec.js"></script>
<script>
  ECL.autoInit();
</script>
```

**What ECL.autoInit() does:**
- Finds all elements with `data-ecl-auto-init` attribute
- Initializes corresponding ECL JavaScript components
- Enables interactive functionality (language selector, breadcrumb expand, content block interactions)

---

## Step 13: Test Your Listing Page

### Start HTTPS Server

**Why HTTPS is needed:**
- Some CDN assets require secure context
- Service workers require HTTPS
- Production-like testing environment

**Create simple HTTPS server:**
```python
# server.py
import http.server
import ssl

server_address = ('localhost', 8443)
httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket(httpd.socket,
                                server_side=True,
                                certfile='cert.pem',
                                keyfile='key.pem',
                                ssl_version=ssl.PROTOCOL_TLS)
print(f"Server running at https://localhost:8443")
httpd.serve_forever()
```

**Generate self-signed certificate:**
```bash
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
```

**Start server:**
```bash
python3 server.py
```

### Open in Browser
```
https://localhost:8443/news-listing.html
```

**Accept self-signed certificate warning** (safe for local development).

### Verification Checklist

**Visual checks:**
- ✅ Header displays with EU logo and language selector
- ✅ Page header shows breadcrumb, meta, title, description
- ✅ Search form displays properly (not split)
- ✅ Results count shows in correct font
- ✅ Content items show thumbnails on LEFT side (not huge hero images)
- ✅ All labels display with correct colors
- ✅ Titles are clickable links
- ✅ Secondary meta icons display properly (small size, not extra-small)
- ✅ Pagination displays with prev/next buttons
- ✅ Footer displays with two-row layout

**Functional checks:**
- ✅ Language selector button clickable
- ✅ Breadcrumb works (expandable on mobile)
- ✅ Search form submits
- ✅ Content item titles clickable
- ✅ Pagination links clickable

**Image size verification (CRITICAL):**
- ✅ Images are thumbnail size (~150-200px wide)
- ✅ Images positioned on left side of content
- ❌ If images are HUGE and full-width → you're using Cards not Content Items

**Responsive checks:**
- ✅ Mobile view (< 768px) - thumbnails stack on top
- ✅ Tablet view (768px - 996px) - thumbnails remain on left
- ✅ Desktop view (> 996px) - full layout

**Browser console:**
- ✅ No JavaScript errors
- ✅ ECL library loads successfully
- ✅ autoInit completes without errors
- ⚠️ 404s for placeholder images are OK (use your own images in production)

---

## Common Pitfalls & Solutions

### Problem 1: Images Are HUGE (Card vs Content Item Mistake)

**Symptom:** Images display full-width as hero images, pushing content below

**Cause:** Using `ecl-card` instead of `ecl-content-item`

**Why this happens:**
- Cards designed for grid layouts with hero images
- Content Items designed for list layouts with thumbnails

**Solution:** ✅ Use Content Items for list pages
```html
<!-- WRONG ❌ -->
<article class="ecl-card">
  <picture class="ecl-picture ecl-card__picture">
    <img class="ecl-card__image" src="...">
  </picture>
  <div class="ecl-card__body">
    <div class="ecl-content-block ecl-card__content-block">
      <!-- content -->
    </div>
  </div>
</article>

<!-- CORRECT ✅ -->
<article class="ecl-content-item">
  <picture class="ecl-picture ecl-content-item__picture ecl-content-item__picture--large ecl-content-item__picture--left">
    <img class="ecl-content-item__image" src="...">
  </picture>
  <div class="ecl-content-block ecl-content-item__content-block">
    <!-- content -->
  </div>
</article>
```

---

### Problem 2: Search Form Looks Broken

**Symptom:** Search text box appears split or not aligned properly

**Cause:** Missing `ecl-form-group` wrapper

**Solution:** ✅ Wrap input in form group
```html
<!-- WRONG ❌ -->
<form class="ecl-search-form">
  <label for="search-input-id" class="ecl-form-label">Search</label>
  <input id="search-input-id" class="ecl-text-input ecl-text-input--m" type="search">
  <button class="ecl-button ecl-button--ghost" type="submit">Search</button>
</form>

<!-- CORRECT ✅ -->
<form class="ecl-search-form">
  <div class="ecl-form-group">
    <label for="search-input-id" class="ecl-form-label ecl-search-form__label">Search</label>
    <input id="search-input-id" class="ecl-text-input ecl-text-input--m ecl-search-form__text-input" type="search">
  </div>
  <button class="ecl-button ecl-button--ghost ecl-search-form__button" type="submit">Search</button>
</form>
```

---

### Problem 3: Typography Utilities Don't Work

**Symptom:** Results text has wrong font despite using `ecl-u-type-paragraph`

**Cause:** Missing `ecl-ec-utilities.css` file

**Solution:** ✅ Add utilities CSS to `<head>`
```html
<link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/ecl-ec.css" media="screen">
<link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/optional/ecl-ec-utilities.css" media="screen">
<link rel="stylesheet" href="https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/styles/ecl-ec-print.css" media="print">
```

**Critical:** Utilities CSS is in `/optional/` directory but is NOT optional if you use ANY `ecl-u-*` classes.

---

### Problem 4: Footer Layout Broken

**Symptom:** Footer elements overlapping or wrong layout

**Cause:** Using Harmonised Footer structure with Site Footer classes (or vice versa)

**Solution:** ✅ Use complete Site Footer pattern with two-row structure

**These are NOT interchangeable:**
- `ecl-footer ecl-footer--harmonised` - Different component
- `ecl-site-footer` - Different component

**You must use the complete markup pattern for the footer type you choose.**

---

### Problem 5: Content Item Layout Broken

**Symptom:** Thumbnail not positioned correctly or image wrong size

**Cause:** Missing picture modifiers

**Solution:** ✅ Add BOTH size and position modifiers
```html
<!-- WRONG ❌ - Missing modifiers -->
<picture class="ecl-picture ecl-content-item__picture">
  <img class="ecl-content-item__image" src="...">
</picture>

<!-- CORRECT ✅ - Has both modifiers -->
<picture class="ecl-picture ecl-content-item__picture ecl-content-item__picture--large ecl-content-item__picture--left">
  <img class="ecl-content-item__image" src="...">
</picture>
```

**Required modifiers:**
- Size: `--large` or `--small`
- Position: `--left`, `--right`, or `--top`

---

### Problem 6: Secondary Meta Icons Wrong Size

**Symptom:** Icons in secondary metadata look too small

**Cause:** Using `ecl-icon--xs` (extra-small) instead of `ecl-icon--s` (small)

**Solution:** ✅ Use small icon size
```html
<!-- WRONG ❌ -->
<svg class="ecl-icon ecl-icon--xs ecl-content-block__secondary-meta-icon">
  <use xlink:href="path/to/icons.svg#calendar"></use>
</svg>

<!-- CORRECT ✅ -->
<svg class="ecl-icon ecl-icon--s ecl-content-block__secondary-meta-icon">
  <use xlink:href="path/to/icons.svg#calendar"></use>
</svg>
```

---

### Problem 7: Labels/Meta Using Divs Instead of Lists

**Symptom:** Labels or metadata not styling correctly

**Cause:** Using `<div>`/`<span>` instead of `<ul>`/`<li>` structure

**Solution:** ✅ Use proper list structure
```html
<!-- WRONG ❌ -->
<div class="ecl-content-block__label-container">
  <span class="ecl-content-block__label-item">
    <span class="ecl-label ecl-label--highlight">Label</span>
  </span>
</div>

<!-- CORRECT ✅ -->
<ul class="ecl-content-block__label-container" aria-label="Labels">
  <li class="ecl-content-block__label-item">
    <span class="ecl-label ecl-label--highlight">Label</span>
  </li>
</ul>
```

**Applies to:**
- Label container
- Primary meta container
- Secondary meta container

---

## Content Item Quick Reference Guide

### Picture Position & Size

| Modifier | Effect |
|----------|--------|
| `--large` | Larger thumbnail (~200px) |
| `--small` | Smaller thumbnail (~150px) |
| `--left` | Thumbnail on left, content on right |
| `--right` | Thumbnail on right, content on left |
| `--top` | Thumbnail on top, content below (mobile style) |

### Label Variants

| Variant | Color | Use Case |
|---------|-------|----------|
| `ecl-label--highlight` | Yellow | Featured/Important |
| `ecl-label--high` | Red | Urgent/Critical |
| `ecl-label--medium` | Orange | Moderate Priority |
| `ecl-label--low` | Blue | Low Priority |
| (no modifier) | Gray | Default/Neutral |

### Icon Sizes

| Size | Class | Use Case |
|------|-------|----------|
| Extra Small | `ecl-icon--xs` | Buttons, inline text |
| Small | `ecl-icon--s` | Content block meta (✅ Use this) |
| Medium | `ecl-icon--m` | Standalone icons |
| Large | `ecl-icon--l` | Headers, emphasis |

### Common Icons

| Icon | ID | Use Case |
|------|-------|----------|
| Calendar | `#calendar` | Dates, events |
| Location | `#location` | Places, addresses |
| File | `#file` | Documents, downloads |
| Language | `#generic-lang` | Translations |
| Check | `#check` | Checkboxes |
| Arrow | `#corner-arrow` | Navigation, links |

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] Test on all browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on all devices (mobile, tablet, desktop)
- [ ] Verify responsive behavior (thumbnail stacking on mobile)
- [ ] Test keyboard navigation
- [ ] Test screen reader (NVDA, JAWS, VoiceOver)
- [ ] Validate HTML (W3C validator)
- [ ] Check accessibility (axe, Lighthouse)
- [ ] Verify all links work
- [ ] Replace placeholder images with real content
- [ ] Test search form submission
- [ ] Test pagination navigation

### Content Integration

- [ ] Connect to content API/database
- [ ] Implement dynamic pagination
- [ ] Add search filtering logic
- [ ] Set up image CDN or storage
- [ ] Optimize images (WebP, lazy loading)
- [ ] Add meta tags for SEO
- [ ] Implement social sharing meta tags
- [ ] Set up analytics tracking

### Performance

- [ ] Optimize image sizes (thumbnails don't need to be huge files)
- [ ] Implement lazy loading for images below fold
- [ ] Consider CDN for assets
- [ ] Minify CSS/JS if not using CDN
- [ ] Test page load time (< 3s on 3G)
- [ ] Implement pagination to limit items per page (12-24 items)

### Accessibility

- [ ] All images have descriptive alt text
- [ ] All links have descriptive aria-labels
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all content correctly
- [ ] Focus indicators visible

### SEO

- [ ] Page title descriptive and unique
- [ ] Meta description present (155 chars)
- [ ] Heading hierarchy logical (h1 → h2 → h3)
- [ ] Canonical URL set
- [ ] Schema.org markup for articles/news
- [ ] Sitemap includes listing page
- [ ] Robots.txt configured

---

## Optional Enhancements

### 1. Add Filtering Sidebar

```html
<div class="ecl-u-d-flex">
  <aside class="ecl-u-mr-l" style="width: 250px;">
    <h2 class="ecl-u-type-heading-2">Filter Results</h2>
    <!-- Filter options here -->
  </aside>
  <div style="flex: 1;">
    <!-- Content items here -->
  </div>
</div>
```

### 2. Add Sort Dropdown

```html
<div class="ecl-u-d-flex ecl-u-justify-content-between ecl-u-align-items-center ecl-u-mb-m">
  <p class="ecl-u-type-paragraph">Showing 1-12 of 156 results</p>
  <div class="ecl-select__container ecl-select__container--s">
    <select class="ecl-select" data-ecl-auto-init="Select">
      <option value="recent">Most Recent</option>
      <option value="popular">Most Popular</option>
      <option value="title">Title A-Z</option>
    </select>
  </div>
</div>
```

### 3. Add Load More Button

```html
<div class="ecl-u-ta-center ecl-u-mt-l">
  <button class="ecl-button ecl-button--secondary" type="button">
    Load More Articles
  </button>
</div>
```

### 4. Add No Results State

```html
<div class="ecl-u-ta-center ecl-u-pv-4xl">
  <svg class="ecl-icon ecl-icon--2xl" focusable="false" aria-hidden="true">
    <use xlink:href="path/to/icons.svg#error"></use>
  </svg>
  <h2 class="ecl-u-type-heading-2 ecl-u-mt-m">No results found</h2>
  <p class="ecl-u-type-paragraph ecl-u-mt-s">
    Try adjusting your search or filter criteria
  </p>
</div>
```

### 5. Add Featured Item at Top

```html
<article class="ecl-content-item ecl-u-bg-grey-5 ecl-u-pa-m ecl-u-mb-l">
  <picture class="ecl-picture ecl-content-item__picture ecl-content-item__picture--large ecl-content-item__picture--left">
    <img class="ecl-content-item__image" src="..." alt="...">
  </picture>
  <div class="ecl-content-block ecl-content-item__content-block">
    <ul class="ecl-content-block__label-container" aria-label="Labels">
      <li class="ecl-content-block__label-item">
        <span class="ecl-label ecl-label--highlight">Featured</span>
      </li>
    </ul>
    <!-- Rest of content -->
  </div>
</article>
```

---

## Summary: The One-Go Process

For an AI agent to create a news listing page in one go:

### Phase 1: Discovery (Parallel Calls)
```
1. mcp_ecl_about
2. mcp_ecl_search(query="site header", limit=3)
3. mcp_ecl_search(query="site footer", limit=3)
4. mcp_ecl_search(query="page header", limit=3)
5. mcp_ecl_search(query="search form", limit=3)
6. mcp_ecl_search(query="content item", limit=5)
7. mcp_ecl_search(query="label", limit=3)
8. mcp_ecl_search(query="pagination", limit=3)
```

### Phase 2: Code Retrieval (Parallel Calls)
```
9. mcp_ecl_get_starter_template(title="Latest News & Publications")
10. mcp_ecl_get_examples(url=<site-header-code-url>)
11. mcp_ecl_get_examples(url=<site-footer-code-url>)
12. mcp_ecl_get_examples(url=<page-header-code-url>)
13. mcp_ecl_get_examples(url=<search-form-code-url>)
14. mcp_ecl_get_examples(url=<content-item-code-url>)
15. mcp_ecl_get_examples(url=<label-code-url>)
16. mcp_ecl_get_examples(url=<pagination-code-url>)
```

### Phase 3: Assembly
```
17. Start with starter template HTML
18. Verify utilities CSS is included (CRITICAL)
19. Add Site Header (Simplified variant with logo-l)
20. Add Page Header with Breadcrumb
21. Add Main content wrapper with container
22. Add Search Form (WITH ecl-form-group wrapper)
23. Add results count with <p> tag + ecl-u-type-paragraph
24. Add 12+ Content Items (use --large --left modifiers)
25. Add Pagination component
26. Add Site Footer (Two-row structure, NOT harmonised)
27. Verify ECL.autoInit() in footer
```

### Phase 4: File Creation
```
28. write(file_path="news-listing.html", content=<assembled-html>)
```

### Phase 5: Testing Setup
```
29. Create HTTPS server (server.py with SSL)
30. Generate self-signed certificate
31. bash: python3 server.py
32. Verify at https://localhost:8443/news-listing.html
```

**Total time:** ~3-4 minutes for complete, production-ready listing page

---

## Critical Success Factors

### 🔴 Must-Do Items (Will Break Without These)

1. **Use Content Items, NOT Cards** - Cards show huge hero images
2. **Include utilities CSS** - Typography and spacing won't work without it
3. **Wrap search form input in ecl-form-group** - Form will look broken
4. **Add picture modifiers** - `--large` AND `--left` (or `--right`/`--top`)
5. **Use list structure for labels/meta** - `<ul>`/`<li>` not `<div>`/`<span>`
6. **Use site footer, not harmonised** - Different structure entirely
7. **Add data-ecl-auto-init attributes** - Components won't initialize
8. **Call ECL.autoInit()** - JavaScript features won't work
9. **Use semantic HTML** - `<p>` for paragraphs, not `<div>`
10. **Use HTTPS server** - Some CDN assets require secure context

### 🟡 Should-Do Items (Best Practices)

1. Use consistent picture size (`--large` for all items)
2. Use consistent picture position (`--left` for list pages)
3. Use small icons (`--s`) in secondary meta, not extra-small (`--xs`)
4. Include `data-ecl-title-link` on title divs
5. Include `data-ecl-picture-link` on picture elements
6. Use descriptive alt text for all images
7. Keep descriptions concise (1-3 sentences)
8. Use appropriate label variants (highlight, high, medium)

### 🟢 Nice-to-Have Items (Enhancements)

1. Dynamic pagination from database
2. Search filtering functionality
3. Sort dropdown
4. Featured item at top
5. Load more button
6. No results state
7. Filtering sidebar
8. Image lazy loading

---

## When NOT to Use This Pattern

### Use Cards Instead When:
- Building a photo gallery
- Creating a grid of features/products
- Need equal-height items in columns
- Hero images are the primary focus
- Using 2-4 column grid layout

### Use Different Pattern When:
- Single article page → Use article component
- Dashboard → Use cards or widgets
- Table of data → Use table component
- Timeline → Use timeline component
- Media gallery → Use media container

---

## Resources

**Official ECL Documentation:**
- Main site: https://ec.europa.eu/component-library/
- Content Item: https://ec.europa.eu/component-library/ec/components/content-item/
- Card: https://ec.europa.eu/component-library/ec/components/card/
- GitHub: https://github.com/ec-europa/europa-component-library

**ECL Version Used:** v4.11.1

**CDN Base URL:**
```
https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec/
```

**Component Documentation Pages:**
- Content Item: /components/content-item/
- Card: /components/card/
- Search Form: /components/forms/search-form/
- Pagination: /components/pagination/
- Label: /components/label/

---

## Key Learnings from Development

### Discovery 1: Cards vs Content Items
**Problem:** Initial implementation used Cards, resulting in massive hero images.
**User Feedback:** "the images are still just massive... Cards on the ecl website just have a big image... maybe we should use content item instead"
**Solution:** Converted entire page from Cards to Content Items.
**Result:** Thumbnails displayed properly beside content, proper list layout achieved.

### Discovery 2: Utilities CSS is Required
**Problem:** Typography utilities not working despite correct classes.
**Investigation:** Compared working reference file, found missing CSS file.
**Solution:** Added `ecl-ec-utilities.css` to `<head>`.
**Result:** All utility classes (`ecl-u-*`) worked correctly.

### Discovery 3: Search Form Needs Form Group
**Problem:** Search text box appeared "split and not shown well."
**Investigation:** Compared with ECL documentation examples.
**Solution:** Wrapped input element in `<div class="ecl-form-group">`.
**Result:** Search form displayed correctly with proper alignment.

### Discovery 4: Site Footer vs Harmonised Footer
**Problem:** Footer layout completely broken, elements overlapping.
**Investigation:** Compared with working reference file (fishing-benchmarks.html).
**Solution:** Replaced entire footer structure with site footer pattern (two-row layout).
**Result:** Footer displayed correctly with proper spacing and sections.

### Discovery 5: Reference Files Are Invaluable
**Pattern:** When documentation unclear or component not working, find a working example.
**Method:** Used fishing-benchmarks.html as reference for header and footer.
**Result:** Copied working patterns directly, saving hours of troubleshooting.
**Lesson:** Working examples > documentation when starting out.

---

## License & Attribution

Europa Component Library is provided by the European Commission.
All ECL assets and code examples are subject to EC licensing terms.

---

**Recipe Version:** 1.0  
**Date:** November 2024  
**ECL Version:** v4.11.1  
**Tested With:** Python 3 HTTPS Server, Safari, Modern Browsers  
**Author:** AI Assistant via ECL MCP Server  
**Based On:** Successful news-listing.html implementation  
**Reference File:** fishing-benchmarks.html (working ECL example)
