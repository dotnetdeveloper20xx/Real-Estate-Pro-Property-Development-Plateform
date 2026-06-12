using BuildEstate.Domain.Entities.PlanningApprovals;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.PlanningApprovals;

public class PlanningFeeConfiguration : IEntityTypeConfiguration<PlanningFee>
{
    public void Configure(EntityTypeBuilder<PlanningFee> builder)
    {
        builder.ToTable("PlanningFees");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.Property(x => x.FeeType).HasConversion<int>().IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500).IsRequired();
        builder.Property(x => x.PaymentStatus).HasConversion<int>().IsRequired();
        builder.Property(x => x.ApprovedBy).HasMaxLength(256);
        builder.Property(x => x.ApprovalNotes).HasMaxLength(1000);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Index for querying fees by application and payment status
        builder.HasIndex(x => new { x.ApplicationId, x.PaymentStatus });

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);

        // Relationship configured from PlanningApplicationConfiguration (owning side)
    }
}
