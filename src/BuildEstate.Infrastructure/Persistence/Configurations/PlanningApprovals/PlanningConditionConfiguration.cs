using BuildEstate.Domain.Entities.PlanningApprovals;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.PlanningApprovals;

public class PlanningConditionConfiguration : IEntityTypeConfiguration<PlanningCondition>
{
    public void Configure(EntityTypeBuilder<PlanningCondition> builder)
    {
        builder.ToTable("PlanningConditions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Description).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.ConditionType).HasConversion<int>().IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.DischargeReference).HasMaxLength(50);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Composite unique constraint: one condition number per application
        builder.HasIndex(x => new { x.ApplicationId, x.ConditionNumber })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);

        // Relationship configured from PlanningApplicationConfiguration (owning side)
    }
}
