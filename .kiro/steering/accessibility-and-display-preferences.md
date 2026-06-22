# Accessibility & Display Preferences Standards

## Purpose

This document defines the accessibility and display preference standards that all BuildEstate Pro components must comply with. These are non-negotiable requirements — accessibility is mandatory, not optional.

---

## Display Preferences System

### Font Scale

BuildEstate Pro supports three display modes controlled by the `FontScaleService`:

| Mode | Scale Factor | CSS Attribute | Applied To |
|------|-------------|---------------|------------|
| Small | 0.85x | `data-scale="small"` | Font size, line height, spacing, padding, row heights |
| Regular | 1.0x | (default, no attribute) | Baseline values |
| Large | 1.2x | `data-scale="large"` | Font size, line height, spacing, padding, row heights |

**Implementation Rule:** Use CSS custom properties from `design-system-tokens.css` for any dimension that should scale with the user's preference:

```css
font-size: var(--ds-font-size-base);
line-height: var(--ds-line-height-base);
padding: calc(var(--ds-spacing-unit) * 4);
min-height: var(--ds-table-row-height);
height: var(--ds-input-height);
```

**Never** use hardcoded pixel values for text sizes or spacing that should scale.

### Theme System

Themes are applied via DaisyUI's `data-theme` attribute on `<html>`:

- `light` — Default theme
- `dark` — Dark mode
- `corporate` — Corporate blue theme
- `business` — Business neutral theme

**Implementation Rule:** All colours must come from DaisyUI theme tokens. Components automatically adapt when the theme changes.

### Persistence

- Preferences are loaded on app bootstrap from `GET /api/v1/user-preferences`
- Changes are persisted via `PUT /api/v1/user-preferences`
- On API failure, defaults are applied (Light theme, Regular scale, Default density)
- Local changes are applied immediately; persistence happens in the background

---

## Accessibility Standards (WCAG 2.1 AA)

### Keyboard Navigation

Every interactive element must be:

- Reachable via Tab key in logical reading order (left-to-right, top-to-bottom)
- Activatable via Enter or Space
- Dismissible via Escape (for overlays, popups, modals)

Specific keyboard patterns:

| Component | Keyboard Behaviour |
|-----------|-------------------|
| Modal | Tab/Shift+Tab cycles within, Escape closes |
| Dropdown | Arrow keys navigate options, Enter selects, Escape closes |
| Date Picker | Arrow keys navigate days, Enter selects, Escape closes popup |
| Table sorting | Enter/Space toggles sort on focused column header |
| Confirm Dialog | Tab between buttons, Enter activates, Escape cancels |

### Focus Management

- Focus indicators must be 2px minimum thickness with 3:1 contrast ratio against adjacent colours
- Modals and dialogs trap focus (Tab/Shift+Tab cycle within)
- On modal open: focus moves to first focusable element inside
- On modal close: focus returns to the element that triggered the modal
- Skip navigation link must be the first focusable element on every page

### ARIA Attributes

Required ARIA attributes by component type:

| Component Type | Required ARIA |
|---------------|---------------|
| Modal/Dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Form Control | `aria-invalid`, `aria-describedby`, `aria-disabled`, `aria-required` |
| Badge | `role="status"`, `aria-label` (category + label) |
| Loading | `aria-busy="true"`, `aria-label` |
| Collapsible | `aria-expanded`, `aria-controls` |
| Table Header | `scope="col"`, `aria-sort` (when sortable) |
| Dropdown | `aria-expanded`, `aria-haspopup`, `aria-activedescendant` |
| Icon (decorative) | `aria-hidden="true"` |
| Required indicator | `aria-hidden="true"` (with `aria-required` on control) |

### Colour Contrast

Minimum contrast ratios (WCAG 2.1 AA):

| Element | Minimum Ratio |
|---------|--------------|
| Normal text (< 18px) | 4.5:1 |
| Large text (≥ 18px or 14px bold) | 3:1 |
| Non-text elements (icons, borders) | 3:1 |
| Focus indicators | 3:1 |

**Rule:** These ratios must be met in BOTH Light and Dark themes.

### Reduced Motion

When the user has `prefers-reduced-motion: reduce` active:

- All CSS transitions: set to `0ms` duration or max `100ms`
- No transform-based movement (slides, bounces, scales)
- Shimmer animations on skeletons: disabled or reduced to opacity change only
- Modal open/close: instant state change (no fade/scale)

Implementation pattern:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Touch Targets

On viewports below 768px (tablet/mobile):

- All buttons, links, and interactive elements: minimum 44×44 CSS pixels
- Adequate spacing between targets to prevent accidental activation
- No reliance on hover states for functionality

### Screen Reader Support

- All images and icons have appropriate `alt` text or `aria-hidden="true"`
- Dynamic content changes announced via `aria-live` regions
- Form errors announced when they appear (after touch)
- Loading states announced via `aria-busy`
- Table data navigable with screen reader table navigation commands

### Labels and Names

Every interactive element must have an accessible name computed from one of:

1. Visible `<label>` element with `for` attribute (preferred)
2. `aria-label` attribute (when no visible label exists)
3. `aria-labelledby` referencing visible text

---

## Compliance Verification

### Manual Testing Required

Full WCAG 2.1 AA compliance requires:

- Keyboard-only navigation testing (no mouse)
- Screen reader testing (NVDA or VoiceOver)
- High contrast mode testing
- 200% zoom testing
- `prefers-reduced-motion` testing

### Automated Checks

Use the following as a minimum automated baseline:

- Colour contrast checker for all theme combinations
- ARIA validator for proper attribute usage
- Tab order verification
- Focus trap verification on modals/dialogs

---

## Common Mistakes to Avoid

1. **Missing `aria-label` on icon-only buttons** — Screen readers cannot announce the purpose
2. **Using `div` with click handler instead of `button`** — Breaks keyboard navigation
3. **Colour as the only indicator** — Always pair colour with text or icon
4. **Missing form labels** — Screen readers cannot associate input with its purpose
5. **Autoplaying animations** — Violates reduced motion preference
6. **Focus lost on dynamic content** — Always manage focus after DOM changes
7. **Custom dropdowns without ARIA** — Inaccessible to screen readers
8. **Tables without proper headers** — Screen readers cannot announce context
