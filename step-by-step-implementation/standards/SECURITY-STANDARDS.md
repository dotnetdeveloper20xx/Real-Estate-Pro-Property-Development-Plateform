# BuildEstate Pro — Security Standards

## Core Principle
**Assume every public input is hostile. Validate everything. Trust nothing.**

---

## Authentication

| Setting | Value | Reason |
|---------|-------|--------|
| Method | JWT Bearer tokens | Stateless, scalable |
| Token expiry | 60 minutes | Limits exposure window |
| Refresh tokens | Yes, with rotation | UX without compromising security |
| Password policy | 8+ chars, upper, lower, digit, special | Industry standard |
| Account lockout | After 5 failed attempts | Prevents brute force |
| Token storage | HttpOnly cookies (web) | Prevents XSS token theft |

---

## Authorization

### Role-Based Access Control (RBAC)
Every controller method MUST have `[Authorize]` attribute (deny by default).

```csharp
[Authorize(Roles = "SuperAdmin,AcquisitionManager")]
[HttpPost("opportunities")]
public async Task<IActionResult> Create(...)
```

### Role Hierarchy
```
SuperAdmin > FinanceDirector > ProjectManager > [Domain Managers] > Admin > Viewer
```

### Principle of Least Privilege
Users get the MINIMUM permissions needed to do their job. An Acquisition Manager cannot access construction data. A Site Manager cannot see investor information.

---

## Input Validation

- Validate ALL input at API boundary (FluentValidation)
- Validate type, length, format, range
- Never trust client-side validation alone
- Parameterized queries only (EF Core handles this)
- No string concatenation for SQL/commands
- Sanitize output to prevent XSS

---

## API Security

| Protection | Implementation |
|-----------|---------------|
| HTTPS only | Redirect HTTP → HTTPS |
| CORS | Restricted to known origins |
| Rate limiting | 10/min on auth, 100/min general |
| Request size | Limited (prevent DoS) |
| Sensitive data | Never in URLs, never in logs |
| Error messages | Generic to client, detailed in server logs |

---

## Security Headers

```csharp
// Applied via middleware on every response
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Data Protection

- Encryption at rest (SQL Server TDE)
- Encryption in transit (TLS 1.2+)
- Connection strings in environment variables / Key Vault
- Secrets rotation strategy
- No secrets in source code (use appsettings per environment)

---

## Audit Trail (Non-Negotiable)

- Every create, update, delete is logged automatically
- Log includes: who, when, what, old value, new value
- Audit trail is IMMUTABLE (no delete, no update of audit records)
- Includes IP address and correlation ID
- Exportable for compliance reviews

---

## Secure Coding Checklist

- [ ] No hardcoded secrets
- [ ] No sensitive data in error messages
- [ ] No stack traces in production
- [ ] Validate file uploads (type, size, content)
- [ ] Prevent path traversal in file operations
- [ ] Use parameterized queries
- [ ] Dispose sensitive data after use
- [ ] No `any` type in TypeScript (prevents type confusion)
- [ ] Input sanitization on all user-provided content
- [ ] CSRF protection on state-changing operations

---

## File Upload Security

```csharp
// Validation rules for file uploads
var allowedTypes = new[] { ".pdf", ".docx", ".xlsx", ".png", ".jpg" };
var maxSize = 25 * 1024 * 1024; // 25MB

if (!allowedTypes.Contains(Path.GetExtension(file.FileName).ToLowerInvariant()))
    return BadRequest("File type not allowed");

if (file.Length > maxSize)
    return BadRequest("File size exceeds 25MB limit");

// Generate safe filename (prevent path traversal)
var safeFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
```
