using BuildEstate.Domain.Entities.LegalCompliance;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LegalCompliance;

public class ComplianceRequirementConfiguration : IEntityTypeConfiguration<ComplianceRequirement>
{
    public void Configure(EntityTypeBuilder<ComplianceRequirement> builder)
    {
        builder.ToTable("ComplianceRequirements");
        builder.HasKey(x => x.Id);

        // Property configurations
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Category).HasConversion<int>().IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.SourceRegulation).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Frequency).HasConversion<int>().IsRequired();
        builder.Property(x => x.ResponsibleRole).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.RetirementReason).HasMaxLength(1000);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Indexes
        builder.HasIndex(x => new { x.Category, x.Name })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);

        // Relationships
        builder.HasMany(x => x.Checks)
            .WithOne(x => x.ComplianceRequirement)
            .HasForeignKey(x => x.ComplianceRequirementId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
