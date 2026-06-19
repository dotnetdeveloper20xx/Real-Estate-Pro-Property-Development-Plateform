using BuildEstate.Domain.Entities.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.Notifications;

public class NotificationTemplateConfiguration : IEntityTypeConfiguration<NotificationTemplate>
{
    public void Configure(EntityTypeBuilder<NotificationTemplate> builder)
    {
        builder.ToTable("NotificationTemplates");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.EventType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.TitleTemplate).HasMaxLength(500).IsRequired();
        builder.Property(x => x.BodyTemplate).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.IconName).HasMaxLength(50);
        builder.Property(x => x.Severity).HasConversion<int>();
        builder.Property(x => x.Variables).HasMaxLength(1000);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.HasIndex(x => x.EventType);
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
