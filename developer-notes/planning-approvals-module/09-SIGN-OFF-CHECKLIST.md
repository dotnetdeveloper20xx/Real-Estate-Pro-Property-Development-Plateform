# Planning & Approvals Module — Sign-Off Checklist

## Purpose

This checklist helps you verify that everything in the Planning & Approvals module has been built correctly and is ready for production use.

---

## ✅ Domain Layer

- [x] All 7 domain entities created (PlanningApplication, CouncilContact, PlanningCondition, PlanningAppeal, PlanningDocument, PlanningFee, PlanningMilestone)
- [x] All 12 domain enums created
- [x] 4 state machines implemented with validated transition rules
- [x] 5 domain events created for cross-entity communication
- [x] All entities inherit BaseEntity with audit columns and soft-delete support

## ✅ Infrastructure Layer

- [x] EF Core entity configurations with proper indexes, constraints, and query filters
- [x] Database migration created for the planning module schema
- [x] Soft-delete query filter applied to all 7 entities (`HasQueryFilter(x => !x.IsDeleted)`)
- [x] PlanningFeeSettings configuration registered via IOptions pattern
- [x] All state machines registered as Singletons in DI container
- [x] IAuditLogQueryService implemented for dashboard activity feed

## ✅ Application Layer

- [x] 15+ commands with handlers and validators
- [x] 10 queries with handlers
- [x] 5 domain event handlers with notification logic
- [x] DTOs for all entities (list, detail, create, update, transition variants)
- [x] AutoMapper profiles for entity-to-DTO mapping
- [x] CQRS feature folder structure maintained consistently

## ✅ API Layer

- [x] 8 controllers created (Applications, Conditions, Appeals, Documents, Fees, Milestones, Dashboard, CouncilContact)
- [x] 25 RESTful endpoints implemented
- [x] Role-based authorization applied per endpoint
- [x] Consistent response envelope pattern (ApiResponse)
- [x] Proper HTTP status codes (200, 201, 204, 400, 404, 409)
- [x] All controllers are thin (dispatch only, no business logic)

## ✅ Frontend

- [x] 10 TypeScript model files with strict interfaces
- [x] 7 HTTP services wrapping all API endpoints
- [x] 2 NgRx store slices (application + dashboard) fully wired
- [x] 4 smart container components (Dashboard, Pipeline, Detail, Create)
- [x] 10 presentational components with DaisyUI styling
- [x] Lazy-loaded routing with guards
- [x] Unsaved changes guard on form pages
- [x] Role-based route guard (placeholder for auth integration)
- [x] Navigation link added to sidebar
- [x] NgRx feature stores registered in app config

## ✅ Testing

- [x] 16 property-based test files covering all 20 correctness properties
- [x] 4 event handler test files
- [x] 1 infrastructure test file (soft-delete query filter verification)
- [x] All property tests pass with 50-200 random iterations each
- [x] FsCheck generators cover boundary conditions

## ✅ Integration & Wiring

- [x] State machines registered in DI
- [x] Frontend lazy route added to app.routes.ts
- [x] NgRx stores registered in app.config.ts
- [x] Navigation item added for Planning & Approvals
- [x] Cross-module integration with Land Acquisition verified (OpportunityId FK)

## ✅ Business Rules Verified

- [x] Only Acquired opportunities can have planning applications
- [x] One active application per opportunity enforced
- [x] State machine transitions enforced (invalid moves rejected)
- [x] Conditional data requirements enforced (reference, date, reason)
- [x] Fee threshold approval path enforced
- [x] Condition creation restricted to ApprovedWithConditions parents
- [x] Appeal creation restricted to Refused parents with no active appeal
- [x] Milestone type uniqueness per application enforced
- [x] Soft-deleted records never appear in query results

## ✅ Documentation

- [x] Developer notes created (this folder: 00-INDEX through 09-SIGN-OFF)
- [x] Spec documents maintained (.kiro/specs/planning-approvals-module/)
  - requirements.md (19 requirements with acceptance criteria)
  - design.md (architecture, data models, correctness properties)
  - tasks.md (107 tasks, all completed)

---

## What's Next?

The Planning & Approvals module is ready for:
1. **QA testing** — Manual testing against a running environment
2. **UAT** — User acceptance testing with Planning Managers
3. **Production deployment** — Deploy alongside existing Land Acquisition module

The next module in the build order is **Legal & Compliance** (Module 3).
