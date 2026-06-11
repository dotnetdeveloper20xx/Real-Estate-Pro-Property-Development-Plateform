# Phase 7: Building the Infrastructure Layer

## What You'll Build

The Infrastructure layer handles all the "how" — how data is stored, how users are managed, how files are saved. It implements the contracts (interfaces) defined in the Domain layer.

---

## Key Components

```
BuildEstate.Infrastructure/
├── Persistence/
│   ├── BuildEstateDbContext.cs          — EF Core database context
│   ├── Configurations/                   — Entity-to-table mappings
│   │   ├── LandOpportunityConfiguration.cs
│   │   ├── DueDiligenceConfiguration.cs
│   │   └── ... (one per entity)
│   ├── Interceptors/
│   │   └── AuditableDbContextInterceptor.cs — Automatic audit fields
│   ├── Repository.cs                    — Generic repository implementation
│   └── UnitOfWork.cs                    — Save changes implementation
├── Identity/
│   ├── ApplicationUser.cs               — Extends IdentityUser
│   └── ApplicationRole.cs              — Extends IdentityRole
├── Services/
│   ├── FileStorageService.cs            — File upload/download
│   └── EmailService.cs                  — Send notifications
├── Migrations/                          — EF Core migrations (auto-generated)
└── DependencyInjection.cs               — Register all infrastructure services
```

---

## The DbContext (Central Database Connection)

```csharp
namespace BuildEstate.Infrastructure.Persistence;

using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Entities.Planning;
// ... all entity namespaces
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

public class BuildEstateDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
{
    public BuildEstateDbContext(DbContextOptions<BuildEstateDbContext> options) : base(options) { }

    // Land Acquisition
    public DbSet<LandOpportunity> LandOpportunities => Set<LandOpportunity>();
    public DbSet<LandOwner> LandOwners => Set<LandOwner>();
    public DbSet<DueDiligence> DueDiligences => Set<DueDiligence>();
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<LandAcquisitionRecord> LandAcquisitions => Set<LandAcquisitionRecord>();

    // Planning
    public DbSet<PlanningApplication> PlanningApplications => Set<PlanningApplication>();
    // ... all other DbSets

    // Audit
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations from the assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BuildEstateDbContext).Assembly);
    }
}
```

**Key Points:**
- Inherits from `IdentityDbContext` (gives us user/role tables for free)
- One `DbSet<T>` per entity
- Configurations loaded automatically from the assembly
- `AuditLog` DbSet for the audit trail

---

## The Audit Interceptor (Automatic Tracking)

This is the secret sauce — every create/update/delete is logged automatically without the handler knowing about it.

```csharp
namespace BuildEstate.Infrastructure.Persistence.Interceptors;

using BuildEstate.Domain.Common;
using BuildEstate.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

public class AuditableDbContextInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentUserService _currentUserService;

    public AuditableDbContextInterceptor(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var context = eventData.Context;
        if (context == null) return base.SavingChangesAsync(eventData, result, cancellationToken);

        var userId = _currentUserService.UserId ?? "System";
        var now = DateTime.UtcNow;

        foreach (var entry in context.ChangeTracker.Entries<IAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedBy = userId;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = userId;
                    break;
            }
        }

        // Handle soft deletes
        foreach (var entry in context.ChangeTracker.Entries<BaseEntity>()
            .Where(e => e.State == EntityState.Deleted))
        {
            entry.State = EntityState.Modified;
            entry.Entity.IsDeleted = true;
            entry.Entity.DeletedAt = now;
            entry.Entity.DeletedBy = userId;
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
```

**What this does:**
- On CREATE: Sets `CreatedAt` and `CreatedBy` automatically
- On UPDATE: Sets `UpdatedAt` and `UpdatedBy` automatically
- On DELETE: Converts hard delete to soft delete (sets `IsDeleted = true`)
- Handlers never need to set audit fields manually

---

## Generic Repository Implementation

```csharp
namespace BuildEstate.Infrastructure.Persistence;

using BuildEstate.Domain.Common;
using BuildEstate.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    private readonly BuildEstateDbContext _context;
    private readonly DbSet<T> _dbSet;

    public Repository(BuildEstateDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _dbSet.FirstOrDefaultAsync(x => x.Id == id, ct);

    public async Task<List<T>> GetAllAsync(CancellationToken ct = default)
        => await _dbSet.ToListAsync(ct);

    public IQueryable<T> Query() => _dbSet;

    public async Task AddAsync(T entity, CancellationToken ct = default)
        => await _dbSet.AddAsync(entity, ct);

    public void Update(T entity) => _dbSet.Update(entity);

    public void Delete(T entity) => _dbSet.Remove(entity);
    // Note: The interceptor converts this to soft delete
}
```

---

## Unit of Work Implementation

```csharp
namespace BuildEstate.Infrastructure.Persistence;

using BuildEstate.Domain.Interfaces;

public class UnitOfWork : IUnitOfWork
{
    private readonly BuildEstateDbContext _context;

    public UnitOfWork(BuildEstateDbContext context) => _context = context;

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        => await _context.SaveChangesAsync(ct);
}
```

---

## Dependency Injection Registration

```csharp
namespace BuildEstate.Infrastructure;

using BuildEstate.Domain.Interfaces;
using BuildEstate.Infrastructure.Persistence;
using BuildEstate.Infrastructure.Persistence.Interceptors;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Audit interceptor
        services.AddScoped<AuditableDbContextInterceptor>();

        // Database context
        services.AddDbContext<BuildEstateDbContext>((sp, options) =>
        {
            var interceptor = sp.GetRequiredService<AuditableDbContextInterceptor>();
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(BuildEstateDbContext).Assembly.FullName));
            options.AddInterceptors(interceptor);
        });

        // Repository + UoW
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Identity
        services.AddDefaultIdentity<ApplicationUser>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequiredLength = 8;
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        })
        .AddRoles<ApplicationRole>()
        .AddEntityFrameworkStores<BuildEstateDbContext>();

        return services;
    }
}
```

---

## Creating Your First Migration

Once you have entities and configurations in place:

```bash
cd backend

dotnet ef migrations add InitialCreate \
    --project src/BuildEstate.Infrastructure \
    --startup-project src/BuildEstate.API

dotnet ef database update \
    --project src/BuildEstate.Infrastructure \
    --startup-project src/BuildEstate.API
```

This creates the SQL Server database with all tables, indexes, and constraints defined in your configurations.

---

## Seed Data (For Development)

Create a `DatabaseSeeder.cs` that populates the database with demo data:
- Default admin user (admin@buildestate.co.uk)
- Demo roles (SuperAdmin, AcquisitionManager, LegalOfficer, etc.)
- Sample opportunities, projects, etc.

Seeder runs only in Development environment (see Program.cs).

---

## Verification

```bash
cd backend
dotnet build
# If it compiles, infrastructure is correctly wired

dotnet ef database update --project src/BuildEstate.Infrastructure --startup-project src/BuildEstate.API
# If migration applies, database is correctly configured
```

---

*Next: Phase 8 — Building the Application Layer (CQRS, handlers, validation)...*
