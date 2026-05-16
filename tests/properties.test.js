'use strict';

/**
 * Property-based tests for subnet-calc-ui-redesign
 * Uses fast-check + Node.js built-in assert.
 * Reads lib/style.css and index.html as strings — no server or jsdom needed.
 *
 * Run: node tests/properties.test.js
 * Exit 0 = all pass, Exit 1 = failure.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const fc = require('fast-check');

// ── File helpers ─────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const cssText = fs.readFileSync(path.join(ROOT, 'lib', 'style.css'), 'utf8');
const htmlText = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// ── Test runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function run(name, fn) {
    try {
        fn();
        console.log(`  ✓  ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ✗  ${name}`);
        console.error(`     ${err.message}`);
        failed++;
    }
}

// ── WCAG helpers ─────────────────────────────────────────────────────────────

/**
 * Convert a hex color string (#rrggbb) to sRGB [0,1] components.
 */
function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [
        parseInt(h.slice(0, 2), 16) / 255,
        parseInt(h.slice(2, 4), 16) / 255,
        parseInt(h.slice(4, 6), 16) / 255,
    ];
}

/**
 * Compute WCAG relative luminance for an sRGB component.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function linearize(c) {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
    const [r, g, b] = hexToRgb(hex).map(linearize);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
    const l1 = relativeLuminance(hex1);
    const l2 = relativeLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// ── CSS parsing helpers ───────────────────────────────────────────────────────

/**
 * Extract the value of a CSS custom property from a :root block.
 * Returns the trimmed value string, or null if not found.
 */
function extractCustomProperty(css, propName) {
    // Match: --prop-name: <value>;
    const re = new RegExp(propName.replace('-', '\\-') + '\\s*:\\s*([^;]+);');
    const m = css.match(re);
    return m ? m[1].trim() : null;
}

/**
 * Extract the value of a CSS property from a named rule block.
 * selector: e.g. '.card', '#iacOutput', '.disabledAction'
 * property: e.g. 'padding', 'min-height', 'opacity'
 */
function extractRuleProperty(css, selector, property) {
    // Escape selector for regex
    const escapedSel = selector.replace(/[.#[\]()]/g, '\\$&');
    // Match the selector block (non-nested, stops at first })
    const blockRe = new RegExp(escapedSel + '\\s*\\{([^}]+)\\}', 'g');
    let m;
    while ((m = blockRe.exec(css)) !== null) {
        const block = m[1];
        const propRe = new RegExp(
            '(?:^|;|\\s)' + property.replace('-', '\\-') + '\\s*:\\s*([^;]+)',
        );
        const pm = block.match(propRe);
        if (pm) return pm[1].trim();
    }
    return null;
}

/**
 * Parse a CSS length value (px, rem, em) to pixels.
 * Assumes 1rem = 16px, 1em = 16px for static analysis.
 */
function parsePx(value) {
    if (!value) return null;
    const v = value.trim();
    if (v.endsWith('px')) return parseFloat(v);
    if (v.endsWith('rem')) return parseFloat(v) * 16;
    if (v.endsWith('em')) return parseFloat(v) * 16;
    // bare number
    if (/^\d+(\.\d+)?$/.test(v)) return parseFloat(v);
    return null;
}

// ── Tests ────────────────────────────────────────────────────────────────────

console.log('\nsubnet-calc-ui-redesign — property tests\n');

// ── Property 1: Dark theme custom properties are defined ─────────────────────
// Feature: subnet-calc-ui-redesign, Property 1: Dark theme custom properties are defined
run('Property 1: Dark theme custom properties are defined', () => {
    const requiredProps = [
        '--color-bg',
        '--color-accent',
        '--color-text',
        '--color-card',
        '--color-border',
    ];

    fc.assert(
        fc.property(fc.constantFrom(...requiredProps), (prop) => {
            const value = extractCustomProperty(cssText, prop);
            assert.ok(
                value !== null && value.length > 0,
                `CSS custom property ${prop} is missing or empty in lib/style.css`,
            );
        }),
        { numRuns: 100 },
    );
});

// ── Property 2: Text contrast ratio meets WCAG AA ────────────────────────────
// Feature: subnet-calc-ui-redesign, Property 2: Text contrast ratio meets WCAG AA
run('Property 2: Text contrast ratio meets WCAG AA', () => {
    const colorText = extractCustomProperty(cssText, '--color-text');
    const colorBg = extractCustomProperty(cssText, '--color-bg');

    assert.ok(colorText, '--color-text not found in lib/style.css');
    assert.ok(colorBg, '--color-bg not found in lib/style.css');

    // Normalize: strip any whitespace, ensure # prefix
    const fg = colorText.trim();
    const bg = colorBg.trim();

    // Use fast-check to verify the property holds for the extracted pair
    fc.assert(
        fc.property(fc.constant({ fg, bg }), ({ fg, bg }) => {
            const ratio = contrastRatio(fg, bg);
            assert.ok(
                ratio >= 4.5,
                `Contrast ratio ${ratio.toFixed(2)} is below WCAG AA minimum of 4.5 (fg=${fg}, bg=${bg})`,
            );
        }),
        { numRuns: 100 },
    );
});

// ── Property 3: No external network references ───────────────────────────────
// Feature: subnet-calc-ui-redesign, Property 3: No external network references
run('Property 3: No external network references', () => {
    // Allowed: the footer GitHub link (user-visible link, not a resource load)
    const ALLOWED_URLS = ['https://github.com/lachlanjholmes/ip_calc'];

    // Patterns that load external resources (not user-visible links)
    // <link href="https://...">  <script src="https://...">
    // @import url("https://...")  background: url("https://...")
    const resourcePatterns = [
        // <link rel="stylesheet" href="https://...">
        /<link\b[^>]*\bhref\s*=\s*["'](https:\/\/[^"']+)["'][^>]*>/gi,
        // <script src="https://...">
        /<script\b[^>]*\bsrc\s*=\s*["'](https:\/\/[^"']+)["'][^>]*>/gi,
        // <img src="https://...">
        /<img\b[^>]*\bsrc\s*=\s*["'](https:\/\/[^"']+)["'][^>]*>/gi,
        // CSS @import url("https://...")
        /@import\s+(?:url\()?["']?(https:\/\/[^"')]+)["']?\)?/gi,
        // CSS background/background-image: url("https://...")
        /url\(\s*["']?(https:\/\/[^"')]+)["']?\s*\)/gi,
    ];

    const sources = [
        { name: 'index.html', content: htmlText },
        { name: 'lib/style.css', content: cssText },
    ];

    fc.assert(
        fc.property(fc.constantFrom(...sources), ({ name, content }) => {
            for (const pattern of resourcePatterns) {
                pattern.lastIndex = 0;
                let m;
                while ((m = pattern.exec(content)) !== null) {
                    const url = m[1];
                    const isAllowed = ALLOWED_URLS.some((allowed) =>
                        url.startsWith(allowed),
                    );
                    assert.ok(
                        isAllowed,
                        `External resource URL found in ${name}: ${url}`,
                    );
                }
            }
        }),
        { numRuns: 100 },
    );
});

// ── Property 4: JS-facing attributes are preserved ───────────────────────────
// Feature: subnet-calc-ui-redesign, Property 4: JS-facing attributes are preserved
run('Property 4: JS-facing attributes are preserved', () => {
    // All ids, names, classes, and event handlers that script.js depends on
    const requiredAttributes = [
        // IDs
        'calcbody',
        'saveLink',
        'joinHeader',
        'col_subnet',
        'col_netmask',
        'col_range',
        'col_useable',
        'col_hosts',
        'col_cloudformation',
        'col_terraform',
        'col_comments',
        'col_divide',
        'col_join',
        'cb_subnet',
        'cb_netmask',
        'cb_range',
        'cb_useable',
        'cb_hosts',
        'cb_cloudformation',
        'cb_terraform',
        'cb_comments',
        'cb_divide',
        'cb_join',
        'iacType',
        'iacOutput',
        'outputFormat',
        'cloudProvider',
        'cloudProviderLabel',
        'hardcodeCidr',
        // Event handlers / function names
        'toggleColumn',
        'updateNetwork',
        'generateIac',
        'handleIacTypeChange',
        'startOver',
        'createBookmarkHyperlink',
    ];

    fc.assert(
        fc.property(fc.constantFrom(...requiredAttributes), (attr) => {
            assert.ok(
                htmlText.includes(attr),
                `JS-facing attribute/identifier "${attr}" is missing from index.html`,
            );
        }),
        { numRuns: 100 },
    );
});

// ── Property 5: Column toggle opacity invariant ──────────────────────────────
// Feature: subnet-calc-ui-redesign, Property 5: Column toggle opacity invariant
run('Property 5: Column toggle opacity invariant', () => {
    fc.assert(
        fc.property(fc.boolean(), (_unused) => {
            // Assert a rule exists: checked checkbox → adjacent label opacity 1
            const checkedRulePresent =
                /input\[type="checkbox"\]:checked\s*\+\s*label\s*\{[^}]*opacity\s*:\s*1\b/.test(
                    cssText,
                ) ||
                /input\[type=checkbox\]:checked\s*\+\s*label\s*\{[^}]*opacity\s*:\s*1\b/.test(
                    cssText,
                );

            assert.ok(
                checkedRulePresent,
                'No CSS rule found setting label opacity to 1 when checkbox is :checked',
            );

            // Assert a rule exists: unchecked checkbox → adjacent label opacity <= 0.5
            // The unchecked state is the default (no :checked pseudo-class)
            const uncheckedMatch = cssText.match(
                /input\[type="checkbox"\]\s*\+\s*label\s*\{[^}]*opacity\s*:\s*([\d.]+)/,
            ) ||
                cssText.match(
                    /input\[type=checkbox\]\s*\+\s*label\s*\{[^}]*opacity\s*:\s*([\d.]+)/,
                );

            assert.ok(
                uncheckedMatch,
                'No CSS rule found setting label opacity for unchecked checkbox',
            );

            const uncheckedOpacity = parseFloat(uncheckedMatch[1]);
            assert.ok(
                uncheckedOpacity <= 0.5,
                `Unchecked label opacity ${uncheckedOpacity} exceeds 0.5`,
            );
        }),
        { numRuns: 100 },
    );
});

// ── Property 6: Card padding invariant ──────────────────────────────────────
// Feature: subnet-calc-ui-redesign, Property 6: Card padding invariant
run('Property 6: Card padding invariant', () => {
    fc.assert(
        fc.property(fc.boolean(), (_unused) => {
            // Extract .card padding value
            const paddingValue = extractRuleProperty(cssText, '.card', 'padding');
            assert.ok(
                paddingValue !== null,
                '.card rule with padding not found in lib/style.css',
            );

            // The padding may be a CSS variable reference like var(--padding)
            // Resolve it: --padding is 20px
            let resolvedValue = paddingValue;
            if (resolvedValue.includes('var(--padding)')) {
                const paddingToken = extractCustomProperty(cssText, '--padding');
                assert.ok(paddingToken, '--padding token not found in lib/style.css');
                resolvedValue = paddingToken;
            }

            // Parse the first value (shorthand: top = first value)
            const firstValue = resolvedValue.trim().split(/\s+/)[0];
            const px = parsePx(firstValue);

            assert.ok(
                px !== null,
                `Could not parse padding value: ${resolvedValue}`,
            );
            assert.ok(
                px >= 16,
                `Card padding ${px}px is less than the required 16px minimum`,
            );
        }),
        { numRuns: 100 },
    );
});

// ── Property 7: Table horizontal scroll containment ──────────────────────────
// Feature: subnet-calc-ui-redesign, Property 7: Table horizontal scroll containment
run('Property 7: Table horizontal scroll containment', () => {
    fc.assert(
        fc.property(fc.boolean(), (_unused) => {
            // 7a: .table-scroll-wrapper wraps the .calc table in index.html
            // Check that .table-scroll-wrapper appears before .calc in the HTML
            const wrapperIdx = htmlText.indexOf('table-scroll-wrapper');
            const calcIdx = htmlText.indexOf('class="calc"');
            assert.ok(
                wrapperIdx !== -1,
                '.table-scroll-wrapper not found in index.html',
            );
            assert.ok(calcIdx !== -1, 'class="calc" not found in index.html');
            assert.ok(
                wrapperIdx < calcIdx,
                '.table-scroll-wrapper does not appear before .calc table in index.html',
            );

            // 7b: .table-scroll-wrapper has overflow-x: auto in CSS
            const wrapperOverflow = extractRuleProperty(
                cssText,
                '.table-scroll-wrapper',
                'overflow-x',
            );
            assert.strictEqual(
                wrapperOverflow,
                'auto',
                `.table-scroll-wrapper overflow-x is "${wrapperOverflow}", expected "auto"`,
            );

            // 7c: body does NOT have overflow-x: scroll or overflow-x: auto
            const bodyOverflow = extractRuleProperty(cssText, 'body', 'overflow-x');
            assert.ok(
                bodyOverflow === null ||
                    (bodyOverflow !== 'scroll' && bodyOverflow !== 'auto'),
                `body has overflow-x: ${bodyOverflow} — horizontal scroll should be contained in .table-scroll-wrapper`,
            );

            // 7d: html does NOT have overflow-x: scroll or overflow-x: auto
            const htmlOverflow = extractRuleProperty(cssText, 'html', 'overflow-x');
            assert.ok(
                htmlOverflow === null ||
                    (htmlOverflow !== 'scroll' && htmlOverflow !== 'auto'),
                `html has overflow-x: ${htmlOverflow} — horizontal scroll should be contained in .table-scroll-wrapper`,
            );
        }),
        { numRuns: 100 },
    );
});

// ── Property 8: IaC textarea minimum height ──────────────────────────────────
// Feature: subnet-calc-ui-redesign, Property 8: IaC textarea minimum height
run('Property 8: IaC textarea minimum height', () => {
    fc.assert(
        fc.property(fc.boolean(), (_unused) => {
            const minHeightValue = extractRuleProperty(
                cssText,
                '#iacOutput',
                'min-height',
            );
            assert.ok(
                minHeightValue !== null,
                '#iacOutput min-height rule not found in lib/style.css',
            );

            const px = parsePx(minHeightValue);
            assert.ok(
                px !== null,
                `Could not parse #iacOutput min-height value: ${minHeightValue}`,
            );
            assert.ok(
                px >= 300,
                `#iacOutput min-height ${px}px is less than the required 300px minimum`,
            );
        }),
        { numRuns: 100 },
    );
});

// ── Property 9: Disabled action muted appearance ─────────────────────────────
// Feature: subnet-calc-ui-redesign, Property 9: Disabled action muted appearance
run('Property 9: Disabled action muted appearance', () => {
    fc.assert(
        fc.property(fc.boolean(), (_unused) => {
            const opacityValue = extractRuleProperty(
                cssText,
                '.disabledAction',
                'opacity',
            );
            assert.ok(
                opacityValue !== null,
                '.disabledAction opacity rule not found in lib/style.css',
            );

            const opacity = parseFloat(opacityValue);
            assert.ok(
                !isNaN(opacity),
                `Could not parse .disabledAction opacity value: ${opacityValue}`,
            );
            assert.ok(
                opacity <= 0.4,
                `.disabledAction opacity ${opacity} exceeds the maximum of 0.4`,
            );
        }),
        { numRuns: 100 },
    );
});

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
