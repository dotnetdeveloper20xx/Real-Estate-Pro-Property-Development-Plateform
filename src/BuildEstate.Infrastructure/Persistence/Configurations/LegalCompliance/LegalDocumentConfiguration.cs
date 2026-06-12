using BuildEstate.Domain.Entities.LegalCompliance;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LegalCompliance;

public class LegalDocumentConfiguration : IEntityTypeConfiguration<LegalDocument>
{
    public void Configure(EntityTypeBuilder<LegalDocument> builder)
    {
        builder.ToTable("LegalDocuments");
        builder.HasKey(x => x.Id);

        // Property configurations
        builder.Property(x => x.DocumentType).HasConversion<int>().IsRequired();
        builder.Property(x => x.ConfidentialityLevel).HasConversion<int>().IsRequired();
        builder.Property(x => x.FileName).HasMaxLength(255).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.StoragePath).HasMaxLength(500).IsRequired();
        builder.Property(x => x.UploadedBy).HasMaxLength(256).IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Indexes
        builder.HasIndex(x => x.LegalCaseId);
        builder.HasIndex(x => x.ContractId);
        builder.HasIndex(x => x.DocumentType);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
