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
