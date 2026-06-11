# BuildEstate Pro — Backend Standards

## Controller Rules (The Law)

Controllers MUST be thin. A controller ONLY:
1. Receives the HTTP request
2. Dispatches a command/query via MediatR
3. Returns an appropriate HTTP response

Controllers NEVER:
- Contain business logic
- Call repositories directly
- Perform validation
- Catch exceptions
- Construct domain entities
- Perform data transformations

### Correct Controller Pattern
```csharp
[Authorize(Roles = "AcquisitionManager,SuperAdmin")]
[HttpPost]
public async Task<IActionResult> Create(
    [FromBody] CreateOpportunityCommand command,
    CancellationToken cancellationToken)
{
    var result = await _mediator.Send(command, cancellationToken);
    return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
}
```

---

## CQRS Standards

### Commands (Write Operations)
- Represent intent to change state
- Must NOT return domain entities (return DTOs or IDs)
- One handler per command
- Full validation via FluentValidation before handler executes
- Always log audit trail

### Queries (Read Operations)
- Represent intent to read state
- Must NEVER mutate state
- Use `.AsNoTracking()` for performance
- Use projections (select only needed columns)
- Support pagination on all list queries

### Handler Rules
- Single Responsibility — one handler does one thing
- Maximum ~50 lines of logic (extract helpers if needed)
- Always accept CancellationToken
- Never catch exceptions (let global handler manage them)

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
            └── OpportunityDetailDto.cs
```

---

## Async Rules

- **Async all the way** — no `.Result`, no `.Wait()`, no `Task.Run()` for IO
- **CancellationToken on every async method** — pass it down to EF Core, HTTP clients, file operations
- **Never swallow cancellation** — let it propagate

```csharp
// CORRECT
public async Task<OpportunityDto> Handle(
    GetOpportunityByIdQuery request,
    CancellationToken cancellationToken)
{
    var entity = await _context.LandOpportunities
        .AsNoTracking()
        .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
    // ...
}
```

---

## Validation Standards

- Validate every command using FluentValidation
- MediatR pipeline behavior runs validators automatically
- Return 400 Bad Request with structured error list
- Validate at boundaries (API layer), trust within domain
- Business rule validation inside handlers (after basic validation passes)

### Validator Pattern
```csharp
public class CreateOpportunityCommandValidator : AbstractValidator<CreateOpportunityCommand>
{
    public CreateOpportunityCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Opportunity name is required")
            .MaximumLength(200).WithMessage("Name cannot exceed 200 characters");

        RuleFor(x => x.AskingPrice)
            .GreaterThan(0).WithMessage("Asking price must be positive");

        RuleFor(x => x.LandSize)
            .GreaterThan(0).WithMessage("Land size must be positive");
    }
}
```

---

## API Contract Standards

### URL Pattern
```
/api/v1/{resource}          — Collection (GET list, POST create)
/api/v1/{resource}/{id}     — Single item (GET detail, PUT update, DELETE)
/api/v1/{resource}/{id}/status — Status change (PATCH)
/api/v1/{resource}/{id}/{sub-resource} — Nested (GET, POST)
```

### Response Envelope
Every response follows this structure:
```json
{
    "success": true,
    "data": { ... },
    "errors": [],
    "pagination": {
        "page": 1,
        "pageSize": 20,
        "totalCount": 156,
        "totalPages": 8
    }
}
```

### HTTP Status Codes
| Code | Meaning | When |
|------|---------|------|
| 200 | OK | GET success, PUT success |
| 201 | Created | POST success |
| 204 | No Content | DELETE success |
| 400 | Bad Request | Validation failure |
| 401 | Unauthorized | No/invalid token |
| 403 | Forbidden | Insufficient role/permission |
| 404 | Not Found | Entity doesn't exist |
| 409 | Conflict | Business rule violation (duplicate, invalid state) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected failure |

---

## DTO Rules

- Domain entities NEVER cross API boundaries
- Separate DTOs for: Create, Update, List, Detail responses
- DTOs are immutable where possible (use C# records)
- Map with AutoMapper profiles (explicit, never auto-convention)
- Frontend-friendly property names (camelCase in JSON)

```csharp
// List item DTO (minimal fields for table display)
public record OpportunityListItemDto(
    Guid Id,
    string Name,
    string Location,
    decimal AskingPrice,
    string Status,
    DateTime CreatedAt
);

// Detail DTO (all fields for detail view)
public record OpportunityDetailDto(
    Guid Id,
    string Name,
    string Location,
    decimal LandSize,
    decimal AskingPrice,
    string Status,
    string Source,
    string AgentName,
    DateTime CreatedAt,
    string CreatedBy
);
```

---

## Dependency Injection Rules

| Lifetime | Use For | Example |
|----------|---------|---------|
| Scoped | Request-bound services | Repositories, UnitOfWork, DbContext |
| Singleton | Configuration, caches | Settings, IMemoryCache |
| Transient | Lightweight stateless | Validators, small helpers |

**Never** resolve from `IServiceProvider` directly (Service Locator anti-pattern).
**Always** inject via constructor.

---

## Structured Logging

```csharp
// CORRECT — structured properties
_logger.LogInformation(
    "Opportunity {OpportunityId} status changed from {OldStatus} to {NewStatus} by {UserId}",
    entity.Id, oldStatus, newStatus, currentUser.Id);

// WRONG — string interpolation
_logger.LogInformation($"Opportunity {entity.Id} changed to {newStatus}");
```

### Log Levels
| Level | When | Example |
|-------|------|---------|
| Information | Business events | "Opportunity created", "Status changed" |
| Warning | Recoverable issues | "Retry needed", "Fallback used" |
| Error | Failures needing attention | "API call failed", "Unexpected exception" |
| Critical | System-level failures | "Database unavailable", "Auth service down" |

---

## Exception Handling

- Global exception handler middleware catches ALL unhandled exceptions
- Never use exceptions for flow control
- Domain exceptions for business rule violations
- Never expose internal details to clients (generic messages only)
- Always log full exception details server-side

```csharp
// Custom domain exception
public class BusinessRuleException : Exception
{
    public BusinessRuleException(string message) : base(message) { }
}

// In handler:
if (existingOffer != null && existingOffer.Status == OfferStatus.Active)
    throw new ConflictException("Only one active offer per opportunity is allowed");
```

---

## Pagination Pattern

Every list endpoint MUST support pagination:

```csharp
public class GetOpportunitiesQuery : IRequest<PagedResult<OpportunityListItemDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? Status { get; set; }
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; }
}
```
