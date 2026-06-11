# Phase 12: The Module Implementation Pattern (The Repeatable Recipe)

## Why This Exists

Every module in BuildEstate Pro follows the SAME implementation pattern. Learn it once, apply it 14 times. This is the most important document in the entire guide — it's the recipe you'll follow for every feature.

---

## The 10-Step Recipe

For EVERY module, follow these steps in order:

```
Step 1:  Define entities (Domain layer)
Step 2:  Define enums (Domain layer)
Step 3:  Create EF Core configuration (Infrastructure layer)
Step 4:  Create and run migration (Infrastructure layer)
Step 5:  Create DTOs (Application layer)
Step 6:  Create commands + handlers + validators (Application layer)
Step 7:  Create queries + handlers (Application layer)
Step 8:  Create controller (API layer)
Step 9:  Create frontend (Angular: store, service, components)
Step 10: Write tests + seed data
```

---

## Step 1: Define Entities

Location: `BuildEstate.Domain/Entities/{ModuleName}/`

Every entity inherits from `BaseEntity` and represents a real business concept.

```csharp
namespace BuildEstate.Domain.Entities.LandAcquisition;

public class LandOpportunity : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal LandSize { get; set; }
    public decimal AskingPrice { get; set; }
    public OpportunityStatus Status { get; set; } = OpportunityStatus.Identified;
    public string? Source { get; set; }
    public string? AgentName { get; set; }
    public string? AgentContact { get; set; }
    public string? Description { get; set; }

    // Navigation properties
    public ICollection<DueDiligence> DueDiligences { get; set; } = new List<DueDiligence>();
    public ICollection<Offer> Offers { get; set; } = new List<Offer>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
}
```

**Rules:**
- One file per entity
- Inherit from BaseEntity (gets Id, audit fields, soft delete)
- Default values for required fields
- Navigation properties initialized as empty collections
- No business logic in entities (pure data holders)

---

## Step 2: Define Enums

Location: `BuildEstate.Domain/Enums/`

```csharp
namespace BuildEstate.Domain.Enums;

public enum OpportunityStatus
{
    Identified = 0,
    InitialReview = 1,
    DueDiligence = 2,
    OfferMade = 3,
    UnderContract = 4,
    Acquired = 5,
    Withdrawn = 6
}
```

**Rules:**
- Explicit numeric values (database stability)
- PascalCase values
- Singular enum name
- Document valid transitions (comments)

---

## Step 3: Create EF Core Configuration

Location: `BuildEstate.Infrastructure/Persistence/Configurations/`

```csharp
public class LandOpportunityConfiguration : IEntityTypeConfiguration<LandOpportunity>
{
    public void Configure(EntityTypeBuilder<LandOpportunity> builder)
    {
        builder.ToTable("LandOpportunities");
        builder.HasKey(x => x.Id);

        // Properties
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Location).IsRequired().HasMaxLength(500);
        builder.Property(x => x.AskingPrice).HasPrecision(18, 2);
        builder.Property(x => x.LandSize).HasPrecision(18, 4);
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.Source).HasMaxLength(200);
        builder.Property(x => x.AgentName).HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(2000);

        // Concurrency token
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);

        // Indexes
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.CreatedAt);
        builder.HasIndex(x => new { x.Name, x.Location }).IsUnique();

        // Relationships
        builder.HasMany(x => x.DueDiligences)
            .WithOne()
            .HasForeignKey(x => x.OpportunityId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

**Remember to add DbSet to DbContext:**
```csharp
public DbSet<LandOpportunity> LandOpportunities => Set<LandOpportunity>();
```

---

## Step 4: Create and Run Migration

```bash
dotnet ef migrations add AddLandOpportunityTable \
    --project src/BuildEstate.Infrastructure \
    --startup-project src/BuildEstate.API

dotnet ef database update \
    --project src/BuildEstate.Infrastructure \
    --startup-project src/BuildEstate.API
```

---

## Step 5: Create DTOs

Location: `BuildEstate.Application/Features/{Module}/{SubFeature}/DTOs/`

```csharp
// List item (minimal — what appears in a table row)
public record OpportunityListItemDto(
    Guid Id,
    string Name,
    string Location,
    decimal AskingPrice,
    string Status,
    DateTime CreatedAt
);

// Detail (full — what appears on a detail page)
public record OpportunityDetailDto(
    Guid Id,
    string Name,
    string Location,
    decimal LandSize,
    decimal AskingPrice,
    string Status,
    string? Source,
    string? AgentName,
    string? AgentContact,
    string? Description,
    DateTime CreatedAt,
    string CreatedBy,
    DateTime? UpdatedAt
);
```

---

## Step 6: Create Commands

Location: `BuildEstate.Application/Features/{Module}/{SubFeature}/Commands/{Action}{Entity}/`

### Command Class
```csharp
public class CreateOpportunityCommand : IRequest<OpportunityDetailDto>
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal LandSize { get; set; }
    public decimal AskingPrice { get; set; }
    public string? Source { get; set; }
    public string? AgentName { get; set; }
    public string? Description { get; set; }
}
```

### Command Handler
```csharp
public class CreateOpportunityCommandHandler : IRequestHandler<CreateOpportunityCommand, OpportunityDetailDto>
{
    private readonly IRepository<LandOpportunity> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreateOpportunityCommandHandler(
        IRepository<LandOpportunity> repository,
        IUnitOfWork unitOfWork,
        IMapper mapper)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<OpportunityDetailDto> Handle(
        CreateOpportunityCommand request,
        CancellationToken cancellationToken)
    {
        var entity = _mapper.Map<LandOpportunity>(request);
        entity.Status = OpportunityStatus.Identified;

        await _repository.AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<OpportunityDetailDto>(entity);
    }
}
```

### Command Validator
```csharp
public class CreateOpportunityCommandValidator : AbstractValidator<CreateOpportunityCommand>
{
    public CreateOpportunityCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name cannot exceed 200 characters");

        RuleFor(x => x.Location)
            .NotEmpty().WithMessage("Location is required");

        RuleFor(x => x.AskingPrice)
            .GreaterThan(0).WithMessage("Asking price must be greater than zero");

        RuleFor(x => x.LandSize)
            .GreaterThan(0).WithMessage("Land size must be greater than zero");
    }
}
```

---

## Step 7: Create Queries

```csharp
// Query
public class GetOpportunitiesQuery : IRequest<PagedResult<OpportunityListItemDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public OpportunityStatus? Status { get; set; }
    public string? SortBy { get; set; } = "CreatedAt";
    public bool SortDescending { get; set; } = true;
}

// Handler
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
        var query = _context.LandOpportunities.AsNoTracking();

        // Filter
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(x => x.Name.Contains(request.Search)
                || x.Location.Contains(request.Search));

        if (request.Status.HasValue)
            query = query.Where(x => x.Status == request.Status.Value);

        // Count
        var totalCount = await query.CountAsync(cancellationToken);

        // Sort + Paginate
        query = ApplySorting(query, request.SortBy, request.SortDescending);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new OpportunityListItemDto(
                x.Id, x.Name, x.Location, x.AskingPrice,
                x.Status.ToString(), x.CreatedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<OpportunityListItemDto>(items, totalCount, request.Page, request.PageSize);
    }
}
```

---

## Step 8: Create Controller

```csharp
[ApiController]
[Route("api/v1/opportunities")]
[Authorize]
public class OpportunitiesController : ControllerBase
{
    private readonly IMediator _mediator;

    public OpportunitiesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,AcquisitionManager")]
    public async Task<IActionResult> GetAll(
        [FromQuery] GetOpportunitiesQuery query, CancellationToken ct)
        => Ok(await _mediator.Send(query, ct));

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,AcquisitionManager")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await _mediator.Send(new GetOpportunityByIdQuery { Id = id }, ct));

    [HttpPost]
    [Authorize(Roles = "AcquisitionManager")]
    public async Task<IActionResult> Create(
        [FromBody] CreateOpportunityCommand command, CancellationToken ct)
    {
        var result = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "AcquisitionManager")]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateOpportunityCommand command, CancellationToken ct)
    {
        command.Id = id;
        return Ok(await _mediator.Send(command, ct));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteOpportunityCommand { Id = id }, ct);
        return NoContent();
    }
}
```

---

## Step 9: Create Frontend

### 9a. Models
```typescript
export interface IOpportunity {
    id: string;
    name: string;
    location: string;
    askingPrice: number;
    status: string;
    createdAt: string;
}
```

### 9b. NgRx Store (actions, reducer, effects, selectors)

### 9c. Service
```typescript
@Injectable({ providedIn: 'root' })
export class OpportunityService {
    private baseUrl = `${environment.apiUrl}/api/v1/opportunities`;
    constructor(private http: HttpClient) {}

    getAll(params: any): Observable<IPagedResult<IOpportunity>> {
        return this.http.get<IPagedResult<IOpportunity>>(this.baseUrl, { params });
    }
}
```

### 9d. Components
- List component (table + filters + pagination)
- Detail component (display all fields + actions)
- Form component (create/edit with reactive forms)
- Dashboard section (KPI cards + recent activity)

---

## Step 10: Tests + Seed Data

- Unit tests for handler, validator
- Seed realistic demo data (5+ records)
- Verify end-to-end: create via API, see in frontend

---

## Checklist (Per Module)

- [ ] Entities defined with correct properties
- [ ] Enums defined with explicit values
- [ ] EF Core configuration with indexes and filters
- [ ] Migration created and applied
- [ ] DTOs for list, detail, create, update
- [ ] Commands with handlers and validators
- [ ] Queries with handlers (paginated)
- [ ] Controller with correct authorization
- [ ] Frontend store (actions, reducer, effects, selectors)
- [ ] Frontend service (API calls)
- [ ] Frontend list page (table, search, filter, pagination)
- [ ] Frontend detail page (all fields, status actions)
- [ ] Frontend create/edit form (validation, submission)
- [ ] Unit tests for handlers and validators
- [ ] Seed data for demo
- [ ] Toast notifications on all operations
- [ ] Empty states when no data
- [ ] Loading states during async operations

---

*Apply this recipe to every module. Same pattern, different data.*
