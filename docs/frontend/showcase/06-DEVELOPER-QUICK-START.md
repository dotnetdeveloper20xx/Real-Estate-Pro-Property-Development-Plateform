# BuildEstate Pro Design System — Developer Quick Start

## Getting Started in 60 Seconds

The design system is importable from a single barrel export. No setup, no configuration, no additional dependencies.

```typescript
import {
  ModalComponent,
  DataTableComponent,
  FilterBarComponent,
  TextInputComponent,
  SelectComponent,
  CurrencyDisplayComponent,
  StatusBadgeComponent,
  EmptyStateComponent,
  LoadingOverlayComponent,
  ConfirmDialogService,
} from '../../shared/design-system';
```

Add components to your standalone component's `imports` array, and you're ready.

---

## The Barrel Export Pattern

All design system components, services, and types are exported from:

```
client-app/src/app/shared/design-system/index.ts
```

**Rule:** If it's not in `index.ts`, it's not public API. Don't import from internal paths.

```typescript
// ✅ Correct — import from barrel
import { ModalComponent, DataTableComponent } from '../../shared/design-system';

// ❌ Wrong — importing from internal path
import { ModalComponent } from '../../shared/design-system/modals/modal/modal.component';
```

---

## Creating a New Page Using Design System Components

Here's a real example: building a Land Opportunities list page from design system components.

### Step 1: Define the Component

```typescript
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  DataTableComponent,
  FilterBarComponent,
  EmptyStateComponent,
  LoadingOverlayComponent,
  StatusBadgeComponent,
  IColumnDefinition,
  IFilterDefinition,
} from '../../shared/design-system';

@Component({
  selector: 'app-opportunity-list',
  standalone: true,
  imports: [
    DataTableComponent,
    FilterBarComponent,
    EmptyStateComponent,
    LoadingOverlayComponent,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Filter bar -->
    <app-filter-bar
      [filters]="filterDefs"
      (filterChange)="onFilterChange($event)"
      (filterReset)="onReset()">
    </app-filter-bar>

    <!-- Loading overlay -->
    <app-loading-overlay [visible]="loading()" message="Loading opportunities...">
    </app-loading-overlay>

    <!-- Data table (hidden when empty) -->
    @if (opportunities().length > 0) {
      <app-data-table
        [data]="opportunities()"
        [columns]="columns"
        [totalItems]="totalCount()"
        [pageSize]="25"
        [currentPage]="currentPage()"
        [loading]="loading()"
        [searchable]="true"
        [exportable]="true"
        (pageChange)="onPageChange($event)"
        (sortChange)="onSortChange($event)"
        (actionClick)="onAction($event)">
      </app-data-table>
    }

    <!-- Empty state (shown when no data) -->
    @if (!loading() && opportunities().length === 0) {
      <app-empty-state
        icon="search_off"
        title="No Opportunities Found"
        subtitle="Adjust your filters or create a new opportunity."
        [actions]="[{ label: 'Create Opportunity', primary: true, action: 'create' }]"
        (actionClick)="onCreate()">
      </app-empty-state>
    }
  `,
})
export class OpportunityListComponent {
  private store = inject(Store);

  // Selectors (from NgRx)
  opportunities = this.store.selectSignal(selectOpportunities);
  totalCount = this.store.selectSignal(selectTotalCount);
  loading = this.store.selectSignal(selectLoading);
  currentPage = this.store.selectSignal(selectCurrentPage);

  // Column definitions
  columns: IColumnDefinition[] = [
    { key: 'name', label: 'Opportunity', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'askingPrice', label: 'Price', type: 'currency' },
    { key: 'createdAt', label: 'Created', type: 'date', sortable: true },
    { key: 'actions', label: '', type: 'actions', actions: ['View', 'Edit'] },
  ];

  // Filter definitions
  filterDefs: IFilterDefinition[] = [
    { key: 'search', type: 'text', label: 'Search', placeholder: 'Search...' },
    { key: 'status', type: 'dropdown', label: 'Status', options: [...] },
    { key: 'dateRange', type: 'date-range', label: 'Created' },
  ];

  onPageChange(event: IPageChangeEvent): void { /* dispatch action */ }
  onSortChange(event: ISortChangeEvent): void { /* dispatch action */ }
  onFilterChange(filters: Record<string, unknown>): void { /* dispatch action */ }
  onReset(): void { /* dispatch reset */ }
  onAction(event: IActionClickEvent): void { /* navigate */ }
  onCreate(): void { /* navigate to create */ }
}
```

**Time to build this page:** ~30 minutes. All table behaviour, filtering, loading states, empty states, and accessibility come free from the design system.

---

## Adding a New Component to the Library

### Step 1: Verify It Doesn't Already Exist

```bash
# Search the catalog
grep -i "your-component" docs/frontend/component-catalog.md

# Search the directory
ls client-app/src/app/shared/design-system/ | grep -i "your-category"

# Check barrel export
grep -i "YourComponent" client-app/src/app/shared/design-system/index.ts
```

### Step 2: Choose the Right Location

```
shared/design-system/
├── {category}/           ← Pick or create a category folder
│   └── {component}/      ← Your component folder
│       ├── {component}.component.ts
│       └── {component}.property.spec.ts (if applicable)
```

### Step 3: Implement with Required Standards

```typescript
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Brief description of what this component does.
 *
 * @example
 * <app-your-component [data]="items" (selected)="onSelect($event)" />
 */
@Component({
  selector: 'app-your-component',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Use DaisyUI classes, no hardcoded colours -->
    <div class="card bg-base-100 shadow-sm" role="region" [attr.aria-label]="ariaLabel">
      <!-- Your template -->
    </div>
  `,
})
export class YourComponent {
  /** Description of input */
  @Input() data: YourDataType[] = [];

  /** ARIA label for accessibility */
  @Input() ariaLabel = 'Your component';

  /** Emitted when user selects an item */
  @Output() selected = new EventEmitter<YourDataType>();
}
```

### Step 4: Add to Barrel Export

```typescript
// In design-system/index.ts, add:
export { YourComponent } from './your-category/your-component/your-component.component.ts';
export type { YourDataType } from './your-category/your-component/your-component.component.ts';
```

### Step 5: Add to Catalog

Add a row to `docs/frontend/component-catalog.md`:

```markdown
| YourComponent | `<app-your-component>` | Brief purpose | `your-category/your-component/` |
```

### Step 6: Add Full Documentation

Add a section to `docs/frontend/component-library.md` with:
- Purpose
- All `@Input()` properties with types and defaults
- All `@Output()` events with payload types
- Usage example
- Accessibility notes

### Step 7: Write Tests

- Unit tests for core behaviour
- Property-based tests for universal invariants (if the component accepts arbitrary input)

---

## Common Patterns and Recipes

### Pattern: Form Page with Validation

```typescript
import {
  TextInputComponent,
  SelectComponent,
  NumberInputComponent,
  CurrencyDisplayComponent,
  TextareaComponent,
  LoadingButtonComponent,
} from '../../shared/design-system';

@Component({
  imports: [
    ReactiveFormsModule,
    TextInputComponent,
    SelectComponent,
    NumberInputComponent,
    CurrencyDisplayComponent,
    TextareaComponent,
    LoadingButtonComponent,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <app-text-input formControlName="name" label="Site Name" [maxLength]="100" />
      <app-select formControlName="region" label="Region" [options]="regions" />
      <app-number-input formControlName="size" label="Size (acres)" [min]="0" />
      <app-currency formControlName="price" mode="edit" label="Asking Price" />
      <app-textarea formControlName="notes" label="Notes" [rows]="4" />

      <app-loading-button
        [loading]="saving()"
        label="Create Opportunity"
        loadingLabel="Creating..."
        [disabled]="form.invalid">
      </app-loading-button>
    </form>
  `,
})
```

### Pattern: Detail Page with Tabs and Status

```typescript
import {
  StatusBadgeComponent,
  TimelineComponent,
  LifecycleStepperComponent,
  KpiCardComponent,
  ModalComponent,
  ConfirmDialogService,
} from '../../shared/design-system';
```

### Pattern: Dashboard with KPI Cards

```typescript
import {
  KpiCardComponent,
  DataTableComponent,
  StatusBadgeComponent,
  LoadingOverlayComponent,
} from '../../shared/design-system';

// Template
`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <app-kpi-card title="Active" [value]="12" icon="folder_open" />
  <app-kpi-card title="Under Review" [value]="5" icon="pending" />
  <app-kpi-card title="This Month" [value]="3" [trend]="{ direction: 'up', percentage: 15 }" />
  <app-kpi-card title="Conversion" [value]="'12%'" icon="trending_up" />
</div>`
```

### Pattern: Confirmation Before Destructive Action

```typescript
import { ConfirmDialogService } from '../../shared/design-system';

export class MyComponent {
  private confirm = inject(ConfirmDialogService);

  delete(id: string): void {
    this.confirm.confirm({
      title: 'Delete Record',
      message: 'This cannot be undone.',
      severity: 'danger',
      confirmLabel: 'Delete',
    }).subscribe(confirmed => {
      if (confirmed) { /* dispatch delete action */ }
    });
  }
}
```

### Pattern: Table with Inline Badges

```typescript
const columns: IColumnDefinition[] = [
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'status',
    label: 'Status',
    type: 'badge',
    badgeMap: [
      { value: 'Active', label: 'Active', cssClass: 'badge-success' },
      { value: 'Pending', label: 'Pending', cssClass: 'badge-warning' },
      { value: 'Archived', label: 'Archived', cssClass: 'badge-ghost' },
    ],
  },
  { key: 'risk', label: 'Risk', type: 'badge', badgeMap: riskBadgeMap },
];
```

---

## Where to Find Documentation

| What You Need | Where to Look |
|---------------|---------------|
| Full component list | `docs/frontend/component-catalog.md` |
| Component API details | `docs/frontend/component-library.md` |
| Architecture decisions | `docs/frontend/design-system.md` |
| Governance rules | `docs/frontend/component-governance.md` |
| Showcase & examples | `docs/frontend/showcase/` (this folder) |
| CSS tokens | `shared/design-system/design-system-tokens.css` |
| Barrel export (public API) | `shared/design-system/index.ts` |
| Steering rules | `.kiro/steering/component-library-rules.md` |
| Review checklist | `.kiro/steering/component-review-checklist.md` |

---

## Quick Reference: Available Components

```typescript
// Modals & Dialogs
ModalComponent                    // <app-modal>
ConfirmDialogService              // Programmatic confirmation
StatusTransitionDialogComponent   // Status change dialog

// Data Display
DataTableComponent                // <app-data-table>
FilterBarComponent                // <app-filter-bar>
KpiCardComponent                  // <app-kpi-card>
TimelineComponent                 // <app-timeline>
LifecycleStepperComponent         // <app-lifecycle-stepper>
PipelineColumnComponent           // <app-pipeline-column>

// Form Controls (all implement ControlValueAccessor)
TextInputComponent                // <app-text-input>
TextareaComponent                 // <app-textarea>
NumberInputComponent              // <app-number-input>
EmailInputComponent               // <app-email-input>
PasswordInputComponent            // <app-password-input>
PhoneInputComponent               // <app-phone-input>
SelectComponent                   // <app-select>
MultiSelectComponent              // <app-multi-select>
ToggleComponent                   // <app-toggle>
CheckboxGroupComponent            // <app-checkbox-group>
RadioGroupComponent               // <app-radio-group>
CurrencyDisplayComponent          // <app-currency>
DatePickerComponent               // <app-date-picker>
DateRangeComponent                // <app-date-range>

// Display
DateDisplayComponent              // <app-date>
StatusBadgeComponent              // <app-status-badge>
PriorityBadgeComponent            // <app-priority-badge>
StageBadgeComponent               // <app-stage-badge>
RiskBadgeComponent                // <app-risk-badge>

// Feedback
LoadingSpinnerComponent           // <app-loading-spinner>
LoadingOverlayComponent           // <app-loading-overlay>
LoadingButtonComponent            // <app-loading-button>
SkeletonCardComponent             // <app-skeleton-card>
SkeletonTableComponent            // <app-skeleton-table>
SkeletonFormComponent             // <app-skeleton-form>
EmptyStateComponent               // <app-empty-state>

// Workflow
ApprovalPanelComponent            // <app-approval-panel>
NotificationPanelComponent        // <app-notification-panel>

// Uploads
FileUploadComponent               // <app-file-upload>
DocumentUploadComponent           // <app-document-upload>

// Preferences
PreferencesPageComponent          // User preferences page
PreviewLabComponent               // Component playground

// Services
ThemeEngineService                // Theme application
FontScaleService                  // Font scale application
DisplayPreferenceService          // Preference lifecycle
ConfirmDialogService              // Programmatic dialogs
```

---

*Start building. The design system handles the hard parts.*
