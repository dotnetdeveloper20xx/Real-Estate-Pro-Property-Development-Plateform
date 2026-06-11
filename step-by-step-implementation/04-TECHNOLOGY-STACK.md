# Phase 4: Technology Stack — Every Choice Explained

## Why Technology Choices Matter

Every technology in this stack was chosen deliberately. As a junior developer, understanding _why_ a tool was chosen is more valuable than just knowing _how_ to use it.

---

## Backend Stack

### ASP.NET Core (.NET 10)

**What:** Microsoft's cross-platform web framework for building APIs
**Why chosen:**
- Enterprise-grade performance (one of the fastest web frameworks)
- Strong typing with C# (catches bugs at compile time)
- Built-in dependency injection
- Excellent documentation and community
- Long-term support from Microsoft
- Used by Fortune 500 companies

**Alternatives considered:**
- Node.js/Express — faster to prototype but harder to maintain at scale
- Java/Spring — equally valid but C# has more concise syntax
- Python/Django — great for rapid development but slower runtime

### C# (Latest Version)

**What:** The programming language
**Why chosen:**
- Strong static typing prevents runtime errors
- Async/await first-class support
- Records, pattern matching, nullable reference types
- Excellent tooling (Visual Studio, Rider)
- LINQ for expressive data queries

### Entity Framework Core (Code-First)

**What:** Object-Relational Mapper (ORM) — maps C# objects to database tables
**Why chosen:**
- Code-First means you define entities in C#, database is generated automatically
- Migrations track database schema changes over time
- LINQ queries are type-safe (compile-time checking)
- Change tracking for audit trails
- Supports SQL Server, PostgreSQL, SQLite (swappable)

**Key concept:** You write C# classes, EF Core creates SQL tables. You write LINQ queries, EF Core generates SQL.

### SQL Server

**What:** Microsoft's relational database
**Why chosen:**
- Enterprise-proven (banks, governments, Fortune 500)
- Excellent with EF Core (native integration)
- Full-text search, JSON support, temporal tables
- SQL Server Express is free for development
- Azure SQL for cloud deployment

### MediatR

**What:** In-process message dispatcher (implements Mediator pattern)
**Why chosen:**
- Decouples controllers from business logic
- Pipeline behaviors (validation, logging, performance tracking)
- One handler per command/query (Single Responsibility)
- Easy to test handlers in isolation

### FluentValidation

**What:** Library for building strongly-typed validation rules
**Why chosen:**
- Expressive, readable validation rules
- Integrates with MediatR pipeline (automatic validation)
- Testable (each validator can be unit tested)
- Separates validation from business logic

```csharp
// Example: Readable, testable validation
public class CreateOpportunityValidator : AbstractValidator<CreateOpportunityCommand>
{
    public CreateOpportunityValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.AskingPrice).GreaterThan(0);
        RuleFor(x => x.LandSize).GreaterThan(0);
    }
}
```

### AutoMapper

**What:** Object-to-object mapper (converts entities to DTOs)
**Why chosen:**
- Reduces repetitive mapping code
- Explicit profiles (you control exactly what maps to what)
- Prevents domain entities from leaking to API responses
- Testable mapping configurations

---

## Frontend Stack

### Angular 20 (Standalone Components)

**What:** Google's TypeScript-based frontend framework
**Why chosen:**
- Enterprise-standard (used by Google, Microsoft, SAP)
- Strong typing with TypeScript (matches our backend philosophy)
- Built-in dependency injection, routing, forms, HTTP client
- Standalone components (simpler than NgModules)
- Opinionated structure (good for large teams)
- Long-term support with predictable release cycle

**Why not React?** React is excellent but less opinionated. For a 14-module enterprise app with multiple developers, Angular's structure and conventions reduce decisions and keep code consistent.

### TypeScript (Strict Mode)

**What:** JavaScript with types
**Why chosen:**
- Catches errors at compile time, not runtime
- IDE support (autocomplete, refactoring, go-to-definition)
- Self-documenting code (types explain what data looks like)
- Strict mode = maximum safety (`no any`, `noImplicitAny`, `strictNullChecks`)

### NgRx (State Management)

**What:** Redux pattern for Angular (predictable state container)
**Why chosen:**
- Single source of truth for application state
- Predictable state changes (reducers are pure functions)
- DevTools for debugging (time-travel, action log)
- Separation of concerns (components don't manage state)
- Scales well for complex applications

### Tailwind CSS

**What:** Utility-first CSS framework
**Why chosen:**
- No custom CSS files to maintain
- Consistent spacing, colours, typography via design tokens
- Responsive design utilities built-in
- Purges unused CSS (tiny production bundle)
- Works well with component libraries

### DaisyUI

**What:** Component library built on Tailwind CSS
**Why chosen:**
- Pre-built semantic components (buttons, cards, tables, modals)
- Theming support (light/dark mode, custom themes)
- Reduces Tailwind class verbosity
- Consistent look without custom design work
- Accessible out of the box

---

## Cross-Cutting Technologies

### JWT (JSON Web Tokens)

**What:** Stateless authentication tokens
**Why chosen:**
- Stateless — server doesn't store session (scales horizontally)
- Contains claims (user ID, roles) — reduces database lookups
- Industry standard for API authentication
- Short-lived (60 min) with refresh token rotation

### ASP.NET Identity

**What:** Microsoft's user management library
**Why chosen:**
- Handles user registration, login, password hashing
- Role management built-in
- Account lockout, email confirmation, 2FA support
- Integrates with EF Core (stores users in SQL Server)

### Swagger / OpenAPI

**What:** API documentation that's auto-generated from code
**Why chosen:**
- Always up-to-date (generated from controllers)
- Interactive testing UI (try endpoints from browser)
- Frontend developers can see exactly what API expects
- Industry standard for REST API docs

---

## Development Tools

### xUnit (Testing)

**What:** Unit testing framework for .NET
**Why chosen:**
- Clean, modern API (constructor injection, no [Setup] boilerplate)
- Parallel test execution (faster feedback)
- Theory support (parameterized tests)
- Most popular .NET testing framework

### Moq (Mocking)

**What:** Creates fake implementations of interfaces for testing
**Why chosen:**
- Simple, readable syntax
- Verify that methods were called correctly
- Setup return values for dependencies
- Lightweight (no generated code)

### FluentAssertions

**What:** Expressive assertion library
**Why chosen:**
- Readable test assertions: `result.Should().NotBeNull()`
- Better error messages than built-in Assert
- Rich API for collections, objects, strings, exceptions
- Makes tests self-documenting

---

## Architecture Summary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Browser)                                              │
│  Angular 20 + TypeScript + NgRx + Tailwind + DaisyUI            │
│                                                                  │
│  [Components] → [Store] → [Effects] → HTTP → [API]             │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS (JWT Bearer)
┌─────────────────────────┼───────────────────────────────────────┐
│  API LAYER              │                                        │
│  ASP.NET Core + Swagger + Middleware                             │
│  Controllers (thin) → MediatR                                    │
├─────────────────────────┼───────────────────────────────────────┤
│  APPLICATION LAYER      │                                        │
│  MediatR Handlers + FluentValidation + AutoMapper + DTOs         │
├─────────────────────────┼───────────────────────────────────────┤
│  DOMAIN LAYER           │                                        │
│  Entities + Enums + Interfaces (ZERO dependencies)               │
├─────────────────────────┼───────────────────────────────────────┤
│  INFRASTRUCTURE LAYER   │                                        │
│  EF Core + Identity + File Storage + External Services           │
└─────────────────────────┼───────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────┐
│  DATA LAYER             │                                        │
│  SQL Server + Azure Blob Storage                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Package Versions (Pin Everything)

Always pin exact versions in your project files. Never use floating ranges like `*` or `>=`.

**Backend (.csproj):**
```xml
<PackageReference Include="MediatR" Version="12.4.0" />
<PackageReference Include="FluentValidation" Version="11.9.0" />
<PackageReference Include="AutoMapper" Version="13.0.1" />
```

**Frontend (package.json):**
```json
"@angular/core": "20.0.0",
"@ngrx/store": "19.0.0",
"tailwindcss": "3.4.0",
"daisyui": "4.12.0"
```

**Why pin?** A floating version might introduce a breaking change without warning. Pinned versions mean your build is reproducible.

---

## Development Environment Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| .NET SDK | 10.0+ | Backend compilation and runtime |
| Node.js | 20+ | Frontend build toolchain |
| Angular CLI | 20+ | Frontend scaffolding and dev server |
| SQL Server Express | 2022+ | Local database |
| Visual Studio / VS Code / Rider | Latest | IDE |
| Git | Latest | Version control |

---

*Next: Phase 5 — Creating the Project from Scratch (hands-on)...*
