# Requirements Document

## Introduction

This specification addresses 30 identified gaps in the Land Acquisition module of the BuildEstate Pro platform. The gaps span security vulnerabilities (missing authentication and role guards), broken functionality (fake bulk delete, no-op export, placeholder withdrawal dialog), API mismatches between frontend and backend, missing features (pipeline drag-and-drop, notifications UI, acquisition section), and polish issues (setTimeout usage, localStorage access, missing error boundaries). Each requirement maps to one or more gaps and follows EARS patterns with verifiable acceptance criteria.

## Glossary

- **Land_Acquisition_System**: The frontend Angular application and backend ASP.NET Core API module managing land opportunities, due diligence, offers, contracts, documents, feasibility, approvals, and ownership transfer
- **Role_Guard**: An Angular route guard that checks the authenticated user possesses one of the allowed roles before granting route access
- **Auth_Guard**: An Angular route guard that verifies the user is authenticated (valid JWT token present) before granting route access
- **NgRx_Store**: The centralized state management layer using @ngrx/store for dispatching actions, reducing state, selecting derived data, and handling side effects
- **Opportunity_List_Page**: The Angular container component displaying the paginated, filtered, sorted table of land opportunities
- **Opportunity_Detail_Page**: The Angular container component displaying full opportunity information with tabbed sub-entity views
- **Pipeline_Page**: The Angular container component displaying opportunities grouped by status in a Kanban-style column layout
- **OpportunityService**: The dedicated Angular HTTP service for opportunity API calls
- **DueDiligenceService**: The dedicated Angular HTTP service for due diligence API calls
- **OfferService**: The dedicated Angular HTTP service for offer API calls
- **ContractService**: The dedicated Angular HTTP service for contract API calls
- **DocumentService**: The dedicated Angular HTTP service for document API calls
- **FeasibilityService**: The dedicated Angular HTTP service for feasibility assessment API calls
- **DashboardService**: The dedicated Angular HTTP service for dashboard metrics API calls
- **AuthService**: The core Angular service providing authentication state, token management, and role checking via hasAnyRole() method
- **Confirmation_Dialog**: A DaisyUI modal component requiring explicit user confirmation before executing destructive or irreversible actions
- **RowVersion**: A concurrency token (byte array) used for optimistic concurrency control to prevent lost updates
- **State_Machine**: The backend service enforcing valid status transitions for opportunities and contracts
- **CSV_Export**: A client-side file generation producing comma-separated values from the current filtered dataset
- **Acquisition_Record**: A LandAcquisition entity representing a completed purchase with registry reference, purchase price, and completion date

## Requirements

### Requirement 1: Authentication Guard on Land Acquisition Routes

**User Story:** As a platform administrator, I want unauthenticated users blocked from accessing any land acquisition page, so that sensitive acquisition data is protected from unauthorized access.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any route under /land-acquisition, THE Land_Acquisition_System SHALL redirect the user to the /login page
2. THE Land_Acquisition_System SHALL apply the Auth_Guard at the feature route level in app.routes.ts on the land-acquisition path so that all child routes inherit authentication protection
3. WHEN an authenticated user navigates to /land-acquisition, THE Land_Acquisition_System SHALL allow access and load the requested route normally

### Requirement 2: Role Guard Implementation

**User Story:** As a platform administrator, I want the land acquisition role guard to verify actual user roles, so that only authorized personnel can perform write operations on acquisition data.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL replace the placeholder roleGuard in the land-acquisition feature guards with an implementation that calls AuthService.hasAnyRole() or checks NgRx store user roles
2. WHEN a user without the required role (AcquisitionManager, AdminSupport, LegalComplianceOfficer, ValuationAnalyst, or FinanceDirector as configured per route) attempts to access a guarded route, THE Land_Acquisition_System SHALL display an access denied toast notification and redirect to /home
3. THE Land_Acquisition_System SHALL read allowed roles from the route data property and check the authenticated user possesses at least one matching role
4. THE Land_Acquisition_System SHALL apply the Role_Guard with appropriate role configuration to all write routes (create, edit, status transition) within the land acquisition feature

### Requirement 3: Server-Side Pagination for Opportunity List

**User Story:** As an Acquisition Manager, I want the opportunity list to use server-side pagination, filtering, and sorting, so that the page performs well with large datasets and returns accurate results.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL dispatch an NgRx action to load opportunities with pagination parameters (pageNumber, pageSize), filter parameters (status, search, location, source, dateRange), and sort parameters (sortBy, sortDirection)
2. WHEN the Opportunity_List_Page loads, THE Land_Acquisition_System SHALL dispatch the load action through the NgRx_Store and subscribe to selectors for the opportunity list, loading state, error state, and pagination metadata
3. WHEN the user changes page number, page size, filter values, or sort column, THE Land_Acquisition_System SHALL dispatch a new load action with updated parameters to the backend GetOpportunitiesQuery endpoint
4. THE Land_Acquisition_System SHALL display total record count and pagination metadata returned from the API response envelope rather than computing pagination from a full client-side array
5. THE Land_Acquisition_System SHALL remove the direct OpportunityService.getAll() call with pageSize 200 and all client-side filtering and sorting logic from the Opportunity_List_Page component

### Requirement 4: Bulk Delete Implementation

**User Story:** As an Acquisition Manager, I want the bulk delete action to actually delete selected opportunities, so that I can efficiently manage the pipeline by removing multiple records at once.

#### Acceptance Criteria

1. WHEN the user confirms bulk deletion, THE Land_Acquisition_System SHALL call the OpportunityService.delete() method for each selected opportunity ID
2. THE Land_Acquisition_System SHALL display a Confirmation_Dialog before executing bulk deletion, stating the number of opportunities to be deleted and warning the action cannot be undone
3. WHEN all delete API calls complete successfully, THE Land_Acquisition_System SHALL remove the deleted records from the NgRx_Store and display a success toast with the count of deleted records
4. IF one or more delete API calls fail, THEN THE Land_Acquisition_System SHALL display an error toast indicating which deletions failed and refresh the list to reflect current state
5. WHILE the bulk deletion is in progress, THE Land_Acquisition_System SHALL disable the bulk actions button and display a loading indicator

### Requirement 5: CSV Export Implementation

**User Story:** As an Acquisition Manager, I want the export button to generate a CSV file from the current filtered data, so that I can share opportunity data with stakeholders who need it in spreadsheet format.

#### Acceptance Criteria

1. WHEN the user clicks the Export button, THE Land_Acquisition_System SHALL generate a CSV file containing all columns (Name, Location, Land Size, Status, Source, Expected Acquisition Date, Created Date) from the current filtered and sorted result set
2. THE Land_Acquisition_System SHALL trigger a browser download of the generated CSV file with filename format "opportunities-export-YYYY-MM-DD.csv"
3. THE Land_Acquisition_System SHALL include a header row with column names as the first line of the CSV file
4. THE Land_Acquisition_System SHALL properly escape values containing commas, quotes, or newlines per RFC 4180

### Requirement 6: Withdrawal Dialog Replacement

**User Story:** As an Acquisition Manager, I want a proper modal dialog for entering withdrawal reasons, so that the reason text is validated and the interaction follows enterprise UX standards.

#### Acceptance Criteria

1. WHEN the user initiates a withdrawal action, THE Land_Acquisition_System SHALL display a DaisyUI modal dialog containing a textarea for the withdrawal reason, a character counter, and Cancel/Confirm buttons
2. THE Land_Acquisition_System SHALL validate that the withdrawal reason contains at least 10 characters before enabling the Confirm button
3. THE Land_Acquisition_System SHALL remove all usage of window.prompt() from the withdrawal flow
4. WHEN the user confirms withdrawal with a valid reason, THE Land_Acquisition_System SHALL dispatch the status transition action with the reason text to the backend API
5. WHEN the user clicks Cancel, THE Land_Acquisition_System SHALL close the dialog without making any state changes

### Requirement 7: Optimistic Concurrency Support (RowVersion)

**User Story:** As an Acquisition Manager, I want update operations to include the RowVersion token, so that concurrent edits are detected and data is not silently overwritten.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL add a rowVersion field to the IOpportunityDetail interface in the frontend models
2. THE Land_Acquisition_System SHALL add a rowVersion field to the IUpdateOpportunity interface and include the loaded rowVersion value when submitting update requests
3. WHEN the backend returns HTTP 409 Conflict due to a RowVersion mismatch, THE Land_Acquisition_System SHALL display a user-friendly error message explaining that the record was modified by another user and offer a reload action
4. THE Land_Acquisition_System SHALL load and store the rowVersion from the detail API response and pass it through to all update commands

### Requirement 8: Contract Status Transition UI

**User Story:** As a Legal and Compliance Officer, I want to transition contracts through their status lifecycle from the UI, so that I can manage the legal process without requiring direct API calls.

#### Acceptance Criteria

1. WHEN the user views a contract on the Opportunity_Detail_Page, THE Land_Acquisition_System SHALL display transition action buttons for each permitted next status based on the contract state machine (Draft to Under Legal Review, Under Legal Review to Approved or Rejected, Approved to Signed, Signed to Exchanged, Exchanged to Completed)
2. WHEN the user initiates a transition to Exchanged status, THE Land_Acquisition_System SHALL display a form requiring a positive decimal deposit amount before submitting
3. WHEN the user confirms a contract status transition, THE Land_Acquisition_System SHALL call the ContractService to PATCH the contract status at the correct endpoint and display a success toast on completion
4. THE Land_Acquisition_System SHALL display a status progress indicator showing the current contract lifecycle position
5. THE Land_Acquisition_System SHALL use the dedicated ContractService for all contract operations rather than raw HttpClient calls

### Requirement 9: Land Acquisition (Registry) Section

**User Story:** As an Admin/Support user, I want a UI section for creating and managing land acquisition records, so that I can track registry submissions and ownership transfer status.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL add an Acquisition tab on the Opportunity_Detail_Page for opportunities with status Under Contract or Acquired
2. WHEN the user creates an acquisition record, THE Land_Acquisition_System SHALL display a form requiring PurchasePrice (positive decimal), CompletionDate (valid past or present date), and RegistryRef (3-50 characters)
3. WHEN the acquisition record is created successfully, THE Land_Acquisition_System SHALL display the record details including status and provide a button to update status to Registered when RegistryRef is confirmed
4. THE Land_Acquisition_System SHALL call the backend AcquisitionsController endpoint at /api/v1/opportunities/{opportunityId}/acquisitions for all acquisition CRUD operations
5. THE Land_Acquisition_System SHALL enforce that only one active acquisition record exists per opportunity in the UI

### Requirement 10: Land Owner CRUD Completion

**User Story:** As an Acquisition Manager, I want complete create, read, update, and delete functionality for land owners through the dedicated service, so that owner data is managed consistently with proper validation.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL route all land owner API calls through the dedicated LandOwnerService at the correct backend path /api/v1/opportunities/{opportunityId}/owners
2. WHEN the user creates a land owner, THE Land_Acquisition_System SHALL validate Name (2-200 characters), ContactDetails (5-500 characters), and OwnershipType (Freehold or Leasehold) before submission
3. THE Land_Acquisition_System SHALL provide an edit form on the Opportunity_Detail_Page for updating existing land owner details with pre-populated fields
4. WHEN the user deletes a land owner, THE Land_Acquisition_System SHALL display a Confirmation_Dialog before calling the delete endpoint
5. THE Land_Acquisition_System SHALL remove all raw HttpClient calls for land owner operations and use the LandOwnerService exclusively

### Requirement 11: Enum Serialization Verification

**User Story:** As a developer, I want enum values to serialize correctly as strings between frontend and backend, so that due diligence type/status and other enum fields do not cause deserialization failures.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL serialize all enum fields (DueDiligenceType, DueDiligenceStatus, OfferStatus, DocumentType, ContractStatus, OpportunityStatus, OwnershipType) as their string representation in API request bodies
2. WHEN the backend returns enum values as strings in JSON responses, THE Land_Acquisition_System SHALL map them to the corresponding TypeScript enum values without error
3. IF the backend returns an unrecognized enum value, THEN THE Land_Acquisition_System SHALL handle the mismatch gracefully by displaying the raw value rather than crashing the page

### Requirement 12: Approval API Endpoint Alignment

**User Story:** As a Finance Director, I want the approval workflow to function correctly, so that I can approve or reject acquisition decisions from the UI.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL call PATCH /api/v1/approvals/{id} with an ApproveOrRejectCommand body containing the decision (Approved or Rejected), notes, and rejectionReason as appropriate
2. THE Land_Acquisition_System SHALL remove any calls to PUT /api/v1/approvals/{id}/approve or PUT /api/v1/approvals/{id}/reject that do not match the backend API contract
3. WHEN the Finance Director approves an acquisition, THE Land_Acquisition_System SHALL send approvalRequestId, decision set to Approved, and approval notes in the PATCH request body
4. WHEN the Finance Director rejects an acquisition, THE Land_Acquisition_System SHALL require a rejection reason of at least 10 characters and send it in the PATCH request body

### Requirement 13: Detail Page Service Refactoring

**User Story:** As a developer, I want the opportunity detail page to use dedicated services for all sub-entity operations, so that API calls are consistent, testable, and maintainable.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL replace all raw HttpClient calls in the Opportunity_Detail_Page with calls to the appropriate dedicated service (DueDiligenceService, OfferService, ContractService, DocumentService, FeasibilityService)
2. THE Land_Acquisition_System SHALL remove the direct HttpClient injection from the Opportunity_Detail_Page component
3. WHEN creating, updating, or deleting any sub-entity (due diligence, offer, document, feasibility assessment, contract, approval), THE Land_Acquisition_System SHALL use the corresponding service method that encapsulates the correct API path and request format
4. THE Land_Acquisition_System SHALL handle API error responses from sub-entity services with toast notifications showing user-friendly error messages

### Requirement 14: Pipeline Drag-and-Drop Transitions

**User Story:** As an Acquisition Manager, I want to drag opportunity cards between pipeline columns to trigger status transitions, so that I can manage workflow progression with a single intuitive gesture.

#### Acceptance Criteria

1. WHEN the user drags an opportunity card from one status column and drops it on a valid adjacent column, THE Land_Acquisition_System SHALL dispatch a status transition action with the target status
2. THE Land_Acquisition_System SHALL only allow dropping on columns representing valid next statuses as defined by the State_Machine transition rules
3. IF the user drops a card on a column representing an invalid transition, THEN THE Land_Acquisition_System SHALL reject the drop with a visual shake animation and display a toast indicating the transition is not permitted
4. WHEN dragging to the Withdrawn column, THE Land_Acquisition_System SHALL prompt the user with the withdrawal reason dialog before completing the transition
5. WHILE a drag-and-drop transition API call is in progress, THE Land_Acquisition_System SHALL display a loading overlay on the affected card

### Requirement 15: Notifications UI

**User Story:** As a stakeholder, I want to see in-app notifications for key acquisition events, so that I am informed of progress and required actions without manually checking the system.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL display a bell icon in the application header showing an unread notification count badge when unread notifications exist
2. WHEN the user clicks the bell icon, THE Land_Acquisition_System SHALL display a notification panel showing the most recent 20 notifications with event type, description, timestamp, and read status
3. WHEN the user clicks a notification, THE Land_Acquisition_System SHALL mark it as read and navigate to the relevant entity (opportunity, approval, or due diligence record)
4. THE Land_Acquisition_System SHALL fetch notifications from the backend notification API and update the unread count on an interval or via the existing notification endpoints
5. THE Land_Acquisition_System SHALL display different notification icons based on event type (status change, approval request, offer expiry, due diligence failure)

### Requirement 16: Dashboard Metrics Verification

**User Story:** As an Acquisition Manager, I want the dashboard to display all expected KPI fields, so that I have complete visibility into pipeline performance.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL verify that the DashboardService returns and the dashboard page displays: offersExpiringSoon, overdueDueDiligence, approvalsPending, topOpportunities, and activityByType fields
2. IF the backend GetDashboardMetrics endpoint does not return expected fields, THEN THE Land_Acquisition_System SHALL handle missing fields gracefully by displaying zero or an empty state rather than crashing
3. THE Land_Acquisition_System SHALL display offersExpiringSoon as a warning card showing count of offers expiring within 7 days
4. THE Land_Acquisition_System SHALL display overdueDueDiligence as a warning card showing count of overdue checks
5. THE Land_Acquisition_System SHALL display approvalsPending as an action card showing count of approvals awaiting Finance Director review

### Requirement 17: Loading States on Sub-Entity Operations

**User Story:** As a user, I want visual feedback when creating or updating sub-entities, so that I know the system is processing my request and I do not accidentally submit duplicate requests.

#### Acceptance Criteria

1. WHILE a create or update API call is in progress for due diligence, offers, documents, feasibility assessments, or contracts, THE Land_Acquisition_System SHALL disable the submit button and display a loading spinner within the button
2. WHILE a sub-entity operation is in progress, THE Land_Acquisition_System SHALL prevent duplicate submissions by disabling all form controls
3. WHEN the API call completes (success or failure), THE Land_Acquisition_System SHALL re-enable the form controls and submit button

### Requirement 18: Confirmation Dialogs on Destructive Actions

**User Story:** As a user, I want confirmation prompts before destructive actions, so that I cannot accidentally delete documents, accept/reject offers, or transition statuses without deliberate intent.

#### Acceptance Criteria

1. WHEN the user initiates document deletion, THE Land_Acquisition_System SHALL display a Confirmation_Dialog stating the document name and warning the deletion cannot be undone
2. WHEN the user initiates offer acceptance or rejection, THE Land_Acquisition_System SHALL display a Confirmation_Dialog stating the action and its consequences
3. WHEN the user initiates a status transition (other than via the withdrawal dialog which already confirms), THE Land_Acquisition_System SHALL display a Confirmation_Dialog showing the current status, target status, and asking for confirmation
4. THE Land_Acquisition_System SHALL use the existing shared ConfirmDialogService for all confirmation prompts with contextual icon and message

### Requirement 19: HTTP 409 Conflict Handling

**User Story:** As a user, I want a clear message when my edit conflicts with another user's changes, so that I understand why my save failed and can reload the latest data.

#### Acceptance Criteria

1. WHEN the backend returns HTTP 409 Conflict on any update operation, THE Land_Acquisition_System SHALL display a specific error message: "This record was modified by another user. Please reload and try again."
2. THE Land_Acquisition_System SHALL provide a Reload button in the conflict error notification that refreshes the entity from the API
3. THE Land_Acquisition_System SHALL detect 409 status codes in the HTTP interceptor or effect error handler and map them to the concurrency conflict message rather than showing a generic error

### Requirement 20: State Machine Documentation (Identified to Withdrawn)

**User Story:** As a developer, I want the Identified to Withdrawn transition documented, so that the deviation from the original spec Requirement 3.1 is formally acknowledged as an intentional enhancement.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL retain the Identified to Withdrawn transition in the backend OpportunityStateMachine as an intentional improvement allowing early withdrawal of opportunities that have not yet entered Initial Review
2. THE Land_Acquisition_System SHALL document this additional transition in the developer notes with rationale: "Allows cancellation of misidentified or duplicate opportunities before review resources are allocated"

### Requirement 21: Test Infrastructure Setup

**User Story:** As a developer, I want unit and integration tests for the Land Acquisition module, so that regressions are caught and quality standards are maintained.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL include backend unit tests for all command handlers, query handlers, and validators in the Land Acquisition feature using xUnit with FluentAssertions
2. THE Land_Acquisition_System SHALL include frontend unit tests for NgRx reducers, selectors, effects, and critical component behaviors using the Angular test framework
3. THE Land_Acquisition_System SHALL include tests for the OpportunityStateMachine covering all valid transitions and rejection of invalid transitions
4. THE Land_Acquisition_System SHALL include validator tests verifying all FluentValidation rules for create, update, and transition commands

### Requirement 22: Land Owner API Path Correction

**User Story:** As a developer, I want the frontend land owner service to call the correct backend API path, so that owner create and update operations succeed without 404 errors.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL configure the LandOwnerService (or equivalent) to call /api/v1/opportunities/{opportunityId}/owners for create operations (POST) and /api/v1/opportunities/{opportunityId}/owners/{ownerId} for update operations (PUT)
2. THE Land_Acquisition_System SHALL remove any references to an incorrect /land-owners path that does not match the backend LandOwnersController route
3. WHEN the user creates or updates a land owner through the UI, THE Land_Acquisition_System SHALL send the request to the correct endpoint and display success or error feedback

### Requirement 23: Feasibility API Field Name Correction

**User Story:** As a Valuation Analyst, I want the feasibility assessment form to send the correct field names to the backend, so that assessments are saved without validation errors.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL use the field name estimatedLandCost (matching the backend command property) rather than estimatedPurchasePrice when submitting feasibility assessment creation requests
2. THE Land_Acquisition_System SHALL verify all feasibility form field names match the backend CreateFeasibilityAssessmentCommand property names
3. WHEN the user submits a feasibility assessment, THE Land_Acquisition_System SHALL serialize the form data with field names exactly matching the backend expected format

### Requirement 24: Column Customization Resolution

**User Story:** As an Acquisition Manager, I want the opportunity list to either provide column show/hide functionality or not advertise it, so that the UI does not promise features that do not exist.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL implement a column visibility toggle control on the Opportunity_List_Page allowing users to show or hide individual columns (Name, Location, Size, Status, Source, Expected Date, Created)
2. THE Land_Acquisition_System SHALL persist column visibility preferences in localStorage so that selections survive page navigation
3. THE Land_Acquisition_System SHALL display the column customization control in the table toolbar area with a columns icon button that opens a checkbox dropdown

### Requirement 25: Saved Views and Filters

**User Story:** As an Acquisition Manager, I want to save filter combinations as named views, so that I can quickly switch between frequently used filter configurations.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL provide a Save View button in the filter panel that stores the current filter state (status, search term, location, source, land size range, date range) with a user-defined name
2. THE Land_Acquisition_System SHALL display saved views as selectable options in the filter panel allowing one-click application of a stored filter combination
3. THE Land_Acquisition_System SHALL persist saved views in localStorage and allow deletion of previously saved views
4. WHEN the user selects a saved view, THE Land_Acquisition_System SHALL apply all stored filter values and refresh the opportunity list accordingly

### Requirement 26: Activity Tab Audit API Integration

**User Story:** As a user, I want the Activity tab on the opportunity detail page to show real audit trail data, so that I see the actual history of changes rather than a synthetic approximation.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL call the audit trail API endpoint to retrieve the chronological history of actions performed on the opportunity entity
2. THE Land_Acquisition_System SHALL display each audit entry with action type, user name, timestamp, and changed fields
3. THE Land_Acquisition_System SHALL replace the current synthetic activity construction (built from sub-entity timestamps) with data from the dedicated audit API
4. IF the audit API is not yet available, THEN THE Land_Acquisition_System SHALL display a placeholder message indicating activity history will be available in a future update

### Requirement 27: Replace setTimeout with Effect Subscription

**User Story:** As a developer, I want data reloads after status transitions to use proper NgRx effect subscriptions, so that reload timing is deterministic and race conditions are eliminated.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL remove all setTimeout calls used for reloading data after status transitions or other mutations
2. WHEN a status transition succeeds, THE Land_Acquisition_System SHALL trigger a data reload through an NgRx effect that listens for the transition success action and dispatches a reload action
3. THE Land_Acquisition_System SHALL ensure the reload occurs only after the transition API response is received, not after an arbitrary delay

### Requirement 28: Replace localStorage Username with AuthService

**User Story:** As a developer, I want the application to retrieve the current username from AuthService rather than directly from localStorage, so that user identity is sourced from a single authoritative service.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL replace all direct localStorage.getItem() calls for username or user identity with AuthService method calls (getCurrentUser() or equivalent)
2. THE Land_Acquisition_System SHALL use the AuthService as the single source of truth for current user identity throughout the land acquisition feature
3. THE Land_Acquisition_System SHALL ensure that components receiving user identity react to auth state changes (login, logout, token refresh)

### Requirement 29: Error Boundary on Chart Components

**User Story:** As a user, I want dashboard charts to handle rendering errors gracefully, so that a chart failure does not crash the entire dashboard page.

#### Acceptance Criteria

1. IF Chart.js rendering throws an error, THEN THE Land_Acquisition_System SHALL catch the error and display a fallback message in the chart container area stating "Unable to render chart" with a retry option
2. THE Land_Acquisition_System SHALL wrap chart initialization and update logic in try-catch blocks that log the error and render a user-friendly fallback
3. THE Land_Acquisition_System SHALL ensure that a chart rendering failure does not prevent other dashboard widgets from loading and displaying correctly

### Requirement 30: RowVersion in Frontend IOpportunityDetail Interface

**User Story:** As a developer, I want the IOpportunityDetail interface to include the rowVersion field, so that update operations can pass the concurrency token back to the backend.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL add a readonly rowVersion field of type string to the IOpportunityDetail interface
2. THE Land_Acquisition_System SHALL add a readonly rowVersion field of type string to the IOpportunity interface
3. THE Land_Acquisition_System SHALL include rowVersion in the IUpdateOpportunity interface as a required field
4. WHEN the opportunity detail API response includes rowVersion, THE Land_Acquisition_System SHALL store the value and include it in all subsequent update requests for that entity
