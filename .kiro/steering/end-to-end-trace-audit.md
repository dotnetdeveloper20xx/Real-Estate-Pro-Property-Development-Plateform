---
inclusion: auto
---

# End-to-End Feature Trace Audit

## Purpose

Before declaring any feature complete, trace the FULL path from UI to database and back.

## Required Trace (Every Entity)

```
Database table
→ EF entity
→ EF configuration
→ DTOs
→ Command/query models
→ Validators
→ Handlers
→ Repository/service methods
→ API controller endpoint
→ Angular model/interface
→ Angular service method
→ NgRx action/effect/reducer/selector
→ Page/component
→ Form fields
→ Buttons/actions
→ Modal/dialog
→ List/table
→ Search/filter/sort/pagination
→ Error/loading/empty states
→ Audit/security/permissions
```

If ANY link in that chain is missing, wrong, fake, mocked, or inconsistent — it is a DEFECT.

## Form Completeness Rule

For every create/edit form verify:
- Every important entity field is represented
- Required fields are marked
- Frontend validation exists
- Backend validation exists
- Edit form loads existing data into ALL fields (including dropdowns)
- Edit form persists changed data
- Server validation errors are displayed inline
- Dropdown enum values match backend enums exactly
- Date fields match backend format
- Currency/decimal fields match backend precision

## API Contract Rule

For every Angular service method verify:
- Backend endpoint exists at that exact URL
- HTTP method matches
- Request body DTO property names match backend command properties EXACTLY (case-sensitive in JSON)
- When backend controller validates `routeId != command.EntityId`, the frontend MUST include that ID in the request body
- Response shape matches frontend interface
- Enum values are strings matching backend JsonStringEnumConverter

### Known Patterns That MUST Be Followed:

**Pattern A: Controller validates route vs body ID** (Feasibility, Contracts, Acquisitions)
- Controller has: `if (opportunityId != command.OpportunityId) return BadRequest(...)`
- Frontend service MUST send: `{ opportunityId, ...dto }`

**Pattern B: Controller enriches from route** (DueDiligence, Offers)
- Controller has: `command with { OpportunityId = opportunityId }`
- Frontend does NOT need opportunityId in body — controller adds it

**Pattern C: Controller manually constructs command** (LandOwners)
- Controller reads DTO fields + route param separately
- Frontend sends just the DTO fields, no ID needed

**Pattern D: Contract transition validates contractId**
- Controller has: `if (contractId != command.ContractId) return BadRequest(...)`
- Frontend service MUST send: `{ contractId, ...dto }`

**Before declaring ANY service method complete, check which pattern the backend controller uses.**

## CRUD Completeness Rule

Every entity must have full CRUD where business requires:
- Create: form exists, API exists, data persists
- Read: list exists, detail exists, data loads
- Update: edit form pre-populates ALL fields, API exists, changes persist
- Delete: confirmation exists, API exists, soft delete works, list refreshes

## Fake Feature Detection

Search for and eliminate:
- Buttons that show toast but call no API
- Forms that save partial data while entity has more fields
- setTimeout waiting instead of proper event handling
- prompt() or confirm() browser dialogs
- Hardcoded sample data pretending to be real
- Services with methods that nobody calls
- NgRx stores that exist but aren't connected

## Dashboard Link Rule

Every dashboard card, chart, count, alert, and quick action must:
- Show real data (not hardcoded)
- Navigate to a real page when clicked
- Not crash on missing data

## Lessons Learned (Prevent Regressions)

These are the actual bugs found during this project that recurred multiple times. ALWAYS check for these before declaring done:

1. **Edit form dropdowns not populating**: When an entity has enum/select fields, the edit form must load the saved value AND ensure it exists in the options list. If the saved value isn't in the default options array, add it dynamically.

2. **Route vs body ID validation mismatch**: Some backend controllers validate that an ID in the request body matches the route parameter. If the frontend doesn't include that ID in the body, the API returns 400. ALWAYS read the controller to check if it has `if (routeId != command.Id) return BadRequest(...)`.

3. **Property name case mismatch**: Backend C# properties are PascalCase, frontend JSON properties are camelCase. ASP.NET's `JsonStringEnumConverter` + default camelCase serialization handles this. But when constructing payloads manually in the frontend, property names MUST be camelCase versions of the backend property names (e.g., `TargetStatus` → `targetStatus`, NOT `newStatus`).

4. **HTTP verb mismatch**: Backend may use PATCH but frontend uses POST (or vice versa). ALWAYS verify the `[HttpPost]`/`[HttpPatch]`/`[HttpPut]` attribute on the controller action.

5. **URL path mismatch**: Backend may use `/activate` but frontend calls `/reactivate`. ALWAYS verify the exact route string on the controller.

6. **NgRx store disconnected from components**: A complete store (actions, effects, reducer, selectors) may exist but components bypass it entirely with raw HttpClient. This violates architecture and creates inconsistency.

7. **Silent error swallowing**: `subscribe({ error: () => {} })` means the user gets zero feedback when something fails. Every API call MUST have proper error handling with toast notifications.

8. **Wrong CRUD operation for context**: Multi-step forms that save sub-entities must check if the sub-entity already exists. If it does → call UPDATE. If it doesn't → call CREATE. A form that always calls CREATE will fail with a database constraint violation on the second save (when editing an existing record that already has the sub-entity). ALWAYS ask: "Is this a CREATE or an UPDATE scenario?"

