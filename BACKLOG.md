# Visual Subnet Calculator — Backlog

> Tracked bugs, user stories, and chores for improving the Visual Subnet Calculator.
> Each item has a unique ID, acceptance criteria, and technical notes for AI/developer context.
>
> **Status key:** `[ ]` = To Do | `[~]` = In Progress | `[x]` = Done | `[-]` = Cancelled

---

## Phase 1: Bug Fixes

### BUG-001: `updateDepthChildren` returns wrong value

- **Priority:** Critical
- **Status:** `[x]`
- **Description:** `updateDepthChildren` sets `node[0]` (depth) but returns `node[1]` (child count) on line 465. This corrupts depth calculations for the entire tree, affecting join cell `colspan` values in the rendered table.
- **Acceptance Criteria:**
    - [ ] Function returns `node[0]` (depth) instead of `node[1]`
    - [ ] Join cell colspans render correctly for multi-level divided subnets
    - [ ] Manual verification with 3+ levels of subdivision
- **Technical Notes:**
    - File: `lib/script.js:459-467`
    - The sibling function `updateNumChildren` (line 448-456) correctly returns `node[1]`; this is likely a copy-paste error
    - Line 465: change `return node[1];` to `return node[0];`
    - Test by dividing a `/16` three times and checking join cell layout

---

### BUG-002: `null` displayed in comment textareas

- **Priority:** Critical
- **Status:** `[x]`
- **Description:** When a comment is `null` (set on line 226 via `|| null`), `textarea.innerText = null` renders the literal string `"null"` in the textarea.
- **Acceptance Criteria:**
    - [ ] Empty textareas show blank, never the string "null"
    - [ ] Existing comments still display correctly when restored from URL
- **Technical Notes:**
    - File: `lib/script.js:362`
    - Fix: change `textarea.innerText = comment;` to `textarea.value = comment || '';`
    - Using `.value` is also more correct for textarea elements than `.innerText`

---

### BUG-003: Query string parser truncates values containing `=`

- **Priority:** Critical
- **Status:** `[x]`
- **Description:** `parseQueryString` uses `field.split('=')` which destructures only the first two parts. Any `=` characters in the value (common in JSON or base64) are silently discarded. Also uses deprecated `unescape()`.
- **Acceptance Criteria:**
    - [ ] URL parameters with `=` in values are parsed correctly
    - [ ] `unescape()` replaced with `decodeURIComponent()` or `URLSearchParams`
    - [ ] Bookmarked URLs with complex comments round-trip correctly
- **Technical Notes:**
    - File: `lib/script.js:619-630`
    - Recommended fix: replace entire function with `URLSearchParams`:
        ```js
        function parseQueryString(str) {
            const params = new URLSearchParams(str || location.search);
            const args = {};
            for (const [key, value] of params) {
                args[key] = value;
            }
            return args;
        }
        ```
    - This also fixes the deprecated `unescape()` call (line 626)
    - Test with a URL containing `comments={"10.0.0.0/24":"test=value"}`

---

### BUG-004: Mask validation occurs after first use

- **Priority:** High
- **Status:** `[x]`
- **Description:** In `updateNetwork()`, the mask is used in `network_address(newNetwork, newMask)` on line 20 before the range check `newMask < 0 || newMask > 32` on line 29. A mask of 33+ or negative produces garbage before being caught.
- **Acceptance Criteria:**
    - [ ] Mask range check (`< 0` or `> 32`) runs before any arithmetic using the mask
    - [ ] `NaN` mask (from non-numeric input) is also caught
    - [ ] User sees a clear error message for invalid masks
- **Technical Notes:**
    - File: `lib/script.js:8-32`
    - Move the block at lines 29-32 to immediately after `parseInt` on line 11
    - Also add `isNaN(newMask)` check (see BUG-005)

---

### BUG-005: `parseInt` without radix and no `NaN` guard for mask input

- **Priority:** High
- **Status:** `[x]`
- **Description:** `parseInt(form.elements['netbits'].value)` on line 11 has no radix argument and no `NaN` check. Entering "abc" produces `NaN` which silently flows through all calculations.
- **Acceptance Criteria:**
    - [ ] `parseInt` uses radix 10
    - [ ] `NaN` result triggers a user-visible error and returns early
- **Technical Notes:**
    - File: `lib/script.js:11`
    - Fix: `const newMask = parseInt(form.elements['netbits'].value, 10);`
    - Add: `if (isNaN(newMask)) { alert('Invalid mask value'); return; }`
    - Combine with BUG-004 fix for a single validation block

---

### BUG-006: `findAwsSubnetIndex` returns mixed types

- **Priority:** High
- **Status:** `[x]`
- **Description:** Returns a number on success but the string `'Nothing Found'` on failure (line 892). This string is silently interpolated into CloudFormation/Terraform output, producing invalid IaC code.
- **Acceptance Criteria:**
    - [ ] Function returns a consistent type (number or throws)
    - [ ] Invalid index produces a visible error or warning, not silent bad output
- **Technical Notes:**
    - File: `lib/script.js:888-893`
    - Option A: Return `-1` and check at call sites
    - Option B: Throw an error and catch in `generateCloudFormation`/`generateTerraform`
    - Call sites: `lib/script.js:276`, `lib/script.js:714`, `lib/script.js:769`

---

### BUG-007: Deprecated `substr()` usage

- **Priority:** Low
- **Status:** `[x]`
- **Description:** `String.prototype.substr()` is deprecated. Used in `loadNode` (lines 606, 612) and `toggleColumn` (line 853).
- **Acceptance Criteria:**
    - [ ] All `substr()` calls replaced with `substring()` or `slice()`
    - [ ] No functional change in behavior
- **Technical Notes:**
    - `lib/script.js:606`: `division.substr(1)` → `division.substring(1)`
    - `lib/script.js:612`: `division.substr(1)` → `division.substring(1)`
    - `lib/script.js:853`: `cb.id.substr(3)` → `cb.id.substring(3)`

---

### BUG-008: Loose equality (`==`) used instead of strict (`===`)

- **Priority:** Low
- **Status:** `[x]`
- **Description:** Several comparisons use `==` where `===` is more appropriate. While not causing bugs with current code, it's a maintenance risk if types change.
- **Acceptance Criteria:**
    - [ ] All `==` replaced with `===` (and `!=` with `!==`) where applicable
    - [ ] No behavioral change
- **Technical Notes:**
    - `lib/script.js:229`: `mask == 32`
    - `lib/script.js:235`: `mask == 31`
    - `lib/script.js:370`: `mask == 32`
    - `lib/script.js:405`: `i == labels.length / 3 - 1`
    - All these compare numbers to numbers, so the fix is safe

---

### BUG-009: `<awslimit>` element appended to `document.body` instead of table cell

- **Priority:** Medium
- **Status:** `[x]`
- **Description:** On line 294, an `<awslimit>` custom element is appended to `document.body`. It's later moved to `newCell` (line 302), but the body append is unnecessary and accumulates orphaned elements if the flow changes.
- **Acceptance Criteria:**
    - [ ] Element is only appended to `newCell`, never to `document.body`
    - [ ] AWS CIDR limit message still displays correctly
- **Technical Notes:**
    - File: `lib/script.js:292-302`
    - Remove line 294: `document.body.appendChild(awslimit);`
    - The element is created (292), content added (295-300), appended to `awslimit` (301), then appended to `newCell` (302) — the body append is redundant

---

### BUG-010: `loadNode` has no recursion depth guard

- **Priority:** Medium
- **Status:** `[x]`
- **Description:** If the `division` binary string is malformed (all `'1'`s, no `'0'` terminators), `loadNode` recurses until stack overflow.
- **Acceptance Criteria:**
    - [ ] A maximum recursion depth is enforced (e.g., 32 — maximum subnet depth)
    - [ ] Malformed division strings produce a console warning and fall back to default
- **Technical Notes:**
    - File: `lib/script.js:604-616`
    - Add a `depth` parameter with a max of 32 (since masks range 0-32)
    - On exceeding depth, return the remaining string and log a warning

---

## Phase 2: Performance

### STORY-001: Batch column toggle initialization to avoid 20 table rebuilds

- **Priority:** High
- **Status:** `[x]`
- **Description:** On fresh page load (no URL params), the animated column toggle effect calls `toggleColumn()` → `recreateTables()` 20 times in the first 350ms. This is a visual effect but causes 20 full DOM table rebuilds.
- **Acceptance Criteria:**
    - [ ] Page load triggers at most 2 table rebuilds (one for initial, one after animation)
    - [ ] The column toggle animation still works visually
    - [ ] No visible performance difference on small subnets, significant improvement on large trees
- **Technical Notes:**
    - File: `lib/script.js:516-524`
    - Approach: separate CSS property toggling from `recreateTables()`. Toggle checkboxes and CSS vars directly during animation, call `recreateTables()` only once after all toggles complete.
    - The `toggleColumn` function (line 852-858) currently calls `recreateTables()` every time — consider adding a `skipRedraw` parameter

---

### STORY-002: Replace brute-force subnet index calculation with arithmetic

- **Priority:** Medium
- **Status:** `[x]`
- **Description:** `calculateSubnets` (line 868-886) generates ALL possible subnets by iterating with octet-level carry propagation, then `findAwsSubnetIndex` does `indexOf` to find the position. This is O(n) where n = `2^(subnetMask - supernetMask)`. For a `/16` divided into `/24`s, that's 256 iterations. The index can be calculated directly: `(subnetAddr - supernetAddr) / subnetSize`.
- **Acceptance Criteria:**
    - [ ] `findAwsSubnetIndex` uses direct arithmetic instead of enumeration
    - [ ] Results match the original function for all test cases
    - [ ] `calculateSubnets` function is removed or deprecated
- **Technical Notes:**
    - File: `lib/script.js:868-893`
    - Replacement:
        ```js
        function findAwsSubnetIndex(subnetAddress, supernetAddress, subnetMask, supernetMask) {
            const subnetInt =
                typeof subnetAddress === 'string' ? inet_aton(subnetAddress) : subnetAddress;
            const supernetInt =
                typeof supernetAddress === 'string' ? inet_aton(supernetAddress) : supernetAddress;
            const subnetSize = subnet_addresses(subnetMask);
            const index = (subnetInt - supernetInt) / subnetSize;
            return index >= 0 && Number.isInteger(index) ? index : -1;
        }
        ```
    - Note: this uses `inet_aton` which has the signed integer issue. Use `>>> 0` for unsigned comparison if needed.

---

### STORY-003: Remove DOM pollution from `<awslimit>` element

- **Priority:** Low
- **Status:** `[x]` _(addressed with BUG-009)_
- **Description:** Custom `<awslimit>` elements are appended to `document.body` on every `recreateTables()` call when a subnet exceeds the AWS 256 CIDR limit. These accumulate and are never cleaned up.
- **Acceptance Criteria:**
    - [ ] No stray elements appended to `document.body`
    - [ ] AWS limit message renders correctly in the table cell
- **Technical Notes:**
    - File: `lib/script.js:292-302`
    - Overlaps with BUG-009 — fix together
    - Also consider replacing the custom `<awslimit>` element with a standard `<span>` or `<div>`

---

## Phase 3: Security Hardening

### STORY-004: Move inline event handlers to `addEventListener`

- **Priority:** High
- **Status:** `[x]`
- **Description:** All event handlers in `index.html` are inline (`onclick`, `onsubmit`, `onchange`). This prevents using a Content Security Policy (CSP) without `unsafe-inline`, which is a major XSS mitigation.
- **Acceptance Criteria:**
    - [ ] All inline event handlers removed from HTML
    - [ ] Equivalent `addEventListener` calls added in JavaScript
    - [ ] A CSP meta tag without `unsafe-inline` can be added without breaking functionality
    - [ ] All interactive elements still function identically
- **Technical Notes:**
    - File: `index.html` — inline handlers at lines: 15, 45, 56, 63, 68, 74, 80, 86, 92, 98, 104, 110, 160, 167, 173, 177, 181
    - File: `lib/script.js` — will need to query elements and attach handlers
    - The `onchange` handlers on checkboxes (lines 56-111) all call `toggleColumn(this)` — can be replaced with a single delegated event listener
    - The `onsubmit` on the form (line 15) calls `updateNetwork(); return false;` — use `e.preventDefault()` in the listener
    - The `onclick` on Reset (line 45) has a confirm dialog — preserve this behavior

---

### STORY-005: Fix Terraform resource name sanitization

- **Priority:** Medium
- **Status:** `[x]`
- **Description:** The regex `/[^a-zA-Z0-9_.-]/g` (line 765) keeps `.` and `-` which are invalid in Terraform resource names. Terraform identifiers must match `[a-zA-Z_][a-zA-Z0-9_]*`.
- **Acceptance Criteria:**
    - [ ] Resource names only contain `[a-zA-Z0-9_]`
    - [ ] Names starting with a digit are prefixed (e.g., with `subnet_`)
    - [ ] Generated Terraform code passes `terraform validate`
- **Technical Notes:**
    - File: `lib/script.js:765`
    - Also applies to CloudFormation resource names (line 711) — CloudFormation allows alphanumeric only, which the current regex handles correctly
    - Fix for Terraform: `comment.replace(/[^a-zA-Z0-9_]/g, '').replace(/^([0-9])/, 'subnet_$1')`

---

### STORY-006: Replace `for...in` with `Object.entries()` for comment iteration

- **Priority:** Medium
- **Status:** `[x]`
- **Description:** `for...in` loops iterate inherited properties. If `Object.prototype` is ever extended (by a browser extension, polyfill, etc.), comment iteration would include unexpected keys.
- **Acceptance Criteria:**
    - [ ] All `for...in` loops on `curComments` use `Object.entries()` or `Object.keys()`
    - [ ] No behavioral change with current code
- **Technical Notes:**
    - `lib/script.js:84`: `for (const addressWithMask in curComments)` → `for (const addressWithMask of Object.keys(curComments))`
    - `lib/script.js:92`: `for (const lock in joinLocks)` → `for (const lock of Object.keys(joinLocks))`
    - `lib/script.js:704`: `for (const addressWithMask in curComments)` in `generateCloudFormation`
    - `lib/script.js:758`: `for (const addressWithMask in curComments)` in `generateTerraform`
    - `lib/script.js:832`: `for (const key in node)` in `jsonToYaml` — already uses `hasOwnProperty` guard

---

### STORY-007: Replace `window.onload` with `addEventListener`

- **Priority:** Low
- **Status:** `[x]`
- **Description:** `window.onload = calcOnLoad` (line 633) can be overwritten by any other script. Line 636 already uses `addEventListener` for `handleIacTypeChange`, creating an inconsistency.
- **Acceptance Criteria:**
    - [ ] `window.onload` replaced with `addEventListener('DOMContentLoaded', calcOnLoad)`
    - [ ] Both initialization handlers use the same pattern
- **Technical Notes:**
    - File: `lib/script.js:633, 636`
    - `DOMContentLoaded` fires earlier than `load` (doesn't wait for images/stylesheets)
    - Combine both listeners if possible since they both run on load

---

## Phase 4: ES Modules + Global Encapsulation

### STORY-008: Convert to ES modules

- **Priority:** High
- **Status:** `[x]`
- **Description:** The four globals (`curNetwork`, `curMask`, `curComments`, `rootSubnet`) and all functions pollute the global namespace. Convert to ES modules for proper encapsulation.
- **Acceptance Criteria:**
    - [ ] `lib/script.js` uses `export` for functions referenced from HTML
    - [ ] `index.html` uses `<script type="module">`
    - [ ] No variables leak to the global `window` scope (except explicitly exported ones)
    - [ ] All functionality works identically
- **Technical Notes:**
    - File: `lib/script.js:1-5` (globals), `index.html:6` (script tag)
    - Functions needed externally (from HTML event handlers or Phase 3 addEventListener): `updateNetwork`, `startOver`, `toggleColumn`, `generateIac`, `handleIacTypeChange`, `createBookmarkHyperlink`
    - Note: if STORY-004 (move inline handlers to addEventListener) is done first, fewer functions need to be exported — the module just registers its own event listeners
    - `window.generateIac = generateIac` on line 679 is already a workaround for this; modules make it clean
    - Update `eslint.config.mjs` to use `sourceType: 'module'`
    - **Dependency:** Should be done after STORY-004 for cleanest result

---

## Phase 5: Code Quality Refactor

### STORY-009: Replace magic tuple with named object for subnet tree nodes

- **Priority:** High
- **Status:** `[x]`
- **Description:** Subnet tree nodes are `[depth, numChildren, children]` arrays. `node[0]`, `node[1]`, `node[2]` are opaque and error-prone (the BUG-001 return value mistake is a direct consequence).
- **Acceptance Criteria:**
    - [ ] All node creation uses `{ depth, numChildren, children }` objects
    - [ ] All node access uses named properties instead of indices
    - [ ] No behavioral change
- **Technical Notes:**
    - Creation sites: `lib/script.js:57` (`startOver`), `lib/script.js:434-437` (`divide`), `lib/script.js:608-611` (`loadNode`), `lib/script.js:581` (`calcOnLoad`)
    - Access sites: throughout `createRow`, `updateNumChildren`, `updateDepthChildren`, `recreateTables`, `nodeToString`
    - Search for `node[0]`, `node[1]`, `node[2]` to find all references
    - Also update `rootSubnet` references like `rootSubnet[0]` (line 78-81) and `rootSubnet[1]` (line 77)

---

### STORY-010: Extract DOM creation helper to reduce boilerplate

- **Priority:** Medium
- **Status:** `[x]`
- **Description:** The pattern `createElement → classList.add → createTextNode → appendChild → appendToRow` is repeated ~10 times in `createRow`. A helper function would reduce code volume by ~40%.
- **Acceptance Criteria:**
    - [ ] A helper function (e.g., `createCell(row, className, content)`) handles common cell creation
    - [ ] `createRow` uses the helper for all standard cells
    - [ ] Special cells (CloudFormation, comments, divide/join) can still use custom logic
- **Technical Notes:**
    - File: `lib/script.js:214-332`
    - Example helper:
        ```js
        function createCell(row, className, textContent) {
            const cell = document.createElement('td');
            cell.classList.add(className);
            cell.appendChild(document.createTextNode(textContent));
            row.appendChild(cell);
            return cell;
        }
        ```
    - Applicable to: subnet (215-218), netmask (245-248), range (251-254), useable (257-260), hosts (263-266), terraform (325-332)

---

### STORY-011: Break `createRow` into smaller functions

- **Priority:** Medium
- **Status:** `[x]`
- **Description:** `createRow` is 230 lines (194-422) handling recursion, 10+ cell types, event handlers, and join cell logic. It should be decomposed.
- **Acceptance Criteria:**
    - [ ] `createRow` is under 50 lines, delegating to named sub-functions
    - [ ] Sub-functions are individually testable
    - [ ] No behavioral change in rendered table
- **Technical Notes:**
    - Suggested decomposition:
        - `createSubnetCells(row, address, mask)` — subnet, netmask, range, useable, hosts
        - `createCloudFormationCell(row, address, mask)` — AWS CloudFormation expression
        - `createTerraformCell(row, address, mask)` — Terraform expression
        - `createCommentCell(row, address, mask, comment)` — textarea with change handler
        - `createDivideCell(row, node, mask, comment)` — divide action
        - `createJoinCells(row, labels, address, depth, node, comment)` — join cells loop
    - **Dependency:** Best done after STORY-009 (named objects) and STORY-010 (DOM helper)

---

### STORY-012: Break `calcOnLoad` into discrete initialization steps

- **Priority:** Low
- **Status:** `[x]`
- **Description:** `calcOnLoad` (line 509-601) handles URL parsing, DOM manipulation, column toggling, comment restoration, IaC restoration, and network updating in one function.
- **Acceptance Criteria:**
    - [ ] Initialization is broken into named steps: `parseUrlState()`, `restoreState()`, `initializeDefaults()`
    - [ ] Each step is individually testable
- **Technical Notes:**
    - File: `lib/script.js:509-601`
    - Natural split points:
        - Lines 510-511: URL parsing
        - Lines 515-525: column animation (no URL params)
        - Lines 528-596: URL state restoration
        - Lines 597-600: default initialization

---

### STORY-013: Use `2 ** n` consistently instead of `Math.pow(2, n)`

- **Priority:** Low
- **Status:** `[x]`
- **Description:** `Math.pow(2, n)` is used in several places while `2 ** n` is already used on line 495. Standardize on the modern syntax.
- **Acceptance Criteria:**
    - [ ] All `Math.pow(2, n)` replaced with `2 ** n`
- **Technical Notes:**
    - `lib/script.js:270`: `Math.pow(2, mask - curMask)`
    - `lib/script.js:716`: `Math.pow(2, subnetMask - curMask)`
    - `lib/script.js:870`: `Math.pow(2, subnetMask - supernetMask)`
    - `lib/script.js:875-876`: two occurrences in the carry/modulo calculation

---

### STORY-014: Replace `JSON.stringify` object comparison

- **Priority:** Low
- **Status:** `[x]`
- **Description:** `JSON.stringify(obj1) !== JSON.stringify(obj2)` is used to compare column settings and IaC settings (lines 128, 142). This is order-dependent and slower than a dedicated comparison.
- **Acceptance Criteria:**
    - [ ] A utility function (e.g., `shallowEqual(a, b)`) replaces JSON serialization comparisons
    - [ ] Comparison is order-independent for object keys
- **Technical Notes:**
    - File: `lib/script.js:128, 142`
    - Simple implementation:
        ```js
        function shallowEqual(a, b) {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            return keysA.every((key) => a[key] === b[key]);
        }
        ```

---

### CHORE-001: Replace custom `<awslimit>` element with standard HTML

- **Priority:** Low
- **Status:** `[x]` _(addressed with BUG-009)_
- **Description:** A custom `<awslimit>` element (not a registered web component) is used for the AWS CIDR limit message. This is non-standard and confusing.
- **Acceptance Criteria:**
    - [ ] `<awslimit>` replaced with `<span>` or `<div>` with appropriate class
    - [ ] Styling preserved
- **Technical Notes:**
    - File: `lib/script.js:292`
    - Change `document.createElement('awslimit')` to `document.createElement('span')` and add a class like `aws-limit-warning`

---

### CHORE-002: Hard-coded `us-east-1a` placeholder in IaC output

- **Priority:** Low
- **Status:** `[x]`
- **Description:** Generated CloudFormation and Terraform include hard-coded `us-east-1a` (line 734) and `us-central1` (line 803) without any user warning. Users may deploy to wrong regions.
- **Acceptance Criteria:**
    - [ ] Placeholder values include a clear `# TODO: Change this` comment in the output
    - [ ] OR: A region input field is added to the IaC export form
- **Technical Notes:**
    - `lib/script.js:734`: CloudFormation `AvailabilityZone: 'us-east-1a'`
    - `lib/script.js:782`: Terraform AWS `availability_zone = "us-east-1a"`
    - `lib/script.js:803`: Terraform GCP `region = "us-central1"`

---

## Phase 6: Accessibility + Semantic HTML Overhaul

### STORY-015: Replace layout tables with semantic HTML and flexbox/grid

- **Priority:** High
- **Status:** `[ ]`
- **Description:** The outer page structure uses `<table>` for layout (lines 10-121). Screen readers announce this as a data table. Replace with semantic elements and CSS layout.
- **Acceptance Criteria:**
    - [ ] No `<table>` used for layout (only for the actual subnet data table)
    - [ ] Page uses `<main>`, `<header>`, `<section>`, `<footer>` landmarks
    - [ ] Layout is visually identical using CSS flexbox/grid
    - [ ] Screen readers can navigate by landmarks
- **Technical Notes:**
    - File: `index.html:10-121`
    - The layout table wraps: heading, form, instructions, and bookmark link
    - Replace with:
        ```html
        <header><h1>...</h1></header>
        <main>
            <section class="controls">...</section>
            <section class="subnet-table">...</section>
            <section class="iac-export">...</section>
        </main>
        <footer>...</footer>
        ```

---

### STORY-016: Convert data table headers from `<td>` to `<th>`

- **Priority:** High
- **Status:** `[ ]`
- **Description:** The subnet table header row uses `<td>` elements (lines 140-149) instead of `<th>`. Screen readers cannot announce column headers when navigating data cells.
- **Acceptance Criteria:**
    - [ ] All header cells use `<th scope="col">`
    - [ ] Screen readers announce column names when navigating data cells
- **Technical Notes:**
    - File: `index.html:140-149`
    - Change all `<td class="col_*">` in the `<thead>` to `<th scope="col" class="col_*">`
    - May need CSS adjustments in `lib/style.css` if `td` selectors are used

---

### STORY-017: Add `<label>` elements for form inputs

- **Priority:** High
- **Status:** `[ ]`
- **Description:** The "Network Address" and "Mask bits" inputs (lines 23-38) have no `<label>` elements. The `<td class="label">` text is visual only.
- **Acceptance Criteria:**
    - [ ] Each input has an associated `<label>` with a `for` attribute matching the input's `id`
    - [ ] Inputs have `id` attributes (currently only have `name`)
    - [ ] Screen readers announce "Network Address" and "Mask bits" when focusing the inputs
- **Technical Notes:**
    - File: `index.html:18-38`
    - Add `id="network"` to the network input (line 23) and `id="netbits"` to the mask input (line 32)
    - Change `<td class="label">Network Address</td>` to `<td><label for="network">Network Address</label></td>`

---

### STORY-018: Add `aria-label` to dynamically generated elements

- **Priority:** Medium
- **Status:** `[ ]`
- **Description:** Comment textareas, Divide links, and Join links created in `createRow` have no accessible names. Screen readers announce them generically.
- **Acceptance Criteria:**
    - [ ] Comment textareas have `aria-label="Comment for {subnet}/{mask}"`
    - [ ] Divide links have `aria-label="Divide {subnet}/{mask}"`
    - [ ] Join links have `aria-label="Join subnets into /{mask}"`
    - [ ] Disabled actions have `aria-disabled="true"`
- **Technical Notes:**
    - Textarea: `lib/script.js:336` — add `textarea.setAttribute('aria-label', ...)`
    - Divide link: `lib/script.js:378-385` — add `aria-label` to the `<a>` element
    - Disabled divide: `lib/script.js:372` — add `aria-disabled="true"` to the `<span>`
    - Join links: `lib/script.js:403-414`

---

### STORY-019: Add focus styles for keyboard navigation

- **Priority:** Medium
- **Status:** `[ ]`
- **Description:** No `:focus` or `:focus-visible` styles are defined. Keyboard users cannot see which element is focused.
- **Acceptance Criteria:**
    - [ ] All interactive elements (links, buttons, inputs, textareas, checkboxes) have visible focus styles
    - [ ] Focus styles use `:focus-visible` to avoid showing on mouse click
    - [ ] Focus outline has sufficient contrast
- **Technical Notes:**
    - File: `lib/style.css`
    - Add:
        ```css
        :focus-visible {
            outline: 2px solid #0066cc;
            outline-offset: 2px;
        }
        ```

---

### STORY-020: Fix disabled text contrast ratio

- **Priority:** Medium
- **Status:** `[ ]`
- **Description:** Disabled actions use color `#dddddd` (line 83 of style.css) which has ~1.3:1 contrast ratio against white. WCAG AA requires 4.5:1 for text.
- **Acceptance Criteria:**
    - [ ] Disabled text color meets WCAG AA contrast ratio (4.5:1 minimum)
    - [ ] Disabled state is still visually distinct from enabled state
- **Technical Notes:**
    - File: `lib/style.css:83`
    - Current: `color: #dddddd`
    - Suggestion: `color: #767676` (4.54:1 ratio against white — just passes AA)
    - Or `color: #6b6b6b` (5.0:1 — more comfortable margin)

---

### STORY-021: Add viewport meta tag for mobile

- **Priority:** Medium
- **Status:** `[ ]`
- **Description:** No `<meta name="viewport">` tag exists. The page doesn't adapt to mobile screens and appears tiny on phones.
- **Acceptance Criteria:**
    - [ ] Viewport meta tag added to `<head>`
    - [ ] Page is usable on mobile (may not be fully responsive — that's a separate story)
- **Technical Notes:**
    - File: `index.html:3-8`
    - Add: `<meta name="viewport" content="width=device-width, initial-scale=1">`

---

### STORY-022: Replace deprecated HTML attributes

- **Priority:** Low
- **Status:** `[ ]`
- **Description:** `<hr noshade color="black" size="1">` on lines 123 and 155 uses deprecated HTML4 presentational attributes.
- **Acceptance Criteria:**
    - [ ] Deprecated attributes removed
    - [ ] Equivalent styling applied via CSS
    - [ ] Visual appearance unchanged
- **Technical Notes:**
    - File: `index.html:123, 155`
    - Replace with `<hr class="divider">` and CSS:
        ```css
        hr.divider {
            border: none;
            border-top: 1px solid black;
        }
        ```

---

### STORY-023: Improve bookmark link text

- **Priority:** Low
- **Status:** `[ ]`
- **Description:** The bookmark link text is "this hyperlink" (line 117) which is meaningless when screen readers read a list of links.
- **Acceptance Criteria:**
    - [ ] Link text is descriptive (e.g., "Bookmark this subnet configuration")
    - [ ] Link text makes sense out of context
- **Technical Notes:**
    - File: `index.html:117`
    - Change: `<a href="..." id="saveLink">this hyperlink</a>`
    - To: `<a href="..." id="saveLink">bookmark this configuration</a>`

---

## Phase 7: Automated Tests (Vitest)

### STORY-024: Set up Vitest and test infrastructure

- **Priority:** High
- **Status:** `[ ]`
- **Description:** Install Vitest and configure it for unit testing the pure JavaScript functions. The current `npm test` script is a stub that echoes an error.
- **Acceptance Criteria:**
    - [ ] Vitest installed as a dev dependency
    - [ ] `vitest.config.js` configured for the project
    - [ ] `npm test` runs Vitest
    - [ ] A sample test passes
- **Technical Notes:**
    - `npm install -D vitest`
    - Since the code is browser JS with no bundler, tests will need to import functions directly
    - This depends on STORY-008 (ES modules) being complete so functions can be imported
    - **Dependency:** STORY-008

---

### STORY-025: Unit tests for IP math functions

- **Priority:** High
- **Status:** `[ ]`
- **Description:** Write comprehensive tests for the core IP arithmetic functions.
- **Acceptance Criteria:**
    - [ ] Tests for `inet_aton`: valid IPs, invalid IPs, edge cases (0.0.0.0, 255.255.255.255, octets > 255)
    - [ ] Tests for `inet_ntoa`: all octets, boundary values
    - [ ] Tests for `network_address`: various mask lengths
    - [ ] Tests for `subnet_addresses`: all mask values 0-32
    - [ ] Tests for `subnet_last_address`: boundary subnets
    - [ ] Tests for `subnet_netmask`: all mask values 0-32
    - [ ] All tests pass
- **Technical Notes:**
    - These are pure functions with no DOM dependencies — ideal for unit testing
    - Test file: `lib/__tests__/ip-math.test.js` or `tests/ip-math.test.js`
    - Edge case: IPs >= 128.0.0.0 produce negative signed integers from bitwise ops — tests should verify this works correctly

---

### STORY-026: Unit tests for tree serialization

- **Priority:** Medium
- **Status:** `[ ]`
- **Description:** Write tests for the binary tree serialization/deserialization functions.
- **Acceptance Criteria:**
    - [ ] Tests for `nodeToString`: leaf node, single division, deep tree
    - [ ] Tests for `binToAscii` / `asciiToBin`: round-trip fidelity
    - [ ] Tests for `loadNode`: valid strings, edge cases
    - [ ] Tests for `divide` / `join`: state mutations
    - [ ] All tests pass
- **Technical Notes:**
    - Test file: `tests/serialization.test.js`
    - `loadNode` mutates its input — test that the original node is correctly populated
    - Test round-trip: `asciiToBin(binToAscii(str)) === str` for various inputs

---

### STORY-027: Unit tests for IaC generation

- **Priority:** Medium
- **Status:** `[ ]`
- **Description:** Write tests for CloudFormation and Terraform code generation.
- **Acceptance Criteria:**
    - [ ] Tests for `generateCloudFormation`: correct structure, resource names, CIDR values
    - [ ] Tests for `generateTerraform`: correct HCL for AWS, Azure, GCP providers
    - [ ] Tests for `jsonToYaml`: correct YAML output for nested objects and arrays
    - [ ] Tests for hardcoded CIDR vs. function-based CIDR
    - [ ] All tests pass
- **Technical Notes:**
    - These functions access DOM elements (`document.getElementById`) — tests will need to mock the DOM or refactor functions to accept parameters
    - `jsonToYaml` is a pure function and testable directly
    - Consider refactoring IaC generators to accept config objects instead of reading DOM (improves testability)

---

### STORY-028: Unit tests for subnet tree operations

- **Priority:** Medium
- **Status:** `[ ]`
- **Description:** Write tests for tree manipulation and traversal functions.
- **Acceptance Criteria:**
    - [ ] Tests for `updateNumChildren`: correct counts after divide/join
    - [ ] Tests for `updateDepthChildren`: correct depth after divide/join
    - [ ] Tests for `findAwsSubnetIndex`: correct indices, edge cases, invalid input
    - [ ] All tests pass
- **Technical Notes:**
    - After BUG-001 fix, `updateDepthChildren` should return correct depth
    - After STORY-002, `findAwsSubnetIndex` uses arithmetic — test with various subnet sizes
    - Test file: `tests/tree-operations.test.js`

---

### CHORE-003: Update `package.json` test script

- **Priority:** Low
- **Status:** `[ ]`
- **Description:** Replace the stub test script with the Vitest command.
- **Acceptance Criteria:**
    - [ ] `npm test` runs Vitest and exits with appropriate code
    - [ ] `npm run test:watch` available for development
- **Technical Notes:**
    - File: `package.json`
    - Change `"test": "echo \"Error: no test specified\" && exit 1"` to `"test": "vitest run"` and add `"test:watch": "vitest"`
