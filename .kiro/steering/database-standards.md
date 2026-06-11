# BuildEstate Pro — Database Standards (Enterprise Grade)

## Design Assumptions
Design every table as if:
- Millions of records will exist
- Hundreds of concurrent users operate simultaneously
- Reporting requirements will grow exponentially
- Full audit trail is required for compliance
- Data will need to be archived after retention periods

## Required Columns (Every Entity)
Every business entity must include:

```csharp
public Guid Id { get; set; }           // Primary key (never auto-increment for distributed)
public DateTime CreatedAt { get; set; } // UTC timestamp
public string CreatedBy { get; set; }   // User ID who created
public DateTime? UpdatedAt { get; set; }// UTC timestamp of last update
public string? UpdatedBy { get; set; }  // User ID who last updated
public bool IsDeleted { get; set; }     // Soft delete flag
public DateTime? DeletedAt { get; set; }// When soft deleted
public string? DeletedBy { get; set; }  // Who soft deleted
```

## Primary Keys
- Use `Guid` (UUID) for all entity primary keys
- Never use auto-increment integers (not distributed-safe)
- Generate on the client side: `Guid.NewGuid()`
- Clustered index on a sequential-friendly column where needed (CreatedAt)

## Foreign Keys
- Every relationship must have an explicit FK constraint
- Define ON DELETE behavior explicitly (Cascade, SetNull, Restrict)
- Never allow orphaned records
- Index all foreign key columns

## Indexing Strategy
- Index every FK column
- Index columns used in WHERE clauses frequently
- Index columns used in ORDER BY
- Composite indexes for common query patterns
- Unique indexes for business uniqueness constraints
- Review execution plans before approving complex queries
- Never create unnecessary indexes (they slow writes)

### Standard Index Pattern
```csharp
// In EF Core configuration
builder.HasIndex(x => x.Status);
builder.HasIndex(x => x.CreatedAt);
builder.HasIndex(x => new { x.Status, x.CreatedAt }); // Composite for filtered date queries
builder.HasIndex(x => x.OpportunityId);               // FK index
builder.HasIndex(x => x.Name).IsUnique();              // Business uniqueness
```

## Unique Constraints
- Business-meaningful uniqueness (e.g., no two opportunities with same name + location)
- Email addresses must be unique per tenant
- Reference numbers must be unique
- Use composite unique indexes where appropriate

## Query Filter (Soft Delete)
Every entity configuration must include:
```csharp
builder.HasQueryFilter(x => !x.IsDeleted);
```
This ensures soft-deleted records are excluded from all queries by default.

## Data Integrity
- Use appropriate column lengths (don't default to MAX)
- Use precision/scale for decimal columns (`HasPrecision(18, 2)`)
- Use enums mapped to int for status fields
- Never store JSON in columns unless absolutely necessary (and document why)
- Use proper data types: DateTime for dates, decimal for money, Guid for IDs

## Naming Conventions
- Tables: PascalCase plural (`LandOpportunities`, `DueDiligences`)
- Columns: PascalCase matching C# property names
- FK columns: `{EntityName}Id` (e.g., `OpportunityId`)
- Indexes: `IX_{TableName}_{Column1}_{Column2}`
- Unique constraints: `UQ_{TableName}_{Column1}`

## Performance Considerations
- Never do `SELECT *` — only select needed columns (use projections)
- Use `.AsNoTracking()` for read-only queries
- Use pagination on all list queries
- Avoid N+1 queries — use `.Include()` or explicit projections
- Use compiled queries for hot paths
- Consider read replicas for reporting queries (future)

## Migration Standards
- One migration per logical change
- Migrations must be reversible (define Down method)
- Never modify existing migrations
- Test migrations against production-like data volumes
- Name migrations descriptively: `AddLandOpportunityStatusIndex`

## Audit Table Design
The AuditLog table captures all mutations:
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

## Multi-Tenancy Considerations (Future)
- Design for tenant isolation from day one
- TenantId column on relevant entities
- Query filters per tenant
- Data cannot leak between tenants
