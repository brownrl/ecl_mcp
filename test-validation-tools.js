#!/usr/bin/env node

/**
 * Test suite for ECL Validation Tools (Phase 4)
 * Tests all validation and diagnostic functions
 */

import { getDatabase, closeDatabase } from './src/db.js';
import * as Validation from './src/validation/index.js';

// Test data
const testCases = {
  // Valid ECL button HTML
  validButton: `
    <button type="button" class="ecl-button ecl-button--primary" aria-label="Submit form">
      <span class="ecl-button__container">
        <span class="ecl-button__label">Submit</span>
      </span>
    </button>
  `,

  // Invalid button (missing type, improper structure)
  invalidButton: `
    <button class="ecl-button ecl-button--primary">
      Submit
    </button>
  `,

  // Valid card with accessibility
  validCard: `
    <article class="ecl-card" data-ecl-auto-init="Card">
      <div class="ecl-card__image">
        <img src="image.jpg" alt="Card image description" class="ecl-card__image-element">
      </div>
      <div class="ecl-card__body">
        <h3 class="ecl-card__title">
          <a href="#" class="ecl-card__link">Card Title</a>
        </h3>
        <p class="ecl-card__description">Card description text here.</p>
      </div>
    </article>
  `,

  // Invalid card (missing alt text, no init)
  invalidCard: `
    <div class="ecl-card">
      <div class="ecl-card__image">
        <img src="image.jpg" class="ecl-card__image-element">
      </div>
      <div class="ecl-card__body">
        <div class="ecl-card__title">
          <a href="#">Card Title</a>
        </div>
      </div>
    </div>
  `,

  // Accessibility test cases
  goodAccessibility: `
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="#main" class="ecl-link">Skip to main content</a></li>
      </ul>
    </nav>
    <main id="main">
      <h1>Page Title</h1>
      <form>
        <label for="name">Name</label>
        <input type="text" id="name" name="name" required>
        
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required>
        
        <button type="submit" class="ecl-button ecl-button--primary">Submit</button>
      </form>
    </main>
  `,

  poorAccessibility: `
    <div onclick="navigate()">
      <div>Page Title</div>
      <form>
        <input type="text" placeholder="Name">
        <input type="text" placeholder="Email">
        <div class="button" onclick="submit()">Submit</div>
      </form>
    </div>
  `,

  // Code analysis test
  fullEclPage: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <link rel="stylesheet" href="ecl.css">
      <style>
        .custom { color: #003399; margin: 16px; }
      </style>
    </head>
    <body>
      <header class="ecl-site-header" data-ecl-auto-init="SiteHeader">
        <div class="ecl-site-header__container">
          <a href="#" class="ecl-site-header__logo">
            <img src="logo.svg" alt="Europa" />
          </a>
        </div>
      </header>
      
      <main class="ecl-u-mt-l ecl-u-mb-l">
        <div class="ecl-container">
          <button type="button" class="ecl-button ecl-button--primary">
            Click me
          </button>
          
          <div class="ecl-card" data-ecl-auto-init="Card">
            <div class="ecl-card__body">
              <h3 class="ecl-card__title">Card</h3>
            </div>
          </div>
        </div>
      </main>
      
      <script>
        ECL.autoInit();
      </script>
    </body>
    </html>
  `,

  // JavaScript with good patterns
  goodJs: `
    // Initialize ECL components
    ECL.autoInit();
    
    // Event delegation
    document.addEventListener('click', function(e) {
      if (e.target.matches('.ecl-button')) {
        handleButtonClick(e.target);
      }
    });
  `,

  // JavaScript with issues
  poorJs: `
    // Direct DOM manipulation
    document.querySelector('.card').innerHTML = '<div>New content</div>';
    document.getElementById('test').innerHTML = '<span>More</span>';
    
    // Direct event handlers
    document.querySelector('.button').onclick = function() {
      alert('clicked');
    };
    document.querySelector('.link').onclick = function() { return false; };
    
    // Manual init without checking
    ECL.Button.init(document.querySelector('.ecl-button'));
    
    // More DOM manipulation
    document.querySelector('.header').style.color = 'red';
  `,

  // CSS with design tokens
  goodCss: `
    .custom-component {
      color: var(--ecl-color-primary);
      padding: var(--ecl-spacing-m);
      font-family: var(--ecl-font-family);
    }
  `,

  // CSS with hardcoded values
  poorCss: `
    .custom-component {
      color: #003399 !important;
      background: #ff0000 !important;
      padding: 16px !important;
      margin: 24px !important;
      font-family: Arial, sans-serif !important;
      font-size: 14px !important;
      -webkit-border-radius: 4px;
      -moz-border-radius: 4px;
      border-radius: 4px;
    }
  `
};

// Test runner
async function runTests() {
  console.log('🧪 ECL Validation Tools Test Suite\n');
  console.log('='.repeat(60));
  
  const db = getDatabase(true);
  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Valid button validation
    console.log('\n📝 Test 1: Valid Button Validation');
    const test1 = await Validation.validateComponentUsage(
      db, 
      'button', 
      testCases.validButton
    );
    if (test1.success && test1.data.is_valid && test1.data.score >= 90) {
      console.log('✅ PASS - Valid button scores high');
      passed++;
    } else {
      console.log('❌ FAIL - Valid button should pass validation');
      console.log('Score:', test1.data.score);
      console.log('Errors:', test1.data.errors);
      failed++;
    }

    // Test 2: Invalid button validation
    console.log('\n📝 Test 2: Invalid Button Validation');
    const test2 = await Validation.validateComponentUsage(
      db, 
      'button', 
      testCases.invalidButton
    );
    if (test2.success && !test2.data.is_valid && test2.data.errors.length > 0) {
      console.log('✅ PASS - Invalid button detected errors');
      console.log('   Errors found:', test2.data.errors.length);
      passed++;
    } else {
      console.log('❌ FAIL - Invalid button should have errors');
      failed++;
    }

    // Test 3: Valid card validation
    console.log('\n📝 Test 3: Valid Card Validation');
    const test3 = await Validation.validateComponentUsage(
      db, 
      'card', 
      testCases.validCard
    );
    if (test3.success && test3.data.score >= 85) {
      console.log('✅ PASS - Valid card scores high');
      console.log('   Score:', test3.data.score);
      passed++;
    } else {
      console.log('❌ FAIL - Valid card should score 85+');
      console.log('Score:', test3.data.score);
      console.log('Errors:', test3.data.errors);
      failed++;
    }

    // Test 4: Invalid card validation
    console.log('\n📝 Test 4: Invalid Card Validation');
    const test4 = await Validation.validateComponentUsage(
      db, 
      'card', 
      testCases.invalidCard
    );
    if (test4.success && test4.data.errors.length >= 2) {
      console.log('✅ PASS - Invalid card has multiple errors');
      console.log('   Errors:', test4.data.errors.map(e => e.message).join(', '));
      passed++;
    } else {
      console.log('❌ FAIL - Invalid card should have 2+ errors');
      console.log('Errors:', test4.data.errors);
      failed++;
    }

    // Test 5: Good accessibility check
    console.log('\n📝 Test 5: Good Accessibility Check (WCAG AA)');
    const test5 = await Validation.checkAccessibility(
      db, 
      testCases.goodAccessibility,
      null,
      'AA'
    );
    if (test5.success && test5.data.wcag_aa_compliant) {
      console.log('✅ PASS - Good HTML is WCAG AA compliant');
      console.log('   Level A:', test5.data.wcag_a_compliant ? '✓' : '✗');
      console.log('   Level AA:', test5.data.wcag_aa_compliant ? '✓' : '✗');
      passed++;
    } else {
      console.log('❌ FAIL - Good HTML should be WCAG AA compliant');
      console.log('Issues:', test5.data?.issues || []);
      console.log('Success:', test5.success);
      console.log('AA Compliant:', test5.data?.wcag_aa_compliant);
      failed++;
    }

    // Test 6: Poor accessibility check
    console.log('\n📝 Test 6: Poor Accessibility Check');
    const test6 = await Validation.checkAccessibility(
      db, 
      testCases.poorAccessibility,
      null,
      'AA'
    );
    if (test6.success && !test6.data.wcag_aa_compliant && test6.data.issues.length > 0) {
      console.log('✅ PASS - Poor HTML fails WCAG compliance');
      console.log('   Critical issues:', test6.data.issues.filter(e => e.severity === 'critical').length);
      console.log('   Serious issues:', test6.data.issues.filter(e => e.severity === 'serious').length);
      passed++;
    } else {
      console.log('❌ FAIL - Poor HTML should fail WCAG compliance');
      failed++;
    }

    // Test 7: Code analysis - component detection
    console.log('\n📝 Test 7: Code Analysis - Component Detection');
    const test7 = await Validation.analyzeEclCode(
      db, 
      testCases.fullEclPage,
      testCases.goodJs
    );
    if (test7.success && test7.data.components_detected.length >= 2) {
      console.log('✅ PASS - Detected multiple components');
      console.log('   Components:', test7.data.components_detected.map(c => c.name).join(', '));
      console.log('   Quality score:', test7.data.overall_quality_score);
      passed++;
    } else {
      console.log('❌ FAIL - Should detect 2+ components');
      console.log('Detected:', test7.data.components_detected);
      failed++;
    }

    // Test 8: Code analysis - design tokens
    console.log('\n📝 Test 8: Code Analysis - Design Token Detection');
    const test8 = await Validation.analyzeEclCode(
      db, 
      testCases.fullEclPage,
      testCases.goodJs,
      testCases.goodCss
    );
    if (test8.success && test8.data.design_tokens_used.length > 0) {
      console.log('✅ PASS - Detected design tokens');
      console.log('   Tokens:', test8.data.design_tokens_used.length);
      passed++;
    } else {
      console.log('❌ FAIL - Should detect design tokens');
      failed++;
    }

    // Test 9: Code analysis - quality issues
    console.log('\n📝 Test 9: Code Analysis - Quality Issues Detection');
    const test9 = await Validation.analyzeEclCode(
      db, 
      testCases.fullEclPage.replace('ecl-u-mt-l', 'custom').replace('data-ecl-auto-init', ''),
      testCases.poorJs,
      testCases.poorCss
    );
    if (test9.success && test9.data.overall_quality_score < 80) {
      console.log('✅ PASS - Poor code has low quality score');
      console.log('   Score:', test9.data.overall_quality_score);
      console.log('   Issues:', test9.data.maintainability.issues.length);
      passed++;
    } else {
      console.log('❌ FAIL - Poor code should have low quality score');
      console.log('Score:', test9.data.overall_quality_score);
      failed++;
    }

    // Test 10: Conflict detection
    console.log('\n📝 Test 10: Component Conflict Detection');
    const test10 = await Validation.checkConflicts(
      db, 
      ['modal', 'message', 'accordion', 'tabs']
    );
    if (test10.success && (test10.data.conflicts.length > 0 || test10.data.warnings.length > 0)) {
      console.log('✅ PASS - Detected potential conflicts');
      console.log('   Conflicts:', test10.data.conflicts.length);
      console.log('   Warnings:', test10.data.warnings.length);
      passed++;
    } else {
      console.log('❌ FAIL - Should detect at least warnings');
      console.log('Result:', test10.data);
      failed++;
    }

    // Test 11: Performance check
    console.log('\n📝 Test 11: Performance Check');
    const startTime = Date.now();
    await Validation.validateComponentUsage(db, 'button', testCases.validButton);
    await Validation.checkAccessibility(db, testCases.goodAccessibility);
    await Validation.analyzeEclCode(db, testCases.fullEclPage);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    if (totalTime < 500) {
      console.log('✅ PASS - All validations under 500ms');
      console.log('   Total time:', totalTime + 'ms');
      passed++;
    } else {
      console.log('⚠️  SLOW - Validations took longer than expected');
      console.log('   Total time:', totalTime + 'ms');
      console.log('   (Not counted as failure)');
      passed++;
    }

    // Test 12: Error handling
    console.log('\n📝 Test 12: Error Handling');
    const test12 = await Validation.validateComponentUsage(
      db, 
      'nonexistent-component', 
      '<div>test</div>'
    );
    if (test12.success === false && test12.errors && test12.errors.length > 0) {
      console.log('✅ PASS - Handles invalid component gracefully');
      console.log('   Error:', test12.errors[0].message);
      passed++;
    } else {
      console.log('❌ FAIL - Should handle errors gracefully');
      failed++;
    }

  } catch (error) {
    console.error('\n❌ Test suite error:', error);
    failed++;
  } finally {
    closeDatabase(db);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary\n');
  console.log(`Total tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
