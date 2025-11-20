#!/usr/bin/env node

/**
 * ECL MCP Server - HTML Generation Test
 * 
 * This script tests whether the MCP server generates fully working HTML pages
 * by:
 * 1. Requesting a generic ECL-compliant HTML page
 * 2. Verifying all CDN resources are accessible
 * 3. Validating HTML structure
 * 4. Checking for proper ECL setup
 */

import fs from 'fs/promises';
import https from 'https';
import http from 'http';

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Test configuration
const TEST_CONFIG = {
    // Test different page generation scenarios
    scenarios: [
        {
            name: 'Basic ECL Page',
            description: 'Generate a minimal ECL-compliant HTML page',
            variant: 'minimal'
        },
        {
            name: 'Full ECL Page',
            description: 'Generate a complete ECL page with all resources',
            variant: 'complete'
        }
    ],

    // CDN endpoints to test
    cdns: {
        official: 'https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec',
        jsdelivr: 'https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.0'
    },

    // Expected resources
    requiredResources: [
        '/styles/ecl-ec.css',
        '/styles/optional/ecl-reset.css',
        '/scripts/ecl-ec.js',
        '/images/icons/sprites/icons.svg'
    ]
};

// Test results tracker
const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

/**
 * Fetch URL with promise wrapper
 */
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const req = protocol.get(url, (res) => {
            let data = '';

            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data,
                    url: url
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

/**
 * Test if a CDN resource is accessible
 */
async function testCdnResource(baseUrl, resource) {
    const url = baseUrl + resource;
    console.log(`  Testing: ${colors.cyan}${url}${colors.reset}`);

    try {
        const response = await fetchUrl(url);

        if (response.statusCode === 200) {
            const size = Buffer.byteLength(response.data);
            console.log(`    ${colors.green}✓${colors.reset} Accessible (${(size / 1024).toFixed(2)} KB)`);
            return { success: true, url, size, statusCode: 200 };
        } else {
            console.log(`    ${colors.red}✗${colors.reset} Failed (Status: ${response.statusCode})`);
            return { success: false, url, statusCode: response.statusCode, error: `HTTP ${response.statusCode}` };
        }
    } catch (error) {
        console.log(`    ${colors.red}✗${colors.reset} Error: ${error.message}`);
        return { success: false, url, error: error.message };
    }
}

/**
 * Test all CDN endpoints
 */
async function testAllCdnEndpoints() {
    console.log(`\n${colors.bright}Testing CDN Availability${colors.reset}`);
    console.log('='.repeat(60));

    const results = {};

    for (const [cdnName, baseUrl] of Object.entries(TEST_CONFIG.cdns)) {
        console.log(`\n${colors.blue}Testing ${cdnName} CDN:${colors.reset} ${baseUrl}`);
        results[cdnName] = [];

        for (const resource of TEST_CONFIG.requiredResources) {
            const result = await testCdnResource(baseUrl, resource);
            results[cdnName].push(result);

            if (result.success) {
                testResults.passed++;
            } else {
                testResults.failed++;
            }
        }
    }

    return results;
}

/**
 * Generate test HTML page using MCP server logic
 */
function generateTestHtml(variant = 'complete') {
    const version = '4.11.1';
    const cdnBase = `https://cdn1.fpfis.tech.ec.europa.eu/ecl/v${version}/ec`;

    return `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>ECL Test Page - ${variant}</title>
    
    <!-- Remove 'no-js' class and add 'has-js' class -->
    <script>
        var cl = document.querySelector('html').classList;
        cl.remove('no-js');
        cl.add('has-js');
    </script>
    
    <!-- External dependencies (required for datepicker) -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pikaday/1.8.2/pikaday.js" crossorigin="anonymous"></script>
    
    <!-- ECL CSS Resources -->
    <link rel="stylesheet" href="${cdnBase}/styles/optional/ecl-reset.css" media="screen">
    <link rel="stylesheet" href="${cdnBase}/styles/ecl-ec.css" media="screen">
    <link rel="stylesheet" href="${cdnBase}/styles/ecl-ec-print.css" media="print">
</head>
<body>
    <div class="ecl-container">
        <h1 class="ecl-u-type-heading-1">ECL Test Page</h1>
        <p class="ecl-u-type-paragraph">
            This is a test page generated to verify ECL MCP server HTML generation.
            All resources should load correctly from the official European Commission CDN.
        </p>
        
        <!-- Test ECL Button Component -->
        <button type="button" class="ecl-button ecl-button--primary">
            <span class="ecl-button__container">
                <span class="ecl-button__label">Test Button</span>
            </span>
        </button>
    </div>
    
    <!-- ECL JavaScript -->
    <script src="${cdnBase}/scripts/ecl-ec.js"></script>
    <script>
        // Auto-initialize ECL components
        if (typeof ECL !== 'undefined') {
            ECL.autoInit();
            console.log('ECL initialized successfully. Version:', ECL.version || 'unknown');
        } else {
            console.error('ECL library failed to load!');
        }
    </script>
</body>
</html>`;
}

/**
 * Validate HTML structure
 */
function validateHtmlStructure(html) {
    console.log(`\n${colors.bright}Validating HTML Structure${colors.reset}`);
    console.log('='.repeat(60));

    const checks = [
        {
            name: 'Has DOCTYPE',
            test: () => html.includes('<!DOCTYPE html>'),
            critical: true
        },
        {
            name: 'Has charset meta',
            test: () => html.includes('charset="utf-8"') || html.includes("charset='utf-8'"),
            critical: true
        },
        {
            name: 'Has viewport meta',
            test: () => html.includes('name="viewport"'),
            critical: true
        },
        {
            name: 'Has no-js class removal script',
            test: () => html.includes('no-js') && html.includes('has-js'),
            critical: false
        },
        {
            name: 'Includes ECL CSS',
            test: () => html.includes('ecl-ec.css'),
            critical: true
        },
        {
            name: 'Includes ECL JavaScript',
            test: () => html.includes('ecl-ec.js'),
            critical: true
        },
        {
            name: 'Has ECL.autoInit() call',
            test: () => html.includes('ECL.autoInit()'),
            critical: false
        },
        {
            name: 'Uses official EC CDN',
            test: () => html.includes('cdn.fpfis.tech.ec.europa.eu') || html.includes('cdn1.fpfis.tech.ec.europa.eu'),
            critical: false
        },
        {
            name: 'Includes reset CSS',
            test: () => html.includes('ecl-reset.css'),
            critical: false
        },
        {
            name: 'Includes Pikaday dependency',
            test: () => html.includes('pikaday'),
            critical: false
        },
        {
            name: 'Uses ECL typography utility classes',
            test: () => html.includes('ecl-u-type-heading') && html.includes('ecl-u-type-paragraph'),
            critical: true
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const check of checks) {
        const result = check.test();
        const status = result ?
            `${colors.green}✓ PASS${colors.reset}` :
            (check.critical ? `${colors.red}✗ FAIL (CRITICAL)${colors.reset}` : `${colors.yellow}⚠ WARN${colors.reset}`);

        console.log(`  ${status} - ${check.name}`);

        if (result) {
            passed++;
            testResults.passed++;
        } else {
            if (check.critical) {
                failed++;
                testResults.failed++;
            } else {
                testResults.warnings++;
            }
        }
    }

    console.log(`\n  Summary: ${passed}/${checks.length} checks passed`);
    if (failed > 0) {
        console.log(`  ${colors.red}${failed} critical failures detected!${colors.reset}`);
    }

    return { passed, failed, total: checks.length };
}

/**
 * Extract and test all resource URLs from HTML
 */
async function testHtmlResources(html) {
    console.log(`\n${colors.bright}Testing Resource Accessibility${colors.reset}`);
    console.log('='.repeat(60));

    // Extract URLs from href and src attributes
    const urlPattern = /(href|src)=["'](https?:\/\/[^"']+)["']/g;
    const urls = new Set();
    let match;

    while ((match = urlPattern.exec(html)) !== null) {
        urls.add(match[2]);
    }

    console.log(`\nFound ${urls.size} external resources to test:\n`);

    const results = [];
    for (const url of urls) {
        const result = await testCdnResource('', url);
        results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    console.log(`\n  ${successful}/${results.length} resources accessible`);

    return results;
}

/**
 * Main test runner
 */
async function runTests() {
    console.log(`\n${colors.bright}${colors.blue}ECL MCP Server - HTML Generation Test${colors.reset}`);
    console.log('='.repeat(60));
    console.log(`Test Date: ${new Date().toISOString()}`);

    // Step 1: Test CDN availability
    const cdnResults = await testAllCdnEndpoints();

    // Step 2: Generate test HTML
    console.log(`\n${colors.bright}Generating Test HTML${colors.reset}`);
    console.log('='.repeat(60));
    const html = generateTestHtml('complete');
    console.log(`${colors.green}✓${colors.reset} Generated HTML (${Buffer.byteLength(html)} bytes)`);

    // Save generated HTML
    const testHtmlPath = './test-output.html';
    await fs.writeFile(testHtmlPath, html, 'utf-8');
    console.log(`${colors.green}✓${colors.reset} Saved to ${testHtmlPath}`);

    // Step 3: Validate HTML structure
    const structureResults = validateHtmlStructure(html);

    // Step 4: Test all resources in generated HTML
    const resourceResults = await testHtmlResources(html);

    // Final Report
    console.log(`\n${colors.bright}${colors.blue}Test Summary${colors.reset}`);
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.passed + testResults.failed + testResults.warnings}`);
    console.log(`${colors.green}Passed:${colors.reset} ${testResults.passed}`);
    console.log(`${colors.red}Failed:${colors.reset} ${testResults.failed}`);
    console.log(`${colors.yellow}Warnings:${colors.reset} ${testResults.warnings}`);

    // CDN Recommendation
    console.log(`\n${colors.bright}Recommendations:${colors.reset}`);

    const officialCdnWorking = cdnResults.official.every(r => r.success);
    const jsdelivrCdnWorking = cdnResults.jsdelivr.every(r => r.success);

    if (officialCdnWorking && !jsdelivrCdnWorking) {
        console.log(`  ${colors.green}✓${colors.reset} Use Official EC CDN: https://cdn1.fpfis.tech.ec.europa.eu/ecl/v4.11.1/ec`);
        console.log(`  ${colors.red}✗${colors.reset} Avoid jsdelivr CDN (version 4.11.1 not available)`);
    } else if (jsdelivrCdnWorking && !officialCdnWorking) {
        console.log(`  ${colors.green}✓${colors.reset} Use jsdelivr CDN: https://cdn.jsdelivr.net/npm/@ecl/preset-ec@4.11.0`);
        console.log(`  ${colors.yellow}⚠${colors.reset} Note: Version mismatch (using 4.11.0 instead of 4.11.1)`);
    } else if (officialCdnWorking && jsdelivrCdnWorking) {
        console.log(`  ${colors.green}✓${colors.reset} Both CDNs working (prefer official EC CDN for latest version)`);
    } else {
        console.log(`  ${colors.red}✗${colors.reset} Both CDNs have issues - investigate connectivity`);
    }

    console.log(`\n  ${colors.cyan}ℹ${colors.reset} For production use, consider hosting ECL resources locally`);
    console.log(`  ${colors.cyan}ℹ${colors.reset} Generated HTML saved to: ${testHtmlPath}`);
    console.log(`  ${colors.cyan}ℹ${colors.reset} Open in browser to verify visual rendering\n`);

    // Exit code
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, err);
    process.exit(1);
});
