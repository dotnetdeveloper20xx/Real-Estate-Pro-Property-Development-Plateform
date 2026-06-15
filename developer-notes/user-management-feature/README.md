# USER MANAGEMENT — Secure Access. Right People. Right Permissions.

**A complete authentication, authorization and user administration system for BuildEstate Pro.**

[← Back to Main README](../../README.md)

---

## Key Capabilities

| Feature | Description |
|---------|-------------|
| 🔐 **Secure Login** | JWT + Refresh Tokens |
| 🛡️ **Role-Based Access** | 13 Built-in Roles |
| 👥 **Admin Control** | Users & Roles Management |
| ⚡ **Immediate Security** | Revocation & Audit Logs |
| 💻 **Dev Friendly** | Works in Dev Mode |

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **SuperAdmin** | admin@buildestate.co.uk | Admin@123456 |
| **Acquisition Manager** | john.mitchell@buildestate.co.uk | Demo@123456 |
| **Legal Officer** | sarah.williams@buildestate.co.uk | Demo@123456 |
| **Finance Director** | emma.clarke@buildestate.co.uk | Demo@123456 |

---

## 1. Authentication Flow

The complete login-to-access lifecycle:

```
1. User enters email & password      → On /login page
2. System validates credentials       → Checks user status & password
3. JWT Access Token issued            → Valid for 1 hour
4. Refresh Token stored               → HttpOnly cookie / localStorage
5. Token used on every API call       → Authorization: Bearer (token)
6. Token refresh (silent)             → Before expiry (e.g., after 50 min)
7. If invalid / revoked               → User is signed out immediately
```

**Security rules:**
- 5 failed login attempts → Account locked (15 min)
- Password stored securely (hashed + salted via ASP.NET Identity)
- Role/permission changes revoke active sessions
- Deactivated users cannot log in
- All critical actions are audit logged

---

## 2. Login Screen

**Route:** `/login`

The login page provides:
- Email Address input field
- Password input field with show/hide toggle
- "Sign In" button with loading spinner
- Error messages for invalid credentials / locked accounts
- "Forgot password?" link (placeholder)
- **"Continue without signing in (Dev Mode)"** link for development

**Dev Mode:** When running in development, if no token is provided, the system treats requests as a development user with full permissions.

---

## 3. Roles (13 Built-in Roles)

| Role | Description |
|------|-------------|
| **SuperAdmin** | Full system access & configuration |
| **AcquisitionManager** | Manage land acquisition pipeline |
| **LegalOfficer** | Handle legal & compliance matters |
| **PlanningManager** | Manage planning & approvals |
| **ProjectManager** | Oversee projects & timelines |
| **SiteManager** | Manage construction sites |
| **SalesManager** | Manage sales & marketing |
| **CompletionManager** | Handle completions & handovers |
| **PropertyManager** | Manage properties & tenancies |
| **FinanceDirector** | Approve finances & budgets |
| **ValuationAnalyst** | Perform valuations & feasibility |
| **Surveyor** | Conduct surveys & inspections |
| **Admin** | User support & data management |

Each role maps to a set of permissions and API access rules.

---

## 4. Administration Menu (SuperAdmin Only)

The sidebar shows an "Administration" section exclusively for SuperAdmin users:

```
BuildEstate Pro
├── Dashboard
├── Land Acquisition
├── Planning & Approvals
├── Legal & Compliance
├── ...
├── ─────────────────────
├── Administration        ← Only visible to SuperAdmin
│   ├── 👥 Users
│   ├── 🛡️ Roles
│   ├── 📋 Audit Logs
│   └── ⚙️ System Settings
```

**Admin capabilities:**
- **User Management** — Create, edit, deactivate and manage system users
- **Role Management** — Create, edit and manage roles and assignments

**Recent Activity (Admin Actions) example:**
- Emma Clarke deactivated user 'Mark Wilson' — 10 May 2025, 10:15 AM
- John Mitchell role updated for 'Sarah Williams' — 10 May 2025, 09:30 AM
- Password reset for 'David Thompson' — 10 May 2025, 09:20 AM
- New user 'Lucy Anderson' created — 10 May 2025, 09:05 AM

---

## 5. User Management Screen

**Route:** `/admin/users`

**Header actions:**
- ➕ New User button
- 📥 Import Users button (future)
- 🔍 Search users by name or email
- Filter by: All Status / Active / Inactive

**User table columns:**

| Name | Email | Roles | Status | Last Login | Actions |
|------|-------|-------|--------|-----------|---------|
| John Mitchell | john.mitchell@buildestate.co.uk | AcquisitionManager | Active | 10 May 2025, 10:22 AM | ✏️ 🗑️ |
| Sarah Williams | sarah.williams@buildestate.co.uk | LegalOfficer | Active | 10 May 2025, 09:41 AM | ✏️ 🗑️ |
| Emma Clarke | emma.clarke@buildestate.co.uk | FinanceDirector | Active | 10 May 2025, 10:05 AM | ✏️ 🗑️ |
| Mark Wilson | mark.wilson@buildestate.co.uk | SiteManager, Surveyor | Inactive | - | ✏️ 🗑️ |
| Lucy Anderson | lucy.anderson@buildestate.co.uk | Admin | Active | 10 May 2025, 06:30 AM | ✏️ 🗑️ |

**Pagination:** Showing 1 to 5 of 25 users — ◀ 1 2 3 4 5 ▶

**User creation form fields:**
- First Name, Last Name
- Email Address
- Password (minimum 8 characters)
- Role assignment (checkbox multi-select of all available roles)

---

## 6. Role Management Screen

**Route:** `/admin/roles`

**Header actions:**
- ➕ New Role button
- 🔍 Search roles

**Role table columns:**

| Role Name | Description | Users | Actions |
|-----------|-------------|-------|---------|
| SuperAdmin | Full system access & configuration | 1 | ✏️ 🗑️ |
| AcquisitionManager | Manage land acquisition pipeline | 4 | ✏️ 🗑️ |
| LegalOfficer | Handle legal & compliance matters | 3 | ✏️ 🗑️ |
| FinanceDirector | Approve finances & budgets | 2 | ✏️ 🗑️ |
| Surveyor | Conduct surveys & inspections | 5 | ✏️ 🗑️ |

**Pagination:** Showing 1 to 5 of 13 roles — ◀ 1 2 3 ▶

**Role actions:**
- Edit → Update role name/description
- Delete → Only if 0 users assigned (otherwise 409 Conflict)
- Click row → View all users assigned to this role

---

## 7. Role-Based UI Visibility

The frontend uses a structural directive `*appHasRole` that shows/hides UI elements based on the logged-in user's roles.

**Example — SuperAdmin sees:**
```
BuildEstate Pro
├── Dashboard
├── Land Acquisition
├── Planning & Approvals
├── Legal & Compliance
├── Projects
├── Administration        ← Visible
```

**Example — Acquisition Manager sees:**
```
BuildEstate Pro
├── Dashboard
├── Land Acquisition      ← Full access
├── Planning & Approvals
├── Legal & Compliance
├── (No Administration)   ← Hidden
```

**Implementation:**
```html
<!-- Only visible to SuperAdmin -->
<div *appHasRole="'SuperAdmin'">Admin content here</div>

<!-- Visible to multiple roles -->
<div *appHasRole="['SuperAdmin', 'ProjectManager']">Multi-role content</div>
```

---

## 8. Immediate Revocation Flow

When security changes occur, the system immediately invalidates all active sessions:

```
Admin changes role /           System revokes all     Next API call    User is redirected
deactivates user /      →      active sessions    →   returns 401  →  to login page
resets password                 immediately
```

**✅ Ensures security changes take effect instantly across the system.**

Events that trigger immediate revocation:
- Role assignment change
- Account deactivation
- Password reset (admin or self)
- Explicit logout

---

## 9. Audit Log

All authentication and user management actions are logged:

| Date & Time | Action | Performed By | Target User | Details |
|-------------|--------|--------------|-------------|---------|
| 10 May 2025, 10:15 AM | User Deactivated | Emma Clarke | Mark Wilson | Account deactivated |
| 10 May 2025, 09:48 AM | Role Updated | John Mitchell | Sarah Williams | Added: LegalOfficer |
| 10 May 2025, 09:30 AM | Password Reset | Emma Clarke | David Thompson | Password reset |
| 10 May 2025, 08:55 AM | User Created | Emma Clarke | Lucy Anderson | New user created |
| 10 May 2025, 08:30 AM | User Login | Sarah Williams | Sarah Williams | Successful login |

**Logged events:**
- Login success / failure
- Logout
- Token refresh
- User creation
- User update
- Role assignment change
- Account activation / deactivation
- Password change / reset

---

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/login` | ❌ No | Authenticate with email/password |
| POST | `/auth/refresh` | ❌ No | Exchange refresh token for new tokens |
| POST | `/auth/logout` | ✅ Yes | Revoke all user tokens |
| GET | `/auth/me` | ✅ Yes | Get current user profile + roles |
| POST | `/auth/change-password` | ✅ Yes | Change own password |

### User Management (`/api/v1/users`) — SuperAdmin Only

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users (paginated, searchable, filterable) |
| GET | `/users/{id}` | Get user detail with roles |
| POST | `/users` | Create user with role assignment |
| PUT | `/users/{id}` | Update user profile |
| PUT | `/users/{id}/roles` | Replace role assignments |
| PATCH | `/users/{id}/deactivate` | Deactivate account + revoke tokens |
| PATCH | `/users/{id}/activate` | Reactivate account |
| POST | `/users/{id}/reset-password` | Admin password reset |

### Role Management (`/api/v1/roles`) — SuperAdmin Only

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/roles` | List all roles with user counts |
| GET | `/roles/{id}` | Get role with assigned users |
| POST | `/roles` | Create role |
| PUT | `/roles/{id}` | Update role description |
| DELETE | `/roles/{id}` | Delete role (only if 0 users) |

---

## Technology & Architecture

| Component | Technology |
|-----------|-----------|
| **JWT + Refresh Tokens** | Secure, short-lived access |
| **Role-Based Authorization** | API & UI level enforcement |
| **Audit Logging** | Track all important actions |
| **Account Lockout** | Protects against brute force |
| **Soft Refresh** | Seamless user experience |
| **Scalable & Extensible** | Ready for all modules |
| **Developer Friendly** | Dev mode for productivity |

---

## Security Highlights

- ✅ 5 failed login attempts → Account locked (15 min)
- ✅ Password stored securely (hashed + salted)
- ✅ Role/permission changes revoke active sessions
- ✅ Deactivated users cannot log in
- ✅ All critical actions are audit logged
- ✅ HTTPS only, secure cookies, CSRF protected

---

## Development Mode

When running in development, if no token is provided, the system treats requests as a development user with full permissions.

**"Continue without signing in"** — Available on the login page for developer convenience.

This means:
- Backend: `DevAuthMiddleware` injects SuperAdmin + all roles
- Frontend: `authGuard` returns `true` when in dev mode
- Frontend: `*appHasRole` shows all content in dev mode
- No login required during development/testing

---

## Files Created

```
Backend:
├── src/BuildEstate.API/Controllers/AuthController.cs
├── src/BuildEstate.API/Controllers/Admin/UsersController.cs
├── src/BuildEstate.API/Controllers/Admin/RolesController.cs
└── src/BuildEstate.API/Middleware/DevAuthMiddleware.cs

Frontend:
├── src/app/core/services/auth.service.ts
├── src/app/core/interceptors/auth.interceptor.ts
├── src/app/core/guards/auth.guard.ts
├── src/app/shared/directives/has-role.directive.ts
├── src/app/features/auth/login.component.ts
├── src/app/features/admin/admin.routes.ts
├── src/app/features/admin/users/user-management.component.ts
└── src/app/features/admin/roles/role-management.component.ts
```

---

[← Back to Main README](../../README.md)
