using BuildEstate.Domain.Entities.LandAcquisition;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LandAcquisition;

public class LandAcquisitionConfiguration : IEntityTypeConfiguration<LandAcquisitionRecord>
{
    public void Configure(EntityTypeBuilder<LandAcquisitionRecord> builder)
    {
        builder.ToTable("LandAcquisitions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.PurchasePrice).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.CompletionDate).IsRequired();
        builder.Property(x => x.RegistryRef).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Unique index: one active acquisition per opportunity
        builder.HasIndex(x => x.OpportunityId)
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
