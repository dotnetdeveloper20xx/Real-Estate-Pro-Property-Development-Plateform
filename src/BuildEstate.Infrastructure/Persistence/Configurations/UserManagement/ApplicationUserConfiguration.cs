using BuildEstate.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.UserManagement;

/// <summary>
/// EF Core configuration for the ApplicationUser entity.
/// Configures custom properties, indexes on audit/query columns, and property constraints.
/// </summary>
public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(u => u.FirstName)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(u => u.LastName)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(u => u.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(u => u.CreatedAt)
            .IsRequired();

        builder.Property(u => u.CreatedBy)
            .HasMaxLength(450);

        builder.Property(u => u.UpdatedBy)
            .HasMaxLength(450);

        // Indexes per database standards
        builder.HasIndex(u => u.CreatedAt);
        builder.HasIndex(u => u.IsActive);
        builder.HasIndex(u => u.Email).IsUnique();
    }
}
