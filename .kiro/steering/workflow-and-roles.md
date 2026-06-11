# BuildEstate Pro — Workflow, Automation & Roles

## Task Lifecycle (All Modules)
Every task in the system follows this lifecycle:

1. **Task Created** — A task is created in the system
2. **Assigned** — Automatically assigned to the right user based on role
3. **In Progress** — User works on the task & updates status
4. **Review / Approval** — Reviewed and approved by authorized user
5. **Completed** — Task completed and recorded
6. **Notifications** — Stakeholders notified in real-time
7. **Audit Trail** — All actions logged for compliance
8. **Reports Updated** — Dashboards & reports updated automatically

## Role Definitions

### Acquisition Manager
- Finds land opportunities
- Evaluates and submits for approval
- Manages opportunities & pipeline

### Legal & Compliance Officer
- Performs due diligence
- Manages legal documents and compliance
- Manages legal checks & contracts

### Planning Manager
- Handles planning applications, councils, and approvals

### Project Manager
- Plans the project, manages budgets, timeline, and resources

### Site Manager
- Oversees construction, tracks progress, ensures quality & safety

### Sales Manager
- Manages marketing, leads, sales pipeline, and unit reservations

### Completion Manager
- Coordinates handover, legal completion, and project closeout

### Property Manager
- Manages rentals, tenants, maintenance, and day-to-day operations

### Finance Director
- Monitors financial performance, profitability, and investor returns

### Valuation Analyst
- Financial review & feasibility analysis

### Surveyor / Consultant
- Technical assessments & reports

### Admin / Support
- Documentation & data entry

## Cross-Module Data Flow
Data flows sequentially through the platform:

Land Acquisition → Due Diligence → Planning → Design & Prep → Construction → Sales → Handover → Operations → Analytics

## Shared Data Across All Modules
- Projects
- Documents
- Contacts
- Companies
- Financials
- Contracts
- Units / Properties
- Tasks & Approvals
- Compliance
- Risks & Issues
- Communications
- Audit Logs

## Approval Workflow Pattern
Each domain follows the same general approval pattern:
1. **Submitted** — User submits item for approval
2. **Under Review** — Assigned reviewer evaluates
3. **Approved / Rejected** — Decision recorded with notes
4. **Escalation** — Auto-escalate if no response within SLA

## Notifications
- Real-time in-app notifications
- Email notifications for critical actions
- Configurable per user/role
- Digest mode available (daily/weekly summary)

## Audit & Compliance
- Every create, update, delete action is logged
- Audit log includes: user, timestamp, action, entity, old value, new value
- Immutable audit trail (cannot be deleted)
- Exportable for compliance reviews
