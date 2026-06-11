using BuildEstate.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for the AuditLog entity.
/// Configures max lengths, primary key, and indexes for query performance.
/// </summary>
public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");

        // Primary key
        builder.HasKey(a => a.Id);

        // String property max lengths
        builder.Property(a => a.UserId)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(a => a.UserName)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(a => a.Action)
            .IsRequired()
            .HasMaxLength(10); // "Create", "Update", "Delete"

        builder.Property(a => a.EntityName)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(a => a.EntityId)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(a => a.OldValues)
            .HasMaxLength(4000);

        builder.Property(a => a.NewValues)
            .HasMaxLength(4000);

        builder.Property(a => a.AffectedColumns)
            .HasMaxLength(2000);

        builder.Property(a => a.Timestamp)
            .IsRequired();

        builder.Property(a => a.IpAddress)
            .HasMaxLength(45);

        builder.Property(a => a.CorrelationId)
            .HasMaxLength(128);

        // Index on Timestamp for chronological query performance
        builder.HasIndex(a => a.Timestamp)
            .HasDatabaseName("IX_AuditLogs_Timestamp");

        // Composite index on EntityName + EntityId for entity-specific audit queries
        builder.HasIndex(a => new { a.EntityName, a.EntityId })
            .HasDatabaseName("IX_AuditLogs_EntityName_EntityId");
    }
}
