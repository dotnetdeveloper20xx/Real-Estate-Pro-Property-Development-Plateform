using BuildEstate.Domain.Entities.LegalCompliance;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LegalCompliance;

public class ComplianceCheckConfiguration : IEntityTypeConfiguration<ComplianceCheck>
{
    public void Configure(EntityTypeBuilder<ComplianceCheck> builder)
    {
        builder.ToTable("ComplianceChecks");
        builder.HasKey(x => x.Id);

        // Property configurations
        builder.Property(x => x.Outcome).HasConversion<int>().IsRequired();
        builder.Property(x => x.Findings).HasMaxLength(3000).IsRequired();
        builder.Property(x => x.EvidenceReference).HasMaxLength(500);
        builder.Property(x => x.RemediationPlan).HasMaxLength(2000);
        builder.Property(x => x.ReviewerUserId).HasMaxLength(256).IsRequired();
        builder.Property(x => x.ReviewerName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Indexes
        builder.HasIndex(x => new { x.ComplianceRequirementId, x.CheckDate });

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
