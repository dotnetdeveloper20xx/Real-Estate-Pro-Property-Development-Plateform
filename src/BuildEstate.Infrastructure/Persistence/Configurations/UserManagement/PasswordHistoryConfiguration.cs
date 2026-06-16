using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.UserManagement;

public class PasswordHistoryConfiguration : IEntityTypeConfiguration<PasswordHistory>
{
    public void Configure(EntityTypeBuilder<PasswordHistory> builder)
    {
        builder.ToTable("PasswordHistories");

        builder.HasKey(ph => ph.Id);

        builder.Property(ph => ph.UserId)
            .IsRequired()
            .HasMaxLength(450);

        builder.Property(ph => ph.PasswordHash)
            .IsRequired()
            .HasMaxLength(512);

        builder.Property(ph => ph.CreatedAt)
            .IsRequired();

        // Indexes for query patterns
        builder.HasIndex(ph => ph.UserId);
        builder.HasIndex(ph => new { ph.UserId, ph.CreatedAt });

        // Relationship to ApplicationUser
        builder.HasOne<ApplicationUser>()
            .WithMany(u => u.PasswordHistories)
            .HasForeignKey(ph => ph.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
