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
