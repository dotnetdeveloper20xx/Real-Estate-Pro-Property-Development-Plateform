using BuildEstate.Domain.Entities.UserManagement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.UserManagement;

public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("Permissions");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(p => p.DisplayName)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(p => p.DomainArea)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(p => p.Description)
            .HasMaxLength(512);

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        // Unique index on permission name
        builder.HasIndex(p => p.Name).IsUnique();

        // Index for domain area grouping queries
        builder.HasIndex(p => p.DomainArea);
    }
}
