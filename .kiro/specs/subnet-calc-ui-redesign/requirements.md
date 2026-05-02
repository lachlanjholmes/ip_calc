# Requirements Document

## Introduction

This feature is a visual redesign of the Visual Subnet Calculator web app. The goal is to modernize the UI with a dark, professional networking-tool aesthetic inspired by SubnetLab Pro — featuring card-based layouts, color-coded interactive elements, rich typography, and a polished overall feel — while preserving every piece of existing functionality without regression.

All changes are confined to `index.html` and `lib/style.css`. The JavaScript logic in `lib/script.js` must not be altered. A new git branch must be created before any changes are applied.

---

## Glossary

- **App**: The Visual Subnet Calculator single-page web application.
- **Calculator_Table**: The dynamically generated `<table class="calc">` that displays subnet rows.
- **Control_Panel**: The top section containing the network address input, mask input, Update/Reset buttons, and column-visibility checkboxes.
- **Export_Panel**: The section below the Calculator_Table containing the IaC type selector, format selector, cloud provider selector, Hardcode CIDR checkbox, Generate IaC button, and output textarea.
- **Theme**: The complete set of colors, fonts, spacing, and visual treatments applied to the App.
- **Dark_Theme**: A color scheme where the page background is a dark neutral (e.g., `#0d1117` or equivalent) and foreground text is light.
- **Card**: A visually distinct container with a background slightly lighter than the page, rounded corners, and a subtle border or shadow.
- **Color_Accent**: A highlight color (e.g., cyan/teal `#00bcd4` or equivalent) used for interactive elements, headings, and focus states.
- **Subnet_Row**: A single `<tr>` inside the Calculator_Table representing one subnet.
- **Divide_Action**: The "Divide" link/button in each Subnet_Row that splits a subnet.
- **Join_Action**: The "Join" cell(s) in each Subnet_Row that merge subnets.
- **Disabled_Action**: A non-interactive span shown when Divide or Join is not available.
- **IaC_Output**: The `<textarea id="iacOutput">` that displays generated CloudFormation or Terraform code.
- **Save_Link**: The `<a id="saveLink">` bookmark hyperlink.
- **Column_Toggle**: Each checkbox/label pair in the Control_Panel that shows or hides a Calculator_Table column.

---

## Requirements

### Requirement 1: Git Branch

**User Story:** As a developer, I want all redesign changes made on a dedicated git branch, so that the main branch remains unaffected until the redesign is reviewed and merged.

#### Acceptance Criteria

1. THE App's repository SHALL have a new branch named `feature/subnet-calc-ui-redesign` created from the current HEAD of the default branch before any file modifications are made.
2. WHEN the branch is created, THE App's working tree SHALL contain no uncommitted changes from prior work.

---

### Requirement 2: Dark Theme Foundation

**User Story:** As a user, I want the App to use a dark, professional color scheme, so that it feels like a modern networking tool rather than a plain HTML page.

#### Acceptance Criteria

1. THE App SHALL apply a Dark_Theme to the entire page using CSS custom properties defined in `:root`.
2. THE App's page background SHALL use a dark neutral color in the range `#0d1117`–`#1a1f2e`.
3. THE App's default body text SHALL use a light color with a contrast ratio of at least 4.5:1 against the page background (WCAG AA).
4. THE App SHALL define a Color_Accent custom property used consistently for interactive element highlights, active states, and key headings.
5. WHEN a user's operating system preference is `prefers-color-scheme: dark`, THE App SHALL display the Dark_Theme without any additional user action.

---

### Requirement 3: Typography and Font System

**User Story:** As a user, I want clean, readable typography consistent with professional developer tools, so that information is easy to scan and read.

#### Acceptance Criteria

1. THE App SHALL use a system font stack that prioritizes monospace fonts for data values (IP addresses, CIDR notation, IaC snippets) and a sans-serif stack for labels and prose.
2. THE App's page title (`<h1>`) SHALL be rendered using the Color_Accent and a font size between 20px and 28px.
3. THE App's section headings (`<h2>`) SHALL be visually distinct from body text through size, weight, or color differentiation.
4. THE App SHALL render all IP addresses, CIDR notation, netmask values, and IaC code snippets in a monospace font.

---

### Requirement 4: Card-Based Layout

**User Story:** As a user, I want the Control_Panel and Export_Panel to be presented as distinct Cards, so that the page has clear visual hierarchy and sections are easy to identify.

#### Acceptance Criteria

1. THE App SHALL wrap the Control_Panel in a Card with rounded corners (border-radius ≥ 6px), a background color distinct from the page background, and a subtle border or box-shadow.
2. THE App SHALL wrap the Export_Panel in a Card with the same visual treatment as the Control_Panel Card.
3. THE App SHALL apply consistent padding (≥ 16px) inside each Card.
4. WHEN the viewport width is less than 768px, THE App SHALL stack Cards vertically and ensure no horizontal overflow occurs.

---

### Requirement 5: Calculator Table Styling

**User Story:** As a user, I want the Calculator_Table to be visually polished and easy to read, so that I can quickly scan subnet information.

#### Acceptance Criteria

1. THE App's Calculator_Table header row SHALL use the Color_Accent as a background or left-border accent, with light text.
2. THE App's Calculator_Table SHALL use alternating row background colors (zebra striping) to improve row readability.
3. THE App's Calculator_Table cell borders SHALL use a low-contrast dark border color consistent with the Dark_Theme (not black).
4. WHEN a user hovers over a Subnet_Row, THE App SHALL highlight that row with a background color change.
5. THE App's Calculator_Table SHALL remain horizontally scrollable on viewports narrower than the table's minimum content width, without breaking the page layout.

---

### Requirement 6: Interactive Element Styling

**User Story:** As a user, I want buttons, links, inputs, and action elements to have clear, consistent interactive styling, so that I always know what is clickable and what is disabled.

#### Acceptance Criteria

1. THE App's "Update" and "Reset" form buttons SHALL be styled as pill or rounded-rectangle buttons using the Color_Accent (Update) and a neutral/danger color (Reset).
2. THE App's Divide_Action links SHALL be styled with the Color_Accent and a visible hover state.
3. THE App's Disabled_Action spans SHALL be styled with a muted color (opacity ≤ 0.4 or equivalent low-contrast treatment) to clearly indicate non-interactivity.
4. THE App's Join_Action cells SHALL use a color-coded background (e.g., a teal or blue tint) to visually distinguish them from data cells.
5. THE App's text inputs (network address, mask bits) SHALL have a dark background, light text, a Color_Accent focus ring, and a border that changes color on focus.
6. WHEN a Column_Toggle checkbox is checked, THE App SHALL display its label with full opacity; WHEN unchecked, THE App SHALL display its label with reduced opacity (≤ 0.5).

---

### Requirement 7: Export Panel Styling

**User Story:** As a user, I want the Export_Panel to look like a professional code editor panel, so that generated IaC output is easy to read and copy.

#### Acceptance Criteria

1. THE App's IaC_Output textarea SHALL use a monospace font, a dark background (darker than the Card background), light text, and syntax-appropriate line height (≥ 1.5).
2. THE App's IaC_Output textarea SHALL have a minimum height of 300px and expand to fill available Card width.
3. THE App's IaC type, format, and cloud provider `<select>` elements SHALL be styled consistently with the Dark_Theme (dark background, light text, Color_Accent border on focus).
4. THE App's "Generate IaC" button SHALL be styled as a prominent action button using the Color_Accent.
5. THE App's "Hardcode CIDR" checkbox and its label SHALL be visually grouped and styled consistently with the Dark_Theme.

---

### Requirement 8: Responsive Layout

**User Story:** As a user, I want the App to be usable on different screen sizes, so that I can use it on a laptop, desktop, or tablet without layout breakage.

#### Acceptance Criteria

1. THE App SHALL use a fluid, max-width container (max-width ≤ 1400px) centered on the page.
2. WHEN the viewport width is less than 768px, THE App's Control_Panel form elements SHALL reflow to a single-column layout.
3. THE App's Calculator_Table SHALL be wrapped in a horizontally scrollable container so that narrow viewports do not cause page-level horizontal scroll.
4. THE App SHALL not use fixed pixel widths on the outer page container that would cause content to overflow on viewports narrower than 320px.

---

### Requirement 9: Functional Preservation

**User Story:** As a developer, I want all existing calculator functionality to work identically after the redesign, so that no user-facing features are lost or broken.

#### Acceptance Criteria

1. THE App SHALL preserve all existing HTML element `id`, `name`, `class`, and `onchange`/`onclick`/`onsubmit` attributes that `lib/script.js` depends on.
2. WHEN a user submits the network form, THE App SHALL invoke `updateNetwork()` as before.
3. WHEN a user clicks a Divide_Action, THE App SHALL split the subnet as before.
4. WHEN a user clicks a Join_Action, THE App SHALL merge the subnet as before.
5. WHEN a user changes a Column_Toggle checkbox, THE App SHALL show or hide the corresponding Calculator_Table column as before.
6. WHEN a user clicks "Generate IaC", THE App SHALL produce correct CloudFormation or Terraform output as before.
7. THE App's Save_Link SHALL continue to encode and restore full calculator state via URL parameters as before.
8. IF `lib/script.js` is loaded without modification, THEN THE App SHALL initialize and function correctly with the redesigned HTML structure.

---

### Requirement 10: Self-Contained, Offline-First Delivery

**User Story:** As a user, I want the App to work fully without an internet connection, so that I can use it as a local file or on an air-gapped network without any external dependencies.

#### Acceptance Criteria

1. THE App SHALL NOT include any `<link>`, `<script>`, `<img>`, or `@import` reference that resolves to an external network host (e.g., CDN URLs, Google Fonts, jsDelivr, unpkg, or any `https://` origin outside the repository).
2. THE App SHALL use only system font stacks (e.g., `system-ui`, `Arial`, `Verdana`, `monospace`) and SHALL NOT load any web font via a network request.
3. THE App SHALL NOT depend on any external CSS framework delivered via CDN (e.g., Bootstrap, Tailwind, Bulma).
4. THE App SHALL NOT depend on any external JavaScript library delivered via CDN (e.g., jQuery, Lodash, Chart.js).
5. ALL styling SHALL be contained within `lib/style.css` and/or inline `<style>` blocks inside `index.html`.
6. WHEN `index.html` is opened directly in a browser using the `file://` protocol with no internet connection, THE App SHALL render correctly and all interactive functionality SHALL operate without error.
7. THE App SHALL remain a single HTML page (`index.html`) that references only local assets (`lib/script.js`, `lib/style.css`) relative to itself.

---

### Requirement 11: Footer and Attribution

**User Story:** As a user, I want a styled footer with the source code link, so that attribution is preserved and visually consistent with the new design.

#### Acceptance Criteria

1. THE App SHALL display a footer at the bottom of the page containing the existing GitHub source code link.
2. THE App's footer SHALL be styled with a top border, muted text color, and consistent padding, visually separating it from the Export_Panel.
3. THE App's footer link SHALL use the Color_Accent on hover.
