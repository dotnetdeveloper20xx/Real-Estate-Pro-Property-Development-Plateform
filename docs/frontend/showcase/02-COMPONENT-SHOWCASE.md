# BuildEstate Pro Design System — Component Showcase

## Overview

49 components organized into 17 categories. Each component is standalone, OnPush, theme-aware, accessible, and responsive. This document shows each component in action.

---

## Modal System

A configurable modal with 5 size variants, loading states, dirty form detection, and WCAG-compliant focus trap.

```html
<!-- Basic usage -->
<app-modal
  [visible]="showModal"
  title="Create Opportunity"
  size="lg"
  (closed)="onModalClose()">
  <p>Your content here</p>
</app-modal>

<!-- With dirty form protection -->
<app-modal
  [visible]="showEditModal"
  title="Edit Land Details"
  size="xl"
  [form]="editForm"
  [loading]="saving"
  (closed)="onClose()">
  <form [formGroup]="editForm">
    <!-- Form fields -->
  </form>
</app-modal>

<!-- Error display within modal -->
<app-modal
  [visible]="showModal"
  title="Submit Offer"
  size="md"
  [error]="serverError"
  (closed)="dismiss()">
  <!-- Content -->
</app-modal>
```

**Sizes:** `sm` (320px) · `md` (512px) · `lg` (672px) · `xl` (896px) · `fullscreen`

**Key features:**
- Focus trap cycles Tab/Shift+Tab within modal
- Escape key closes (with dirty form warning if changes exist)
- Backdrop click closes (configurable)
- `aria-modal="true"`, `role="dialog"`, `aria-labelledby`
- Reduced motion: instant state change, no scale/fade animation

---

## Data Table

Enterprise data table with server-side sorting, pagination, search, column visibility, saved views, bulk actions, and CSV export.

```html
<app-data-table
  [data]="opportunities"
  [columns]="tableColumns"
  [totalItems]="totalCount"
  [pageSize]="25"
  [currentPage]="currentPage"
  [loading]="isLoading"
  [searchable]="true"
  [exportable]="true"
  [savedViews]="userViews"
  [bulkActions]="['Delete', 'Archive', 'Export']"
  (pageChange)="onPageChange($event)"
  (sortChange)="onSortChange($event)"
  (searchChange)="onSearch($event)"
  (actionClick)="onRowAction($event)"
  (bulkAction)="onBulkAction($event)"
  (exportRequest)="onExport($event)">
</app-data-table>
```

**Column definition:**

```typescript
const tableColumns: IColumnDefinition[] = [
  { key: 'name', label: 'Opportunity', sortable: true },
  { key: 'location', label: 'Location', sortable: true },
  { key: 'status', label: 'Status', type: 'badge', badgeMap: statusBadgeMap },
  { key: 'askingPrice', label: 'Price', type: 'currency' },
  { key: 'createdAt', label: 'Created', type: 'date', sortable: true },
  { key: 'actions', label: '', type: 'actions', actions: ['View', 'Edit', 'Delete'] },
];
```

**Key features:**
- Server-side pagination (emits events, does not slice data)
- Multi-column sorting with `aria-sort` attributes
- Column visibility toggle (users choose which columns to show)
- Saved views (persist filter + sort + column configuration)
- Responsive: horizontal scroll on mobile, priority column hiding on tablet
- Empty state displayed when no data matches
- Skeleton loader during initial load

---

## Filter System

Multi-type filter bar supporting text, dropdown, date-range, status-chip, and tag filters with presets and active filter chips.

```html
<app-filter-bar
  [filters]="filterDefinitions"
  [presets]="savedPresets"
  [showActiveCount]="true"
  (filterChange)="onFilterChange($event)"
  (filterReset)="onReset()">
</app-filter-bar>
```

**Filter definitions:**

```typescript
const filterDefinitions: IFilterDefinition[] = [
  { key: 'search', type: 'text', label: 'Search', placeholder: 'Search opportunities...' },
  { key: 'status', type: 'dropdown', label: 'Status', options: statusOptions },
  { key: 'dateRange', type: 'date-range', label: 'Date Range' },
  { key: 'priority', type: 'status-chip', label: 'Priority', options: priorityChips },
  { key: 'region', type: 'dropdown', label: 'Region', options: regionOptions },
];

const savedPresets: IFilterPreset[] = [
  { name: 'Active This Month', filters: { status: 'Active', dateRange: thisMonth } },
  { name: 'High Priority', filters: { priority: 'High' } },
];
```

**Key features:**
- Active filter count badge
- Filter chips showing current selections (removable)
- Preset buttons for common filter combinations
- Reset all button clears every filter
- Date range validates end ≥ start
- Property-tested: active count always matches non-empty filter values

---

## Form Controls (12 Controls)

All form controls extend `BaseFormControl` which implements `ControlValueAccessor`. They work seamlessly with Angular Reactive Forms.

```html
<!-- Text Input with validation -->
<app-text-input
  formControlName="siteName"
  label="Site Name"
  placeholder="Enter site name"
  helpText="The official name for this land opportunity"
  [maxLength]="100"
  [showCharacterCount]="true">
</app-text-input>

<!-- Email with built-in format validation -->
<app-email-input
  formControlName="contactEmail"
  label="Contact Email"
  helpText="Primary contact email for this opportunity">
</app-email-input>

<!-- Number with min/max -->
<app-number-input
  formControlName="landSize"
  label="Land Size (acres)"
  [min]="0"
  [max]="10000"
  [step]="0.1">
</app-number-input>

<!-- Select dropdown -->
<app-select
  formControlName="status"
  label="Status"
  [options]="statusOptions"
  placeholder="Select status...">
</app-select>

<!-- Multi-select with chips -->
<app-multi-select
  formControlName="tags"
  label="Tags"
  [options]="tagOptions"
  placeholder="Select tags...">
</app-multi-select>

<!-- Toggle switch -->
<app-toggle
  formControlName="isUrgent"
  label="Mark as Urgent">
</app-toggle>

<!-- Password with visibility toggle -->
<app-password-input
  formControlName="password"
  label="Password"
  [showStrengthIndicator]="true">
</app-password-input>

<!-- Phone with format validation -->
<app-phone-input
  formControlName="phone"
  label="Contact Phone">
</app-phone-input>

<!-- Textarea with character counter -->
<app-textarea
  formControlName="notes"
  label="Notes"
  [rows]="4"
  [maxLength]="500"
  [showCharacterCount]="true">
</app-textarea>

<!-- Checkbox group -->
<app-checkbox-group
  formControlName="amenities"
  label="Nearby Amenities"
  [options]="amenityOptions">
</app-checkbox-group>

<!-- Radio group -->
<app-radio-group
  formControlName="tenure"
  label="Tenure Type"
  [options]="tenureOptions">
</app-radio-group>
```

**Common features across all controls:**
- Label with automatic ID binding
- Help text via `aria-describedby`
- Validation error display (shown after touch)
- `aria-invalid` when control has errors
- `aria-required` when required
- Character counter (text inputs)
- Disabled state styling
- OnPush change detection

---

## Currency Component

GBP currency display with three modes: display (read-only formatted), edit (input with live formatting), and readonly (form context, non-editable).

```html
<!-- Display mode (read-only) -->
<app-currency
  [value]="1250000"
  mode="display"
  [decimalPrecision]="0">
</app-currency>
<!-- Renders: £1,250,000 -->

<!-- Edit mode with ControlValueAccessor -->
<app-currency
  formControlName="askingPrice"
  mode="edit"
  [decimalPrecision]="2"
  negativeFormat="parentheses">
</app-currency>
<!-- User types: 1250000.50 → displays: £1,250,000.50 -->
<!-- Negative: (£45,000.00) -->

<!-- Readonly in form context -->
<app-currency
  [value]="calculatedProfit"
  mode="readonly"
  [decimalPrecision]="2">
</app-currency>
```

**Key features:**
- GBP formatting with thousand separators
- Configurable decimal precision (0–4 places)
- Negative format: minus sign or parentheses
- Character filtering (rejects non-numeric input in edit mode)
- Round-trip guarantee: format → parse → same value (Property 15)
- Null-safe: empty input emits `null` (Property 16)

---

## Date System

Three date components covering display, single-date picking, and range selection.

```html
<!-- Date display with locale formatting -->
<app-date [value]="opportunity.createdAt" format="medium"></app-date>
<!-- Renders: 15 Jul 2025 -->

<!-- Relative date (e.g., "3 days ago") -->
<app-date [value]="lastActivity" format="relative"></app-date>
<!-- Renders: 3 days ago -->

<!-- Date picker with min/max constraints -->
<app-date-picker
  formControlName="targetDate"
  label="Target Acquisition Date"
  [minDate]="today"
  [maxDate]="maxDate">
</app-date-picker>

<!-- Date range with validation -->
<app-date-range
  formControlName="reportPeriod"
  label="Reporting Period"
  startLabel="From"
  endLabel="To">
</app-date-range>
```

**Key features:**
- Locale-aware formatting (en-GB default)
- Relative dates: "just now", "2 hours ago", "yesterday" (threshold-based)
- Min/max date constraints (Property 20: dates outside range are rejected)
- ISO 8601 emission (Property 19: always emits valid ISO strings)
- Invalid input handling (Property 21: non-date input never emits)
- Keyboard navigation: Arrow keys navigate days in calendar popup

---

## File Upload

Drag-and-drop file upload with progress tracking, type/size validation, retry on failure, and accessible announcements.

```html
<app-file-upload
  [maxFileSize]="10485760"
  [acceptedTypes]="['.pdf', '.doc', '.docx', '.jpg', '.png']"
  [maxFiles]="5"
  [multiple]="true"
  (filesSelected)="onFilesSelected($event)"
  (uploadComplete)="onUploadComplete($event)"
  (uploadError)="onUploadError($event)">
</app-file-upload>
```

**Key features:**
- Drag-and-drop zone with visual feedback
- File type validation before upload (Property 22)
- File size validation before upload
- Progress bar per file
- Retry button on failed uploads
- Preview thumbnails for images (Property 23)
- `aria-busy="true"` during upload
- Accessible file list with remove buttons

---

## Badge System

Four domain-specific badge types built on a shared abstract base. Every badge resolves its styling from a `badgeMap` — unknown values gracefully fall back to `badge-ghost`.

```html
<!-- Status badge -->
<app-status-badge [value]="opportunity.status"></app-status-badge>
<!-- Renders: green "Active", amber "Pending", blue "Under Review", etc. -->

<!-- Priority badge -->
<app-priority-badge [value]="task.priority"></app-priority-badge>
<!-- Renders: red "Critical", orange "High", blue "Medium", grey "Low" -->

<!-- Stage badge -->
<app-stage-badge [value]="project.stage"></app-stage-badge>
<!-- Renders: domain-specific stage colours -->

<!-- Risk badge -->
<app-risk-badge [value]="assessment.riskLevel"></app-risk-badge>
<!-- Renders: red "High", amber "Medium", green "Low" -->

<!-- With size variant -->
<app-status-badge [value]="status" size="lg"></app-status-badge>
```

**Key features:**
- Graceful fallback: unknown values render with `badge-ghost` + formatted label (Property 24)
- Null/empty: badge does not render (no visual noise)
- ARIA: `role="status"` + `aria-label` including category context (Property 25)
- Consistent `badgeMap` pattern across all 4 types
- Sizes: `sm`, `md`, `lg`

---

## Confirmation Dialog

Accessible confirmation dialog with severity-based styling. Used programmatically via `ConfirmDialogService`.

```typescript
// In a component
constructor(private confirmDialog: ConfirmDialogService) {}

deleteOpportunity(id: string): void {
  this.confirmDialog.confirm({
    title: 'Delete Opportunity',
    message: 'This action cannot be undone. All related documents will be removed.',
    severity: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Keep',
  }).subscribe(confirmed => {
    if (confirmed) {
      this.store.dispatch(OpportunityActions.delete({ id }));
    }
  });
}
```

**Severity levels:** `info` · `warning` · `danger`

**Key features:**
- Programmatic API (no template declaration needed)
- Resolution mapping: severity determines button styling (Property 26)
- Focus trap within dialog
- Escape cancels, Enter confirms
- `role="alertdialog"` for screen reader urgency
- Customizable labels for both buttons

---

## Loading System

Six loading components covering every feedback scenario.

```html
<!-- Inline spinner -->
<app-loading-spinner size="md"></app-loading-spinner>

<!-- Full-page overlay (blocks interaction) -->
<app-loading-overlay [visible]="isSaving" message="Saving changes...">
</app-loading-overlay>

<!-- Button with integrated loading -->
<app-loading-button
  [loading]="isSubmitting"
  label="Submit Offer"
  loadingLabel="Submitting..."
  (clicked)="submitOffer()">
</app-loading-button>

<!-- Skeleton placeholders while data loads -->
<app-skeleton-table [rows]="5" [columns]="4"></app-skeleton-table>
<app-skeleton-card [count]="3"></app-skeleton-card>
<app-skeleton-form [fields]="6"></app-skeleton-form>
```

**Key features:**
- `aria-busy="true"` on all loading containers (Property 27)
- `aria-label` describing what is loading
- Reduced motion: shimmer animations disabled
- Overlay prevents interaction during save operations
- Loading button disables click and shows spinner
- Skeletons match the approximate layout of the content they replace

---

## Empty States

Informative empty state with icon, title, subtitle, and optional action buttons.

```html
<app-empty-state
  icon="search_off"
  title="No Opportunities Found"
  subtitle="Try adjusting your filters or create a new opportunity to get started."
  [actions]="[
    { label: 'Create Opportunity', primary: true, action: 'create' },
    { label: 'Clear Filters', action: 'reset' }
  ]"
  (actionClick)="onEmptyAction($event)">
</app-empty-state>
```

**Key features:**
- Material Symbols Outlined icon
- Clear guidance on what to do next
- Primary and secondary action buttons
- Accessible: descriptive text readable by screen readers

---

## KPI Cards

Dashboard metric cards with trend indicators.

```html
<app-kpi-card
  title="Opportunities This Quarter"
  [value]="125"
  [trend]="{ direction: 'up', percentage: 12, label: 'vs last quarter' }"
  icon="trending_up"
  accentClass="text-success">
</app-kpi-card>
```

---

## Timeline

Activity and audit timeline for tracking events chronologically.

```html
<app-timeline [items]="auditTrail"></app-timeline>
```

```typescript
const auditTrail: ITimelineItem[] = [
  { date: '2025-07-14T10:30:00Z', title: 'Status Changed', description: 'Moved to Due Diligence', icon: 'swap_horiz', user: 'J. Smith' },
  { date: '2025-07-13T14:15:00Z', title: 'Document Uploaded', description: 'Title Deed.pdf', icon: 'upload_file', user: 'A. Khan' },
  { date: '2025-07-12T09:00:00Z', title: 'Opportunity Created', description: 'Initial submission', icon: 'add_circle', user: 'J. Smith' },
];
```

---

## Lifecycle Stepper

Visual workflow progress indicator showing which stage a record is in.

```html
<app-lifecycle-stepper
  [steps]="acquisitionSteps"
  [currentStep]="opportunity.currentStageIndex">
</app-lifecycle-stepper>
```

```typescript
const acquisitionSteps: ILifecycleStep[] = [
  { label: 'Identified', icon: 'search' },
  { label: 'Due Diligence', icon: 'fact_check' },
  { label: 'Offer Made', icon: 'local_offer' },
  { label: 'Under Contract', icon: 'description' },
  { label: 'Acquired', icon: 'check_circle' },
];
```

---

## Pipeline Column

Kanban-style pipeline column for drag-and-drop stage management.

```html
<app-pipeline-column
  [title]="'Due Diligence'"
  [items]="dueDiligenceItems"
  [count]="dueDiligenceItems.length"
  badgeClass="badge-info"
  (itemDropped)="onDrop($event)">
</app-pipeline-column>
```

---

## Approval Panel

Workflow approval component for approve/reject decisions with notes.

```html
<app-approval-panel
  [request]="approvalRequest"
  [canApprove]="hasApprovalPermission"
  (approved)="onApprove($event)"
  (rejected)="onReject($event)">
</app-approval-panel>
```

---

## Notification Panel

Real-time notification centre with grouping and mark-as-read.

```html
<app-notification-panel
  [notifications]="notifications"
  (notificationClick)="onNotificationClick($event)"
  (markAllRead)="markAllRead()">
</app-notification-panel>
```

---

## Document Upload

Typed document upload with category selection — extends the base file upload with document-type metadata.

```html
<app-document-upload
  [documentTypes]="documentTypeOptions"
  [maxFileSize]="20971520"
  (documentUploaded)="onDocumentUploaded($event)">
</app-document-upload>
```

---

## Status Transition Dialog

Guided dialog for transitioning a record's status with validation of allowed transitions.

```html
<app-status-transition-dialog
  [visible]="showTransition"
  [currentStatus]="opportunity.status"
  [allowedTransitions]="validTransitions"
  (transitionConfirmed)="onTransition($event)"
  (cancelled)="closeDialog()">
</app-status-transition-dialog>
```

---

*Every component above is importable from a single barrel: `import { ... } from 'shared/design-system'`*
