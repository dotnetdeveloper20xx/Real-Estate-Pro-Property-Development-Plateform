using BuildEstate.Domain.Entities.Search;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.Search;

public class PinnedItemConfiguration : IEntityTypeConfiguration<PinnedItem>
{
    public void Configure(EntityTypeBuilder<PinnedItem> builder)
    {
        builder.ToTable("PinnedItems");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId).HasMaxLength(256).IsRequired();
        builder.Property(x => x.EntityId).IsRequired();
        builder.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Subtitle).HasMaxLength(500);
        builder.Property(x => x.Icon).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Category).HasMaxLength(100).IsRequired();
        builder.Property(x => x.NavigationRoute).HasMaxLength(500).IsRequired();
        builder.Property(x => x.PinnedAt).IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Audit columns
        builder.Property(x => x.CreatedBy).HasMaxLength(256);
        builder.Property(x => x.UpdatedBy).HasMaxLength(256);
        builder.Property(x => x.DeletedBy).HasMaxLength(256);

        // Unique composite index to prevent duplicate pins (one pin per user per entity)
        builder.HasIndex(x => new { x.UserId, x.EntityId })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0")
            .HasDatabaseName("IX_PinnedItems_UserId_EntityId");

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
