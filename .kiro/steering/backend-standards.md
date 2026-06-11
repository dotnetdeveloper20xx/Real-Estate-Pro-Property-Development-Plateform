# BuildEstate Pro — Backend Standards (Enterprise Grade)

## Technology
- ASP.NET Core (latest stable)
- C# (latest language features)
- Entity Framework Core (Code-First)
- SQL Server (production database)
- MediatR (CQRS dispatcher)
- FluentValidation (command/query validation)
- AutoMapper (DTO mapping — use explicit profiles only)

## Async Requirements
- Async all the way — no `.Result`, no `.Wait()`, no `Task.Run()` for IO
- CancellationToken on every async method signature
- Pass CancellationToken down to EF Core, HTTP clients, file operations
- Never swallow cancellation — let it propagate

## Controller Standards
Controllers must be **thin**. A controller must ONLY:
1. Receive the HTTP request
2. Dispatch a command or query via MediatR
3. Return an appropriate HTTP response

Controllers must NEVER:
- Contain business logic
- Call repositories directly
- Perform validation (validators handle this)
- Catch exceptions (global middleware handles this)
- Construct domain entities
- Perform data transformations

```csharp
// CORRECT
[HttpPost]
public async Task<IActionResult> Create(
    [FromBody] CreateOpportunityCommand command,
    CancellationToken cancellationToken)
{
    var result = await _mediator.Send(command, cancellationToken);
    return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
}

// WRONG — business logic in controller
[HttpPost]
public async Task<IActionResult> Create([FromBody] CreateDto dto)
{
    var entity = new LandOpportunity { Name = dto.Name }; // NO
    _context.Add(entity); // NO
    await _context.SaveChangesAsync(); // NO
    return Ok(entity); // NO — exposing domain entity
}
```

## CQRS Standards
Every major feature must contain:
- **Commands** — Represent intent to change state
- **Queries** — Represent intent to read state
- **Handlers** — Execute the command/query logic
- **Validators** — Validate the command/query before handling
- **DTOs** — Data transfer objects for API boundaries

Rules:
- Commands must NOT return domain entities (return DTOs or IDs)
- Queries must NEVER mutate state
- Handlers must remain focused (Single Responsibility)
- One handler per command/query — no mega-handlers
- Validators run before handlers via pipeline behavior

### Feature Folder Structure
```
Features/
└── LandAcquisition/
    └── Opportunities/
        ├── Commands/
        │   ├── CreateOpportunity/
        │   │   ├── CreateOpportunityCommand.cs
        │   │   ├── CreateOpportunityCommandHandler.cs
        │   │   └── CreateOpportunityCommandValidator.cs
        │   └── UpdateOpportunity/
        │       ├── UpdateOpportunityCommand.cs
        │       ├── UpdateOpportunityCommandHandler.cs
        │       └── UpdateOpportunityCommandValidator.cs
        ├── Queries/
        │   ├── GetOpportunityById/
        │   │   ├── GetOpportunityByIdQuery.cs
        │   │   └── GetOpportunityByIdQueryHandler.cs
        │   └── GetOpportunities/
        │       ├── GetOpportunitiesQuery.cs
        │       └── GetOpportunitiesQueryHandler.cs
        └── DTOs/
            ├── OpportunityDto.cs
            ├── OpportunityDetailDto.cs
            └── OpportunityListItemDto.cs
```

## Exception Handling
- Global exception handler middleware (already implemented)
- Never use exceptions for flow control
- Domain exceptions for business rule violations
- Let infrastructure exceptions bubble up to middleware
- Always log with correlation ID and context

## Structured Logging
- Use ILogger<T> — never Console.WriteLine
- Include correlation IDs on every request
- Log at appropriate levels: Information for business events, Warning for recoverable issues, Error for failures
- Structured log properties (not string interpolation in message templates)

```csharp
_logger.LogInformation(
    "Opportunity {OpportunityId} created by {UserId} at {Timestamp}",
    entity.Id, currentUser.Id, DateTime.UtcNow);
```

## Validation Standards
- Validate every command using FluentValidation
- MediatR pipeline behavior runs validators automatically
- Return 400 Bad Request with structured error list
- Validate at boundaries (API layer), trust within domain
- Business rule validation inside domain/handlers

## API Contract Standards
- Version-ready: `/api/v1/opportunities`
- Use plural resource names
- Return consistent response envelope: `{ data, success, errors, pagination }`
- Proper HTTP status codes: 200, 201, 204, 400, 401, 403, 404, 409, 500
- Never expose internal IDs or implementation details in error messages
- Pagination on all list endpoints
- Support filtering, sorting, searching

## Strong DTO Boundaries
- Domain entities never cross API boundaries
- Separate DTOs for: Create, Update, List, Detail responses
- Map with AutoMapper profiles (explicit, never auto-convention)
- DTOs are immutable where possible (use records)

## Dependency Injection
- Register by interface, resolve by interface
- Scoped lifetime for request-bound services (repositories, UoW)
- Singleton for configuration, caches
- Transient for lightweight stateless services
- Never resolve from IServiceProvider directly (Service Locator anti-pattern)
