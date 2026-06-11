using BuildEstate.Domain.Entities.LandAcquisition;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LandAcquisition;

public class DueDiligenceConfiguration : IEntityTypeConfiguration<DueDiligence>
{
    public void Configure(EntityTypeBuilder<DueDiligence> builder)
    {
        builder.ToTable("DueDiligences");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Type).HasConversion<int>().IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.Findings).HasMaxLength(4000);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Indexes
        builder.HasIndex(x => x.OpportunityId);
        builder.HasIndex(x => new { x.OpportunityId, x.Type });
        builder.HasIndex(x => x.Status);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
