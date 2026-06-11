using BuildEstate.Domain.Entities.LandAcquisition;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LandAcquisition;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.ToTable("Documents");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.DocType).HasConversion<int>().IsRequired();
        builder.Property(x => x.FileName).HasMaxLength(500).IsRequired();
        builder.Property(x => x.FilePath).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.FileSizeBytes).IsRequired();
        builder.Property(x => x.UploadedAt).IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Indexes
        builder.HasIndex(x => x.OpportunityId);
        builder.HasIndex(x => new { x.OpportunityId, x.DocType });

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
