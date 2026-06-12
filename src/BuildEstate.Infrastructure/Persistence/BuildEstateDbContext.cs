using System.Reflection;
using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Infrastructure.Identity;
using BuildEstate.Infrastructure.Persistence.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

using LandAcquisitionContract = BuildEstate.Domain.Entities.LandAcquisition.Contract;
using LegalContract = BuildEstate.Domain.Entities.LegalCompliance.Contract;

namespace BuildEstate.Infrastructure.Persistence;

public class BuildEstateDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
{
    public BuildEstateDbContext(DbContextOptions<BuildEstateDbContext> options)
        : base(options)
    {
    }

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // Land Acquisition entities
    public DbSet<LandOpportunity> LandOpportunities => Set<LandOpportunity>();
    public DbSet<LandOwner> LandOwners => Set<LandOwner>();
    public DbSet<DueDiligence> DueDiligences => Set<DueDiligence>();
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<LandAcquisitionContract> Contracts => Set<LandAcquisitionContract>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<LandAcquisitionRecord> LandAcquisitions => Set<LandAcquisitionRecord>();
    public DbSet<FeasibilityAssessment> FeasibilityAssessments => Set<FeasibilityAssessment>();
    public DbSet<ApprovalRequest> ApprovalRequests => Set<ApprovalRequest>();
    public DbSet<Notification> Notifications => Set<Notification>();

    // Planning & Approvals entities
    public DbSet<PlanningApplication> PlanningApplications => Set<PlanningApplication>();
    public DbSet<CouncilContact> CouncilContacts => Set<CouncilContact>();
    public DbSet<PlanningCondition> PlanningConditions => Set<PlanningCondition>();
    public DbSet<PlanningAppeal> PlanningAppeals => Set<PlanningAppeal>();
    public DbSet<PlanningDocument> PlanningDocuments => Set<PlanningDocument>();
    public DbSet<PlanningFee> PlanningFees => Set<PlanningFee>();
    public DbSet<PlanningMilestone> PlanningMilestones => Set<PlanningMilestone>();

    // Legal & Compliance entities
    public DbSet<LegalCase> LegalCases => Set<LegalCase>();
    public DbSet<LegalContract> LegalContracts => Set<LegalContract>();
    public DbSet<ComplianceRequirement> ComplianceRequirements => Set<ComplianceRequirement>();
    public DbSet<ComplianceCheck> ComplianceChecks => Set<ComplianceCheck>();
    public DbSet<InsuranceRecord> InsuranceRecords => Set<InsuranceRecord>();
    public DbSet<AuditRecord> AuditRecords => Set<AuditRecord>();
    public DbSet<LegalDocument> LegalDocuments => Set<LegalDocument>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        EnforceAuditLogAppendOnly();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override int SaveChanges()
    {
        EnforceAuditLogAppendOnly();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        EnforceAuditLogAppendOnly();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    public override Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        EnforceAuditLogAppendOnly();
        return base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Enforces append-only semantics for AuditLog entities.
    /// Any attempt to modify or delete an AuditLog record is rejected.
    /// </summary>
    private void EnforceAuditLogAppendOnly()
    {
        var auditLogEntries = ChangeTracker.Entries<AuditLog>()
            .Where(e => e.State == EntityState.Modified || e.State == EntityState.Deleted);

        if (auditLogEntries.Any())
        {
            throw new InvalidOperationException(
                "AuditLog records are append-only. Modification or deletion of audit log entries is not permitted.");
        }
    }
}
