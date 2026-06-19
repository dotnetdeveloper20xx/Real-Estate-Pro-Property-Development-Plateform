---
inclusion: auto
---

# Security Review

## Verification Checklist

- Authentication: JWT Bearer tokens validated on every request
- Authorization: Policy-based (Authorize attribute on controllers)
- Route guards: authGuard on all protected feature routes
- Permission guards: roleGuard with route data roles on write operations
- Token validation: Check expiry, signature, issuer
- Refresh tokens: Rotation strategy, secure storage
- Session expiry: 60-minute token lifetime
- Session revocation: On password change, role change
- Audit logging: Every create/update/delete logged with user, timestamp, IP
- Concurrency handling: RowVersion for optimistic locking, 409 on conflict
- Input validation: Server-side via FluentValidation (never trust client)
- File upload validation: Type whitelist, size limit (25MB), content scanning
- Ownership checks: Users can only modify entities they have permission for
- Destructive confirmations: Modal dialog before delete, reject, withdraw
- Sensitive data protection: No secrets in URLs, no PII in logs

## Never Trust The Client

- Client-side validation is for UX only
- Server MUST validate independently
- Permissions checked server-side even if UI hides buttons
- Role guard on frontend prevents navigation but backend enforces authorization
