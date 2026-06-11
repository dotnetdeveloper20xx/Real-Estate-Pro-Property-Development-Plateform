# Requirements Document

## Introduction

This document specifies the requirements for the foundational setup of the BuildEstate Pro platform. It covers the initial project scaffolding using Clean Architecture, the Domain Layer with base entities and interfaces, the Infrastructure Layer with EF Core and audit capabilities, the Application Layer foundation with CQRS pipeline, and the API Layer foundation with middleware and authentication. These layers form the shared foundation that all 14 business modules depend on.

## Glossary

- **Solution**: The .NET solution file that organizes all projects in the BuildEstate Pro platform
- **Domain_Layer**: The innermost architectural layer containing entities, enums, interfaces, and domain events with zero external dependencies
- **Application_Layer**: The layer containing MediatR commands, queries, handlers, validators, DTOs, and pipeline behaviors
- **Infrastructure_Layer**: The layer implementing data persistence via EF Core, ASP.NET Identity, repository pattern, and audit interceptors
- **API_Layer**: The outermost layer handling HTTP concerns including controllers, middleware, authentication, and Swagger documentation
- **Base_Entity**: The abstract base class providing Id, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, IsDeleted, DeletedAt, DeletedBy, and RowVersion fields to all domain entities
- **Audit_Interceptor**: An EF Core SaveChanges interceptor that automatically populates audit columns and converts hard deletes to soft deletes
- **Generic_Repository**: A repository implementation parameterized by entity type providing standard CRUD operations
- **Unit_Of_Work**: A pattern ensuring all changes within a single operation are saved atomically
- **MediatR_Pipeline**: The request processing pipeline that routes commands and queries through behaviors before reaching handlers
- **Validation_Behavior**: A MediatR pipeline behavior that automatically runs FluentValidation validators before handler execution
- **Logging_Behavior**: A MediatR pipeline behavior that logs request entry, exit, and performance metrics
- **Global_Exception_Handler**: Middleware that catches all unhandled exceptions and returns structured error responses
- **Correlation_ID_Middleware**: Middleware that assigns a unique identifier to each request for distributed tracing
- **Security_Headers_Middleware**: Middleware that adds protective HTTP headers to every response
- **API_Response_Envelope**: A standard wrapper object containing data, success flag, errors, and pagination metadata
- **Paged_List**: A generic collection type that includes items plus pagination metadata (total count, page, page size, total pages)
- **Soft_Delete**: A deletion strategy where records are marked with IsDeleted flag rather than physically removed from the database
- **JWT_Token**: A JSON Web Token used for stateless API authentication with a 60-minute expiry
- **Refresh_Token**: A long-lived token used to obtain new JWT tokens without re-authentication, subject to rotation on use

## Requirements

### Requirement 1: Solution Structure and Project Organization

**User Story:** As a developer, I want a .NET solution organized with Clean Architecture projects and correct dependency references, so that architectural boundaries are enforced at compile time.

#### Acceptance Criteria

1. THE Solution SHALL contain five projects targeting .NET 8: BuildEstate.Domain (classlib), BuildEstate.Application (classlib), BuildEstate.Infrastructure (classlib), BuildEstate.Shared (classlib), and BuildEstate.API (webapi)
2. THE Solution SHALL contain a test project BuildEstate.Tests using the xUnit framework, referencing the Domain, Application, Infrastructure, and API projects
3. THE Domain_Layer SHALL have zero project references and zero NuGet package dependencies
4. THE Application_Layer SHALL reference only the Domain_Layer project
5. THE Infrastructure_Layer SHALL reference the Domain_Layer and Application_Layer projects
6. THE API_Layer SHALL reference the Application_Layer, Infrastructure_Layer, and Shared projects
7. THE Shared_Layer SHALL have zero project references to Domain_Layer, Application_Layer, Infrastructure_Layer, or API_Layer
8. THE Solution SHALL compile with zero errors and zero warnings when running `dotnet build` immediately after all projects are created and references are configured
9. IF a developer adds a project reference from Domain_Layer to Application_Layer, Infrastructure_Layer, Shared, or API_Layer, THEN THE Solution SHALL fail to compile due to circular dependency detection

### Requirement 2: NuGet Package Installation

**User Story:** As a developer, I want all required NuGet packages installed with pinned versions, so that builds are reproducible and dependency vulnerabilities are manageable.

#### Acceptance Criteria

1. THE Application_Layer .csproj SHALL reference MediatR, FluentValidation, FluentValidation.DependencyInjectionExtensions, AutoMapper, and AutoMapper.Extensions.Microsoft.DependencyInjection as PackageReference entries
2. THE Infrastructure_Layer .csproj SHALL reference Microsoft.EntityFrameworkCore, Microsoft.EntityFrameworkCore.SqlServer, Microsoft.EntityFrameworkCore.Tools, and Microsoft.AspNetCore.Identity.EntityFrameworkCore as PackageReference entries
3. THE API_Layer .csproj SHALL reference Microsoft.AspNetCore.Authentication.JwtBearer, Swashbuckle.AspNetCore, and Microsoft.EntityFrameworkCore.Design as PackageReference entries
4. THE BuildEstate.Tests .csproj SHALL reference xunit, xunit.runner.visualstudio, Moq, FluentAssertions, and Microsoft.NET.Test.Sdk as PackageReference entries
5. THE Solution SHALL specify exact version pinning for all NuGet packages using the format Version="X.Y.Z" with no wildcard characters, floating ranges, or version range notation
6. WHEN all packages are installed, THE Solution SHALL restore and build successfully with zero package-related errors or version conflicts between layers

### Requirement 3: Base Entity and Audit Interface

**User Story:** As a developer, I want a base entity class with standard audit columns, so that all domain entities inherit consistent identification and audit tracking fields.

#### Acceptance Criteria

1. THE Base_Entity SHALL provide a Guid Id property initialized at property declaration with Guid.NewGuid() as the default value
2. THE Base_Entity SHALL provide CreatedAt (DateTime, UTC), CreatedBy (string, max 256 characters), UpdatedAt (DateTime nullable, UTC), UpdatedBy (string nullable, max 256 characters), IsDeleted (bool, default false), DeletedAt (DateTime nullable, UTC), DeletedBy (string nullable, max 256 characters), and RowVersion (byte array used for optimistic concurrency control) properties
3. THE Base_Entity SHALL implement the IAuditableEntity interface
4. THE Domain_Layer SHALL define an IAuditableEntity interface declaring CreatedAt (DateTime), CreatedBy (string), UpdatedAt (DateTime nullable), and UpdatedBy (string nullable) properties
5. WHEN a new entity class inherits from Base_Entity, THE entity SHALL expose all audit columns as public properties accessible without requiring the derived class to declare or configure them
6. THE Base_Entity SHALL reside in the Domain layer Common folder with zero external package dependencies
7. IF a derived entity is instantiated, THEN THE Base_Entity SHALL guarantee the Id property contains a unique non-empty Guid value before any other operation is performed on the entity

### Requirement 4: Repository and Unit of Work Interfaces

**User Story:** As a developer, I want generic repository and unit of work interfaces defined in the Domain Layer, so that data access contracts are decoupled from implementation details.

#### Acceptance Criteria

1. THE Domain_Layer SHALL define an IRepository generic interface with a single type parameter constrained to Base_Entity types
2. THE IRepository interface SHALL expose the following methods: GetByIdAsync (accepting a Guid identifier, returning a nullable entity), GetAllAsync (returning a list of entities), Query (returning IQueryable of the entity type), AddAsync (accepting an entity, returning Task), Update (accepting an entity, returning void), and Delete (accepting an entity, returning void)
3. THE IRepository interface SHALL accept a CancellationToken parameter with a default value on all async methods (GetByIdAsync, GetAllAsync, AddAsync)
4. THE Domain_Layer SHALL define an IUnitOfWork interface with a SaveChangesAsync method that accepts a CancellationToken parameter with a default value and returns the number of state entries written as an integer
5. THE IRepository and IUnitOfWork interfaces SHALL have zero dependencies on Entity Framework Core or any persistence technology, residing in a project with no external NuGet package references
6. IF GetByIdAsync is called with an identifier that has no matching entity, THEN THE IRepository SHALL return null rather than throwing an exception

### Requirement 5: Common Enumerations

**User Story:** As a developer, I want base enumerations used across multiple modules defined in the Domain Layer, so that status values and types are consistent throughout the platform.

#### Acceptance Criteria

1. THE Domain_Layer SHALL define an ApprovalStatus enumeration with values Pending (0), UnderReview (1), Approved (2), Rejected (3), and Escalated (4)
2. THE Domain_Layer SHALL define a Priority enumeration with values Low (0), Medium (1), High (2), and Critical (3)
3. THE Domain_Layer SHALL define a DocumentType enumeration with values TitleDeed (0), SearchReport (1), LegalDocument (2), EnvironmentalReport (3), PlanningDocument (4), Contract (5), Valuation (6), and Correspondence (7)
4. THE Domain_Layer SHALL define an OpportunityStatus enumeration with values Identified (0), InitialReview (1), DueDiligence (2), OfferMade (3), UnderContract (4), Acquired (5), and Withdrawn (6)
5. THE Domain_Layer SHALL map all enumeration values to explicit integer backing values starting from zero with each member assigned a unique integer
6. IF a new enumeration value is appended to an existing enumeration, THEN THE Domain_Layer SHALL assign the next sequential integer value without modifying existing member assignments

### Requirement 6: Domain Event Infrastructure

**User Story:** As a developer, I want a domain event infrastructure in the Domain Layer, so that entities can raise events that trigger side effects in a decoupled manner.

#### Acceptance Criteria

1. THE Domain_Layer SHALL define an IDomainEvent marker interface with no members
2. THE Domain_Layer SHALL define an IHasDomainEvents interface exposing a read-only collection of IDomainEvent instances
3. THE Base_Entity SHALL implement IHasDomainEvents, storing domain events in a private list and exposing them as a read-only collection
4. THE Base_Entity SHALL provide a protected method to add a domain event to the collection and a public method to clear all domain events from the collection
5. WHEN domain events are raised on an entity, THE events SHALL accumulate in the collection in insertion order until the clear method is called by the dispatching infrastructure

### Requirement 7: EF Core DbContext with Audit Interceptor

**User Story:** As a developer, I want an EF Core DbContext configured with an audit interceptor, so that all data mutations are automatically timestamped and attributed to the acting user.

#### Acceptance Criteria

1. THE Infrastructure_Layer SHALL define a BuildEstateDbContext that inherits from IdentityDbContext
2. THE BuildEstateDbContext SHALL apply entity configurations from the assembly using ApplyConfigurationsFromAssembly
3. WHEN an entity that inherits from BaseEntity has EntityState.Added, THE Audit_Interceptor SHALL set CreatedAt to the current UTC timestamp and CreatedBy to the current user identity
4. WHEN an entity that inherits from BaseEntity has EntityState.Modified, THE Audit_Interceptor SHALL set UpdatedAt to the current UTC timestamp and UpdatedBy to the current user identity without modifying CreatedAt or CreatedBy
5. WHEN an entity that inherits from BaseEntity has EntityState.Deleted, THE Audit_Interceptor SHALL change the EntityState to Modified, set IsDeleted to true, set DeletedAt to the current UTC timestamp, and set DeletedBy to the current user identity
6. THE Audit_Interceptor SHALL obtain the current user identity by reading the UserId property from ICurrentUserService
7. IF ICurrentUserService.UserId is null or empty, THEN THE Audit_Interceptor SHALL use the value "System" for all audit user fields (CreatedBy, UpdatedBy, or DeletedBy)
8. THE Audit_Interceptor SHALL execute its logic within the SavingChangesAsync override, ensuring audit fields are populated before changes are persisted to the database

### Requirement 8: ASP.NET Identity Configuration

**User Story:** As a developer, I want ASP.NET Identity configured with custom user and role entities, so that the platform has enterprise-grade user management from day one.

#### Acceptance Criteria

1. THE Infrastructure_Layer SHALL define an ApplicationUser class extending IdentityUser with additional properties FirstName (string, max 128 characters), LastName (string, max 128 characters), and IsActive (bool, default true)
2. THE Infrastructure_Layer SHALL define an ApplicationRole class extending IdentityRole with an additional Description (string, max 256 characters) property
3. THE Identity configuration SHALL require passwords of minimum 8 characters and maximum 128 characters with at least one uppercase letter, one lowercase letter, one digit, and one special character
4. IF a user submits 5 consecutive failed login attempts, THEN THE Identity configuration SHALL lock out the account for 15 minutes before automatically unlocking
5. WHEN the application starts in Development environment, THE system SHALL seed the following roles: SuperAdmin, AcquisitionManager, LegalOfficer, PlanningManager, ProjectManager, SiteManager, SalesManager, CompletionManager, PropertyManager, FinanceDirector, ValuationAnalyst, Surveyor, Admin
6. WHEN the application starts in Development environment, THE system SHALL seed a default admin user (email: admin@buildestate.co.uk, password: Admin@123456) with the SuperAdmin role, and the seeding operation SHALL be idempotent so that re-running it does not create duplicate users or roles

### Requirement 9: Base Entity Configurations and Database Standards

**User Story:** As a developer, I want base entity configurations applying database standards consistently, so that all tables follow the same indexing, soft-delete filtering, and column precision rules.

#### Acceptance Criteria

1. THE Infrastructure_Layer SHALL define a base entity configuration class that applies a global query filter excluding soft-deleted records (IsDeleted equals false)
2. THE base entity configuration SHALL configure the Id column as the primary key
3. THE base entity configuration SHALL configure the RowVersion property as a concurrency token
4. THE base entity configuration SHALL configure decimal properties with precision 18 and scale 2
5. THE Infrastructure_Layer SHALL index the CreatedAt column on all entities for chronological query performance
6. WHEN a new entity configuration is created, THE configuration SHALL inherit from the base configuration to receive standard rules automatically

### Requirement 10: Database Migrations Infrastructure

**User Story:** As a developer, I want database migrations infrastructure configured, so that schema changes can be applied incrementally and reversibly to SQL Server.

#### Acceptance Criteria

1. THE Infrastructure_Layer SHALL configure EF Core with the MigrationsAssembly option set to the Infrastructure project assembly so that migrations are generated and stored in the Infrastructure project
2. THE Solution SHALL support creating and applying migrations from the command line using `dotnet ef migrations add` and `dotnet ef database update` with `--project src/BuildEstate.Infrastructure` and `--startup-project src/BuildEstate.API` parameters
3. THE connection string SHALL be read from application configuration (appsettings.json) under the key "DefaultConnection" within the "ConnectionStrings" section
4. IF the "DefaultConnection" connection string is missing, empty, or whitespace in configuration, THEN THE application SHALL fail to start and produce an error message that identifies "DefaultConnection" as the missing or invalid configuration key
5. WHEN a migration is generated, THE migration SHALL include both an `Up` method and a `Down` method so that each migration can be reversed using `dotnet ef database update` to a previous migration

### Requirement 11: Generic Repository Implementation

**User Story:** As a developer, I want a generic repository implementation, so that standard CRUD operations are available for all entities without repetitive boilerplate.

#### Acceptance Criteria

1. THE Infrastructure_Layer SHALL implement the IRepository<T> generic interface using EF Core DbSet operations, constrained to entities inheriting from BaseEntity
2. THE Generic_Repository GetByIdAsync method SHALL accept a Guid id and a CancellationToken, query by the entity Id property, and return the entity or null if no matching non-deleted entity exists
3. THE Generic_Repository Query method SHALL return an IQueryable<T> that respects the global soft-delete query filter, enabling callers to compose additional filtering, sorting, and projection
4. THE Generic_Repository AddAsync method SHALL accept an entity and a CancellationToken, and invoke DbSet.AddAsync to track the entity for insertion on the next SaveChanges call
5. THE Generic_Repository Update method SHALL invoke DbSet.Update to mark the entity as modified for persistence on the next SaveChanges call
6. THE Generic_Repository Delete method SHALL invoke DbSet.Remove, which the Audit_Interceptor intercepts to convert into a soft deletion by setting IsDeleted to true, DeletedAt to the current UTC timestamp, and DeletedBy to the current user identifier
7. THE Generic_Repository SHALL be registered in the DI container with scoped lifetime using open generic registration mapping IRepository<> to Repository<>
8. WHEN any async repository method is invoked, THE Generic_Repository SHALL propagate the provided CancellationToken to all underlying EF Core operations

### Requirement 12: Audit Logging

**User Story:** As a developer, I want comprehensive audit logging that captures who changed what and when with old and new values, so that the platform meets compliance requirements.

#### Acceptance Criteria

1. THE Infrastructure_Layer SHALL define an AuditLog entity with Id (Guid), UserId (string), UserName (string), Action (string: "Create", "Update", or "Delete"), EntityName (string, max 256 characters), EntityId (string, max 256 characters), OldValues (JSON string, max 4000 characters), NewValues (JSON string, max 4000 characters), AffectedColumns (string, max 2000 characters), Timestamp (DateTime in UTC), IpAddress (string, max 45 characters), and CorrelationId (string, max 128 characters) fields
2. THE BuildEstateDbContext SHALL include a DbSet for AuditLog entities
3. WHEN an entity is created, THE system SHALL write an AuditLog record with Action set to "Create", NewValues containing the JSON-serialized entity state, and OldValues set to null
4. WHEN an entity is updated, THE system SHALL write an AuditLog record with Action set to "Update", OldValues containing the JSON-serialized previous state of modified properties only, NewValues containing the JSON-serialized new state of modified properties only, and AffectedColumns containing a comma-separated list of changed property names
5. WHEN an entity is soft-deleted, THE system SHALL write an AuditLog record with Action set to "Delete", OldValues containing the JSON-serialized entity state prior to deletion, and NewValues set to null
6. THE AuditLog table SHALL be append-only with no update or delete operations permitted at the application level, and IF an attempt to modify or remove an existing AuditLog record is made at the application level, THEN THE system SHALL reject the operation
7. IF the AuditLog record cannot be persisted due to a storage failure, THEN THE system SHALL fail the originating save operation and not persist the entity change, ensuring no data mutation occurs without a corresponding audit record
8. WHEN an AuditLog record is written, THE system SHALL populate the Timestamp field with the current UTC time, the IpAddress from the originating HTTP request context, and the CorrelationId from the current request correlation header

### Requirement 13: MediatR Pipeline with Behaviors

**User Story:** As a developer, I want MediatR configured with pipeline behaviors, so that cross-cutting concerns like validation and logging are applied automatically to every command and query.

#### Acceptance Criteria

1. THE Application_Layer SHALL register MediatR using assembly scanning of the Application_Layer assembly to discover all IRequestHandler implementations automatically
2. THE Application_Layer SHALL register FluentValidation validators using assembly scanning of the Application_Layer assembly to discover all AbstractValidator implementations
3. THE Application_Layer SHALL register a Validation_Behavior as a MediatR IPipelineBehavior that executes all registered IValidator instances for the incoming request type before invoking the next delegate, and IF one or more validation failures exist, THEN THE Validation_Behavior SHALL throw a ValidationException containing the list of failures without invoking the handler
4. THE Application_Layer SHALL register a Logging_Behavior as a MediatR IPipelineBehavior that logs the request type name and a unique request identifier at Information level before handler execution, and logs the request type name, unique request identifier, and elapsed time in milliseconds at Information level after handler execution completes
5. THE Application_Layer SHALL register AutoMapper profiles using assembly scanning of the Application_Layer assembly to discover all Profile implementations
6. THE Application_Layer SHALL expose a single public static AddApplication extension method on IServiceCollection that performs all registrations defined in criteria 1 through 5 and returns the IServiceCollection instance for method chaining
7. THE Application_Layer SHALL register the Validation_Behavior before the Logging_Behavior in the MediatR pipeline so that invalid requests are rejected before logging of handler execution occurs

### Requirement 14: Validation Pipeline Behavior

**User Story:** As a developer, I want a validation pipeline behavior that auto-validates every command, so that invalid requests are rejected before reaching business logic.

#### Acceptance Criteria

1. WHEN a request with registered validators enters the pipeline, THE Validation_Behavior SHALL execute all validators for that request type
2. IF any validation rule fails, THEN THE Validation_Behavior SHALL throw a ValidationException containing all failure details
3. IF no validators are registered for a request type, THEN THE Validation_Behavior SHALL pass the request through to the next behavior without throwing
4. THE Validation_Behavior SHALL execute validators asynchronously using ValidateAsync to support async validation rules
5. THE ValidationException SHALL contain property names and error messages for each failure as a structured collection

### Requirement 15: Logging Pipeline Behavior

**User Story:** As a developer, I want a logging pipeline behavior that records request processing details, so that I can trace performance issues and understand system behavior in production.

#### Acceptance Criteria

1. WHEN a request enters the pipeline, THE Logging_Behavior SHALL log the request type name and a timestamp at Information level using structured logging
2. WHEN a request completes successfully, THE Logging_Behavior SHALL log the elapsed processing time in milliseconds at Information level
3. IF a request takes longer than 500 milliseconds, THEN THE Logging_Behavior SHALL log an additional Warning-level entry indicating a long-running request, including the request type name and elapsed time in milliseconds
4. IF a request throws an exception during processing, THEN THE Logging_Behavior SHALL log an Error-level entry including the request type name and elapsed time in milliseconds, and re-throw the exception without modification
5. THE Logging_Behavior SHALL include the correlation ID as a structured property in every log entry emitted by the behavior
6. THE Logging_Behavior SHALL use structured logging with named properties for request type, elapsed time, and the current user ID obtained from ICurrentUserService

### Requirement 16: Standard Response Envelope

**User Story:** As a developer, I want a standard API response envelope, so that all endpoints return data in a consistent structure that frontend consumers can rely on.

#### Acceptance Criteria

1. THE Shared project SHALL define a generic ApiResponse<T> type with Data (generic, default to null), Success (bool), and Errors (list of strings) properties
2. THE Shared project SHALL define a PagedResult<T> generic type with Items (list), TotalCount (minimum 0), Page (minimum 1), PageSize (minimum 1, maximum 100), and TotalPages (calculated) properties
3. THE API_Response_Envelope SHALL provide a static success factory method that sets Success to true, populates Data with the provided value, and sets Errors to an empty list, and a static failure factory method that sets Success to false, sets Data to default, and populates Errors with the provided list of error descriptions
4. WHEN TotalPages is calculated, THE Paged_List SHALL compute the ceiling of TotalCount divided by PageSize
5. THE API_Response_Envelope SHALL serialize all properties using camelCase property naming
6. IF PageSize is less than 1 or Page is less than 1, THEN THE PagedResult SHALL reject construction with a validation error indicating the invalid parameter

### Requirement 17: Program.cs and DI Container Setup

**User Story:** As a developer, I want Program.cs configured with the full DI container wiring all layers together, so that the application starts with all services properly registered and middleware in correct order.

#### Acceptance Criteria

1. THE API_Layer Program.cs SHALL call AddApplication (registering MediatR, FluentValidation, and AutoMapper) and AddInfrastructure (registering DbContext, Identity, and repository implementations) extension methods to register all layer services
2. THE API_Layer SHALL register ICurrentUserService with scoped lifetime, implemented by CurrentUserService that extracts user identity from the current HttpContext
3. THE API_Layer SHALL register HttpContextAccessor via AddHttpContextAccessor for accessing HTTP context in services
4. THE middleware pipeline SHALL execute in the order: CorrelationId, SecurityHeaders, ExceptionHandler, HTTPS redirection, CORS, Authentication, Authorization, Rate Limiting, Controllers, Health Checks
5. THE application SHALL map an unauthenticated health check endpoint at the path "/health" that returns HTTP 200 with a healthy status when the application is running and responsive
6. IF the application fails to start due to a missing or misconfigured service registration, THEN THE API_Layer SHALL terminate startup and log an error message indicating the misconfigured service
7. THE API_Layer SHALL configure CORS with a named policy that restricts allowed origins to explicitly configured frontend domain values from application settings

### Requirement 18: Swagger and OpenAPI Configuration

**User Story:** As a developer, I want Swagger/OpenAPI documentation configured, so that API consumers can discover and test endpoints through an interactive interface.

#### Acceptance Criteria

1. THE API_Layer SHALL configure Swagger with API title "BuildEstate Pro API" and version "v1"
2. THE Swagger configuration SHALL include a JWT Bearer security definition allowing users to enter a token and have it sent in the Authorization header for all requests
3. THE Swagger UI SHALL be available only in Development environment and SHALL NOT be accessible in Production environment
4. THE API_Layer SHALL configure controllers to serialize enums as strings in JSON responses using a JsonStringEnumConverter
5. THE API_Layer SHALL use System.Text.Json with camelCase property naming policy for JSON serialization

### Requirement 19: Global Exception Handling Middleware

**User Story:** As a developer, I want global exception handling middleware, so that all unhandled exceptions produce structured error responses without exposing internal details to clients.

#### Acceptance Criteria

1. WHEN a ValidationException is thrown, THE Global_Exception_Handler SHALL return HTTP 400 with Success set to false and Errors populated with one entry per validation failure containing the property name and error message
2. WHEN a NotFoundException is thrown, THE Global_Exception_Handler SHALL return HTTP 404 with Success set to false and Errors containing the exception message
3. WHEN a ConflictException is thrown, THE Global_Exception_Handler SHALL return HTTP 409 with Success set to false and Errors containing the exception message
4. WHEN a ForbiddenException is thrown, THE Global_Exception_Handler SHALL return HTTP 403 with Success set to false and Errors containing the exception message
5. WHEN an unhandled exception occurs, THE Global_Exception_Handler SHALL return HTTP 500 with Success set to false and Errors containing a fixed non-specific error message without exposing stack traces, exception type, or implementation details
6. WHEN any exception is caught, THE Global_Exception_Handler SHALL log the full exception at Error level including the correlation ID, request path, and request HTTP method
7. THE Global_Exception_Handler SHALL set the response Content-Type to application/json and serialize the error response using the standard ApiResponse envelope structure
8. THE Shared project SHALL define NotFoundException, ConflictException, and ForbiddenException custom exception types that accept a message string parameter

### Requirement 20: Correlation ID Middleware

**User Story:** As a developer, I want correlation ID middleware, so that every request can be traced end-to-end through logs across all layers.

#### Acceptance Criteria

1. WHEN an incoming request contains an X-Correlation-ID header with a non-empty value, THE Correlation_ID_Middleware SHALL use that header value as the correlation ID for the request
2. IF the X-Correlation-ID header is absent, empty, or contains only whitespace, THEN THE Correlation_ID_Middleware SHALL generate a new GUID (formatted as a lowercase string without braces) as the correlation ID
3. THE Correlation_ID_Middleware SHALL add the correlation ID to the response headers as X-Correlation-ID
4. THE Correlation_ID_Middleware SHALL add the correlation ID to the logging scope using the property name "CorrelationId" so that all log entries emitted during the request include the correlation ID
5. THE Correlation_ID_Middleware SHALL store the correlation ID in HttpContext.Items with the key "CorrelationId" for access by downstream components
6. IF the incoming X-Correlation-ID header value is not a valid GUID format, THEN THE Correlation_ID_Middleware SHALL generate a new GUID as the correlation ID instead of using the invalid value

### Requirement 21: JWT Authentication Configuration

**User Story:** As a developer, I want JWT Bearer authentication configured, so that the API validates tokens on every request and extracts user identity claims.

#### Acceptance Criteria

1. THE API_Layer SHALL validate every incoming request's JWT Bearer token against the configured issuer, audience, lifetime, and signing key before granting access to protected endpoints
2. THE JWT configuration SHALL read issuer, audience, and secret key from application configuration
3. IF any required JWT configuration value (issuer, audience, or secret key) is missing or empty at application startup, THEN THE API_Layer SHALL fail to start and log an error message indicating the missing configuration
4. THE Infrastructure_Layer SHALL implement a token generation service that creates JWT tokens containing user ID, email, name, and role as claims, with a default expiry of 60 minutes
5. THE Infrastructure_Layer SHALL implement refresh token rotation where each refresh token is single-use, has an expiry of 7 days, and generates a new access token and new refresh token upon use
6. IF a previously consumed refresh token is presented, THEN THE Infrastructure_Layer SHALL revoke all active refresh tokens for that user and return an error indicating session invalidation
7. IF a JWT token is expired, malformed, has an invalid signature, or fails issuer or audience validation, THEN THE API_Layer SHALL return HTTP 401 Unauthorized
8. WHEN a user changes their password or their role is modified, THEN THE Infrastructure_Layer SHALL invalidate all existing refresh tokens for that user

### Requirement 22: CORS Configuration

**User Story:** As a developer, I want CORS configured to allow the Angular frontend origin, so that the single-page application can communicate with the API.

#### Acceptance Criteria

1. THE API_Layer SHALL configure a named CORS policy called "AllowFrontend"
2. THE CORS policy SHALL allow origins read from the application configuration key "Cors:AllowedOrigins" as a comma-separated list of URLs
3. THE CORS policy SHALL allow all standard HTTP methods (GET, POST, PUT, PATCH, DELETE, OPTIONS)
4. THE CORS policy SHALL allow the following request headers: Authorization, Content-Type, and X-Correlation-ID
5. THE CORS policy SHALL expose the X-Correlation-ID response header to the frontend
6. THE CORS policy SHALL allow credentials so that the browser includes Authorization headers in cross-origin requests
7. IF the "Cors:AllowedOrigins" configuration key is missing or empty, THEN THE API_Layer SHALL fail to start with a descriptive error message indicating that allowed CORS origins must be configured

### Requirement 23: Security Headers Middleware

**User Story:** As a developer, I want security headers middleware, so that every response includes protective headers reducing attack surface.

#### Acceptance Criteria

1. THE Security_Headers_Middleware SHALL add X-Content-Type-Options header with value "nosniff" to every HTTP response
2. THE Security_Headers_Middleware SHALL add X-Frame-Options header with value "DENY" to every HTTP response
3. THE Security_Headers_Middleware SHALL add X-XSS-Protection header with value "1; mode=block" to every HTTP response
4. THE Security_Headers_Middleware SHALL add Referrer-Policy header with value "strict-origin-when-cross-origin" to every HTTP response
5. THE Security_Headers_Middleware SHALL add Strict-Transport-Security header with value "max-age=31536000; includeSubDomains" to every HTTP response
6. THE Security_Headers_Middleware SHALL add Content-Security-Policy header with value "default-src 'self'" to every HTTP response
7. THE Security_Headers_Middleware SHALL apply all security headers to every HTTP response regardless of response status code, including 4xx and 5xx error responses
8. THE Security_Headers_Middleware SHALL not overwrite a security header if it has already been set by another component in the response pipeline

### Requirement 24: Base Controller

**User Story:** As a developer, I want a base controller class with common helpers, so that all API controllers inherit consistent behavior and reduce boilerplate.

#### Acceptance Criteria

1. THE API_Layer SHALL define an abstract BaseApiController class decorated with [ApiController] and [Route("api/v1/[controller]")] attributes
2. THE BaseApiController SHALL inject IMediator via constructor injection and expose it as a protected property named Mediator for derived controllers
3. THE BaseApiController SHALL use the route template "api/v1/[controller]" to version all endpoints from day one
4. THE BaseApiController SHALL be decorated with the [Authorize] attribute making authentication required by default on all endpoints of derived controllers
5. WHEN a derived controller needs to allow anonymous access, THE controller SHALL apply the [AllowAnonymous] attribute on the specific action method to override the class-level [Authorize] attribute

## Correctness Properties

### Property 1: Architectural Boundary Enforcement
THE Domain_Layer SHALL never have compile-time dependencies on Application_Layer, Infrastructure_Layer, or API_Layer, ensuring the dependency rule is never violated.

### Property 2: Audit Completeness
FOR ALL entity state changes (create, update, delete), THERE EXISTS a corresponding AuditLog record capturing the mutation details, and no entity mutation can persist without its audit record.

### Property 3: Soft Delete Invariant
FOR ALL entities inheriting from Base_Entity, a delete operation SHALL never physically remove the row from the database, and all queries SHALL exclude soft-deleted records by default.

### Property 4: Authentication Enforcement
FOR ALL API endpoints (except those explicitly decorated with AllowAnonymous), an unauthenticated request SHALL receive HTTP 401 Unauthorized.

### Property 5: Validation Before Execution
FOR ALL commands with registered validators, THE system SHALL execute validation before the handler, ensuring invalid state never enters the domain layer.
