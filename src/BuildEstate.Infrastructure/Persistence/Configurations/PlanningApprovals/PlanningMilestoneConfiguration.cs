using BuildEstate.Domain.Entities.PlanningApprovals;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.PlanningApprovals;

public class PlanningMilestoneConfiguration : IEntityTypeConfiguration<PlanningMilestone>
{
    public void Configure(EntityTypeBuilder<PlanningMilestone> builder)
    {
        builder.ToTable("PlanningMilestones");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.MilestoneType).HasConversion<int>().IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Composite unique constraint: one milestone type per application
        builder.HasIndex(x => new { x.ApplicationId, x.MilestoneType })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);

        // Relationship configured from PlanningApplicationConfiguration (owning side)
    }
}
