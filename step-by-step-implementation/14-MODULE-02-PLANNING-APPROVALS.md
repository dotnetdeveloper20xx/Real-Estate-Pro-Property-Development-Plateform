# Phase 14: Module 2 — Planning & Approvals

## Business Context

After acquiring land, you must get planning permission from the local council before building anything. This module tracks the entire planning process — from initial pre-application discussions through to final approval (or refusal and appeal).

---

## Entities

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| `PlanningApplication` | The application to council | OpportunityId, Reference, CouncilName, ApplicationType, Status, SubmittedDate |
| `PlanningCondition` | Conditions imposed by council | ApplicationId, Description, Deadline, Status |
| `PlanningAppeal` | Appeal if refused | ApplicationId, Grounds, AppealDate, Decision, Status |
| `PlanningDocument` | Supporting documents | ApplicationId, DocumentType, FileName, FilePath |

---

## Status Lifecycle

```
PreApplication → Submitted → Validated → UnderReview → CommitteeReview → Approved/ApprovedWithConditions/Refused
                                                                                                      ↓
                                                                                                   Appeal → AppealAllowed/AppealDismissed
                                                                         ↓
                                                                      Withdrawn
```

---

## API Endpoints

```
PlanningController
├── GET    /api/v1/planning                  → List applications (paginated)
├── GET    /api/v1/planning/{id}             → Detail (with conditions, appeals, docs)
├── POST   /api/v1/planning                  → Create application
├── PUT    /api/v1/planning/{id}             → Update application
├── PATCH  /api/v1/planning/{id}/status      → Change status
├── GET    /api/v1/planning/{id}/conditions  → List conditions
├── POST   /api/v1/planning/{id}/conditions  → Add condition
├── PATCH  /api/v1/planning/{id}/conditions/{condId}/discharge → Discharge condition
├── POST   /api/v1/planning/{id}/appeals     → Create appeal
└── POST   /api/v1/planning/{id}/documents   → Upload document
```

---

## Frontend Pages

| Page | Route | Purpose |
|------|-------|---------|
| Planning List | `/planning` | All applications with status filter |
| Planning Form | `/planning/new` | Create new application |
| Planning Detail | `/planning/:id` | Detail with Conditions, Appeals, Documents tabs |
| Planning Edit | `/planning/:id/edit` | Edit application |

---

## Business Rules

1. Application must be linked to an acquired opportunity
2. Only one active application per opportunity (unless previous was refused)
3. Conditions can only be added when status is Approved/ApprovedWithConditions
4. Conditions have deadlines — flag overdue conditions
5. Appeal can only be created when status is Refused
6. All conditions must be discharged before development can begin

---

## Key Differences From Module 1

- **Relationship**: PlanningApplication belongs to a LandOpportunity (FK: OpportunityId)
- **Condition management**: Sub-entity with its own status lifecycle (Pending → InProgress → Discharged)
- **Appeal workflow**: Separate status path after refusal
- **Timeline view**: Show all status changes as a visual timeline

---

*Apply the same 10-step recipe from Phase 12. Same patterns, different data.*
