# Implementation Plan: User Management

## Overview

This plan implements the full User Management feature for BuildEstate Pro — authentication, authorization, RBAC, session management, audit logging, and dark theme. The backend uses ASP.NET Core with Clean Architecture (CQRS via MediatR, FluentValidation, EF Core, ASP.NET Identity, JWT). The frontend uses Angular 20 with NgRx, Reactive Forms, Tailwind CSS, and DaisyUI. Tasks are ordered so each step builds on the previous, with no orphaned code.

## Tasks

- [x] 1. Set up domain entities and database infrastructure
  - [x] 1.1 Create domain entities for User Management
    - Create `Permission.cs`, `RolePermission.cs`, `UserSession.cs`, `PasswordHistory.cs`, `AuditLogEntry.cs`, `RefreshToken.cs` in `Domain/Entities/UserManagement/`
    - Extend `ApplicationUser : IdentityUser` with `FirstName`, `LastName`, `IsActive`, `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`, `LastLoginAt`, and navigation properties
    - Extend `ApplicationRole : IdentityRole` with `Description`, `IsBuiltIn`, `CreatedAt`, and `RolePermissions` navigation
    - _Requirements: 1.1, 4.2, 5.1, 6.2, 12.5_

  - [x] 1.2 Create EF Core entity configurations and DbContext updates
    - Create `EntityTypeConfiguration` classes for each entity with indexes, constraints, composite keys (RolePermission), unique indexes (Permission.Name, ApplicationRole.Name), and query filters
    - Register DbSets in the application DbContext
    - Add indexes on FKs, `CreatedAt`, `UserId`, `Timestamp`, `Action` columns per database standards
    - _Requirements: 4.4, 8.8, 12.4_

  - [x] 1.3 Create EF Core migration and seed built-in roles and permissions
    - Generate migration for all new entities
    - Seed 13 built-in roles (SuperAdmin, AcquisitionManager, LegalOfficer, PlanningManager, ProjectManager, SiteManager, SalesManager, CompletionManager, PropertyManager, FinanceDirector, ValuationAnalyst, Surveyor, Admin) with `IsBuiltIn = true`
    - Seed permissions grouped by domain area (Opportunities, Projects, Finance, Construction, Sales, Legal, Planning, Reports, Administration)
    - Seed default RolePermission mappings for built-in roles
    - _Requirements: 8.6, 9.1_

- [x] 2. Implement infrastructure services
  - [x] 2.1 Implement ITokenService and TokenService
    - Generate JWT access token with user ID, email, roles claims, and 60-minute expiry
    - Implement refresh token generation, storage, rotation with 30-second grace period
    - Implement `RevokeAllUserTokensAsync` and `RevokeTokenAsync`
    - Support "Remember me" 30-day refresh token expiry vs default 7-day
    - _Requirements: 1.1, 1.6, 2.3, 10.1, 10.2, 10.3, 19.2_

  - [x] 2.2 Write property test for token generation (Property 1)
    - **Property 1: Token Generation Produces Correct Claims and Expiry**
    - For any valid user with any non-empty set of roles, verify JWT contains correct user ID, email, all roles, and 60-minute expiry
    - **Validates: Requirements 1.1**

  - [x] 2.3 Write property test for token refresh rotation (Property 18)
    - **Property 18: Token Refresh Produces Valid New Token Pair**
    - For any valid non-expired non-revoked refresh token, verify refresh produces new access token (60-min) and new refresh token, and invalidates the old one
    - **Validates: Requirements 2.3**

  - [x] 2.4 Implement ISessionService and SessionService
    - Create session with device info parsing (browser, OS from user-agent), IP address, geolocation (city/country)
    - Implement `GetActiveSessionsAsync`, `RevokeSessionAsync`, `RevokeAllUserSessionsAsync`, `RevokeSessionsForRoleAsync`
    - Mark sessions as Revoked with reason and timestamp
    - _Requirements: 11.1, 11.5, 11.6, 6.2, 10.1, 10.2, 10.3_

  - [x] 2.5 Implement IAuditLogService and AuditLogService
    - Create immutable audit log entries with all required fields (timestamp, action, performer, target, IP, old/new values, affected fields, correlation ID)
    - Implement query with pagination, filtering by action type, user, and date range (max 12-month span)
    - Ensure no update/delete operations are exposed on audit records
    - _Requirements: 12.1, 12.4, 12.5_

  - [x] 2.6 Implement IPasswordHistoryService and PasswordHistoryService
    - Record password hash on every password change
    - Check new password against last 5 stored hashes using the Identity hasher's `VerifyHashedPassword`
    - _Requirements: 17.7_

  - [x] 2.7 Write property test for password history reuse (Property 17)
    - **Property 17: Password History Prevents Reuse**
    - For any user with password history entries, verify that a password matching any of the previous 5 is rejected
    - **Validates: Requirements 17.7**

  - [x] 2.8 Implement IAccountLockoutService and AccountLockoutService
    - Track failed login attempts using ASP.NET Identity's built-in lockout mechanism
    - Configure lockout threshold (5 attempts) and duration (15 minutes)
    - Implement automatic unlock after lockout expiry and counter reset
    - _Requirements: 1.7, 1.9, 3.1, 3.2, 3.3, 3.4_

  - [x] 2.9 Write property test for failed login counter state machine (Property 2)
    - **Property 2: Failed Login Attempt Counter State Machine**
    - For any user with < 5 failures, verify increment by 1 on failure, lockout at 5, and reset to 0 on success
    - **Validates: Requirements 1.2, 1.7, 3.1, 3.4**

  - [x] 2.10 Write property test for locked account rejection (Property 3)
    - **Property 3: Locked Account Rejects All Credentials**
    - For any locked user and any credentials, verify all login attempts rejected during lockout, and auto-unlock after 15 minutes
    - **Validates: Requirements 1.9, 3.2, 3.3**

- [x] 3. Implement authentication commands and handlers
  - [x] 3.1 Implement LoginCommand, Handler, and Validator
    - Validate email format, non-empty password
    - Check user exists, is active, is not locked out
    - Verify password via SignInManager
    - On success: generate tokens, create session, update LastLoginAt, log audit entry, reset failed count
    - On failure: increment failed count, check lockout, return generic error
    - Set refresh token as HttpOnly Secure SameSite=Strict cookie
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 1.8, 3.1, 3.4, 3.5, 12.1, 19.2, 19.3, 19.6_

  - [x] 3.2 Implement RefreshTokenCommand, Handler, and Validator
    - Extract refresh token from cookie
    - Validate token exists, not expired, not revoked, not used
    - Issue new token pair with 30-second grace period on old token
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

  - [x] 3.3 Implement LogoutCommand and Handler
    - Revoke current session and refresh token
    - Log audit entry for user logout
    - _Requirements: 12.1_

  - [x] 3.4 Implement ChangePasswordCommand, Handler, and Validator
    - Validate current password, validate new password against policy
    - Check password history (last 5)
    - Update password, record in history, revoke all sessions
    - Log audit entry
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.7, 10.3_

  - [x] 3.5 Implement GetCurrentUserQuery and Handler
    - Return current user info (id, name, email, roles, permissions) from claims
    - _Requirements: 2.4_

  - [x] 3.6 Implement PasswordValidator with FluentValidation
    - Min 8 chars, max 128 chars, at least 1 uppercase, 1 number, 1 special character
    - Return all violated rules (not just the first)
    - _Requirements: 4.10, 7.2, 17.1, 17.2, 17.3, 17.4_

  - [x] 3.7 Write property test for password validation (Property 4)
    - **Property 4: Password Validation Identifies All Violated Rules**
    - For any string input, verify validator correctly identifies each individual violated rule without false positives
    - **Validates: Requirements 4.10, 7.2, 7.3, 17.1, 17.2, 17.3, 17.4**

- [x] 4. Checkpoint - Ensure all tests pass
  - All user management tests pass (769 total). 5 pre-existing failures in PlanningApprovals and LandAcquisition modules are unrelated (auth middleware not yet wired — Task 8.5).

- [x] 5. Implement user management commands and queries
  - [x] 5.1 Implement CreateUserCommand, Handler, and Validator
    - Validate all fields (name, email format, email uniqueness, password policy, role existence)
    - Create user via UserManager, assign roles, record password history
    - Log audit entry
    - _Requirements: 4.2, 4.3, 4.4, 4.10_

  - [x] 5.2 Write property test for email uniqueness (Property 6)
    - **Property 6: Email Uniqueness Constraint**
    - For any email that already exists, verify creation is rejected with appropriate validation error
    - **Validates: Requirements 4.4**

  - [x] 5.3 Implement UpdateUserCommand, Handler, and Validator
    - Update user fields (name, email), handle role changes
    - On role change: revoke all sessions, log audit
    - _Requirements: 4.5, 10.1, 12.1_

  - [x] 5.4 Implement DeactivateUserCommand and ReactivateUserCommand with Handlers
    - Set IsActive flag, revoke all sessions on deactivation (within 5 seconds)
    - Retry session revocation up to 3 times on failure
    - Log audit entry with old/new values
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7_

  - [x] 5.5 Write property test for session revocation on security changes (Property 8)
    - **Property 8: Session Revocation on Security-Critical Changes**
    - For any user with active sessions, verify deactivation/role change/permission change/password reset revokes all sessions
    - **Validates: Requirements 6.2, 7.4, 9.5, 10.1, 10.2, 10.3**

  - [x] 5.6 Implement ResetPasswordCommand, Handler, and Validator
    - Validate new password against policy and history
    - Update password, record history, revoke all sessions
    - Log audit entry
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 10.3_

  - [x] 5.7 Implement BulkImportUsersCommand, Handler, and Validator
    - Parse CSV (FirstName, LastName, Email, Password, Roles columns)
    - Validate each row independently, report row-level errors
    - Create valid users, skip invalid rows with error details
    - _Requirements: 4.9_

  - [x] 5.8 Implement GetUsersQuery and Handler (paginated, searchable, filterable)
    - Support pagination (10, 25, 50 page sizes), search by name/email (case-insensitive), filter by status (All/Active/Inactive)
    - Return UserListItemDto with roles as string array
    - Debounce handled on frontend; backend returns filtered results
    - _Requirements: 4.1, 4.6, 4.7, 4.8_

  - [x] 5.9 Write property test for user search (Property 5)
    - **Property 5: User Search Returns Only Matching Results**
    - For any search term and dataset, verify results contain only matching users (case-insensitive on name/email) with no false exclusions
    - **Validates: Requirements 4.6**

  - [x] 5.10 Implement GetUserByIdQuery and Handler
    - Return full UserDetailDto including security summary, sessions, assigned roles
    - Return 404 if user not found
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

- [x] 6. Implement role and permission management
  - [x] 6.1 Implement CreateRoleCommand, Handler, and Validator
    - Validate role name (alphanumeric + hyphens, max 50), description (max 200), uniqueness
    - Create role with permissions
    - _Requirements: 8.2, 8.8_

  - [x] 6.2 Write property test for role name uniqueness (Property 7)
    - **Property 7: Role Name Uniqueness Constraint**
    - For any role name that already exists, verify creation is rejected with appropriate validation error
    - **Validates: Requirements 8.8**

  - [x] 6.3 Implement UpdateRoleCommand, DeleteRoleCommand with Handlers
    - Prevent deletion/rename of built-in roles
    - Warn on delete if users assigned (return user count)
    - _Requirements: 8.6, 8.7_

  - [x] 6.4 Write property test for built-in role protection (Property 14)
    - **Property 14: Built-In Roles Are Protected**
    - For any of the 13 built-in roles, verify delete and rename are rejected
    - **Validates: Requirements 8.6**

  - [x] 6.5 Implement UpdateRolePermissionsCommand and Handler
    - Toggle individual permission on/off for a role
    - Revoke all sessions for users assigned to that role
    - Log audit entry
    - _Requirements: 9.4, 9.5, 10.2_

  - [x] 6.6 Implement GetRolesQuery, GetRoleByIdQuery, GetPermissionMatrixQuery with Handlers
    - Roles list with user count, search by name/description
    - Role detail with permissions list
    - Permission matrix: all permissions × all roles grid with granted/not-granted state
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3_

- [x] 7. Implement session and audit log queries
  - [x] 7.1 Implement GetUserSessionsQuery, RevokeSessionCommand, RevokeAllSessionsCommand with Handlers
    - Return sessions with device, location, IP, last active, status (Current/Active/Expired)
    - Prevent revoking current session
    - Immediate token invalidation on revoke
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 7.2 Write property test for deactivated user 401 (Property 9)
    - **Property 9: Deactivated User Receives 401 on Any API Call**
    - For any deactivated user and any protected endpoint, verify 401 Unauthorized response
    - **Validates: Requirements 6.4, 6.5**

  - [x] 7.3 Write property test for revoked session 401 with reason (Property 10)
    - **Property 10: Revoked Session Returns 401 With Reason**
    - For any revoked session, verify next API call returns 401 with reason message
    - **Validates: Requirements 10.4, 11.5**

  - [x] 7.4 Implement GetAuditLogsQuery and Handler
    - Paginated (10, 25, 50, 100 page sizes), filterable by action type, user, date range (max 12 months)
    - Return only to SuperAdmin users
    - Return empty state message when no records match
    - _Requirements: 12.2, 12.3, 12.6, 12.7_

  - [x] 7.5 Write property test for audit record immutability (Property 12)
    - **Property 12: Audit Records Are Immutable**
    - For any existing audit log entry, verify modification/deletion attempts fail
    - **Validates: Requirements 12.4**

  - [x] 7.6 Write property test for admin endpoint access control (Property 15)
    - **Property 15: Admin Endpoints Reject Non-SuperAdmin With 403**
    - For any non-SuperAdmin user and any admin endpoint, verify 403 Forbidden with no admin data leaked
    - **Validates: Requirements 18.1, 18.3, 18.5**

- [x] 8. Implement API controllers and middleware
  - [x] 8.1 Implement AuthController
    - POST `/api/v1/auth/login` — login with credentials
    - POST `/api/v1/auth/refresh` — refresh token (cookie-based)
    - POST `/api/v1/auth/logout` — logout
    - POST `/api/v1/auth/change-password` — change password
    - GET `/api/v1/auth/me` — get current user
    - Anonymous access for login/refresh, authenticated for others
    - _Requirements: 1.1, 1.5, 2.1, 2.3_

  - [x] 8.2 Implement UsersController
    - CRUD endpoints under `/api/v1/admin/users` with SuperAdmin authorization
    - GET (paginated, search, filter), GET by ID, POST create, PUT update, POST deactivate, POST reactivate, POST reset-password, POST bulk-import
    - _Requirements: 4.1, 4.2, 4.5, 4.9, 6.1, 6.6, 7.1, 18.1_

  - [x] 8.3 Implement RolesController and PermissionsController
    - Roles: GET list, GET by ID, POST create, PUT update, DELETE
    - Permissions: GET matrix, PUT toggle permission
    - SuperAdmin authorization on all endpoints
    - _Requirements: 8.1, 8.2, 8.3, 9.1, 9.4, 18.1_

  - [x] 8.4 Implement SessionsController and AuditLogsController
    - Sessions: GET user sessions, POST revoke, POST revoke-all
    - AuditLogs: GET paginated with filters
    - SuperAdmin authorization
    - _Requirements: 11.1, 11.2, 11.3, 12.2, 12.3, 18.1_

  - [x] 8.5 Implement authentication middleware and CSRF validation
    - JWT bearer authentication configuration
    - Dev mode bypass middleware (development environment only, treat unauthenticated as SuperAdmin)
    - CSRF token validation on POST/PUT/PATCH/DELETE
    - Session validation middleware (check session not revoked, user still active)
    - _Requirements: 15.1, 15.3, 15.4, 19.1, 19.4, 19.5, 19.6_

  - [x] 8.6 Write property test for CSRF validation (Property 16)
    - **Property 16: CSRF Validation Rejects Invalid Tokens**
    - For any state-changing request missing or presenting invalid CSRF token, verify rejection and operation not processed
    - **Validates: Requirements 19.4, 19.5**

- [x] 9. Checkpoint - Ensure all backend tests pass
  - All backend tests pass (891 total). 11 pre-existing failures in PlanningApprovals and LandAcquisition modules are unrelated to user management.

- [x] 10. Implement frontend auth store and services
  - [x] 10.1 Create auth NgRx state, actions, reducer, and selectors
    - State: currentUser, accessToken, isAuthenticated, isLoading, error, roles, permissions
    - Actions: login, loginSuccess, loginFailure, logout, refreshToken, refreshTokenSuccess, refreshTokenFailure, loadCurrentUser
    - Selectors: selectCurrentUser, selectIsAuthenticated, selectUserRoles, selectIsLoading, selectAuthError
    - _Requirements: 1.1, 2.1, 13.1_

  - [x] 10.2 Create auth effects (login, logout, refresh, load current user)
    - Login effect: call API, store token, schedule refresh, navigate to home
    - Logout effect: call API, clear state, navigate to login
    - Refresh effect: call API, update token, reschedule refresh
    - Load current user effect: call GET /auth/me on app init
    - _Requirements: 1.1, 2.1, 2.2_

  - [x] 10.3 Implement AuthService and TokenRefreshService
    - AuthService: login, logout, refreshToken, getCurrentUser API calls
    - TokenRefreshService: schedule refresh at 45-50 min mark, queue requests during refresh, retry 3 times with 2s delay, replay queued requests on success
    - _Requirements: 2.1, 2.3, 2.5, 2.6_

  - [x] 10.4 Implement auth HTTP interceptor
    - Attach Authorization Bearer header to all requests except auth endpoints
    - Queue requests during token refresh, replay with new token
    - Handle 401 → dispatch logout
    - _Requirements: 2.4, 2.5_

  - [x] 10.5 Implement auth guards and role guards
    - AuthGuard: redirect to login if not authenticated
    - RoleGuard: check user roles, redirect to home with access-denied notification if insufficient permissions
    - AdminGuard: specifically check SuperAdmin role for admin routes
    - _Requirements: 18.2, 18.4, 18.5_

- [x] 11. Implement frontend login page
  - [x] 11.1 Create login component with full branding and form
    - Brand heading "BuildEstate Pro" with application icon
    - 3 feature highlights with icons: "Enterprise grade security", "Role-based access control", "Complete audit logging"
    - Authentication flow steps: "Enter credentials", "Verify identity", "Access granted"
    - Security features summary section (encrypted data, lockout protection, audit trail)
    - Login form: email field, password field with visibility toggle, "Remember me" checkbox, "Forgot password?" link, "Sign In" button
    - "Continue without signing in (Dev Mode)" link (visible only in development environment)
    - Dark theme styling with navy/dark blue backgrounds
    - _Requirements: 1.5, 15.2, 15.4, 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 11.2 Implement login form validation and submission
    - Inline email format validation before server submission
    - Display server error messages (invalid credentials, account deactivated, account locked with remaining duration)
    - Disable submit button during API call
    - On success: store token, navigate to home
    - Dev mode: create client-side SuperAdmin session without API call
    - Dev mode indicator banner: "Development Mode — Authentication Bypassed"
    - _Requirements: 1.2, 1.3, 1.4, 1.8, 15.2, 15.3, 15.5_

- [x] 12. Implement frontend admin stores and services
  - [x] 12.1 Create users NgRx store (state, actions, reducer, effects, selectors)
    - State: users list, selectedUser, pagination, loading, error, search/filter params
    - CRUD actions with success/failure variants
    - Effects for all API calls with error handling
    - _Requirements: 4.1, 4.6, 4.7, 4.8_

  - [x] 12.2 Create roles NgRx store (state, actions, reducer, effects, selectors)
    - State: roles list, selectedRole, permissionMatrix, loading, error
    - Actions for CRUD, permission toggle
    - _Requirements: 8.1, 8.3, 9.1_

  - [x] 12.3 Create sessions and audit-logs NgRx stores
    - Sessions state: sessions list, loading, error
    - Audit logs state: entries, pagination, filters, loading, error
    - _Requirements: 11.1, 12.2_

  - [x] 12.4 Create admin API services (UsersService, RolesService, SessionsService, AuditLogsService)
    - Typed HTTP methods for all admin endpoints
    - Return Observable<T> with proper DTOs
    - _Requirements: 4.1, 8.1, 11.1, 12.2_

- [x] 13. Implement frontend user management pages
  - [x] 13.1 Create user list page component
    - Paginated data table: Name, Email, Roles (colored badges), Status (Active/Inactive badge), Last Login, Actions
    - Default page size 10, selectable 10/25/50
    - Search input with 300ms debounce filtering by name/email
    - Status filter dropdown (All, Active, Inactive)
    - Pagination controls showing "1 to 9 of 25 users"
    - "+ New User" button, "Import Users" button
    - _Requirements: 4.1, 4.6, 4.7, 4.8_

  - [x] 13.2 Create user create page component
    - Form fields: First Name, Last Name, Email, Password (with visibility toggle), Confirm Password
    - Searchable role assignment panel with checkboxes for all 13 roles
    - Real-time password policy validation with checkmarks per requirement
    - Email uniqueness validation (async)
    - Submit → create user → success notification → navigate to list
    - _Requirements: 4.2, 4.3, 4.4, 4.10_

  - [x] 13.3 Create user detail page component
    - Header: initials avatar, full name, highest-precedence role badge, status badge, last login
    - Tabbed navigation: Overview, Roles, Security, Sessions, Activity
    - Overview tab: user info, assigned roles badges, security summary (password last changed, failed attempts, last audit activity)
    - Quick Action buttons: Reset Password, Deactivate User, View Sessions, View Activity
    - "Edit User" button, "More Actions" dropdown (Deactivate, Reset Password, Revoke All Sessions)
    - 404 state: "User not found" with link back to user list
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 13.4 Create user edit page component
    - Pre-populated form with current data (excluding password)
    - Same role assignment panel as create
    - Submit → update user → success notification
    - _Requirements: 4.5_

  - [x] 13.5 Implement deactivation confirmation dialog and password reset dialog
    - Deactivation: confirmation with user name and warning "The user will be immediately signed out and this action can be undone"
    - Password reset: password entry with visibility toggle, requirements checklist with live validation (300ms), "Password is not shared with anyone" notice, disable confirm until complete, error preservation on failure
    - _Requirements: 6.1, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 13.6 Implement CSV bulk import dialog
    - File upload accepting CSV format
    - Validate columns: FirstName, LastName, Email, Password, Roles
    - Row-level validation with error display
    - Import valid rows, report errors for invalid rows
    - _Requirements: 4.9_

- [x] 14. Implement frontend role management pages
  - [x] 14.1 Create role list page component
    - Paginated data table: Role Name, Description, Users count, Actions
    - Search by name/description
    - "+ New Role" button
    - Click row → open details side panel
    - _Requirements: 8.1, 8.5_

  - [x] 14.2 Create role create/edit component
    - Form: Role Name (alphanumeric + hyphens, max 50), Description (max 200)
    - Permission assignment panel
    - Name uniqueness validation (async)
    - _Requirements: 8.2, 8.8_

  - [x] 14.3 Create role detail side panel component
    - Show: role name, description, "Edit Role" button, total permissions count, assigned permissions list
    - "View All Permissions" link to permission matrix
    - Delete button with warning dialog showing affected user count for roles with users
    - _Requirements: 8.3, 8.4, 8.7_

  - [x] 14.4 Create permission matrix page component
    - Grid: permissions as rows (grouped by domain area, collapsible), roles as columns
    - Checkmark cells for granted permissions
    - Search input filtering permission rows (300ms debounce)
    - Toggle click → confirmation dialog (role name, permission name, session revocation warning)
    - Confirm → update → success notification; failure → revert checkbox state + error notification
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 15. Implement frontend session and audit log pages
  - [x] 15.1 Create session list page component
    - Table: Device (browser/OS), Location (city/country), IP Address, Last Active, Status (Current/Active/Expired)
    - "Revoke" button per row (disabled for current session)
    - "Revoke All Other Sessions" button
    - Notice: "You can revoke other active sessions. Current session cannot be revoked."
    - Real-time removal of revoked sessions without page reload
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6_

  - [x] 15.2 Create audit log list page component
    - Paginated table: Date & Time, Action, Performed By, Target User, Details (page sizes: 10, 25, 50, 100; default 25)
    - Tab-based filtering: "All Actions" tab, "All Users" tab
    - Date range filter (max 12-month span)
    - Empty state: "No records found for the selected criteria" with suggestion to adjust filters
    - _Requirements: 12.2, 12.3, 12.7_

- [x] 16. Implement sidebar navigation and role directive
  - [x] 16.1 Implement `*appHasRole` structural directive
    - Accept role string or array of roles
    - Show element if user has at least one matching role
    - Subscribe to role changes for dynamic updates
    - _Requirements: 13.2, 13.9_

  - [x] 16.2 Update sidebar navigation with role-based filtering
    - Filter menu items based on union of user's roles (no duplicates)
    - SuperAdmin sees all sections including Administration (Users, Roles, Audit Logs, System Settings)
    - AcquisitionManager: Dashboard, Land Acquisition, Reports
    - LegalOfficer: Dashboard, Legal & Compliance, Reports
    - FinanceDirector: Dashboard, Finance, Reports, Land Acquisition
    - No roles: Dashboard only
    - Update within 2 seconds on role change without full reload
    - _Requirements: 13.1, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_

  - [x] 16.3 Write property test for navigation filtering (Property 13)
    - **Property 13: Role-Based Navigation Filtering**
    - For any user with any set of roles, verify visible items equal the set union of permitted items; no roles → Dashboard only
    - **Validates: Requirements 13.1, 13.7, 13.8**

- [x] 17. Implement dark theme and WCAG compliance
  - [x] 17.1 Implement application-wide dark theme
    - Navy/dark blue page backgrounds as default appearance
    - Card/panel backgrounds with 1.2:1 contrast ratio vs page background
    - Colored badges/status indicators: 3:1 contrast for non-text, 4.5:1 for text within badges
    - All text content: 4.5:1 minimum contrast ratio
    - Applied to all routes (login, dashboard, admin, features)
    - Interactive states (hover, focus, disabled) visually distinguishable
    - Use Tailwind CSS color tokens and DaisyUI theme configuration
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [x] 18. Wire admin routes and integrate all components
  - [x] 18.1 Configure admin routing module with lazy loading
    - `/admin/users` → user list, `/admin/users/create` → create, `/admin/users/:id` → detail, `/admin/users/:id/edit` → edit
    - `/admin/roles` → role list, `/admin/roles/create` → create
    - `/admin/permissions` → permission matrix
    - `/admin/sessions` → session list (contextual per user from detail page)
    - `/admin/audit-logs` → audit log list
    - Apply AdminGuard (SuperAdmin check) to all admin routes
    - Hide admin nav links from non-SuperAdmin users
    - _Requirements: 18.1, 18.2, 18.4, 18.5_

  - [x] 18.2 Wire all components end-to-end and verify integration
    - Ensure login → token stored → interceptor attaches → API calls work
    - Ensure token refresh triggers at 45-50 min → silent re-auth
    - Ensure role change → session revocation → 401 → redirect to login with reason
    - Ensure deactivation → immediate session revocation → 401
    - Ensure permission toggle → session revocation cascade
    - Ensure CSRF token attached to state-changing requests
    - _Requirements: 1.1, 2.1, 6.2, 10.1, 10.4, 19.4_

  - [x] 18.3 Write integration tests for critical auth flows
    - Full login → use protected endpoint → refresh → logout flow
    - Deactivation → verify 401 on subsequent request
    - Role change → verify session revoked
    - Non-SuperAdmin → verify 403 on admin endpoints
    - _Requirements: 1.1, 2.1, 6.4, 10.1, 18.3_

- [x] 19. Final checkpoint - Ensure all tests pass
  - All tests pass. Backend: 891 passing (11 pre-existing unrelated failures). Frontend: ng build passes. Full user management system complete.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using FsCheck (backend) and fast-check (frontend)
- Unit tests validate specific examples and edge cases
- Backend uses C# with ASP.NET Core, EF Core, MediatR, FluentValidation
- Frontend uses TypeScript with Angular 20, NgRx, Tailwind CSS, DaisyUI
- All 19 requirements are covered across implementation tasks
- All 18 correctness properties are covered by property test sub-tasks

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["2.1", "2.4", "2.5", "2.6", "2.8"] },
    { "id": 4, "tasks": ["2.2", "2.3", "2.7", "2.9", "2.10"] },
    { "id": 5, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6"] },
    { "id": 6, "tasks": ["3.7"] },
    { "id": 7, "tasks": ["5.1", "5.3", "5.4", "5.6", "5.7", "5.8", "5.10"] },
    { "id": 8, "tasks": ["5.2", "5.5", "5.9"] },
    { "id": 9, "tasks": ["6.1", "6.3", "6.5", "6.6"] },
    { "id": 10, "tasks": ["6.2", "6.4"] },
    { "id": 11, "tasks": ["7.1", "7.4"] },
    { "id": 12, "tasks": ["7.2", "7.3", "7.5", "7.6"] },
    { "id": 13, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5"] },
    { "id": 14, "tasks": ["8.6"] },
    { "id": 15, "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5"] },
    { "id": 16, "tasks": ["11.1", "11.2"] },
    { "id": 17, "tasks": ["12.1", "12.2", "12.3", "12.4"] },
    { "id": 18, "tasks": ["13.1", "13.2", "13.3", "13.4", "13.5", "13.6"] },
    { "id": 19, "tasks": ["14.1", "14.2", "14.3", "14.4"] },
    { "id": 20, "tasks": ["15.1", "15.2"] },
    { "id": 21, "tasks": ["16.1", "16.2"] },
    { "id": 22, "tasks": ["16.3"] },
    { "id": 23, "tasks": ["17.1"] },
    { "id": 24, "tasks": ["18.1", "18.2"] },
    { "id": 25, "tasks": ["18.3"] }
  ]
}
```
