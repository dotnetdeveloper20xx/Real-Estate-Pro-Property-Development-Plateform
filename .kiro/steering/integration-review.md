---
inclusion: auto
---

# Integration Review

## Frontend ↔ Backend Contract Verification

For every feature, verify the full integration chain works:

1. **UI Action** → User clicks button or submits form
2. **Component** → Dispatches NgRx action (or calls service for simple operations)
3. **Effect** → Handles side effect, calls service
4. **Service** → Makes HTTP call with correct URL, method, body, headers
5. **Controller** → Receives request, validates, dispatches to MediatR
6. **Handler** → Executes business logic, persists data
7. **Response** → Returns correct DTO in correct envelope
8. **Effect** → Maps response to success/failure action
9. **Reducer** → Updates state
10. **Selector** → Components re-render with new data
11. **UI** → Shows success toast, refreshes view, or shows error

## Cross-Module Integration

Verify data flows between modules:
- Land Acquisition → Planning (acquired land feeds into planning)
- User Management → All modules (roles and permissions gate access)
- Notifications → All modules (key events trigger notifications)
- Audit → All modules (every mutation creates audit records)

## Error Integration

Verify error propagation:
- Backend validation errors → Frontend form field errors
- Backend 401 → Frontend redirect to login
- Backend 403 → Frontend access denied toast
- Backend 404 → Frontend "not found" message
- Backend 409 → Frontend concurrency conflict dialog
- Backend 500 → Frontend generic error toast
