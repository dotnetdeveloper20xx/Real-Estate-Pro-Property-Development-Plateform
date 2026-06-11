# BuildEstate Pro — Coding Standards

## Purpose
This document defines the naming, formatting, and organizational conventions for ALL code in the BuildEstate Pro platform. Consistency is non-negotiable in enterprise software.

---

## C# / .NET Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Namespace | PascalCase (match folder structure) | `BuildEstate.Domain.Entities.LandAcquisition` |
| Class | PascalCase | `LandOpportunity`, `CreateOpportunityCommand` |
| Interface | I + PascalCase | `IRepository<T>`, `ICurrentUserService` |
| Method | PascalCase | `GetOpportunityByIdAsync` |
| Async method | PascalCase + Async suffix | `CreateAsync`, `SaveChangesAsync` |
| Property | PascalCase | `PropertyName`, `CreatedAt` |
| Private field | _ + camelCase | `_opportunityRepository`, `_mediator` |
| Parameter | camelCase | `opportunityId`, `cancellationToken` |
| Local variable | camelCase | `result`, `existingRecord` |
| Constant | PascalCase | `MaxRetryCount`, `DefaultPageSize` |
| Enum | PascalCase (singular name) | `OpportunityStatus`, `ContractType` |
| Enum value | PascalCase | `Identified`, `DueDiligence`, `UnderContract` |

## TypeScript / Angular Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Component class | PascalCase + Component | `OpportunityListComponent` |
| Service class | PascalCase + Service | `OpportunityService` |
| Interface | I + PascalCase | `IOpportunity`, `IApiResponse` |
| Type alias | PascalCase | `OpportunityStatus` |
| File name | kebab-case | `opportunity-list.component.ts` |
| Variable | camelCase | `opportunities`, `selectedItem` |
| Function | camelCase | `loadOpportunities`, `onSubmit` |
| Constant | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE`, `API_BASE_URL` |
| Action format | `[Feature] Verb Noun` | `[Opportunities] Load`, `[Opportunities] Create Success` |
| Selector | select + PascalCase | `selectAllOpportunities`, `selectLoading` |
| Model file | kebab-case + `.model.ts` | `opportunity.model.ts` |
| Store file | kebab-case + store type | `opportunities.actions.ts`, `opportunities.reducer.ts` |

## File & Folder Organization

### Backend
```
Features/
    {ModuleName}/
        {SubFeature}/
            Commands/
                {Action}{Entity}/
                    {Action}{Entity}Command.cs
                    {Action}{Entity}CommandHandler.cs
                    {Action}{Entity}CommandValidator.cs
            Queries/
                {Query}{Entity}/
                    {Query}{Entity}Query.cs
                    {Query}{Entity}QueryHandler.cs
            DTOs/
                {Entity}Dto.cs
                {Entity}DetailDto.cs
```

### Frontend
```
features/
    {module-name}/
        {entity-name}-list/
            {entity-name}-list.component.ts
        {entity-name}-detail/
        {entity-name}-form/
        store/
            {entity-name}.actions.ts
            {entity-name}.reducer.ts
            {entity-name}.effects.ts
            {entity-name}.selectors.ts
            {entity-name}.state.ts
```

### Rules
- One class per file (C#)
- One component per file (Angular)
- Feature-based organization (not type-based)
- No utility dumping grounds (no `Helpers.cs`, no `Utils/`)
- Related files live together (command + handler + validator in same folder)
- Max file length: ~300 lines (split if longer)

## Git Conventions

### Branch Naming
```
feature/{module}/{short-description}
bugfix/{module}/{short-description}
hotfix/{description}
refactor/{module}/{short-description}
```

Examples:
- `feature/land-acquisition/opportunity-pipeline`
- `bugfix/planning/status-transition-validation`
- `refactor/shared/audit-interceptor`

### Commit Messages (Conventional Commits)
```
feat: add opportunity creation endpoint
fix: resolve duplicate name validation
refactor: extract pagination helper
docs: update API documentation
test: add unit tests for status transitions
chore: update NuGet packages
```

### Rules
- One feature per branch
- One concern per commit
- PR required for merge to main
- Never push directly to main
- Never commit secrets (API keys, passwords, connection strings)
- Never commit `bin/`, `obj/`, `node_modules/`

## Code Formatting Rules

### C#
- Use `var` when type is obvious from right side: `var entity = new LandOpportunity();`
- Use explicit type when not obvious: `LandOpportunity? result = await repo.GetByIdAsync(id);`
- Braces on new line (Allman style) for methods and classes
- Maximum line length: 120 characters
- One blank line between methods
- XML doc comments on public APIs

### TypeScript
- Single quotes for strings
- Trailing commas in multi-line arrays/objects
- 2-space indentation
- Explicit return types on public methods
- No `any` type — ever
- Use `readonly` where immutability is intended

## Documentation Standards

### C# XML Comments (Public APIs)
```csharp
/// <summary>
/// Creates a new land opportunity in the system.
/// </summary>
/// <param name="command">The creation command with opportunity details.</param>
/// <param name="cancellationToken">Cancellation token.</param>
/// <returns>The ID of the created opportunity.</returns>
```

### Angular JSDoc Comments (Services)
```typescript
/**
 * Loads opportunities from the API with pagination and filtering.
 * @param page - Page number (1-based)
 * @param pageSize - Number of items per page
 * @param filters - Optional filter criteria
 * @returns Observable of paginated opportunity list
 */
```

---

## Anti-Patterns to Avoid

| Don't | Do Instead |
|-------|-----------|
| `public object GetData()` | Use specific return types |
| `catch (Exception) { }` | Handle or rethrow meaningfully |
| `// TODO: fix later` | Fix now or create a ticket |
| Magic numbers (`if (status == 3)`) | Use enums (`if (status == OpportunityStatus.DueDiligence)`) |
| Hungarian notation (`strName`) | Use meaningful names (`name`) |
| Abbreviations (`opp`, `mgr`) | Use full words (`opportunity`, `manager`) |
| Boolean parameters (`Create(true, false)`) | Use named params or options object |
| Large methods (50+ lines) | Extract smaller, named methods |
