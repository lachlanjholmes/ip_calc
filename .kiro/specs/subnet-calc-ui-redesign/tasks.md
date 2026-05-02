# Implementation Plan: subnet-calc-ui-redesign

## Overview

Modernize the Visual Subnet Calculator's visual presentation by rewriting `lib/style.css` and restructuring `index.html`. All changes are confined to those two files. `lib/script.js` is read-only. Property-based tests use fast-check and run in Node.js against the static file content and a jsdom environment.

## Tasks

- [x] 1. Create git branch and install fast-check
  - Run `git checkout -b feature/subnet-calc-ui-redesign` from the current HEAD of the default branch
  - Run `npm install --save-dev fast-check` to add fast-check as a dev dependency
  - Confirm working tree is clean before branching
  - _Requirements: 1.1, 1.2_

- [x] 2. Rewrite `lib/style.css` — design tokens and base reset
  - Replace the entire file content with a new stylesheet
  - Define all CSS custom properties in `:root` exactly as specified in the design (`--color-bg`, `--color-card`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-accent-dim`, `--color-row-even`, `--color-row-odd`, `--color-row-hover`, `--color-join-bg`, `--color-code-bg`, `--color-btn-reset`, `--font-sans`, `--font-mono`, `--radius`, `--padding`)
  - Preserve all existing `--display-*` custom properties and `.col_*` display rules (required by script.js)
  - Apply base reset: `box-sizing: border-box`, `margin: 0`, `padding: 0` on `*`
  - Set `body` background to `var(--color-bg)`, color to `var(--color-text)`, font to `var(--font-sans)`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 2.1 Write property test for dark theme tokens (Property 1)
    - **Property 1: Dark theme custom properties are defined**
    - **Validates: Requirements 2.1, 2.4**
    - Parse `lib/style.css` as a string; assert `--color-bg`, `--color-accent`, `--color-text`, `--color-card`, `--color-border` are all present and have non-empty values
    - `// Feature: subnet-calc-ui-redesign, Property 1: Dark theme custom properties are defined`

  - [ ]* 2.2 Write property test for text contrast ratio (Property 2)
    - **Property 2: Text contrast ratio meets WCAG AA**
    - **Validates: Requirements 2.3**
    - Extract `--color-text` and `--color-bg` hex values from `lib/style.css`; compute relative luminance and assert contrast ratio ≥ 4.5:1
    - `// Feature: subnet-calc-ui-redesign, Property 2: Text contrast ratio meets WCAG AA`

  - [ ]* 2.3 Write property test for no external network references (Property 3)
    - **Property 3: No external network references**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
    - Parse `index.html` and `lib/style.css` as strings; use a regex to find all URLs; assert none start with `https://` pointing to an external host
    - `// Feature: subnet-calc-ui-redesign, Property 3: No external network references`

- [x] 3. Rewrite `lib/style.css` — typography, header, and footer
  - Style `h1`: `color: var(--color-accent)`, `font-family: var(--font-sans)`, font-size 22px–26px, `font-weight: 700`
  - Style `h2`: visually distinct from body text (larger size or accent color)
  - Style `p`, labels: `font-size` appropriate for UI density, `color: var(--color-text)`
  - Style `footer`: `border-top: 1px solid var(--color-border)`, `color: var(--color-text-muted)`, consistent padding
  - Style `footer a`: `color: var(--color-text-muted)`; on hover: `color: var(--color-accent)`
  - _Requirements: 3.2, 3.3, 11.1, 11.2, 11.3_

- [x] 4. Rewrite `lib/style.css` — page container and card layout
  - Add `.page-container` rule: `max-width: 1400px`, `margin: 0 auto`, `padding: 0 var(--padding)`
  - Add `.card` rule: `background: var(--color-card)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius)`, `padding: var(--padding)`, `margin-bottom: 24px`
  - At `@media (max-width: 767px)`: ensure cards stack vertically, no horizontal overflow, form elements reflow to single column
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.1, 8.2, 8.4_

  - [ ]* 4.1 Write property test for card padding invariant (Property 6)
    - **Property 6: Card padding invariant**
    - **Validates: Requirements 4.3**
    - Parse `.card` rule from `lib/style.css`; assert the `padding` value resolves to ≥ 16px on all sides
    - `// Feature: subnet-calc-ui-redesign, Property 6: Card padding invariant`

- [x] 5. Rewrite `lib/style.css` — form inputs and buttons
  - Style `input[type="text"]`: `background: var(--color-card)`, `color: var(--color-text)`, `border: 1px solid var(--color-border)`, `border-radius: 4px`, `padding: 6px 10px`; on focus: `border-color: var(--color-accent)`, `outline: 2px solid var(--color-accent)`
  - Style `input[type="submit"]` (Update button): `background: var(--color-accent)`, `color: #000`, `border: none`, `border-radius: 20px`, `padding: 7px 18px`, `cursor: pointer`; on hover: `background: var(--color-accent-dim)`
  - Style `input[type="button"]` (Reset button): `background: var(--color-btn-reset)`, `color: var(--color-text)`, `border: 1px solid var(--color-border)`, `border-radius: 20px`, `padding: 7px 18px`, `cursor: pointer`
  - Style column-toggle checkboxes: checked label at `opacity: 1`, unchecked label at `opacity: 0.45`; use CSS `:has()` or adjacent sibling selector
  - _Requirements: 6.1, 6.5, 6.6_

  - [ ]* 5.1 Write property test for column toggle opacity invariant (Property 5)
    - **Property 5: Column toggle opacity invariant**
    - **Validates: Requirements 6.6**
    - Parse `lib/style.css`; assert a rule exists that sets label opacity to 1 when checkbox is checked and ≤ 0.5 when unchecked
    - `// Feature: subnet-calc-ui-redesign, Property 5: Column toggle opacity invariant`

- [x] 6. Rewrite `lib/style.css` — calculator table
  - Style `.calc`: `width: 100%`, `border-collapse: collapse`, `font-family: var(--font-sans)`, `font-size: 0.85rem`
  - Style `.calc td`, `.calc th`: `border: 1px solid var(--color-border)`, `padding: 6px 10px`
  - Style `.calc thead td`: `background: color-mix(in srgb, var(--color-accent) 15%, var(--color-card))` or a teal tint; `color: var(--color-text)`; `font-weight: 600`; `border-left: 3px solid var(--color-accent)` on first cell
  - Style `.calc tbody tr:nth-child(even)`: `background: var(--color-row-even)`
  - Style `.calc tbody tr:nth-child(odd)`: `background: var(--color-row-odd)`
  - Style `.calc tbody tr:hover`: `background: var(--color-row-hover)`
  - Style data cells (`.col_subnet`, `.col_netmask`, `.col_range`, `.col_useable`, `.col_cloudformation`, `.col_terraform`): `font-family: var(--font-mono)`
  - Style `.disabledAction`: `opacity: 0.35`, `cursor: default`
  - Style `.maskSpan`: `background: var(--color-join-bg)`, `color: var(--color-accent)`, `font-family: var(--font-mono)`, `font-size: 0.75rem`
  - Style divide links (`a` inside `.col_divide`): `color: var(--color-accent)`; on hover: `text-decoration: underline`
  - Add `.table-scroll-wrapper`: `overflow-x: auto`, `width: 100%`
  - _Requirements: 3.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3, 6.4, 8.3_

  - [ ]* 6.1 Write property test for disabled action opacity (Property 9)
    - **Property 9: Disabled action muted appearance**
    - **Validates: Requirements 6.3**
    - Parse `.disabledAction` rule from `lib/style.css`; assert `opacity` value is ≤ 0.4
    - `// Feature: subnet-calc-ui-redesign, Property 9: Disabled action muted appearance`

- [x] 7. Rewrite `lib/style.css` — export panel and IaC textarea
  - Style `select` elements: `background: var(--color-card)`, `color: var(--color-text)`, `border: 1px solid var(--color-border)`, `border-radius: 4px`, `padding: 6px 10px`; on focus: `border-color: var(--color-accent)`, `outline: 2px solid var(--color-accent)`
  - Style `#iacOutput`: `font-family: var(--font-mono)`, `background: var(--color-code-bg)`, `color: var(--color-text)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius)`, `min-height: 300px`, `width: 100%`, `line-height: 1.6`, `padding: var(--padding)`, `resize: vertical`
  - Style "Generate IaC" button: same prominent style as Update button using `var(--color-accent)`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 7.1 Write property test for IaC textarea minimum height (Property 8)
    - **Property 8: IaC textarea minimum height**
    - **Validates: Requirements 7.2**
    - Parse `#iacOutput` rule from `lib/style.css`; assert `min-height` value is ≥ 300px
    - `// Feature: subnet-calc-ui-redesign, Property 8: IaC textarea minimum height`

- [x] 8. Checkpoint — CSS complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Restructure `index.html` — page container and header
  - Wrap all body content in `<div class="page-container">`
  - Replace the outer `<table width="100%">` layout with semantic `<header>` containing `<h1>` and subtitle `<p>`
  - Preserve `<form name="calc" onsubmit="updateNetwork(); return false;">` exactly
  - Preserve all `<input>` elements with their `name`, `id`, `onchange`, `onclick` attributes unchanged
  - _Requirements: 8.1, 9.1, 9.2, 9.8_

  - [ ]* 9.1 Write property test for JS-facing attributes preserved (Property 4)
    - **Property 4: JS-facing attributes are preserved**
    - **Validates: Requirements 9.1, 9.8**
    - Parse `index.html` as a string; assert all ids, names, classes, and event handler attributes that `lib/script.js` references are present with their exact values: `calcbody`, `saveLink`, `joinHeader`, `col_join`, `col_subnet`, `cb_subnet`, `cb_netmask`, `cb_range`, `cb_useable`, `cb_hosts`, `cb_cloudformation`, `cb_terraform`, `cb_comments`, `cb_divide`, `cb_join`, `iacType`, `iacOutput`, `outputFormat`, `cloudProvider`, `cloudProviderLabel`, `hardcodeCidr`, `calc` (form name), `network` (input name), `netbits` (input name), `onchange="toggleColumn(this)"`, `onsubmit="updateNetwork(); return false;"`, `onclick="generateIac()"`, `onchange="handleIacTypeChange()"`
    - `// Feature: subnet-calc-ui-redesign, Property 4: JS-facing attributes are preserved`

- [x] 10. Restructure `index.html` — control panel card
  - Wrap the form (network input + column toggles) in `<div class="card">`
  - Replace the inner `<table cellspacing="0">` layout for the network/mask inputs with a `<div>` flex row
  - Keep the `<p>` for column toggles; ensure each `<input type="checkbox">` / `<label>` pair is adjacent (sibling) so the CSS opacity rule works
  - Preserve the save-link paragraph with `<a href="subnets.html" id="saveLink">` intact
  - _Requirements: 4.1, 4.3, 6.6, 9.1, 9.7_

- [x] 11. Restructure `index.html` — calculator table section
  - Remove `<br>` and `<hr>` separators; replace with card/section spacing via CSS margin
  - Wrap `<table class="calc" ...>` in `<div class="table-scroll-wrapper">`
  - Preserve all `<colgroup>`, `<col id="col_*">`, `<thead>`, `<tbody id="calcbody">` elements and attributes exactly
  - _Requirements: 5.5, 8.3, 9.1, 9.3, 9.4, 9.5_

  - [ ]* 11.1 Write property test for table horizontal scroll containment (Property 7)
    - **Property 7: Table horizontal scroll containment**
    - **Validates: Requirements 5.5, 8.3, 8.4**
    - Parse `index.html` as a string; assert `<div class="table-scroll-wrapper">` wraps the `.calc` table; assert `lib/style.css` contains `overflow-x: auto` on `.table-scroll-wrapper` and `overflow-x` is not set to `scroll` or `auto` on `body` or `html`
    - `// Feature: subnet-calc-ui-redesign, Property 7: Table horizontal scroll containment`

- [x] 12. Restructure `index.html` — export panel card and footer
  - Wrap `<h2>Export IaC</h2>` and `<form name="exportForm">` together in `<div class="card">`
  - Preserve all `<select>`, `<input>`, `<textarea id="iacOutput">` elements and their attributes exactly
  - Ensure `<footer>` element wraps the attribution paragraph (already present; confirm it is outside the card)
  - Remove any remaining `<br>` / `<hr>` presentational elements replaced by CSS spacing
  - _Requirements: 4.2, 4.3, 7.1, 7.2, 7.3, 7.4, 7.5, 9.1, 9.6, 11.1, 11.2, 11.3_

- [x] 13. Checkpoint — HTML restructure complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Wire up and validate fast-check property tests
  - Create `tests/properties.test.js` (or `.mjs`) that imports fast-check and runs all 9 property tests as described in the design
  - Each test reads `index.html` and/or `lib/style.css` from the filesystem using `fs.readFileSync`
  - Tests that require computed styles (Properties 5, 6, 7, 8, 9) use jsdom to load `index.html` and apply `lib/style.css`
  - Add `"test": "node --experimental-vm-modules node_modules/.bin/jest tests/"` (or vitest equivalent) to `package.json` scripts
  - Install jsdom as a dev dependency if not already present: `npm install --save-dev jest jest-environment-jsdom` (or `vitest` with jsdom environment)
  - _Requirements: all — property tests validate correctness properties 1–9_

  - [ ]* 14.1 Write property test runner scaffold
    - Set up the test file with fast-check imports, file-reading helpers, and a jsdom loader helper
    - Ensure tests can be run with `npm test` or `npx jest --testPathPattern=tests/`

- [x] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `lib/script.js` must not be touched at any point
- All JS-facing HTML attributes must be preserved exactly as they appear in the original `index.html`
- fast-check property tests read static file content; they do not require a running server
- The dark theme is always active — no `prefers-color-scheme` light variant is needed
- CSS must not use `!important` on `display` properties that script.js controls via `style.display`
