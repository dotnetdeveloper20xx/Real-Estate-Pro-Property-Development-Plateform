using BuildEstate.Domain.Entities.LandAcquisition;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LandAcquisition;

public class OfferConfiguration : IEntityTypeConfiguration<Offer>
{
    public void Configure(EntityTypeBuilder<Offer> builder)
    {
        builder.ToTable("Offers");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.Property(x => x.OfferDate).IsRequired();
        builder.Property(x => x.ValidUntil).IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.CounterOfferAmount).HasPrecision(18, 2);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Self-referencing FK for counter-offers
        builder.HasOne(x => x.OriginalOffer)
            .WithMany()
            .HasForeignKey(x => x.OriginalOfferId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(x => x.OpportunityId);
        builder.HasIndex(x => new { x.OpportunityId, x.Status });
        builder.HasIndex(x => x.ValidUntil);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
