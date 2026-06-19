using BuildEstate.Domain.Entities.LandAcquisition;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LandAcquisition;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.RecipientUserId).HasMaxLength(450).IsRequired();
        builder.Property(x => x.EventType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Module).HasMaxLength(100).HasDefaultValue("");
        builder.Property(x => x.Title).HasMaxLength(500).HasDefaultValue("");
        builder.Property(x => x.Message).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.Icon).HasMaxLength(100).HasDefaultValue("notifications");
        builder.Property(x => x.Severity).HasMaxLength(50).HasDefaultValue("Info");
        builder.Property(x => x.Priority).HasMaxLength(50).HasDefaultValue("Normal");
        builder.Property(x => x.RelatedEntityType).HasMaxLength(200).HasDefaultValue("");
        builder.Property(x => x.RelatedUrl).HasMaxLength(500).HasDefaultValue("");
        builder.Property(x => x.Channel).HasMaxLength(50).HasDefaultValue("InApp");
        builder.Property(x => x.DeliveryStatus).HasMaxLength(50).HasDefaultValue("Delivered");
        builder.Property(x => x.SentAt).IsRequired();
        builder.Property(x => x.IsRead).HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Indexes
        builder.HasIndex(x => x.RecipientUserId);
        builder.HasIndex(x => new { x.RecipientUserId, x.IsRead });
        builder.HasIndex(x => x.SentAt);
        builder.HasIndex(x => x.Module);
        builder.HasIndex(x => x.EventType);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
