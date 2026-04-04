# Visual Subnet Calculator — Work Log

> Rolling log of changes, learnings, and outcomes for each backlog item.
> Append new entries at the top (newest first). Reference task IDs from `BACKLOG.md`.
>
> **How to use this file:**
>
> - Before starting a task, read the most recent entries for context on what's been done
> - After completing (or failing) a task, add an entry using the template below
> - Be explicit about failures — they're the most valuable context for future sessions
> - Reference specific file paths and line numbers so future AI/developers can jump straight to the code

---

## Entry Template

Copy this template for each work session:

```
### [TASK-ID] — Brief Title
**Date:** YYYY-MM-DD
**Status:** Completed | Partial | Failed | Blocked

**What was attempted:**
- Step-by-step description of what was done

**What worked:**
- What succeeded and why

**What failed:**
- What didn't work, error messages, unexpected behavior

**Lessons learned:**
- Key insights for future AI/developer sessions

**Files changed:**
- `path/to/file:lines` — brief description of change

**Verification:**
- How the fix was verified (manual test, unit test, etc.)

**Related items:**
- Links to other task IDs affected or discovered during this work
```

---

## Log Entries

### Phase 7: Automated Tests — Vitest (STORY-024 through STORY-028, CHORE-003)

**Date:** 2026-04-04
**Status:** Completed

**What was attempted:**

- Set up Vitest test infrastructure for the project
- Write comprehensive unit tests for all exported pure functions
- Configure ESLint to handle both browser globals (main code) and Node.js globals (tests + CJS exports)

**What worked:**

- Created `vitest.config.js` with basic configuration
- Updated `package.json`: `"test": "vitest run"` and `"test:watch": "vitest"` (CHORE-003)
- Created 4 test files covering all exported functions:
    - `tests/ip-math.test.js` — 14 tests for `inet_aton`, 7 for `inet_ntoa`, 7 for `network_address`, 6 for `subnet_addresses`, 4 for `subnet_last_address`, 7 for `subnet_netmask`
    - `tests/serialization.test.js` — 5 tests for `nodeToString`, 9 for `binToAscii`/`asciiToBin`, 6 for `loadNode`
    - `tests/tree-operations.test.js` — 2 tests for `createNode`, 4 for `updateNumChildren`, 4 for `updateDepthChildren`, 9 for `findAwsSubnetIndex`
    - `tests/iac-generation.test.js` — 8 tests for `jsonToYaml`, 9 for `shallowEqual`
- Total: 100 tests, all passing
- ESLint config extended with overrides for `lib/script.js` (`module` global) and `tests/**/*.test.js` (Node.js globals)

**What failed:**

- Vitest v4 cannot be `require()`d — initial attempt used CJS `const { describe } = require('vitest')` which fails. Fixed by converting test files to ESM `import` syntax with `createRequire` for importing the CJS `script.js`
- IIFE's `window.addEventListener('DOMContentLoaded', ...)` executes immediately on `require()`, causing `ReferenceError: window is not defined` in Node.js. Fixed by wrapping with `if (typeof window !== 'undefined')` guard
- `jsonToYaml` array-of-objects output format: assumed `"- key: value"` on same line, but actual output puts dash on its own line with indented key below. Fixed test expectation.

**Lessons learned:**

- Vitest v4 is ESM-only — test files must use `import` syntax even when the code under test is CJS
- Use `createRequire(import.meta.url)` to bridge ESM test files importing CJS modules
- IIFE code that touches browser globals (`window`, `document`) must be guarded with `typeof window !== 'undefined'` when the file is also loaded in Node.js for testing
- The conditional `module.exports` block at the bottom of the IIFE works perfectly for exporting pure functions to tests without affecting browser behavior
- `divide()` and `join()` call `recreateTables()` (DOM-dependent) so they're not directly testable without mocking — but their data mutations can be tested by manually setting `node.children`

**Files changed:**

- `vitest.config.js` — new file, basic Vitest configuration
- `package.json:13-14` — updated test scripts to use Vitest
- `lib/script.js:781-786` — guarded `window.addEventListener` with `typeof window !== 'undefined'`
- `eslint.config.mjs:25-38` — added overrides for `module` global in script.js and Node.js globals in test files
- `tests/ip-math.test.js` — new file, 45 tests for IP math functions
- `tests/serialization.test.js` — new file, 20 tests for tree serialization
- `tests/tree-operations.test.js` — new file, 19 tests for tree operations and AWS subnet indexing
- `tests/iac-generation.test.js` — new file, 17 tests for jsonToYaml and shallowEqual

**Verification:**

- `npm test` — 100 tests passing across 4 test files
- `npm run lint` — 0 errors, 0 warnings

**Related items:**

- STORY-024, STORY-025, STORY-026, STORY-027, STORY-028, CHORE-003 — all completed in this session

---

### Phase 6: Accessibility + Semantic HTML (STORY-015 through STORY-023)

**Date:** 2026-04-04
**Status:** Completed

**What was attempted:**

- STORY-015: Replaced outer layout `<table>` with semantic HTML landmarks (`<header>`, `<main>`, `<section class="controls">`, `<section class="subnet-table">`, `<section class="iac-export">`, `<footer>`). The inner form table (Network Address/Mask bits inputs) was kept as it's a small functional grouping.
- STORY-016: Converted all 10 data table header cells from `<td>` to `<th scope="col">`. Updated CSS to apply border styles to both `td` and `th`.
- STORY-017: Added `<label>` elements with `for` attributes for Network Address and Mask bits inputs. Added `id="network"` and `id="netbits"` to the inputs. Replaced `<td class="label">` with `<td><label>`.
- STORY-018: Added `aria-label` to comment textareas ("Comment for {subnet}/{mask}"), divide links ("Divide {subnet}/{mask}"), and join links ("Join subnets into /{mask}"). Added `aria-disabled="true"` to disabled divide spans and join links.
- STORY-019: Added `:focus-visible` styles with `2px solid #0066cc` outline and `2px` offset for all interactive elements.
- STORY-020: Changed disabled action color from `#dddddd` (1.3:1 contrast) to `#767676` (4.54:1 contrast, passes WCAG AA).
- STORY-021: Added `<meta name="viewport" content="width=device-width, initial-scale=1">` to `<head>`.
- STORY-022: Replaced both `<hr noshade color="black" size="1">` with `<hr class="divider">` and CSS `border-top: 1px solid black`.
- STORY-023: Changed bookmark link text from "this hyperlink" to "bookmark this configuration".

**What worked:**

- All 9 accessibility stories completed cleanly with no conflicts
- The semantic HTML conversion was straightforward — the outer layout table was purely presentational
- Adding `aria-label` to dynamically created elements leveraged the STORY-011 decomposition (each sub-function handled its own accessibility attributes)
- `createDivideCell` needed an `address` parameter added for the aria-label, which was a clean signature change

**What failed:**

- Minor text duplication: "bookmark bookmark this configuration" — caught and fixed during review by adjusting the surrounding text to remove the redundant "bookmark" word.

**Lessons learned:**

- When changing link text, check the surrounding sentence to avoid duplication
- The STORY-011 decomposition from Phase 5 paid off here — adding accessibility attributes to each cell type was a targeted change in the right sub-function
- The `.label` CSS class was orphaned when we replaced `<td class="label">` with `<td><label>` — added a new selector for form labels to preserve the small font size

**Files changed:**

- `index.html` — Replaced layout table with semantic landmarks, converted `<td>` headers to `<th scope="col">`, added `<label>` elements, added viewport meta, replaced deprecated `<hr>` attributes, updated bookmark link text
- `lib/script.js` — Added `aria-label` and `aria-disabled` attributes to `createCommentCell`, `createDivideCell`, `createJoinCells`; added `address` parameter to `createDivideCell`
- `lib/style.css` — Added `hr.divider` styles, `:focus-visible` styles, updated `.calc td` to `.calc td, .calc th`, changed `.disabledAction` color to `#767676`, added form label selector
- `BACKLOG.md` — Marked STORY-015 through STORY-023 as `[x]`

**Verification:**

- `npm run lint` passes with no errors
- HTML structure uses semantic landmarks (`<header>`, `<main>`, `<section>`, `<footer>`)
- No deprecated HTML attributes remain (`noshade`, `color`, `size` on `<hr>`, `width` on layout `<table>`)
- All form inputs have associated `<label>` elements

**Related items:**

- STORY-015 + STORY-022 were completed together (layout table removal included deprecated `<hr>` replacement)
- Phase 7 tests should verify that aria attributes are present on dynamically created elements

---

### Phase 5: Code Quality Refactor (STORY-009 through STORY-014, CHORE-002)

**Date:** 2026-04-04
**Status:** Completed

**What was attempted:**

- STORY-009: Replaced magic tuple `[depth, numChildren, children]` arrays with named objects `{ depth, numChildren, children }` throughout the codebase. Also converted the `labels` flat array of triples (mask, numChildren, node) to an array of `{ mask, numChildren, node }` objects. Added `createNode()` factory function.
- STORY-010: Extracted `createCell(row, className, textContent)` helper function. Replaced 6 repetitive createElement/classList.add/createTextNode/appendChild patterns (subnet, netmask, range, useable, hosts, terraform cells).
- STORY-011: Decomposed 230-line `createRow` into 7 focused sub-functions: `createSubnetCells`, `createCloudFormationCell`, `createTerraformCell`, `createCommentCell`, `createDivideCell`, `createJoinCells`, plus the `createCell` helper from STORY-010. Main `createRow` is now 43 lines with clear delegation.
- STORY-012: Split `calcOnLoad` into `animateColumnIntro()` (column toggle animation for fresh loads), `restoreUrlState(args)` (URL parameter restoration), and a slim `calcOnLoad()` coordinator (~15 lines).
- STORY-013: Replaced remaining 2 `Math.pow(2, n)` calls with `2 ** n` (in `createCloudFormationCell` and `generateCloudFormation`).
- STORY-014: Added `shallowEqual(a, b)` utility function. Replaced 2 `JSON.stringify` object comparisons in `createBookmarkHyperlink` with order-independent shallow comparison.
- CHORE-002: Changed placeholder region comments in IaC output from generic "Placeholder AZ/Region" to actionable `# TODO: Change this to your availability zone/region`.

**What worked:**

- Named objects made the code dramatically more readable — `node.children` vs `node[2]`, `node.depth` vs `node[0]`
- The `createCell` helper + sub-function decomposition reduced `createRow` from 230 lines to 43 lines
- `shallowEqual` is cleaner than `JSON.stringify` comparison and handles key order differences
- All changes passed ESLint on first attempt — the named object refactor was purely mechanical

**What failed:**

- Nothing failed. The refactoring was straightforward with the IIFE already in place from Phase 4.

**Lessons learned:**

- When decomposing a large function, shared computed values (like `awsSelect`) should be computed once in the parent and passed to sub-functions rather than recomputed
- The `createCell` helper handles the common case well; special cells (CloudFormation with conditional content, comments with textarea, divide with event handlers) still need manual creation
- The `labels` array transformation from flat triples to objects was the trickiest part of STORY-009 — the loop index arithmetic `labels[i * 3]` became simply `labels[i].mask`

**Files changed:**

- `lib/script.js` — All changes: added `shallowEqual`, `createNode`, `createCell`, `createSubnetCells`, `createCloudFormationCell`, `createTerraformCell`, `createCommentCell`, `createDivideCell`, `createJoinCells`, `animateColumnIntro`, `restoreUrlState`; refactored `createRow`, `calcOnLoad`, `recreateTables`, `nodeToString`, `divide`, `join`, `updateNumChildren`, `updateDepthChildren`, `loadNode`, `startOver`, `createBookmarkHyperlink`
- `BACKLOG.md` — Marked STORY-009 through STORY-014 and CHORE-002 as `[x]`

**Verification:**

- `npm run lint` passes with no errors after each change
- All node creation uses `createNode()` factory — no raw `[0, 0, null]` arrays remain
- `grep` confirmed zero remaining `node[0]`/`node[1]`/`node[2]` or `Math.pow` references
- `grep` confirmed zero remaining `JSON.stringify.*!==.*JSON.stringify` patterns

**Related items:**

- STORY-009 directly prevents the class of bug that caused BUG-001 (wrong array index return)
- STORY-011 sub-functions are individually testable, which supports Phase 7 (STORY-025-028)

---

### Phase 1: Bug Fixes (BUG-001 through BUG-010)

**Date:** 2026-04-04
**Status:** Completed

**What was attempted:**

- Fixed all 10 Phase 1 bug fixes in a single session, working through them in priority order

**What worked:**

1. **BUG-001** — Changed `return node[1]` to `return node[0]` in `updateDepthChildren`. One-line fix, confirmed copy-paste error from `updateNumChildren`.
2. **BUG-002** — Changed `textarea.innerText = comment` to `textarea.value = comment || ''`. Also more semantically correct (`.value` is the proper API for textarea content).
3. **BUG-003** — Replaced entire `parseQueryString` function body with `URLSearchParams`. This was a clean swap — the function signature and return type stayed the same, so no call sites needed changes. This simultaneously fixed the `=` truncation bug and the deprecated `unescape()` usage.
4. **BUG-004 + BUG-005** — Fixed together as a single validation block. Moved mask validation to immediately after `parseInt`, added radix 10, added `isNaN()` guard. The `network_address()` call now only runs after mask is confirmed valid.
5. **BUG-006** — Changed `findAwsSubnetIndex` to return `-1` instead of the string `'Nothing Found'`. Added `console.warn` for the failure case. Also fixed the `SubnetIndex` variable name to `subnetIndex` (camelCase consistency).
6. **BUG-007** — Used `replaceAll` to swap all `.substr(` to `.substring(` across the file. Three occurrences: two in `loadNode`, one in `toggleColumn`.
7. **BUG-008** — Changed `==` to `===` for numeric comparisons at 4 locations. Left `!= null` comparisons untouched — `!= null` is an idiomatic JS pattern that intentionally catches both `null` and `undefined`.
8. **BUG-009** — Removed the `document.body.appendChild(awslimit)` line and simultaneously replaced `document.createElement('awslimit')` with `document.createElement('span')` plus `className = 'aws-limit-warning'`. This addressed both BUG-009, STORY-003, and CHORE-001 in one change.
9. **BUG-010** — Added a `depth` parameter (default 0) to `loadNode` with a max of 32. On exceeding depth, logs a warning and returns the remaining string (graceful degradation rather than stack overflow).

**What failed:**

- BUG-008: Attempted to "fix" `this.value == null` to strict equality, but the edit correctly rejected as a no-op since `== null` is intentional (catches both `null` and `undefined`). No actual failure, just a recognition that this pattern should be preserved.

**Lessons learned:**

- `!= null` is a valid JS idiom for null/undefined checks — don't blindly convert all `==` to `===`
- BUG-009, STORY-003, and CHORE-001 were effectively the same issue from three perspectives (DOM pollution, stray elements, non-standard element). Fixing one addressed all three.
- BUG-004 and BUG-005 are tightly coupled — mask parsing and validation should always be a single block
- `URLSearchParams` is a drop-in replacement for custom query string parsers with better encoding support

**Files changed:**

- `lib/script.js:464` — BUG-001: `return node[0]` instead of `return node[1]`
- `lib/script.js:362` — BUG-002: `textarea.value = comment || ''`
- `lib/script.js:636-643` — BUG-003: replaced `parseQueryString` body with `URLSearchParams`
- `lib/script.js:8-18` — BUG-004/005: moved mask validation before network_address, added radix 10 and NaN guard
- `lib/script.js:902-911` — BUG-006: consistent return type (-1) with console.warn
- `lib/script.js:623,629,866` — BUG-007: `substr` → `substring` (3 occurrences)
- `lib/script.js:239,245,380,415` — BUG-008: `==` → `===` (4 occurrences)
- `lib/script.js:300-304` — BUG-009: removed body append, replaced `<awslimit>` with `<span>`
- `lib/script.js:621-639` — BUG-010: added depth parameter with max 32 guard

**Verification:**

- `npm run lint` — passed with zero errors after all changes
- No automated tests exist yet (Phase 7) — manual browser verification recommended

**Related items:**

- STORY-003 and CHORE-001 marked as done (addressed with BUG-009)
- BUG-006 call sites (lines 286, 727, 782) now receive `-1` on failure instead of a string — IaC output will show `-1` which is still wrong but at least obviously wrong rather than silently bad. Full fix deferred to STORY-002 (arithmetic replacement)

---

### Phase 2: Performance (STORY-001, STORY-002)

**Date:** 2026-04-04
**Status:** Completed

**What was attempted:**

- STORY-001: Eliminated 20 redundant `recreateTables()` calls during page load column animation
- STORY-002: Replaced O(n) brute-force subnet enumeration with O(1) arithmetic calculation

**What worked:**

1. **STORY-001** — Added `skipRedraw` parameter to `toggleColumn()`. Replaced the animation in `calcOnLoad` to toggle checkboxes and CSS custom properties directly (without dispatching click events), then call `recreateTables()` once after all animations complete. The `clickElement` helper function became unused and was removed.
2. **STORY-002** — Replaced `calculateSubnets` (brute-force octet-level carry propagation + `indexOf`) with direct arithmetic: `((subnetInt >>> 0) - (supernetInt >>> 0)) >>> 0 / subnetSize`. Used `>>> 0` for unsigned 32-bit comparison to handle IPs >= 128.0.0.0 where bitwise ops produce signed negatives. The `calculateSubnets` function was fully removed.

**What failed:**

- Nothing failed. Both changes were clean replacements.

**Lessons learned:**

- The column toggle animation was dispatching synthetic click events (`clickElement` → `dispatchEvent(new MouseEvent(...))`) which triggered the full `onchange` → `toggleColumn` → `recreateTables` pipeline. Direct CSS property manipulation is sufficient for visual-only effects.
- JavaScript bitwise operations produce signed 32-bit integers. For IP arithmetic with addresses >= 128.0.0.0 (e.g., `192.168.0.0`), `inet_aton` returns a negative number. The `>>> 0` operator converts to unsigned, which is essential for correct subtraction.
- STORY-003 was already completed in Phase 1 (addressed with BUG-009).

**Files changed:**

- `lib/script.js:525-556` — STORY-001: replaced click-event animation with direct CSS toggle + single `recreateTables()` call at end
- `lib/script.js:872-881` — STORY-001: added `skipRedraw` parameter to `toggleColumn()`
- `lib/script.js:888-906` — STORY-002: replaced `calculateSubnets` + `findAwsSubnetIndex` with arithmetic-based `findAwsSubnetIndex`
- `lib/script.js` — removed unused `clickElement` helper function

**Verification:**

- `npm run lint` — passed with zero errors after all changes
- No automated tests exist yet (Phase 7) — manual browser verification recommended

**Related items:**

- STORY-003 was already done in Phase 1 (BUG-009)

---

### Phase 3: Security Hardening (STORY-004 through STORY-007)

**Date:** 2026-04-04
**Status:** Completed

**What was attempted:**

- STORY-004: Moved all inline event handlers from HTML to `addEventListener` calls in JS
- STORY-005: Fixed Terraform resource name sanitization regex
- STORY-006: Replaced all `for...in` loops with `Object.keys()` / `Object.entries()`
- STORY-007: Replaced `window.onload` with `addEventListener('DOMContentLoaded', ...)`

**What worked:**

1. **STORY-004** — Removed all inline `onsubmit`, `onclick`, `onchange` handlers from `index.html`. Added a `registerEventListeners()` function in `script.js` that attaches all handlers via `addEventListener`. Added `id` attributes to the Reset button (`resetBtn`) and Generate IaC button (`generateIacBtn`) for targeting. Also added `id="calcForm"` to the main form. Removed `window.generateIac = generateIac` global assignment and the `generateIac`/`toggleColumn` globals from `eslint.config.mjs`. Removed the now-unnecessary `eslint-disable-next-line no-unused-vars` directive on `toggleColumn`.
2. **STORY-005** — Changed Terraform regex from `/[^a-zA-Z0-9_.-]/g` to `/[^a-zA-Z0-9_]/g` and added `.replace(/^([0-9])/, 'subnet_$1')` prefix for names starting with digits. Terraform identifiers now strictly match `[a-zA-Z_][a-zA-Z0-9_]*`.
3. **STORY-006** — Replaced 4 `for...in` loops on `curComments` and `joinLocks` with `for...of Object.keys(...)`. Also replaced the `for...in` with `hasOwnProperty` guard in `jsonToYaml` with cleaner `Object.entries()` destructuring.
4. **STORY-007** — Already completed as part of STORY-004. The old `window.onload = calcOnLoad` and separate `window.addEventListener('load', handleIacTypeChange)` were replaced with a single `window.addEventListener('DOMContentLoaded', ...)` that calls `registerEventListeners()`, `calcOnLoad()`, and `handleIacTypeChange()`.

**What failed:**

- STORY-006: First edit accidentally consumed the line following the `for` statement. Fixed immediately by re-reading the affected region and restoring the lost line.

**Lessons learned:**

- When replacing `for...in` with `for...of Object.keys(...)`, be careful not to accidentally consume adjacent lines in the edit operation
- STORY-004 and STORY-007 are naturally coupled — moving to `addEventListener` in JS simultaneously eliminates `window.onload`
- Removing inline handlers also eliminated the need for `window.generateIac` workaround and the ESLint global declarations

**Files changed:**

- `index.html:15-111` — STORY-004: removed all inline event handlers, added `id` attributes
- `index.html:160-181` — STORY-004: removed inline handlers from export form
- `lib/script.js:670-751` — STORY-004: added `registerEventListeners()` function, replaced `window.onload` with `DOMContentLoaded`
- `lib/script.js:881` — STORY-005: fixed Terraform regex and added digit prefix
- `lib/script.js:86,94,820,874,949` — STORY-006: `for...in` → `Object.keys()`/`Object.entries()`
- `eslint.config.mjs:10-13` — STORY-004: removed `generateIac` and `toggleColumn` globals

**Verification:**

- `npm run lint` — passed with zero errors after all changes
- No automated tests exist yet (Phase 7) — manual browser verification recommended

**Related items:**

- STORY-007 was effectively completed by STORY-004
- STORY-004 lays groundwork for STORY-008 (ES modules) — fewer functions need global exposure

---

### Phase 4: ES Modules + Global Encapsulation (STORY-008)

**Date:** 2026-04-04
**Status:** Completed (revised approach)

**What was attempted:**

- STORY-008: Encapsulate all globals to prevent namespace pollution

**What worked:**

1. **STORY-008 (initial attempt)** — Changed `<script>` to `type="module"`. This scoped all declarations automatically with zero code changes.
2. **STORY-008 (revised)** — After user reported CORS error when opening `index.html` via `file://`, reverted `type="module"` and wrapped entire `script.js` in an IIFE: `(function() { 'use strict'; ... })();`. This achieves the same encapsulation without requiring an HTTP server. Reverted `eslint.config.mjs` `sourceType` and `package.json` `type` back to their original values.

**What failed:**

- `type="module"` enforces CORS even on local `file://` protocol. Browsers block module script loading from the filesystem, breaking the page entirely with: `Access to script blocked by CORS policy: Cross origin requests are only supported for protocol schemes: http, https`. This is a fundamental browser security restriction — ES modules can only be loaded via HTTP/HTTPS, not `file://`.

**Lessons learned:**

- **Critical:** ES modules (`type="module"`) do NOT work when opening HTML files directly from the filesystem (`file://` protocol). This is a browser security restriction, not a bug. Any project that needs to work without a dev server must avoid `type="module"`.
- An IIFE achieves the same encapsulation goal (no global leakage) without the `file://` restriction.
- Always test changes by actually opening the page in a browser, not just running lint.

**Files changed:**

- `index.html:6` — reverted to plain `<script src="lib/script.js">`
- `lib/script.js:1-3` — wrapped in IIFE: `(function () { 'use strict';`
- `lib/script.js:EOF` — closed IIFE: `})();`
- `eslint.config.mjs` — reverted `sourceType` removal
- `package.json` — reverted to `"type": "commonjs"`

**Verification:**

- `npm run lint` — passed with zero errors
- Page loads correctly when opened via `file://` protocol

**Related items:**

- Depends on STORY-004 (already completed)
- If a dev server is ever added (e.g., via Vite in Phase 7), `type="module"` could be revisited
