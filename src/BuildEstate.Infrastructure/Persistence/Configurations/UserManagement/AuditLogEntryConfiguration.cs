using BuildEstate.Domain.Entities.UserManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.UserManagement;

public class AuditLogEntryConfiguration : IEntityTypeConfiguration<AuditLogEntry>
{
    public void Configure(EntityTypeBuilder<AuditLogEntry> builder)
    {
        builder.ToTable("AuditLogEntries");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Timestamp)
            .IsRequired();

        builder.Property(a => a.Action)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(a => a.PerformedByUserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(a => a.PerformedByUserName)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(a => a.TargetEntityType)
            .HasMaxLength(128);

        builder.Property(a => a.TargetEntityId)
            .HasMaxLength(450);

        builder.Property(a => a.TargetUserName)
            .HasMaxLength(256);

        builder.Property(a => a.IpAddress)
            .IsRequired()
            .HasMaxLength(45);

        builder.Property(a => a.OldValues)
            .HasMaxLength(4000);

        builder.Property(a => a.NewValues)
            .HasMaxLength(4000);

        builder.Property(a => a.AffectedFields)
            .HasMaxLength(2000);

        builder.Property(a => a.CorrelationId)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(a => a.Details)
            .HasMaxLength(4000);

        // Indexes for common query patterns
        builder.HasIndex(a => a.Timestamp);
        builder.HasIndex(a => a.Action);
        builder.HasIndex(a => a.PerformedByUserId);
        builder.HasIndex(a => new { a.Timestamp, a.Action });
        builder.HasIndex(a => a.CorrelationId);
    }
}
