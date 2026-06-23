# Search Mandatory Governance — Entity Completeness Standard

## Purpose

This governance document establishes that **Global Search Integration** is a mandatory, non-negotiable requirement for every entity in BuildEstate Pro. No entity, module, or feature may be considered complete, approved, or merged without full search integration.

---

## Core Rule: NO ENTITY IS COMPLETE UNTIL ALL OF THE FOLLOWING ARE SATISFIED

Every business entity in BuildEstate Pro must have ALL of the following implemented and verified before it can be considered "done":

1. **List page exists** — Paginated, filterable, sortable table or grid view
2. **Detail page exists** — Full entity detail view with all relevant tabs
3. **Create page exists** — Form with validation, guidance, and proper workflow
4. **Edit workflow exists** — Edit form with optimistic concurrency (RowVersion)
5. **Delete workflow exists** — Soft delete with confirmation dialog and audit trail
6. **API endpoints exist** — Full CRUD + status transitions via MediatR/CQRS
7. **Permissions exist** — Role-based access on every endpoint and route guard on every page
8. **Audit logging exists** — Every create, update, delete action logged immutably
9. **Notifications exist where appropriate** — Real-time and email notifications for key events
10. **Dashboard integration exists** — Entity counts, status metrics, or KPIs on relevant dashboard
11. **GLOBAL SEARCH integration exists** — This means ALL of the following:
    - Search provider class registered implementing `ISearchProvider`
    - Search fields declared with appropriate weights (2.0+ identifiers, 1.0 standard, 0.5 supplementary)
    - Navigation route is valid and resolves to entity detail page
    - Permission filtering applied server-side (users only see what they can access)
    - Result card template defined (icon, title, subtitle, status, timestamp)
    - Quick actions defined (View, Edit at minimum)
    - Category assigned for result grouping/tabs
    - DI registration in module's `DependencyInjection.cs`
    - Frontend search result type added to type union
    - Unit tests written for the search provider

---

## Module Registration Checklist Template

Copy this checklist into your module's implementation tracking document. Every checkbox must be ticked before requesting PR review.

```markdown
## Module: [Module Name]
## Entity: [Entity Name]
## Date: [YYYY-MM-DD]
## Developer: [Name]

### Core Implementation
- [ ] Domain entity created with audit columns
- [ ] EF Core configuration with indexes on searchable fields
- [ ] Migration created and applied
- [ ] DTOs defined (Create, Update, List, Detail)
- [ ] Command handlers implemented
- [ ] Query handlers implemented
- [ ] Validators implemented (FluentValidation)
- [ ] Controller created (thin, MediatR dispatch only)
- [ ] Authorization policies applied

### Frontend
- [ ] List page — paginated, filterable, sortable
- [ ] Detail page — all relevant data and tabs
- [ ] Create page — form with validation and guidance
- [ ] Edit page — form with RowVersion concurrency
- [ ] Delete workflow — confirmation dialog, soft delete
- [ ] NgRx store — actions, reducer, effects, selectors
- [ ] Service — typed API calls
- [ ] Routes — registered with guards

### Cross-Cutting
- [ ] Audit logging — create, update, delete logged
- [ ] Permissions — backend policies + frontend route guards
- [ ] Notifications — relevant events trigger notifications
- [ ] Dashboard — entity metrics visible on module dashboard
- [ ] Error handling — loading, empty, error states

### GLOBAL SEARCH (MANDATORY)
- [ ] Search provider class created (`{Entity}SearchProvider : ISearchProvider`)
- [ ] ModuleId declared
- [ ] EntityName declared
- [ ] CategoryName declared
- [ ] Icon assigned (Material Symbols Outlined)
- [ ] Priority set
- [ ] Searchable fields defined with weights
- [ ] Permission filtering applied in SearchAsync
- [ ] Navigation route verified (resolves to detail page)
- [ ] Quick actions defined
- [ ] Provider registered in DI container
- [ ] Frontend result card renders correctly
- [ ] Unit tests pass for provider
- [ ] `search-module-registration.md` updated
- [ ] `docs/backend/search-architecture.md` updated

### Documentation
- [ ] Help article exists
- [ ] User guide updated
- [ ] API documentation current
- [ ] Release notes drafted
```

---

## Definition of Done (Including Search)

A feature is **NOT** done until:

| Criterion | Verification |
|-----------|-------------|
| Backend builds | `dotnet build` passes with 0 errors |
| Frontend builds | `npx tsc --noEmit` passes with 0 errors |
| Unit tests pass | All search provider tests green |
| API endpoints exist | Every CRUD operation reachable |
| Permissions enforced | Unauthorized users receive 403 |
| Audit trail active | Create/update/delete produce audit records |
| Dashboard updated | Module dashboard shows entity metrics |
| Search provider registered | Entity appears in global search results |
| Search fields weighted | Primary identifiers weighted 2.0+, standard 1.0 |
| Search route valid | Clicking search result navigates to detail page |
| Search permissions work | Users only see entities they have read access to |
| Search result card complete | Icon, title, subtitle, status, timestamp displayed |
| Documentation updated | Help article, registration docs, architecture docs |

---

## Rules for Future Module Developers

### Rule 1: Search-First Mindset

When designing a new entity, define its search registration BEFORE writing the first line of code. Ask:
- What will users search for?
- What fields are most important?
- What icon represents this entity?
- What category does it belong to?
- What route will the search result link to?

### Rule 2: Copy the Template

Use `docs/templates/search-provider-template.md` as your starting point. Copy the C# template, fill in the blanks, and register. No provider should be written from scratch.

### Rule 3: Weight Guidance

| Field Type | Weight Range | Examples |
|------------|-------------|----------|
| Unique identifiers | 2.5 – 3.0 | Reference numbers, registry refs, case numbers |
| Names / Titles | 2.0 – 2.5 | Entity name, project name, person name |
| Locations / Addresses | 1.5 – 2.0 | Site address, city, postcode |
| Status values | 1.0 – 1.5 | Status, stage, phase |
| Descriptions / Notes | 0.8 – 1.0 | Summary, notes, comments |
| Tags / Categories | 1.0 – 1.5 | Type, category, classification |
| Monetary values | 0.5 – 0.8 | Price, budget, cost |
| Dates | 0.3 – 0.5 | Created date, due date |

### Rule 4: Test Before PR

Every search provider MUST have at minimum:
- Exact match test (returns as #1 result)
- Partial match test (returns within top 5)
- Permission filter test (unauthorized user sees nothing)
- Empty query test (returns empty or recent items)

### Rule 5: Update the Registry

After implementation, update `.kiro/steering/search-module-registration.md` with:
- Entity name, icon, category
- Search fields with weights
- Priority level

### Rule 6: Verify Navigation

After registering, manually verify:
1. Search for the entity by name
2. Click the result
3. Confirm it navigates to the correct detail page
4. Confirm the back button returns to search

---

## Consequences of Skipping Search Registration

| Consequence | Impact |
|------------|--------|
| PR will be REJECTED | No merge without search integration |
| Module marked INCOMPLETE | Cannot be deployed to staging or production |
| Entity invisible to users | Users cannot find it via global search |
| Help desk burden increases | Users contact support instead of searching |
| Platform feels inconsistent | Some entities searchable, others not |
| Future maintenance cost | Retrofitting search later is 3-5x more expensive |
| Architecture review failure | Enterprise Architecture Board will reject the module |
| Audit non-compliance | Missing search = missing discoverability = incomplete system |

### Enforcement

- **Code reviewers** must check the search checklist before approving PRs
- **CI/CD pipeline** should verify search provider registration (future: automated check)
- **Sprint demos** must demonstrate search working for new entities
- **Architecture board** reviews search coverage quarterly

---

## Route Traceability Map

Every search result type MUST map to a valid Angular route. The following table documents the current verified mappings:

### Verified Routes (Currently Implemented)

| Entity Type | Search Result Route | Angular Route | Status |
|-------------|-------------------|---------------|--------|
| Land Opportunity | `/land-acquisition/opportunities/:id` | `land-acquisition/opportunities/:id` | ✅ Exists |
| Land Owner | `/land-acquisition/opportunities/:opportunityId` | Via opportunity detail tabs | ✅ Exists (nested) |
| Due Diligence | `/land-acquisition/opportunities/:opportunityId` | Via opportunity detail tabs | ✅ Exists (nested) |
| Offer | `/land-acquisition/opportunities/:opportunityId` | Via opportunity detail tabs | ✅ Exists (nested) |
| Contract | `/land-acquisition/opportunities/:opportunityId` | Via opportunity detail tabs | ✅ Exists (nested) |
| Acquisition | `/land-acquisition/opportunities/:opportunityId` | Via opportunity detail tabs | ✅ Exists (nested) |
| Planning Application | `/planning-approvals/applications/:id` | `planning-approvals/applications/:id` | ✅ Exists |
| Planning Condition | `/planning-approvals/applications/:applicationId` | Via application detail tabs | ✅ Exists (nested) |
| Legal Case | `/legal-compliance/cases/:id` | `legal-compliance/cases/:id` | ✅ Exists |
| Compliance Check | `/legal-compliance/compliance/:id` | `legal-compliance/compliance/:id` | ✅ Exists |
| User | `/admin/users/:id` | `admin/users/:id` | ✅ Exists |
| Role | `/admin/roles` | `admin/roles` | ✅ Exists (list view) |
| Document | `/documents` | `documents` | ⚠️ Dashboard only (no detail route yet) |
| Notification | N/A | In-app notification panel | ✅ Handled via overlay |

### Pending Routes (Future Modules — Dashboard Only)

| Entity Type | Expected Route | Current Status |
|-------------|---------------|----------------|
| Project | `/project-management/projects/:id` | ⚠️ Only dashboard exists |
| Construction Stage | `/construction/stages/:id` | ⚠️ Only dashboard exists |
| Budget | `/finance/budgets/:id` | ⚠️ Only dashboard exists |
| Property Unit | `/property-units/units/:id` | ⚠️ Only dashboard exists |
| Sales Lead | `/sales/leads/:id` | ⚠️ Only dashboard exists |

### Route Validation Rule

Before registering a search provider, verify:
1. The `navigationRoute` pattern resolves to an existing Angular route
2. The route has proper guards (authGuard, roleGuard where needed)
3. The route loads a component that can display the entity
4. The route supports the `:id` parameter pattern

If the route does not exist yet, the search provider MUST NOT be registered until it does. Search results that link to nowhere are worse than no search results at all.

---

## Governance Approval

This document is enforced by the Enterprise Architecture Review Board.

Any deviation requires written justification and explicit CTO/Technical Director approval.

No exceptions. No shortcuts. No "we'll add search later."

Search is not optional. Search is infrastructure.
