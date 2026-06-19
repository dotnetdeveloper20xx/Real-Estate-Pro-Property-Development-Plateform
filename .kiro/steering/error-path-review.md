---
inclusion: auto
---

# Error Path Review

## For Every Feature, Ask:

1. **What if the API fails?** → Show error toast, keep form data, offer retry
2. **What if the network disconnects?** → Show offline indicator, queue retries
3. **What if the session expires?** → Redirect to login, preserve URL for return
4. **What if the user double-clicks?** → Disable button on first click, show spinner
5. **What if two users edit simultaneously?** → RowVersion check, 409 conflict dialog with reload
6. **What if file upload fails?** → Show error, preserve file selection, offer retry
7. **What if a chart fails to render?** → Show fallback message + retry button, don't crash page
8. **What if a notification endpoint fails?** → Degrade gracefully, don't block main content
9. **What if an endpoint returns null?** → Use nullish coalescing, show empty state
10. **What if permissions change mid-session?** → Backend still blocks, frontend may show stale UI until refresh

## Mandatory Error Handling Patterns

- HTTP Interceptor catches all 401/403/500 errors globally
- Individual effects handle domain-specific errors (400 validation, 404 not found, 409 conflict)
- Toast service for transient error notifications
- Inline form validation for field-level errors
- Error state signals/observables in components for retry UX
- try-catch around Chart.js rendering
- Empty state components when data is unavailable

## The UI Must NEVER Crash

- Dashboard must render even with missing metric fields
- Tables must render even with zero rows
- Charts must render fallback on exception
- Forms must preserve data on submission failure
- Navigation must work even after API errors
