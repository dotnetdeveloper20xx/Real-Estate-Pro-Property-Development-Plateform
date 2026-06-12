# Requirements Document

## Introduction

The Legal & Compliance Module is the third business module of the BuildEstate Pro platform. It protects the company legally and operationally by managing contracts, legal documents, compliance requirements, insurance records, regulatory evidence, and audit history. This module is cross-cutting — it supports all other modules by providing the legal framework that governs land acquisition, planning approvals, construction, and sales.

This module sits directly after the Planning & Approvals module in the build order. It integrates with the Land Acquisition module via OpportunityId (legal cases relate to land opportunities) and with the Planning & Approvals module (planning conditions may have legal implications). It serves the Legal & Compliance Officer as the primary user, with visibility for Acquisition Managers, Finance Directors, and Admin/Support staff.

The module reuses the existing platform foundation (Clean Architecture, EF Core, MediatR, JWT + RBAC, Audit Interceptor, Notification Service, Document Storage).

## Glossary

- **Legal_Compliance_System**: The backend and frontend application module responsible for managing legal cases, contracts, compliance requirements, compliance checks, insurance records, audit records, and legal documents
- **LegalCase**: A domain entity representing a legal matter associated with an opportunity or planning application, containing case reference, description, type, status, priority, assigned solicitor details, and linked OpportunityId or PlanningApplicationId
- **Contract**: A domain entity representing a formal agreement between the company and a counterparty, containing contract reference, title, type, status, parties, value, key dates (start, end, renewal, termination), and linked LegalCaseId
- **LegalDocument**: A domain entity representing a file stored against a legal case or contract, containing document type, version, file metadata, classification, confidentiality level, and retention period
- **ComplianceRequirement**: A domain entity representing a regulatory or policy obligation that the company must meet, containing requirement name, category, source regulation, description, frequency, and responsible role
- **ComplianceCheck**: A domain entity representing a specific instance of verifying compliance against a ComplianceRequirement, containing check date, status, evidence reference, findings, and reviewer identity
- **InsuranceRecord**: A domain entity representing an insurance policy held by the company, containing policy number, insurer, coverage type, cover amount, premium, start date, expiry date, renewal status, and linked LegalCaseId or OpportunityId
- **AuditRecord**: A domain entity representing an internal or external audit event within the legal module, containing audit type, scope, findings, recommendations, auditor, and completion date
- **Legal_Compliance_Officer**: A user role responsible for managing all legal cases, contracts, compliance requirements, insurance, and audit activities
- **Acquisition_Manager**: A user role with read access to legal case status and documents related to their land opportunities
- **Finance_Director**: A user role with approval authority over high-value contracts exceeding a configurable threshold
- **Admin_Support**: A user role responsible for documentation, data entry, and uploading legal documents
- **State_Machine**: A set of rules governing which status transitions are permitted for LegalCase and Contract entities, preventing invalid workflow progressions
- **LandOpportunity**: The domain entity from the Land Acquisition module referenced by OpportunityId foreign key
- **PlanningApplication**: The domain entity from the Planning & Approvals module referenced by PlanningApplicationId foreign key
- **ApiResponse_Envelope**: The standard response wrapper returning data, success flag, errors array, and pagination metadata
- **BaseEntity**: The abstract base class providing Id, audit columns (CreatedAt, CreatedBy, UpdatedAt, UpdatedBy), soft-delete columns (IsDeleted, DeletedAt, DeletedBy), RowVersion, and domain events

## Requirements

### Requirement 1: Legal Case Creation and Management

**User Story:** As a Legal & Compliance Officer, I want to create and manage legal cases linked to land opportunities or planning applications, so that all legal matters are tracked centrally with full traceability.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer submits a valid case creation request with Title, Description, CaseType, Priority, and at least one of OpportunityId or PlanningApplicationId, THE Legal_Compliance_System SHALL create a new LegalCase entity with Status set to Open and return the created record in the ApiResponse_Envelope
2. THE Legal_Compliance_System SHALL validate that Title is between 5 and 200 characters, Description is between 10 and 2000 characters, CaseType is one of Conveyancing, Dispute, Contract Review, Regulatory, Planning, or General, and Priority is one of Low, Medium, High, or Critical
3. THE Legal_Compliance_System SHALL validate that a referenced OpportunityId corresponds to an existing LandOpportunity and a referenced PlanningApplicationId corresponds to an existing PlanningApplication
4. THE Legal_Compliance_System SHALL generate a unique CaseReference in the format LC-YYYY-NNNNN (year and sequential number) for every new LegalCase
5. THE Legal_Compliance_System SHALL assign a new Guid identifier, set CreatedAt to UTC now, and set CreatedBy to the authenticated user identifier on every new LegalCase
6. WHEN a LegalCase is created, THE Legal_Compliance_System SHALL log an audit trail entry recording the creation action, user, timestamp, and entity data
7. THE Legal_Compliance_System SHALL allow the Legal_Compliance_Officer to update LegalCase details including Title, Description, Priority, AssignedSolicitor, SolicitorFirm, SolicitorEmail, SolicitorPhone, and Notes fields

### Requirement 2: Legal Case Status Transitions

**User Story:** As a Legal & Compliance Officer, I want the system to enforce valid legal case status transitions, so that cases follow the correct lifecycle from open through to closure.

#### Acceptance Criteria

1. THE Legal_Compliance_System SHALL enforce the following status transitions using a State_Machine: Open → In Progress, Open → On Hold, In Progress → Under Review, In Progress → On Hold, In Progress → Escalated, Under Review → Resolved, Under Review → Escalated, Under Review → In Progress, On Hold → Open, On Hold → In Progress, Escalated → In Progress, Escalated → Under Review, Resolved → Closed, Closed → Reopened, Reopened → In Progress
2. IF a user attempts a status transition not defined in the State_Machine rules, THEN THE Legal_Compliance_System SHALL return HTTP 400 Bad Request with an error message listing the permitted transitions from the current status
3. WHEN a status transition occurs, THE Legal_Compliance_System SHALL log an audit trail entry recording the previous status, new status, user, timestamp, and transition reason
4. WHEN the status changes to Resolved, THE Legal_Compliance_System SHALL require a ResolutionSummary of at least 20 characters and a ResolutionDate as a valid past or present UTC date
5. WHEN the status changes to Closed, THE Legal_Compliance_System SHALL require confirmation that all associated Contracts have a Status of Completed, Terminated, or Expired
6. WHEN the status changes to Escalated, THE Legal_Compliance_System SHALL require an EscalationReason of at least 10 characters and send a notification to the Finance_Director
7. WHEN the status changes to On Hold, THE Legal_Compliance_System SHALL require a HoldReason of at least 10 characters

### Requirement 3: Contract Management

**User Story:** As a Legal & Compliance Officer, I want to create, review, and track contracts through their lifecycle, so that all agreements are properly managed and key dates are monitored.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer submits a valid contract creation request with LegalCaseId, Title, ContractType, CounterpartyName, ContractValue, Currency, StartDate, and EndDate, THE Legal_Compliance_System SHALL create a new Contract entity with Status set to Draft and return the created record in the ApiResponse_Envelope
2. THE Legal_Compliance_System SHALL validate that Title is between 5 and 300 characters, ContractType is one of Land Purchase, Construction, Professional Services, Insurance, Lease, Settlement, or Framework Agreement, CounterpartyName is between 2 and 200 characters, ContractValue is a positive decimal with precision of 18 digits and 2 decimal places, Currency is a valid 3-letter ISO 4217 code, and StartDate is before or equal to EndDate
3. THE Legal_Compliance_System SHALL generate a unique ContractReference in the format CON-YYYY-NNNNN for every new Contract
4. THE Legal_Compliance_System SHALL validate that the referenced LegalCaseId corresponds to an existing LegalCase with Status of Open, In Progress, or Under Review
5. WHEN a Contract ContractValue exceeds a configurable threshold (default 50,000 in base currency), THE Legal_Compliance_System SHALL require Finance_Director approval before the Status can transition from Draft to Under Review
6. THE Legal_Compliance_System SHALL allow recording of RenewalDate, TerminationClause (up to 1000 characters), SpecialConditions (up to 2000 characters), and PaymentTerms (up to 500 characters) on Contract entities
7. WHEN a Contract is created or updated, THE Legal_Compliance_System SHALL log an audit trail entry recording the action, user, timestamp, and changed fields

### Requirement 4: Contract Status Transitions

**User Story:** As a Legal & Compliance Officer, I want the system to enforce valid contract status transitions, so that contracts follow a proper review and execution process.

#### Acceptance Criteria

1. THE Legal_Compliance_System SHALL enforce the following Contract status transitions using a State_Machine: Draft → Under Review, Draft → Cancelled, Under Review → Approved, Under Review → Rejected, Under Review → Draft, Approved → Awaiting Signature, Awaiting Signature → Executed, Awaiting Signature → Cancelled, Executed → Active, Active → Completed, Active → Terminated, Active → Expired, Active → Under Dispute, Under Dispute → Active, Under Dispute → Terminated, Terminated → Closed, Completed → Closed, Expired → Renewed, Expired → Closed, Renewed → Active, Cancelled → Closed
2. IF a user attempts a status transition not defined in the State_Machine rules, THEN THE Legal_Compliance_System SHALL return HTTP 400 Bad Request with an error message listing the permitted transitions from the current status
3. WHEN a Contract status changes to Executed, THE Legal_Compliance_System SHALL require an ExecutionDate as a valid past or present UTC date and SignatoryNames of at least 5 characters
4. WHEN a Contract status changes to Terminated, THE Legal_Compliance_System SHALL require a TerminationReason of at least 20 characters and TerminationDate as a valid past or present UTC date
5. WHEN a Contract status changes to Approved, THE Legal_Compliance_System SHALL record the approver identity, approval timestamp, and approval notes
6. WHEN a Contract status transitions to Active, Terminated, or Expired, THE Legal_Compliance_System SHALL send a notification to the Legal_Compliance_Officer and Acquisition_Manager associated with the linked LandOpportunity

### Requirement 5: Compliance Requirement Management

**User Story:** As a Legal & Compliance Officer, I want to define and maintain regulatory compliance requirements, so that all obligations are documented and trackable across the business.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer submits a valid compliance requirement with Name, Category, Description, SourceRegulation, Frequency, and ResponsibleRole, THE Legal_Compliance_System SHALL create a new ComplianceRequirement entity with Status set to Active and return the created record in the ApiResponse_Envelope
2. THE Legal_Compliance_System SHALL validate that Name is between 5 and 200 characters, Category is one of Health and Safety, Environmental, Financial, Data Protection, Building Regulations, Planning Compliance, Anti Money Laundering, or Employment, Description is between 10 and 2000 characters, SourceRegulation is between 3 and 300 characters, Frequency is one of One-Off, Daily, Weekly, Monthly, Quarterly, Annually, or Ongoing, and ResponsibleRole is a valid system role name
3. THE Legal_Compliance_System SHALL enforce uniqueness of ComplianceRequirement Name within the same Category
4. THE Legal_Compliance_System SHALL allow the Legal_Compliance_Officer to update ComplianceRequirement details and mark requirements as Superseded or Retired with a reason of at least 10 characters
5. THE Legal_Compliance_System SHALL return a paginated list of ComplianceRequirements filterable by Category, Status, Frequency, and ResponsibleRole, with support for sorting by Name, Category, and CreatedAt
6. THE Legal_Compliance_System SHALL calculate and return the compliance status summary showing total requirements, compliant count, non-compliant count, and overdue check count per Category

### Requirement 6: Compliance Check Execution

**User Story:** As a Legal & Compliance Officer, I want to perform and record compliance checks against requirements, so that evidence of regulatory compliance is captured and auditable.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer submits a compliance check with ComplianceRequirementId, CheckDate, Outcome, Findings, and EvidenceReference, THE Legal_Compliance_System SHALL create a new ComplianceCheck entity and return the created record in the ApiResponse_Envelope
2. THE Legal_Compliance_System SHALL validate that the referenced ComplianceRequirementId corresponds to an existing ComplianceRequirement with Status of Active, CheckDate is a valid past or present UTC date, Outcome is one of Compliant, Non-Compliant, Partially Compliant, or Not Applicable, and Findings is between 10 and 3000 characters
3. WHEN a ComplianceCheck Outcome is Non-Compliant, THE Legal_Compliance_System SHALL require a RemediationPlan of at least 20 characters and a RemediationDueDate as a valid future UTC date
4. WHEN a ComplianceCheck Outcome is Non-Compliant, THE Legal_Compliance_System SHALL send a notification to the Legal_Compliance_Officer and Finance_Director
5. THE Legal_Compliance_System SHALL track the NextDueDate for each ComplianceRequirement based on the Frequency and the most recent ComplianceCheck date
6. WHEN the current date exceeds the NextDueDate of a ComplianceRequirement and no ComplianceCheck has been recorded for that period, THE Legal_Compliance_System SHALL mark the requirement as Overdue and send a notification to the responsible user
7. THE Legal_Compliance_System SHALL return a paginated list of ComplianceChecks for a given requirement, ordered by CheckDate descending, filterable by Outcome and date range

### Requirement 7: Insurance Record Management

**User Story:** As a Legal & Compliance Officer, I want to manage insurance policies with expiry tracking and renewal alerts, so that the company maintains continuous coverage and avoids gaps in protection.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer submits a valid insurance record with PolicyNumber, Insurer, CoverageType, CoverAmount, Premium, Currency, StartDate, ExpiryDate, and optionally OpportunityId or LegalCaseId, THE Legal_Compliance_System SHALL create a new InsuranceRecord entity with Status set to Active and return the created record in the ApiResponse_Envelope
2. THE Legal_Compliance_System SHALL validate that PolicyNumber is between 3 and 50 characters and unique across all active InsuranceRecords, Insurer is between 2 and 200 characters, CoverageType is one of Professional Indemnity, Public Liability, Employers Liability, Building Insurance, Title Insurance, Contractors All Risk, or Legal Expenses, CoverAmount and Premium are positive decimals with precision of 18 digits and 2 decimal places, Currency is a valid 3-letter ISO 4217 code, and StartDate is before ExpiryDate
3. THE Legal_Compliance_System SHALL enforce InsuranceRecord status transitions: Active → Expiring Soon, Active → Cancelled, Expiring Soon → Renewed, Expiring Soon → Expired, Expiring Soon → Cancelled, Expired → Renewed, Renewed → Active, Cancelled → Closed
4. WHEN an InsuranceRecord ExpiryDate is within 30 days of the current date and the Status is Active, THE Legal_Compliance_System SHALL automatically transition the Status to Expiring Soon and send a notification to the Legal_Compliance_Officer
5. WHEN an InsuranceRecord ExpiryDate has passed and the Status is Expiring Soon, THE Legal_Compliance_System SHALL automatically transition the Status to Expired and send a notification to the Legal_Compliance_Officer and Finance_Director
6. WHEN an InsuranceRecord is renewed, THE Legal_Compliance_System SHALL create a new InsuranceRecord linked to the previous record via PreviousPolicyId, carrying forward PolicyNumber, Insurer, CoverageType, and associated entity links
7. THE Legal_Compliance_System SHALL return a paginated list of InsuranceRecords filterable by CoverageType, Status, Insurer, and expiry date range, with support for sorting by ExpiryDate, CoverAmount, and PolicyNumber

### Requirement 8: Legal Document Management

**User Story:** As an Admin/Support user, I want to upload, classify, version, and retrieve legal documents against cases and contracts, so that all legal paperwork is organized, accessible, and auditable.

#### Acceptance Criteria

1. WHEN a user uploads a document with a linked LegalCaseId or ContractId, DocumentType, ConfidentialityLevel, and file content, THE Legal_Compliance_System SHALL store the document metadata and file, setting UploadedAt to UTC now and Version to 1
2. THE Legal_Compliance_System SHALL validate that DocumentType is one of Title Deed, Search Report, Contract, Land Registry Record, Insurance Certificate, Compliance Certificate, Legal Opinion, Correspondence, Court Order, or Regulatory Filing, and ConfidentialityLevel is one of Public, Internal, Confidential, or Restricted
3. THE Legal_Compliance_System SHALL validate that uploaded files do not exceed 50 megabytes in size and are of an allowed content type (PDF, DOCX, XLSX, PNG, JPG, TIFF)
4. WHEN a new version of an existing document is uploaded, THE Legal_Compliance_System SHALL increment the Version number, retain all previous versions, and record the upload in the audit trail
5. THE Legal_Compliance_System SHALL return a paginated list of documents for a given legal case or contract, filterable by DocumentType, ConfidentialityLevel, and upload date range
6. THE Legal_Compliance_System SHALL restrict access to documents with ConfidentialityLevel of Restricted to users with the Legal_Compliance_Officer role only
7. THE Legal_Compliance_System SHALL prevent document deletion by users without the Legal_Compliance_Officer role and record all deletions in the audit trail
8. THE Legal_Compliance_System SHALL support document retention periods, tracking RetentionExpiryDate on each LegalDocument, and send a notification to the Legal_Compliance_Officer 30 days before a document retention period expires

### Requirement 9: Audit Record Management

**User Story:** As a Legal & Compliance Officer, I want to create and track internal and external audit records, so that regulatory audits are documented and findings are tracked to resolution.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer submits an audit record with AuditType, Scope, AuditorName, AuditDate, and optionally linked LegalCaseId or ComplianceRequirementId, THE Legal_Compliance_System SHALL create a new AuditRecord entity with Status set to Planned and return the created record in the ApiResponse_Envelope
2. THE Legal_Compliance_System SHALL validate that AuditType is one of Internal, External, Regulatory, or Spot Check, Scope is between 10 and 1000 characters, AuditorName is between 2 and 150 characters, and AuditDate is a valid date
3. THE Legal_Compliance_System SHALL enforce AuditRecord status transitions: Planned → In Progress, In Progress → Findings Recorded, Findings Recorded → Actions Required, Findings Recorded → Closed, Actions Required → Remediation In Progress, Remediation In Progress → Verified, Verified → Closed
4. WHEN an AuditRecord status changes to Findings Recorded, THE Legal_Compliance_System SHALL require Findings text of at least 20 characters and a RiskRating of Low, Medium, High, or Critical
5. WHEN an AuditRecord status changes to Actions Required, THE Legal_Compliance_System SHALL require Recommendations text of at least 20 characters and an ActionDueDate as a valid future UTC date
6. WHEN an AuditRecord ActionDueDate has passed and the status is Actions Required or Remediation In Progress, THE Legal_Compliance_System SHALL mark the record as Overdue and send a notification to the Legal_Compliance_Officer
7. THE Legal_Compliance_System SHALL return a paginated list of AuditRecords filterable by AuditType, Status, RiskRating, and date range, with support for sorting by AuditDate, Status, and RiskRating

### Requirement 10: Role-Based Access Control

**User Story:** As a system administrator, I want role-based permissions enforced on all legal and compliance operations, so that users can only perform actions appropriate to their role.

#### Acceptance Criteria

1. THE Legal_Compliance_System SHALL restrict LegalCase creation, update, and status transitions to users with the Legal_Compliance_Officer or Admin_Support role
2. THE Legal_Compliance_System SHALL restrict Contract creation, update, and status transitions to users with the Legal_Compliance_Officer role
3. THE Legal_Compliance_System SHALL restrict ComplianceRequirement creation and management to users with the Legal_Compliance_Officer role
4. THE Legal_Compliance_System SHALL restrict ComplianceCheck recording to users with the Legal_Compliance_Officer or Admin_Support role
5. THE Legal_Compliance_System SHALL restrict Contract approval (transition to Approved) to users with the Finance_Director role when ContractValue exceeds the configurable threshold
6. THE Legal_Compliance_System SHALL restrict InsuranceRecord creation and management to users with the Legal_Compliance_Officer or Admin_Support role
7. THE Legal_Compliance_System SHALL allow read access to LegalCase and Contract summaries for users with the Acquisition_Manager role, limited to cases linked to their assigned opportunities
8. IF an unauthenticated user attempts to access any legal endpoint, THEN THE Legal_Compliance_System SHALL return HTTP 401 Unauthorized
9. IF an authenticated user without the required role attempts a restricted operation, THEN THE Legal_Compliance_System SHALL return HTTP 403 Forbidden

### Requirement 11: Dashboard and KPI Reporting

**User Story:** As a Legal & Compliance Officer, I want a dashboard showing legal metrics, compliance status, and risk summaries, so that I can monitor the legal position of the company at a glance.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer requests the dashboard data, THE Legal_Compliance_System SHALL return the total count of LegalCases grouped by Status and Priority
2. THE Legal_Compliance_System SHALL calculate and return the Average Case Resolution Time in days, measured from CreatedAt to ResolutionDate for cases with Status of Resolved or Closed
3. THE Legal_Compliance_System SHALL calculate and return the Compliance Rate as the percentage of ComplianceChecks with Outcome of Compliant out of total checks recorded in the current reporting period
4. THE Legal_Compliance_System SHALL return the count of InsuranceRecords with Status of Expiring Soon or Expired
5. THE Legal_Compliance_System SHALL return the total active ContractValue grouped by ContractType and the count of Contracts awaiting approval
6. THE Legal_Compliance_System SHALL return overdue ComplianceRequirements and overdue AuditRecord actions requiring attention
7. THE Legal_Compliance_System SHALL return recent activity showing the last 10 actions performed across all legal entities with timestamps and user names
8. THE Legal_Compliance_System SHALL return a risk summary showing LegalCases and AuditRecords with High or Critical priority or risk rating

### Requirement 12: Notification on Key Events

**User Story:** As a stakeholder, I want to receive notifications when key legal and compliance events occur, so that I am informed of risks and deadlines without manually checking the system.

#### Acceptance Criteria

1. WHEN a LegalCase status transitions to Escalated, THE Legal_Compliance_System SHALL send a notification to the Finance_Director and Legal_Compliance_Officer
2. WHEN a Contract status transitions to Executed or Terminated, THE Legal_Compliance_System SHALL send a notification to the Legal_Compliance_Officer and Acquisition_Manager associated with the linked LandOpportunity
3. WHEN an InsuranceRecord transitions to Expiring Soon, THE Legal_Compliance_System SHALL send a notification to the Legal_Compliance_Officer with the policy details and expiry date
4. WHEN a ComplianceCheck records a Non-Compliant outcome, THE Legal_Compliance_System SHALL send a notification to the Legal_Compliance_Officer and Finance_Director
5. WHEN a ComplianceRequirement becomes Overdue, THE Legal_Compliance_System SHALL send a notification to the user in the ResponsibleRole for that requirement
6. WHEN an AuditRecord action becomes Overdue, THE Legal_Compliance_System SHALL send a notification to the Legal_Compliance_Officer
7. THE Legal_Compliance_System SHALL record all sent notifications with recipient, timestamp, event type, and read status

### Requirement 13: Audit Trail and Compliance

**User Story:** As a Legal & Compliance Officer, I want a complete, immutable audit trail of all actions performed within the legal module, so that regulatory compliance and traceability requirements are met.

#### Acceptance Criteria

1. THE Legal_Compliance_System SHALL record an audit log entry for every create, update, and delete operation on LegalCase, Contract, LegalDocument, ComplianceRequirement, ComplianceCheck, InsuranceRecord, and AuditRecord entities
2. THE Legal_Compliance_System SHALL store in each audit entry: UserId, UserName, Action, EntityName, EntityId, OldValues (JSON), NewValues (JSON), AffectedColumns, Timestamp (UTC), IpAddress, and CorrelationId
3. THE Legal_Compliance_System SHALL prevent modification or deletion of audit log entries (append-only)
4. WHEN the Legal_Compliance_Officer requests the audit history for an entity, THE Legal_Compliance_System SHALL return a paginated, chronologically ordered list of audit entries filterable by action type, entity type, user, and date range
5. THE Legal_Compliance_System SHALL include the CorrelationId from the originating HTTP request in every audit entry to enable end-to-end request tracing
6. THE Legal_Compliance_System SHALL support exporting audit trail data for a specified date range and entity type in CSV format for compliance reviews

### Requirement 14: Legal Case Pipeline and Register Views

**User Story:** As a Legal & Compliance Officer, I want a visual pipeline view and register of all legal cases, so that I can quickly assess workload distribution and case progress.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer navigates to the legal pipeline page, THE Legal_Compliance_System SHALL display cases grouped into columns by their current Status (Open, In Progress, Under Review, Escalated, On Hold, Resolved, Closed)
2. THE Legal_Compliance_System SHALL display each case card showing Title, CaseReference, CaseType, Priority (color-coded), linked OpportunityName, and days since last status change
3. THE Legal_Compliance_System SHALL provide a contract register view showing all contracts in a paginated data table with columns for ContractReference, Title, ContractType, CounterpartyName, ContractValue, Status, StartDate, EndDate, and linked CaseReference
4. THE Legal_Compliance_System SHALL load pipeline and register data using NgRx state management with actions for loading, success, and failure states
5. WHILE data is loading, THE Legal_Compliance_System SHALL display a skeleton loading state in place of the pipeline columns or table rows
6. IF data fails to load, THEN THE Legal_Compliance_System SHALL display an error state with a retry action button and a user-friendly error message

### Requirement 15: Legal Case and Contract Detail Pages

**User Story:** As a Legal & Compliance Officer, I want comprehensive detail pages for legal cases and contracts showing all related data in organized tabs, so that I can review complete information without navigating away.

#### Acceptance Criteria

1. WHEN the user navigates to a legal case detail page, THE Legal_Compliance_System SHALL display case summary information (Title, CaseReference, CaseType, Status, Priority, AssignedSolicitor, SolicitorFirm, linked OpportunityName) in a header section
2. THE Legal_Compliance_System SHALL organize legal case related data into tabs: Overview, Contracts, Documents, Compliance, Insurance, and Activity
3. WHEN the user navigates to a contract detail page, THE Legal_Compliance_System SHALL display contract summary information (Title, ContractReference, ContractType, CounterpartyName, ContractValue, Status, StartDate, EndDate) in a header section
4. THE Legal_Compliance_System SHALL organize contract related data into tabs: Overview, Documents, Signatories, Key Dates, and Activity
5. THE Legal_Compliance_System SHALL display a status progress indicator showing the entity lifecycle position
6. WHEN the user selects the Activity tab, THE Legal_Compliance_System SHALL display a chronological timeline of all status changes and audit events for the entity
7. THE Legal_Compliance_System SHALL display contextual action buttons based on the current entity status and user role

### Requirement 16: Frontend Forms with Validation

**User Story:** As a Legal & Compliance Officer, I want reactive forms with inline validation for creating and editing legal entities, so that I receive immediate feedback on data entry errors.

#### Acceptance Criteria

1. THE Legal_Compliance_System SHALL implement all data entry forms using Angular Reactive Forms with typed FormGroup definitions
2. THE Legal_Compliance_System SHALL display inline validation error messages on form fields when validation fails on blur or form submission
3. THE Legal_Compliance_System SHALL disable the submit button until the form passes client-side validation
4. WHEN the user submits a form with server-side validation errors, THE Legal_Compliance_System SHALL map server error responses to the corresponding form fields and display them inline
5. THE Legal_Compliance_System SHALL implement unsaved changes detection and display a confirmation dialog when the user attempts to navigate away from a form with unsaved changes
6. THE Legal_Compliance_System SHALL provide helper text and field descriptions on complex form fields to guide the user through legal-specific terminology such as ContractType, CoverageType, and ConfidentialityLevel

### Requirement 17: Frontend State Management

**User Story:** As a developer, I want NgRx store slices for all legal and compliance data, so that state is centralized, predictable, and efficiently shared across components.

#### Acceptance Criteria

1. THE Legal_Compliance_System SHALL implement an NgRx feature store for legal cases with actions for load, create, update, delete, and status transition operations
2. THE Legal_Compliance_System SHALL implement separate NgRx entity states for Contracts, ComplianceRequirements, ComplianceChecks, InsuranceRecords, AuditRecords, and LegalDocuments using @ngrx/entity EntityAdapter
3. THE Legal_Compliance_System SHALL implement NgRx effects to handle all API calls, dispatching success or failure actions based on the response
4. THE Legal_Compliance_System SHALL implement memoized selectors for derived state including filtered lists, pipeline groupings, dashboard metrics, overdue counts, and expiring insurance counts
5. WHEN an API call fails, THE Legal_Compliance_System SHALL store the error message in state and display a toast notification to the user

### Requirement 18: Frontend Dashboard

**User Story:** As a Legal & Compliance Officer, I want a landing dashboard showing KPI cards, case pipeline summary, compliance status, insurance alerts, and recent activity, so that I can understand the legal position within seconds.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer navigates to the legal dashboard, THE Legal_Compliance_System SHALL display KPI metric cards for Open Cases Count, Average Resolution Time, Compliance Rate, Contracts Awaiting Approval Count, and Expiring Insurance Count
2. THE Legal_Compliance_System SHALL display a case pipeline summary chart showing the count of legal cases per status
3. THE Legal_Compliance_System SHALL display a compliance overview section showing requirement status distribution (Compliant, Non-Compliant, Overdue) per Category
4. THE Legal_Compliance_System SHALL display an insurance alerts section showing policies that are Expiring Soon or Expired
5. THE Legal_Compliance_System SHALL display a recent activity section showing the last 5 actions performed across all legal entities
6. WHILE dashboard data is loading, THE Legal_Compliance_System SHALL display skeleton loading placeholders for each widget
7. THE Legal_Compliance_System SHALL refresh dashboard data when the user navigates to the dashboard page

### Requirement 19: Integration with Land Acquisition and Planning Modules

**User Story:** As an Acquisition Manager, I want to view the legal status of my opportunities from within the land acquisition context, so that I can track legal progress without switching modules.

#### Acceptance Criteria

1. THE Legal_Compliance_System SHALL reference the LandOpportunity entity from the Land Acquisition module via an OpportunityId foreign key on LegalCase
2. THE Legal_Compliance_System SHALL optionally reference the PlanningApplication entity from the Planning & Approvals module via a PlanningApplicationId foreign key on LegalCase
3. WHEN a LegalCase is created with an OpportunityId, THE Legal_Compliance_System SHALL validate that the referenced LandOpportunity exists (regardless of its status, as legal cases may be needed at any stage)
4. THE Legal_Compliance_System SHALL expose a summary endpoint returning LegalCase count, open case count, active contract count, and compliance status for a given OpportunityId, to be consumed by the Land Acquisition module
5. THE Legal_Compliance_System SHALL expose a summary endpoint returning LegalCase status and linked contract information for a given PlanningApplicationId, to be consumed by the Planning & Approvals module
6. WHEN a LegalCase status changes to Resolved or Closed, THE Legal_Compliance_System SHALL publish a domain event that other modules can subscribe to for updating their own status displays

### Requirement 20: Compliance Checklist View

**User Story:** As a Legal & Compliance Officer, I want a compliance checklist view showing all requirements with their current compliance status and next due dates, so that I can quickly identify gaps and prioritize checks.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer navigates to the compliance checklist page, THE Legal_Compliance_System SHALL display all active ComplianceRequirements in a data table with columns for Name, Category, Frequency, Last Check Date, Last Outcome, Next Due Date, and Status indicator
2. THE Legal_Compliance_System SHALL color-code the Status indicator: green for Compliant (last check passed and next check not due), amber for Due Soon (next check due within 7 days), red for Overdue (next check date has passed), and grey for Not Yet Checked
3. THE Legal_Compliance_System SHALL support filtering by Category, Status, Frequency, and ResponsibleRole
4. THE Legal_Compliance_System SHALL support sorting by Name, Category, Next Due Date, and Last Outcome
5. WHEN the Legal_Compliance_Officer clicks on a requirement row, THE Legal_Compliance_System SHALL navigate to the requirement detail page showing the full check history, current compliance status, and action to record a new check
6. THE Legal_Compliance_System SHALL display a summary bar above the table showing total requirements, compliant count, overdue count, and due soon count
