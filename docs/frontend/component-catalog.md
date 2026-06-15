# BuildEstate Pro — Enterprise Shared Component Catalog

## Purpose

This is the authoritative reference document for all reusable components available in the BuildEstate Pro shared UI component library. Before creating any new component, search this catalog first.

**Library Location:** `client-app/src/app/shared/`

**Last Updated:** July 2025

---

## Table of Contents

1. [Currently Implemented Shared Components](#1-currently-implemented-shared-components)
2. [Shared Services](#2-shared-services)
3. [Guards](#3-guards)
4. [Interceptors](#4-interceptors)
5. [Identified Consolidation Targets](#5-identified-consolidation-targets-priority-order)
6. [Component Design Standards](#6-component-design-standards)
7. [Usage Rules](#7-usage-rules)
8. [Future Roadmap](#8-future-roadmap-not-yet-built)

---

## 1. Currently Implemented Shared Components

### DataGridComponent

| Property | Value |
|----------|-------|
| **Location** | `shared/components/data-grid/data-grid.component.ts` |
| **Selector** | `<app-data-grid>` |
| **Purpose** | Full-featured enterprise data table with search, sort, filter, and pagination |

#### Inputs

| Input | Type | Description |
|-------|------|-------------|
| `data` | `T[]` | Array of row data to display |
| `columns` | `IGridColumn[]` | Column definitions (header, field, type, sortable, width) |
| `loading` | `boolean` | Shows skeleton loading state when true |
| `totalCount` | `number` | Total record count for pagination |
| `pageSize` | `number` | Number of rows per page |
| `currentPage` | `number` | Current active page |
| `searchPlaceholder` | `string` | Placeholder text for the search input |
| `filterOptions` | `IFilterOption[]` | Dropdown filter options |
| `filterLabel` | `string` | Label for the filter dropdown |
| `emptyIcon` | `string` | Material Symbol icon name for empty state |
| `emptyMessage` | `string` | Primary message when no data exists |
| `emptySubtext` | `string` | Secondary message for empty state |
| `showActions` | `boolean` | Whether to show edit/delete action buttons per row |
| `title` | `string` | Table title displayed in the header |

#### Outputs

| Output | Event Payload | Description |
|--------|---------------|-------------|
| `rowClick` | `T` | Emitted when a row is clicked |
| `editClick` | `T` | Emitted when the edit action is clicked |
| `deleteClick` | `T` | Emitted when the delete action is clicked |
| `pageChange` | `number` | Emitted when the page changes |
| `searchChange` | `string` | Emitted when the search input changes |
| `filterChange` | `string` | Emitted when the filter selection changes |
| `sortChange` | `ISortEvent` | Emitted when a column sort is triggered |
| `pageSizeChange` | `number` | Emitted when rows-per-page selection changes |

#### Features

- Full-text search with debounce
- Column sorting (asc/desc)
- Dropdown filtering
- Pagination with page size selection
- Badge, currency, and date column renderers
- Loading skeleton animation
- Empty state with icon, message, and subtext
- Row hover animations
- Edit and delete action buttons per row

#### Usage Example

```html
<app-data-grid
  [data]="opportunities"
  [columns]="gridColumns"
  [loading]="isLoading"
  [totalCount]="totalRecords"
  [pageSize]="10"
  [currentPage]="1"
  searchPlaceholder="Search opportunities..."
  [filterOptions]="statusFilters"
  filterLabel="Status"
  emptyIcon="landscape"
  emptyMessage="No opportunities found"
  emptySubtext="Create your first land opportunity to get started."
  [showActions]="true"
  title="Land Opportunities"
  (rowClick)="onRowClick($event)"
  (editClick)="onEdit($event)"
  (deleteClick)="onDelete($event)"
  (pageChange)="onPageChange($event)"
  (searchChange)="onSearch($event)"
  (filterChange)="onFilter($event)"
  (sortChange)="onSort($event)"
  (pageSizeChange)="onPageSizeChange($event)">
</app-data-grid>
```

#### Used In

- Opportunities list (Land Acquisition)
- Planning applications list (Planning & Approvals)

---

### CurrencyInputComponent

| Property | Value |
|----------|-------|
| **Location** | `shared/components/currency-input/currency-input.component.ts` |
| **Selector** | `<app-currency-input>` |
| **Purpose** | £-prefixed currency input with comma formatting and ControlValueAccessor support |

#### Inputs

| Input | Type | Description |
|-------|------|-------------|
| `placeholder` | `string` | Placeholder text for the input |
| `ariaLabel` | `string` | Accessibility label for screen readers |

#### Form Integration

Implements `ControlValueAccessor` — works with both `ngModel` and Reactive Forms.

#### Features

- £ prefix displayed via addon/join pattern
- Comma-separated thousand formatting on blur (e.g., `1,250,000`)
- Raw numeric value on focus for easy editing
- Stores raw number value internally
- Full reactive forms and ngModel support

#### Usage Example

```html
<!-- Reactive Forms -->
<app-currency-input
  formControlName="purchasePrice"
  placeholder="Enter purchase price"
  ariaLabel="Purchase price in GBP">
</app-currency-input>

<!-- ngModel -->
<app-currency-input
  [(ngModel)]="offerAmount"
  placeholder="Enter offer amount"
  ariaLabel="Offer amount">
</app-currency-input>
```

#### Used In

- Feasibility form (Land Acquisition)
- Offer form (Land Acquisition)
- Approval request form (Land Acquisition)

---

### ToastContainerComponent

| Property | Value |
|----------|-------|
| **Location** | `shared/components/toast-container/toast-container.component.ts` |
| **Selector** | `<app-toast-container>` |
| **Purpose** | Renders stacked toast notifications driven by ToastService |

#### Features

- Slide-in-right animation on appearance
- Auto-dismiss after configurable duration
- Manual close button
- Type-specific icons and colour variants (success, error, warning, info)
- Stacked layout for multiple simultaneous toasts
- Positioned in top-right corner

#### Usage

Placed once in `AppComponent` (global). No direct interaction required — toasts are triggered via `ToastService`.

```html
<!-- app.component.html (already included globally) -->
<app-toast-container></app-toast-container>
```

---

## 2. Shared Services

### ToastService

| Property | Value |
|----------|-------|
| **Location** | `core/services/toast.service.ts` |
| **Scope** | `providedIn: 'root'` (singleton) |
| **Purpose** | Manages toast notification state and provides convenience methods |

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `showSuccess` | `(message: string, duration?: number) => void` | Green success toast |
| `showError` | `(message: string, duration?: number) => void` | Red error toast |
| `showWarning` | `(message: string, duration?: number) => void` | Amber warning toast |
| `showInfo` | `(message: string, duration?: number) => void` | Blue info toast |

#### Pattern

Uses `BehaviorSubject<IToast[]>` internally. The `ToastContainerComponent` subscribes to the observable and renders active toasts.

#### Usage Example

```typescript
constructor(private toastService: ToastService) {}

onSaveSuccess(): void {
  this.toastService.showSuccess('Opportunity saved successfully.');
}

onSaveError(): void {
  this.toastService.showError('Failed to save opportunity. Please try again.');
}
```

---

### ConfirmDialogService

| Property | Value |
|----------|-------|
| **Location** | `shared/services/confirm-dialog.service.ts` |
| **Scope** | `providedIn: 'root'` (singleton) |
| **Purpose** | DaisyUI modal-based confirmation for destructive actions and route guards |

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `confirm` | `(options: IConfirmDialogOptions) => Promise<boolean>` | Shows confirmation dialog, resolves with user decision |

#### Options Interface

```typescript
interface IConfirmDialogOptions {
  title: string;          // Dialog heading
  message: string;        // Body text explaining the action
  confirmText: string;    // Confirm button label (e.g., "Delete", "Discard")
  cancelText: string;     // Cancel button label (e.g., "Cancel", "Go Back")
  confirmClass: string;   // DaisyUI button class (e.g., "btn-error", "btn-warning")
  icon: string;           // Material Symbol icon name
  iconClass: string;      // Tailwind classes for icon styling
}
```

#### Usage Example

```typescript
async onDelete(opportunity: IOpportunity): Promise<void> {
  const confirmed = await this.confirmDialogService.confirm({
    title: 'Delete Opportunity',
    message: 'Are you sure you want to delete this opportunity? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmClass: 'btn-error',
    icon: 'delete',
    iconClass: 'text-error'
  });

  if (confirmed) {
    this.store.dispatch(deleteOpportunity({ id: opportunity.id }));
  }
}
```

---

## 3. Guards

### UnsavedChangesGuard

| Property | Value |
|----------|-------|
| **Location** | `shared/guards/unsaved-changes.guard.ts` |
| **Pattern** | `CanDeactivateFn<HasUnsavedChanges>` |
| **Dependency** | `ConfirmDialogService` |
| **Status** | ⚠️ **SHOULD consolidate** — currently 3 copies exist across modules |

#### Purpose

Prevents navigation away from forms with unsaved changes. Prompts the user via `ConfirmDialogService` before allowing route deactivation.

#### Interface Contract

```typescript
interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}
```

#### Usage Example

```typescript
// In route configuration
{
  path: 'edit/:id',
  component: OpportunityEditComponent,
  canDeactivate: [unsavedChangesGuard]
}

// In component
export class OpportunityEditComponent implements HasUnsavedChanges {
  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }
}
```

---

## 4. Interceptors

### ResponseWrapperInterceptor

| Property | Value |
|----------|-------|
| **Location** | `core/interceptors/response-wrapper.interceptor.ts` |
| **Purpose** | Normalizes raw API responses into a consistent `IApiResponse` envelope |

#### Behavior

Wraps backend responses into a standard structure:

```typescript
interface IApiResponse<T> {
  data: T;
  success: boolean;
  errors: string[];
  pagination?: IPagination;
}
```

---

### HttpErrorInterceptor

| Property | Value |
|----------|-------|
| **Location** | `core/interceptors/http-error.interceptor.ts` |
| **Purpose** | Centralized HTTP error handling with NgRx dispatch and toast notifications |

#### Behavior

- Catches HTTP error responses
- Dispatches appropriate NgRx error actions
- Triggers toast notifications for user-facing errors
- Handles 401 (redirect to login), 403 (access denied), 404, 500 responses
- Logs errors with correlation IDs

---

## 5. Identified Consolidation Targets (Priority Order)

Components that currently exist as duplicates across feature modules and should be extracted into the shared library.

| # | Component | Copies | Source Modules | Recommended Shared Location | Priority |
|---|-----------|--------|----------------|------------------------------|----------|
| 1 | KPI Card | 3 | Land, Legal, Planning | `shared/components/kpi-card/` | High |
| 2 | Status Badge | 2 | Land, Legal | `shared/components/status-badge/` | High |
| 3 | Timeline (Activity/Audit) | 3 | Land, Legal, Planning | `shared/components/timeline/` | High |
| 4 | Lifecycle Stepper | 2 | Land, Planning | `shared/components/lifecycle-stepper/` | Medium |
| 5 | Pipeline Column | 2 | Land, Planning | `shared/components/pipeline-column/` | Medium |
| 6 | Document Upload | 2 | Land, Legal | `shared/components/document-upload/` | Medium |
| 7 | Status Transition Dialog | 1 | Legal (universal pattern) | `shared/components/status-transition-dialog/` | Medium |
| 8 | Approval Panel | 1 | Land (universal pattern) | `shared/components/approval-panel/` | Medium |
| 9 | Unsaved Changes Guard | 3 | All modules | `shared/guards/unsaved-changes.guard.ts` | High |
| 10 | Role Guard | 3 | All modules | `core/guards/role.guard.ts` | High |

### Consolidation Rules

- Items 1–3 and 9–10 are **high priority** — consolidate before building the next module
- Items 4–8 are **medium priority** — consolidate during the next refactoring sprint
- After consolidation, remove the original copies from feature modules
- Update all imports to reference the shared location
- Add barrel exports to `shared/components/index.ts`

---

## 6. Component Design Standards

All shared components **MUST** adhere to the following standards:

### Architecture Requirements

| Requirement | Standard |
|-------------|----------|
| Standalone | `standalone: true` |
| Change Detection | `ChangeDetectionStrategy.OnPush` |
| Data Flow (In) | Accept data via `@Input()` — no direct service injection for data |
| Data Flow (Out) | Emit events via `@Output()` — no direct parent coupling |
| Accessibility | ARIA labels, roles, keyboard navigation |
| Styling | DaisyUI + Tailwind CSS |
| Icons | Material Symbols Outlined |
| Documentation | Entry in this catalog BEFORE implementation |
| Code Docs | JSDoc with `@example` usage on all public APIs |

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Component files | kebab-case | `kpi-card.component.ts` |
| Selectors | `app-{component-name}` | `<app-kpi-card>` |
| Interfaces | Prefix with `I` | `IGridColumn`, `IFilterOption` |
| Enums | PascalCase | `ColumnType`, `ToastSeverity` |
| Barrel exports | Central index | `shared/components/index.ts` |
| Services | PascalCase with Service suffix | `ToastService` |
| Guards | camelCase function name | `unsavedChangesGuard` |

### Component Template

```typescript
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Brief description of the component purpose.
 *
 * @example
 * <app-component-name
 *   [input1]="value"
 *   (output1)="handler($event)">
 * </app-component-name>
 */
@Component({
  selector: 'app-component-name',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './component-name.component.html'
})
export class ComponentNameComponent {
  @Input() input1: string = '';
  @Output() output1 = new EventEmitter<string>();
}
```

---

## 7. Usage Rules

### Before Creating a New Component

1. **Search this catalog** — does a similar component already exist?
2. **If yes** — extend the existing component, do not duplicate
3. **If no** — design as a reusable component first, then implement

### New Shared Component Checklist

- [ ] Catalog entry added to this document BEFORE implementation
- [ ] Component is standalone with `OnPush` change detection
- [ ] Barrel export added to `shared/components/index.ts`
- [ ] At least 2 modules must benefit (or future compatibility confirmed)
- [ ] JSDoc with `@example` on all public inputs/outputs
- [ ] Accessibility reviewed (ARIA, keyboard, contrast)
- [ ] DaisyUI + Tailwind styling (no custom CSS unless unavoidable)

### When Components Stay in Feature Modules

Feature-specific components remain in their module **UNLESS:**

- They are used by 2+ modules
- They represent a universal business pattern (approvals, timelines, status badges, KPIs)
- They follow a cross-cutting UI pattern that will inevitably be needed elsewhere

### Pull Request Requirements

Every PR must answer:

1. Which reusable components were used?
2. Why couldn't an existing component be reused?
3. Does the new component belong in the shared library?

---

## 8. Future Roadmap (Not Yet Built)

Components identified for future implementation as their respective modules are built:

| Component | Purpose | Target Module |
|-----------|---------|---------------|
| **Percentage Input** | Like CurrencyInput but with `%` suffix | Finance, Feasibility |
| **Date Range Picker** | Start/end date selection for report filters | Reports, Planning |
| **Multi-Select Dropdown** | Multi-selection with chips display | All modules (filtering) |
| **Drag & Drop Upload** | Enhanced file upload with drag area | Documents, Legal |
| **Chart Components** | Bar, Line, Pie chart wrappers | Reports & Dashboards |
| **Advanced Search Panel** | Multi-criteria search with saved filters | All list views |
| **Card Grid Layout** | Alternative to table for visual browsing | Property Units, Sales |
| **Split View Layout** | Master/detail pattern | Documents, Legal Cases |
| **Page Header** | Standardized header with breadcrumbs, title, actions | All pages |

### Implementation Priority

Build these components when:

1. The consuming module is actively being developed
2. At least 2 modules will immediately benefit
3. The pattern has been validated in at least one feature module first

---

## Document History

| Date | Change | Author |
|------|--------|--------|
| July 2025 | Initial catalog created | Architecture Team |
