using BuildEstate.Domain.Entities.PlanningApprovals;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.PlanningApprovals;

public class CouncilContactConfiguration : IEntityTypeConfiguration<CouncilContact>
{
    public void Configure(EntityTypeBuilder<CouncilContact> builder)
    {
        builder.ToTable("CouncilContacts");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.CouncilName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.PlanningOfficerName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Address).HasMaxLength(500).IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);

        // Relationship configured from PlanningApplicationConfiguration (owning side)
    }
}
