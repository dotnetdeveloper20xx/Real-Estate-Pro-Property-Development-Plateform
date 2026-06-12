using BuildEstate.Domain.Entities.PlanningApprovals;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.PlanningApprovals;

public class PlanningAppealConfiguration : IEntityTypeConfiguration<PlanningAppeal>
{
    public void Configure(EntityTypeBuilder<PlanningAppeal> builder)
    {
        builder.ToTable("PlanningAppeals");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.AppealGrounds).HasMaxLength(5000).IsRequired();
        builder.Property(x => x.AppealType).HasConversion<int>().IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.AppealOutcomeType).HasConversion<int?>();
        builder.Property(x => x.DecisionSummary).HasMaxLength(2000);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);

        // Relationship configured from PlanningApplicationConfiguration (owning side)
    }
}
