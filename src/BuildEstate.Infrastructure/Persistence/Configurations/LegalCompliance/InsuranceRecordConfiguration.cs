using BuildEstate.Domain.Entities.LegalCompliance;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LegalCompliance;

public class InsuranceRecordConfiguration : IEntityTypeConfiguration<InsuranceRecord>
{
    public void Configure(EntityTypeBuilder<InsuranceRecord> builder)
    {
        builder.ToTable("InsuranceRecords");
        builder.HasKey(x => x.Id);

        // Property configurations
        builder.Property(x => x.PolicyNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Insurer).HasMaxLength(200).IsRequired();
        builder.Property(x => x.CoverageType).HasConversion<int>().IsRequired();
        builder.Property(x => x.CoverAmount).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.Premium).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Indexes
        builder.HasIndex(x => new { x.PolicyNumber, x.Status })
            .IsUnique()
            .HasFilter("[Status] = 0 AND [IsDeleted] = 0")
            .HasDatabaseName("IX_InsuranceRecords_PolicyNumber_Active_Unique");
        builder.HasIndex(x => x.ExpiryDate);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
