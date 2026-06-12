# Planning & Approvals Module — Backend Operations

## Architecture Pattern

All backend operations follow the CQRS (Command Query Responsibility Segregation) pattern:

- **Commands** change data (create, update, transition status, delete)
- **Queries** read data (lists, details, summaries, dashboard)
- **Validators** check input before processing
- **Handlers** execute the business logic

Each command/query lives in its own folder with its own handler and validator.

## Commands Implemented

### Planning Applications
| Command | What It Does |
|---------|-------------|
| CreateApplicationCommand | Creates a new application linked to an acquired opportunity |
| UpdateApplicationCommand | Updates Description, ApplicationType, CouncilName, TargetDecisionDate |
| TransitionApplicationStatusCommand | Moves application to the next status (with conditional data) |

### Council Contacts
| Command | What It Does |
|---------|-------------|
| CreateCouncilContactCommand | Records council contact details for an application |
| UpdateCouncilContactCommand | Updates existing council contact details |

### Planning Conditions
| Command | What It Does |
|---------|-------------|
| CreateConditionCommand | Adds a condition to an approved-with-conditions application |
| TransitionConditionStatusCommand | Moves condition through the discharge workflow |

### Planning Appeals
| Command | What It Does |
|---------|-------------|
| CreateAppealCommand | Lodges an appeal against a refused application |
| TransitionAppealStatusCommand | Moves appeal through hearing/decision process |

### Planning Documents
| Command | What It Does |
|---------|-------------|
| UploadDocumentCommand | Stores a file and its metadata against an application |
| DeleteDocumentCommand | Soft-deletes a document (marks as deleted, removes from storage) |

### Planning Fees
| Command | What It Does |
|---------|-------------|
| CreateFeeCommand | Records a fee; raises domain event if over threshold |
| TransitionFeeStatusCommand | Moves fee through payment workflow (with threshold enforcement) |
| ApproveFeeCommand | Finance Director approves a fee awaiting approval |

### Planning Milestones
| Command | What It Does |
|---------|-------------|
| CreateMilestoneCommand | Creates a milestone with target date (enforces uniqueness) |
| CompleteMilestoneCommand | Records actual date and calculates variance |

## Queries Implemented

| Query | What It Returns |
|-------|----------------|
| GetApplicationsQuery | Paginated list with filtering, sorting, and free-text search |
| GetApplicationByIdQuery | Full detail with all related entities (conditions, docs, fees, milestones, contact) |
| GetApplicationsByOpportunityQuery | Summary list for Land Acquisition module integration |
| GetConditionsQuery | Paginated conditions with Status/Type filters |
| GetAppealsQuery | Paginated appeals for an application |
| GetDocumentsQuery | Paginated documents with DocumentType filter |
| GetFeesQuery | Paginated fees with FeeType/PaymentStatus filters |
| GetFeeSummaryQuery | Fee totals grouped by (FeeType, PaymentStatus) |
| GetMilestonesQuery | All milestones ordered by TargetDate ascending |
| GetDashboardMetricsQuery | KPIs, pipeline summary, recent activity, approaching deadlines |

## Event Handlers

| Handler | Trigger | Action |
|---------|---------|--------|
| AppealAllowedEventHandler | Appeal status → Allowed | Transitions parent application to Approved/ApprovedWithConditions, notifies stakeholders |
| AllConditionsDischargedEventHandler | Last condition discharged | Notifies Planning Manager |
| MilestoneOverdueEventHandler | Milestone becomes overdue | Notifies Planning Manager |
| ApplicationStatusChangedEventHandler | Application reaches decision | Notifies Planning Manager and Acquisition Manager |
| FeeRequiresApprovalEventHandler | Fee exceeds threshold | Notifies Finance Director |

## Folder Structure

```
BuildEstate.Application/Features/PlanningApprovals/
├── Applications/ (Commands, Queries, DTOs, Mappings)
├── Conditions/ (Commands, Queries, DTOs, Mappings)
├── Appeals/ (Commands, Queries, DTOs, Mappings)
├── Documents/ (Commands, Queries, DTOs, Mappings)
├── Fees/ (Commands, Queries, DTOs, Mappings)
├── Milestones/ (Commands, Queries, DTOs, Mappings)
├── CouncilContacts/ (Commands, DTOs, Mappings)
├── Dashboard/ (Queries)
└── EventHandlers/ (5 domain event handlers)
```
