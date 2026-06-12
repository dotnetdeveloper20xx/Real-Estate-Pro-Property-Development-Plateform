# Requirements Document

## Introduction

The Planning & Approvals Module is the second business module of the BuildEstate Pro platform. It manages the full lifecycle of planning applications from pre-application discussions with local councils through formal submission, validation, review, decision, and appeal. This module sits directly after the Land Acquisition module in the development lifecycle — once land is acquired, the development company must obtain planning permission before construction can begin.

This module serves Planning Managers, Legal & Compliance Officers, Admin/Support staff, Finance Directors, and Acquisition Managers. It integrates with the Land Acquisition module via the LandOpportunity entity (only acquired opportunities can have planning applications) and reuses the existing platform foundation (Clean Architecture, EF Core, MediatR, JWT + RBAC, Audit Interceptor, Notification Service).

## Glossary

- **Planning_Approvals_System**: The backend and frontend application module responsible for managing planning applications, conditions, appeals, documents, fees, milestones, and council interactions
- **PlanningApplication**: A domain entity representing a formal planning application submitted to a local planning authority, containing application reference, description, type, status, council details, and linked LandOpportunity
- **PlanningCondition**: A domain entity representing a condition imposed by the council on an approved planning application, requiring specific actions before or during development
- **PlanningAppeal**: A domain entity representing a formal challenge against a refused planning application, submitted to the Planning Inspectorate
- **PlanningDocument**: A domain entity representing a file uploaded against a planning application (drawings, reports, council correspondence, environmental assessments)
- **PlanningFee**: A domain entity representing a fee payment associated with a planning application, tracking amount, payment status, and approval
- **CouncilContact**: A domain entity representing the local planning authority contact details including council name, planning officer name, email, phone, and address
- **PlanningMilestone**: A domain entity representing a key date or deadline in the planning application lifecycle (submission date, validation date, target decision date, actual decision date, appeal deadline)
- **Planning_Manager**: A user role responsible for creating, submitting, and managing planning applications through the lifecycle
- **Legal_Compliance_Officer**: A user role responsible for reviewing planning conditions, managing condition discharge, and handling appeals
- **Admin_Support**: A user role responsible for documentation, data entry, and uploading planning documents
- **Finance_Director**: A user role with approval authority over planning fee payments exceeding a configurable threshold
- **Acquisition_Manager**: A user role with read-only access to view planning status for their acquired sites
- **State_Machine**: A set of rules governing which status transitions are permitted for a PlanningApplication, preventing invalid workflow progressions
- **LandOpportunity**: The domain entity from the Land Acquisition module representing an acquired land parcel, referenced by OpportunityId foreign key
- **ApiResponse_Envelope**: The standard response wrapper returning data, success flag, errors array, and pagination metadata
- **BaseEntity**: The abstract base class providing Id, audit columns (CreatedAt, CreatedBy, UpdatedAt, UpdatedBy), soft-delete columns (IsDeleted, DeletedAt, DeletedBy), RowVersion, and domain events

## Requirements

### Requirement 1: Planning Application Creation

**User Story:** As a Planning Manager, I want to create a new planning application linked to an acquired land opportunity, so that I can initiate the planning permission process for a development site.

#### Acceptance Criteria

1. WHEN the Planning_Manager submits a valid application creation request with OpportunityId, ApplicationType, Description, and CouncilName, THE Planning_Approvals_System SHALL create a new PlanningApplication entity with Status set to Pre-Application and return the created record in the ApiResponse_Envelope
2. THE Planning_Approvals_System SHALL validate that the referenced LandOpportunity exists and has a Status of Acquired before allowing PlanningApplication creation
3. IF the Planning_Manager attempts to create a PlanningApplication for a LandOpportunity that does not have Acquired status, THEN THE Planning_Approvals_System SHALL return HTTP 400 Bad Request with an error message indicating that planning applications require an acquired land opportunity
4. THE Planning_Approvals_System SHALL validate that Description is between 10 and 2000 characters, ApplicationType is one of Full, Outline, Reserved Matters, Householder, Listed Building, or Change of Use, and CouncilName is between 3 and 200 characters
5. THE Planning_Approvals_System SHALL assign a new Guid identifier, set CreatedAt to UTC now, and set CreatedBy to the authenticated user identifier on every new PlanningApplication
6. IF a PlanningApplication already exists for the same LandOpportunity with a Status other than Withdrawn or Refused, THEN THE Planning_Approvals_System SHALL return HTTP 409 Conflict indicating an active application already exists for the opportunity
7. WHEN a PlanningApplication is created, THE Planning_Approvals_System SHALL log an audit trail entry recording the creation action, user, timestamp, and entity data

### Requirement 2: Planning Application Status Transitions

**User Story:** As a Planning Manager, I want the system to enforce valid planning status transitions, so that applications follow the correct planning lifecycle without skipping steps.

#### Acceptance Criteria

1. THE Planning_Approvals_System SHALL enforce the following status transitions using a State_Machine: Pre-Application → Submitted, Submitted → Validated, Submitted → Withdrawn, Validated → Under Review, Validated → Withdrawn, Under Review → Committee Review, Under Review → Approved, Under Review → Approved with Conditions, Under Review → Refused, Under Review → Withdrawn, Committee Review → Approved, Committee Review → Approved with Conditions, Committee Review → Refused, Committee Review → Withdrawn, Refused → Appeal, Appeal → Approved, Appeal → Approved with Conditions, Appeal → Refused
2. IF a user attempts a status transition not defined in the State_Machine rules, THEN THE Planning_Approvals_System SHALL return HTTP 400 Bad Request with an error message listing the permitted transitions from the current status
3. WHEN a status transition occurs, THE Planning_Approvals_System SHALL log an audit trail entry recording the previous status, new status, user, and timestamp
4. WHEN the status changes to Submitted, THE Planning_Approvals_System SHALL require an ApplicationReference of between 5 and 50 characters representing the council reference number
5. WHEN the status changes to Approved, Approved with Conditions, or Refused, THE Planning_Approvals_System SHALL require a DecisionDate to be recorded as a valid past or present UTC date
6. WHEN the status changes to Withdrawn, THE Planning_Approvals_System SHALL require a WithdrawalReason text of at least 10 characters explaining the withdrawal

### Requirement 3: Planning Application Pipeline Management

**User Story:** As a Planning Manager, I want to view and manage the pipeline of planning applications with filtering and sorting, so that I can prioritize and monitor progress across all active applications.

#### Acceptance Criteria

1. WHEN the Planning_Manager requests the application list, THE Planning_Approvals_System SHALL return a paginated list of PlanningApplication records with support for page number and page size parameters
2. THE Planning_Approvals_System SHALL support filtering applications by Status, ApplicationType, CouncilName, and date range on SubmissionDate
3. THE Planning_Approvals_System SHALL support sorting applications by Description, CreatedAt, SubmissionDate, TargetDecisionDate, and Status
4. THE Planning_Approvals_System SHALL support free-text search across Description, ApplicationReference, CouncilName, and linked LandOpportunity Name
5. THE Planning_Approvals_System SHALL exclude soft-deleted records from all query results by default
6. WHEN the Planning_Manager requests a single application by Id, THE Planning_Approvals_System SHALL return the full application detail including associated PlanningConditions, PlanningDocuments, PlanningFees, PlanningMilestones, CouncilContact, and linked LandOpportunity summary

### Requirement 4: Council Contact Management

**User Story:** As a Planning Manager, I want to record and manage council contact details for each planning application, so that I can track which council and planning officer is handling the application.

#### Acceptance Criteria

1. WHEN the Planning_Manager submits valid council contact details (CouncilName, PlanningOfficerName, Email, Phone, Address), THE Planning_Approvals_System SHALL create a CouncilContact entity and associate it with the specified PlanningApplication
2. THE Planning_Approvals_System SHALL validate that CouncilName is between 3 and 200 characters, PlanningOfficerName is between 2 and 150 characters, Email is a valid email format, Phone is between 7 and 20 characters, and Address is between 10 and 500 characters
3. THE Planning_Approvals_System SHALL allow updating CouncilContact details and record the update in the audit trail
4. THE Planning_Approvals_System SHALL enforce that only one CouncilContact record exists per PlanningApplication
5. WHEN the Planning_Manager requests application details, THE Planning_Approvals_System SHALL include the associated CouncilContact information in the response

### Requirement 5: Planning Conditions Management

**User Story:** As a Legal & Compliance Officer, I want to create, track, and discharge planning conditions imposed on approved applications, so that the company fulfills all obligations before and during development.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer submits a condition with ApplicationId, ConditionNumber, Description, and ConditionType, THE Planning_Approvals_System SHALL create a PlanningCondition entity with Status set to Outstanding
2. THE Planning_Approvals_System SHALL validate that the parent PlanningApplication has a Status of Approved with Conditions before allowing condition creation
3. THE Planning_Approvals_System SHALL validate that ConditionNumber is a positive integer unique within the parent application, Description is between 10 and 1000 characters, and ConditionType is one of Pre-Commencement, Pre-Occupation, During Construction, or Compliance
4. THE Planning_Approvals_System SHALL enforce PlanningCondition status transitions: Outstanding → Submitted for Discharge, Submitted for Discharge → Discharged, Submitted for Discharge → Rejected, Rejected → Submitted for Discharge
5. WHEN a PlanningCondition status changes to Discharged, THE Planning_Approvals_System SHALL record the DischargeDate as a valid past or present UTC date and require a DischargeReference of between 3 and 50 characters
6. WHEN all PlanningConditions for a PlanningApplication reach Discharged status, THE Planning_Approvals_System SHALL send a notification to the Planning_Manager indicating all conditions are fulfilled
7. THE Planning_Approvals_System SHALL return a paginated list of PlanningConditions for a given application, filterable by Status and ConditionType

### Requirement 6: Planning Appeals Management

**User Story:** As a Legal & Compliance Officer, I want to create and manage planning appeals for refused applications, so that the company can challenge unfavorable decisions through the formal appeals process.

#### Acceptance Criteria

1. WHEN the Legal_Compliance_Officer submits an appeal with ApplicationId, AppealGrounds, and AppealType, THE Planning_Approvals_System SHALL create a PlanningAppeal entity with Status set to Lodged and LodgedDate set to UTC now
2. THE Planning_Approvals_System SHALL validate that the parent PlanningApplication has a Status of Refused before allowing appeal creation
3. THE Planning_Approvals_System SHALL validate that AppealGrounds is between 50 and 5000 characters and AppealType is one of Written Representations, Hearing, or Public Inquiry
4. THE Planning_Approvals_System SHALL enforce that only one active PlanningAppeal exists per PlanningApplication (Status is not Dismissed or Withdrawn)
5. THE Planning_Approvals_System SHALL enforce PlanningAppeal status transitions: Lodged → Under Review, Under Review → Hearing Scheduled, Under Review → Allowed, Under Review → Dismissed, Hearing Scheduled → Allowed, Hearing Scheduled → Dismissed, Allowed → Closed, Dismissed → Closed
6. WHEN a PlanningAppeal status changes to Allowed, THE Planning_Approvals_System SHALL automatically transition the parent PlanningApplication status to Approved or Approved with Conditions based on the AppealOutcomeType field
7. WHEN a PlanningAppeal status changes to Allowed or Dismissed, THE Planning_Approvals_System SHALL require a DecisionDate and DecisionSummary of at least 20 characters
8. THE Planning_Approvals_System SHALL send a notification to the Planning_Manager and Legal_Compliance_Officer when an appeal decision is recorded

### Requirement 7: Planning Document Management

**User Story:** As an Admin/Support user, I want to upload, categorize, and retrieve documents against planning applications, so that all planning drawings, reports, and council correspondence are organized and accessible.

#### Acceptance Criteria

1. WHEN a user uploads a document with ApplicationId, DocumentType, and file content, THE Planning_Approvals_System SHALL store the document metadata and file, setting UploadedAt to UTC now
2. THE Planning_Approvals_System SHALL validate that DocumentType is one of Site Plan, Floor Plan, Elevation Drawing, Design and Access Statement, Environmental Impact Assessment, Council Correspondence, Planning Officer Report, or Supporting Statement
3. THE Planning_Approvals_System SHALL validate that uploaded files do not exceed 50 megabytes in size and are of an allowed content type (PDF, DOCX, XLSX, PNG, JPG, DWG, DXF)
4. THE Planning_Approvals_System SHALL return a paginated list of documents for a given application, filterable by DocumentType
5. WHEN a user requests a document download, THE Planning_Approvals_System SHALL return the file content with the correct content type header
6. THE Planning_Approvals_System SHALL prevent document deletion by users without the Admin_Support or Planning_Manager role and record all deletions in the audit trail

### Requirement 8: Planning Fee Management

**User Story:** As a Planning Manager, I want to record and track planning application fees, so that all costs associated with planning submissions are documented and approved.

#### Acceptance Criteria

1. WHEN the Planning_Manager submits a fee record with ApplicationId, Amount, Currency, FeeType, and Description, THE Planning_Approvals_System SHALL create a PlanningFee entity with PaymentStatus set to Pending
2. THE Planning_Approvals_System SHALL validate that Amount is a positive decimal with precision of 18 digits and 2 decimal places, Currency is a valid 3-letter ISO 4217 code, and FeeType is one of Application Fee, Pre-Application Fee, Condition Discharge Fee, Appeal Fee, or Supplementary Fee
3. WHEN a PlanningFee Amount exceeds a configurable threshold (default 10,000 in base currency), THE Planning_Approvals_System SHALL require Finance_Director approval before the PaymentStatus can transition to Paid
4. THE Planning_Approvals_System SHALL enforce PlanningFee PaymentStatus transitions: Pending → Awaiting Approval, Pending → Paid, Awaiting Approval → Approved, Awaiting Approval → Rejected, Approved → Paid, Rejected → Pending
5. WHEN the Finance_Director approves a fee payment, THE Planning_Approvals_System SHALL record the approver identity, approval timestamp, and approval notes
6. THE Planning_Approvals_System SHALL calculate and return the total fees for a given PlanningApplication, grouped by FeeType and PaymentStatus
7. THE Planning_Approvals_System SHALL return a paginated list of PlanningFees for a given application, filterable by FeeType and PaymentStatus

### Requirement 9: Planning Milestone and Timeline Tracking

**User Story:** As a Planning Manager, I want to track key dates and deadlines throughout the planning lifecycle, so that I can monitor progress against target timescales and identify overdue applications.

#### Acceptance Criteria

1. WHEN the Planning_Manager submits a milestone with ApplicationId, MilestoneType, and TargetDate, THE Planning_Approvals_System SHALL create a PlanningMilestone entity with Status set to Pending
2. THE Planning_Approvals_System SHALL validate that MilestoneType is one of Submission Date, Validation Date, Consultation Start, Consultation End, Target Decision Date, Actual Decision Date, Appeal Deadline, or Committee Date
3. THE Planning_Approvals_System SHALL validate that TargetDate is a valid date and enforce uniqueness of MilestoneType within a PlanningApplication
4. WHEN a PlanningMilestone ActualDate is recorded, THE Planning_Approvals_System SHALL update the milestone Status to Completed and calculate the variance in days between TargetDate and ActualDate
5. WHEN the current date exceeds a PlanningMilestone TargetDate and the milestone Status is Pending, THE Planning_Approvals_System SHALL mark the milestone as Overdue
6. THE Planning_Approvals_System SHALL send a notification to the Planning_Manager when a milestone becomes Overdue or when a milestone is due within 7 days
7. THE Planning_Approvals_System SHALL return all milestones for a given application ordered by TargetDate ascending

### Requirement 10: Role-Based Access Control

**User Story:** As a system administrator, I want role-based permissions enforced on all planning operations, so that users can only perform actions appropriate to their role.

#### Acceptance Criteria

1. THE Planning_Approvals_System SHALL restrict PlanningApplication creation and status transitions to users with the Planning_Manager or Admin_Support role
2. THE Planning_Approvals_System SHALL restrict PlanningCondition creation and status changes to users with the Legal_Compliance_Officer or Admin_Support role
3. THE Planning_Approvals_System SHALL restrict PlanningAppeal creation and management to users with the Legal_Compliance_Officer role
4. THE Planning_Approvals_System SHALL restrict PlanningFee approval to users with the Finance_Director role
5. THE Planning_Approvals_System SHALL allow read access to PlanningApplication details for all authenticated users with any planning or acquisition role
6. IF an unauthenticated user attempts to access any planning endpoint, THEN THE Planning_Approvals_System SHALL return HTTP 401 Unauthorized
7. IF an authenticated user without the required role attempts a restricted operation, THEN THE Planning_Approvals_System SHALL return HTTP 403 Forbidden

### Requirement 11: Dashboard and KPI Reporting

**User Story:** As a Planning Manager, I want a dashboard showing planning metrics, KPIs, and status summaries, so that I can monitor planning performance and identify bottlenecks at a glance.

#### Acceptance Criteria

1. WHEN the Planning_Manager requests the dashboard data, THE Planning_Approvals_System SHALL return the total count of applications grouped by Status
2. THE Planning_Approvals_System SHALL calculate and return the Average Decision Time in days, measured from SubmissionDate to the ActualDecisionDate for applications with a decision recorded
3. THE Planning_Approvals_System SHALL calculate and return the Approval Rate as the percentage of applications that reached Approved or Approved with Conditions status out of total applications with a final decision (Approved, Approved with Conditions, or Refused)
4. THE Planning_Approvals_System SHALL calculate and return the Appeal Success Rate as the percentage of PlanningAppeals with Allowed status out of total appeals with a final decision (Allowed or Dismissed)
5. THE Planning_Approvals_System SHALL return the count of Outstanding PlanningConditions and the count of Overdue PlanningMilestones
6. THE Planning_Approvals_System SHALL return recent activity showing the last 10 status changes across all applications with timestamps and user names
7. THE Planning_Approvals_System SHALL return applications approaching their TargetDecisionDate within the next 14 days

### Requirement 12: Notification on Key Events

**User Story:** As a stakeholder, I want to receive notifications when key planning events occur, so that I am informed of progress without manually checking the system.

#### Acceptance Criteria

1. WHEN a PlanningApplication status transitions to Approved, Approved with Conditions, or Refused, THE Planning_Approvals_System SHALL send a notification to the Planning_Manager and Acquisition_Manager associated with the linked LandOpportunity
2. WHEN a PlanningCondition DueDate is within 14 days and the condition Status is Outstanding, THE Planning_Approvals_System SHALL send a notification to the Legal_Compliance_Officer
3. WHEN a PlanningAppeal decision is recorded (Allowed or Dismissed), THE Planning_Approvals_System SHALL send a notification to the Planning_Manager and Legal_Compliance_Officer
4. WHEN a PlanningFee requires Finance_Director approval, THE Planning_Approvals_System SHALL send a notification to the Finance_Director
5. WHEN a PlanningMilestone becomes Overdue, THE Planning_Approvals_System SHALL send a notification to the Planning_Manager
6. THE Planning_Approvals_System SHALL record all sent notifications with recipient, timestamp, event type, and read status

### Requirement 13: Audit Trail and Compliance

**User Story:** As a Legal & Compliance Officer, I want a complete, immutable audit trail of all actions performed within the planning module, so that regulatory compliance and traceability requirements are met.

#### Acceptance Criteria

1. THE Planning_Approvals_System SHALL record an audit log entry for every create, update, and delete operation on PlanningApplication, PlanningCondition, PlanningAppeal, PlanningDocument, PlanningFee, CouncilContact, and PlanningMilestone entities
2. THE Planning_Approvals_System SHALL store in each audit entry: UserId, UserName, Action, EntityName, EntityId, OldValues (JSON), NewValues (JSON), AffectedColumns, Timestamp (UTC), IpAddress, and CorrelationId
3. THE Planning_Approvals_System SHALL prevent modification or deletion of audit log entries (append-only)
4. WHEN the Legal_Compliance_Officer requests the audit history for an entity, THE Planning_Approvals_System SHALL return a paginated, chronologically ordered list of audit entries filterable by action type and date range
5. THE Planning_Approvals_System SHALL include the CorrelationId from the originating HTTP request in every audit entry to enable end-to-end request tracing

### Requirement 14: Frontend Planning Application Pipeline View

**User Story:** As a Planning Manager, I want a visual pipeline view showing planning applications organized by status columns, so that I can quickly see the distribution of applications across lifecycle stages.

#### Acceptance Criteria

1. WHEN the Planning_Manager navigates to the planning pipeline page, THE Planning_Approvals_System SHALL display applications grouped into columns by their current Status (Pre-Application, Submitted, Validated, Under Review, Committee Review, Approved, Approved with Conditions, Refused, Appeal, Withdrawn)
2. THE Planning_Approvals_System SHALL display each application card showing Description, ApplicationType, CouncilName, linked LandOpportunity Name, and days since last status change
3. THE Planning_Approvals_System SHALL load pipeline data using NgRx state management with actions for loading, success, and failure states
4. WHILE pipeline data is loading, THE Planning_Approvals_System SHALL display a skeleton loading state in place of the pipeline columns
5. IF pipeline data fails to load, THEN THE Planning_Approvals_System SHALL display an error state with a retry action button and a user-friendly error message

### Requirement 15: Frontend Planning Application Detail Page

**User Story:** As a Planning Manager, I want a comprehensive detail page for each planning application showing all related data in organized tabs, so that I can review complete information without navigating away.

#### Acceptance Criteria

1. WHEN the user navigates to a planning application detail page, THE Planning_Approvals_System SHALL display application summary information (Description, ApplicationType, ApplicationReference, Status, CouncilName, linked LandOpportunity Name, SubmissionDate, TargetDecisionDate) in a header section
2. THE Planning_Approvals_System SHALL organize related data into tabs: Overview, Conditions, Documents, Fees, Timeline, Appeals, and Activity
3. THE Planning_Approvals_System SHALL display a status progress indicator showing the application lifecycle position
4. WHEN the user selects the Activity tab, THE Planning_Approvals_System SHALL display a chronological timeline of all status changes and audit events for the application
5. THE Planning_Approvals_System SHALL display contextual action buttons based on the current application status and user role (for example, showing "Submit Application" when status is Pre-Application and user has Planning_Manager role)

### Requirement 16: Frontend Forms with Validation

**User Story:** As a Planning Manager, I want reactive forms with inline validation for creating and editing planning applications, so that I receive immediate feedback on data entry errors.

#### Acceptance Criteria

1. THE Planning_Approvals_System SHALL implement all data entry forms using Angular Reactive Forms with typed FormGroup definitions
2. THE Planning_Approvals_System SHALL display inline validation error messages on form fields when validation fails on blur or form submission
3. THE Planning_Approvals_System SHALL disable the submit button until the form passes client-side validation
4. WHEN the user submits a form with server-side validation errors, THE Planning_Approvals_System SHALL map server error responses to the corresponding form fields and display them inline
5. THE Planning_Approvals_System SHALL implement unsaved changes detection and display a confirmation dialog when the user attempts to navigate away from a form with unsaved changes
6. THE Planning_Approvals_System SHALL provide helper text and field descriptions on complex form fields to guide the user through planning-specific terminology

### Requirement 17: Frontend State Management

**User Story:** As a developer, I want NgRx store slices for all planning data, so that state is centralized, predictable, and efficiently shared across components.

#### Acceptance Criteria

1. THE Planning_Approvals_System SHALL implement an NgRx feature store for planning applications with actions for load, create, update, delete, and status transition operations
2. THE Planning_Approvals_System SHALL implement NgRx effects to handle all API calls, dispatching success or failure actions based on the response
3. THE Planning_Approvals_System SHALL implement memoized selectors for derived state including filtered lists, pipeline groupings, dashboard metrics, and overdue milestone counts
4. THE Planning_Approvals_System SHALL use @ngrx/entity for normalized application state with EntityAdapter for CRUD operations
5. WHEN an API call fails, THE Planning_Approvals_System SHALL store the error message in state and display a toast notification to the user

### Requirement 18: Frontend Dashboard

**User Story:** As a Planning Manager, I want a landing dashboard showing KPI cards, application pipeline summary, upcoming deadlines, and recent activity, so that I can understand the current state of planning within seconds.

#### Acceptance Criteria

1. WHEN the Planning_Manager navigates to the planning dashboard, THE Planning_Approvals_System SHALL display KPI metric cards for Average Decision Time, Approval Rate, Appeal Success Rate, and Outstanding Conditions Count
2. THE Planning_Approvals_System SHALL display a pipeline summary chart showing the count of applications per status
3. THE Planning_Approvals_System SHALL display a recent activity section showing the last 5 actions performed across all applications
4. THE Planning_Approvals_System SHALL display an upcoming deadlines section showing milestones due within the next 14 days and overdue milestones
5. WHILE dashboard data is loading, THE Planning_Approvals_System SHALL display skeleton loading placeholders for each widget
6. THE Planning_Approvals_System SHALL refresh dashboard data when the user navigates to the dashboard page

### Requirement 19: Integration with Land Acquisition Module

**User Story:** As an Acquisition Manager, I want to view the planning status of my acquired sites from within the land acquisition context, so that I can track downstream progress without switching modules.

#### Acceptance Criteria

1. THE Planning_Approvals_System SHALL reference the LandOpportunity entity from the Land Acquisition module via an OpportunityId foreign key on PlanningApplication
2. WHEN a PlanningApplication is created, THE Planning_Approvals_System SHALL validate that the referenced OpportunityId corresponds to an existing LandOpportunity with Status of Acquired
3. THE Planning_Approvals_System SHALL expose an API endpoint that returns a summary of PlanningApplication status for a given OpportunityId, including current status, application reference, and target decision date
4. THE Planning_Approvals_System SHALL follow the same API versioning pattern (api/v1/planning-applications), response envelope format, pagination structure, and error response format established by the Land Acquisition module
5. WHEN the Acquisition_Manager views an acquired opportunity detail, THE Planning_Approvals_System SHALL provide data for displaying the planning status summary within the opportunity context

