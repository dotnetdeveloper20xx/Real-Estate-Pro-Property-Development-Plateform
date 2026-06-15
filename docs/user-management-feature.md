# BuildEstate Pro — User Management & Authentication
## Enterprise Implementation Plan

---

## Scope

Build a complete enterprise-grade user management system that enables:
- Secure authentication (login, token refresh, logout)
- Role-based access control enforced on both backend and frontend
- SuperAdmin user management dashboard (CRUD users, assign roles)
- Permission matrix visible in the UI
- Real-time role-based UI visibility

---

## Phase 1: Backend — Auth Controller

### 1.1 AuthController (`/api/v1/auth`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | Authenticate user, return JWT + refresh token |
| `/auth/register` | POST | Create new user (SuperAdmin only) |
| `/auth/refresh` | POST | Exchange refresh token for new access + refresh tokens |
| `/auth/logout` | POST | Revoke refresh token |
| `/auth/me` | GET | Get current authenticated user profile + roles |
| `/auth/change-password` | POST | Change own password |

### 1.2 User Management Controller (`/api/v1/users`) — SuperAdmin Only

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/users` | GET | List all users (paginated, filterable by role/status) |
| `/users/{id}` | GET | Get user detail (profile + roles + last login) |
| `/users` | POST | Create user (with role assignment) |
| `/users/{id}` | PUT | Update user (name, email, isActive) |
| `/users/{id}/roles` | PUT | Assign/remove roles for a user |
| `/users/{id}/deactivate` | PATCH | Deactivate user account |
| `/users/{id}/activate` | PATCH | Reactivate user account |
| `/users/{id}/reset-password` | POST | Admin-triggered password reset |

### 1.3 Roles Controller (`/api/v1/roles`) — SuperAdmin Only

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/roles` | GET | List all roles with user counts |
| `/roles/{id}` | GET | Get role detail with assigned users |
| `/roles` | POST | Create custom role |
| `/roles/{id}` | PUT | Update role description |
| `/roles/{id}` | DELETE | Delete role (only if no users assigned) |

---

## Phase 2: Frontend — Auth Infrastructure

### 2.1 Auth Service (`core/services/auth.service.ts`)
- `login(email, password)` → stores tokens in localStorage
- `logout()` → clears tokens, revokes refresh token
- `refreshToken()` → auto-refresh before expiry
- `getCurrentUser()` → returns current user profile
- `isAuthenticated()` → boolean check
- `hasRole(role)` → check if current user has specific role
- `hasAnyRole(roles[])` → check if user has any of listed roles

### 2.2 Auth Interceptor (`core/interceptors/auth.interceptor.ts`)
- Attaches `Authorization: Bearer <token>` to all API requests
- On 401 response → attempt token refresh
- If refresh fails → redirect to login
- Excludes `/auth/login` and `/auth/refresh` from token attachment

### 2.3 Auth Guard (`core/guards/auth.guard.ts`)
- Checks if user is authenticated
- Redirects to `/login` if not
- Optional role checking from route data

### 2.4 Login Page (`features/auth/login/`)
- Email + password form
- "Remember me" checkbox
- Error display for invalid credentials
- Loading state during authentication
- Redirect to home after successful login

### 2.5 Role-Based Directive
- `*appHasRole="'AcquisitionManager'"` — shows element only if user has role
- `*appHasAnyRole="['FinanceDirector', 'SuperAdmin']"` — shows if user has any

---

## Phase 3: Frontend — Admin Panel

### 3.1 User Management Page (`/admin/users`)
- Data grid: Name, Email, Roles (badges), Status (active/inactive), Last Login
- Create user button → modal form
- Edit user → inline or modal
- Assign roles → multi-select dropdown
- Activate/Deactivate toggle
- Reset password button

### 3.2 Role Management Page (`/admin/roles`)
- Data grid: Role Name, Description, User Count
- View users in role
- Create/Edit role
- Permission matrix view (roles × modules table)

### 3.3 Admin Sidebar Section
- Only visible to SuperAdmin role
- "Administration" section with Users and Roles links

---

## Phase 4: Role Enforcement

### 4.1 Frontend Enforcement
- Sidebar items hidden based on role
- Action buttons hidden (Create, Edit, Delete) per role
- Tab content restricted per role
- Routes protected by auth guard with role checking

### 4.2 Backend Enforcement (Already Done)
- `[Authorize(Roles = "...")]` on all controllers ✅
- `ICurrentUserService` for audit logging ✅
- DevAuthMiddleware bypass for development ✅

---

## Phase 5: Polish & Security

### 5.1 Security
- Token stored in localStorage (access) + httpOnly conceptually (refresh)
- Auto-logout on token expiry
- Account lockout after 5 failed attempts
- Password complexity rules enforced

### 5.2 Notifications
- Toast on login success/failure
- Toast on session expiry
- Toast on password change

### 5.3 Audit
- Login attempts logged
- Role changes logged
- Password resets logged

---

## Implementation Status

| # | Feature | Status | Date |
|---|---------|--------|------|
| 1.1 | AuthController (login, refresh, logout, me, change-password) | ✅ Done | 15 Jun 2026 |
| 1.2 | Users Controller (CRUD, role assignment, activate/deactivate, reset password) | ✅ Done | 15 Jun 2026 |
| 1.3 | Roles Controller (list, create, update, delete with user count) | ✅ Done | 15 Jun 2026 |
| 2.1 | Auth Service (frontend — login, logout, refresh, role checks, dev mode) | ✅ Done | 15 Jun 2026 |
| 2.2 | Auth Interceptor (Bearer token attachment, 401 refresh, dev mode skip) | ✅ Done | 15 Jun 2026 |
| 2.3 | Auth Guard (real role checking from route data, dev mode bypass) | ✅ Done | 15 Jun 2026 |
| 2.4 | Login Page (email/password, error handling, demo creds, dev mode link) | ✅ Done | 15 Jun 2026 |
| 2.5 | Role-Based Directive (*appHasRole structural directive) | ✅ Done | 15 Jun 2026 |
| 3.1 | User Management Page (DataGrid, create/edit modal, role assignment) | ✅ Done | 15 Jun 2026 |
| 3.2 | Role Management Page (DataGrid, create/edit/delete, view users) | ✅ Done | 15 Jun 2026 |
| 3.3 | Admin Sidebar Section (Administration with Users + Roles links) | ✅ Done | 15 Jun 2026 |
| 4.1 | Frontend Role Enforcement (*appHasRole directive on sidebar admin section) | ✅ Done | 15 Jun 2026 |
| 5.1 | Security (token storage, auto-refresh, revoke on password change) | ✅ Done | 15 Jun 2026 |
| 5.2 | Auth notifications (toast on login failure, session expiry) | ✅ Done | 15 Jun 2026 |
| 5.3 | Auth audit logging (ILogger on login/logout/role changes/password resets) | ✅ Done | 15 Jun 2026 |

---

## Acceptance Criteria

- [ ] User can log in with email/password and receive JWT
- [ ] Invalid credentials show error message
- [ ] Token auto-refreshes before expiry
- [ ] 401 responses redirect to login
- [ ] SuperAdmin can create/edit/deactivate users
- [ ] SuperAdmin can assign/remove roles
- [ ] Sidebar shows/hides items based on user's roles
- [ ] Action buttons respect role permissions
- [ ] Route guards prevent unauthorized navigation
- [ ] All auth actions produce toast notifications
- [ ] Login/logout events are audit logged
- [ ] Password reset works for admins
- [ ] Account lockout after 5 failed attempts
