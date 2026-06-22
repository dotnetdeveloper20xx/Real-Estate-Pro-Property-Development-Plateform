# BuildEstate Pro — Component Library Reference

## Overview

This document provides detailed per-component documentation for every component in the BuildEstate Pro Design System. Each entry includes the component's purpose, inputs, outputs, a usage example, and accessibility notes.

**Library Location:** `client-app/src/app/shared/design-system/`

**Last Updated:** July 2025

---

## Table of Contents

1. [Modal System](#1-modal-system)
2. [Table System](#2-table-system)
3. [Filter System](#3-filter-system)
4. [Form System](#4-form-system)
5. [Currency System](#5-currency-system)
6. [Date System](#6-date-system)
7. [Upload System](#7-upload-system)
8. [Badge System](#8-badge-system)
9. [Confirmation System](#9-confirmation-system)
10. [Loading System](#10-loading-system)
11. [Empty State](#11-empty-state)
12. [Preferences UI](#12-preferences-ui)

---

## 1. Modal System

### app-modal

**Purpose:** A single configurable modal component that replaces all feature-specific modals with a unified pattern supporting multiple sizes, loading states, dirty form warnings, focus trapping, and keyboard navigation.

**Location:** `design-system/modals/modal/modal.component.ts`

**Selector:** `<app-modal>`

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `visible` | `boolean` | `false` | Controls modal visibility |
| `title` | `string` | `''` | Modal title (max 100 chars, truncated with ellipsis) |
| `subtitle` | `string` | `''` | Modal subtitle (max 200 chars) |
| `icon` | `string` | `''` | Material Symbols icon name |
| `iconClass` | `string` | `''` | CSS class for icon colour |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'fullscreen'` | `'md'` | Modal size |
| `loading` | `boolean` | `false` | Shows loading overlay on body |
| `errors` | `string[]` | `[]` | Error messages displayed above footer |
| `disableBackdropClose` | `boolean` | `false` | Prevents backdrop click close |
| `formGroup` | `FormGroup \| null` | `null` | For dirty form detection |

#### Outputs

| Output | Payload | Description |
|--------|---------|-------------|
| `closed` | `void` | Emitted when modal is closed |

#### Size Mapping

| Size | CSS Class | Use Case |
|------|-----------|----------|
| `sm` | `max-w-sm` | Confirmations, simple forms |
| `md` | `max-w-lg` | Standard forms |
| `lg` | `max-w-2xl` | Multi-column forms |
| `xl` | `max-w-4xl` | Complex data views |
| `fullscreen` | `w-full h-full` | Document viewers |

#### Usage Example

```html
<app-modal
  [visible]="showModal"
  title="Create Opportunity"
  icon="add_circle"
  iconClass="text-primary"
  size="lg"
  [loading]="isSaving"
  [errors]="saveErrors"
  [formGroup]="opportunityForm"
  (closed)="onModalClose()">

  <!-- Body content -->
  <form [formGroup]="opportunityForm">
    <app-text-input formControlName="name" label="Name"></app-text-input>
  </form>

  <!-- Footer -->
  <div modal-footer>
    <button class="btn btn-ghost" (click)="onCancel()">Cancel</button>
    <button class="btn btn-primary" (click)="onSave()">Save</button>
  </div>
</app-modal>
```

#### Accessibility Notes

- Sets `role="dialog"`, `aria-modal="true"`, `aria-labelledby` referencing title
- Focus trap using `@angular/cdk` `CdkTrapFocus` — Tab/Shift+Tab cycle within modal
- Escape key closes modal (triggers dirty check if form is dirty)
- Returns focus to triggering element on close
- Fullscreen on viewports < 640px regardless of configured size
- Reduced motion: fade/scale animation disabled when `prefers-reduced-motion` is active

---

## 2. Table System

### app-data-table

**Purpose:** A comprehensive data table component providing server-side pagination, column sorting, text search, column visibility, export, saved views, row actions, bulk selection, and loading/empty/error states.

**Location:** `design-system/tables/data-table/data-table.component.ts`

**Selector:** `<app-data-table>`

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `columns` | `IColumnDefinition[]` | `[]` | Column definitions array |
| `data` | `unknown[]` | `[]` | Row data source |
| `totalCount` | `number` | `0` | Total records for pagination |
| `loading` | `boolean` | `false` | Shows skeleton loading state |
| `error` | `string \| null` | `null` | Error message for error state |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` | Available page sizes |
| `actions` | `ITableAction[]` | `[]` | Row action definitions |
| `exportFormats` | `('csv' \| 'excel')[]` | `[]` | Enabled export formats |
| `emptyIcon` | `string` | `'inbox'` | Icon for empty state |
| `emptyMessage` | `string` | `''` | Primary empty message |
| `emptySubtext` | `string` | `''` | Secondary empty message |
| `enableBulkSelect` | `boolean` | `false` | Enables row selection |
| `enableColumnVisibility` | `boolean` | `true` | Enables column picker |
| `enableExport` | `boolean` | `false` | Enables export button |
| `enableSavedViews` | `boolean` | `false` | Enables saved views |
| `searchPlaceholder` | `string` | `'Search...'` | Search input placeholder |
| `searchColumns` | `string[]` | `[]` | Columns to search across |

#### Outputs

| Output | Payload | Description |
|--------|---------|-------------|
| `pageChange` | `{ page: number; pageSize: number }` | Page navigation event |
| `sortChange` | `{ column: string; direction: 'asc' \| 'desc' }` | Column sort event |
| `searchChange` | `string` | Debounced search text (300ms) |
| `filterChange` | `Record<string, unknown>` | Filter values change |
| `rowClick` | `unknown` | Row click event |
| `actionClick` | `{ action: string; row: unknown }` | Row action click |
| `bulkAction` | `{ action: string; selectedIds: string[] }` | Bulk action event |
| `exportRequest` | `{ format: string; filters: Record<string, unknown> }` | Export request |
| `retryClick` | `void` | Retry after error |

#### Usage Example

```html
<app-data-table
  [columns]="columns"
  [data]="opportunities"
  [totalCount]="totalRecords"
  [loading]="isLoading"
  [error]="loadError"
  [pageSizeOptions]="[10, 25, 50]"
  [actions]="rowActions"
  [enableBulkSelect]="true"
  [enableExport]="true"
  [exportFormats]="['csv', 'excel']"
  emptyIcon="landscape"
  emptyMessage="No opportunities found"
  emptySubtext="Create your first opportunity to get started."
  (pageChange)="onPageChange($event)"
  (sortChange)="onSortChange($event)"
  (searchChange)="onSearch($event)"
  (rowClick)="onRowClick($event)"
  (actionClick)="onAction($event)"
  (retryClick)="loadData()">
</app-data-table>
```

#### Accessibility Notes

- Uses native `<table>`, `<thead>`, `<th scope="col">`, `<td>` elements
- Screen readers announce row/column associations during navigation
- Sort buttons accessible via keyboard with `aria-sort` attribute
- Horizontal scroll container on viewports < 768px
- Bulk select checkbox includes `aria-label` for screen readers

---

## 3. Filter System

### app-filter-bar

**Purpose:** A reusable filter bar supporting text search, dropdowns, date ranges, status chips, tag filters, reset, active count badge, removable chips, and saved presets.

**Location:** `design-system/filters/filter-bar/filter-bar.component.ts`

**Selector:** `<app-filter-bar>`

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `filters` | `IFilterDefinition[]` | `[]` | Filter control definitions (max 10) |
| `savedPresets` | `IFilterPreset[]` | `[]` | Saved filter presets |

#### Outputs

| Output | Payload | Description |
|--------|---------|-------------|
| `filterChange` | `Record<string, unknown>` | All filter values keyed by unique key |
| `resetClick` | `void` | Reset button clicked |
| `presetSave` | `{ name: string; values: Record<string, unknown> }` | Save preset |
| `presetLoad` | `string` | Load preset by ID |
| `presetDelete` | `string` | Delete preset by ID |

#### Usage Example

```html
<app-filter-bar
  [filters]="filterDefinitions"
  [savedPresets]="userPresets"
  (filterChange)="onFilterChange($event)"
  (resetClick)="onReset()"
  (presetSave)="onSavePreset($event)"
  (presetLoad)="onLoadPreset($event)">
</app-filter-bar>
```

#### Accessibility Notes

- Text search input has associated label via `aria-label`
- Dropdown filters use `aria-expanded` and `aria-haspopup`
- Active filter count announced via `aria-live` region
- Removable chips have `aria-label` describing the filter being removed
- Collapsible panel on < 768px with `aria-expanded` on trigger

---

## 4. Form System

### Base Form Control (Abstract)

**Purpose:** An abstract class implementing `ControlValueAccessor` that all form controls extend. Provides unique ID generation, label association, error visibility logic, character counter, and ARIA attribute management.

**Location:** `design-system/forms/shared/base-form-control.ts`

### app-text-input

**Purpose:** A styled text input field with label, help text, validation display, and character counter.

**Location:** `design-system/forms/text-input/text-input.component.ts`

**Selector:** `<app-text-input>`

#### Common Form Control Inputs (All Form Controls)

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `label` | `string` | `''` | Field label text |
| `placeholder` | `string` | `''` | Placeholder text |
| `helpText` | `string` | `''` | Help text below field |
| `required` | `boolean` | `false` | Shows required indicator |
| `disabled` | `boolean` | `false` | Disables the control |
| `maxLength` | `number \| undefined` | `undefined` | Enables character counter |

#### Usage Example

```html
<app-text-input
  formControlName="name"
  label="Opportunity Name"
  placeholder="Enter the land opportunity name"
  helpText="Use a descriptive name including location"
  [required]="true"
  [maxLength]="100">
</app-text-input>
```

#### Accessibility Notes (All Form Controls)

- Unique ID generated; `<label for="...">` references the control
- `aria-describedby` references help text and error message elements
- `aria-invalid="true"` set when validation errors exist
- `aria-disabled="true"` when disabled
- Required indicator (asterisk) is `aria-hidden` with `aria-required="true"` on control
- Errors display only after field is touched
- Character counter format: `{current}/{max}`

### Additional Form Controls

The following controls share the same input/output pattern as `app-text-input`:

| Component | Selector | Additional Notes |
|-----------|----------|------------------|
| Textarea | `<app-textarea>` | Multi-line, supports rows input |
| Number Input | `<app-number-input>` | Numeric only, min/max support |
| Email Input | `<app-email-input>` | Built-in email validation |
| Password Input | `<app-password-input>` | Toggle visibility button |
| Phone Input | `<app-phone-input>` | Phone format validation |
| Select | `<app-select>` | Dropdown with options input |
| Multi-Select | `<app-multi-select>` | Multiple selection, chips display |
| Toggle | `<app-toggle>` | Boolean switch control |
| Checkbox Group | `<app-checkbox-group>` | Multiple checkboxes from options |
| Radio Group | `<app-radio-group>` | Single selection from options |

---

## 5. Currency System

### app-currency

**Purpose:** Displays and edits monetary values with GBP default, configurable symbol, thousand separators, decimal precision, and negative formatting.

**Location:** `design-system/currency/currency-display/currency-display.component.ts`

**Selector:** `<app-currency>`

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | `number \| null` | `null` | Numeric value |
| `currencyCode` | `string` | `'GBP'` | Currency code |
| `symbol` | `string` | `'£'` | Currency symbol |
| `decimalPrecision` | `number` | `2` | Decimal places (0–4) |
| `negativeFormat` | `'minus' \| 'parentheses'` | `'minus'` | Negative display format |
| `mode` | `'display' \| 'edit' \| 'readonly'` | `'display'` | Component mode |

#### Outputs

| Output | Payload | Description |
|--------|---------|-------------|
| `valueChange` | `number \| null` | Emitted on blur in edit mode |

#### Usage Example

```html
<!-- Display mode -->
<app-currency [value]="1250000" mode="display"></app-currency>
<!-- Renders: £1,250,000.00 -->

<!-- Edit mode with Reactive Forms -->
<app-currency
  formControlName="purchasePrice"
  mode="edit"
  [decimalPrecision]="0"
  symbol="£">
</app-currency>
```

#### Accessibility Notes

- Edit mode input has `aria-label` including currency symbol
- Implements `ControlValueAccessor` for Reactive Forms
- Character filtering accepts only digits, single decimal, single leading minus
- Emits null for empty/non-numeric input

---

## 6. Date System

### app-date

**Purpose:** Displays formatted dates with locale support and relative date display (e.g., "2 days ago") for dates within 30 days.

**Location:** `design-system/dates/date-display/date-display.component.ts`

**Selector:** `<app-date>`

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | `string \| Date \| null` | `null` | Date value (ISO 8601 or Date) |
| `locale` | `string` | `'en-GB'` | Display locale (DD/MM/YYYY) |
| `relative` | `boolean` | `false` | Show relative date if within 30 days |

### app-date-picker

**Purpose:** Single date input with calendar popup, min/max constraints, keyboard navigation, and ISO 8601 emission.

**Location:** `design-system/dates/date-picker/date-picker.component.ts`

**Selector:** `<app-date-picker>`

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `minDate` | `string \| null` | `null` | Minimum allowed date (ISO) |
| `maxDate` | `string \| null` | `null` | Maximum allowed date (ISO) |
| `locale` | `string` | `'en-GB'` | Display format locale |
| `readonly` | `boolean` | `false` | Readonly mode |

### app-date-range

**Purpose:** Start/end date range input with validation (end >= start) and ISO 8601 emission.

**Location:** `design-system/dates/date-range/date-range.component.ts`

**Selector:** `<app-date-range>`

#### Usage Example

```html
<app-date-picker
  formControlName="completionDate"
  [minDate]="'2024-01-01'"
  [maxDate]="'2030-12-31'"
  locale="en-GB">
</app-date-picker>

<app-date-range
  formControlName="reportPeriod"
  [minDate]="projectStartDate">
</app-date-range>
```

#### Accessibility Notes

- Calendar popup: arrow keys navigate days, Enter selects, Escape closes
- `aria-label` on date input describes expected format
- Invalid dates show inline validation error with expected format hint
- Implements `ControlValueAccessor` for Reactive Forms
- Emits ISO 8601 format (YYYY-MM-DD) regardless of display locale

---

## 7. Upload System

### app-file-upload

**Purpose:** File upload component with click-to-browse and drag-and-drop, single/multiple mode, preview thumbnails, progress bars, validation, and retry on failure.

**Location:** `design-system/uploads/file-upload/file-upload.component.ts`

**Selector:** `<app-file-upload>`

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `multiple` | `boolean` | `false` | Allow multiple files |
| `maxFiles` | `number` | `10` | Max files in multiple mode |
| `accept` | `string` | `''` | Allowed extensions (e.g., '.pdf,.docx') |
| `maxSize` | `number` | `25` | Max file size in MB |

#### Outputs

| Output | Payload | Description |
|--------|---------|-------------|
| `filesSelected` | `File[]` | Files selected by user |
| `fileRemoved` | `File` | File removed from list |
| `uploadProgress` | `{ file: File; progress: number }` | Upload progress per file |
| `uploadComplete` | `{ file: File; response: unknown }` | Upload succeeded |
| `uploadError` | `{ file: File; error: string }` | Upload failed |
| `retryUpload` | `File` | Retry requested for file |

#### Usage Example

```html
<app-file-upload
  [multiple]="true"
  [maxFiles]="5"
  accept=".pdf,.docx,.xlsx"
  [maxSize]="10"
  (filesSelected)="onFilesSelected($event)"
  (uploadComplete)="onUploadComplete($event)"
  (uploadError)="onUploadError($event)"
  (retryUpload)="onRetry($event)">
</app-file-upload>
```

#### Accessibility Notes

- Drop zone has `role="button"` and `aria-label` describing the action
- File list items are announced to screen readers
- Progress bars have `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Error messages associated with specific files via `aria-describedby`
- Keyboard: Enter/Space activates file browser

---

## 8. Badge System

### app-status-badge, app-priority-badge, app-stage-badge, app-risk-badge

**Purpose:** A family of badge components that render status, priority, stage, and risk values as colour-coded badges with icons and accessible labels.

**Location:** `design-system/badges/{status-badge,priority-badge,stage-badge,risk-badge}/`

**Selectors:** `<app-status-badge>`, `<app-priority-badge>`, `<app-stage-badge>`, `<app-risk-badge>`

#### Inputs (All Badge Components)

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | `string` | `''` | Badge value to render |
| `badgeMap` | `Record<string, IBadgeMapEntry>` | Component default | Maps values to label/class/icon |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |

#### Usage Example

```html
<app-status-badge [value]="opportunity.status"></app-status-badge>

<app-priority-badge
  [value]="task.priority"
  [badgeMap]="customPriorityMap"
  size="sm">
</app-priority-badge>

<app-risk-badge [value]="'High'" size="lg"></app-risk-badge>
```

#### Accessibility Notes

- `role="status"` on each badge element
- `aria-label` contains category + display label (e.g., "Status: Under Review")
- Icons have `aria-hidden="true"` (decorative)
- Unknown values render with `badge-ghost` styling
- Null/empty values render nothing

---

## 9. Confirmation System

### app-confirm-dialog + ConfirmDialogService

**Purpose:** Replaces browser `confirm()`/`alert()` with styled, accessible confirmation dialogs. Service returns `Observable<boolean>` for the user's decision.

**Location:** `design-system/dialogs/confirm-dialog/confirm-dialog.component.ts`
**Service:** `design-system/services/confirm-dialog.service.ts`

#### Service API

```typescript
confirmDialogService.confirm({
  title: 'Delete Opportunity',
  message: 'This action cannot be undone.',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  severity: 'danger'  // 'info' | 'warning' | 'danger'
}): Observable<boolean>
```

#### Resolution Mapping

| User Action | Result |
|-------------|--------|
| Confirm button click | `true` |
| Cancel button click | `false` |
| Backdrop click | `false` |
| Escape key | `false` |

#### Accessibility Notes

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- Focus trap: Tab cycles between confirm and cancel buttons
- Enter activates focused button, Escape cancels
- Severity styling: info (blue), warning (amber), danger (red confirm button)

---

## 10. Loading System

### app-loading-spinner

**Purpose:** Inline loading spinner with configurable size.

**Location:** `design-system/loading/loading-spinner/`

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 16px, 24px, or 40px |
| `ariaLabel` | `string` | `'Loading'` | Accessible label |

### app-loading-overlay

**Purpose:** Full-area semi-transparent overlay that blocks interaction while loading.

**Location:** `design-system/loading/loading-overlay/`

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `loading` | `boolean` | `false` | Controls overlay visibility |
| `ariaLabel` | `string` | `'Loading'` | Accessible label |

### app-loading-button

**Purpose:** Button with integrated spinner state that disables and shows loading text.

**Location:** `design-system/loading/loading-button/`

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `loading` | `boolean` | `false` | Loading state |
| `loadingText` | `string` | `'Loading...'` | Text during loading (max 30 chars) |
| `disabled` | `boolean` | `false` | Disabled state |

### app-skeleton-card, app-skeleton-table, app-skeleton-form

**Purpose:** Skeleton loading placeholders with shimmer animation for cards, tables, and forms.

| Component | Key Inputs | Description |
|-----------|-----------|-------------|
| `app-skeleton-card` | `count: number` | Number of skeleton cards |
| `app-skeleton-table` | `rows: number`, `columns: number` | Placeholder row/column grid |
| `app-skeleton-form` | `fields: number` | Number of placeholder fields |

#### Usage Example

```html
<app-loading-button
  [loading]="isSaving"
  loadingText="Saving..."
  (click)="onSave()">
  Save Opportunity
</app-loading-button>

<app-skeleton-table
  *ngIf="isLoading"
  [rows]="10"
  [columns]="5">
</app-skeleton-table>
```

#### Accessibility Notes (All Loading Components)

- `aria-busy="true"` on container while loading
- `aria-label` describes the operation (defaults to "Loading")
- Shimmer animation: 1–2s cycle, respects `prefers-reduced-motion`
- Loading overlay intercepts all pointer and keyboard events
- Loading indicators removed within single change detection cycle on transition

---

## 11. Empty State

### app-empty-state

**Purpose:** Displays informative content when no data is available, with icon, title, subtitle, and action buttons.

**Location:** `design-system/empty-states/empty-state/empty-state.component.ts`

**Selector:** `<app-empty-state>`

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `string` | (required) | Main message (max 100 chars) |
| `subtitle` | `string` | `''` | Secondary guidance (max 200 chars) |
| `icon` | `string` | `''` | Material Symbols icon name |
| `primaryActionText` | `string` | `''` | Primary button label |
| `secondaryActionText` | `string` | `''` | Secondary button label |

#### Outputs

| Output | Payload | Description |
|--------|---------|-------------|
| `primaryAction` | `void` | Primary button clicked |
| `secondaryAction` | `void` | Secondary button clicked |

#### Usage Example

```html
<app-empty-state
  title="No Opportunities Found"
  subtitle="Create your first land opportunity to begin evaluating development sites."
  icon="landscape"
  primaryActionText="Create Opportunity"
  secondaryActionText="Import from CSV"
  (primaryAction)="onCreate()"
  (secondaryAction)="onImport()">
</app-empty-state>
```

#### Accessibility Notes

- Content centred vertically and horizontally
- Icon at 48px, 40% opacity (decorative, `aria-hidden="true"`)
- Primary button: primary styling; Secondary button: ghost styling
- No reserved space for missing subtitle/actions

---

## 12. Preferences UI

### Preferences Page

**Purpose:** User profile page for configuring theme, font scale, display density, notifications, and date format with live preview.

**Location:** `design-system/preferences/preferences-page/`

**Route:** `/preferences` (accessible from profile dropdown)

### Preview Lab

**Purpose:** Component playground displaying all design system components with local theme/scale selectors for testing configurations without affecting persisted preferences.

**Location:** `design-system/preferences/preview-lab/`

**Route:** `/preferences/playground` (also a tab within Preferences Page)

#### Key Features

- Category sections: typography, buttons, cards, tables, forms, modals, badges, status indicators, charts, timelines, filters, loading states, empty states
- Display mode selector (Small, Regular, Large)
- Theme selector (Light, Dark, custom themes)
- In-page navigation for category jumping
- Per-component error indicator on render failure
- Initialises to user's persisted preferences
