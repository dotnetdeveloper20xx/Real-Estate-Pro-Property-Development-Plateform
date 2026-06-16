using BuildEstate.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.UserManagement;

/// <summary>
/// EF Core configuration for the ApplicationRole entity.
/// Configures unique constraint on Name, indexes, and property constraints.
/// </summary>
public class ApplicationRoleConfiguration : IEntityTypeConfiguration<ApplicationRole>
{
    public void Configure(EntityTypeBuilder<ApplicationRole> builder)
    {
        builder.Property(r => r.Description)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(r => r.IsBuiltIn)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        // Unique index on role name (Requirement 8.8)
        builder.HasIndex(r => r.Name).IsUnique();

        // Index on CreatedAt per database standards
        builder.HasIndex(r => r.CreatedAt);
    }
}
