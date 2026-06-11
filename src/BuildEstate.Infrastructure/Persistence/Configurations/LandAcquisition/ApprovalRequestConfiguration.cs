using BuildEstate.Domain.Entities.LandAcquisition;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LandAcquisition;

public class ApprovalRequestConfiguration : IEntityTypeConfiguration<ApprovalRequest>
{
    public void Configure(EntityTypeBuilder<ApprovalRequest> builder)
    {
        builder.ToTable("ApprovalRequests");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.ApproverUserId).HasMaxLength(450);
        builder.Property(x => x.ApprovalNotes).HasMaxLength(2000);
        builder.Property(x => x.RejectionReason).HasMaxLength(2000);
        builder.Property(x => x.RequestedAmount).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Indexes
        builder.HasIndex(x => x.OpportunityId);
        builder.HasIndex(x => x.Status);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
