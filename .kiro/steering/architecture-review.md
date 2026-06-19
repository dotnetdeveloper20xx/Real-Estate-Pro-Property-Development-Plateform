---
inclusion: auto
---

# Architecture Review

## Enforced Architecture

- Clean Architecture (strict layer separation)
- CQRS via MediatR
- Repository pattern (IRepository<T>)
- Service layer for cross-cutting concerns
- NgRx for state management
- Angular Signals where appropriate
- Typed models everywhere (no `any`)
- No business logic in components
- No raw HTTP calls in components
- No duplicate services
- No bypasses or hacks

## Data Flow (Frontend)

```
Component (dispatches action)
    ↓
NgRx Store (reduces state)
    ↓
NgRx Effects (handles side effects)
    ↓
Typed Service (makes HTTP call)
    ↓
Backend API (returns envelope)
```

## Data Flow (Backend)

```
Controller (thin, dispatches to MediatR)
    ↓
MediatR Pipeline (validation, logging)
    ↓
Command/Query Handler (business logic)
    ↓
Repository / DbContext (data access)
    ↓
SQL Server (persistence)
```

## Before Creating ANY Component

1. Search entire project for existing components
2. Check shared/ directory
3. Check if it can become generic/shared
4. Check if future modules will need it
5. Duplicate UI is forbidden
