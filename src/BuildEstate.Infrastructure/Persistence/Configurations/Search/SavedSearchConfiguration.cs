using BuildEstate.Domain.Entities.Search;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.Search;

public class SavedSearchConfiguration : IEntityTypeConfiguration<SavedSearch>
{
    public void Configure(EntityTypeBuilder<SavedSearch> builder)
    {
        builder.ToTable("SavedSearches");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Query).HasMaxLength(200).IsRequired();
        builder.Property(x => x.FiltersJson).HasMaxLength(4000).IsRequired();
        builder.Property(x => x.SavedAt).IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Audit columns
        builder.Property(x => x.CreatedBy).HasMaxLength(256);
        builder.Property(x => x.UpdatedBy).HasMaxLength(256);
        builder.Property(x => x.DeletedBy).HasMaxLength(256);

        // Index for user-scoped saved search retrieval
        builder.HasIndex(x => x.UserId)
            .HasDatabaseName("IX_SavedSearches_UserId");

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
