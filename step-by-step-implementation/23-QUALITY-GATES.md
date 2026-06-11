# Phase 23: Quality Gates — Enterprise Review Criteria

## Purpose
No feature is complete until it passes these quality gates. This is the checklist you run EVERY TIME before considering something "done".

---

## Gate 1: Build Verification

```bash
# Backend must compile cleanly
cd backend && dotnet build
# Expected: 0 errors, 0 warnings

# Frontend must compile cleanly
cd frontend && ng build
# Expected: 0 errors

# All tests must pass
cd backend && dotnet test
cd frontend && ng test --watch=false
```

If any of these fail, STOP. Fix before proceeding.

---

## Gate 2: Module Completion Checklist

### Backend API
- [ ] GET list endpoint (paginated, filterable, sortable)
- [ ] GET by ID endpoint
- [ ] POST create endpoint with validation
- [ ] PUT update endpoint with validation
- [ ] DELETE (soft delete) endpoint
- [ ] PATCH status change endpoint (where applicable)
- [ ] All endpoints have `[Authorize]` with correct roles
- [ ] Request DTOs match frontend expectations (camelCase)
- [ ] Validation errors return structured 400 responses
- [ ] Audit trail logs all mutations automatically
- [ ] Swagger documentation is accurate

### Frontend Pages
- [ ] List page: table, search, filter, sort, pagination, CSV export
- [ ] Create form: all fields, validation messages, submit to correct API
- [ ] Detail page: all fields displayed, status actions, edit button
- [ ] Edit form: loads current data, validation, submits PUT
- [ ] Toast notifications on success/error
- [ ] Loading states (skeleton loaders)
- [ ] Empty states (when no data)
- [ ] Breadcrumb navigation
- [ ] Page header with title and description

### Data Alignment (CRITICAL)
- [ ] Frontend model field names EXACTLY match backend DTO (camelCase)
- [ ] Frontend create command fields EXACTLY match backend command
- [ ] Enum values in dropdowns EXACTLY match backend enum string values
- [ ] API URL patterns match between service and controller routes

---

## Gate 3: Security Review

- [ ] Every controller method has `[Authorize]` attribute
- [ ] Roles are correctly specified per endpoint
- [ ] No sensitive data in API responses (no password hashes, no connection strings)
- [ ] No sensitive data in error messages
- [ ] File uploads validated (type, size)
- [ ] Input validation on ALL user-provided data
- [ ] CORS restricted to known origins
- [ ] Rate limiting active on auth endpoints

---

## Gate 4: Architecture Compliance

### Clean Architecture
- [ ] Domain has zero external dependencies
- [ ] Application references only Domain
- [ ] Infrastructure implements Domain interfaces
- [ ] Controllers are thin (< 10 lines per method)
- [ ] No business logic in controllers or components

### CQRS
- [ ] Commands handle writes, queries handle reads (never mixed)
- [ ] Handlers have single responsibility
- [ ] Validators run before handlers (pipeline behavior)
- [ ] DTOs used at API boundary (never domain entities)

### SOLID Principles
- [ ] Each class has one reason to change (SRP)
- [ ] New features don't modify existing code (OCP where practical)
- [ ] Dependencies are on abstractions, not concretions (DIP)

---

## Gate 5: Performance Review

- [ ] All list queries use pagination (never unbounded SELECT)
- [ ] Read queries use `.AsNoTracking()`
- [ ] Queries use projections (SELECT only needed columns)
- [ ] No N+1 query patterns
- [ ] Indexes exist for frequently filtered/sorted columns
- [ ] Frontend uses `OnPush` change detection
- [ ] Frontend routes are lazy-loaded

---

## Gate 6: Observability

- [ ] Structured logging on business events
- [ ] Correlation ID on every request (traceable in logs)
- [ ] Audit trail captures all mutations (who, what, when)
- [ ] Health check endpoint exists and responds
- [ ] Error responses are logged server-side with full detail

---

## Gate 7: User Experience

- [ ] Every page has a clear purpose (answers "what is this?")
- [ ] Every form has validation guidance (not just "required")
- [ ] Every action gives feedback (toast/notification)
- [ ] Every list supports search at minimum
- [ ] Empty states educate (not blank screens)
- [ ] Error states explain what to do next
- [ ] Consistent styling across all pages (same design system)
- [ ] Responsive on desktop and tablet minimum

---

## Gate 8: Testing

- [ ] Command handlers have unit tests
- [ ] Validators have unit tests (happy + unhappy paths)
- [ ] Domain rules tested
- [ ] NgRx reducers tested
- [ ] Critical user journeys tested

---

## Gate 9: Documentation

- [ ] Help Centre article exists for this module
- [ ] API documented in Swagger
- [ ] Code has comments explaining WHY (not what)
- [ ] README updated if new setup steps needed

---

## Gate 10: Role Verification

For each role that can access this module:
- [ ] List page loads correctly
- [ ] Create action works (if permitted)
- [ ] Detail page loads correctly
- [ ] Edit action works (if permitted)
- [ ] Status changes work (if permitted)
- [ ] Unauthorized actions are blocked (no UI button + API returns 403)

---

## Scoring (Self-Assessment)

After completing all gates, score your work:

| Category | Score (1-10) |
|----------|-------------|
| Architecture Compliance | /10 |
| Security | /10 |
| Performance | /10 |
| Maintainability | /10 |
| User Experience | /10 |
| Test Coverage | /10 |
| Documentation | /10 |

**Minimum passing score: 7/10 in each category**

If any category scores below 7, fix it before moving to the next module.

---

## Definition of Done (Final)

A module is DONE when:
1. All quality gates pass
2. Backend compiles with 0 errors
3. Frontend compiles with 0 errors
4. All tests pass
5. Demo data is seeded
6. A user can log in and complete the full workflow
7. The module is consistent with all other modules in style and patterns
8. You would be proud to show this code in a job interview

---

*This is the standard. Apply it to every module, every time.*
