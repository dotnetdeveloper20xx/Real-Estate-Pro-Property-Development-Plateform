using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.PlanningApprovals;

public class PlanningApplicationConfiguration : IEntityTypeConfiguration<PlanningApplication>
{
    public void Configure(EntityTypeBuilder<PlanningApplication> builder)
    {
        builder.ToTable("PlanningApplications");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Description).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.ApplicationType).HasConversion<int>().IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.ApplicationReference).HasMaxLength(50);
        builder.Property(x => x.CouncilName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.WithdrawalReason).HasMaxLength(2000);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Query indexes
        builder.HasIndex(x => new { x.Status, x.CreatedAt });
        builder.HasIndex(x => x.OpportunityId);

        // Unique constraint: one active application per opportunity
        // Status NOT IN (Withdrawn = 9, Refused = 7) and IsDeleted = 0
        builder.HasIndex(x => x.OpportunityId)
            .IsUnique()
            .HasFilter("[Status] NOT IN (9, 7) AND [IsDeleted] = 0")
            .HasDatabaseName("IX_PlanningApplications_OpportunityId_ActiveUnique");

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);

        // Relationships
        builder.HasOne(x => x.CouncilContact)
            .WithOne(x => x.Application)
            .HasForeignKey<CouncilContact>(x => x.ApplicationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Conditions)
            .WithOne(x => x.Application)
            .HasForeignKey(x => x.ApplicationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Appeals)
            .WithOne(x => x.Application)
            .HasForeignKey(x => x.ApplicationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Documents)
            .WithOne(x => x.Application)
            .HasForeignKey(x => x.ApplicationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Fees)
            .WithOne(x => x.Application)
            .HasForeignKey(x => x.ApplicationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Milestones)
            .WithOne(x => x.Application)
            .HasForeignKey(x => x.ApplicationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
