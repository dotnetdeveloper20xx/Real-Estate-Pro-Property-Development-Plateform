# BuildEstate Pro — Design System Component Catalog

## Purpose

This is the authoritative catalog of all components in the BuildEstate Pro Design System. Before creating any new component, search this catalog first. A component not listed here is not eligible for use in feature modules.

**Library Location:** `client-app/src/app/shared/design-system/`

**Last Updated:** July 2025

---

## Quick Reference

| Category | Components | Count |
|----------|-----------|-------|
| Modals | app-modal | 1 |
| Tables | app-data-table | 1 |
| Filters | app-filter-bar | 1 |
| Forms | 12 controls + base class | 13 |
| Currency | app-currency | 1 |
| Dates | app-date, app-date-picker, app-date-range | 3 |
| Uploads | app-file-upload | 1 |
| Badges | 4 badge types + base class | 5 |
| Dialogs | app-confirm-dialog | 1 |
| Loading | 6 loading components | 6 |
| Empty States | app-empty-state | 1 |
| Preferences | preferences-page, preview-lab | 2 |
| Services | 4 services + NgRx state | 5 |
| **Total** | | **41** |

---

## Component Catalog

### Modals

| Component | Selector | Purpose | File Path |
|-----------|----------|---------|-----------|
| ModalComponent | `<app-modal>` | Configurable modal with sizes, loading, dirty form detection, focus trap | `modals/modal/modal.component.ts` |

### Tables

| Component | Selector | Purpose | File Path |
|-----------|----------|---------|-----------|
| DataTableComponent | `<app-data-table>` | Enterprise data table with search, sort, pagination, export, saved views, bulk actions | `tables/data-table/data-table.component.ts` |

### Filters

| Component | Selector | Purpose | File Path |
|-----------|----------|---------|-----------|
| FilterBarComponent | `<app-filter-bar>` | Reusable filter bar with text, dropdown, date-range, status-chip, tag filters | `filters/filter-bar/filter-bar.component.ts` |

### Forms

| Component | Selector | Purpose | File Path |
|-----------|----------|---------|-----------|
| BaseFormControl | (abstract) | Base class with ControlValueAccessor, ID generation, label/ARIA management | `forms/shared/base-form-control.ts` |
| TextInputComponent | `<app-text-input>` | Styled text input with label, help, validation, character counter | `forms/text-input/text-input.component.ts` |
| TextareaComponent | `<app-textarea>` | Multi-line text input with character counter | `forms/textarea/textarea.component.ts` |
| NumberInputComponent | `<app-number-input>` | Numeric input with min/max support | `forms/number-input/number-input.component.ts` |
| EmailInputComponent | `<app-email-input>` | Email input with built-in format validation | `forms/email-input/email-input.component.ts` |
| PasswordInputComponent | `<app-password-input>` | Password input with visibility toggle | `forms/password-input/password-input.component.ts` |
| PhoneInputComponent | `<app-phone-input>` | Phone number input with format validation | `forms/phone-input/phone-input.component.ts` |
| SelectComponent | `<app-select>` | Single-select dropdown | `forms/select/select.component.ts` |
| MultiSelectComponent | `<app-multi-select>` | Multi-select dropdown with chips | `forms/multi-select/multi-select.component.ts` |
| ToggleComponent | `<app-toggle>` | Boolean toggle switch | `forms/toggle/toggle.component.ts` |
| CheckboxGroupComponent | `<app-checkbox-group>` | Group of checkboxes for multi-selection | `forms/checkbox-group/checkbox-group.component.ts` |
| RadioGroupComponent | `<app-radio-group>` | Radio button group for single selection | `forms/radio-group/radio-group.component.ts` |

### Currency

| Component | Selector | Purpose | File Path |
|-----------|----------|---------|-----------|
| CurrencyDisplayComponent | `<app-currency>` | GBP currency display/edit with formatting, precision, negative format | `currency/currency-display/currency-display.component.ts` |

### Dates

| Component | Selector | Purpose | File Path |
|-----------|----------|---------|-----------|
| DateDisplayComponent | `<app-date>` | Formatted date display with locale and relative date support | `dates/date-display/date-display.component.ts` |
| DatePickerComponent | `<app-date-picker>` | Single date input with calendar popup and min/max constraints | `dates/date-picker/date-picker.component.ts` |
| DateRangeComponent | `<app-date-range>` | Start/end date range with validation (end >= start) | `dates/date-range/date-range.component.ts` |

### Uploads

| Component | Selector | Purpose | File Path |
|-----------|----------|---------|-----------|
| FileUploadComponent | `<app-file-upload>` | Drag-and-drop file upload with progress, validation, retry | `uploads/file-upload/file-upload.component.ts` |

### Badges

| Component | Selector | Purpose | File Path |
|-----------|----------|---------|-----------|
| BaseBadgeComponent | (abstract) | Shared badge base with value, badgeMap, size, fallback handling | `badges/base-badge.component.ts` |
| StatusBadgeComponent | `<app-status-badge>` | Status value badge (Active, Pending, Completed, etc.) | `badges/status-badge/status-badge.component.ts` |
| PriorityBadgeComponent | `<app-priority-badge>` | Priority value badge (High, Medium, Low, Critical) | `badges/priority-badge/priority-badge.component.ts` |
| StageBadgeComponent | `<app-stage-badge>` | Project stage badge (Planning, Construction, Sales, etc.) | `badges/stage-badge/stage-badge.component.ts` |
| RiskBadgeComponent | `<app-risk-badge>` | Risk level badge (High, Medium, Low) | `badges/risk-badge/risk-badge.component.ts` |

### Dialogs

| Component | Selector | Purpose | File Path |
|-----------|----------|---------|-----------|
| ConfirmDialogComponent | `<app-confirm-dialog>` | Accessible confirmation dialog with severity styling | `dialogs/confirm-dialog/confirm-dialog.component.ts` |

### Loading

| Component | Selector | Purpose | File Path |
|-----------|----------|---------|-----------|
| LoadingSpinnerComponent | `<app-loading-spinner>` | Inline spinner with sm/md/lg sizes | `loading/loading-spinner/loading-spinner.component.ts` |
| LoadingOverlayComponent | `<app-loading-overlay>` | Semi-transparent blocking overlay with spinner | `loading/loading-overlay/loading-overlay.component.ts` |
| LoadingButtonComponent | `<app-loading-button>` | Button with integrated loading state | `loading/loading-button/loading-button.component.ts` |
| SkeletonCardComponent | `<app-skeleton-card>` | Card-shaped placeholder with shimmer animation | `loading/skeleton-card/skeleton-card.component.ts` |
| SkeletonTableComponent | `<app-skeleton-table>` | Table row placeholders with shimmer animation | `loading/skeleton-table/skeleton-table.component.ts` |
| SkeletonFormComponent | `<app-skeleton-form>` | Form field placeholders with shimmer animation | `loading/skeleton-form/skeleton-form.component.ts` |

### Empty States

| Component | Selector | Purpose | File Path |
|-----------|----------|---------|-----------|
| EmptyStateComponent | `<app-empty-state>` | Informative empty state with icon, title, subtitle, action buttons | `empty-states/empty-state/empty-state.component.ts` |

### Preferences

| Component | Selector | Purpose | File Path |
|-----------|----------|---------|-----------|
| PreferencesPageComponent | — | User preferences page (theme, scale, density, notifications) | `preferences/preferences-page/preferences-page.component.ts` |
| PreviewLabComponent | — | Component playground for testing display configurations | `preferences/preview-lab/preview-lab.component.ts` |

### Services

| Service | Purpose | File Path |
|---------|---------|-----------|
| DisplayPreferenceService | Manages user preference lifecycle (load, save, apply) | `services/display-preference.service.ts` |
| ThemeEngine | Applies DaisyUI data-theme attribute to document root | `services/theme-engine.service.ts` |
| FontScaleService | Applies data-scale attribute and CSS custom properties | `services/font-scale.service.ts` |
| ConfirmDialogService | Programmatic confirmation dialog, returns Observable<boolean> | `services/confirm-dialog.service.ts` |
| NgRx Preferences State | Actions, reducer, effects, selectors for preferences | `services/state/` |

---

## Governance Rules

1. **Search this catalog** before creating any new component
2. **Extend existing** if 50%+ overlap in functionality
3. **Add configuration** (new inputs) over creating variant components
4. **Document first** — catalog entry required before component is eligible for use
5. **Migrate on second use** — feature component used by 2+ modules moves to library

---

## Document History

| Date | Change | Author |
|------|--------|--------|
| July 2025 | Complete design system catalog with all 41 components | Architecture Team |
