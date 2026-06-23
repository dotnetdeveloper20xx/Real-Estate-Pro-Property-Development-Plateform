using BuildEstate.Domain.Entities.Search;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.Search;

public class RecentSearchConfiguration : IEntityTypeConfiguration<RecentSearch>
{
    public void Configure(EntityTypeBuilder<RecentSearch> builder)
    {
        builder.ToTable("RecentSearches");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Query).HasMaxLength(200).IsRequired();
        builder.Property(x => x.ResultCount).IsRequired();
        builder.Property(x => x.SearchedAt).IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Audit columns
        builder.Property(x => x.CreatedBy).HasMaxLength(256);
        builder.Property(x => x.UpdatedBy).HasMaxLength(256);
        builder.Property(x => x.DeletedBy).HasMaxLength(256);

        // Composite index for efficient user-scoped recent queries (ordered by most recent)
        builder.HasIndex(x => new { x.UserId, x.SearchedAt })
            .HasDatabaseName("IX_RecentSearches_UserId_SearchedAt")
            .IsDescending(false, true);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
