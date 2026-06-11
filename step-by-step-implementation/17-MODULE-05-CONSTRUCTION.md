# Phase 17: Module 5 — Construction Management

## Business Context

Construction is where the physical build happens. The Site Manager tracks progress stage by stage, schedules inspections, records defects (snags), and ensures quality. This is where most money gets spent and where delays happen.

---

## Entities

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| `ConstructionStage` | Build phase | ProjectId, Name, PlannedStart, PlannedEnd, ProgressPercent, Status |
| `Inspection` | Quality check | StageId, Type, InspectorName, Date, Result, Notes |
| `Snag` | Defect during build | StageId, Location, Description, Priority, AssignedContractor, Status |

---

## Status Lifecycles

**Stage:** NotStarted → InProgress → Complete → SignedOff
**Inspection:** Scheduled → InProgress → Passed/Failed → RequiresReinspection
**Snag:** Identified → Assigned → InProgress → Resolved → Verified

---

## API Endpoints

```
├── /api/v1/construction                  → List all stages (with project filter)
├── /api/v1/construction/{id}             → Stage detail
├── /api/v1/construction                  → Create stage
├── /api/v1/construction/{id}             → Update stage (progress %)
├── /api/v1/construction/{id}/inspections → CRUD for inspections
├── /api/v1/construction/{id}/snags       → CRUD for snags
└── /api/v1/construction/projects         → List projects with construction summary
```

---

## Frontend Pages

| Page | Route | Purpose |
|------|-------|---------|
| Stage List | `/construction` | All stages with progress bars |
| Stage Form | `/construction/new` | Create new stage |
| Stage Detail | `/construction/:id` | Detail with inspections + snags |
| Stage Edit | `/construction/:id/edit` | Update progress |
| Projects View | `/construction/projects` | Project-level construction overview |
| Inspections | `/construction/inspections` | All inspections across stages |

---

## Business Rules

1. Stage must belong to a project
2. Progress percentage: 0-100
3. Stage cannot be SignedOff with open snags of High/Critical priority
4. Inspections linked to specific stages
5. Snags must have assigned contractor before InProgress
6. Failed inspection automatically creates snag items

---

## Dashboard Widgets

- **Progress bars** per stage (visual build status)
- **Inspection pass rate** percentage
- **Open snags** count by priority
- **Stages on track vs delayed** comparison

---

## Construction Stage Sequence (Typical)

```
1. Groundworks & Foundations
2. Structural Frame
3. Roof
4. External Walls & Windows
5. First Fix (plumbing, electrics, HVAC)
6. Second Fix (finishes)
7. Decoration
8. External Works & Landscaping
9. Snagging & Inspection
10. Handover Preparation
```
