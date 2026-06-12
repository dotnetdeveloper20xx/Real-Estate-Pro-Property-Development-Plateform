# Legal & Compliance Module — Module Guide

## Purpose

The Legal & Compliance Module manages the legal lifecycle of property development projects. It ensures contracts are properly executed, compliance obligations are met, insurance coverage is maintained, and a complete audit trail exists for regulatory reviews.

## Core Features

### 1. Legal Case Management

Legal cases are the top-level container for all legal matters. Each case is linked to either a Land Opportunity or a Planning Application, providing full traceability from opportunity through to completion.

**Key capabilities:**
- Create and track legal cases with unique references (LC-YYYY-NNNNN)
- Assign solicitors and track their contact details
- Pipeline/kanban board view showing cases by status
- Full status lifecycle with state machine enforcement
- Cross-module integration summaries

**Case lifecycle:** Open → In Progress → Under Review → Resolved → Closed

### 2. Contract Management

Contracts represent formal agreements between the company and counterparties. Every contract belongs to a legal case and follows a strict lifecycle from drafting through execution to completion.

**Key capabilities:**
- Create contracts with unique references (CON-YYYY-NNNNN)
- Track contract value, dates, counterparties, and terms
- Finance Director approval required for high-value contracts (>£50,000)
- Contract register view for portfolio overview
- Full status lifecycle with state machine enforcement

**Contract lifecycle:** Draft → Under Review → Approved → Awaiting Signature → Executed → Active → Completed/Terminated/Expired → Closed

### 3. Compliance Requirements & Checks

Compliance requirements define regulatory obligations the company must meet. Compliance checks record evidence that these obligations are being fulfilled.

**Key capabilities:**
- Define requirements with category, frequency, and responsible role
- Compliance checklist with colour-coded status (green/amber/red/grey)
- Automatic NextDueDate calculation based on check frequency
- Overdue detection with notifications to responsible roles
- Status summary dashboard per category

### 4. Insurance Records

Insurance records track all active policies, their coverage, premiums, and expiry dates. The system proactively monitors expiry dates and alerts when policies need renewal.

**Key capabilities:**
- Track policies with coverage type, amounts, and dates
- Automatic transition to "Expiring Soon" within 30 days of expiry
- Automatic transition to "Expired" when past expiry date
- Policy renewal with field carry-forward
- Duplicate policy number prevention (among active policies)

### 5. Audit Records

Audit records document internal and external audits conducted against the legal module. They track findings, risk ratings, recommendations, and remediation actions.

**Key capabilities:**
- Schedule and track audits (Internal, External, Regulatory, Spot Check)
- Record findings with risk rating (Low/Medium/High/Critical)
- Track remediation actions with due dates
- Automatic overdue detection for outstanding actions
- Full lifecycle from Planned through to Closed

### 6. Legal Documents

Documents are uploaded against legal cases or contracts. The system supports versioning, classification, and confidentiality-based access control.

**Key capabilities:**
- Upload documents with type classification and confidentiality level
- Version control (increment on each upload, retain all versions)
- Confidentiality filtering (Restricted documents visible only to Legal Compliance Officers)
- Retention period tracking with expiry notifications
- File size limit: 50MB, allowed types: PDF, DOCX, XLSX, PNG, JPG, TIFF

### 7. Dashboard & KPIs

The dashboard provides an at-a-glance view of the entire legal position including:
- Open case counts by status and priority
- Average case resolution time
- Compliance rate percentage
- Expiring/expired insurance count
- Active contract value by type
- Contracts awaiting approval
- Overdue compliance and audit items
- Recent activity timeline
- Risk summary (High/Critical items)

### 8. Notifications

The system sends automatic notifications for:
- Legal case escalation (to Finance Director)
- Contract execution and termination (to Legal Officer + Acquisition Manager)
- Insurance expiry warnings (30 days before and on expiry)
- Non-compliant check outcomes (to Legal Officer + Finance Director)
- Overdue compliance requirements (to responsible role)
- Overdue audit actions (to Legal Officer)
- Document retention approaching expiry (30 days before)

### 9. Audit Trail

Every create, update, and delete operation is logged in an immutable audit trail:
- Who performed the action (user ID, name)
- What changed (old values → new values)
- When it happened (UTC timestamp)
- From where (IP address, correlation ID)
- Exportable to CSV for compliance reviews

## Architecture

The module follows Clean Architecture with CQRS:
- **Domain Layer** — Entities, enums, state machines, domain events, exceptions
- **Infrastructure Layer** — EF Core configurations, state machine implementations, background services
- **Application Layer** — Commands, queries, validators, handlers, DTOs, notifications
- **API Layer** — RESTful controllers with role-based authorization
- **Frontend** — Angular 20 with NgRx, DaisyUI/Tailwind CSS

## Integration Points

- **Land Acquisition** — Legal cases link via OpportunityId
- **Planning & Approvals** — Legal cases link via PlanningApplicationId
- **Notifications** — Uses shared notification service
- **Audit Trail** — Uses shared audit interceptor
- **Authentication** — JWT + RBAC via shared identity service
