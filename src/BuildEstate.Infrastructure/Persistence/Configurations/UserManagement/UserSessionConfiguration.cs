using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.UserManagement;

public class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.ToTable("UserSessions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.UserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(s => s.DeviceInfo)
            .IsRequired()
            .HasMaxLength(512);

        builder.Property(s => s.Browser)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(s => s.OperatingSystem)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(s => s.IpAddress)
            .IsRequired()
            .HasMaxLength(45);

        builder.Property(s => s.City)
            .HasMaxLength(128);

        builder.Property(s => s.Country)
            .HasMaxLength(128);

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        builder.Property(s => s.LastActiveAt)
            .IsRequired();

        builder.Property(s => s.ExpiresAt)
            .IsRequired();

        builder.Property(s => s.RevokedReason)
            .HasMaxLength(512);

        // Indexes for common query patterns
        builder.HasIndex(s => s.UserId);
        builder.HasIndex(s => s.CreatedAt);
        builder.HasIndex(s => new { s.UserId, s.IsRevoked });

        // Relationship to ApplicationUser
        builder.HasOne<ApplicationUser>()
            .WithMany(u => u.Sessions)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
