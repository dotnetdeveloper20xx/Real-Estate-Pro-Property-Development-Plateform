# BuildEstate Pro — Security, Authentication & Authorization

## Technical Deep Dive

![Security Authentication & Authorization Feature](security-authentication-authorization-feature.png)

---

## 1. Architecture Overview

BuildEstate Pro uses a multi-layered security architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Angular 20)                         │
│  ┌─────────┐  ┌──────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │AuthGuard│  │RoleGuard │  │PermGuard     │  │*appHasPermission│  │
│  └────┬────┘  └────┬─────┘  └──────┬───────┘  └───────┬────────┘  │
│       │             │               │                   │           │
│  ┌────▼─────────────▼───────────────▼───────────────────▼────────┐ │
│  │                    NgRx Auth Store                              │ │
│  │  { user, roles[], permissions[], isAuthenticated, token }      │ │
│  └────────────────────────────┬──────────────────────────────────┘ │
│                               │ HTTP + Bearer Token                 │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                        BACKEND (ASP.NET Core 8)                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Middleware Pipeline                                          │   │
│  │  1. JWT Authentication (validates token signature + expiry)   │   │
│  │  2. Session Validation (checks session not revoked)           │   │
│  │  3. CSRF Validation (for state-changing requests)             │   │
│  │  4. Authorization (policies check permission claims in JWT)   │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                        │
│  ┌──────────────────────────▼───────────────────────────────────┐   │
│  │  Controllers                                                  │   │
│  │  [Authorize(Policy = "opportunities.create")]                 │   │
│  │  [Authorize(Roles = "SuperAdmin")]  ← admin only              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Data Layer                                                   │   │
│  │  Users → UserRoles → Roles → RolePermissions → Permissions    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Flow

### 2.1 Login Process

```
User submits email + password
        │
        ▼
POST /api/v1/auth/login
        │
        ├─ 1. Find user by email (UserManager.FindByEmailAsync)
        ├─ 2. Verify account is active (user.IsActive == true)
        ├─ 3. Check account lockout (5 failed attempts = 15min lock)
        ├─ 4. Validate password (SignInManager.CheckPasswordSignInAsync)
        ├─ 5. Load user roles (UserManager.GetRolesAsync)
        ├─ 6. Load permissions for those roles (DB query)
        ├─ 7. Generate JWT access token (60 min expiry)
        │     Contains: sub, email, full_name, role[], permission[]
        ├─ 8. Generate refresh token (7 days, stored in DB)
        ├─ 9. Create session record
        ├─ 10. Log audit entry
        │
        ▼
Response: { accessToken, refreshToken, user: { id, email, roles, permissions } }
```

### 2.2 JWT Token Structure

The JWT access token contains these claims:

| Claim | Type | Example | Purpose |
|-------|------|---------|---------|
| sub | string | "b118963b-..." | User ID |
| jti | string | "7a19e43e-..." | Token unique ID (for revocation) |
| email | string | "admin@buildestate.co.uk" | User email |
| full_name | string | "Admin User" | Display name |
| role | string[] | ["SuperAdmin"] | ASP.NET Identity roles |
| permission | string[] | ["opportunities.create", ...] | Granular permissions |
| nbf | timestamp | 1781775066 | Not valid before |
| exp | timestamp | 1781778666 | Expires at (60 min) |
| iss | string | "BuildEstatePro" | Issuer |
| aud | string | "BuildEstateProUsers" | Audience |

### 2.3 Token Refresh

```
Access token expires (60 min)
        │
        ▼
POST /api/v1/auth/refresh  { refreshToken: "..." }
        │
        ├─ Validate refresh token exists in DB
        ├─ Check not revoked and not expired
        ├─ Load user and roles
        ├─ Load current permissions (fresh from DB)
        ├─ Generate new access token with UPDATED permissions
        ├─ Generate new refresh token (rotation)
        ├─ Mark old refresh token as used
        │
        ▼
Response: { accessToken (new), refreshToken (new) }
```

**Key point:** Token refresh loads permissions fresh from DB. This means permission changes take effect on next token refresh without requiring full re-login (though session revocation forces re-login for immediate effect).

### 2.4 Session Management

Every login creates a session record:

```sql
Sessions table:
- Id (Guid)
- UserId (FK)
- DeviceInfo (browser + OS)
- IpAddress
- City, Country (geolocation)
- LastActiveAt
- IsCurrent (bool)
- IsRevoked (bool)
```

**Session validation middleware** runs on every request:
1. Extracts user ID from JWT
2. Checks at least one active (non-revoked) session exists
3. If no valid session → returns 401 Unauthorized

**Session revocation triggers:**
- Admin deactivates user → all sessions revoked
- Admin changes role permissions → sessions for that role's users revoked
- User changes password → all other sessions revoked
- Admin explicitly revokes sessions

---

## 3. Authorization System

### 3.1 Three Layers of Authorization

| Layer | Mechanism | Where Applied | What It Checks |
|-------|-----------|---------------|----------------|
| 1. Authentication | JWT validation | Every request | Valid, non-expired token |
| 2. Role-based | [Authorize(Roles = "...")] | Admin controllers | User has specific role |
| 3. Permission-based | [Authorize(Policy = "...")] | Feature controllers | User has specific permission |

### 3.2 Permission-Based Authorization (Policy System)

**How it works:**

1. On app startup, 43 authorization policies are registered:

```csharp
// Program.cs
options.AddPolicy("opportunities.create", policy =>
    policy.Requirements.Add(new PermissionRequirement("opportunities.create")));
```

2. Each policy has a `PermissionRequirement` containing the permission name.

3. The `PermissionAuthorizationHandler` evaluates the requirement:

```csharp
public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        // SuperAdmin bypasses ALL permission checks
        if (context.User.IsInRole("SuperAdmin"))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Check for the specific "permission" claim in the JWT
        if (context.User.HasClaim("permission", requirement.Permission))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
```

4. Controllers use policy attributes:

```csharp
[HttpPost]
[Authorize(Policy = "opportunities.create")]  // Only users with this permission
public async Task<IActionResult> Create(...)
```

### 3.3 SuperAdmin Bypass

SuperAdmin role has universal access:
- The `PermissionAuthorizationHandler` always succeeds for SuperAdmin
- The frontend `*appHasPermission` directive always shows content for SuperAdmin
- The frontend `permissionGuard` always allows navigation for SuperAdmin
- Admin controllers use role-based `[Authorize(Roles = "SuperAdmin")]` directly

### 3.4 Development Mode Bypass

In development environment:

```csharp
if (builder.Environment.IsDevelopment())
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAssertion(_ => true)  // Always passes
        .Build();
    options.FallbackPolicy = null;
}
```

Additionally, `DevAuthMiddleware` injects a synthetic user with multiple roles when no JWT is present, so controllers that read `User.Identity` still work.

---

## 4. Users, Roles & Permissions Data Model

### 4.1 Entity Relationships

```
AspNetUsers (ASP.NET Identity)
    │
    ├── AspNetUserRoles (join table)
    │       │
    │       └── AspNetRoles (13 built-in + custom)
    │               │
    │               └── RolePermissions (join table)
    │                       │
    │                       └── Permissions (43 defined)
    │
    ├── RefreshTokens (for session/token management)
    │
    └── Sessions (for active session tracking)
```

### 4.2 Built-in Roles (13)

| Role | Description | Permissions |
|------|-------------|-------------|
| SuperAdmin | Full system access | ALL (42 permissions + bypasses checks) |
| AcquisitionManager | Land acquisition pipeline | opportunities.*, projects.read, finance.read, reports.view/export |
| LegalOfficer | Legal & compliance | legal.*, opportunities.read, projects.read, reports.view/export |
| PlanningManager | Planning applications | planning.*, opportunities.read, projects.read, legal.read, reports.view/export |
| ProjectManager | Project delivery | projects.*, construction.read/update, finance.read, opportunities.read, reports.view/export |
| SiteManager | Construction sites | construction.*, projects.read, reports.view/export |
| SalesManager | Sales & marketing | sales.*, projects.read, finance.read, reports.view/export |
| CompletionManager | Handover & closeout | sales.read/update, construction.read, projects.read, legal.read, reports.view/export |
| PropertyManager | Property operations | projects.read, construction.read, sales.read, finance.read, reports.view/export |
| FinanceDirector | Financial oversight | finance.*, projects.read, sales.read, opportunities.read, construction.read, reports.* |
| ValuationAnalyst | Valuations & feasibility | finance.read, opportunities.read/update, projects.read, reports.view/export |
| Surveyor | Technical assessments | construction.read, opportunities.read, projects.read, planning.read, reports.view/export |
| Admin | System administration | administration.*, reports.view |

### 4.3 Permissions (43 across 8 domains)

| Domain | Permissions | Pattern |
|--------|------------|---------|
| Opportunities | create, read, update, delete, approve | opportunities.{action} |
| Projects | create, read, update, delete, approve | projects.{action} |
| Finance | create, read, update, delete, approve | finance.{action} |
| Construction | create, read, update, delete, approve | construction.{action} |
| Sales | create, read, update, delete, approve | sales.{action} |
| Legal | create, read, update, delete, approve | legal.{action} |
| Planning | create, read, update, delete, approve | planning.{action} |
| Reports | view, export, create | reports.{action} |
| Administration | users, roles, audit, settings | administration.{area} |

---

## 5. Permission Management (Admin UI)

### 5.1 The Permission Matrix Page

Located at `/admin/permissions`. Only accessible to SuperAdmin.

**Features:**
- Select a role from card grid
- View all permissions grouped by domain area (tabs)
- Toggle individual permissions on/off with switches
- Visual progress bars show granted/total per domain
- Role summary sidebar shows statistics

### 5.2 What Happens When a Permission is Toggled

```
Admin clicks toggle for "opportunities.create" on "FinanceDirector"
        │
        ▼
PUT /api/v1/permissions/toggle
    { roleId: "role-financedir-...", permissionId: "guid-...", isGranted: true }
        │
        ├─ 1. UpdateRolePermissionsCommandHandler receives command
        ├─ 2. Calls IRoleManagementService.TogglePermissionAsync()
        │     - If granting: INSERT into RolePermissions
        │     - If revoking: DELETE from RolePermissions
        ├─ 3. Revokes ALL sessions for users assigned to that role
        │     - This forces them to re-login
        │     - On re-login, fresh JWT is generated with updated permissions
        ├─ 4. Logs audit entry with:
        │     - Who made the change (admin user)
        │     - What changed (permission + role + new state)
        │     - When (timestamp)
        │     - IP address
        │
        ▼
Response: { roleId, permissionId, isGranted: true }
```

**Immediate enforcement flow:**

```
Permission toggled → Sessions revoked → User's next request gets 401
    → User forced to re-login → New JWT generated with updated permissions
    → Controller's [Authorize(Policy)] now allows/denies based on new claims
```

### 5.3 Creating a New Role

```
POST /api/v1/roles
{
    "name": "CustomAnalyst",
    "description": "Read-only access to finance and opportunities",
    "permissionIds": ["guid-1", "guid-2", ...]
}
```

The role is created in AspNetRoles with IsBuiltIn = false. Permissions are assigned via RolePermissions join records.

### 5.4 Assigning Users to Roles

```
PUT /api/v1/users/{userId}/roles
{ "roles": ["AcquisitionManager", "CustomAnalyst"] }
```

User can have multiple roles. Their permissions are the UNION of all permissions from all assigned roles.

---

## 6. Frontend Security

### 6.1 Auth Interceptor (`auth.interceptor.ts`)

Every HTTP request passes through the auth interceptor:
1. Skips auth endpoints (login, refresh, register)
2. Attaches `Authorization: Bearer {accessToken}` header
3. On 401 response: attempts token refresh
4. If refresh fails: dispatches logout action
5. Queues concurrent requests during refresh and replays with new token

### 6.2 Route Guards

| Guard | Purpose | Usage |
|-------|---------|-------|
| `authGuard` | Checks user is authenticated | All protected routes |
| `roleGuard` | Checks user has specific role | `data: { roles: ['SuperAdmin'] }` |
| `permissionGuard` | Checks user has specific permission | `data: { permissions: ['opportunities.create'] }` |

Example route configuration:
```typescript
{
  path: 'opportunities/new',
  canActivate: [authGuard, permissionGuard],
  data: { permissions: ['opportunities.create'] }
}
```

### 6.3 HasPermission Directive (`*appHasPermission`)

Structural directive that conditionally renders DOM elements:

```html
<!-- Show only if user can create opportunities -->
<button *appHasPermission="'opportunities.create'">
  Create Opportunity
</button>

<!-- Show if user has ANY of these permissions -->
<div *appHasPermission="['legal.create', 'legal.update']">
  Legal Actions Panel
</div>
```

Behavior:
- Subscribes to NgRx store for reactive updates
- SuperAdmin always sees all content
- Dev mode always shows content
- Automatically updates when permissions change (after re-login)

### 6.4 NgRx Auth State

```typescript
interface IAuthState {
  user: ICurrentUser | null;       // { id, email, firstName, lastName }
  roles: string[];                  // ["AcquisitionManager"]
  permissions: string[];            // ["opportunities.create", "opportunities.read", ...]
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}
```

Selectors:
- `selectIsAuthenticated` — is user logged in?
- `selectUserRoles` — array of role names
- `selectUserPermissions` — array of permission names
- `selectHasPermission(name)` — does user have specific permission?
- `selectHasAnyPermission(names[])` — does user have any of these?

---

## 7. Controller Protection Map

### 7.1 Admin Controllers (Role-Based)

| Controller | Access | Attribute |
|-----------|--------|-----------|
| UsersController | SuperAdmin only | `[Authorize(Roles = "SuperAdmin")]` |
| RolesController | SuperAdmin only | `[Authorize(Roles = "SuperAdmin")]` |
| PermissionsController | SuperAdmin only | `[Authorize(Roles = "SuperAdmin")]` |
| SessionsController | SuperAdmin only | `[Authorize(Roles = "SuperAdmin")]` |
| AuditLogsController | SuperAdmin only | `[Authorize(Roles = "SuperAdmin")]` |

### 7.2 Feature Controllers (Permission-Based)

| Controller | Action | Policy |
|-----------|--------|--------|
| OpportunitiesController | Create | `opportunities.create` |
| OpportunitiesController | Update | `opportunities.update` |
| OpportunitiesController | Delete | `opportunities.delete` |
| OpportunitiesController | TransitionStatus | `opportunities.approve` |
| OpportunitiesController | GetAll/GetById | Authenticated (any user) |
| PlanningApplicationsController | Create | `planning.create` |
| PlanningApplicationsController | Update | `planning.update` |
| PlanningApplicationsController | TransitionStatus | `planning.approve` |
| LegalCasesController | Create | `legal.create` |
| LegalCasesController | Update | `legal.update` |
| LegalCasesController | Delete | `legal.delete` |
| (similar pattern for all feature controllers) | | |

### 7.3 Read Operations

All GET endpoints on feature controllers require only authentication (valid JWT), not specific permissions. This allows users to view data across modules while write operations are restricted by permissions.

---

## 8. Security Features

### 8.1 Password Security
- Minimum 8 characters, uppercase, number, special character
- Hashed with bcrypt (ASP.NET Identity default)
- Password change invalidates all other sessions

### 8.2 Account Lockout
- 5 failed login attempts → account locked for 15 minutes
- Lockout counter resets on successful login
- Admin can manually unlock accounts

### 8.3 Token Security
- Access tokens: 60 minute expiry, signed with HMAC-SHA256
- Refresh tokens: 7 day expiry, stored hashed in DB, one-time use (rotation)
- Refresh token reuse detection → all tokens revoked (compromise detection)

### 8.4 Session Security
- Every login creates a session record
- Sessions validated on every request
- Admin can revoke individual sessions or all sessions
- Permission changes auto-revoke affected sessions

### 8.5 Audit Trail
- Every security action is logged (login, logout, role change, permission change, password reset, deactivation)
- Logs include: who, when, what, where (IP), correlation ID
- Immutable audit trail (no delete capability)
- Exportable for compliance reviews

### 8.6 CSRF Protection
- State-changing requests validated by CSRF middleware
- API paths exempted (token-based auth provides CSRF protection)

---

## 9. How to Test Permission Enforcement

### Test 1: Verify permission in JWT
```bash
# Login as AcquisitionManager
POST /api/v1/auth/login
{ "email": "james.parker@buildestate.co.uk", "password": "Demo@123456" }

# Response includes permissions: ["opportunities.create", "opportunities.read", ...]
```

### Test 2: Verify access granted with permission
```bash
# Use James Parker's token to create an opportunity (he has opportunities.create)
POST /api/v1/opportunities
Authorization: Bearer {james_token}
{ "name": "Test Site", "location": "London", "landSize": 5.0 }
# → 201 Created ✓
```

### Test 3: Verify access denied without permission
```bash
# Use Emma Clarke's token (FinanceDirector - no opportunities.create)
POST /api/v1/opportunities
Authorization: Bearer {emma_token}
{ "name": "Test Site", "location": "London", "landSize": 5.0 }
# → 403 Forbidden ✗ (in production)
# → 200 OK (in development due to DefaultPolicy bypass)
```

### Test 4: Verify permission change takes effect
```bash
# 1. Admin toggles "opportunities.create" ON for FinanceDirector
PUT /api/v1/permissions/toggle
{ "roleId": "role-financedir-...", "permissionId": "guid-for-opportunities.create" }

# 2. Emma's sessions are revoked → she gets 401 on next request
# 3. Emma re-logs in → new JWT now includes "opportunities.create"
# 4. Emma can now create opportunities → 201 Created ✓
```

---

## 10. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Permissions in JWT (not DB lookup per request) | Performance — no DB hit on every API call |
| Session revocation on permission change | Immediate enforcement without waiting for token expiry |
| SuperAdmin bypasses all checks | Simplifies admin operations, prevents lockout |
| Dev mode bypasses all auth | Fast local development without token hassle |
| Read operations open to all authenticated | Users should see data across modules; writes are restricted |
| Union of permissions across roles | User with multiple roles gets combined access |
| 60 minute token expiry | Balance between security and UX (refresh handles renewal) |

---

## 11. Files Reference

| File | Purpose |
|------|---------|
| `src/BuildEstate.Application/Authorization/PermissionRequirement.cs` | Authorization requirement definition |
| `src/BuildEstate.Application/Authorization/PermissionAuthorizationHandler.cs` | Evaluates permission claims |
| `src/BuildEstate.Infrastructure/Services/TokenService.cs` | Generates JWT with permission claims |
| `src/BuildEstate.Infrastructure/Persistence/Configurations/UserManagement/UserManagementSeedData.cs` | Seeds roles, permissions, mappings |
| `src/BuildEstate.Domain/Entities/UserManagement/Permission.cs` | Permission entity |
| `src/BuildEstate.Domain/Entities/UserManagement/RolePermission.cs` | Role-Permission join entity |
| `src/BuildEstate.API/Program.cs` | Registers policies and handler |
| `src/BuildEstate.API/Controllers/Admin/PermissionsController.cs` | Permission matrix API |
| `src/BuildEstate.API/Controllers/Admin/RolesController.cs` | Role CRUD API |
| `client-app/src/app/core/guards/permission.guard.ts` | Frontend permission route guard |
| `client-app/src/app/shared/directives/has-permission.directive.ts` | *appHasPermission directive |
| `client-app/src/app/core/store/auth/auth.reducer.ts` | NgRx state with permissions |
| `client-app/src/app/core/store/auth/auth.selectors.ts` | Permission-aware selectors |
