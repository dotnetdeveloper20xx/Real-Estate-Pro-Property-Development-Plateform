using BuildEstate.Domain.Entities.LandAcquisition;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LandAcquisition;

public class ContractConfiguration : IEntityTypeConfiguration<Contract>
{
    public void Configure(EntityTypeBuilder<Contract> builder)
    {
        builder.ToTable("Contracts");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.SolicitorName).HasMaxLength(200);
        builder.Property(x => x.SolicitorFirm).HasMaxLength(200);
        builder.Property(x => x.SolicitorContact).HasMaxLength(200);
        builder.Property(x => x.DepositAmount).HasPrecision(18, 2);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Index on FK
        builder.HasIndex(x => x.OpportunityId);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
