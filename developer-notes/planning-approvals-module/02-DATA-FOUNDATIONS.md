# Planning & Approvals Module — Data Foundations

## Database Tables Created

The module adds 7 new tables to the database, all following the established BaseEntity pattern (Id, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, IsDeleted, DeletedAt, DeletedBy, RowVersion).

### PlanningApplication
The core entity representing a formal planning application.

| Column | Type | Purpose |
|--------|------|---------|
| Id | Guid (PK) | Unique identifier |
| OpportunityId | Guid (FK) | Links to the acquired LandOpportunity |
| Description | string (10-2000) | Description of the proposed development |
| ApplicationType | enum | Full, Outline, Reserved Matters, Householder, Listed Building, Change of Use |
| Status | enum | Pre-Application through Withdrawn (10 possible statuses) |
| ApplicationReference | string? (5-50) | Council reference number (set on submission) |
| CouncilName | string (3-200) | Local planning authority name |
| SubmissionDate | DateTime? | When submitted to council |
| TargetDecisionDate | DateTime? | Expected decision date |
| ActualDecisionDate | DateTime? | When decision was actually received |
| DecisionDate | DateTime? | The formal decision date recorded |
| WithdrawalReason | string? | Reason for withdrawal (if withdrawn) |

**Indexes:** (Status, CreatedAt), (OpportunityId), unique filtered constraint on OpportunityId

### CouncilContact
One-to-one relationship with PlanningApplication.

| Column | Type | Purpose |
|--------|------|---------|
| CouncilName | string (3-200) | Council name |
| PlanningOfficerName | string (2-150) | Officer handling the case |
| Email | string | Contact email |
| Phone | string (7-20) | Contact phone |
| Address | string (10-500) | Council address |

### PlanningCondition
Obligations imposed by the council on approved-with-conditions applications.

| Column | Type | Purpose |
|--------|------|---------|
| ConditionNumber | int | Sequential number within the application |
| Description | string (10-1000) | What must be done |
| ConditionType | enum | Pre-Commencement, Pre-Occupation, During Construction, Compliance |
| Status | enum | Outstanding, Submitted for Discharge, Discharged, Rejected |
| DischargeDate | DateTime? | When discharged |
| DischargeReference | string? (3-50) | Council discharge reference |
| DueDate | DateTime? | When it must be discharged by |

**Indexes:** Composite unique on (ApplicationId, ConditionNumber)

### PlanningAppeal
Formal challenges against refused decisions.

| Column | Type | Purpose |
|--------|------|---------|
| AppealGrounds | string (50-5000) | Why the company is appealing |
| AppealType | enum | Written Representations, Hearing, Public Inquiry |
| Status | enum | Lodged, Under Review, Hearing Scheduled, Allowed, Dismissed, Closed |
| AppealOutcomeType | enum? | Approved or Approved with Conditions (when allowed) |
| LodgedDate | DateTime | When the appeal was submitted |
| DecisionDate | DateTime? | When the appeal decision was received |
| DecisionSummary | string? (20+) | Summary of the inspector's decision |

### PlanningDocument
Files uploaded against planning applications.

| Column | Type | Purpose |
|--------|------|---------|
| DocumentType | enum | Site Plan, Floor Plan, Elevation Drawing, etc. (8 types) |
| FileName | string | Original file name |
| ContentType | string | MIME type (PDF, DOCX, etc.) |
| FileSizeBytes | long | File size (max 50MB enforced) |
| StoragePath | string | Where the file is stored |
| UploadedAt | DateTime | When uploaded |
| UploadedBy | string | Who uploaded it |

### PlanningFee
Costs associated with planning applications.

| Column | Type | Purpose |
|--------|------|---------|
| Amount | decimal (18,2) | Fee amount |
| Currency | string (3) | ISO 4217 code (GBP, USD, EUR, etc.) |
| FeeType | enum | Application, Pre-Application, Condition Discharge, Appeal, Supplementary |
| Description | string | What the fee is for |
| PaymentStatus | enum | Pending, Awaiting Approval, Approved, Rejected, Paid |
| ApprovedBy | string? | Who approved it (Finance Director) |
| ApprovedAt | DateTime? | When approved |
| ApprovalNotes | string? | Notes from the approver |

### PlanningMilestone
Key dates and deadlines in the planning lifecycle.

| Column | Type | Purpose |
|--------|------|---------|
| MilestoneType | enum | Submission Date, Validation Date, Consultation Start/End, Target Decision, etc. (8 types) |
| Status | enum | Pending, Completed, Overdue |
| TargetDate | DateTime | When it should happen |
| ActualDate | DateTime? | When it actually happened |
| VarianceDays | int? | Days early (negative) or late (positive) |

**Indexes:** Composite unique on (ApplicationId, MilestoneType)

## Soft-Delete Strategy

All 7 tables use soft-delete via `HasQueryFilter(x => !x.IsDeleted)`. Records are never physically removed — they're marked as deleted with timestamp and user info. Standard queries automatically exclude deleted records.

## Enums Created (12 total)

PlanningApplicationStatus, PlanningApplicationType, ConditionType, ConditionStatus, AppealType, AppealStatus, AppealOutcomeType, PlanningDocumentType, FeeType, PaymentStatus, MilestoneType, MilestoneStatus
