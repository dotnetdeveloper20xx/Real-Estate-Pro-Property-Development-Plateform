# Requirements Document

## Introduction

The Land Acquisition Module is the first business module of the BuildEstate Pro platform. It manages the full lifecycle of land opportunities from identification and evaluation through to acquisition and ownership transfer. The module sits at the beginning of the development lifecycle (Land → Planning → Legal → Project Management → Construction → Sales → Handover → Operations → Analytics) and feeds acquired land into downstream modules.

This module serves Acquisition Managers, Legal & Compliance Officers, Valuation Analysts, Finance Directors, and Admin/Support staff. It integrates with the existing platform foundation (Clean Architecture, EF Core, MediatR, JWT + RBAC, middleware) established in the project-foundation-setup spec.

## Glossary

- **Land_Acquisition_System**: The backend and frontend application module responsible for managing land opportunities, due diligence, offers, contracts, and ownership transfer
- **Opportunity_Pipeline**: The ordered collection of LandOpportunity records progressing through defined statuses from Identified to Acquired or Withdrawn
- **LandOpportunity**: A domain entity representing a potential land parcel under evaluation for acquisition, containing location, size, source, status, and financial data
- **LandOwner**: A domain entity representing the current owner of a land opportunity, including contact details, address, and ownership type (Freehold or Leasehold)
- **DueDiligence**: A domain entity representing a specific check or investigation performed against an opportunity (Legal, Environmental, Planning, Utilities, or Valuation type)
- **Offer**: A domain entity representing a formal monetary offer made against an opportunity, with amount, currency, validity period, and status
- **LandAcquisition**: A domain entity representing the completed purchase of a land opportunity, recording purchase price, completion date, registry reference, and registration status
- **Document**: A domain entity representing a file uploaded against an opportunity (Title Deed, Search Report, Legal Document, or Environmental Report)
- **Acquisition_Manager**: A user role responsible for finding, evaluating, and managing land opportunities through the pipeline
- **Legal_Compliance_Officer**: A user role responsible for conducting due diligence checks and managing legal documents and contracts
- **Valuation_Analyst**: A user role responsible for financial review, feasibility analysis, and ROI calculations
- **Finance_Director**: A user role with approval authority over acquisition decisions and budget commitments
- **Admin_Support**: A user role responsible for documentation, data entry, and administrative tasks
- **State_Machine**: A set of rules governing which status transitions are permitted for an entity, preventing invalid workflow progressions
- **ApiResponse_Envelope**: The standard response wrapper returning data, success flag, errors array, and pagination metadata
- **BaseEntity**: The abstract base class providing Id, audit columns (CreatedAt, CreatedBy, UpdatedAt, UpdatedBy), soft-delete columns (IsDeleted, DeletedAt, DeletedBy), RowVersion, and domain events

## Requirements

### Requirement 1: Land Opportunity Creation

**User Story:** As an Acquisition Manager, I want to create a new land opportunity record, so that I can capture potential land leads into the pipeline for evaluation.

#### Acceptance Criteria

1. WHEN the Acquisition_Manager submits a valid opportunity creation request with Name, Location, and LandSize, THE Land_Acquisition_System SHALL create a new LandOpportunity entity with Status set to Identified and return the created record in the ApiResponse_Envelope
2. THE Land_Acquisition_System SHALL validate that Name is between 3 and 200 characters, Location is between 3 and 500 characters, and LandSize is a positive decimal value before creating the LandOpportunity
3. IF the Acquisition_Manager submits an opportunity with a Name and Location combination that already exists, THEN THE Land_Acquisition_System SHALL return HTTP 409 Conflict with an error message indicating the duplicate
4. THE Land_Acquisition_System SHALL assign a new Guid identifier, set CreatedAt to UTC now, and set CreatedBy to the authenticated user identifier on every new LandOpportunity
5. WHEN a LandOpportunity is created, THE Land_Acquisition_System SHALL log an audit trail entry recording the creation action, user, timestamp, and entity data

### Requirement 2: Land Opportunity Pipeline Management

**User Story:** As an Acquisition Manager, I want to view and manage the pipeline of land opportunities with filtering and sorting, so that I can prioritize and track evaluation progress.

#### Acceptance Criteria

1. WHEN the Acquisition_Manager requests the opportunity list, THE Land_Acquisition_System SHALL return a paginated list of LandOpportunity records with support for page number and page size parameters
2. THE Land_Acquisition_System SHALL support filtering opportunities by Status, Location, Source, and date range on ExpectedAcquisition
3. THE Land_Acquisition_System SHALL support sorting opportunities by Name, CreatedAt, LandSize, ExpectedAcquisition, and Status
4. THE Land_Acquisition_System SHALL support free-text search across Name, Location, and Source fields
5. THE Land_Acquisition_System SHALL exclude soft-deleted records from all query results by default
6. WHEN the Acquisition_Manager requests a single opportunity by Id, THE Land_Acquisition_System SHALL return the full opportunity detail including associated LandOwner, DueDiligence records, Offers, and Documents

### Requirement 3: Land Opportunity Status Transitions

**User Story:** As an Acquisition Manager, I want the system to enforce valid status transitions, so that opportunities follow the correct business workflow without skipping steps.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL enforce the following status transitions using a State_Machine: Identified → Initial Review, Initial Review → Due Diligence, Initial Review → Withdrawn, Due Diligence → Offer Made, Due Diligence → Withdrawn, Offer Made → Under Contract, Offer Made → Withdrawn, Under Contract → Acquired, Under Contract → Withdrawn
2. IF a user attempts a status transition not defined in the State_Machine rules, THEN THE Land_Acquisition_System SHALL return HTTP 400 Bad Request with an error message listing the permitted transitions from the current status
3. WHEN a status transition occurs, THE Land_Acquisition_System SHALL log an audit trail entry recording the previous status, new status, user, and timestamp
4. WHEN the status changes to Withdrawn, THE Land_Acquisition_System SHALL require a reason text of at least 10 characters explaining the withdrawal

### Requirement 4: Land Owner Management

**User Story:** As an Acquisition Manager, I want to record and manage land owner details linked to opportunities, so that I can maintain contact information and ownership context for negotiations.

#### Acceptance Criteria

1. WHEN the Acquisition_Manager submits valid owner details (Name, ContactDetails, Address, OwnershipType), THE Land_Acquisition_System SHALL create a LandOwner entity and associate it with the specified LandOpportunity
2. THE Land_Acquisition_System SHALL validate that LandOwner Name is between 2 and 200 characters, ContactDetails is between 5 and 500 characters, and OwnershipType is one of Freehold or Leasehold
3. THE Land_Acquisition_System SHALL allow updating LandOwner details and record the update in the audit trail
4. WHEN the Acquisition_Manager requests opportunity details, THE Land_Acquisition_System SHALL include the associated LandOwner information in the response

### Requirement 5: Due Diligence Management

**User Story:** As a Legal & Compliance Officer, I want to create and manage due diligence checks against opportunities, so that I can track legal, environmental, and planning assessments before acquisition proceeds.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer submits a due diligence request with OpportunityId, Type, and initial Findings, THE Land_Acquisition_System SHALL create a DueDiligence entity with Status set to Pending
2. THE Land_Acquisition_System SHALL validate that Type is one of Legal, Environmental, Planning, Utilities, or Valuation
3. THE Land_Acquisition_System SHALL enforce DueDiligence status transitions: Pending → In Progress, In Progress → Completed, In Progress → Failed
4. WHEN all mandatory DueDiligence checks (Legal, Environmental, Planning) reach Completed status for an opportunity, THE Land_Acquisition_System SHALL allow the opportunity to transition from Due Diligence to Offer Made
5. IF at least one mandatory DueDiligence check has Failed status and no formal waiver exists, THEN THE Land_Acquisition_System SHALL prevent the opportunity from transitioning to Offer Made
6. WHEN a DueDiligence status changes to Completed or Failed, THE Land_Acquisition_System SHALL record the ReportDate as UTC now
7. THE Land_Acquisition_System SHALL return a paginated list of DueDiligence records for a given opportunity, filterable by Type and Status

### Requirement 6: Valuation and Feasibility Assessment

**User Story:** As a Valuation Analyst, I want to record financial assessments and ROI calculations against opportunities, so that the investment committee can make informed acquisition decisions.

#### Acceptance Criteria

1. WHEN the Valuation_Analyst submits a feasibility assessment with estimated land cost, estimated build cost, professional fees, finance costs, and expected sales revenue, THE Land_Acquisition_System SHALL calculate and store the estimated profit and ROI percentage
2. THE Land_Acquisition_System SHALL validate that all monetary values are non-negative decimals with precision of 18 digits and 2 decimal places
3. THE Land_Acquisition_System SHALL calculate ROI as ((Expected Sales Revenue - Total Costs) / Total Costs) * 100, where Total Costs equals estimated land cost plus estimated build cost plus professional fees plus finance costs
4. THE Land_Acquisition_System SHALL store best-case, expected-case, and worst-case scenarios for each opportunity
5. WHEN the Valuation_Analyst marks an assessment as ready for review, THE Land_Acquisition_System SHALL notify the Finance_Director via the notification system

### Requirement 7: Offer and Negotiation Management

**User Story:** As an Acquisition Manager, I want to create offers, track negotiations, and manage counter-offers, so that I can conduct structured negotiations with land owners.

#### Acceptance Criteria

1. WHEN the Acquisition_Manager submits a valid offer with OpportunityId, Amount, Currency, and ValidUntil date, THE Land_Acquisition_System SHALL create an Offer entity with Status set to Under Review and OfferDate set to UTC now
2. THE Land_Acquisition_System SHALL validate that Amount is a positive decimal, Currency is a valid 3-letter ISO 4217 code, and ValidUntil is a future date
3. THE Land_Acquisition_System SHALL enforce Offer status transitions: Under Review → Accepted, Under Review → Rejected, Under Review → Counter-Offered, Counter-Offered → Under Review, Counter-Offered → Accepted, Counter-Offered → Rejected
4. IF the ValidUntil date passes without a status change from Under Review, THEN THE Land_Acquisition_System SHALL mark the Offer Status as Expired
5. WHEN an Offer status changes to Accepted, THE Land_Acquisition_System SHALL automatically transition the parent LandOpportunity status to Under Contract if the current status is Offer Made
6. THE Land_Acquisition_System SHALL support multiple offers per opportunity and return them ordered by OfferDate descending
7. WHEN a counter-offer is recorded, THE Land_Acquisition_System SHALL store the counter-offer amount and link it to the original offer

### Requirement 8: Contract and Exchange Management

**User Story:** As a Legal & Compliance Officer, I want to track contract drafting, legal review, signing, and exchange, so that the legal process is documented and auditable.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer creates a contract record for an opportunity that has an accepted offer, THE Land_Acquisition_System SHALL create a contract entity with Status set to Draft
2. THE Land_Acquisition_System SHALL enforce contract status transitions: Draft → Under Legal Review, Under Legal Review → Approved, Under Legal Review → Rejected, Approved → Signed, Signed → Exchanged, Exchanged → Completed
3. WHEN the contract Status changes to Exchanged, THE Land_Acquisition_System SHALL require a deposit amount to be recorded as a positive decimal value
4. THE Land_Acquisition_System SHALL store solicitor name, solicitor firm, and solicitor contact details on the contract record
5. WHEN a contract status changes, THE Land_Acquisition_System SHALL log an audit trail entry with the previous and new status, user, and timestamp

### Requirement 9: Document Management

**User Story:** As an Admin/Support user, I want to upload, categorize, and retrieve documents against opportunities, so that all relevant paperwork is organized and accessible.

#### Acceptance Criteria

1. WHEN a user uploads a document with OpportunityId, DocType, and file content, THE Land_Acquisition_System SHALL store the document metadata and file, setting UploadedAt to UTC now
2. THE Land_Acquisition_System SHALL validate that DocType is one of Title Deed, Search Report, Legal Document, or Environmental Report
3. THE Land_Acquisition_System SHALL validate that uploaded files do not exceed 25 megabytes in size and are of an allowed content type (PDF, DOCX, XLSX, PNG, JPG)
4. THE Land_Acquisition_System SHALL return a paginated list of documents for a given opportunity, filterable by DocType
5. WHEN a user requests a document download, THE Land_Acquisition_System SHALL return the file content with the correct content type header
6. THE Land_Acquisition_System SHALL prevent document deletion by non-admin roles and record all deletions in the audit trail

### Requirement 10: Land Registry and Ownership Transfer

**User Story:** As an Admin/Support user, I want to record land registry submissions and track registration progress, so that ownership transfer is documented and the title reference is captured.

#### Acceptance Criteria

1. WHEN the Admin_Support user submits a registry record for an opportunity with status Under Contract or Acquired, THE Land_Acquisition_System SHALL create a LandAcquisition entity with Status set to Completed
2. THE Land_Acquisition_System SHALL validate that PurchasePrice is a positive decimal, CompletionDate is a valid past or present date, and RegistryRef is between 3 and 50 characters
3. WHEN the RegistryRef is provided and confirmed, THE Land_Acquisition_System SHALL update the LandAcquisition Status from Completed to Registered
4. WHEN a LandAcquisition reaches Registered status, THE Land_Acquisition_System SHALL update the parent LandOpportunity status to Acquired
5. THE Land_Acquisition_System SHALL enforce that only one active LandAcquisition record exists per LandOpportunity

### Requirement 11: Approval Workflow

**User Story:** As a Finance Director, I want to review and approve acquisition decisions at key stages, so that financial commitments require authorized sign-off before proceeding.

#### Acceptance Criteria

1. WHEN an opportunity reaches the Offer Made status, THE Land_Acquisition_System SHALL require Finance_Director approval before the offer amount exceeds a configurable threshold (default 500,000 in base currency)
2. THE Land_Acquisition_System SHALL enforce the approval workflow: Created → Reviewed → Evaluated → Approved → Acquired
3. WHEN the Finance_Director approves an acquisition, THE Land_Acquisition_System SHALL record the approver identity, approval timestamp, and approval notes
4. IF the Finance_Director rejects an acquisition, THEN THE Land_Acquisition_System SHALL record the rejection reason and notify the Acquisition_Manager
5. WHILE an approval is pending, THE Land_Acquisition_System SHALL prevent further status transitions on the opportunity until the approval is granted or rejected

### Requirement 12: Role-Based Access Control

**User Story:** As a system administrator, I want role-based permissions enforced on all land acquisition operations, so that users can only perform actions appropriate to their role.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL restrict opportunity creation and status transitions to users with the Acquisition_Manager or Admin_Support role
2. THE Land_Acquisition_System SHALL restrict due diligence creation and status changes to users with the Legal_Compliance_Officer or Admin_Support role
3. THE Land_Acquisition_System SHALL restrict feasibility assessment creation to users with the Valuation_Analyst or Finance_Director role
4. THE Land_Acquisition_System SHALL restrict acquisition approval to users with the Finance_Director role
5. THE Land_Acquisition_System SHALL allow read access to opportunity details for all authenticated users with any land acquisition role
6. IF an unauthenticated user attempts to access any land acquisition endpoint, THEN THE Land_Acquisition_System SHALL return HTTP 401 Unauthorized
7. IF an authenticated user without the required role attempts a restricted operation, THEN THE Land_Acquisition_System SHALL return HTTP 403 Forbidden

### Requirement 13: Dashboard and KPI Reporting

**User Story:** As an Acquisition Manager, I want a dashboard showing pipeline metrics, KPIs, and status summaries, so that I can monitor acquisition performance at a glance.

#### Acceptance Criteria

1. WHEN the Acquisition_Manager requests the dashboard data, THE Land_Acquisition_System SHALL return the total count of opportunities grouped by Status
2. THE Land_Acquisition_System SHALL calculate and return the Average Acquisition Cycle in days, measured from CreatedAt to the date the opportunity reached Acquired status
3. THE Land_Acquisition_System SHALL calculate and return the Conversion Rate as the percentage of opportunities that reached Acquired status out of total opportunities created
4. THE Land_Acquisition_System SHALL calculate and return the Due Diligence Pass Rate as the percentage of DueDiligence records with Completed status out of total DueDiligence records
5. THE Land_Acquisition_System SHALL return the total count of opportunities evaluated (those that progressed beyond Identified status)
6. THE Land_Acquisition_System SHALL return recent activity showing the last 10 status changes across all opportunities with timestamps and user names

### Requirement 14: Frontend Opportunity Pipeline View

**User Story:** As an Acquisition Manager, I want a visual pipeline view on the frontend showing opportunities organized by status columns, so that I can quickly see the distribution and drag opportunities through stages.

#### Acceptance Criteria

1. WHEN the Acquisition_Manager navigates to the pipeline page, THE Land_Acquisition_System SHALL display opportunities grouped into columns by their current Status (Identified, Initial Review, Due Diligence, Offer Made, Under Contract, Acquired, Withdrawn)
2. THE Land_Acquisition_System SHALL display each opportunity card showing Name, Location, LandSize, and days since last status change
3. THE Land_Acquisition_System SHALL load pipeline data using NgRx state management with actions for loading, success, and failure states
4. WHILE pipeline data is loading, THE Land_Acquisition_System SHALL display a skeleton loading state in place of the pipeline columns
5. IF pipeline data fails to load, THEN THE Land_Acquisition_System SHALL display an error state with a retry action button and a user-friendly error message

### Requirement 15: Frontend Opportunity Detail Page

**User Story:** As an Acquisition Manager, I want a comprehensive detail page for each opportunity showing all related data in organized tabs, so that I can review complete information without navigating away.

#### Acceptance Criteria

1. WHEN the user navigates to an opportunity detail page, THE Land_Acquisition_System SHALL display opportunity summary information (Name, Location, LandSize, Status, Source, ExpectedAcquisition, CreatedAt) in a header section
2. THE Land_Acquisition_System SHALL organize related data into tabs: Overview, Due Diligence, Offers, Documents, Financials, and Activity
3. THE Land_Acquisition_System SHALL display a status progress indicator showing the opportunity lifecycle position
4. WHEN the user selects the Activity tab, THE Land_Acquisition_System SHALL display a chronological timeline of all status changes and audit events for the opportunity
5. THE Land_Acquisition_System SHALL display contextual action buttons based on the current opportunity status and user role (for example, showing "Start Due Diligence" when status is Initial Review and user has Legal_Compliance_Officer role)

### Requirement 16: Frontend Forms with Validation

**User Story:** As an Acquisition Manager, I want reactive forms with inline validation for creating and editing opportunities, so that I receive immediate feedback on data entry errors.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL implement all data entry forms using Angular Reactive Forms with typed FormGroup definitions
2. THE Land_Acquisition_System SHALL display inline validation error messages on form fields when validation fails on blur or form submission
3. THE Land_Acquisition_System SHALL disable the submit button until the form passes client-side validation
4. WHEN the user submits a form with server-side validation errors, THE Land_Acquisition_System SHALL map server error responses to the corresponding form fields and display them inline
5. THE Land_Acquisition_System SHALL implement unsaved changes detection and display a confirmation dialog when the user attempts to navigate away from a form with unsaved changes
6. THE Land_Acquisition_System SHALL provide helper text and field descriptions on complex form fields to guide the user

### Requirement 17: Frontend State Management

**User Story:** As a developer, I want NgRx store slices for all land acquisition data, so that state is centralized, predictable, and efficiently shared across components.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL implement an NgRx feature store for opportunities with actions for load, create, update, delete, and status transition operations
2. THE Land_Acquisition_System SHALL implement NgRx effects to handle all API calls, dispatching success or failure actions based on the response
3. THE Land_Acquisition_System SHALL implement memoized selectors for derived state including filtered lists, pipeline groupings, and dashboard metrics
4. THE Land_Acquisition_System SHALL use @ngrx/entity for normalized opportunity state with EntityAdapter for CRUD operations
5. WHEN an API call fails, THE Land_Acquisition_System SHALL store the error message in state and display a toast notification to the user

### Requirement 18: Frontend Dashboard

**User Story:** As an Acquisition Manager, I want a landing dashboard showing KPI cards, pipeline summary, recent activity, and alerts, so that I can understand the current state of acquisitions within seconds.

#### Acceptance Criteria

1. WHEN the Acquisition_Manager navigates to the land acquisition dashboard, THE Land_Acquisition_System SHALL display KPI metric cards for Average Acquisition Cycle, Total Opportunities Evaluated, Conversion Rate, and Due Diligence Pass Rate
2. THE Land_Acquisition_System SHALL display a pipeline summary chart showing the count of opportunities per status
3. THE Land_Acquisition_System SHALL display a recent activity section showing the last 5 actions performed across all opportunities
4. THE Land_Acquisition_System SHALL display an alerts section showing offers expiring within 7 days and due diligence items overdue
5. WHILE dashboard data is loading, THE Land_Acquisition_System SHALL display skeleton loading placeholders for each widget
6. THE Land_Acquisition_System SHALL refresh dashboard data when the user navigates to the dashboard page

### Requirement 19: Notification on Key Events

**User Story:** As a stakeholder, I want to receive notifications when key acquisition events occur, so that I am informed of progress without manually checking the system.

#### Acceptance Criteria

1. WHEN a LandOpportunity status transitions to Acquired, THE Land_Acquisition_System SHALL send a notification to all users with land acquisition roles
2. WHEN an Offer expires (ValidUntil date passes), THE Land_Acquisition_System SHALL send a notification to the Acquisition_Manager who created the offer
3. WHEN a DueDiligence check status changes to Failed, THE Land_Acquisition_System SHALL send a notification to the Acquisition_Manager associated with the parent opportunity
4. WHEN an approval request is created, THE Land_Acquisition_System SHALL send a notification to the Finance_Director
5. THE Land_Acquisition_System SHALL record all sent notifications with recipient, timestamp, event type, and read status

### Requirement 20: Audit Trail and Compliance

**User Story:** As a Legal & Compliance Officer, I want a complete, immutable audit trail of all actions performed within the land acquisition module, so that regulatory compliance and traceability requirements are met.

#### Acceptance Criteria

1. THE Land_Acquisition_System SHALL record an audit log entry for every create, update, and delete operation on LandOpportunity, LandOwner, DueDiligence, Offer, Document, and LandAcquisition entities
2. THE Land_Acquisition_System SHALL store in each audit entry: UserId, UserName, Action, EntityName, EntityId, OldValues (JSON), NewValues (JSON), AffectedColumns, Timestamp (UTC), IpAddress, and CorrelationId
3. THE Land_Acquisition_System SHALL prevent modification or deletion of audit log entries (append-only)
4. WHEN the Legal_Compliance_Officer requests the audit history for an entity, THE Land_Acquisition_System SHALL return a paginated, chronologically ordered list of audit entries filterable by action type and date range
5. THE Land_Acquisition_System SHALL include the CorrelationId from the originating HTTP request in every audit entry to enable end-to-end request tracing
