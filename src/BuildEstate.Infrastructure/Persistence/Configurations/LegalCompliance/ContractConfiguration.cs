using BuildEstate.Domain.Entities.LegalCompliance;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BuildEstate.Infrastructure.Persistence.Configurations.LegalCompliance;

public class ContractConfiguration : IEntityTypeConfiguration<Contract>
{
    public void Configure(EntityTypeBuilder<Contract> builder)
    {
        builder.ToTable("Contracts_Legal");
        builder.HasKey(x => x.Id);

        // Property configurations
        builder.Property(x => x.ContractReference).HasMaxLength(14).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.ContractType).HasConversion<int>().IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.CounterpartyName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.ContractValue).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.Property(x => x.TerminationClause).HasMaxLength(1000);
        builder.Property(x => x.SpecialConditions).HasMaxLength(2000);
        builder.Property(x => x.PaymentTerms).HasMaxLength(500);
        builder.Property(x => x.SignatoryNames).HasMaxLength(500);
        builder.Property(x => x.TerminationReason).HasMaxLength(1000);
        builder.Property(x => x.ApproverUserId).HasMaxLength(256);
        builder.Property(x => x.ApprovalNotes).HasMaxLength(1000);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Indexes
        builder.HasIndex(x => x.ContractReference)
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");
        builder.HasIndex(x => x.LegalCaseId);
        builder.HasIndex(x => x.Status);

        // Soft delete filter
        builder.HasQueryFilter(x => !x.IsDeleted);

        // Relationships
        builder.HasMany(x => x.Documents)
            .WithOne(x => x.Contract)
            .HasForeignKey(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
