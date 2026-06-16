using BuildEstate.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.UserId)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(t => t.Token)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(t => t.ExpiresAt)
            .IsRequired();

        builder.Property(t => t.IsUsed)
            .HasDefaultValue(false);

        builder.Property(t => t.UsedAt)
            .IsRequired(false);

        builder.Property(t => t.IsRevoked)
            .HasDefaultValue(false);

        builder.Property(t => t.CreatedAt)
            .IsRequired();

        // Indexes for common query patterns
        builder.HasIndex(t => t.Token).IsUnique();
        builder.HasIndex(t => t.UserId);
        builder.HasIndex(t => t.CreatedAt);
        builder.HasIndex(t => new { t.UserId, t.IsUsed, t.IsRevoked });

        builder.Property(t => t.DeviceInfo)
            .IsRequired()
            .HasMaxLength(512);

        builder.Property(t => t.IpAddress)
            .IsRequired()
            .HasMaxLength(45);

        // Relationship to ApplicationUser
        builder.HasOne(t => t.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
