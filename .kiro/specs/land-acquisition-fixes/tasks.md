# Implementation Plan: Land Acquisition Fixes

## Overview

This plan addresses 30 identified gaps in the Land Acquisition module across five layers: route security, NgRx store refactoring, service layer corrections, new UI components, and integration/polish. Tasks are organized to build incrementally — foundational infrastructure first, then core features, then UI components, and finally integration and testing. Each task references specific requirements for traceability.

## Tasks

- [x] 1. Route Security — AuthGuard and RoleGuard
  - [x] 1.1 Apply authGuard to the land-acquisition feature route in app.routes.ts
    - Add `canActivate: [authGuard]` to the `land-acquisition` lazy route config in `app.routes.ts`
    - Import `authGuard` from `@core/guards/auth.guard`
    - Verify unauthenticated users are redirected to `/login`
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Replace placeholder roleGuard with core roleGuard implementation
    - Delete the file `features/land-acquisition/guards/role.guard.ts` (placeholder that always returns true)
    - Update `land-acquisition.routes.ts` to import `roleGuard` from `@core/guards/role.guard`
    - Add `canActivate: [roleGuard]` with appropriate `data: { roles: [...] }` to all write routes (new, edit, status transition)
    - Configure roles per route: `['AcquisitionManager', 'AdminSupport', 'SuperAdmin']` for create/edit; `['AcquisitionManager', 'LegalComplianceOfficer', 'AdminSupport', 'SuperAdmin']` for status transitions
    - Verify the core roleGuard reads `route.data['roles']` and checks via `AuthService.hasAnyRole()`
    - On unauthorized access: display access denied toast and redirect to `/home`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Model and Interface Updates
  - [x] 2.1 Add rowVersion to opportunity models
    - Add `readonly rowVersion: string` to `IOpportunity` interface
    - Add `readonly rowVersion: string` to `IOpportunityDetail` interface
    - Add `readonly rowVersion: string` to `IUpdateOpportunity` interface (required field)
    - Update `OpportunityService.update()` to include rowVersion in the request body
    - _Requirements: 7.1, 7.2, 7.4, 30.1, 30.2, 30.3, 30.4_

  - [x] 2.2 Add pagination and filter interfaces to opportunity state
    - Create `IPaginationMeta` interface with `pageNumber`, `pageSize`, `totalCount`, `totalPages`
    - Create `IOpportunityFilters` interface with `status`, `search`, `location`, `source`, `dateFrom`, `dateTo`, `sortBy`, `sortDirection`
    - Extend `OpportunityState` to include `pagination: IPaginationMeta`, `filters: IOpportunityFilters`, `bulkDeleteInProgress: boolean`
    - _Requirements: 3.1, 3.4_

  - [x] 2.3 Create new model interfaces for notifications, acquisitions, and audit
    - Create `INotification` interface with `id`, `eventType`, `title`, `description`, `entityId`, `entityType`, `isRead`, `createdAt`
    - Create `NotificationEventType` enum (StatusChange, ApprovalRequest, OfferExpiry, DueDiligenceFailure, ContractSigned)
    - Create `ILandAcquisitionRecord` interface with `id`, `opportunityId`, `purchasePrice`, `completionDate`, `registryRef`, `status`, `createdAt`
    - Create `IAuditEntry` interface with `id`, `action`, `userName`, `timestamp`, `changedFields`
    - _Requirements: 9.4, 15.5, 26.2_

- [x] 3. NgRx Store Refactoring — Actions, Reducer, Effects, Selectors
  - [x] 3.1 Add new NgRx actions for pagination, bulk delete, filters, and reload
    - Add `Load Opportunities With Params` action accepting `{ params: IOpportunityQueryParams }`
    - Update `Load Opportunities Success` to include `pagination: IPaginationMeta`
    - Add `Bulk Delete Opportunities` action accepting `{ ids: string[] }`
    - Add `Bulk Delete Opportunities Success` action accepting `{ ids: string[], count: number }`
    - Add `Bulk Delete Opportunities Failure` action accepting `{ error: string, failedIds: string[] }`
    - Add `Update Filters` action accepting `{ filters: Partial<IOpportunityFilters> }`
    - Add `Reset Filters` action
    - Add `Reload Opportunities` action
    - _Requirements: 3.1, 4.1, 4.3, 4.4_

  - [x] 3.2 Update the opportunity reducer to handle new actions
    - Handle `Load Opportunities With Params` — set loading true
    - Handle `Load Opportunities Success` — store pagination metadata alongside entities
    - Handle `Bulk Delete Opportunities` — set `bulkDeleteInProgress: true`
    - Handle `Bulk Delete Opportunities Success` — remove IDs from entity state, set `bulkDeleteInProgress: false`
    - Handle `Bulk Delete Opportunities Failure` — set `bulkDeleteInProgress: false`, store error
    - Handle `Update Filters` — merge partial filters into state
    - Handle `Reset Filters` — restore default filter values
    - Set initial state for pagination (page 1, size 20) and default filters
    - _Requirements: 3.1, 3.4, 4.3, 4.5_

  - [x] 3.3 Create new NgRx effects for parameterized loading, bulk delete, reload, and 409 handling
    - `loadOpportunitiesWithParams$` — pass pagination/filter/sort params to `OpportunityService.getAll(params)` and map response
    - `bulkDelete$` — call `OpportunityService.delete()` for each ID using `forkJoin`, aggregate successes/failures, dispatch appropriate success/failure action
    - `reloadAfterTransition$` — listen to `transitionStatusSuccess` and dispatch `Reload Opportunities`
    - `reloadAfterBulkDelete$` — listen to `bulkDeleteSuccess` and dispatch `Reload Opportunities`
    - `reloadOpportunities$` — listen to `Reload Opportunities` and dispatch `Load Opportunities With Params` using current filters from store
    - Handle HTTP 409 in update effect — map to specific concurrency conflict error message
    - _Requirements: 3.1, 3.3, 4.1, 4.3, 4.4, 7.3, 19.1, 27.2, 27.3_

  - [x] 3.4 Create new NgRx selectors for pagination, filters, and bulk state
    - `selectPagination` — returns pagination metadata
    - `selectFilters` — returns current filter state
    - `selectBulkDeleteInProgress` — returns bulk delete loading flag
    - `selectTotalCount` — derived selector for total record count display
    - `selectCurrentPage` — derived selector for current page number
    - _Requirements: 3.4, 4.5_

  - [ ]* 3.5 Write property tests for bulk delete state management (Properties 1, 2, 3)
    - **Property 1: Bulk delete invokes delete for every selected ID**
    - **Property 2: Successful bulk delete removes all IDs from entity state**
    - **Property 3: Partial bulk delete failure reports failed IDs**
    - **Validates: Requirements 4.1, 4.3, 4.4**

- [x] 4. Checkpoint — Ensure store refactoring compiles and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Service Layer Corrections
  - [x] 5.1 Create LandOwnerService with correct API paths
    - Create `services/land-owner.service.ts` with `providedIn: 'root'`
    - Implement `getAll(opportunityId)` → GET `/api/v1/opportunities/{opportunityId}/owners`
    - Implement `create(opportunityId, dto)` → POST `/api/v1/opportunities/{opportunityId}/owners`
    - Implement `update(opportunityId, ownerId, dto)` → PUT `/api/v1/opportunities/{opportunityId}/owners/{ownerId}`
    - Implement `delete(opportunityId, ownerId)` → DELETE `/api/v1/opportunities/{opportunityId}/owners/{ownerId}`
    - Remove any references to incorrect `/land-owners` path
    - _Requirements: 10.1, 22.1, 22.2, 22.3_

  - [x] 5.2 Create AcquisitionService for land acquisition records
    - Create `services/acquisition.service.ts` with `providedIn: 'root'`
    - Implement `create(opportunityId, dto)` → POST `/api/v1/opportunities/{opportunityId}/acquisitions`
    - Implement `getByOpportunity(opportunityId)` → GET `/api/v1/opportunities/{opportunityId}/acquisitions`
    - Implement `updateStatus(opportunityId, acquisitionId, status)` → PATCH status
    - _Requirements: 9.4_

  - [x] 5.3 Create NotificationService for notifications
    - Create `shared/services/notification.service.ts` or `core/services/notification.service.ts`
    - Implement `getRecent(limit)` → GET `/api/v1/notifications`
    - Implement `markAsRead(id)` → PATCH `/api/v1/notifications/{id}/read`
    - Implement `getUnreadCount()` — derived from response or dedicated endpoint
    - _Requirements: 15.4_

  - [x] 5.4 Create AuditService for activity trail
    - Create `services/audit.service.ts`
    - Implement `getByOpportunity(opportunityId)` → GET `/api/v1/opportunities/{opportunityId}/audit`
    - _Requirements: 26.1_

  - [x] 5.5 Fix approval endpoint to use PATCH with ApproveOrRejectCommand body
    - Update approval calls to use `PATCH /api/v1/approvals/{id}` with body `{ approvalRequestId, decision, notes, rejectionReason }`
    - Remove any calls to `PUT /api/v1/approvals/{id}/approve` or `PUT /api/v1/approvals/{id}/reject`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 5.6 Verify feasibility assessment field name (estimatedLandCost)
    - Verify the `FeasibilityService` or form submission uses field name `estimatedLandCost` (not `estimatedPurchasePrice`)
    - Verify all feasibility form field names match backend `CreateFeasibilityAssessmentCommand` property names
    - _Requirements: 23.1, 23.2, 23.3_

  - [x] 5.7 Refactor Opportunity Detail Page to remove direct HttpClient usage
    - Remove direct `HttpClient` injection from the `OpportunityDetailPageComponent`
    - Replace all raw HTTP calls with dedicated service methods (DueDiligenceService, OfferService, ContractService, DocumentService, FeasibilityService, LandOwnerService)
    - Add toast notifications for service error responses
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 5.8 Replace localStorage username access with AuthService
    - Find all `localStorage.getItem()` calls for username/user identity in the land acquisition feature
    - Replace with `AuthService.getCurrentUser()` or equivalent
    - Ensure components react to auth state changes
    - _Requirements: 28.1, 28.2, 28.3_

  - [x] 5.9 Remove setTimeout usage and replace with NgRx effect subscriptions
    - Find all `setTimeout` calls used for reloading data after mutations
    - Replace with NgRx effects that listen to success actions and dispatch reload
    - Ensure reload occurs only after API response, not after arbitrary delay
    - _Requirements: 27.1, 27.2, 27.3_

- [x] 6. Checkpoint — Ensure service layer compiles and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. CSV Export Utility
  - [x] 7.1 Create CsvExportService with RFC 4180 compliance
    - Create `services/csv-export.service.ts`
    - Implement `generateCsv(columns: ColumnDef[], rows: any[]): string` — produces header + data rows
    - Implement RFC 4180 escaping: wrap values containing commas, quotes, or newlines in double quotes; escape internal double quotes by doubling them
    - Implement `downloadCsv(csvContent: string, filename: string)` — triggers browser download with Blob and anchor click
    - Generate filename format: `opportunities-export-YYYY-MM-DD.csv`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 7.2 Write property tests for CSV generation (Properties 4, 5)
    - **Property 4: CSV generation produces correct structure** — for any valid array, output has N+1 lines and 7 fields per line
    - **Property 5: CSV escaping round-trip** — for any string with special chars, escaping then parsing yields original
    - **Validates: Requirements 5.1, 5.3, 5.4**

- [x] 8. Withdrawal Modal Component
  - [x] 8.1 Create WithdrawalModalComponent as a standalone DaisyUI modal
    - Create `components/withdrawal-modal/withdrawal-modal.component.ts`
    - Implement DaisyUI modal with textarea, character counter, Cancel/Confirm buttons
    - Validate minimum 10 characters for withdrawal reason (trim whitespace)
    - Disable Confirm button until validation passes
    - Emit confirmed reason via `@Output()` on confirm
    - Emit cancel event on Cancel click
    - Remove all `window.prompt()` usage from the withdrawal flow
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 8.2 Write property test for minimum-length validation (Property 6)
    - **Property 6: Minimum-length text validation controls submit enablement**
    - Confirm button enabled iff `input.trim().length >= 10`
    - **Validates: Requirements 6.2, 12.4**

- [x] 9. Column Toggle Component
  - [x] 9.1 Create ColumnToggleComponent for opportunity list
    - Create `components/column-toggle/column-toggle.component.ts`
    - Implement columns icon button that opens a checkbox dropdown
    - Checkboxes for each column: Name, Location, Size, Status, Source, Expected Date, Created
    - Persist selected column visibility preferences in localStorage
    - Emit visible columns array via `@Output()` on change
    - _Requirements: 24.1, 24.2, 24.3_

  - [ ]* 9.2 Write property test for column visibility rendering (Property 13)
    - **Property 13: Column visibility toggle controls table rendering**
    - For any subset of visible columns, the table renders exactly those columns
    - **Validates: Requirements 24.1**

- [x] 10. Saved Views Component
  - [x] 10.1 Create SavedViewsComponent for filter management
    - Create `components/saved-views/saved-views.component.ts`
    - Implement Save View button that stores current filter state with user-defined name
    - Display saved views as selectable options in the filter panel
    - Persist saved views in localStorage
    - Allow deletion of previously saved views
    - On view selection: apply all stored filter values and dispatch reload
    - _Requirements: 25.1, 25.2, 25.3, 25.4_

- [x] 11. Notification Panel Component
  - [x] 11.1 Create NotificationPanelComponent with bell icon integration
    - Create `shared/components/notification-panel/notification-panel.component.ts`
    - Display bell icon in app header with unread count badge
    - On click: show sliding panel with 20 most recent notifications
    - Each notification shows: event type icon, title, description, timestamp, read status
    - On notification click: mark as read via NotificationService and navigate to relevant entity
    - Fetch notifications on interval (e.g., every 60 seconds) and update unread count
    - Display different icons based on `NotificationEventType` (status change, approval request, offer expiry, due diligence failure)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ]* 11.2 Write property test for notification icon mapping (Property 12)
    - **Property 12: Notification icon mapping is total**
    - For any NotificationEventType value, a specific non-default icon is rendered
    - **Validates: Requirements 15.5**

- [x] 12. Acquisition Tab Component
  - [x] 12.1 Create AcquisitionTabComponent for opportunity detail page
    - Create `components/acquisition-tab/acquisition-tab.component.ts`
    - Show tab only when opportunity status is `UnderContract` or `Acquired`
    - Implement create form requiring: PurchasePrice (positive decimal), CompletionDate (valid past/present date), RegistryRef (3-50 characters)
    - On successful creation: display record details and provide "Mark as Registered" button
    - Enforce only one active acquisition record per opportunity in the UI
    - Call `AcquisitionService` for all CRUD operations
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 12.2 Write property test for acquisition tab visibility (Property 8)
    - **Property 8: Acquisition tab visibility follows opportunity status**
    - Tab visible iff status is `UnderContract` or `Acquired`
    - **Validates: Requirements 9.1**

- [x] 13. Contract Transition UI Component
  - [x] 13.1 Create ContractTransitionComponent with status progress indicator
    - Create `components/contract-transition/contract-transition.component.ts`
    - Display status progress indicator showing current contract lifecycle position
    - Render transition action buttons for valid next statuses: Draft→UnderLegalReview, UnderLegalReview→Approved|Rejected, Approved→Signed, Signed→Exchanged, Exchanged→Completed
    - When transitioning to Exchanged: show form requiring positive decimal deposit amount
    - On confirm: call `ContractService` to PATCH contract status, show success toast
    - Use `ContractService` exclusively (no raw HttpClient)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 13.2 Write property test for contract transition buttons (Property 7)
    - **Property 7: Contract transition buttons match state machine**
    - For any ContractStatus, rendered buttons exactly equal valid next statuses
    - **Validates: Requirements 8.1**

- [x] 14. Pipeline Drag-and-Drop
  - [x] 14.1 Implement Angular CDK drag-drop on the pipeline page
    - Add `@angular/cdk/drag-drop` to the pipeline page Kanban columns
    - Allow dragging opportunity cards between status columns
    - Only allow drops on columns representing valid next statuses per state machine
    - On invalid drop: reject with visual shake animation and display error toast
    - When dragging to Withdrawn column: open WithdrawalModalComponent before completing transition
    - While transition API call in progress: show loading overlay on affected card
    - Dispatch `Transition Status` action on successful drop
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 14.2 Write property test for pipeline drop targets (Property 11)
    - **Property 11: Pipeline drag-drop targets match state machine**
    - For any OpportunityStatus, valid drop columns equal state machine next statuses
    - **Validates: Requirements 14.2**

- [x] 15. Checkpoint — Ensure all new components compile and render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Land Owner CRUD Completion
  - [x] 16.1 Implement full land owner CRUD on the opportunity detail page
    - Add create form with validation: Name (2-200 chars), ContactDetails (5-500 chars), OwnershipType (Freehold|Leasehold)
    - Add edit form with pre-populated fields for updating existing owners
    - Add delete with Confirmation_Dialog before calling delete endpoint
    - Route all operations through `LandOwnerService`
    - Remove all raw `HttpClient` calls for land owner operations
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 16.2 Write property test for land owner form validation (Property 9)
    - **Property 9: Land owner form validation respects length constraints**
    - Submission valid iff Name 2-200 chars, ContactDetails 5-500 chars, OwnershipType valid
    - **Validates: Requirements 10.2**

- [x] 17. Opportunity List Page Refactoring
  - [x] 17.1 Refactor opportunity list to use server-side pagination, filtering, and sorting
    - Remove direct `OpportunityService.getAll()` call with pageSize 200 and client-side filtering/sorting logic
    - Dispatch `Load Opportunities With Params` on page load via NgRx store
    - Subscribe to selectors for opportunity list, loading state, error state, pagination metadata
    - On page/size/filter/sort change: dispatch new action with updated params
    - Display total record count from API pagination metadata
    - Wire up `ColumnToggleComponent` to control table column visibility
    - Wire up `SavedViewsComponent` in filter panel
    - Wire up CSV export button to `CsvExportService` using current filtered data
    - Implement bulk delete: show Confirmation_Dialog with count, disable button during progress, show success/error toast
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 4.5, 5.1_

- [ ] 18. Integration and Polish
  - [x] 18.1 Add loading states to all sub-entity operations
    - Disable submit button and show spinner while create/update API calls are in progress for due diligence, offers, documents, feasibility, contracts
    - Disable all form controls during operation to prevent duplicate submissions
    - Re-enable on API response (success or failure)
    - _Requirements: 17.1, 17.2, 17.3_

  - [x] 18.2 Add confirmation dialogs on all destructive actions
    - Document deletion: Confirmation_Dialog with document name and irreversibility warning
    - Offer acceptance/rejection: Confirmation_Dialog stating action and consequences
    - Status transitions (other than withdrawal): Confirmation_Dialog showing current→target status
    - Use shared `ConfirmDialogService` for all confirmations
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [x] 18.3 Implement HTTP 409 conflict handling with reload action
    - Detect 409 status in HTTP interceptor or effect error handler
    - Display specific message: "This record was modified by another user. Please reload and try again."
    - Provide a Reload button that re-fetches the entity with fresh rowVersion
    - Prevent generic error handler from overriding the conflict message
    - _Requirements: 19.1, 19.2, 19.3_

  - [x] 18.4 Implement activity tab with audit API integration
    - Replace synthetic activity construction with data from `AuditService.getByOpportunity()`
    - Display each entry: action type, user name, timestamp, changed fields
    - If audit API unavailable: show placeholder message about future availability
    - _Requirements: 26.1, 26.2, 26.3, 26.4_

  - [x] 18.5 Add error boundary on chart components
    - Wrap Chart.js initialization in try-catch blocks
    - On error: display "Unable to render chart" fallback with retry button
    - Ensure chart failure does not propagate to parent dashboard or block other widgets
    - _Requirements: 29.1, 29.2, 29.3_

  - [x] 18.6 Verify dashboard metrics display
    - Verify DashboardService returns and displays: `offersExpiringSoon`, `overdueDueDiligence`, `approvalsPending`, `topOpportunities`, `activityByType`
    - Handle missing fields with nullish coalescing (default to 0 or empty array)
    - Display offers expiring soon as warning card, overdue due diligence as warning card, approvals pending as action card
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 18.7 Verify enum serialization across all entity types
    - Ensure all enum fields serialize as string representations in API request bodies
    - Ensure deserialization maps string values to TypeScript enums
    - Handle unrecognized enum values gracefully (display raw value, no crash)
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ]* 18.8 Write property test for enum serialization round-trip (Property 10)
    - **Property 10: Enum serialization round-trip**
    - For any valid enum value, serialize to JSON string and deserialize back produces original
    - **Validates: Requirements 11.1, 11.2**

  - [x] 18.9 Document the Identified→Withdrawn state machine transition
    - Add developer notes documenting the Identified→Withdrawn transition as intentional
    - Include rationale: "Allows cancellation of misidentified or duplicate opportunities before review resources are allocated"
    - _Requirements: 20.1, 20.2_

- [x] 19. Final Checkpoint — Ensure all tests pass and application compiles
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Unit and Integration Tests
  - [ ]* 20.1 Write NgRx reducer tests for new actions
    - Test `updateFilters`, `bulkDelete`, `loadWithParams` produce correct state shape
    - Test pagination metadata stored correctly on success
    - Test `bulkDeleteInProgress` flag toggles appropriately
    - _Requirements: 21.2_

  - [ ]* 20.2 Write NgRx effects tests
    - Test `loadOpportunitiesWithParams$` passes params to service and maps response
    - Test `bulkDelete$` calls delete for each ID, handles mixed success/failure
    - Test `reloadAfterTransition$` dispatches reload on `transitionStatusSuccess`
    - Test 409 error mapping in update effects
    - _Requirements: 21.2_

  - [ ]* 20.3 Write NgRx selector tests
    - Test `selectPagination`, `selectFilters`, `selectBulkDeleteInProgress`
    - Test derived selectors for total count display
    - _Requirements: 21.2_

  - [ ]* 20.4 Write component unit tests for new components
    - WithdrawalModalComponent: char counter, validation state, submit/cancel behavior
    - ColumnToggleComponent: toggle state, localStorage persistence
    - AcquisitionTabComponent: form validation, tab visibility logic
    - ContractTransitionComponent: button rendering per status
    - _Requirements: 21.2_

  - [ ]* 20.5 Write service unit tests
    - LandOwnerService: correct URL construction for CRUD operations
    - AcquisitionService: correct endpoint paths
    - NotificationService: correct endpoints and response mapping
    - CsvExportService: CSV generation and RFC 4180 escaping
    - _Requirements: 21.2_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases using Jasmine/Karma
- The design uses TypeScript (Angular 20 + NgRx), so all code examples target that stack
- The backend is unchanged — all fixes are frontend-only
- All new services use `providedIn: 'root'` as per project conventions

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.2", "2.3"] },
    { "id": 1, "tasks": ["1.2", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4", "5.1", "5.2", "5.3", "5.4"] },
    { "id": 3, "tasks": ["3.5", "5.5", "5.6", "5.7", "5.8", "5.9"] },
    { "id": 4, "tasks": ["7.1", "8.1", "9.1", "10.1", "11.1"] },
    { "id": 5, "tasks": ["7.2", "8.2", "9.2", "11.2", "12.1", "13.1"] },
    { "id": 6, "tasks": ["12.2", "13.2", "14.1", "16.1"] },
    { "id": 7, "tasks": ["14.2", "16.2", "17.1"] },
    { "id": 8, "tasks": ["18.1", "18.2", "18.3", "18.4", "18.5", "18.6", "18.7", "18.9"] },
    { "id": 9, "tasks": ["18.8", "20.1", "20.2", "20.3", "20.4", "20.5"] }
  ]
}
```
