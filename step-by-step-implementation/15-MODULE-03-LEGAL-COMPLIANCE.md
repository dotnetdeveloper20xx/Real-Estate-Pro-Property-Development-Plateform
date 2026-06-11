# Phase 15: Module 3 — Legal & Compliance

## Business Context

Property development is heavily regulated. Every contract needs legal review. Insurance must be current. Regulatory requirements must be met. This module protects the company legally and provides the evidence trail auditors require.

---

## Entities

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| `Contract` | Legal agreement | Title, Type, Parties, Value, StartDate, EndDate, Status |
| `ComplianceCheck` | Regulatory verification | Requirement, Type, DueDate, CompletedDate, Status, Evidence |
| `LegalDocument` | Stored legal files | Title, Type, Version, FilePath, Status |
| `LegalTask` | Work item for legal team | Title, Description, AssignedTo, DueDate, Priority, Status |

---

## Status Lifecycles

**Contract:** Draft → UnderReview → Approved → Active → Expired/Terminated
**ComplianceCheck:** Pending → InProgress → Compliant/NonCompliant → RequiresAction
**LegalTask:** Created → Assigned → InProgress → Completed/Cancelled

---

## API Endpoints

```
├── /api/v1/legal/contracts        → CRUD for contracts
├── /api/v1/legal/compliance       → CRUD for compliance checks
├── /api/v1/legal/documents        → CRUD for legal documents
└── /api/v1/legal/tasks            → CRUD for legal tasks
```

---

## Frontend Pages

| Page | Route | Purpose |
|------|-------|---------|
| Contract List | `/legal/contracts` | All contracts with status filter |
| Contract Form | `/legal/contracts/new` | Create contract |
| Contract Detail | `/legal/contracts/:id` | Full contract view + documents |
| Contract Edit | `/legal/contracts/:id/edit` | Edit contract |
| Compliance List | `/legal/compliance` | All compliance checks |
| Compliance Form | `/legal/compliance/new` | Add compliance check |
| Compliance Detail | `/legal/compliance/:id` | View check details |
| Legal Tasks | `/legal/tasks` | Task board for legal team |

---

## Business Rules

1. Contracts must have both parties specified
2. Contract value must be positive
3. End date must be after start date
4. Compliance checks approaching deadline (within 7 days) → Warning status
5. Overdue compliance checks → Critical alert on dashboard
6. Legal tasks assigned to legal team roles only
7. Terminated contracts cannot be reactivated

---

## Cross-Module Integration

- Contracts link to Projects (FK: ProjectId) and Opportunities
- Compliance checks can reference any module's records
- Legal documents are a subset of the global document system
- Dashboard shows: Active Contracts, Upcoming Deadlines, Non-Compliant Items

---

*Same recipe, same patterns. Different entities, different business rules.*
