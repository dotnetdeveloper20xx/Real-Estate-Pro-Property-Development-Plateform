using BuildEstate.Domain.Entities.LandAcquisition;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LandAcquisition;

public class FeasibilityAssessmentConfiguration : IEntityTypeConfiguration<FeasibilityAssessment>
{
    public void Configure(EntityTypeBuilder<FeasibilityAssessment> builder)
    {
        builder.ToTable("FeasibilityAssessments");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.EstimatedLandCost).HasPrecision(18, 2);
        builder.Property(x => x.EstimatedBuildCost).HasPrecision(18, 2);
        builder.Property(x => x.ProfessionalFees).HasPrecision(18, 2);
        builder.Property(x => x.FinanceCosts).HasPrecision(18, 2);
        builder.Property(x => x.ExpectedSalesRevenue).HasPrecision(18, 2);
        builder.Property(x => x.TotalCosts).HasPrecision(18, 2);
        builder.Property(x => x.EstimatedProfit).HasPrecision(18, 2);
        builder.Property(x => x.RoiPercentage).HasPrecision(18, 2);
        builder.Property(x => x.Scenario).HasConversion<int>();
        builder.Property(x => x.IsReadyForReview).HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Index on FK
        builder.HasIndex(x => x.OpportunityId);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
