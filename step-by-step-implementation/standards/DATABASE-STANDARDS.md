# BuildEstate Pro — Database Standards

## Design Philosophy
Design every table as if:
- Millions of records will exist
- Hundreds of concurrent users operate simultaneously
- Full audit trail is required for compliance
- Data will need to be archived after retention periods

---

## Required Columns (Every Entity)

Every business entity MUST include these columns via `BaseEntity`:

```csharp
public Guid Id { get; set; }           // Primary key (UUID)
public DateTime CreatedAt { get; set; } // UTC timestamp of creation
public string CreatedBy { get; set; }   // User ID who created
public DateTime? UpdatedAt { get; set; }// UTC timestamp of last update
public string? UpdatedBy { get; set; }  // User ID who last updated
public bool IsDeleted { get; set; }     // Soft delete flag
public DateTime? DeletedAt { get; set; }// When soft deleted
public string? DeletedBy { get; set; }  // Who soft deleted
public byte[] RowVersion { get; set; }  // Concurrency token
```

---

## Primary Keys
- Use `Guid` (UUID) for all entity primary keys
- Never use auto-increment integers (not safe for distributed systems)
- Generate client-side: `Guid.NewGuid()`
- Clustered index on `CreatedAt` for sequential insert performance

## Foreign Keys
- Every relationship MUST have an explicit FK constraint
- Define ON DELETE behavior explicitly
- Never allow orphaned records
- Index ALL foreign key columns

## Indexing Strategy
- Index every FK column
- Index columns used in WHERE clauses
- Index columns used in ORDER BY
- Composite indexes for common query patterns
- Unique indexes for business uniqueness constraints

```csharp
// In EF Core Configuration
builder.HasIndex(x => x.Status);
builder.HasIndex(x => x.CreatedAt);
builder.HasIndex(x => new { x.Status, x.CreatedAt });
builder.HasIndex(x => x.OpportunityId);
builder.HasIndex(x => x.Name).IsUnique();
```

---

## Soft Delete (Query Filter)

Every entity configuration MUST include:
```csharp
builder.HasQueryFilter(x => !x.IsDeleted);
```

This ensures soft-deleted records are automatically excluded from all queries.

---

## Data Types

| C# Type | SQL Type | Use For |
|---------|----------|---------|
| `Guid` | `uniqueidentifier` | Primary/foreign keys |
| `string` | `nvarchar(N)` | Text (specify max length) |
| `decimal` | `decimal(18,2)` | Money, measurements |
| `DateTime` | `datetime2(7)` | Dates and times (UTC) |
| `int` (enum) | `int` | Status fields, types |
| `bool` | `bit` | Flags |
| `byte[]` | `rowversion` | Concurrency tokens |

### Column Length Rules
- Names: `nvarchar(200)`
- Descriptions: `nvarchar(2000)`
- Notes/Comments: `nvarchar(4000)`
- File paths: `nvarchar(500)`
- Email: `nvarchar(256)`
- Phone: `nvarchar(50)`
- Never use `nvarchar(max)` unless genuinely unbounded (JSON audit)

---

## Entity Configuration Pattern

```csharp
public class LandOpportunityConfiguration : IEntityTypeConfiguration<LandOpportunity>
{
    public void Configure(EntityTypeBuilder<LandOpportunity> builder)
    {
        builder.ToTable("LandOpportunities");

        // Primary key
        builder.HasKey(x => x.Id);

        // Properties
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Location).IsRequired().HasMaxLength(500);
        builder.Property(x => x.AskingPrice).HasPrecision(18, 2);
        builder.Property(x => x.LandSize).HasPrecision(18, 4);
        builder.Property(x => x.Status).HasConversion<int>();

        // Concurrency
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

---

## Migration Rules

- One migration per logical change
- Name migrations descriptively: `AddLandOpportunityStatusIndex`
- Never modify existing migrations (they're history)
- Test migrations against realistic data volumes
- Always define both Up() and Down() methods

```bash
dotnet ef migrations add AddLandOpportunityStatusIndex \
    --project src/BuildEstate.Infrastructure \
    --startup-project src/BuildEstate.API

dotnet ef database update \
    --project src/BuildEstate.Infrastructure \
    --startup-project src/BuildEstate.API
```

---

## Audit Log Table

```
AuditLogs
├── Id (Guid, PK)
├── UserId (string)
├── UserName (string)
├── Action (string: Create, Update, Delete)
├── EntityName (string)
├── EntityId (string)
├── OldValues (nvarchar(max), JSON)
├── NewValues (nvarchar(max), JSON)
├── AffectedColumns (string)
├── Timestamp (DateTime, indexed)
├── IpAddress (string)
└── CorrelationId (string)
```

---

## Performance Rules

- Never do `SELECT *` — use projections
- Use `.AsNoTracking()` for read-only queries
- Pagination on ALL list queries
- Avoid N+1 queries — use `.Include()` or projections
- Use compiled queries for hot paths (future optimization)

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Table | PascalCase plural | `LandOpportunities`, `DueDiligences` |
| Column | PascalCase (matches C# property) | `AskingPrice`, `CreatedAt` |
| FK column | `{Entity}Id` | `OpportunityId`, `ProjectId` |
| Index | `IX_{Table}_{Columns}` | `IX_LandOpportunities_Status` |
| Unique | `UQ_{Table}_{Columns}` | `UQ_LandOpportunities_Name_Location` |
