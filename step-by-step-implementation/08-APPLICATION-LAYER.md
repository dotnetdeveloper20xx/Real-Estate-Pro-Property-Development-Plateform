# Phase 8: Building the Application Layer

## What You'll Build

The Application layer defines what your application CAN DO. It contains the use cases — every action a user can take, expressed as commands (writes) and queries (reads).

---

## Key Components

```
BuildEstate.Application/
├── Behaviors/
│   └── ValidationBehavior.cs        — Auto-validates all commands
├── Features/
│   └── LandAcquisition/
│       └── Opportunities/
│           ├── Commands/
│           ├── Queries/
│           ├── DTOs/
│           └── Mappings/
├── Interfaces/
│   └── ICurrentUserService.cs       — Who is making the request?
└── DependencyInjection.cs           — Register MediatR, validators, mappers
```

---

## Dependency Injection Registration

```csharp
namespace BuildEstate.Application;

using Microsoft.Extensions.DependencyInjection;
using FluentValidation;
using MediatR;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        // MediatR (command/query dispatcher)
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));

        // FluentValidation (auto-discovers all validators in assembly)
        services.AddValidatorsFromAssembly(assembly);

        // MediatR pipeline behavior (runs validators before handlers)
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        // AutoMapper (auto-discovers all profiles in assembly)
        services.AddAutoMapper(assembly);

        return services;
    }
}
```

---

## Validation Pipeline Behavior

This is the magic that makes validation automatic. Every command passes through this behavior BEFORE reaching its handler.

```csharp
namespace BuildEstate.Application.Behaviors;

using FluentValidation;
using MediatR;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!_validators.Any())
            return await next();

        var context = new ValidationContext<TRequest>(request);

        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = validationResults
            .SelectMany(r => r.Errors)
            .Where(f => f != null)
            .ToList();

        if (failures.Count != 0)
            throw new ValidationException(failures);

        return await next();
    }
}
```

**How it works:**
1. MediatR receives a command (e.g., `CreateOpportunityCommand`)
2. Before calling the handler, it runs through pipeline behaviors
3. `ValidationBehavior` finds all validators for that command type
4. If validation fails → throws `ValidationException` (caught by global handler → 400 response)
5. If validation passes → proceeds to the handler

---

## Command Pattern (Full Example)

### The Command (What the user wants to do)
```csharp
namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.CreateOpportunity;

using MediatR;

public class CreateOpportunityCommand : IRequest<OpportunityDetailDto>
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal LandSize { get; set; }
    public decimal AskingPrice { get; set; }
    public string? Source { get; set; }
    public string? AgentName { get; set; }
    public string? AgentContact { get; set; }
    public string? Description { get; set; }
}
```

### The Validator (Is it valid?)
```csharp
namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.CreateOpportunity;

using FluentValidation;

public class CreateOpportunityCommandValidator : AbstractValidator<CreateOpportunityCommand>
{
    public CreateOpportunityCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Opportunity name is required")
            .MaximumLength(200).WithMessage("Name cannot exceed 200 characters");

        RuleFor(x => x.Location)
            .NotEmpty().WithMessage("Location is required")
            .MaximumLength(500).WithMessage("Location cannot exceed 500 characters");

        RuleFor(x => x.AskingPrice)
            .GreaterThan(0).WithMessage("Asking price must be greater than zero");

        RuleFor(x => x.LandSize)
            .GreaterThan(0).WithMessage("Land size must be greater than zero");
    }
}
```

### The Handler (Do the work)
```csharp
namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Commands.CreateOpportunity;

using AutoMapper;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Enums;
using BuildEstate.Domain.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

public class CreateOpportunityCommandHandler
    : IRequestHandler<CreateOpportunityCommand, OpportunityDetailDto>
{
    private readonly IRepository<LandOpportunity> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<CreateOpportunityCommandHandler> _logger;

    public CreateOpportunityCommandHandler(
        IRepository<LandOpportunity> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<CreateOpportunityCommandHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<OpportunityDetailDto> Handle(
        CreateOpportunityCommand request,
        CancellationToken cancellationToken)
    {
        // Map command to entity
        var entity = _mapper.Map<LandOpportunity>(request);
        entity.Status = OpportunityStatus.Identified;

        // Persist
        await _repository.AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Log business event
        _logger.LogInformation(
            "Opportunity {OpportunityId} '{Name}' created at {Location}",
            entity.Id, entity.Name, entity.Location);

        // Return DTO
        return _mapper.Map<OpportunityDetailDto>(entity);
    }
}
```

---

## Query Pattern (Full Example)

### The Query (What data do we want?)
```csharp
namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Queries.GetOpportunities;

using BuildEstate.Shared.Models;
using MediatR;

public class GetOpportunitiesQuery : IRequest<PagedResult<OpportunityListItemDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? Status { get; set; }
    public string? SortBy { get; set; } = "CreatedAt";
    public bool SortDescending { get; set; } = true;
}
```

### The Handler (Get the data efficiently)
```csharp
public class GetOpportunitiesQueryHandler
    : IRequestHandler<GetOpportunitiesQuery, PagedResult<OpportunityListItemDto>>
{
    private readonly BuildEstateDbContext _context;

    public GetOpportunitiesQueryHandler(BuildEstateDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<OpportunityListItemDto>> Handle(
        GetOpportunitiesQuery request,
        CancellationToken cancellationToken)
    {
        // Start with queryable (no data loaded yet)
        var query = _context.LandOpportunities.AsNoTracking();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(x =>
                x.Name.ToLower().Contains(search) ||
                x.Location.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(request.Status)
            && Enum.TryParse<OpportunityStatus>(request.Status, out var status))
        {
            query = query.Where(x => x.Status == status);
        }

        // Get total count (for pagination metadata)
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply sorting
        query = request.SortBy?.ToLower() switch
        {
            "name" => request.SortDescending
                ? query.OrderByDescending(x => x.Name)
                : query.OrderBy(x => x.Name),
            "askingprice" => request.SortDescending
                ? query.OrderByDescending(x => x.AskingPrice)
                : query.OrderBy(x => x.AskingPrice),
            _ => request.SortDescending
                ? query.OrderByDescending(x => x.CreatedAt)
                : query.OrderBy(x => x.CreatedAt)
        };

        // Apply pagination and project to DTO
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new OpportunityListItemDto(
                x.Id,
                x.Name,
                x.Location,
                x.AskingPrice,
                x.Status.ToString(),
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<OpportunityListItemDto>(
            items, totalCount, request.Page, request.PageSize);
    }
}
```

**Key performance notes:**
- `AsNoTracking()` — no change tracking overhead (read-only)
- `.Select()` projection — only fetches columns we need (not SELECT *)
- `.Skip().Take()` — server-side pagination (database does the work)
- Count + data in same query plan

---

## AutoMapper Profile

```csharp
namespace BuildEstate.Application.Features.LandAcquisition.Opportunities.Mappings;

using AutoMapper;
using BuildEstate.Domain.Entities.LandAcquisition;

public class OpportunityMappingProfile : Profile
{
    public OpportunityMappingProfile()
    {
        // Command → Entity
        CreateMap<CreateOpportunityCommand, LandOpportunity>();
        CreateMap<UpdateOpportunityCommand, LandOpportunity>();

        // Entity → DTO
        CreateMap<LandOpportunity, OpportunityDetailDto>()
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()));
    }
}
```

---

## Shared Models (PagedResult)

```csharp
namespace BuildEstate.Shared.Models;

public class PagedResult<T>
{
    public List<T> Items { get; }
    public int TotalCount { get; }
    public int Page { get; }
    public int PageSize { get; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    public PagedResult(List<T> items, int totalCount, int page, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }
}
```

---

## Verification

```bash
cd backend
dotnet build
# The Application layer should compile with references to Domain only
```

---

*Next: Phase 9 — Building the API Layer (controllers, middleware, security)...*
