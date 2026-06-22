# BuildEstate Pro — Design System Architecture

## Overview

The BuildEstate Pro Design System is a unified, accessible, responsive, and themeable component library built with Angular 20, Tailwind CSS, and DaisyUI. It replaces ad-hoc component implementations across 14 platform modules with governed, configurable building blocks that enforce visual and behavioural consistency.

**Library Location:** `client-app/src/app/shared/design-system/`

**Last Updated:** July 2025

---

## Architecture Principles

1. **Evolution over Revolution** — Existing components are migrated and extended, not rewritten from scratch. The `shared/components/` directory remains as a compatibility layer with re-exports.
2. **DaisyUI-First Theming** — All colour values reference DaisyUI theme tokens via `data-theme` attribute. No hardcoded colours in component code.
3. **CSS Custom Properties for Scale** — Font scale, spacing, and density are controlled via CSS custom properties on `:root`, enabling runtime switching without page reload.
4. **OnPush + Signals** — All components use `OnPush` change detection. Angular 20 signals are adopted for internal state where appropriate.
5. **ControlValueAccessor Pattern** — All form control wrappers implement `ControlValueAccessor` for Reactive Forms integration.
6. **Server-Side Pagination as Default** — The table system defaults to server-side pagination/sorting/filtering, emitting events rather than manipulating data internally.

---

## Directory Structure

```
client-app/src/app/shared/design-system/
├── index.ts                          # Public API barrel export
├── design-system-tokens.css          # CSS custom properties for font scale
├── modals/
│   └── modal/                        # app-modal component
├── tables/
│   └── data-table/                   # app-data-table component
├── filters/
│   └── filter-bar/                   # app-filter-bar component
├── forms/
│   ├── shared/                       # BaseFormControl abstract class
│   ├── text-input/
│   ├── textarea/
│   ├── number-input/
│   ├── email-input/
│   ├── password-input/
│   ├── phone-input/
│   ├── select/
│   ├── multi-select/
│   ├── toggle/
│   ├── checkbox-group/
│   └── radio-group/
├── currency/
│   └── currency-display/             # app-currency component
├── dates/
│   ├── date-display/                 # app-date component
│   ├── date-picker/                  # app-date-picker component
│   └── date-range/                   # app-date-range component
├── uploads/
│   └── file-upload/                  # app-file-upload component
├── badges/
│   ├── base-badge.component.ts       # Abstract base for all badges
│   ├── status-badge/                 # app-status-badge
│   ├── priority-badge/               # app-priority-badge
│   ├── stage-badge/                  # app-stage-badge
│   └── risk-badge/                   # app-risk-badge
├── dialogs/
│   └── confirm-dialog/               # app-confirm-dialog component
├── loading/
│   ├── loading-spinner/              # app-loading-spinner
│   ├── loading-overlay/              # app-loading-overlay
│   ├── loading-button/               # app-loading-button
│   ├── skeleton-card/                # app-skeleton-card
│   ├── skeleton-table/               # app-skeleton-table
│   └── skeleton-form/                # app-skeleton-form
├── empty-states/
│   └── empty-state/                  # app-empty-state
├── preferences/
│   ├── preferences-page/             # User preferences page
│   └── preview-lab/                  # Component playground
└── services/
    ├── state/                        # NgRx preferences state
    ├── display-preference.service.ts
    ├── theme-engine.service.ts
    ├── font-scale.service.ts
    └── confirm-dialog.service.ts
```

---

## Design Tokens

### CSS Custom Properties

The design system uses CSS custom properties on `:root` for runtime font scale and density control. These tokens live in `design-system-tokens.css`.

```css
:root {
  /* Regular (1.0x baseline) */
  --ds-font-size-base: 1rem;
  --ds-line-height-base: 1.5;
  --ds-spacing-unit: 0.25rem;
  --ds-table-row-height: 2.5rem;
  --ds-input-height: 2.5rem;
}

:root[data-scale="small"] {
  --ds-font-size-base: 0.85rem;
  --ds-line-height-base: 1.4;
  --ds-spacing-unit: 0.2rem;
  --ds-table-row-height: 2rem;
  --ds-input-height: 2rem;
}

:root[data-scale="large"] {
  --ds-font-size-base: 1.2rem;
  --ds-line-height-base: 1.6;
  --ds-spacing-unit: 0.3rem;
  --ds-table-row-height: 3rem;
  --ds-input-height: 3rem;
}
```

### Scale Factors

| Mode    | Factor | Applied To                                             |
|---------|--------|--------------------------------------------------------|
| Small   | 0.85x  | Font size, line height, spacing, padding, row heights |
| Regular | 1.0x   | Baseline — all values at design-time defaults          |
| Large   | 1.2x   | Font size, line height, spacing, padding, row heights |

---

## Theming

### Theme Engine

Themes are applied via DaisyUI's `data-theme` attribute on the `<html>` element. The `ThemeEngine` service manages this attribute.

**Supported Themes:**
- `light` (default)
- `dark`
- `corporate`
- `business`
- Up to 10 custom themes

### Colour Governance

All components use DaisyUI semantic colour classes exclusively:

| Semantic Colour    | DaisyUI Class     | Usage                          |
|--------------------|-------------------|--------------------------------|
| Success/Active     | `badge-success`   | Green — positive states        |
| Information        | `badge-info`      | Blue — informational states    |
| Warning/Pending    | `badge-warning`   | Amber — caution states         |
| Error/Critical     | `badge-error`     | Red — danger/error states      |
| Neutral/Inactive   | `badge-ghost`     | Grey — neutral/inactive states |

**Rule:** No hardcoded colour values (`#hex`, `rgb()`, named colours) in any component. All colours must reference DaisyUI theme tokens.

---

## Core Services

### DisplayPreferenceService

Manages the lifecycle of user preferences including loading from API, saving to API, and applying visual changes.

- **API Endpoint:** `GET/PUT /api/v1/user-preferences`
- **Fallback:** Light theme, Regular scale, Default density when API fails

### ThemeEngine

Manages `data-theme` attribute on the `<html>` element. Applies theme changes within 100ms without page reload.

### FontScaleService

Manages `data-scale` attribute and CSS custom properties on `:root`. Applies scale changes within 300ms without page reload.

---

## State Management

User preferences are managed through NgRx:

```
services/state/
├── preferences.actions.ts
├── preferences.reducer.ts
├── preferences.effects.ts
├── preferences.selectors.ts
└── preferences.state.ts
```

**State Shape:**
```typescript
interface IPreferencesState {
  preferences: IUserPreferences | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  lastSaved: string | null;  // ISO timestamp
}
```

---

## Accessibility Standards

All design system components comply with WCAG 2.1 AA:

- **Colour contrast:** 4.5:1 for normal text, 3:1 for large text
- **Focus indicators:** 2px minimum thickness, 3:1 contrast ratio
- **Keyboard navigation:** All interactive elements are Tab-reachable
- **ARIA attributes:** Proper roles, labels, and states on all dynamic content
- **Reduced motion:** `prefers-reduced-motion` disables animations (0ms or max 100ms)
- **Touch targets:** Minimum 44×44px on viewports below 768px
- **Skip navigation:** First focusable element links to main content

---

## Responsive Breakpoints

| Viewport | Width Range    | Adaptations                                       |
|----------|---------------|---------------------------------------------------|
| Desktop  | 1440px+        | Full layout                                       |
| Laptop   | 1024–1439px    | Slightly condensed                                |
| Tablet   | 768–1023px     | Collapsed filters, stacked where appropriate      |
| Mobile   | 320–767px      | Single column, fullscreen modals, hamburger nav   |

---

## Migration Strategy

The existing `shared/components/` barrel (`index.ts`) re-exports components from their new design-system locations during migration. This prevents breaking existing feature module imports.

```typescript
// shared/components/index.ts (compatibility layer)
export { ModalComponent } from '../design-system/modals/modal/modal.component';
export { DataTableComponent } from '../design-system/tables/data-table/data-table.component';
// ... etc
```

Feature modules continue importing from `shared/components/` until fully migrated.

---

## Related Documentation

- [Component Library Reference](./component-library.md)
- [Component Catalog](./component-catalog.md)
- [Component Governance](./component-governance.md)
