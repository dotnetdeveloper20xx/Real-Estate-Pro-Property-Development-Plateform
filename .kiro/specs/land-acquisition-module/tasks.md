# Implementation Plan: Land Acquisition Module

## Overview

This plan implements the Land Acquisition Module — the first business module of BuildEstate Pro. It covers the complete lifecycle from domain entities and state machines through CQRS command/query handlers, API controllers, Angular frontend (NgRx store, pages, components), and property-based tests. Tasks are ordered so each builds on the previous, starting with domain foundations and ending with integration wiring.

## Tasks

- [x] 1. Domain layer — Entities, Enums, and Interfaces
  - [x] 1.1 Create domain enums for Land Acquisition
    - Create `DueDiligenceType`, `DueDiligenceStatus`, `OfferStatus`, `ContractStatus`, `OwnershipType`, `AcquisitionStatus`, `FeasibilityScenario`, and `DocumentType` enums in `BuildEstate.Domain/Enums/`
    - Verify `OpportunityStatus` enum already exists; update if needed
    - _Requirements: 3.1, 5.2, 5.3, 7.3, 8.2, 4.2, 10.1, 6.4, 9.2_

  - [x] 1.2 Create domain entities for Land Acquisition
    - Create `LandOpportunity`, `LandOwner`, `DueDiligence`, `Offer`, `Contract`, `Document`, `LandAcquisitionRecord`, `FeasibilityAssessment`, `ApprovalRequest`, and `Notification` entities in `BuildEstate.Domain/Entities/LandAcquisition/`
    - All entities inherit `BaseEntity` (Id, audit columns, soft-delete, RowVersion)
    - Include navigation properties and collection initializers as per design
    - _Requirements: 1.1, 4.1, 5.1, 7.1, 8.1, 9.1, 10.1, 6.1, 11.1, 19.5_

  - [x] 1.3 Create domain exception classes
    - Create `DomainException` abstract base and derived exceptions: `InvalidStateTransitionException`, `DuplicateEntityException`, `ApprovalRequiredException`, `BusinessRuleViolationException`, `EntityNotFoundException` in `BuildEstate.Domain/Exceptions/`
    - _Requirements: 3.2, 11.5, 1.3, 10.5_

  - [x] 1.4 Create state machine interfaces
    - Create `IOpportunityStateMachine`, `IOfferStateMachine`, `IDueDiligenceStateMachine`, `IContractStateMachine` interfaces in `BuildEstate.Domain/Services/`
    - Each interface defines `CanTransition`, `GetPermittedTransitions`, and `ValidateTransition` methods
    - _Requirements: 3.1, 5.3, 7.3, 8.2_

  - [x] 1.5 Create service interfaces for file storage and notifications
    - Create `IFileStorageService` interface with `UploadAsync`, `DownloadAsync`, `DeleteAsync` methods
    - Create `INotificationService` interface with `SendAsync`, `SendToRoleAsync` methods
    - Place in `BuildEstate.Domain/Services/` or `BuildEstate.Application/Common/Interfaces/`
    - _Requirements: 9.1, 9.5, 19.1, 19.2, 19.3, 19.4_

- [x] 2. Infrastructure layer — EF Core configurations and state machines
  - [x] 2.1 Create EF Core entity configurations for all Land Acquisition entities
    - Create `LandOpportunityConfiguration`, `LandOwnerConfiguration`, `DueDiligenceConfiguration`, `OfferConfiguration`, `ContractConfiguration`, `DocumentConfiguration`, `LandAcquisitionConfiguration`, `FeasibilityAssessmentConfiguration`, `ApprovalRequestConfiguration`, `NotificationConfiguration` in `BuildEstate.Infrastructure/Persistence/Configurations/LandAcquisition/`
    - Configure table names, column constraints, indexes, unique constraints, FK relationships, query filters, precision, and row version
    - _Requirements: 1.2, 1.3, 2.5, 4.2, 6.2, 7.2, 8.3, 9.3, 10.2, 10.5, 20.1_

  - [x] 2.2 Register entity DbSets in BuildEstateDbContext
    - Add `DbSet<T>` properties for all 10 Land Acquisition entities
    - Apply configurations via `OnModelCreating` or `IEntityTypeConfiguration` assembly scanning
    - _Requirements: 1.1, 2.1_

  - [x] 2.3 Create EF Core migration for Land Acquisition schema
    - Generate migration with all tables, indexes, constraints, and relationships
    - Verify migration applies cleanly against SQL Server
    - _Requirements: 1.1, 2.1_

  - [x] 2.4 Implement OpportunityStateMachine service
    - Implement `IOpportunityStateMachine` in `BuildEstate.Infrastructure/Persistence/Services/OpportunityStateMachine.cs`
    - Define the transition map: Identified→InitialReview, InitialReview→{DueDiligence,Withdrawn}, DueDiligence→{OfferMade,Withdrawn}, OfferMade→{UnderContract,Withdrawn}, UnderContract→{Acquired,Withdrawn}
    - Throw `InvalidStateTransitionException` for invalid transitions with permitted list in message
    - _Requirements: 3.1, 3.2_

  - [x] 2.5 Implement OfferStateMachine service
    - Implement `IOfferStateMachine` with transitions: UnderReview→{Accepted,Rejected,CounterOffered,Expired}, CounterOffered→{UnderReview,Accepted,Rejected}
    - _Requirements: 7.3_

  - [x] 2.6 Implement DueDiligenceStateMachine service
    - Implement `IDueDiligenceStateMachine` with transitions: Pending→InProgress, InProgress→{Completed,Failed}
    - _Requirements: 5.3_

  - [x] 2.7 Implement ContractStateMachine service
    - Implement `IContractStateMachine` with transitions: Draft→UnderLegalReview, UnderLegalReview→{Approved,Rejected}, Approved→Signed, Signed→Exchanged, Exchanged→Completed
    - _Requirements: 8.2_

  - [x] 2.8 Implement FileStorageService and NotificationService
    - Implement `IFileStorageService` (local disk or Azure Blob Storage abstraction) in `BuildEstate.Infrastructure/Services/FileStorageService.cs`
    - Implement `INotificationService` (persist Notification entity to DB) in `BuildEstate.Infrastructure/Services/NotificationService.cs`
    - _Requirements: 9.1, 9.5, 19.1, 19.2, 19.3, 19.4, 19.5_

  - [x] 2.9 Register all Land Acquisition services in DI container
    - Register state machines, file storage, and notification services with appropriate lifetimes (Scoped for DB-bound, Singleton for stateless)
    - _Requirements: 3.1, 5.3, 7.3, 8.2, 9.1, 19.1_

- [x] 3. Checkpoint — Domain and infrastructure foundations
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Application layer — Opportunity CQRS (Commands, Queries, Validators, DTOs)
  - [x] 4.1 Create Opportunity DTOs and AutoMapper profiles
    - Create `OpportunityDto`, `OpportunityDetailDto`, `OpportunityListItemDto`, `CreateOpportunityDto`, `UpdateOpportunityDto` in `BuildEstate.Application/Features/LandAcquisition/Opportunities/DTOs/`
    - Create mapping profile in `Mappings/OpportunityMappingProfile.cs`
    - _Requirements: 1.1, 2.1, 2.6_

  - [x] 4.2 Implement CreateOpportunity command, validator, and handler
    - Create `CreateOpportunityCommand`, `CreateOpportunityCommandValidator` (Name 3-200, Location 3-500, LandSize > 0), and `CreateOpportunityCommandHandler`
    - Handler checks for duplicate Name+Location, sets Status=Identified, CreatedAt=UTC, CreatedBy=user
    - Return created DTO in ApiResponse envelope
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 4.3 Implement UpdateOpportunity command, validator, and handler
    - Support updating Name, Location, LandSize, Source, ExpectedAcquisition
    - Same validation rules as create; handler records audit via BaseEntity columns
    - _Requirements: 2.6, 1.2_

  - [x] 4.4 Implement TransitionOpportunityStatus command and handler
    - Accept OpportunityId and target status; use `IOpportunityStateMachine` to validate transition
    - If target is Withdrawn, require WithdrawalReason (min 10 chars)
    - Check for pending ApprovalRequests before allowing transition
    - Check DD completion gate before DueDiligence→OfferMade
    - Dispatch domain event on success
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.4, 5.5, 11.5_

  - [x] 4.5 Implement DeleteOpportunity command and handler (soft delete)
    - Set IsDeleted=true, DeletedAt=UTC, DeletedBy=user
    - _Requirements: 2.5_

  - [x] 4.6 Implement GetOpportunityById query and handler
    - Return `OpportunityDetailDto` with eager-loaded LandOwner, DueDiligences, Offers, Documents, Contract, FeasibilityAssessment
    - Use AsNoTracking for read-only
    - _Requirements: 2.6_

  - [x] 4.7 Implement GetOpportunities query and handler (paginated, filtered, sorted, searchable)
    - Accept pagination (pageNumber, pageSize), filter (Status, Location, Source, date range), sort (Name, CreatedAt, LandSize, ExpectedAcquisition, Status), and free-text search (Name, Location, Source)
    - Return paged list with PaginationMeta
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 4.8 Write property tests for Opportunity state machine (Properties 1, 5, 17, 18)
    - **Property 1: Opportunity State Machine Correctness** — generate all (from, to) pairs, verify only valid transitions accepted
    - **Property 5: Due Diligence Completion Gate** — generate random DD completion scenarios, verify gate logic
    - **Property 17: Pending Approval Blocks Transitions** — generate pending approval scenarios
    - **Property 18: Threshold-Based Approval Trigger** — generate offer amounts vs threshold
    - **Validates: Requirements 3.1, 3.2, 5.4, 5.5, 11.1, 11.5**

  - [x] 4.9 Write property tests for pagination, filtering, sorting, and search (Properties 12-16)
    - **Property 12: Pagination Invariants** — random N, pageNumber, pageSize
    - **Property 13: Filter Predicate Correctness** — random filter criteria
    - **Property 14: Sort Order Invariant** — random sort fields and directions
    - **Property 15: Soft-Delete Exclusion Invariant** — verify deleted records excluded
    - **Property 16: Free-Text Search Correctness** — random search terms
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 5. Application layer — Supporting entity CQRS (LandOwner, DueDiligence, Offers)
  - [x] 5.1 Implement LandOwner commands, validators, queries, and DTOs
    - CreateLandOwner (validate Name 2-200, ContactDetails 5-500, OwnershipType enum)
    - UpdateLandOwner
    - DTOs and mapping profile
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.2 Implement DueDiligence commands, validators, queries, and DTOs
    - CreateDueDiligence (validate Type enum, set Status=Pending)
    - TransitionDueDiligenceStatus (use `IDueDiligenceStateMachine`; set ReportDate on Completed/Failed)
    - GetDueDiligenceByOpportunity (paginated, filterable by Type and Status)
    - DTOs and mapping profile
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7_

  - [x] 5.3 Implement Offer commands, validators, queries, and DTOs
    - CreateOffer (validate Amount > 0, Currency ISO 4217 3-letter, ValidUntil future date; set OfferDate=UTC now, Status=UnderReview)
    - TransitionOfferStatus (use `IOfferStateMachine`; cascade Accepted→auto-transition opportunity to UnderContract; store CounterOfferAmount and OriginalOfferId)
    - GetOffersByOpportunity (ordered by OfferDate desc)
    - DTOs and mapping profile
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7_

  - [x] 5.4 Write property tests for DueDiligence and Offer state machines (Properties 2, 3)
    - **Property 2: Due Diligence State Machine Correctness** — all (from, to) DD status pairs
    - **Property 3: Offer State Machine Correctness** — all (from, to) Offer status pairs
    - **Validates: Requirements 5.3, 7.3**

  - [x] 5.5 Write property test for input validation (Property 7)
    - **Property 7: Input Validation Correctness** — generate random inputs crossing constraint boundaries; verify validators accept/reject correctly
    - **Validates: Requirements 1.2, 3.4, 4.2, 6.2, 7.2, 8.3, 9.3, 10.2**

- [x] 6. Application layer — Contract, Document, Feasibility, Acquisition, Approval CQRS
  - [x] 6.1 Implement Contract commands, validators, queries, and DTOs
    - CreateContract (only if opportunity has accepted offer; set Status=Draft; store solicitor details)
    - TransitionContractStatus (use `IContractStateMachine`; require DepositAmount when Exchanged)
    - DTOs and mapping profile
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 6.2 Implement Document commands, validators, queries, and DTOs
    - UploadDocument (validate DocType enum, file size ≤ 25MB, allowed content types; use IFileStorageService; set UploadedAt=UTC)
    - GetDocumentsByOpportunity (paginated, filterable by DocType)
    - DownloadDocument (stream file with correct content-type header)
    - DeleteDocument (restrict to AdminSupport role; record audit)
    - DTOs and mapping profile
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 6.3 Implement Feasibility commands, validators, queries, and DTOs
    - CreateOrUpdateFeasibility (validate non-negative decimals; calculate TotalCosts, EstimatedProfit, RoiPercentage)
    - GetFeasibilityByOpportunity
    - Mark assessment as ready for review → trigger notification to Finance Director
    - Support BestCase/Expected/WorstCase scenarios
    - DTOs and mapping profile
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.4 Implement Acquisition commands, validators, queries, and DTOs
    - CreateAcquisition (validate PurchasePrice > 0, CompletionDate past/present, RegistryRef 3-50 chars; enforce one active per opportunity; set Status=Completed)
    - TransitionAcquisitionStatus (Completed→Registered; cascade to opportunity Acquired)
    - DTOs and mapping profile
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 6.5 Implement Approval commands, validators, queries, and DTOs
    - CreateApprovalRequest (auto-triggered when offer exceeds threshold; set Status=Pending; notify Finance Director)
    - ApproveOrReject (record approver, timestamp, notes or rejection reason; notify Acquisition Manager on rejection; unblock opportunity transitions)
    - GetPendingApprovals
    - DTOs and mapping profile
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 6.6 Write property tests for Contract state machine and ROI calculation (Properties 4, 6)
    - **Property 4: Contract State Machine Correctness** — all (from, to) Contract status pairs
    - **Property 6: ROI Calculation Correctness** — generate random non-negative decimals, verify formula
    - **Validates: Requirements 8.2, 6.1, 6.3**

  - [x] 6.7 Write property tests for acquisition and duplicate detection (Properties 8, 9, 20, 21)
    - **Property 8: Accepted Offer Cascades to Under Contract**
    - **Property 9: Registered Acquisition Cascades to Acquired**
    - **Property 20: One Acquisition Per Opportunity**
    - **Property 21: Duplicate Opportunity Detection**
    - **Validates: Requirements 7.5, 10.4, 10.5, 1.3**

- [x] 7. Application layer — Dashboard and Notification handlers
  - [x] 7.1 Implement GetDashboardMetrics query and handler
    - Calculate OpportunitiesByStatus, AverageAcquisitionCycleDays, ConversionRatePercent, DueDiligencePassRatePercent, TotalEvaluated
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 7.2 Implement GetRecentActivity query and handler
    - Return last 10 status changes across all opportunities with timestamps and user names
    - _Requirements: 13.6_

  - [x] 7.3 Implement notification domain event handlers
    - Handle OpportunityAcquired → notify all land acquisition roles
    - Handle OfferExpired → notify creating Acquisition Manager
    - Handle DueDiligenceFailed → notify associated Acquisition Manager
    - Handle ApprovalCreated → notify Finance Director
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

  - [x] 7.4 Write property test for dashboard metrics (Property 11)
    - **Property 11: Dashboard Metrics Correctness** — generate random opportunity/DD datasets, verify calculations
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**

  - [x] 7.5 Write property test for audit log immutability (Property 19)
    - **Property 19: Audit Log Immutability** — verify modification/deletion attempts on AuditLog records throw InvalidOperationException
    - **Validates: Requirements 20.3**

- [x] 8. Checkpoint — Application layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. API layer — Controllers and authorization
  - [x] 9.1 Create OpportunitiesController
    - POST `/api/v1/opportunities` — Create (AcquisitionManager, AdminSupport)
    - GET `/api/v1/opportunities` — List with pagination/filter/sort (All land acquisition roles)
    - GET `/api/v1/opportunities/{id}` — Detail (All land acquisition roles)
    - PUT `/api/v1/opportunities/{id}` — Update (AcquisitionManager, AdminSupport)
    - DELETE `/api/v1/opportunities/{id}` — Soft delete (AcquisitionManager, AdminSupport)
    - PATCH `/api/v1/opportunities/{id}/status` — Transition (AcquisitionManager, AdminSupport)
    - _Requirements: 1.1, 2.1, 2.6, 3.1, 12.1, 12.5_

  - [x] 9.2 Create LandOwnersController
    - POST `/api/v1/opportunities/{id}/owners` — Create (AcquisitionManager, AdminSupport)
    - PUT `/api/v1/opportunities/{id}/owners/{ownerId}` — Update (AcquisitionManager, AdminSupport)
    - _Requirements: 4.1, 4.3, 12.1_

  - [x] 9.3 Create DueDiligenceController
    - GET `/api/v1/opportunities/{id}/due-diligence` — List (All roles)
    - POST `/api/v1/opportunities/{id}/due-diligence` — Create (LegalComplianceOfficer, AdminSupport)
    - PATCH `/api/v1/opportunities/{id}/due-diligence/{ddId}/status` — Transition (LegalComplianceOfficer, AdminSupport)
    - _Requirements: 5.1, 5.3, 5.7, 12.2_

  - [x] 9.4 Create OffersController
    - GET `/api/v1/opportunities/{id}/offers` — List (All roles)
    - POST `/api/v1/opportunities/{id}/offers` — Create (AcquisitionManager, AdminSupport)
    - PATCH `/api/v1/opportunities/{id}/offers/{offerId}/status` — Transition (AcquisitionManager, AdminSupport)
    - _Requirements: 7.1, 7.3, 7.6, 12.1_

  - [x] 9.5 Create ContractsController
    - POST `/api/v1/opportunities/{id}/contracts` — Create (LegalComplianceOfficer, AdminSupport)
    - PATCH `/api/v1/opportunities/{id}/contracts/{contractId}/status` — Transition (LegalComplianceOfficer, AdminSupport)
    - _Requirements: 8.1, 8.2, 12.2_

  - [x] 9.6 Create DocumentsController
    - GET `/api/v1/opportunities/{id}/documents` — List (All roles)
    - POST `/api/v1/opportunities/{id}/documents` — Upload (All roles)
    - GET `/api/v1/opportunities/{id}/documents/{docId}/download` — Download (All roles)
    - DELETE `/api/v1/opportunities/{id}/documents/{docId}` — Delete (AdminSupport)
    - _Requirements: 9.1, 9.4, 9.5, 9.6, 12.5_

  - [x] 9.7 Create AcquisitionsController and FeasibilityController
    - POST `/api/v1/opportunities/{id}/acquisitions` — Create (AdminSupport)
    - PATCH `/api/v1/opportunities/{id}/acquisitions/{acqId}/status` — Transition (AdminSupport)
    - POST `/api/v1/opportunities/{id}/feasibility` — Create/Update (ValuationAnalyst, FinanceDirector)
    - GET `/api/v1/opportunities/{id}/feasibility` — Get (All roles)
    - _Requirements: 10.1, 10.3, 6.1, 12.3_

  - [x] 9.8 Create ApprovalsController
    - POST `/api/v1/approvals` — Create (System auto-triggered)
    - PATCH `/api/v1/approvals/{id}` — Approve/Reject (FinanceDirector)
    - _Requirements: 11.1, 11.3, 11.4, 12.4_

  - [x] 9.9 Create DashboardController
    - GET `/api/v1/dashboard/metrics` — KPI metrics (All roles)
    - GET `/api/v1/dashboard/activity` — Recent activity (All roles)
    - _Requirements: 13.1, 13.6, 12.5_

  - [x] 9.10 Write property test for RBAC enforcement (Property 10)
    - **Property 10: Role-Based Access Control Enforcement** — generate random (role, operation) pairs, verify permit/deny matches expected role sets
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.7**

- [x] 10. Checkpoint — Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Frontend — Models, services, and NgRx store
  - [x] 11.1 Create TypeScript models and enums
    - Create interfaces and enums in `src/app/features/land-acquisition/models/`: `opportunity.model.ts`, `land-owner.model.ts`, `due-diligence.model.ts`, `offer.model.ts`, `contract.model.ts`, `document.model.ts`, `feasibility.model.ts`, `approval.model.ts`, `dashboard.model.ts`
    - Include `OpportunityStatus`, `DueDiligenceType`, `DueDiligenceStatus`, `OfferStatus`, `ContractStatus`, `OwnershipType`, `AcquisitionStatus`, `FeasibilityScenario`, `DocumentType` enums
    - _Requirements: 1.1, 5.2, 7.3, 8.2, 9.2, 10.1_

  - [x] 11.2 Create Angular HTTP services
    - Create `OpportunityService`, `DueDiligenceService`, `OfferService`, `DocumentService`, `FeasibilityService`, `DashboardService` in `src/app/features/land-acquisition/services/`
    - Each service wraps HTTP calls, returns typed Observables, uses `ApiResponse<T>` envelope
    - _Requirements: 2.1, 5.7, 7.6, 9.4, 13.1_

  - [x] 11.3 Implement NgRx opportunity store (actions, reducer, effects, selectors, state)
    - Actions: load, loadSuccess, loadFailure, create, createSuccess, update, delete, transitionStatus, selectOpportunity
    - Reducer: use `@ngrx/entity` EntityAdapter for normalized state; track loading, error, selectedId
    - Effects: handle API calls, dispatch success/failure, show toast on error
    - Selectors: selectAll, selectById, selectByStatus (pipeline grouping), selectLoading, selectError
    - _Requirements: 14.3, 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 11.4 Implement NgRx dashboard store (actions, reducer, effects, selectors)
    - Actions: loadMetrics, loadMetricsSuccess, loadMetricsFailure, loadActivity, loadActivitySuccess
    - State: metrics, recentActivity, loading, error
    - Selectors: selectMetrics, selectActivity, selectDashboardLoading
    - _Requirements: 18.1, 18.2, 18.3, 18.6_

  - [x] 11.5 Create feature routes with lazy loading
    - Define `land-acquisition.routes.ts` with routes for dashboard, pipeline, opportunity detail, create, edit
    - Add route guards for role-based access
    - _Requirements: 14.1, 15.1, 12.5, 12.6, 12.7_

- [x] 12. Frontend — Shared and reusable components
  - [x] 12.1 Create status-badge and status-progress components
    - `StatusBadgeComponent`: renders colored badge based on any status enum value (green/blue/amber/red/grey)
    - `StatusProgressComponent`: renders horizontal step indicator showing opportunity lifecycle position
    - _Requirements: 15.3_

  - [x] 12.2 Create KPI card and activity timeline components
    - `KpiCardComponent`: displays metric label, value, icon, optional trend indicator
    - `ActivityTimelineComponent`: renders chronological list of status changes with timestamps and user names
    - _Requirements: 18.1, 15.4_

  - [x] 12.3 Create pipeline-column and opportunity-card components
    - `PipelineColumnComponent`: renders a column header (status name + count) and list of cards
    - `OpportunityCardComponent`: displays Name, Location, LandSize, days since last status change
    - _Requirements: 14.1, 14.2_

  - [x] 12.4 Create document-upload component
    - File drag-and-drop area, DocType selector, file size validation (25MB), content type validation
    - Progress indicator during upload, error display
    - _Requirements: 9.1, 9.3_

  - [x] 12.5 Create approval-panel component
    - Displays pending approval details, approve/reject buttons, notes/reason text fields
    - _Requirements: 11.3, 11.4_

- [x] 13. Frontend — Container pages
  - [x] 13.1 Create Dashboard page
    - Dispatches loadMetrics and loadActivity on init
    - Displays KPI cards (Average Acquisition Cycle, Total Evaluated, Conversion Rate, DD Pass Rate)
    - Displays pipeline summary chart (count per status)
    - Displays recent activity section (last 5 actions)
    - Displays alerts (offers expiring within 7 days, overdue DD items)
    - Skeleton loading placeholders while loading
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

  - [x] 13.2 Create Pipeline page
    - Dispatches loadOpportunities on init
    - Groups opportunities by status into pipeline columns
    - Skeleton loading state while loading
    - Error state with retry button on failure
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 13.3 Create Opportunity Detail page
    - Header section: Name, Location, LandSize, Status, Source, ExpectedAcquisition, CreatedAt
    - Tabs: Overview, Due Diligence, Offers, Documents, Financials, Activity
    - Status progress indicator
    - Contextual action buttons based on status and user role
    - Activity tab: chronological timeline of status changes and audit events
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 13.4 Create Opportunity Create/Edit pages with reactive forms
    - Typed FormGroup with Name, Location, LandSize, Source, ExpectedAcquisition
    - Inline validation error messages on blur/submit
    - Disabled submit until valid
    - Server-side error mapping to form fields
    - Unsaved changes guard with confirmation dialog
    - Helper text on complex fields
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [x] 13.5 Create Due Diligence, Offer, and Contract sub-pages/tabs
    - Due Diligence tab: checklist view, status transitions, create form
    - Offers tab: list ordered by date desc, create offer form, counter-offer display
    - Contract tab: status display, solicitor details, status transitions
    - _Requirements: 5.1, 5.7, 7.1, 7.6, 8.1, 8.4_

- [x] 14. Checkpoint — Frontend pages and store complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Integration wiring and final polish
  - [x] 15.1 Wire frontend HTTP interceptor for error handling and auth
    - Catch all API errors, dispatch NgRx error actions, show toast notifications
    - Handle 401 (token refresh/redirect to login), 403 (forbidden message), 500 (generic error with retry)
    - _Requirements: 12.6, 12.7, 17.5_

  - [x] 15.2 Wire notification event handlers to audit trail
    - Ensure all notification sends are recorded with recipient, timestamp, eventType, isRead
    - Verify audit interceptor captures all CRUD operations with full audit fields (UserId, UserName, Action, EntityName, EntityId, OldValues, NewValues, AffectedColumns, Timestamp, IpAddress, CorrelationId)
    - _Requirements: 19.5, 20.1, 20.2, 20.3, 20.4, 20.5_

  - [x] 15.3 Implement offer expiry background check
    - Create a hosted service or scheduled job that marks offers as Expired when ValidUntil passes
    - Dispatch OfferExpired notification
    - _Requirements: 7.4, 19.2_

  - [x] 15.4 Wire approval threshold trigger
    - When offer is created and amount exceeds configurable threshold (default 500,000), auto-create ApprovalRequest
    - Block opportunity transitions while approval pending
    - _Requirements: 11.1, 11.5_

  - [x] 15.5 Write integration tests for end-to-end API flows
    - Test full opportunity lifecycle: create → transition through all statuses → acquire
    - Test RBAC: verify 403 for unauthorized role combinations
    - Test concurrency: verify 409 on RowVersion conflict
    - Test audit: verify audit entries created for all mutations
    - _Requirements: 1.1, 3.1, 12.1, 20.1, 20.2_

- [x] 16. Final checkpoint — Full module integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The backend uses C# with ASP.NET Core, EF Core, MediatR, FluentValidation, AutoMapper
- The frontend uses Angular 20, TypeScript strict, NgRx, Reactive Forms, Tailwind CSS, DaisyUI
- Property-based tests use FsCheck.Xunit with minimum 100 iterations per property

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.5"] },
    { "id": 2, "tasks": ["2.1", "2.4", "2.5", "2.6", "2.7", "2.8"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.9"] },
    { "id": 4, "tasks": ["4.1", "5.1", "6.1", "11.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.4", "4.5", "5.2", "5.3", "6.2", "6.3", "6.4", "6.5"] },
    { "id": 6, "tasks": ["4.6", "4.7", "7.1", "7.2", "7.3"] },
    { "id": 7, "tasks": ["4.8", "4.9", "5.4", "5.5", "6.6", "6.7", "7.4", "7.5"] },
    { "id": 8, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8", "9.9"] },
    { "id": 9, "tasks": ["9.10", "11.2", "11.3", "11.4", "11.5"] },
    { "id": 10, "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5"] },
    { "id": 11, "tasks": ["13.1", "13.2", "13.3", "13.4", "13.5"] },
    { "id": 12, "tasks": ["15.1", "15.2", "15.3", "15.4"] },
    { "id": 13, "tasks": ["15.5"] }
  ]
}
```
