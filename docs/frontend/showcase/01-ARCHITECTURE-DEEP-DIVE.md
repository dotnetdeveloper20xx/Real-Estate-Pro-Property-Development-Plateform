# BuildEstate Pro Design System — Architecture Deep Dive

## Directory Structure

```
client-app/src/app/shared/design-system/
├── index.ts                              # Public API — single barrel export
├── design-system-tokens.css              # CSS custom properties for font scale
│
├── modals/
│   └── modal/
│       ├── modal.component.ts            # Configurable modal with focus trap
│       ├── modal.component.property.spec.ts
│       └── modal-errors.property.spec.ts
│
├── tables/
│   └── data-table/
│       ├── data-table.component.ts       # Enterprise data table
│       ├── data-table-sort.property.spec.ts
│       ├── data-table-pagination.property.spec.ts
│       └── data-table-column-visibility.property.spec.ts
│
├── filters/
│   └── filter-bar/
│       ├── filter-bar.component.ts       # Multi-type filter system
│       ├── filter-active-count.property.spec.ts
│       ├── filter-change-completeness.property.spec.ts
│       ├── filter-date-range.property.spec.ts
│       └── filter-reset.property.spec.ts
│
├── forms/
│   ├── shared/
│   │   ├── base-form-control.ts          # Abstract ControlValueAccessor base
│   │   ├── form-accessibility.property.spec.ts
│   │   ├── form-character-counter.property.spec.ts
│   │   └── form-error-visibility.property.spec.ts
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
│   ├── radio-group/
│   └── index.ts
│
├── currency/
│   └── currency-display/
│       ├── currency-display.component.ts # GBP display/edit/readonly
│       ├── currency-round-trip.property.spec.ts
│       ├── currency-null-emission.property.spec.ts
│       └── currency-character-filtering.property.spec.ts
│
├── dates/
│   ├── date-display/
│   │   ├── date-display.component.ts     # Formatted date with relative support
│   │   ├── date-display-format.property.spec.ts
│   │   └── date-relative-threshold.property.spec.ts
│   ├── date-picker/
│   │   ├── date-picker.component.ts      # Calendar popup with constraints
│   │   ├── date-minmax.property.spec.ts
│   │   ├── date-iso-emission.property.spec.ts
│   │   └── date-invalid-input.property.spec.ts
│   ├── date-range/
│   │   └── date-range.component.ts       # Start/end range with validation
│   └── index.ts
│
├── uploads/
│   ├── file-upload/
│   │   ├── file-upload.component.ts      # Drag-drop with progress
│   │   ├── file-validation.property.spec.ts
│   │   └── file-preview.property.spec.ts
│   └── document-upload/
│       └── document-upload.component.ts  # Document-typed upload
│
├── badges/
│   ├── base-badge.component.ts           # Abstract badge base
│   ├── badge-aria.property.spec.ts
│   ├── badge-fallback.property.spec.ts
│   ├── badge-map-rendering.property.spec.ts
│   ├── status-badge/
│   ├── priority-badge/
│   ├── stage-badge/
│   ├── risk-badge/
│   └── index.ts
│
├── dialogs/
│   ├── confirm-dialog/
│   │   ├── confirm-dialog.component.ts
│   │   └── confirm-dialog-resolution.property.spec.ts
│   └── status-transition-dialog/
│       └── status-transition-dialog.component.ts
│
├── loading/
│   ├── loading-spinner/
│   ├── loading-overlay/
│   ├── loading-button/
│   ├── skeleton-card/
│   ├── skeleton-table/
│   ├── skeleton-form/
│   ├── loading-aria.property.spec.ts
│   └── index.ts
│
├── empty-states/
│   └── empty-state/
│       └── empty-state.component.ts
│
├── dashboard/
│   └── kpi-card/
│       └── kpi-card.component.ts         # KPI with trend indicators
│
├── timeline/
│   └── timeline.component.ts             # Activity/audit timeline
│
├── stepper/
│   └── lifecycle-stepper.component.ts    # Multi-step workflow indicator
│
├── pipeline/
│   └── pipeline-column.component.ts      # Kanban-style pipeline
│
├── notifications/
│   └── notification-panel/
│       └── notification-panel.component.ts
│
├── workflows/
│   └── approval-panel/
│       └── approval-panel.component.ts   # Approve/reject with notes
│
├── preferences/
│   ├── preferences-page/                 # User settings UI
│   └── preview-lab/                      # Component playground
│
└── services/
    ├── state/
    │   ├── preferences.actions.ts
    │   ├── preferences.reducer.ts
    │   ├── preferences.effects.ts
    │   ├── preferences.selectors.ts
    │   └── preferences.state.ts
    ├── display-preference.service.ts
    ├── display-preference.service.spec.ts
    ├── theme-engine.service.ts
    ├── theme-engine.service.spec.ts
    ├── font-scale.service.ts
    ├── font-scale.service.spec.ts
    ├── font-scale-proportional.property.spec.ts
    └── confirm-dialog.service.ts
```

---

## Design Decisions

### 1. OnPush Change Detection Everywhere

**Decision:** Every component uses `ChangeDetectionStrategy.OnPush`.

**Why:** BuildEstate Pro renders complex dashboards with dozens of components simultaneously. Default change detection would trigger digest cycles on every mouse move or timer tick. OnPush ensures Angular only re-renders when `@Input()` references change or events explicitly trigger `markForCheck()`.

**Trade-off:** Slightly more discipline required when working with mutable objects. Mitigated by using immutable patterns and Angular signals for internal state.

---

### 2. Angular Signals for Internal State

**Decision:** Internal component state uses Angular 20 signals where appropriate.

**Why:** Signals provide fine-grained reactivity without RxJS subscription management overhead. A badge's `displayLabel()` is a computed signal derived from its `value` input — no manual `ngOnChanges` required.

```typescript
// Example from BaseBadgeComponent
displayLabel = computed(() => {
  const entry = this.badgeEntry();
  return entry?.label ?? this.formatFallbackLabel(this.value());
});
```

---

### 3. ControlValueAccessor Pattern for All Form Controls

**Decision:** Every form control implements Angular's `ControlValueAccessor` interface via an abstract `BaseFormControl` class.

**Why:** This allows any design system form control to work seamlessly with Reactive Forms:

```typescript
// Any design system control works with formControlName
<app-text-input formControlName="siteName" label="Site Name" />
<app-currency formControlName="askingPrice" label="Asking Price" />
<app-date-picker formControlName="targetDate" label="Target Completion" />
```

Feature developers never think about value propagation, touched state, or validation display — the base class handles all of it.

---

### 4. DaisyUI-First Colour System

**Decision:** Zero hardcoded colour values. All colours reference DaisyUI semantic tokens.

**Why:** This makes theming a configuration change rather than a code change. Switch from `light` to `dark` theme and every component automatically adapts — badges, buttons, backgrounds, borders, text — because they all reference semantic tokens like `badge-success`, `btn-primary`, `bg-base-100`.

```html
<!-- This badge renders green in light theme, appropriate green in dark theme -->
<span class="badge badge-success">Active</span>

<!-- Never this: -->
<span style="background: #22c55e; color: white;">Active</span>
```

---

### 5. CSS Custom Properties for Runtime Scale

**Decision:** Font size, spacing, row heights, and input heights are controlled via CSS custom properties on `:root`.

**Why:** The `FontScaleService` can switch from Regular to Large mode at runtime by updating 5 CSS variables — no component re-render, no state change, no page reload. The browser's CSSOM handles the cascade instantly.

```css
:root[data-scale="large"] {
  --ds-font-size-base: 1.2rem;
  --ds-line-height-base: 1.6;
  --ds-spacing-unit: 0.3rem;
  --ds-table-row-height: 3rem;
  --ds-input-height: 3rem;
}
```

---

### 6. Server-Side Pagination as Default

**Decision:** `DataTableComponent` defaults to server-side pagination, emitting `pageChange` and `sortChange` events rather than slicing data internally.

**Why:** BuildEstate Pro will hold millions of records. Client-side pagination works for 50 rows; it fails at 50,000. By defaulting to server-side, we never hit a performance cliff when data volumes grow.

---

## State Management Approach

### NgRx for User Preferences

User display preferences (theme, font scale, density, notification settings) are managed through a full NgRx slice:

```mermaid
graph LR
    UI[Preferences Page] -->|dispatch| A[PreferencesActions]
    A --> R[preferencesReducer]
    R --> S[State]
    S --> SEL[Selectors]
    SEL --> UI

    A --> E[PreferencesEffects]
    E -->|HTTP| API[/api/v1/user-preferences]
    E -->|apply| THE[ThemeEngine]
    E -->|apply| FSC[FontScaleService]
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

**Why NgRx here?** Preferences are consumed by many components (every component that respects theme or scale). A centralized, observable store ensures all consumers react to preference changes simultaneously.

---

## Service Architecture

### ThemeEngine

- Applies `data-theme` attribute to `<html>`
- Reads theme from NgRx store on bootstrap
- Applies change within 100ms (DOM attribute update + browser repaint)
- Supports: `light`, `dark`, `corporate`, `business`

### FontScaleService

- Applies `data-scale` attribute to `<html>`
- Sets 5 CSS custom properties on `:root`
- Proportional scaling: Small (0.85x), Regular (1.0x), Large (1.2x)
- Property-tested to guarantee proportionality (Property 28)

### DisplayPreferenceService

- Orchestrates the full preference lifecycle
- Loads from `GET /api/v1/user-preferences` on bootstrap
- Saves via `PUT /api/v1/user-preferences` on change
- Falls back to defaults (Light, Regular, Default) on API failure
- Immediate local application, async persistence

### ConfirmDialogService

- Programmatic API: `service.confirm(options): Observable<boolean>`
- Manages dialog lifecycle without requiring template references
- Severity-aware styling (info, warning, danger)

---

## Migration Strategy: Compatibility Layer

The design system was introduced into an existing codebase. Rather than a "big bang" migration, we use a compatibility layer:

```typescript
// shared/components/index.ts (compatibility layer)
export { ModalComponent } from '../design-system/modals/modal/modal.component';
export { DataTableComponent } from '../design-system/tables/data-table/data-table.component';
export { FilterBarComponent } from '../design-system/filters/filter-bar/filter-bar.component';
// ... re-exports all design system components
```

**How it works:**

1. Feature modules continue importing from `shared/components/` (existing path)
2. `shared/components/index.ts` re-exports from `shared/design-system/` (new location)
3. No breaking changes — existing imports work without modification
4. New features import directly from `shared/design-system/` (canonical path)
5. Over time, old imports are updated — zero downtime migration

---

## The Barrel Export Pattern

The entire design system is consumable through a single import:

```typescript
import {
  ModalComponent,
  DataTableComponent,
  FilterBarComponent,
  TextInputComponent,
  CurrencyDisplayComponent,
  StatusBadgeComponent,
  EmptyStateComponent,
  LoadingOverlayComponent,
  ConfirmDialogService,
} from 'shared/design-system';
```

**Benefits:**

- Discoverability — IDE autocomplete shows everything available
- Encapsulation — internal file structure can change without breaking consumers
- Governance — if it's not in `index.ts`, it's not public API
- Tree-shaking — unused components are eliminated at build time

---

## Key Architectural Invariants

| Invariant | Enforcement |
|-----------|-------------|
| No hardcoded colours | Steering file + PR review checklist |
| OnPush on all components | Steering file + property tests |
| ControlValueAccessor on form controls | Abstract base class forces implementation |
| ARIA attributes on interactive elements | Property tests verify for random inputs |
| Barrel export for all public components | Governance doc + review checklist |
| Server-side pagination default | Component API design (emits events, doesn't slice) |
| Theme-aware rendering | DaisyUI tokens only, tested in Light + Dark |
| Proportional font scaling | Property test 28 proves mathematical relationship |

---

*This architecture was designed to scale. One team of two can maintain it today. A team of twenty can extend it tomorrow.*
