# Legal & Compliance Module — Release Notes

## Version 1.0.0 — Initial Release (June 2026)

### Overview

First production release of the Legal & Compliance Module (Module 3) for BuildEstate Pro. This module provides comprehensive legal case management, contract lifecycle tracking, regulatory compliance monitoring, insurance management, audit records, and legal document storage with full audit trail capabilities.

---

### New Features

#### Legal Case Management
- Create and manage legal cases with unique references (LC-YYYY-NNNNN)
- Kanban pipeline board showing cases grouped by status
- Full status lifecycle with 15 valid transitions enforced by state machine
- Solicitor assignment and contact tracking
- Cross-module integration with Land Acquisition (OpportunityId) and Planning (PlanningApplicationId)
- Case summary endpoints for cross-module consumption

#### Contract Management
- Contract register with unique references (CON-YYYY-NNNNN)
- 21-state lifecycle from Draft through Execution to Closure
- Finance Director approval for high-value contracts (configurable threshold, default £50,000)
- Full contract terms tracking (termination clauses, special conditions, payment terms)
- Approval workflow with timestamp and notes recording

#### Compliance Management
- Define regulatory requirements with category, frequency, and responsible role
- Compliance checklist with colour-coded status indicators (green/amber/red/grey)
- Automatic NextDueDate calculation based on check frequency
- Non-compliant outcomes require remediation plans with due dates
- Category-level compliance status summary
- Background service for daily overdue detection

#### Insurance Management
- Full policy lifecycle tracking with 8-state machine
- Automatic "Expiring Soon" detection (30 days before expiry)
- Automatic "Expired" detection on expiry date
- Policy renewal with field carry-forward and chain linking
- Duplicate policy number prevention among active records

#### Audit Records
- Schedule and track internal, external, regulatory, and spot check audits
- Risk rating classification (Low/Medium/High/Critical)
- Remediation action tracking with due date monitoring
- Automatic overdue detection with notifications
- 7-state lifecycle from Planned through Verification to Closure

#### Legal Documents
- Document upload with classification and confidentiality levels
- Version control (automatic increment, retain all previous versions)
- Confidentiality-based access control (Restricted = Legal Officers only)
- Retention period tracking with 30-day expiry notifications
- File validation: max 50MB, allowed types: PDF, DOCX, XLSX, PNG, JPG, TIFF

#### Dashboard & KPIs
- Case counts by status and priority
- Average resolution time
- Compliance rate percentage
- Insurance expiry alerts
- Active contract value by type
- Overdue compliance and audit items
- Recent activity timeline
- Risk summary (High/Critical items)

#### Notifications
- Real-time notifications for 7 key event types
- Role-based routing to appropriate recipients
- Persistent notification records with read status

#### Audit Trail
- Immutable append-only audit log for all CRUD operations
- Full change tracking (old values → new values)
- Correlation ID for end-to-end request tracing
- Paginated query with filtering by action, entity, user, date
- CSV export for compliance reviews

#### Background Services
- InsuranceExpiryCheckService — Daily check for expiring/expired policies
- ComplianceOverdueCheckService — Daily check for overdue requirements and audit actions
- Document retention expiry monitoring

---

### Technical Details

- **Backend:** ASP.NET Core, C#, EF Core Code-First, MediatR (CQRS), FluentValidation
- **Frontend:** Angular 20 (Standalone Components), NgRx Store, TypeScript strict, Tailwind CSS, DaisyUI
- **Database:** SQL Server with 7 new tables, 20+ indexes, composite unique constraints
- **Testing:** 25+ property-based tests using FsCheck covering state machines, validators, calculations, RBAC, and business rules
- **API:** 35+ RESTful endpoints across 9 controllers with role-based authorization

---

### Known Limitations

- Role guard uses placeholder implementation until shared auth infrastructure is integrated
- Acquisition Manager access is not yet filtered to their specific opportunities (global read access)
- Document file storage uses local path references — blob storage integration pending
- Audit trail CSV export limited to single entity type filter per export

---

### Migration

- Run EF Core migration: `AddLegalComplianceEntities`
- Add `LegalComplianceSettings` section to appsettings.json:
  ```json
  "LegalComplianceSettings": {
    "HighValueContractThreshold": 50000
  }
  ```
