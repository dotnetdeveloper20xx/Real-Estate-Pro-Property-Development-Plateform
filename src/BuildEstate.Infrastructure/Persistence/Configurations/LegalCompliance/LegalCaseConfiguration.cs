using BuildEstate.Domain.Entities.LegalCompliance;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LegalCompliance;

public class LegalCaseConfiguration : IEntityTypeConfiguration<LegalCase>
{
    public void Configure(EntityTypeBuilder<LegalCase> builder)
    {
        builder.ToTable("LegalCases");
        builder.HasKey(x => x.Id);

        // Property configurations
        builder.Property(x => x.CaseReference).HasMaxLength(13).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.CaseType).HasConversion<int>().IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.Priority).HasConversion<int>().IsRequired();
        builder.Property(x => x.AssignedSolicitor).HasMaxLength(200);
        builder.Property(x => x.SolicitorFirm).HasMaxLength(200);
        builder.Property(x => x.SolicitorEmail).HasMaxLength(256);
        builder.Property(x => x.SolicitorPhone).HasMaxLength(50);
        builder.Property(x => x.Notes).HasMaxLength(2000);
        builder.Property(x => x.ResolutionSummary).HasMaxLength(2000);
        builder.Property(x => x.EscalationReason).HasMaxLength(1000);
        builder.Property(x => x.HoldReason).HasMaxLength(1000);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Indexes
        builder.HasIndex(x => x.CaseReference)
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.Priority);
        builder.HasIndex(x => x.OpportunityId);
        builder.HasIndex(x => x.PlanningApplicationId);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);

        // Relationships
        builder.HasMany(x => x.Contracts)
            .WithOne(x => x.LegalCase)
            .HasForeignKey(x => x.LegalCaseId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(x => x.Documents)
            .WithOne(x => x.LegalCase)
            .HasForeignKey(x => x.LegalCaseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.InsuranceRecords)
            .WithOne(x => x.LegalCase)
            .HasForeignKey(x => x.LegalCaseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
