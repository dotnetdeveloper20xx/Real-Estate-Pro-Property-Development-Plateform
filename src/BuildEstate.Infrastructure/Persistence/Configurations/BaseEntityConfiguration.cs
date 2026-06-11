using BuildEstate.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations;

/// <summary>
/// Base EF Core entity configuration that applies standard database conventions
/// to all entities inheriting from BaseEntity. Derived configurations should
/// inherit from this class to receive standard rules automatically.
/// </summary>
/// <typeparam name="T">The entity type inheriting from BaseEntity.</typeparam>
public class BaseEntityConfiguration<T> : IEntityTypeConfiguration<T> where T : BaseEntity
{
    public virtual void Configure(EntityTypeBuilder<T> builder)
    {
        // Primary key
        builder.HasKey(e => e.Id);

        // Concurrency token for optimistic concurrency control
        builder.Property(e => e.RowVersion)
            .IsConcurrencyToken();

        // Global query filter to exclude soft-deleted records
        builder.HasQueryFilter(e => !e.IsDeleted);

        // Index on CreatedAt for chronological query performance
        builder.HasIndex(e => e.CreatedAt)
            .HasDatabaseName($"IX_{typeof(T).Name}_CreatedAt");

        // Configure audit string properties with max lengths
        builder.Property(e => e.CreatedBy)
            .HasMaxLength(256);

        builder.Property(e => e.UpdatedBy)
            .HasMaxLength(256);

        builder.Property(e => e.DeletedBy)
            .HasMaxLength(256);

        // Configure all decimal properties with precision 18, scale 2
        foreach (var property in builder.Metadata.GetProperties())
        {
            if (property.ClrType == typeof(decimal) || property.ClrType == typeof(decimal?))
            {
                property.SetPrecision(18);
                property.SetScale(2);
            }
        }
    }
}
