# Design Document: subnet-calc-ui-redesign

## Overview

This redesign modernizes the Visual Subnet Calculator's visual presentation without touching any application logic. All changes are confined to `index.html` (structural markup and inline `<style>` if needed) and `lib/style.css` (all theme rules). `lib/script.js` is read-only.

The target aesthetic is a dark, professional networking-tool look inspired by SubnetLab Pro — dark neutral backgrounds, cyan/teal color accents, card-based section grouping, monospace data rendering, and clean responsive layout.

### Key Constraints

- No external dependencies (no CDN, no web fonts, no backend)
- Must work via `file://` protocol with no internet connection
- `lib/script.js` must not be modified
- All HTML `id`, `name`, `class`, `onchange`, `onclick`, `onsubmit` attributes that `script.js` depends on must be preserved exactly
- All styling in `lib/style.css` and/or inline `<style>` in `index.html`

---

## Architecture

The app is a single HTML page with no build step. The redesign follows a pure CSS-driven theming approach:

1. CSS custom properties (`--var`) defined in `:root` carry the entire color palette and spacing scale
2. All existing JS-facing selectors (`#calcbody`, `.col_subnet`, `.disabledAction`, `.maskSpan`, `#saveLink`, etc.) are preserved — only visual rules change
3. Layout is restructured in `index.html` using semantic `<div>` wrappers (cards, container) that do not conflict with any JS DOM queries
4. Responsive behavior is handled entirely with CSS (flexbox, `max-width`, `overflow-x: auto`)

### File Responsibilities

| File | Responsibility |
|---|---|
| `index.html` | Semantic structure, card wrapper divs, preserved JS-facing attributes |
| `lib/style.css` | All visual rules: theme tokens, typography, layout, component styles |

---

## Components and Interfaces

### 1. Page Container

A centered `<div class="page-container">` wraps all content with `max-width: 1400px` and horizontal auto margins. This prevents overflow on ultra-wide screens while keeping the layout fluid.

### 2. Header

The `<h1>` title uses `var(--color-accent)` and a system sans-serif stack. A short subtitle paragraph sits below it in muted text.

### 3. Control Panel Card

The form containing the network address input, mask input, Update/Reset buttons, and column-visibility checkboxes is wrapped in `<div class="card">`. The card has:
- Background: `var(--color-card)` (slightly lighter than page)
- Border: `1px solid var(--color-border)`
- Border-radius: `8px`
- Padding: `20px`

The form inputs use dark backgrounds with a `var(--color-accent)` focus ring. The Update button uses `var(--color-accent)` as its background; Reset uses a neutral/muted danger color.

Column-toggle checkboxes and their labels are styled inline — checked labels at full opacity, unchecked at 0.45 opacity.

### 4. Calculator Table

The `<table class="calc">` is wrapped in `<div class="table-scroll-wrapper">` for horizontal scroll containment. Styling:
- Header row: `var(--color-accent)` left-border accent or background tint, light text
- Zebra striping: alternating `var(--color-row-even)` / `var(--color-row-odd)`
- Row hover: `var(--color-row-hover)` background
- Cell borders: `1px solid var(--color-border)` (low-contrast dark, not black)
- Data cells (IP addresses, CIDR, netmask): `font-family: var(--font-mono)`
- `.disabledAction`: `opacity: 0.35`
- `.maskSpan` (join cells): `background: var(--color-join-bg)` teal tint
- Divide links: `color: var(--color-accent)` with hover underline

### 5. Export Panel Card

The IaC export form is wrapped in `<div class="card">` with the same visual treatment as the Control Panel. Components:
- `<select>` elements: dark background, light text, `var(--color-accent)` border on focus
- "Generate IaC" button: prominent, `var(--color-accent)` background
- `<textarea id="iacOutput">`: monospace font, darker background (`var(--color-code-bg)`), min-height 300px, full card width, line-height 1.6

### 6. Footer

A `<footer>` with a top border (`var(--color-border)`), muted text, and a link that turns `var(--color-accent)` on hover.

---

## Data Models

This is a pure UI redesign — no new data structures are introduced. The existing JS state model is unchanged:

- `curNetwork` (integer) — current network address
- `curMask` (integer) — CIDR prefix length
- `curComments` (object) — subnet comments keyed by `"ip/mask"`
- `rootSubnet` (array tree) — binary subnet division tree

The CSS custom properties act as the design's "data model":

```css
:root {
  /* Color palette */
  --color-bg:         #0d1117;   /* page background */
  --color-card:       #161b22;   /* card background */
  --color-border:     #30363d;   /* borders */
  --color-text:       #e6edf3;   /* primary text */
  --color-text-muted: #8b949e;   /* secondary/muted text */
  --color-accent:     #00bcd4;   /* cyan/teal accent */
  --color-accent-dim: #0097a7;   /* darker accent for hover */
  --color-row-even:   #161b22;   /* table zebra even */
  --color-row-odd:    #0d1117;   /* table zebra odd */
  --color-row-hover:  #1f2937;   /* table row hover */
  --color-join-bg:    #0e2a2e;   /* join cell tint */
  --color-code-bg:    #010409;   /* textarea/code background */
  --color-btn-reset:  #3d1f1f;   /* reset button background */

  /* Typography */
  --font-sans: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  --font-mono: ui-monospace, "Cascadia Code", "Fira Code", Consolas,
               "Courier New", monospace;

  /* Spacing */
  --radius:   8px;
  --padding:  20px;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dark theme custom properties are defined

*For any* rendered page, the CSS custom properties `--color-bg`, `--color-accent`, `--color-text`, `--color-card`, and `--color-border` SHALL be defined on the `:root` element and resolve to non-empty values.

**Validates: Requirements 2.1, 2.4**

---

### Property 2: Text contrast ratio meets WCAG AA

*For any* combination of `--color-text` foreground and `--color-bg` background, the computed contrast ratio SHALL be at least 4.5:1.

**Validates: Requirements 2.3**

---

### Property 3: No external network references

*For any* `<link>`, `<script>`, `<img>`, or CSS `@import` in the delivered page, the resolved URL SHALL NOT contain an `https://` origin outside the repository (no CDN, no Google Fonts, no external hosts).

**Validates: Requirements 10.1, 10.2, 10.3, 10.4**

---

### Property 4: JS-facing attributes are preserved

*For any* HTML element that `lib/script.js` references by `id`, `name`, `class`, `onchange`, `onclick`, or `onsubmit`, that attribute SHALL be present in the redesigned `index.html` with the same value.

**Validates: Requirements 9.1, 9.8**

---

### Property 5: Column toggle opacity invariant

*For any* column-toggle checkbox, WHEN the checkbox is checked its associated label SHALL have opacity 1.0; WHEN unchecked the label SHALL have opacity ≤ 0.5.

**Validates: Requirements 6.6**

---

### Property 6: Card padding invariant

*For any* card element (`.card`), the computed padding on all four sides SHALL be at least 16px.

**Validates: Requirements 4.3**

---

### Property 7: Table horizontal scroll containment

*For any* viewport width ≥ 320px, the page-level horizontal scrollbar SHALL NOT appear; horizontal overflow SHALL be contained within the `.table-scroll-wrapper`.

**Validates: Requirements 5.5, 8.3, 8.4**

---

### Property 8: IaC textarea minimum height

*For any* rendered state of the Export Panel, the `<textarea id="iacOutput">` computed height SHALL be at least 300px.

**Validates: Requirements 7.2**

---

### Property 9: Disabled action muted appearance

*For any* `.disabledAction` element, the computed opacity SHALL be ≤ 0.4 OR the element's color SHALL have a contrast ratio ≤ 2.0:1 against its background (indicating a clearly muted, non-interactive appearance).

**Validates: Requirements 6.3**

---

## Error Handling

Since this is a pure CSS/HTML redesign with no new logic, error handling concerns are limited to:

1. **Font fallback**: The `--font-mono` and `--font-sans` stacks include multiple fallbacks ending in generic families (`monospace`, `sans-serif`). If no preferred font is available, the browser falls back gracefully.

2. **CSS custom property fallback**: All `var(--token)` usages include a fallback value where the absence of the property would cause a visual regression (e.g., `var(--color-accent, #00bcd4)`).

3. **`file://` protocol**: No `@import` rules, no external URLs, no `fetch()` calls in CSS. The stylesheet is a single flat file that works identically under `file://` and `http://`.

4. **JS-driven inline styles**: `script.js` sets `style.display` on `#cloudProvider`, `#cloudProviderLabel`, and the `label[for="hardcodeCidr"]` elements. The CSS must not override these with `!important` rules that would break JS-controlled visibility.

5. **`prefers-color-scheme`**: The dark theme is the default. A `@media (prefers-color-scheme: light)` block is not required (the app is dark-only), but the `:root` variables ensure the dark theme is always active regardless of OS preference.

---

## Testing Strategy

### Dual Testing Approach

Both unit/example tests and property-based tests are used. They are complementary:
- Unit/example tests verify specific concrete behaviors and integration points
- Property tests verify universal invariants across a wide range of generated inputs

### Unit / Example Tests

Implemented with a standard browser-based test harness (the existing `test-suite.html` pattern in the repo):

- **Smoke test**: Open `index.html` via `file://`, confirm no JS errors, confirm table renders with default `192.168.0.0/16`
- **Divide/Join**: Click Divide on a subnet row, confirm two child rows appear; click Join, confirm merge
- **Column toggle**: Uncheck "Netmask", confirm `.col_netmask` cells are hidden; recheck, confirm visible
- **Generate IaC**: Add a comment to a subnet, click Generate IaC, confirm `<textarea id="iacOutput">` is non-empty
- **Save link**: Confirm `#saveLink` href contains `?network=` after interacting with the form
- **Offline**: Open via `file://` with network disabled, confirm full render and interaction

### Property-Based Tests

Implemented using **fast-check** (already available in the repo's `node_modules` or added as a dev dependency). Each property test runs a minimum of 100 iterations.

Each test is tagged with a comment in the format:
`// Feature: subnet-calc-ui-redesign, Property N: <property_text>`

**Property 1 — Dark theme tokens defined**
Generate arbitrary DOM snapshots; assert `getComputedStyle(document.documentElement).getPropertyValue('--color-accent')` is non-empty.
`// Feature: subnet-calc-ui-redesign, Property 1: Dark theme custom properties are defined`

**Property 2 — Contrast ratio**
Generate random foreground/background hex pairs sampled from the token set; assert WCAG contrast ≥ 4.5:1 for `--color-text` / `--color-bg`.
`// Feature: subnet-calc-ui-redesign, Property 2: Text contrast ratio meets WCAG AA`

**Property 3 — No external URLs**
Parse `index.html` and `lib/style.css` as strings; for any URL found, assert it does not start with `https://` pointing to an external host.
`// Feature: subnet-calc-ui-redesign, Property 3: No external network references`

**Property 4 — JS-facing attributes preserved**
Generate the list of all id/name/class/event-handler values that `script.js` references (static analysis); assert each is present in the redesigned `index.html`.
`// Feature: subnet-calc-ui-redesign, Property 4: JS-facing attributes are preserved`

**Property 5 — Column toggle opacity**
For any checkbox state (checked/unchecked), assert the associated label's computed opacity satisfies the invariant.
`// Feature: subnet-calc-ui-redesign, Property 5: Column toggle opacity invariant`

**Property 6 — Card padding**
For any `.card` element, assert computed padding ≥ 16px on all sides.
`// Feature: subnet-calc-ui-redesign, Property 6: Card padding invariant`

**Property 7 — Table scroll containment**
For any viewport width in [320, 1400], assert `document.documentElement.scrollWidth === document.documentElement.clientWidth` (no page-level horizontal scroll).
`// Feature: subnet-calc-ui-redesign, Property 7: Table horizontal scroll containment`

**Property 8 — IaC textarea height**
Assert `document.getElementById('iacOutput').getBoundingClientRect().height >= 300`.
`// Feature: subnet-calc-ui-redesign, Property 8: IaC textarea minimum height`

**Property 9 — Disabled action opacity**
For any `.disabledAction` element, assert computed opacity ≤ 0.4.
`// Feature: subnet-calc-ui-redesign, Property 9: Disabled action muted appearance`
