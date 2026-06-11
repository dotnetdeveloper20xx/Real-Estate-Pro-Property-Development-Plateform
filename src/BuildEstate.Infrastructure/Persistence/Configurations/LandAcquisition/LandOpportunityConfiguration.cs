using BuildEstate.Domain.Entities.LandAcquisition;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LandAcquisition;

public class LandOpportunityConfiguration : IEntityTypeConfiguration<LandOpportunity>
{
    public void Configure(EntityTypeBuilder<LandOpportunity> builder)
    {
        builder.ToTable("LandOpportunities");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Location).HasMaxLength(500).IsRequired();
        builder.Property(x => x.LandSize).HasPrecision(18, 4).IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.Source).HasMaxLength(200);
        builder.Property(x => x.WithdrawalReason).HasMaxLength(1000);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Unique constraint: Name + Location combination (active records only)
        builder.HasIndex(x => new { x.Name, x.Location })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        // Query indexes
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.CreatedAt);
        builder.HasIndex(x => new { x.Status, x.CreatedAt });

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);

        // Relationships
        builder.HasOne(x => x.LandOwner)
            .WithOne(x => x.Opportunity)
            .HasForeignKey<LandOwner>(x => x.OpportunityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.DueDiligences)
            .WithOne(x => x.Opportunity)
            .HasForeignKey(x => x.OpportunityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Offers)
            .WithOne(x => x.Opportunity)
            .HasForeignKey(x => x.OpportunityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Contract)
            .WithOne(x => x.Opportunity)
            .HasForeignKey<Contract>(x => x.OpportunityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Documents)
            .WithOne(x => x.Opportunity)
            .HasForeignKey(x => x.OpportunityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Acquisition)
            .WithOne(x => x.Opportunity)
            .HasForeignKey<LandAcquisitionRecord>(x => x.OpportunityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.FeasibilityAssessment)
            .WithOne(x => x.Opportunity)
            .HasForeignKey<FeasibilityAssessment>(x => x.OpportunityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.ApprovalRequests)
            .WithOne(x => x.Opportunity)
            .HasForeignKey(x => x.OpportunityId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
