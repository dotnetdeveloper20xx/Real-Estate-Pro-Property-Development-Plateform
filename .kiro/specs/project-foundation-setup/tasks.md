# Implementation Plan: Project Foundation Setup

## Overview

This plan implements the BuildEstate Pro platform foundation using Clean Architecture with .NET 8. It covers the solution structure, Domain layer (BaseEntity, interfaces, enums, domain events), Infrastructure layer (EF Core DbContext, audit interceptor, repository, Identity, token service), Application layer (MediatR pipeline behaviors), Shared layer (response envelope, exceptions), and API layer (middleware, controllers, Program.cs, Swagger, JWT auth). Tasks are ordered to build incrementally from innermost layer outward.

## Tasks

- [x] 1. Create solution structure, projects, and NuGet packages
  - [x] 1.1 Create .NET solution with all projects and references
    - Create BuildEstate.sln with projects: BuildEstate.Domain (classlib), BuildEstate.Application (classlib), BuildEstate.Infrastructure (classlib), BuildEstate.Shared (classlib), BuildEstate.API (webapi), BuildEstate.Tests (xunit)
    - Configure project references: Application → Domain; Infrastructure → Domain + Application; API → Application + Infrastructure + Shared; Tests → Domain + Application + Infrastructure + API
    - Domain and Shared must have zero project references to other layers
    - Verify `dotnet build` completes with zero errors and zero warnings
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 1.2 Install NuGet packages with pinned versions
    - Application: MediatR, FluentValidation, FluentValidation.DependencyInjectionExtensions, AutoMapper, AutoMapper.Extensions.Microsoft.DependencyInjection
    - Infrastructure: Microsoft.EntityFrameworkCore, Microsoft.EntityFrameworkCore.SqlServer, Microsoft.EntityFrameworkCore.Tools, Microsoft.AspNetCore.Identity.EntityFrameworkCore
    - API: Microsoft.AspNetCore.Authentication.JwtBearer, Swashbuckle.AspNetCore, Microsoft.EntityFrameworkCore.Design
    - Tests: xunit, xunit.runner.visualstudio, Moq, FluentAssertions, Microsoft.NET.Test.Sdk, FsCheck.Xunit
    - All versions must use exact pinning (Version="X.Y.Z"), no wildcards or ranges
    - Verify `dotnet restore` and `dotnet build` succeed with zero package conflicts
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 2. Implement Domain Layer core types
  - [x] 2.1 Create BaseEntity, IAuditableEntity, and domain event interfaces
    - Create `Domain/Common/IAuditableEntity.cs` with CreatedAt, CreatedBy, UpdatedAt, UpdatedBy properties
    - Create `Domain/Common/IDomainEvent.cs` as a marker interface
    - Create `Domain/Common/IHasDomainEvents.cs` exposing IReadOnlyCollection<IDomainEvent> DomainEvents
    - Create `Domain/Common/BaseEntity.cs` implementing IHasDomainEvents and IAuditableEntity with: Guid Id (initialized with Guid.NewGuid()), CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, IsDeleted, DeletedAt, DeletedBy, RowVersion, private domain events list, protected AddDomainEvent, public ClearDomainEvents
    - Zero external NuGet dependencies in Domain project
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 2.2 Create IRepository<T> and IUnitOfWork interfaces
    - Create `Domain/Common/IRepository.cs` with type parameter constrained to BaseEntity
    - Methods: GetByIdAsync(Guid id, CancellationToken ct = default), GetAllAsync(CancellationToken ct = default), Query() returning IQueryable<T>, AddAsync(T entity, CancellationToken ct = default), Update(T entity), Delete(T entity)
    - Create `Domain/Common/IUnitOfWork.cs` with SaveChangesAsync(CancellationToken ct = default) returning Task<int>
    - No EF Core or persistence technology references
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 2.3 Create common enumerations
    - Create `Domain/Enums/ApprovalStatus.cs`: Pending=0, UnderReview=1, Approved=2, Rejected=3, Escalated=4
    - Create `Domain/Enums/Priority.cs`: Low=0, Medium=1, High=2, Critical=3
    - Create `Domain/Enums/DocumentType.cs`: TitleDeed=0, SearchReport=1, LegalDocument=2, EnvironmentalReport=3, PlanningDocument=4, Contract=5, Valuation=6, Correspondence=7
    - Create `Domain/Enums/OpportunityStatus.cs`: Identified=0, InitialReview=1, DueDiligence=2, OfferMade=3, UnderContract=4, Acquired=5, Withdrawn=6
    - All values have explicit integer backing values starting from zero
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 2.4 Write property tests for BaseEntity and enumerations
    - **Property 1: Entity Id Uniqueness** — Create N BaseEntity instances and verify all Ids are unique non-empty Guids
    - **Property 5: Domain Events Insertion Order** — Add random sequences of domain events and verify insertion order is preserved; verify ClearDomainEvents empties the collection
    - **Property 19: Domain Enum Integer Mapping** — Use reflection to verify all domain enums have explicit sequential integer values starting from zero with no duplicates
    - **Validates: Requirements 3.1, 3.7, 5.5, 6.5**

- [x] 3. Implement Shared Layer
  - [x] 3.1 Create ApiResponse<T> and PagedResult<T>
    - Create `Shared/ApiResponse.cs` with Data (T?), Success (bool), Errors (List<string>), static SuccessResult(T data), static FailureResult(List<string> errors)
    - Create `Shared/PagedResult.cs` with Items (List<T>), TotalCount (>=0), Page (>=1), PageSize (>=1, <=100), TotalPages (calculated as ceiling of TotalCount/PageSize)
    - Add validation that rejects Page < 1 or PageSize < 1
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [x] 3.2 Create custom exception types
    - Create `Shared/Exceptions/NotFoundException.cs` accepting a message string
    - Create `Shared/Exceptions/ConflictException.cs` accepting a message string
    - Create `Shared/Exceptions/ForbiddenException.cs` accepting a message string
    - _Requirements: 19.8_

  - [ ]* 3.3 Write property tests for ApiResponse and PagedResult
    - **Property 14: ApiResponse Factory Correctness** — For random T values, SuccessResult produces Success=true, Data=value, Errors empty; for random error lists, FailureResult produces Success=false, Data=default, Errors=provided list
    - **Property 15: PagedResult TotalPages Calculation** — For random TotalCount (0–10000) and PageSize (1–100), verify TotalPages equals Math.Ceiling((double)TotalCount / PageSize)
    - **Validates: Requirements 16.3, 16.4**

- [x] 4. Checkpoint — Verify Domain and Shared layers compile
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Infrastructure Layer — DbContext, Identity, and Audit
  - [x] 5.1 Create ApplicationUser and ApplicationRole entities
    - Create `Infrastructure/Identity/ApplicationUser.cs` extending IdentityUser with FirstName (max 128), LastName (max 128), IsActive (default true)
    - Create `Infrastructure/Identity/ApplicationRole.cs` extending IdentityRole with Description (max 256)
    - _Requirements: 8.1, 8.2_

  - [x] 5.2 Create AuditLog entity and configuration
    - Create `Infrastructure/Persistence/Entities/AuditLog.cs` with Id, UserId, UserName, Action, EntityName, EntityId, OldValues, NewValues, AffectedColumns, Timestamp, IpAddress, CorrelationId (with max lengths per design)
    - Create AuditLog entity configuration enforcing max lengths and column types
    - Configure AuditLog DbSet as append-only (reject Update/Delete at application level via SaveChanges override or interceptor)
    - _Requirements: 12.1, 12.2, 12.6_

  - [x] 5.3 Create ICurrentUserService and BuildEstateDbContext
    - Create `Infrastructure/Services/ICurrentUserService.cs` interface with UserId and UserName properties
    - Create `Infrastructure/Persistence/BuildEstateDbContext.cs` inheriting from IdentityDbContext<ApplicationUser, ApplicationRole, string>
    - Include DbSet<AuditLog> AuditLogs
    - Call ApplyConfigurationsFromAssembly in OnModelCreating
    - Configure MigrationsAssembly to Infrastructure project
    - _Requirements: 7.1, 7.2, 10.1, 12.2_

  - [x] 5.4 Create BaseEntityConfiguration<T> and configure database standards
    - Create `Infrastructure/Persistence/Configurations/BaseEntityConfiguration.cs`
    - Configure Id as PK, RowVersion as concurrency token, global query filter for IsDeleted == false
    - Configure decimal properties with precision 18, scale 2
    - Add index on CreatedAt column
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 5.5 Create AuditInterceptor (SaveChangesInterceptor)
    - Create `Infrastructure/Persistence/Interceptors/AuditInterceptor.cs`
    - On Added entities: set CreatedAt = UTC now, CreatedBy = current user (or "System" if null/empty)
    - On Modified entities: set UpdatedAt = UTC now, UpdatedBy = current user; preserve CreatedAt/CreatedBy
    - On Deleted entities: change state to Modified, set IsDeleted=true, DeletedAt=UTC now, DeletedBy=current user
    - Write AuditLog records for each change (Create → NewValues JSON; Update → OldValues/NewValues/AffectedColumns; Delete → OldValues JSON)
    - Populate Timestamp, IpAddress, CorrelationId on AuditLog entries
    - Ensure entity save fails if AuditLog cannot be persisted (same transaction)
    - _Requirements: 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 12.3, 12.4, 12.5, 12.7, 12.8_

  - [ ]* 5.6 Write property tests for AuditInterceptor
    - **Property 2: Audit Interceptor — Created State** — For random entities with EntityState.Added, verify CreatedAt is set to UTC now and CreatedBy is set to current user (or "System")
    - **Property 3: Audit Interceptor — Modified State** — For random entities with EntityState.Modified, verify UpdatedAt/UpdatedBy are set while CreatedAt/CreatedBy are preserved
    - **Property 4: Soft Delete Invariant** — For random entities marked for deletion, verify IsDeleted=true, DeletedAt set, entity not physically removed, and subsequent queries exclude it
    - **Property 6: Audit Log Completeness** — For random entity mutations, verify corresponding AuditLog record with correct Action, serialized values, Timestamp, IpAddress, CorrelationId
    - **Property 7: Audit Log Immutability** — Verify attempts to update or delete existing AuditLog records are rejected
    - **Validates: Requirements 7.3, 7.4, 7.5, 9.1, 11.3, 11.6, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8**

- [x] 6. Implement Infrastructure Layer — Repository, UnitOfWork, and Token Service
  - [x] 6.1 Create Generic Repository implementation
    - Create `Infrastructure/Persistence/Repository.cs` implementing IRepository<T>
    - GetByIdAsync: query by Id, respects global query filter, returns null if not found
    - GetAllAsync: returns all non-deleted entities
    - Query: returns IQueryable<T> respecting soft-delete filter
    - AddAsync: calls DbSet.AddAsync with CancellationToken
    - Update: calls DbSet.Update
    - Delete: calls DbSet.Remove (interceptor converts to soft-delete)
    - Propagate CancellationToken to all EF Core operations
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [x] 6.2 Create UnitOfWork implementation
    - Create `Infrastructure/Persistence/UnitOfWork.cs` implementing IUnitOfWork
    - Wraps BuildEstateDbContext.SaveChangesAsync with CancellationToken
    - _Requirements: 4.4_

  - [x] 6.3 Create RefreshToken entity and TokenService
    - Create `Infrastructure/Identity/RefreshToken.cs` with Id, UserId, Token, ExpiresAt, IsUsed, IsRevoked, CreatedAt
    - Create `Infrastructure/Services/TokenService.cs` implementing JWT token generation with user ID, email, name, roles as claims, 60-minute expiry
    - Implement refresh token rotation: single-use tokens, 7-day expiry, generate new access + refresh token on use
    - If a consumed refresh token is presented, revoke all user's active tokens
    - Invalidate all refresh tokens on password change or role modification
    - _Requirements: 21.4, 21.5, 21.6, 21.7, 21.8_

  - [ ]* 6.4 Write property tests for TokenService and Repository
    - **Property 16: JWT Token Generation with Correct Claims** — For random user data, verify JWT contains correct claims with 60-minute expiry, valid issuer, valid audience
    - **Property 17: Refresh Token Rotation** — For random valid tokens, verify using produces new access+refresh while invalidating original; for consumed tokens, verify all user tokens are revoked
    - **Validates: Requirements 21.4, 21.5, 21.6**

  - [x] 6.5 Create AddInfrastructure extension method and Identity configuration
    - Create `Infrastructure/DependencyInjection.cs` with AddInfrastructure extension on IServiceCollection
    - Register BuildEstateDbContext with SQL Server and AuditInterceptor
    - Register ASP.NET Identity with ApplicationUser/ApplicationRole, password policy (min 8, max 128, upper+lower+digit+special), lockout (5 attempts, 15 minutes)
    - Register IRepository<> → Repository<> with scoped lifetime (open generic)
    - Register IUnitOfWork → UnitOfWork with scoped lifetime
    - Register TokenService
    - Read connection string from "ConnectionStrings:DefaultConnection"; fail startup if missing
    - _Requirements: 8.3, 8.4, 10.2, 10.3, 10.4, 11.7, 17.1_

  - [x] 6.6 Create Identity seed data
    - Create seed logic that runs in Development environment
    - Seed roles: SuperAdmin, AcquisitionManager, LegalOfficer, PlanningManager, ProjectManager, SiteManager, SalesManager, CompletionManager, PropertyManager, FinanceDirector, ValuationAnalyst, Surveyor, Admin
    - Seed admin user: admin@buildestate.co.uk / Admin@123456 with SuperAdmin role
    - Seeding must be idempotent (no duplicates on re-run)
    - _Requirements: 8.5, 8.6_

- [x] 7. Checkpoint — Verify Infrastructure layer compiles and integrates
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Application Layer — MediatR pipeline behaviors
  - [x] 8.1 Create ValidationBehavior<TRequest, TResponse>
    - Create `Application/Behaviors/ValidationBehavior.cs` implementing IPipelineBehavior
    - Inject IEnumerable<IValidator<TRequest>>
    - Execute all validators asynchronously using ValidateAsync
    - If failures exist, throw ValidationException with all property names and messages
    - If no validators registered, pass through to next delegate
    - _Requirements: 13.3, 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 8.2 Create LoggingBehavior<TRequest, TResponse>
    - Create `Application/Behaviors/LoggingBehavior.cs` implementing IPipelineBehavior
    - Log request type name at Information level on entry
    - Log request type name and elapsed milliseconds at Information level on exit
    - Log Warning if elapsed > 500ms
    - On exception: log Error with request type name and elapsed, re-throw without modification
    - Include CorrelationId as structured property in all log entries
    - Include current user ID from ICurrentUserService
    - _Requirements: 13.4, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [x] 8.3 Create AddApplication extension method
    - Create `Application/DependencyInjection.cs` with AddApplication extension on IServiceCollection
    - Register MediatR with assembly scanning of Application assembly
    - Register FluentValidation validators with assembly scanning
    - Register AutoMapper profiles with assembly scanning
    - Register ValidationBehavior before LoggingBehavior in pipeline
    - Return IServiceCollection for method chaining
    - _Requirements: 13.1, 13.2, 13.5, 13.6, 13.7_

  - [ ]* 8.4 Write property tests for ValidationBehavior and LoggingBehavior
    - **Property 8: Validation Pipeline — Reject Invalid Requests** — For random invalid commands with registered validators, verify ValidationException is thrown with all failure details and handler never executes
    - **Property 9: Logging Pipeline — Entry and Exit** — For random request types, verify Information-level log on entry (type name) and exit (type name + elapsed ms) with CorrelationId
    - **Property 10: Logging Pipeline — Error Propagation** — For random exceptions, verify Error-level log is emitted and original exception is re-thrown unmodified
    - **Validates: Requirements 13.3, 13.4, 14.1, 14.2, 14.4, 14.5, 15.1, 15.2, 15.4, 15.5**

- [x] 9. Implement API Layer — Middleware
  - [x] 9.1 Create CorrelationIdMiddleware
    - Create `API/Middleware/CorrelationIdMiddleware.cs`
    - If X-Correlation-ID header is present and a valid GUID, use it
    - If absent, empty, whitespace, or invalid GUID format, generate a new GUID (lowercase, no braces)
    - Add correlation ID to response header X-Correlation-ID
    - Add to logging scope as "CorrelationId"
    - Store in HttpContext.Items["CorrelationId"]
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [x] 9.2 Create SecurityHeadersMiddleware
    - Create `API/Middleware/SecurityHeadersMiddleware.cs`
    - Add headers: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, X-XSS-Protection: 1; mode=block, Referrer-Policy: strict-origin-when-cross-origin, Strict-Transport-Security: max-age=31536000; includeSubDomains, Content-Security-Policy: default-src 'self'
    - Apply to all responses regardless of status code
    - Do not overwrite headers already set by other components
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7, 23.8_

  - [x] 9.3 Create GlobalExceptionHandlerMiddleware
    - Create `API/Middleware/GlobalExceptionHandlerMiddleware.cs`
    - Map ValidationException → 400, NotFoundException → 404, ConflictException → 409, ForbiddenException → 403, all others → 500
    - Return JSON ApiResponse with Success=false and appropriate error messages
    - Log exception at Error level with correlation ID, request path, HTTP method
    - Never expose stack traces or internal details in 500 responses
    - Set Content-Type to application/json
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

  - [ ]* 9.4 Write property tests for middleware components
    - **Property 11: Correlation ID Propagation** — For random GUIDs, empty strings, invalid formats: verify correct correlation ID in response header, logging scope, and HttpContext.Items
    - **Property 12: Exception-to-HTTP Status Mapping** — For all exception types with random messages, verify correct HTTP status, ApiResponse structure, Error-level log, no stack trace exposure
    - **Property 13: Security Headers on All Responses** — For random request paths and status codes, verify all 6 security headers are present with correct values without overwriting existing headers
    - **Validates: Requirements 19.1–19.7, 20.1–20.6, 23.1–23.8**

- [x] 10. Implement API Layer — Controllers, Auth, Swagger, and Program.cs
  - [x] 10.1 Create BaseApiController
    - Create `API/Controllers/BaseApiController.cs`
    - Decorate with [ApiController], [Route("api/v1/[controller]")], [Authorize]
    - Inject IMediator via constructor, expose as protected property Mediator
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

  - [x] 10.2 Create CurrentUserService
    - Create `API/Services/CurrentUserService.cs` implementing ICurrentUserService
    - Extract UserId and UserName from HttpContext claims
    - Register with scoped lifetime
    - _Requirements: 17.2_

  - [x] 10.3 Configure Program.cs with full DI and middleware pipeline
    - Call AddApplication() and AddInfrastructure() extension methods
    - Register ICurrentUserService, HttpContextAccessor
    - Configure JWT Bearer authentication: validate issuer, audience, lifetime, signing key; fail startup if JWT config missing
    - Configure CORS "AllowFrontend" policy: origins from config "Cors:AllowedOrigins", allow methods/headers/credentials, expose X-Correlation-ID; fail startup if origins missing
    - Configure middleware in order: CorrelationId → SecurityHeaders → ExceptionHandler → HTTPS Redirect → CORS → Authentication → Authorization → Rate Limiting → Controllers → Health Checks
    - Map health check endpoint at "/health" (unauthenticated, returns 200)
    - Configure JSON serialization: System.Text.Json, camelCase, JsonStringEnumConverter
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 21.1, 21.2, 21.3, 21.7, 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 18.4, 18.5_

  - [x] 10.4 Configure Swagger/OpenAPI
    - Title: "BuildEstate Pro API", Version: "v1"
    - Add JWT Bearer security definition (Authorization header)
    - Only available in Development environment (not Production)
    - _Requirements: 18.1, 18.2, 18.3_

  - [x] 10.5 Create appsettings.json and appsettings.Development.json
    - Include ConnectionStrings:DefaultConnection placeholder
    - Include JWT configuration section (Issuer, Audience, SecretKey)
    - Include Cors:AllowedOrigins
    - _Requirements: 10.3, 21.2, 22.2_

  - [ ]* 10.6 Write property test for JWT authentication enforcement
    - **Property 18: Authentication Enforcement** — For random API endpoints not decorated with [AllowAnonymous], verify requests without valid JWT (missing, expired, malformed, invalid signature, wrong issuer/audience) receive HTTP 401
    - **Validates: Requirements 21.1, 21.7, 24.4**

- [x] 11. Checkpoint — Full solution builds and all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Create initial EF Core migration
  - [x] 12.1 Generate initial migration and verify
    - Run `dotnet ef migrations add InitialCreate --project src/BuildEstate.Infrastructure --startup-project src/BuildEstate.API`
    - Verify migration includes both Up and Down methods
    - Verify migration creates tables for Identity, AuditLog, and RefreshToken
    - _Requirements: 10.1, 10.2, 10.5_

- [x] 13. Final checkpoint — Ensure full solution builds, all tests pass, and application starts
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (19 properties covered)
- Unit tests validate specific examples and edge cases
- The tech stack is C# / .NET 8 / EF Core / SQL Server / MediatR / FluentValidation / AutoMapper / xUnit / FsCheck.Xunit
- FsCheck property tests should run a minimum of 100 iterations per property
- Tag format for property tests: `// Feature: project-foundation-setup, Property {number}: {title}`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3", "3.1", "3.2"] },
    { "id": 3, "tasks": ["2.4", "3.3"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 5, "tasks": ["5.4", "5.5"] },
    { "id": 6, "tasks": ["5.6", "6.1", "6.2", "6.3"] },
    { "id": 7, "tasks": ["6.4", "6.5", "6.6"] },
    { "id": 8, "tasks": ["8.1", "8.2"] },
    { "id": 9, "tasks": ["8.3", "8.4"] },
    { "id": 10, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 11, "tasks": ["9.4", "10.1", "10.2"] },
    { "id": 12, "tasks": ["10.3", "10.4", "10.5"] },
    { "id": 13, "tasks": ["10.6"] },
    { "id": 14, "tasks": ["12.1"] }
  ]
}
```
