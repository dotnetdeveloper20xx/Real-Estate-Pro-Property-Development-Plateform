# BuildEstate Pro — Security Standards (Enterprise Grade)

## Core Security Principle
**Assume every public input is hostile. Validate everything. Trust nothing.**

Design security from day one — never bolt it on later.

## Authentication
- JWT Bearer tokens for API authentication
- ASP.NET Identity for user management
- Token expiry: 60 minutes (configurable)
- Refresh token rotation
- Secure token storage (HttpOnly cookies for web, secure storage for mobile)
- Account lockout after 5 failed attempts
- Password policy: min 8 chars, upper, lower, digit, special character

## Authorization
- Role-Based Access Control (RBAC)
- Principle of least privilege — users get minimum permissions needed
- Authorize attribute on every controller (deny by default)
- Resource-based authorization where needed (own data only)
- Claims-based authorization for fine-grained permissions

### Role Hierarchy
```
SuperAdmin > FinanceDirector > ProjectManager > [Domain Managers] > Admin > Viewer
```

### Permission Pattern
```csharp
[Authorize(Roles = "SuperAdmin,AcquisitionManager")]
[HttpPost("opportunities")]
public async Task<IActionResult> Create(...)
```

## Input Validation
- Validate ALL input at API boundary (FluentValidation)
- Validate type, length, format, range
- Never trust client-side validation alone
- Parameterized queries only (EF Core handles this)
- No string concatenation for SQL/commands
- Sanitize output to prevent XSS

## API Security
- HTTPS only (redirect HTTP to HTTPS)
- CORS restricted to known origins only
- Rate limiting on authentication endpoints
- Request size limits
- Anti-forgery tokens for state-changing operations where applicable
- No sensitive data in URLs (use POST body or headers)
- No sensitive data in logs

## Data Protection
- Encryption at rest (SQL Server TDE or column-level)
- Encryption in transit (TLS 1.2+)
- Sensitive fields encrypted at application level (PII)
- Connection strings in environment variables / Key Vault (never source code)
- Secrets rotation strategy

## Audit Trail (Non-Negotiable)
- Every create, update, delete is logged
- Log includes: who, when, what, old value, new value
- Audit trail is immutable (no delete, no update)
- Audit trail survives even if entity is hard-deleted
- Include IP address and correlation ID
- Exportable for compliance reviews

## Secure Coding Practices
- No hardcoded secrets (use configuration / Key Vault)
- No sensitive data in error messages (generic messages to client)
- No stack traces in production responses
- Validate file uploads: type, size, content, filename
- Prevent path traversal in file operations
- Use parameterized queries (never string interpolation for SQL)
- Dispose sensitive data after use

## Headers & Response Security
```csharp
// Required security headers
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## Dependency Security
- Pin package versions (no floating versions)
- Regular dependency vulnerability scanning
- Review transitive dependencies
- Remove unused packages
- Prefer well-maintained, widely-adopted packages

## Session Management
- Stateless API (JWT — no server-side sessions)
- Token invalidation on password change
- Token invalidation on role change
- Concurrent session limits (configurable)

## Error Handling Security
- Never expose internal implementation details
- Generic error messages to clients
- Detailed errors only in server logs
- Different error detail levels per environment (Dev vs Prod)
