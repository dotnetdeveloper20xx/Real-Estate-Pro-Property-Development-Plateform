# Implementation Plan: Legal & Compliance Module

## Overview

This plan implements the Legal & Compliance Module (Module 3) for BuildEstate Pro. The module manages legal cases, contracts, compliance requirements, compliance checks, insurance records, audit records, and legal documents. Implementation follows Clean Architecture with CQRS (MediatR), FluentValidation, EF Core Code-First, and an Angular 20 frontend with NgRx state management. Tasks are sequenced to build domain foundations first, then application layer, API, and finally frontend, ensuring no orphaned code.

## Tasks

- [x] 1. Domain Layer — Enums, Entities, and State Machine Interfaces
  - [x] 1.1 Create all Legal Compliance enums
    - Create `LegalCaseStatus`, `LegalCaseType`, `LegalCasePriority`, `LegalContractStatus`, `LegalContractType`, `ComplianceCategory`, `ComplianceFrequency`, `ComplianceCheckOutcome`, `ComplianceRequirementStatus`, `InsuranceStatus`, `CoverageType`, `AuditType`, `AuditRecordStatus`, `RiskRating`, `LegalDocumentType`, `ConfidentialityLevel` enums in `src/BuildEstate.Domain/Enums/`
    - _Requirements: 1.2, 3.2, 5.2, 7.2, 8.2, 9.2_

  - [x] 1.2 Create domain entities for the Legal Compliance module
    - Implement `LegalCase`, `Contract`, `ComplianceRequirement`, `ComplianceCheck`, `InsuranceRecord`, `AuditRecord`, `LegalDocument` entities extending `BaseEntity` in `src/BuildEstate.Domain/Entities/LegalCompliance/`
    - Include all properties, navigation properties, and foreign keys as defined in the design
    - _Requirements: 1.1, 1.5, 3.1, 5.1, 6.1, 7.1, 8.1, 9.1_

  - [x] 1.3 Create state machine interfaces
    - Implement `ILegalCaseStateMachine`, `ILegalContractStateMachine`, `IInsuranceStateMachine`, `IAuditRecordStateMachine` interfaces in `src/BuildEstate.Domain/Services/`
    - Each interface exposes `CanTransition`, `GetPermittedTransitions`, and `ValidateTransition` methods
    - _Requirements: 2.1, 4.1, 7.3, 9.3_

  - [x] 1.4 Create domain events
    - Implement `LegalCaseStatusChangedEvent`, `ContractStatusChangedEvent`, `ComplianceCheckRecordedEvent`, `InsuranceExpiringEvent`, `AuditActionOverdueEvent` in `src/BuildEstate.Domain/Events/`
    - _Requirements: 2.3, 4.6, 6.4, 7.4, 9.6, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 1.5 Create domain exceptions
    - Implement `InvalidStateTransitionException`, `EntityNotFoundException`, `DuplicateEntityException`, `BusinessRuleViolationException` custom exception classes
    - _Requirements: 2.2, 4.2_

- [x] 2. Infrastructure Layer — State Machines, EF Core Configurations, and Services
  - [x] 2.1 Implement state machine services
    - Implement `LegalCaseStateMachine`, `LegalContractStateMachine`, `InsuranceStateMachine`, `AuditRecordStateMachine` in `src/BuildEstate.Infrastructure/Services/LegalCompliance/`
    - Define all valid transition rules as per the design with dictionary-based lookup
    - _Requirements: 2.1, 4.1, 7.3, 9.3_

  - [x] 2.2 Write property tests for LegalCase state machine
    - **Property 1: LegalCase State Machine Correctness**
    - Generate all possible (from, to) enum pairs and verify only the 15 defined transitions are accepted
    - **Validates: Requirements 2.1, 2.2**

  - [x] 2.3 Write property tests for Contract state machine
    - **Property 2: Contract State Machine Correctness**
    - Generate all possible (from, to) enum pairs and verify only the 21 defined transitions are accepted
    - **Validates: Requirements 4.1, 4.2**

  - [x] 2.4 Write property tests for Insurance state machine
    - **Property 3: Insurance State Machine Correctness**
    - Generate all possible (from, to) enum pairs and verify only the 8 defined transitions are accepted
    - **Validates: Requirements 7.3**

  - [x] 2.5 Write property tests for AuditRecord state machine
    - **Property 4: AuditRecord State Machine Correctness**
    - Generate all possible (from, to) enum pairs and verify only the 7 defined transitions are accepted
    - **Validates: Requirements 9.3**

  - [x] 2.6 Implement EF Core entity configurations
    - Create `LegalCaseConfiguration`, `ContractConfiguration`, `LegalDocumentConfiguration`, `ComplianceRequirementConfiguration`, `ComplianceCheckConfiguration`, `InsuranceRecordConfiguration`, `AuditRecordConfiguration` in `src/BuildEstate.Infrastructure/Persistence/Configurations/LegalCompliance/`
    - Configure indexes, unique constraints, decimal precision(18,2), soft-delete query filters, cascade rules, and RowVersion concurrency tokens as per design
    - _Requirements: 1.4, 3.3, 5.3, 7.2, 13.3_

  - [x] 2.7 Implement LegalReferenceNumberGenerator service
    - Create `LegalReferenceNumberGenerator` in `src/BuildEstate.Infrastructure/Services/LegalCompliance/`
    - Generate `LC-YYYY-NNNNN` and `CON-YYYY-NNNNN` formats with atomic sequence increment under database lock
    - _Requirements: 1.4, 3.3_

  - [x] 2.8 Write property test for reference number format
    - **Property 7: Reference Number Format**
    - Generate multiple references and verify regex pattern `^LC-\d{4}-\d{5}$` or `^CON-\d{4}-\d{5}$`, year matches current UTC year, and no duplicates
    - **Validates: Requirements 1.4, 3.3**

  - [x] 2.9 Register DbSet entries and create EF Core migration
    - Add `DbSet<LegalCase>`, `DbSet<Contract>`, `DbSet<ComplianceRequirement>`, `DbSet<ComplianceCheck>`, `DbSet<InsuranceRecord>`, `DbSet<AuditRecord>`, `DbSet<LegalDocument>` to AppDbContext
    - Generate and apply the migration
    - _Requirements: 1.1, 3.1, 5.1, 7.1, 8.1, 9.1_

- [x] 3. Checkpoint — Domain and Infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Application Layer — Legal Cases (Commands, Queries, Validators, Handlers, DTOs)
  - [x] 4.1 Create Legal Case DTOs
    - Implement `LegalCaseDto`, `LegalCaseDetailDto`, `LegalCaseListItemDto`, `LegalCasePipelineDto`, `LegalCaseSummaryDto` in `src/BuildEstate.Application/Features/LegalCompliance/LegalCases/DTOs/`
    - _Requirements: 1.1, 14.1, 14.2, 15.1, 19.4_

  - [x] 4.2 Implement CreateLegalCase command, validator, and handler
    - Create `CreateLegalCaseCommand`, `CreateLegalCaseCommandValidator` (Title 5-200, Description 10-2000, valid CaseType, valid Priority, at least one of OpportunityId or PlanningApplicationId), and `CreateLegalCaseCommandHandler` (sets Status=Open, generates CaseReference, creates audit entry)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 4.3 Implement UpdateLegalCase command, validator, and handler
    - Create `UpdateLegalCaseCommand`, `UpdateLegalCaseCommandValidator`, and `UpdateLegalCaseCommandHandler` supporting Title, Description, Priority, AssignedSolicitor, SolicitorFirm, SolicitorEmail, SolicitorPhone, Notes updates
    - _Requirements: 1.7_

  - [x] 4.4 Implement TransitionLegalCaseStatus command, validator, and handler
    - Create `TransitionLegalCaseStatusCommand`, validator (requires ResolutionSummary ≥20 chars + ResolutionDate for Resolved; EscalationReason ≥10 chars for Escalated; HoldReason ≥10 chars for OnHold; all linked contracts in terminal state for Closed), handler using `ILegalCaseStateMachine`, raise `LegalCaseStatusChangedEvent`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 4.5 Write property tests for conditional transition validation (LegalCase)
    - **Property 9: Conditional Transition Validation (LegalCase subset)**
    - Generate random transition commands with/without required fields for Resolved, Escalated, OnHold, Closed transitions and verify rejection/acceptance
    - **Validates: Requirements 2.4, 2.5, 2.6, 2.7**

  - [x] 4.6 Implement Legal Case queries
    - Create `GetLegalCaseByIdQuery` + handler, `GetLegalCasesQuery` + handler (paginated, filterable by Status, CaseType, Priority), `GetLegalCasePipelineQuery` + handler (cases grouped by status), `GetLegalCaseSummaryForOpportunityQuery` + handler
    - _Requirements: 14.1, 14.2, 14.4, 15.1, 15.2, 19.4, 19.5_

  - [x] 4.7 Write property test for entity creation invariants (LegalCase)
    - **Property 5: Entity Creation Invariants (LegalCase)**
    - Generate random valid creation commands and verify Id is non-empty Guid, Status=Open, CreatedAt within 1s of now, CreatedBy equals authenticated user
    - **Validates: Requirements 1.1, 1.5**

  - [x] 4.8 Write property test for input validation rejection (LegalCase)
    - **Property 6: Input Validation Rejects Invalid Data (LegalCase)**
    - Generate random invalid field values (Title outside 5-200, Description outside 10-2000, invalid enums) and verify rejection
    - **Validates: Requirements 1.2**

- [x] 5. Application Layer — Contracts (Commands, Queries, Validators, Handlers, DTOs)
  - [x] 5.1 Create Contract DTOs
    - Implement `ContractDto`, `ContractDetailDto`, `ContractListItemDto`, `ContractRegisterDto` in `src/BuildEstate.Application/Features/LegalCompliance/Contracts/DTOs/`
    - _Requirements: 3.1, 14.3, 15.3, 15.4_

  - [x] 5.2 Implement CreateContract command, validator, and handler
    - Create `CreateContractCommand`, `CreateContractCommandValidator` (Title 5-300, valid ContractType, CounterpartyName 2-200, positive ContractValue precision(18,2), valid ISO 4217 Currency, StartDate ≤ EndDate, LegalCaseId references case with status Open/InProgress/UnderReview), handler (sets Status=Draft, generates ContractReference)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

  - [x] 5.3 Implement UpdateContract command, validator, and handler
    - Support RenewalDate, TerminationClause (≤1000), SpecialConditions (≤2000), PaymentTerms (≤500) and core field updates
    - _Requirements: 3.6, 3.7_

  - [x] 5.4 Implement TransitionContractStatus command, validator, and handler
    - Validate all transitions via `ILegalContractStateMachine`, require ExecutionDate + SignatoryNames for Executed, TerminationReason + TerminationDate for Terminated, approver details for Approved, Finance_Director approval for high-value Draft→UnderReview
    - Raise `ContractStatusChangedEvent`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 3.5_

  - [x] 5.5 Write property test for Contract threshold approval rule
    - **Property 21: Contract Threshold Approval Rule**
    - Generate random ContractValues around the threshold (default 50,000) and verify approval requirement enforcement
    - **Validates: Requirements 3.5**

  - [x] 5.6 Implement Contract queries
    - Create `GetContractByIdQuery` + handler, `GetContractsQuery` + handler (paginated, filterable), `GetContractRegisterQuery` + handler
    - _Requirements: 14.3, 15.3, 15.4_

  - [x] 5.7 Write property test for foreign key existence validation (Contract)
    - **Property 8: Foreign Key Existence Validation**
    - Generate creation commands with invalid/valid LegalCaseId references and verify rejection/acceptance
    - **Validates: Requirements 3.4**

- [x] 6. Application Layer — Compliance Requirements and Checks
  - [x] 6.1 Create Compliance DTOs
    - Implement `ComplianceRequirementDto`, `ComplianceRequirementDetailDto`, `ComplianceCheckDto`, `ComplianceStatusSummaryDto`, `ComplianceChecklistDto` in `src/BuildEstate.Application/Features/LegalCompliance/ComplianceRequirements/DTOs/` and `ComplianceChecks/DTOs/`
    - _Requirements: 5.1, 5.5, 5.6, 6.1, 6.7, 20.1_

  - [x] 6.2 Implement CreateComplianceRequirement command, validator, and handler
    - Validate Name 5-200, valid Category, Description 10-2000, SourceRegulation 3-300, valid Frequency, valid ResponsibleRole; enforce uniqueness of Name within Category; set Status=Active
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.3 Implement UpdateComplianceRequirement and RetireComplianceRequirement commands
    - Update supports field changes; Retire/Supersede requires reason ≥10 chars
    - _Requirements: 5.4_

  - [x] 6.4 Implement Compliance Requirement queries
    - `GetComplianceRequirementsQuery` (paginated, filterable by Category, Status, Frequency, ResponsibleRole, sortable), `GetComplianceChecklistQuery` (checklist view with last check, next due, status indicator), `GetComplianceStatusSummaryQuery` (totals per category)
    - _Requirements: 5.5, 5.6, 20.1, 20.2, 20.3, 20.4, 20.6_

  - [x] 6.5 Implement CreateComplianceCheck command, validator, and handler
    - Validate ComplianceRequirementId references active requirement, CheckDate ≤ now, valid Outcome, Findings 10-3000; require RemediationPlan ≥20 chars + RemediationDueDate > now for Non-Compliant; calculate and update NextDueDate on the requirement; raise `ComplianceCheckRecordedEvent`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 6.6 Implement GetComplianceChecks query
    - Paginated list for a given requirement, ordered by CheckDate desc, filterable by Outcome and date range
    - _Requirements: 6.7_

  - [x] 6.7 Write property test for NextDueDate calculation
    - **Property 10: Compliance NextDueDate Calculation**
    - Generate random Frequency + CheckDate combinations and verify calculated NextDueDate matches expected interval
    - **Validates: Requirements 6.5**

  - [x] 6.8 Write property test for uniqueness constraints (ComplianceRequirement)
    - **Property 19: Uniqueness Constraints**
    - Generate random Name/Category pairs and verify duplicate rejection
    - **Validates: Requirements 5.3**

  - [x] 6.9 Write property test for overdue detection (Compliance)
    - **Property 11: Overdue Detection (ComplianceRequirement)**
    - Generate random date scenarios and verify overdue identification logic
    - **Validates: Requirements 6.6**

- [x] 7. Application Layer — Insurance Records
  - [x] 7.1 Create Insurance DTOs
    - Implement `InsuranceRecordDto`, `InsuranceRecordDetailDto`, `InsuranceRecordListItemDto` in `src/BuildEstate.Application/Features/LegalCompliance/Insurance/DTOs/`
    - _Requirements: 7.1, 7.7_

  - [x] 7.2 Implement CreateInsuranceRecord command, validator, and handler
    - Validate PolicyNumber 3-50 unique among active records, Insurer 2-200, valid CoverageType, positive CoverAmount/Premium precision(18,2), valid ISO 4217 Currency, StartDate < ExpiryDate; set Status=Active
    - _Requirements: 7.1, 7.2_

  - [x] 7.3 Implement UpdateInsuranceRecord and TransitionInsuranceStatus commands
    - Update supports field changes; transition uses `IInsuranceStateMachine`; raise `InsuranceExpiringEvent` for ExpiringSoon/Expired transitions
    - _Requirements: 7.3, 7.4, 7.5_

  - [x] 7.4 Implement RenewInsuranceRecord command and handler
    - Create new InsuranceRecord linked via PreviousPolicyId, carry forward PolicyNumber, Insurer, CoverageType, OpportunityId, LegalCaseId; transition old record
    - _Requirements: 7.6_

  - [x] 7.5 Implement Insurance queries
    - `GetInsuranceRecordsQuery` (paginated, filterable by CoverageType, Status, Insurer, expiry date range, sortable), `GetInsuranceByIdQuery`
    - _Requirements: 7.7_

  - [x] 7.6 Write property test for insurance expiry detection
    - **Property 12: Insurance Expiry Detection**
    - Generate random expiry date scenarios and verify ExpiringSoon (within 30 days) and Expired (past) detection
    - **Validates: Requirements 7.4, 7.5**

  - [x] 7.7 Write property test for insurance renewal field carry-forward
    - **Property 14: Insurance Renewal Carries Forward Fields**
    - Generate random insurance records, renew them, and verify PreviousPolicyId and field carry-forward
    - **Validates: Requirements 7.6**

- [x] 8. Application Layer — Audit Records
  - [x] 8.1 Create AuditRecord DTOs
    - Implement `AuditRecordDto`, `AuditRecordDetailDto`, `AuditRecordListItemDto` in `src/BuildEstate.Application/Features/LegalCompliance/AuditRecords/DTOs/`
    - _Requirements: 9.1, 9.7_

  - [x] 8.2 Implement CreateAuditRecord command, validator, and handler
    - Validate AuditType, Scope 10-1000, AuditorName 2-150, valid AuditDate; optional LegalCaseId/ComplianceRequirementId links; set Status=Planned
    - _Requirements: 9.1, 9.2_

  - [x] 8.3 Implement TransitionAuditRecordStatus command, validator, and handler
    - Use `IAuditRecordStateMachine`; require Findings ≥20 chars + RiskRating for FindingsRecorded; require Recommendations ≥20 chars + ActionDueDate > now for ActionsRequired
    - _Requirements: 9.3, 9.4, 9.5_

  - [x] 8.4 Implement AuditRecord queries
    - `GetAuditRecordsQuery` (paginated, filterable by AuditType, Status, RiskRating, date range, sortable), `GetAuditRecordByIdQuery`
    - _Requirements: 9.7_

  - [x] 8.5 Write property test for overdue detection (AuditRecord)
    - **Property 11: Overdue Detection (AuditRecord)**
    - Generate random AuditRecords with ActionDueDate scenarios and verify overdue marking
    - **Validates: Requirements 9.6**

- [x] 9. Application Layer — Legal Documents
  - [x] 9.1 Create LegalDocument DTOs
    - Implement `LegalDocumentDto`, `LegalDocumentListItemDto` in `src/BuildEstate.Application/Features/LegalCompliance/Documents/DTOs/`
    - _Requirements: 8.1, 8.5_

  - [x] 9.2 Implement UploadLegalDocument command, validator, and handler
    - Validate linked LegalCaseId or ContractId exists, valid DocumentType, valid ConfidentialityLevel, file size ≤ 50MB, allowed content types (PDF, DOCX, XLSX, PNG, JPG, TIFF); set Version=1, UploadedAt=UTC now
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 9.3 Implement UploadDocumentVersion command and handler
    - Increment Version, retain previous versions, record upload in audit trail
    - _Requirements: 8.4_

  - [x] 9.4 Implement DeleteLegalDocument command and handler
    - Soft-delete with role check (Legal_Compliance_Officer only); record deletion in audit trail
    - _Requirements: 8.7_

  - [x] 9.5 Implement Document queries
    - `GetDocumentsForCaseQuery`, `GetDocumentsForContractQuery` (paginated, filterable by DocumentType, ConfidentialityLevel, date range); filter Restricted documents to Legal_Compliance_Officer only
    - _Requirements: 8.5, 8.6_

  - [x] 9.6 Write property test for document version increment
    - **Property 13: Document Version Increment**
    - Generate random version sequences and verify N → N+1 increment with original preserved
    - **Validates: Requirements 8.4**

- [x] 10. Application Layer — Dashboard and Audit Trail
  - [x] 10.1 Implement GetLegalDashboard query and handler
    - Calculate: case counts by Status/Priority, average resolution time, compliance rate, expiring/expired insurance count, active contract value by type, contracts awaiting approval, overdue compliance/audit items, recent 10 activities, risk summary (High/Critical cases and audits)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [x] 10.2 Implement Audit Trail queries
    - `GetAuditHistoryQuery` (paginated, filterable by action type, entity type, user, date range), `ExportAuditTrailQuery` (CSV export for date range and entity type)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 10.3 Write property test for dashboard KPI calculations
    - **Property 17: Dashboard KPI Calculation Correctness**
    - Generate random datasets and verify mathematically correct groupings, averages, and percentages
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

  - [x] 10.4 Write property test for audit entry completeness
    - **Property 22: Audit Entry Completeness**
    - Generate random operations and verify all required audit fields are non-null
    - **Validates: Requirements 13.1, 13.2, 13.5**

- [x] 11. Application Layer — Notifications and Background Services
  - [x] 11.1 Implement domain event notification handlers
    - Handle `LegalCaseStatusChangedEvent` (notify Finance_Director on Escalated), `ContractStatusChangedEvent` (notify on Executed/Terminated), `ComplianceCheckRecordedEvent` (notify on Non-Compliant), `InsuranceExpiringEvent`, `AuditActionOverdueEvent`
    - Record all notifications with recipient, timestamp, event type, read status
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x] 11.2 Implement InsuranceExpiryCheckService (background hosted service)
    - Run daily: transition Active policies within 30 days of expiry to ExpiringSoon; transition ExpiringSoon policies past expiry to Expired; send notifications
    - _Requirements: 7.4, 7.5_

  - [x] 11.3 Implement ComplianceOverdueCheckService (background hosted service)
    - Run daily: identify overdue ComplianceRequirements and overdue AuditRecord actions; mark as overdue; send notifications
    - _Requirements: 6.6, 9.6_

  - [x] 11.4 Implement document retention expiry notification
    - Identify documents where RetentionExpiryDate is within 30 days; send notification to Legal_Compliance_Officer
    - _Requirements: 8.8_

- [x] 12. Checkpoint — Application Layer Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. API Layer — Controllers with Authorization
  - [x] 13.1 Implement LegalCasesController
    - POST create, GET list (paginated), GET by id, PUT update, POST transition, GET pipeline, GET summary/opportunity/{id}, GET summary/planning/{id}
    - Authorize: create/update/transition → Legal_Compliance_Officer, Admin_Support; read → all legal roles
    - _Requirements: 1.1, 1.7, 2.1, 10.1, 14.1, 14.4, 19.4, 19.5_

  - [x] 13.2 Implement ContractsController
    - POST create, GET list, GET by id, PUT update, POST transition, GET register
    - Authorize: create/update → Legal_Compliance_Officer; transition → Legal_Compliance_Officer, Finance_Director; read → all legal roles
    - _Requirements: 3.1, 4.1, 10.2, 10.5, 14.3_

  - [x] 13.3 Implement ComplianceRequirementsController
    - POST create, GET list, PUT update, GET checklist, GET summary
    - Authorize: create/update → Legal_Compliance_Officer; read → all legal roles
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 10.3, 20.1_

  - [x] 13.4 Implement ComplianceChecksController
    - POST create, GET list (for requirement)
    - Authorize: create → Legal_Compliance_Officer, Admin_Support; read → all legal roles
    - _Requirements: 6.1, 6.7, 10.4_

  - [x] 13.5 Implement InsuranceRecordsController
    - POST create, GET list, GET by id, PUT update, POST transition, POST renew
    - Authorize: create/update → Legal_Compliance_Officer, Admin_Support; transition/renew → Legal_Compliance_Officer; read → all legal roles
    - _Requirements: 7.1, 7.3, 7.6, 7.7, 10.6_

  - [x] 13.6 Implement AuditRecordsController
    - POST create, GET list, GET by id, POST transition
    - Authorize: all operations → Legal_Compliance_Officer; read → all legal roles
    - _Requirements: 9.1, 9.3, 9.7_

  - [x] 13.7 Implement LegalDocumentsController
    - POST upload, GET list, POST version, DELETE soft-delete
    - Authorize: upload → all legal roles; delete → Legal_Compliance_Officer; filter Restricted to Legal_Compliance_Officer
    - _Requirements: 8.1, 8.4, 8.5, 8.6, 8.7_

  - [x] 13.8 Implement LegalDashboardController and AuditTrailController
    - GET dashboard → Legal_Compliance_Officer; GET audit-trail + GET audit-trail/export → Legal_Compliance_Officer
    - _Requirements: 11.1, 13.4, 13.6_

  - [x] 13.9 Write property test for RBAC enforcement
    - **Property 16: RBAC Enforcement**
    - Generate random role/operation combinations and verify 401 for unauthenticated, 403 for unauthorized, 200/201 for authorized
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9**

- [x] 14. API Layer — AutoMapper Profiles and DI Registration
  - [x] 14.1 Create AutoMapper profiles for all Legal Compliance DTOs
    - Map domain entities to DTOs with explicit member configurations
    - _Requirements: 1.1, 3.1, 5.1, 7.1, 8.1, 9.1_

  - [x] 14.2 Register all services in DI container
    - Register state machines, reference number generator, background services, validators, handlers, AutoMapper profiles
    - Add `LegalComplianceSettings` configuration with `IOptions<T>` for configurable threshold
    - _Requirements: 3.5_

- [x] 15. Checkpoint — Backend Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Frontend — Models and Services
  - [x] 16.1 Create TypeScript models and interfaces
    - Implement `ILegalCase`, `IContract`, `IComplianceRequirement`, `IComplianceCheck`, `IInsuranceRecord`, `IAuditRecord`, `ILegalDocument`, `IDashboardData`, enum types, form interfaces in `client-app/src/app/features/legal-compliance/models/`
    - _Requirements: 1.1, 3.1, 5.1, 6.1, 7.1, 8.1, 9.1, 11.1_

  - [x] 16.2 Implement Angular HTTP services
    - Create `LegalCaseService`, `ContractService`, `ComplianceService`, `InsuranceService`, `AuditRecordService`, `LegalDocumentService` in `client-app/src/app/features/legal-compliance/services/`
    - Each service wraps API calls and returns typed Observables
    - _Requirements: 17.3_

- [x] 17. Frontend — NgRx State Management
  - [x] 17.1 Implement Legal Cases NgRx store
    - Create actions (load, create, update, transition, loadPipeline), reducer with EntityAdapter, effects for API calls, selectors (filtered lists, pipeline groupings, loading/error states)
    - _Requirements: 14.4, 17.1, 17.3, 17.4, 17.5_

  - [x] 17.2 Implement Contracts NgRx store
    - Actions, reducer with EntityAdapter, effects, selectors (register view, filtered, awaiting approval count)
    - _Requirements: 17.2, 17.3, 17.4_

  - [x] 17.3 Implement Compliance NgRx store
    - Actions, reducer with EntityAdapter for requirements and checks, effects, selectors (checklist view, status summary, overdue count, color-coded indicators)
    - _Requirements: 17.2, 17.3, 17.4, 20.2, 20.6_

  - [x] 17.4 Implement Insurance NgRx store
    - Actions, reducer with EntityAdapter, effects, selectors (expiring count, filtered lists)
    - _Requirements: 17.2, 17.3, 17.4_

  - [x] 17.5 Implement Audit Records NgRx store
    - Actions, reducer with EntityAdapter, effects, selectors
    - _Requirements: 17.2, 17.3, 17.4_

  - [x] 17.6 Implement Documents and Dashboard NgRx stores
    - Documents: actions, reducer, effects, selectors; Dashboard: load action, reducer for KPI data, effects, selectors for widget data
    - _Requirements: 17.2, 17.3, 17.4, 18.1_

  - [x] 17.7 Write property test for compliance status color-coding selector
    - **Property 18: Compliance Status Color-Coding**
    - Generate random compliance states and verify color assignment logic (green/amber/red/grey)
    - **Validates: Requirements 20.2**

- [x] 18. Frontend — Shared/Reusable Components
  - [x] 18.1 Create reusable presentation components
    - `case-card` (Title, CaseReference, CaseType, Priority color-coded, OpportunityName, days since change), `kpi-metric-card`, `compliance-status-badge`, `insurance-alert-card`, `status-transition-dialog`, `audit-timeline`, `contract-register-table`, `document-upload-form`
    - _Requirements: 14.2, 14.5, 14.6, 15.5, 15.6, 18.1_

- [x] 19. Frontend — Dashboard Container
  - [x] 19.1 Implement Legal Dashboard container and page
    - KPI cards (Open Cases, Avg Resolution Time, Compliance Rate, Contracts Awaiting Approval, Expiring Insurance), case pipeline summary chart, compliance overview section, insurance alerts section, recent activity (last 5), skeleton loading placeholders
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

- [x] 20. Frontend — Legal Cases Pages
  - [x] 20.1 Implement Legal Case Pipeline container
    - Kanban-style board with columns per Status, case cards, skeleton loading, error state with retry
    - _Requirements: 14.1, 14.2, 14.4, 14.5, 14.6_

  - [x] 20.2 Implement Legal Case Detail container with tabs
    - Header section (Title, CaseReference, CaseType, Status, Priority, AssignedSolicitor, SolicitorFirm, OpportunityName), tabs: Overview, Contracts, Documents, Compliance, Insurance, Activity; status progress indicator; contextual action buttons based on status/role
    - _Requirements: 15.1, 15.2, 15.5, 15.6, 15.7_

  - [x] 20.3 Implement Legal Case Create/Edit form
    - Reactive form with typed FormGroup, inline validation, helper text, unsaved changes detection, submit button disabled until valid
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 21. Frontend — Contracts Pages
  - [x] 21.1 Implement Contract Register container
    - Paginated data table with ContractReference, Title, ContractType, CounterpartyName, ContractValue, Status, StartDate, EndDate, linked CaseReference; filtering, sorting, search
    - _Requirements: 14.3_

  - [x] 21.2 Implement Contract Detail container with tabs
    - Header section, tabs: Overview, Documents, Signatories, Key Dates, Activity; status progress indicator; contextual action buttons
    - _Requirements: 15.3, 15.4, 15.5, 15.6, 15.7_

  - [x] 21.3 Implement Contract Create/Edit form
    - Reactive form with ContractType, CounterpartyName, ContractValue, Currency, StartDate, EndDate, inline validation, helper text
    - _Requirements: 16.1, 16.2, 16.3, 16.5, 16.6_

- [x] 22. Frontend — Compliance Pages
  - [x] 22.1 Implement Compliance Checklist container
    - Data table with Name, Category, Frequency, Last Check Date, Last Outcome, Next Due Date, Status indicator (green/amber/red/grey); summary bar (total, compliant, overdue, due soon); filtering by Category, Status, Frequency, ResponsibleRole; sorting; click to navigate to detail
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [x] 22.2 Implement Compliance Requirement Detail container
    - Requirement info, full check history, current status, button to record new check
    - _Requirements: 20.5_

  - [x] 22.3 Implement Compliance Check form
    - Reactive form for recording checks (Outcome, Findings, EvidenceReference, RemediationPlan if Non-Compliant, RemediationDueDate if Non-Compliant)
    - _Requirements: 6.1, 6.2, 6.3, 16.1, 16.2, 16.3_

- [x] 23. Frontend — Insurance Pages
  - [x] 23.1 Implement Insurance List container
    - Paginated data table filterable by CoverageType, Status, Insurer, expiry range; sortable by ExpiryDate, CoverAmount, PolicyNumber
    - _Requirements: 7.7_

  - [x] 23.2 Implement Insurance Create/Edit form
    - Reactive form with PolicyNumber, Insurer, CoverageType, CoverAmount, Premium, Currency, StartDate, ExpiryDate, linked entity; inline validation
    - _Requirements: 7.1, 7.2, 16.1, 16.2, 16.3_

- [x] 24. Frontend — Audit Record Pages
  - [x] 24.1 Implement Audit Record List container
    - Paginated data table filterable by AuditType, Status, RiskRating, date range; sortable
    - _Requirements: 9.7_

  - [x] 24.2 Implement Audit Record Create form and status transition dialog
    - Reactive form for creation; status transition dialog requiring Findings/RiskRating for FindingsRecorded, Recommendations/ActionDueDate for ActionsRequired
    - _Requirements: 9.1, 9.4, 9.5, 16.1_

- [x] 25. Frontend — Routing, Guards, and Module Wiring
  - [x] 25.1 Create legal-compliance routes and lazy loading
    - Define `legal-compliance.routes.ts` with child routes for dashboard, cases, contracts, compliance, insurance, audit-records, documents
    - Register in `app.routes.ts` with lazy loading
    - _Requirements: 10.1, 10.7_

  - [x] 25.2 Implement LegalRoleGuard
    - Route guard checking user role against required roles for each sub-route; redirect to forbidden page on unauthorized access
    - _Requirements: 10.8, 10.9_

  - [x] 25.3 Wire feature store into app and register all NgRx feature states
    - Import all store slices via `provideState()` in legal-compliance routes
    - _Requirements: 17.1, 17.2_

- [x] 26. Frontend — Integration and Polish
  - [x] 26.1 Implement status transition dialogs across all entities
    - Reusable `StatusTransitionDialog` component accepting current status, permitted transitions, and conditional field requirements; used by LegalCase, Contract, Insurance, AuditRecord detail pages
    - _Requirements: 2.1, 4.1, 7.3, 9.3, 15.7_

  - [x] 26.2 Implement error handling, loading states, and toast notifications
    - HTTP error interceptor integration, toast service for success/error messages, skeleton loading components, error states with retry buttons across all containers
    - _Requirements: 14.5, 14.6, 17.5_

  - [x] 26.3 Write property test for paginated query filter correctness
    - **Property 15: Paginated Query Filter Correctness**
    - Generate random entities and filter parameters; verify all returned items satisfy predicates and no qualifying items are excluded
    - **Validates: Requirements 5.5, 6.7, 7.7, 9.7, 13.4**

  - [x] 26.4 Write property test for update round-trip preservation
    - **Property 20: Update Round-Trip Preservation**
    - Generate random valid update commands; apply update then read back; verify all updated fields match
    - **Validates: Requirements 1.7**

- [x] 27. Final Checkpoint — Full Module Integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at natural boundaries (domain → application → API → frontend)
- Property tests use FsCheck (via FsCheck.Xunit) for backend and fast-check for frontend
- All state machines are implemented as infrastructure services to keep domain entities clean
- Background services (InsuranceExpiryCheck, ComplianceOverdueCheck) run daily and handle failures gracefully with logging
- The configurable Finance Director approval threshold (default £50,000) is managed via `IOptions<LegalComplianceSettings>`
- Frontend follows Smart/Dumb component pattern: containers connect to store, presentational components receive data via @Input()

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["2.1", "2.6", "2.7", "2.9"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.8"] },
    { "id": 4, "tasks": ["4.1", "5.1", "6.1", "7.1", "8.1", "9.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.4", "4.6", "5.2", "5.3", "5.4", "5.6", "6.2", "6.3", "6.4", "6.5", "6.6", "7.2", "7.3", "7.4", "7.5", "8.2", "8.3", "8.4", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 6, "tasks": ["4.5", "4.7", "4.8", "5.5", "5.7", "6.7", "6.8", "6.9", "7.6", "7.7", "8.5", "9.6", "10.1", "10.2", "11.1", "11.2", "11.3", "11.4"] },
    { "id": 7, "tasks": ["10.3", "10.4"] },
    { "id": 8, "tasks": ["13.1", "13.2", "13.3", "13.4", "13.5", "13.6", "13.7", "13.8", "14.1", "14.2"] },
    { "id": 9, "tasks": ["13.9"] },
    { "id": 10, "tasks": ["16.1", "16.2"] },
    { "id": 11, "tasks": ["17.1", "17.2", "17.3", "17.4", "17.5", "17.6"] },
    { "id": 12, "tasks": ["17.7", "18.1"] },
    { "id": 13, "tasks": ["19.1", "20.1", "20.2", "20.3", "21.1", "21.2", "21.3", "22.1", "22.2", "22.3", "23.1", "23.2", "24.1", "24.2"] },
    { "id": 14, "tasks": ["25.1", "25.2", "25.3"] },
    { "id": 15, "tasks": ["26.1", "26.2", "26.3", "26.4"] }
  ]
}
```
