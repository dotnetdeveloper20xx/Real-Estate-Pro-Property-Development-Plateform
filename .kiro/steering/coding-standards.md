---
inclusion: auto
---

# BuildEstate Pro — Coding Standards Quick Reference

This file is a concise reference. For full enterprise-grade details, see:
- `architecture-principles.md` — Core architecture philosophy & quality gates
- `backend-standards.md` — ASP.NET Core, CQRS, controllers, DI
- `frontend-standards.md` — Angular, NgRx, components, forms
- `database-standards.md` — EF Core, indexing, audit, migrations
- `security-standards.md` — Auth, validation, encryption, headers
- `testing-observability.md` — xUnit, structured logging, correlation IDs

## Naming Conventions (Quick Reference)

### C# / .NET
| Element | Convention | Example |
|---------|-----------|---------|
| Classes/Interfaces | PascalCase | `LandOpportunity`, `IOpportunityService` |
| Methods | PascalCase | `GetOpportunityByIdAsync` |
| Properties | PascalCase | `PropertyName` |
| Private fields | _camelCase | `_opportunityRepository` |
| Parameters/locals | camelCase | `opportunityId` |
| Constants | PascalCase | `MaxRetryCount` |
| Interfaces | I prefix | `IRepository<T>` |
| Async methods | Async suffix | `CreateAsync` |

### TypeScript / Angular
| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase + suffix | `OpportunityListComponent` |
| Services | PascalCase + suffix | `OpportunityService` |
| Interfaces | I prefix | `IOpportunity` |
| Files | kebab-case | `opportunity-list.component.ts` |
| Variables/functions | camelCase | `getOpportunities` |
| Constants | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| Actions | Bracket format | `[Opportunities] Load` |

## Git Conventions
- Branch: `feature/{module}/{short-description}`
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`)
- One feature per branch, one concern per commit
- PR required for merge to main
- Never push directly to main

## File Organisation
- One class per file
- One component per file
- Feature-based folder structure (not type-based)
- Keep related files close together
- No dumping grounds (no `Utils/`, `Helpers/`, `Misc/`)
