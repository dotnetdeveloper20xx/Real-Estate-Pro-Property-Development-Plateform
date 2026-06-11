# Phase 3: Architecture Foundations

## Why Architecture Matters

Bad architecture = code that works today but becomes unmaintainable in 6 months. Good architecture = code that multiple teams can work on for years without stepping on each other's toes.

This platform is expected to survive 5-15 years of continued development. Architecture isn't optional — it's the foundation everything else rests on.

---

## Clean Architecture (The Big Picture)

We use **Clean Architecture** — a design approach where code is organized in concentric layers, with strict rules about which layer can depend on which.

```
┌────────────────────────────────────────────────────────┐
│                 API LAYER (outermost)                    │
│  Controllers, Middleware, Program.cs, Swagger           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │           APPLICATION LAYER                       │  │
│  │  Commands, Queries, Handlers, Validators, DTOs    │  │
│  │                                                   │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │           DOMAIN LAYER (innermost)          │  │  │
│  │  │  Entities, Enums, Interfaces, Rules         │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │                                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │        INFRASTRUCTURE LAYER (side layer)          │  │
│  │  EF Core, SQL Server, Identity, File Storage      │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### The Dependency Rule

**Dependencies ONLY point inward.** Never outward.

- ✅ API can reference Application
- ✅ Application can reference Domain
- ✅ Infrastructure can reference Domain (implements its interfaces)
- ❌ Domain NEVER references Application, Infrastructure, or API
- ❌ Application NEVER references Infrastructure directly

### Why This Matters

If you want to swap SQL Server for PostgreSQL, you only change the Infrastructure layer. The Domain and Application layers don't even know (or care) what database is used. That's the power of proper architecture.

---

## The Four Layers Explained

### Layer 1: Domain (The Heart)

**What it contains:**
- Entity classes (LandOpportunity, Project, Contract, etc.)
- Enums (OpportunityStatus, ContractType, etc.)
- Interfaces (IRepository, IUnitOfWork)
- Value objects (Address, Money, DateRange)
- Domain rules (business logic that's always true)

**What it does NOT contain:**
- Database references (no EF Core, no SQL)
- HTTP references (no controllers, no requests)
- Framework references (no ASP.NET, no Angular)
- External library references (as few as possible)

**Why:** The domain is your business logic in pure code. It should read like a description of the business, not like a technology demo.

### Layer 2: Application (The Use Cases)

**What it contains:**
- Commands (CreateOpportunityCommand, UpdateProjectCommand)
- Queries (GetOpportunitiesQuery, GetProjectByIdQuery)
- Command/Query Handlers (the logic that processes each command/query)
- Validators (FluentValidation rules for commands)
- DTOs (Data Transfer Objects — what goes in/out of the API)
- Mapping profiles (how to convert Entity → DTO)
- Interface definitions for external services

**Why:** This layer defines what the application CAN DO. Each command/query represents one action a user can take.

### Layer 3: Infrastructure (The Plumbing)

**What it contains:**
- EF Core DbContext and entity configurations
- Repository implementations
- Identity setup (ASP.NET Identity for users/roles)
- External service integrations (email, file storage, APIs)
- Database migrations
- Seed data

**Why:** This layer handles all the "how" — how data is stored, how emails are sent, how files are saved. It implements the interfaces defined in Domain/Application.

### Layer 4: API (The Front Door)

**What it contains:**
- Controllers (thin — receive request, send to MediatR, return response)
- Middleware (exception handling, correlation IDs, security headers)
- Authentication/Authorization configuration
- Swagger/OpenAPI documentation
- Program.cs (app startup and DI container setup)

**Why:** This layer is the entry point. It handles HTTP concerns and delegates all business logic to the Application layer.

---

## CQRS Pattern (Command Query Responsibility Segregation)

### The Concept

Every operation your software performs is either:
- **A Command** — Changes state (create, update, delete)
- **A Query** — Reads state (list, get by ID, search)

We separate these completely. Different code paths for writes vs reads.

### Why Separate?

| Concern | Commands | Queries |
|---------|----------|---------|
| Validation | Full validation before execution | Minimal (just auth) |
| Audit | Every command logged | Not logged (read-only) |
| Complexity | Business rules, state transitions | Simple data retrieval |
| Performance | Can be slower (validation overhead) | Must be fast (no overhead) |
| Return value | ID or success/failure | Data (DTOs) |

### How It Works (Command Flow)

```
HTTP POST → Controller → MediatR.Send(command)
    → ValidationBehavior (validates command)
    → CommandHandler (executes business logic)
    → Repository.SaveAsync (persists changes)
    → AuditInterceptor (logs the change automatically)
    → Return result
```

### How It Works (Query Flow)

```
HTTP GET → Controller → MediatR.Send(query)
    → QueryHandler (reads data)
    → DbContext.AsNoTracking() (fast, no change tracking)
    → Project to DTO (only select needed columns)
    → Return result
```

---

## MediatR (The Dispatcher)

MediatR is a library that routes commands/queries to their handlers. It's the glue between controllers and business logic.

**Without MediatR:**
```csharp
// BAD — Controller has business logic
[HttpPost]
public async Task<IActionResult> Create(CreateDto dto)
{
    var entity = new LandOpportunity { Name = dto.Name };
    _context.Add(entity);
    await _context.SaveChangesAsync();
    return Ok(entity);
}
```

**With MediatR:**
```csharp
// GOOD — Controller delegates to handler
[HttpPost]
public async Task<IActionResult> Create(CreateOpportunityCommand command, CancellationToken ct)
{
    var result = await _mediator.Send(command, ct);
    return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
}
```

The handler contains the business logic. The controller just handles HTTP.

---

## Repository Pattern + Unit of Work

### Repository Pattern
A repository abstracts data access. Instead of your handlers knowing about EF Core directly, they talk to an interface.

```csharp
public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<List<T>> GetAllAsync(CancellationToken ct);
    Task AddAsync(T entity, CancellationToken ct);
    void Update(T entity);
    void Delete(T entity);
}
```

### Unit of Work
Ensures all changes in a single operation are saved together (atomically).

```csharp
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct);
}
```

---

## Feature-Based Organization

We organize code by **feature** (what it does), not by **type** (what it is).

**BAD — Type-based:**
```
Controllers/
    OpportunityController.cs
    ProjectController.cs
Commands/
    CreateOpportunityCommand.cs
    CreateProjectCommand.cs
Validators/
    CreateOpportunityValidator.cs
    CreateProjectValidator.cs
```

**GOOD — Feature-based:**
```
Features/
    LandAcquisition/
        Opportunities/
            Commands/
                CreateOpportunity/
                    CreateOpportunityCommand.cs
                    CreateOpportunityCommandHandler.cs
                    CreateOpportunityCommandValidator.cs
            Queries/
                GetOpportunities/
                    GetOpportunitiesQuery.cs
                    GetOpportunitiesQueryHandler.cs
            DTOs/
                OpportunityDto.cs
```

**Why:** When you need to change something about opportunities, everything is in one place. You don't hunt through 5 different folders.

---

## Frontend Architecture (Angular)

### Component Types

**Smart (Container) Components:**
- Connect to NgRx Store
- Dispatch actions
- Subscribe to selectors
- Handle navigation
- Pass data to child components

**Dumb (Presentational) Components:**
- Receive data via @Input()
- Emit events via @Output()
- No store dependency
- No service injection
- Reusable across features

### NgRx (State Management)

NgRx is Redux for Angular. It provides a single, predictable state container.

```
User Action → Component dispatches Action → Effect calls API → 
    Success → Reducer updates State → Selector provides data → Component re-renders
```

Every feature has:
- **Actions** — What happened ("Load Opportunities", "Create Opportunity Success")
- **Reducer** — How state changes in response to actions
- **Effects** — Side effects (API calls, navigation, notifications)
- **Selectors** — Derived data from state (memoized for performance)

---

## Cross-Cutting Concerns

These are things that apply to EVERY request, not just one feature:

| Concern | How We Handle It |
|---------|-----------------|
| Authentication | JWT tokens verified on every request |
| Authorization | [Authorize] attribute checks role |
| Validation | Pipeline behavior validates every command |
| Exception Handling | Global middleware catches all errors |
| Audit Logging | EF Core interceptor logs all changes |
| Correlation ID | Middleware assigns ID, propagates through logs |
| Security Headers | Middleware adds X-Frame-Options, CSP, etc. |
| Rate Limiting | Middleware limits requests per IP |

---

## Key Architecture Decisions Summary

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Architecture style | Clean Architecture | Testability, maintainability, layer isolation |
| State management | CQRS | Clear intent, separate concerns, audit-friendly |
| Dispatcher | MediatR | Thin controllers, pipeline behaviors, testability |
| ORM | Entity Framework Core | Code-first, migrations, LINQ, Microsoft-supported |
| Validation | FluentValidation | Expressive rules, testable, MediatR integration |
| Mapping | AutoMapper | Reduce boilerplate DTO ↔ Entity conversion |
| Frontend state | NgRx | Predictable, debuggable, scalable state management |
| UI framework | Angular + Tailwind + DaisyUI | Component architecture, enterprise-ready, consistent styling |
| Auth | JWT + ASP.NET Identity | Stateless, scalable, industry standard |

---

## Anti-Patterns (What NOT To Do)

| Anti-Pattern | Why It's Bad | What To Do Instead |
|-------------|-------------|-------------------|
| Business logic in controllers | Untestable, violates SRP | Move to handlers |
| Business logic in components | Same as above | Move to effects/services |
| God classes (1000+ line files) | Unmaintainable | Split by responsibility |
| Direct DB access from controllers | Bypasses validation & audit | Use MediatR pipeline |
| Shared mutable state | Race conditions, bugs | Use NgRx store |
| Magic strings | Typos cause runtime errors | Use constants/enums |
| No error handling | Crashes confuse users | Global exception handler |
| No audit trail | Compliance failure | Automatic interceptor |

---

*Next: Phase 4 — The Technology Stack (every tool and why)...*
