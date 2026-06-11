# Phase 16: Module 4 — Project Management

## Business Context

Once planning is approved, the Project Manager creates a development project. This is the orchestration layer — budgets, timelines, milestones, tasks, and risks. Every other module (construction, sales, finance) feeds into or out of the project.

---

## Entities

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| `Project` | The development project | Name, OpportunityId, Location, Budget, StartDate, EndDate, Status |
| `Milestone` | Key delivery point | ProjectId, Name, PlannedDate, ActualDate, Status |
| `ProjectTask` | Work item | ProjectId, Title, AssignedTo, DueDate, Priority, Status |
| `ProjectRisk` | Identified risk | ProjectId, Title, Probability, Impact, Mitigation, Owner, Status |

---

## Status Lifecycle

**Project:** Planning → InProgress → OnHold → Completed → Closed
**Milestone:** Pending → InProgress → Completed → Overdue
**Task:** Created → Assigned → InProgress → Review → Completed
**Risk:** Identified → Assessing → Mitigating → Resolved → Closed

---

## API Endpoints

```
├── /api/v1/projects              → CRUD for projects
├── /api/v1/projects/{id}/milestones → CRUD for milestones
├── /api/v1/projects/{id}/tasks   → CRUD for tasks
├── /api/v1/projects/{id}/risks   → CRUD for risks
└── /api/v1/projects/{id}/summary → Dashboard data for one project
```

---

## Frontend Pages

| Page | Route | Purpose |
|------|-------|---------|
| Project List | `/projects` | All projects with status, budget vs actual |
| Project Form | `/projects/new` | Create project (linked to opportunity) |
| Project Detail | `/projects/:id` | Tabs: Overview, Milestones, Tasks, Risks |
| Project Edit | `/projects/:id/edit` | Edit project details |

---

## Detail Page Tabs

1. **Overview** — KPIs (budget, timeline, progress %), charts
2. **Milestones** — Timeline view with planned vs actual dates
3. **Tasks** — Task board or list with assignee, priority, status
4. **Risks** — Risk register with probability × impact matrix

---

## Business Rules

1. Project must be linked to an acquired opportunity
2. Budget must be positive
3. End date must be after start date
4. Milestones must fall within project date range
5. Tasks can only be assigned to team members with appropriate roles
6. Risks must have both probability and impact assessed
7. Project cannot be Completed if open milestones exist

---

## Dashboard Widgets (Project Detail)

- **Budget Card**: Planned £X vs Actual £Y (variance %)
- **Timeline Card**: X days remaining, on track / delayed
- **Progress Card**: 65% complete based on milestones
- **Risk Card**: 3 High risks, 5 Medium risks

---

*This module is the glue. Construction, Finance, Sales all reference Projects.*
