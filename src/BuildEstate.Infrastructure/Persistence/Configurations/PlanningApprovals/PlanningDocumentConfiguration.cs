using BuildEstate.Domain.Entities.PlanningApprovals;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.PlanningApprovals;

public class PlanningDocumentConfiguration : IEntityTypeConfiguration<PlanningDocument>
{
    public void Configure(EntityTypeBuilder<PlanningDocument> builder)
    {
        builder.ToTable("PlanningDocuments");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.DocumentType).HasConversion<int>().IsRequired();
        builder.Property(x => x.FileName).HasMaxLength(256).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.StoragePath).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.UploadedBy).HasMaxLength(256).IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Index for querying documents by application and type
        builder.HasIndex(x => new { x.ApplicationId, x.DocumentType });

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);

        // Relationship configured from PlanningApplicationConfiguration (owning side)
    }
}
