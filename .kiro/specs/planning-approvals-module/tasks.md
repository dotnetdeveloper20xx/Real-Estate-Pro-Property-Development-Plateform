# Implementation Plan: Planning & Approvals Module

## Overview

This implementation plan covers the full Planning & Approvals module for BuildEstate Pro. The module manages the lifecycle of planning applications from pre-application through decision and appeal. It follows Clean Architecture + CQRS patterns established by the Land Acquisition module, uses a state machine pattern for status transitions, and integrates via the LandOpportunity entity's OpportunityId foreign key.

The backend is implemented in C# (ASP.NET Core, EF Core, MediatR, FluentValidation, FsCheck) and the frontend in TypeScript (Angular 20, NgRx, Reactive Forms).

## Tasks

- [x] 1. Set up domain layer foundation
  - [x] 1.1 Create domain enums and value objects
    - Create `PlanningApplicationStatus`, `PlanningApplicationType`, `ConditionType`, `ConditionStatus`, `AppealType`, `AppealStatus`, `AppealOutcomeType`, `PlanningDocumentType`, `FeeType`, `PaymentStatus`, `MilestoneType`, `MilestoneStatus` enums in `BuildEstate.Domain/Enums/`
    - _Requirements: 1.4, 2.1, 5.3, 5.4, 6.3, 6.5, 7.2, 8.2, 8.4, 9.2_

  - [x] 1.2 Create domain entities
    - Create `PlanningApplication`, `CouncilContact`, `PlanningCondition`, `PlanningAppeal`, `PlanningDocument`, `PlanningFee`, `PlanningMilestone` entities inheriting from `BaseEntity`
    - Include all properties as defined in the data model (design ER diagram)
    - Define navigation properties and domain event support
    - _Requirements: 1.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1_

  - [x] 1.3 Create state machine interfaces and implementations
    - Create `IPlanningStatusStateMachine`, `IConditionStatusStateMachine`, `IAppealStatusStateMachine`, `IFeeStatusStateMachine` interfaces in `BuildEstate.Domain/Interfaces/`
    - Implement `PlanningStatusStateMachine`, `ConditionStatusStateMachine`, `AppealStatusStateMachine`, `FeeStatusStateMachine` in `BuildEstate.Domain/Services/`
    - Implement transition rules as defined in design (including fee threshold logic for `IFeeStatusStateMachine`)
    - _Requirements: 2.1, 5.4, 6.5, 8.4_

  - [x] 1.4 Write property tests for PlanningStatusStateMachine
    - **Property 1: Application State Machine Validity**
    - Test that for all possible (currentStatus, targetStatus) pairs, only defined transitions are accepted
    - Use FsCheck to generate all enum pairs exhaustively
    - **Validates: Requirements 2.1, 2.2**

  - [x] 1.5 Write property tests for ConditionStatusStateMachine
    - **Property 2: Condition State Machine Validity**
    - Test Outstanding → SubmittedForDischarge, SubmittedForDischarge → Discharged/Rejected, Rejected → SubmittedForDischarge
    - All other pairs must be rejected
    - **Validates: Requirements 5.4**

  - [x] 1.6 Write property tests for AppealStatusStateMachine
    - **Property 3: Appeal State Machine Validity**
    - Test all valid/invalid transition pairs for AppealStatus enum
    - **Validates: Requirements 6.5**

  - [x] 1.7 Write property tests for FeeStatusStateMachine
    - **Property 4: Fee Payment Status State Machine Validity**
    - Test all valid/invalid transition pairs for PaymentStatus enum
    - **Validates: Requirements 8.4**

  - [x] 1.8 Create domain events
    - Create `AppealAllowedDomainEvent`, `AllConditionsDischargedDomainEvent`, `MilestoneOverdueDomainEvent`, `ApplicationStatusChangedDomainEvent`, `FeeRequiresApprovalDomainEvent`
    - _Requirements: 6.6, 5.6, 9.5, 12.1, 12.4_

- [x] 2. Set up infrastructure layer (EF Core)
  - [x] 2.1 Create entity configurations
    - Create EF Core `IEntityTypeConfiguration<T>` for each entity in `BuildEstate.Infrastructure/Configurations/`
    - Configure indexes: `(Status, CreatedAt)`, `(OpportunityId)` on PlanningApplication; composite unique `(ApplicationId, ConditionNumber)` on PlanningCondition; composite unique `(ApplicationId, MilestoneType)` on PlanningMilestone; `(ApplicationId, PaymentStatus)` on PlanningFee; `(ApplicationId, DocumentType)` on PlanningDocument
    - Configure `HasQueryFilter(x => !x.IsDeleted)` on all entities
    - Configure `HasPrecision(18, 2)` on PlanningFee.Amount
    - Configure unique constraint on PlanningApplication `(OpportunityId)` filtered where Status NOT IN (Withdrawn, Refused) and IsDeleted = false
    - _Requirements: 1.6, 3.5, 5.3, 8.2, 9.3, 13.1_

  - [x] 2.2 Register entities in DbContext and create migration
    - Add DbSet properties for all planning entities in the existing `ApplicationDbContext`
    - Create EF Core migration for the planning module schema
    - _Requirements: 1.1, 13.1_

  - [x] 2.3 Configure PlanningFeeSettings options
    - Create `PlanningFeeSettings` class with `ApprovalThreshold` property (default 10000)
    - Register in `appsettings.json` and wire via `IOptions<PlanningFeeSettings>`
    - _Requirements: 8.3_

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Planning Application commands and queries
  - [x] 4.1 Implement CreateApplicationCommand and handler
    - Validate OpportunityId references an existing LandOpportunity with Status = Acquired
    - Validate no active application exists for the same opportunity (Status not in Withdrawn, Refused)
    - Validate Description (10-2000 chars), ApplicationType (valid enum), CouncilName (3-200 chars)
    - Create entity with Status = PreApplication, assign new Guid, set CreatedAt/CreatedBy
    - Return created DTO via ApiResponse envelope
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 4.2 Write property tests for application creation
    - **Property 5: Application Creation Requires Acquired Opportunity**
    - Generate random LandOpportunity status values; verify only Acquired allows creation
    - **Property 6: Active Application Uniqueness Per Opportunity**
    - Generate random existing application statuses; verify conflict detection
    - **Property 7: Application Field Validation Boundaries**
    - Generate random-length strings for Description/CouncilName; verify boundary enforcement
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6**

  - [x] 4.3 Implement TransitionApplicationStatusCommand and handler
    - Validate transition via `IPlanningStatusStateMachine.CanTransition()`
    - Enforce conditional data: ApplicationReference (5-50 chars) for Submitted, DecisionDate (not future) for Approved/ApprovedWithConditions/Refused, WithdrawalReason (10+ chars) for Withdrawn
    - Log audit trail with previous/new status, user, timestamp
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 4.4 Write property tests for conditional transition data
    - **Property 8: Conditional Transition Data Requirements**
    - Generate random ApplicationReference lengths, DecisionDates, WithdrawalReason lengths
    - Verify acceptance/rejection boundaries for each transition type
    - **Validates: Requirements 2.4, 2.5, 2.6**

  - [x] 4.5 Implement UpdateApplicationCommand and handler
    - Allow updating Description, ApplicationType, CouncilName, TargetDecisionDate
    - Validate same field rules as creation
    - Record audit trail
    - _Requirements: 1.4, 13.1_

  - [x] 4.6 Implement GetApplicationsQuery with filtering, sorting, search, and pagination
    - Support filtering by Status, ApplicationType, CouncilName, date range on SubmissionDate
    - Support sorting by Description, CreatedAt, SubmissionDate, TargetDecisionDate, Status
    - Support free-text search across Description, ApplicationReference, CouncilName, LandOpportunity Name
    - Use AsNoTracking with projections, return PagedResult<ApplicationListItemDto>
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.7 Write property tests for filter and sort correctness
    - **Property 19: Filter Result Consistency**
    - Generate random filter combinations; verify all returned items satisfy predicates
    - **Property 20: Sort Order Correctness**
    - Generate random sort field/direction; verify consecutive pair ordering
    - **Validates: Requirements 3.2, 3.3**

  - [x] 4.8 Implement GetApplicationByIdQuery
    - Return full detail including conditions, documents, fees, milestones, council contact, and LandOpportunity summary
    - _Requirements: 3.6_

  - [x] 4.9 Implement GetApplicationsByOpportunityQuery
    - Return summary DTO for Land Acquisition module integration
    - _Requirements: 19.3_

- [x] 5. Implement Council Contact commands
  - [x] 5.1 Implement CreateCouncilContactCommand and UpdateCouncilContactCommand
    - Validate CouncilName (3-200), PlanningOfficerName (2-150), Email (valid format), Phone (7-20), Address (10-500)
    - Enforce one CouncilContact per application
    - Record audit trail for creation and updates
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Implement Planning Conditions commands and queries
  - [x] 6.1 Implement CreateConditionCommand and handler
    - Validate parent application has Status = ApprovedWithConditions
    - Validate ConditionNumber (positive, unique within application), Description (10-1000 chars), ConditionType (valid enum)
    - Create with Status = Outstanding
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.2 Write property test for condition creation
    - **Property 9: Condition Creation Requires ApprovedWithConditions Parent**
    - Generate random parent application statuses; verify only ApprovedWithConditions allows creation
    - **Validates: Requirements 5.1, 5.2**

  - [x] 6.3 Implement TransitionConditionStatusCommand and handler
    - Validate via `IConditionStatusStateMachine.CanTransition()`
    - When transitioning to Discharged, require DischargeDate (past/present UTC) and DischargeReference (3-50 chars)
    - When all conditions for application reach Discharged, raise `AllConditionsDischargedDomainEvent`
    - _Requirements: 5.4, 5.5, 5.6_

  - [x] 6.4 Implement GetConditionsQuery with pagination, filtering by Status and ConditionType
    - _Requirements: 5.7_

- [x] 7. Implement Planning Appeals commands and queries
  - [x] 7.1 Implement CreateAppealCommand and handler
    - Validate parent application has Status = Refused
    - Validate no active appeal exists (Status not in Dismissed, Closed)
    - Validate AppealGrounds (50-5000 chars), AppealType (valid enum)
    - Create with Status = Lodged, LodgedDate = UTC now
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 7.2 Write property test for appeal creation
    - **Property 10: Appeal Creation Requires Refused Parent and No Active Appeal**
    - Generate random parent statuses and existing appeal statuses
    - Verify correct acceptance/rejection behavior
    - **Validates: Requirements 6.1, 6.2, 6.4**

  - [x] 7.3 Implement TransitionAppealStatusCommand and handler
    - Validate via `IAppealStatusStateMachine.CanTransition()`
    - When transitioning to Allowed/Dismissed, require DecisionDate and DecisionSummary (20+ chars)
    - When Allowed, raise `AppealAllowedDomainEvent` with AppealOutcomeType
    - _Requirements: 6.5, 6.6, 6.7_

  - [x] 7.4 Implement AppealAllowedEventHandler
    - Transition parent application to Approved or ApprovedWithConditions based on AppealOutcomeType
    - Send notification to Planning_Manager and Legal_Compliance_Officer
    - _Requirements: 6.6, 6.8_

  - [x] 7.5 Write property test for appeal cascade
    - **Property 11: Appeal Allowed Cascades to Parent Application Status**
    - Generate random AppealOutcomeType; verify correct parent status transition
    - **Validates: Requirements 6.6**

  - [x] 7.6 Implement GetAppealsQuery with pagination
    - _Requirements: 6.5_

- [x] 8. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Planning Documents commands and queries
  - [x] 9.1 Implement UploadDocumentCommand and handler
    - Validate DocumentType (valid enum), file size (max 50MB), content type (PDF, DOCX, XLSX, PNG, JPG, DWG, DXF)
    - Store file via `IFileStorageService`, save metadata with UploadedAt = UTC now
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 9.2 Implement GetDocumentsQuery with pagination and DocumentType filter
    - _Requirements: 7.4_

  - [x] 9.3 Implement DownloadDocumentQuery
    - Return file content with correct Content-Type header
    - _Requirements: 7.5_

  - [x] 9.4 Implement DeleteDocumentCommand (soft-delete)
    - Enforce Admin_Support or Planning_Manager role
    - Record deletion in audit trail
    - _Requirements: 7.6_

- [x] 10. Implement Planning Fees commands and queries
  - [x] 10.1 Implement CreateFeeCommand and handler
    - Validate Amount (positive, precision 18,2), Currency (valid ISO 4217 3-letter), FeeType (valid enum), Description
    - Create with PaymentStatus = Pending
    - If Amount exceeds configured threshold, raise `FeeRequiresApprovalDomainEvent`
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 10.2 Implement TransitionFeeStatusCommand and handler
    - Validate via `IFeeStatusStateMachine.CanTransition()`
    - Enforce threshold rule: amounts above threshold must go through AwaitingApproval → Approved → Paid
    - _Requirements: 8.4, 8.3_

  - [x] 10.3 Write property test for fee threshold enforcement
    - **Property 14: Fee Threshold Enforcement**
    - Generate random fee amounts above/below threshold; verify correct transition paths
    - **Validates: Requirements 8.3**

  - [x] 10.4 Implement ApproveFeeCommand and handler
    - Restricted to Finance_Director role
    - Record ApprovedBy, ApprovedAt, ApprovalNotes
    - _Requirements: 8.5_

  - [x] 10.5 Implement GetFeesQuery and GetFeeSummaryQuery
    - GetFeesQuery: paginated list filterable by FeeType and PaymentStatus
    - GetFeeSummaryQuery: totals grouped by FeeType and PaymentStatus
    - _Requirements: 8.6, 8.7_

  - [x] 10.6 Write property test for fee aggregation
    - **Property 15: Fee Aggregation Correctness**
    - Generate random sets of fees; verify group sums equal mathematical sum of matching amounts
    - **Validates: Requirements 8.6**

- [x] 11. Implement Planning Milestones commands and queries
  - [x] 11.1 Implement CreateMilestoneCommand and handler
    - Validate MilestoneType (valid enum), TargetDate (valid date)
    - Enforce uniqueness of MilestoneType within application
    - Create with Status = Pending
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 11.2 Write property test for milestone uniqueness
    - **Property 13: Milestone Type Uniqueness Per Application**
    - Generate duplicate MilestoneType values; verify rejection
    - **Validates: Requirements 9.3**

  - [x] 11.3 Implement CompleteMilestoneCommand and handler
    - Record ActualDate, update Status to Completed
    - Calculate VarianceDays = (ActualDate - TargetDate).Days
    - _Requirements: 9.4_

  - [x] 11.4 Write property test for variance calculation
    - **Property 12: Milestone Variance Calculation**
    - Generate random TargetDate/ActualDate pairs; verify VarianceDays = (ActualDate - TargetDate).Days
    - **Validates: Requirements 9.4**

  - [x] 11.5 Implement GetMilestonesQuery ordered by TargetDate ascending
    - _Requirements: 9.7_

  - [x] 11.6 Implement milestone overdue detection logic
    - When current date exceeds TargetDate and Status is Pending, mark as Overdue
    - Raise `MilestoneOverdueDomainEvent` and send notification
    - _Requirements: 9.5, 9.6_

- [x] 12. Implement Dashboard and KPI queries
  - [x] 12.1 Implement GetDashboardMetricsQuery
    - Return: applications count grouped by Status, Average Decision Time, Approval Rate, Appeal Success Rate, Outstanding Conditions count, Overdue Milestones count, recent activity (last 10 status changes), applications approaching TargetDecisionDate within 14 days
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 12.2 Write property tests for KPI calculations
    - **Property 16: Approval Rate Calculation**
    - Generate random sets of applications with final decisions; verify percentage formula
    - **Property 17: Appeal Success Rate Calculation**
    - Generate random sets of appeals with final decisions; verify percentage formula
    - **Validates: Requirements 11.3, 11.4**

- [x] 13. Implement domain event handlers and notifications
  - [x] 13.1 Implement AllConditionsDischargedEventHandler
    - Send notification to Planning_Manager when all conditions are discharged
    - _Requirements: 5.6_

  - [x] 13.2 Implement MilestoneOverdueEventHandler
    - Send notification to Planning_Manager for overdue milestones
    - _Requirements: 9.6, 12.5_

  - [x] 13.3 Implement ApplicationStatusChangedEventHandler for notifications
    - Notify Planning_Manager and Acquisition_Manager on Approved/ApprovedWithConditions/Refused
    - Notify Finance_Director when fee requires approval
    - Notify Legal_Compliance_Officer for condition due dates within 14 days
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 14. Implement API controllers
  - [x] 14.1 Create PlanningApplicationsController
    - POST create, GET list, GET by id, PUT status transition, GET by opportunity
    - Apply `[Authorize(Roles = "...")]` per endpoint as per RBAC requirements
    - _Requirements: 1.1, 2.1, 3.1, 3.6, 10.1, 10.5, 19.3_

  - [x] 14.2 Create PlanningConditionsController
    - POST create, PUT status transition, GET list by application
    - Restrict to Legal_Compliance_Officer, Admin_Support
    - _Requirements: 5.1, 5.4, 5.7, 10.2_

  - [x] 14.3 Create PlanningAppealsController
    - POST create, PUT status transition, GET list by application
    - Restrict to Legal_Compliance_Officer
    - _Requirements: 6.1, 6.5, 10.3_

  - [x] 14.4 Create PlanningDocumentsController
    - POST upload, GET list, GET download, DELETE soft-delete
    - Restrict upload/delete to Admin_Support, Planning_Manager
    - _Requirements: 7.1, 7.4, 7.5, 7.6_

  - [x] 14.5 Create PlanningFeesController
    - POST create, PUT status transition, PUT approve, GET list, GET summary
    - Restrict approval to Finance_Director
    - _Requirements: 8.1, 8.4, 8.5, 8.6, 8.7, 10.4_

  - [x] 14.6 Create PlanningMilestonesController
    - POST create, PUT complete, GET list by application
    - Restrict to Planning_Manager
    - _Requirements: 9.1, 9.4, 9.7_

  - [x] 14.7 Create PlanningDashboardController
    - GET dashboard metrics
    - Restrict to Planning_Manager
    - _Requirements: 11.1_

  - [x] 14.8 Create CouncilContactController (or nested within PlanningApplicationsController)
    - POST create/update council contact
    - Restrict to Planning_Manager
    - _Requirements: 4.1, 4.3_

- [x] 15. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implement frontend models and services
  - [x] 16.1 Create TypeScript models
    - Create `planning-application.model.ts`, `planning-condition.model.ts`, `planning-appeal.model.ts`, `planning-document.model.ts`, `planning-fee.model.ts`, `planning-milestone.model.ts`, `council-contact.model.ts`, `dashboard-metrics.model.ts` in `client-app/src/app/features/planning-approvals/models/`
    - Define typed interfaces matching backend DTOs
    - _Requirements: 14.2, 15.1, 17.1_

  - [x] 16.2 Create Angular HTTP services
    - Create `planning-application.service.ts`, `planning-condition.service.ts`, `planning-appeal.service.ts`, `planning-document.service.ts`, `planning-fee.service.ts`, `planning-milestone.service.ts` in `services/`
    - Each service wraps API calls with correct endpoints, return typed Observables
    - _Requirements: 14.3, 17.2_

- [x] 17. Implement NgRx state management
  - [x] 17.1 Create application store slice
    - Create `application.actions.ts` — load, create, update, delete, transition status actions with success/failure variants
    - Create `application.state.ts` — define state interface using EntityState from @ngrx/entity
    - Create `application.reducer.ts` — handle all actions with EntityAdapter for normalized state
    - Create `application.selectors.ts` — memoized selectors for: all applications, by status (pipeline grouping), by id, filtered lists, loading/error state
    - Create `application.effects.ts` — handle API calls, dispatch success/failure, show toast on errors
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 17.2 Create dashboard store slice
    - Create `dashboard.actions.ts`, `dashboard.state.ts`, `dashboard.reducer.ts`, `dashboard.selectors.ts`, `dashboard.effects.ts`
    - Selectors for KPIs, pipeline summary, recent activity, upcoming deadlines
    - _Requirements: 17.3, 18.1_

- [x] 18. Implement frontend containers and pages
  - [x] 18.1 Create PlanningDashboardContainer
    - Load KPI cards (Average Decision Time, Approval Rate, Appeal Success Rate, Outstanding Conditions)
    - Pipeline summary chart showing count per status
    - Recent activity section (last 5 actions)
    - Upcoming deadlines section (milestones due within 14 days and overdue)
    - Skeleton loading placeholders while data loads
    - Refresh data on navigation
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

  - [x] 18.2 Create PlanningPipelineContainer
    - Load all applications grouped by status into columns (Kanban view)
    - Display ApplicationCard per application (Description, ApplicationType, CouncilName, LandOpportunity Name, days since last status change)
    - Skeleton loading state and error state with retry button
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 18.3 Create ApplicationDetailContainer
    - Display header with application summary (Description, ApplicationType, ApplicationReference, Status, CouncilName, LandOpportunity Name, SubmissionDate, TargetDecisionDate)
    - Status progress indicator showing lifecycle position
    - Tabs: Overview, Conditions, Documents, Fees, Timeline, Appeals, Activity
    - Contextual action buttons based on status and user role
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 18.4 Create ApplicationCreateContainer with reactive form
    - Typed FormGroup for OpportunityId, ApplicationType, Description, CouncilName
    - Inline validation messages on blur/submit
    - Disable submit until valid
    - Map server-side validation errors to form fields
    - Unsaved changes guard with confirmation dialog
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 19. Implement frontend presentational components
  - [x] 19.1 Create ApplicationCardComponent
    - Render single application card with Description, ApplicationType badge, CouncilName, LandOpportunity Name, days since last change
    - _Requirements: 14.2_

  - [x] 19.2 Create PipelineColumnComponent
    - Render a status column header with count and list of ApplicationCards
    - _Requirements: 14.1_

  - [x] 19.3 Create StatusProgressIndicatorComponent
    - Visual step indicator showing application lifecycle position
    - Highlight current status, mark completed steps, grey future steps
    - _Requirements: 15.3_

  - [x] 19.4 Create ConditionListComponent
    - Tabular display of conditions with status badges, filtering by Status/ConditionType
    - _Requirements: 15.2_

  - [x] 19.5 Create AppealPanelComponent
    - Display appeal details, status, grounds, decision summary
    - _Requirements: 15.2_

  - [x] 19.6 Create FeeTableComponent
    - Tabular display of fees with status badges, totals summary
    - _Requirements: 15.2_

  - [x] 19.7 Create MilestoneTimelineComponent
    - Visual timeline of milestones with overdue highlights and variance display
    - _Requirements: 15.2_

  - [x] 19.8 Create KpiCardComponent
    - Metric card with label, value, and optional trend indicator
    - _Requirements: 18.1_

  - [x] 19.9 Create DocumentListComponent
    - List documents with type badges, upload date, file size, download/delete actions
    - _Requirements: 15.2_

  - [x] 19.10 Create CouncilContactFormComponent
    - Reactive form for council contact details with validation
    - _Requirements: 4.1, 4.2, 16.1_

- [x] 20. Implement frontend routing and guards
  - [x] 20.1 Create planning-approvals.routes.ts with lazy-loaded routes
    - Dashboard, pipeline, application detail, create, edit routes
    - Apply `PlanningRoleGuard` for role-based access
    - _Requirements: 10.5, 10.6, 10.7_

  - [x] 20.2 Create PlanningRoleGuard
    - Check user has appropriate planning role before allowing route activation
    - Redirect unauthorized users
    - _Requirements: 10.6, 10.7_

- [x] 21. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 22. Integration and wiring
  - [x] 22.1 Register domain services and event handlers in DI
    - Register state machines as singletons
    - Register event handlers as scoped
    - Register PlanningFeeSettings configuration
    - _Requirements: 2.1, 5.4, 6.5, 8.3, 8.4_

  - [x] 22.2 Wire frontend module into application routing
    - Add planning-approvals lazy route to main app routes
    - Add navigation link to planning module in sidebar/menu
    - Register NgRx feature stores
    - _Requirements: 14.1, 17.1_

  - [x] 22.3 Implement soft-delete query filter verification
    - Verify all planning entities have `HasQueryFilter(x => !x.IsDeleted)` applied
    - Verify no query returns soft-deleted records
    - _Requirements: 3.5, 13.1_

  - [x] 22.4 Write property test for soft-delete exclusion
    - **Property 18: Soft-Delete Exclusion**
    - Generate records with IsDeleted = true and false; verify queries never return deleted records
    - **Validates: Requirements 3.5**

- [x] 23. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties defined in the design document
- Unit tests validate specific examples and edge cases
- The backend follows Clean Architecture + CQRS patterns established by the Land Acquisition module
- The frontend follows the Angular 20 standalone component pattern with NgRx, matching existing `land-acquisition` feature structure
- FsCheck is used for property-based testing on the .NET side
- All API endpoints follow the `api/v1/` versioning pattern with ApiResponse envelope

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.8"] },
    { "id": 2, "tasks": ["1.3", "2.1"] },
    { "id": 3, "tasks": ["1.4", "1.5", "1.6", "1.7", "2.2", "2.3"] },
    { "id": 4, "tasks": ["4.1", "5.1", "6.1", "7.1", "9.1", "10.1", "11.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.5", "6.2", "6.3", "7.2", "7.3", "9.2", "9.3", "9.4", "10.2", "10.4", "11.2", "11.3"] },
    { "id": 6, "tasks": ["4.4", "4.6", "4.8", "4.9", "6.4", "7.4", "7.5", "7.6", "10.3", "10.5", "10.6", "11.4", "11.5", "11.6"] },
    { "id": 7, "tasks": ["4.7", "12.1", "13.1", "13.2", "13.3"] },
    { "id": 8, "tasks": ["12.2", "14.1", "14.2", "14.3", "14.4", "14.5", "14.6", "14.7", "14.8"] },
    { "id": 9, "tasks": ["16.1", "16.2"] },
    { "id": 10, "tasks": ["17.1", "17.2"] },
    { "id": 11, "tasks": ["18.1", "18.2", "18.3", "18.4", "19.1", "19.2", "19.8"] },
    { "id": 12, "tasks": ["19.3", "19.4", "19.5", "19.6", "19.7", "19.9", "19.10"] },
    { "id": 13, "tasks": ["20.1", "20.2"] },
    { "id": 14, "tasks": ["22.1", "22.2", "22.3"] },
    { "id": 15, "tasks": ["22.4"] }
  ]
}
```
