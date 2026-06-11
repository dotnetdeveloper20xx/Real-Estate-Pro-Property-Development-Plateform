using BuildEstate.Domain.Entities.LandAcquisition;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LandAcquisition;

public class LandOwnerConfiguration : IEntityTypeConfiguration<LandOwner>
{
    public void Configure(EntityTypeBuilder<LandOwner> builder)
    {
        builder.ToTable("LandOwners");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.ContactDetails).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Address).HasMaxLength(500);
        builder.Property(x => x.OwnershipType).HasConversion<int>().IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Index on FK
        builder.HasIndex(x => x.OpportunityId);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
