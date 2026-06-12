# Planning & Approvals Module — Frontend

## Architecture

The frontend follows the Angular 20 standalone component pattern with NgRx state management, matching the structure established by the Land Acquisition module.

## Feature Structure

```
client-app/src/app/features/planning-approvals/
├── models/          (10 files — TypeScript interfaces and enums)
├── services/        (8 files — HTTP service classes)
├── store/           (2 slices — application + dashboard)
├── containers/      (4 smart components)
├── components/      (10 presentational components)
├── guards/          (2 route guards)
├── planning-approvals.routes.ts
└── index.ts
```

## Pages (Smart Container Components)

### 1. Planning Dashboard (`/planning-approvals/dashboard`)
- KPI cards: Average Decision Time, Approval Rate, Appeal Success Rate, Outstanding Conditions
- Pipeline summary showing application count per status
- Recent activity timeline (last 5 status changes)
- Upcoming deadlines table (milestones due within 14 days)
- Skeleton loading placeholders while data loads
- Auto-refreshes on navigation

### 2. Planning Pipeline (`/planning-approvals/pipeline`)
- Kanban-style board with 10 status columns
- Each column displays application cards
- Click a card to navigate to detail view
- Skeleton loading state with animated placeholders
- Error state with retry button
- Total application count badge

### 3. Application Detail (`/planning-approvals/applications/:id`)
- Header with application summary (description, type, status, council, dates)
- Status progress indicator (step bar showing lifecycle position)
- 7 tabbed sections: Overview, Conditions, Documents, Fees, Timeline, Appeals, Activity
- Contextual action buttons based on current status (e.g., "Submit Application", "Approve")
- Fee summary cards (Total, Paid, Pending, Awaiting Approval)

### 4. Application Create (`/planning-approvals/applications/create`)
- Typed reactive form with validation
- Fields: Opportunity ID, Application Type (dropdown), Description (textarea), Council Name
- Inline validation errors on blur and submit
- Submit button disabled until form valid
- Server-side error mapping to form fields
- Unsaved changes guard (confirmation dialog on navigation)
- Helper text explaining planning terminology

## Presentational Components (10 total)

| Component | Purpose |
|-----------|---------|
| KpiCardComponent | Metric card with value, label, and optional trend indicator |
| ApplicationCardComponent | Single application card in the pipeline (description, type badge, council, days since change) |
| PipelineColumnComponent | Status column with header, count badge, and card list |
| StatusProgressIndicatorComponent | Step bar showing lifecycle position (completed/current/future steps) |
| ConditionListComponent | Table with conditions, status/type badges, filtering |
| AppealPanelComponent | Cards showing appeal details, grounds, decision |
| FeeTableComponent | Table with fees, type/status badges, totals row |
| MilestoneTimelineComponent | Vertical timeline with overdue highlights and variance display |
| DocumentListComponent | Table with documents, type badges, download/delete actions |
| CouncilContactFormComponent | Reactive form for council contact CRUD |

## State Management (NgRx)

### Application Store Slice
- **Actions:** Load, Create, Update, Delete, Transition Status (each with Success/Failure)
- **State:** EntityState (normalized) + loading, error, selectedId
- **Selectors:** All apps, by ID, by status (pipeline grouping), filtered, loading, error
- **Effects:** API calls with toast notifications on failure

### Dashboard Store Slice
- **Actions:** Load Dashboard (with Success/Failure)
- **State:** IDashboardMetrics | null + loading, error
- **Selectors:** Metrics, KPIs, Status Counts, Recent Activity, Approaching Deadlines

## HTTP Services (7 total)

Each service is `@Injectable({ providedIn: 'root' })` and returns typed Observables:
- PlanningApplicationService (getAll, getById, create, update, transitionStatus, getByOpportunity)
- PlanningConditionService (getByApplication, create, transitionStatus)
- PlanningAppealService (getByApplication, create, transitionStatus)
- PlanningDocumentService (getByApplication, upload, download, delete)
- PlanningFeeService (getByApplication, getSummary, create, transitionStatus, approve)
- PlanningMilestoneService (getByApplication, create, complete)
- PlanningDashboardService (getDashboard)

## Routing

```
/planning-approvals              → redirects to dashboard
/planning-approvals/dashboard    → PlanningDashboardComponent
/planning-approvals/pipeline     → PlanningPipelineComponent
/planning-approvals/applications/create   → ApplicationCreateContainer
/planning-approvals/applications/:id      → ApplicationDetailContainer
/planning-approvals/applications/:id/edit → ApplicationCreateContainer (edit mode)
```

All routes protected by PlanningRoleGuard. Write routes additionally use unsavedChangesGuard.

## Design System

- **Framework:** Tailwind CSS + DaisyUI
- **Cards:** DaisyUI `card` for containers and metrics
- **Tables:** DaisyUI `table` for data grids
- **Badges:** Color-coded by status/type (success=approved, error=refused, warning=under review, info=submitted)
- **Loading:** Skeleton animations with `animate-pulse`
- **Empty states:** Centered icon + message + guidance text
- **Accessibility:** ARIA labels, keyboard navigation, role attributes
