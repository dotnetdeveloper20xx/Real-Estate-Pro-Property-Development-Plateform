using BuildEstate.Domain.Entities.LegalCompliance;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LegalCompliance;

public class AuditRecordConfiguration : IEntityTypeConfiguration<AuditRecord>
{
    public void Configure(EntityTypeBuilder<AuditRecord> builder)
    {
        builder.ToTable("AuditRecords");
        builder.HasKey(x => x.Id);

        // Property configurations
        builder.Property(x => x.AuditType).HasConversion<int>().IsRequired();
        builder.Property(x => x.Scope).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.AuditorName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.Findings).HasMaxLength(3000);
        builder.Property(x => x.RiskRating).HasConversion<int?>();
        builder.Property(x => x.Recommendations).HasMaxLength(2000);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Indexes
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.AuditDate);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
