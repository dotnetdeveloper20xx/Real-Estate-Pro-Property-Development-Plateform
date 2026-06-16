using BuildEstate.Domain.Entities.UserManagement;
using BuildEstate.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Persistence.Configurations.UserManagement;

/// <summary>
/// Seeds built-in roles, permissions, and role-permission mappings via EF Core HasData().
/// Uses deterministic GUIDs derived from stable namespace + name to ensure idempotent migrations.
/// </summary>
public static class UserManagementSeedData
{
    // Deterministic namespace GUID for generating stable permission/role IDs
    private static readonly Guid NamespaceGuid = new("A1B2C3D4-E5F6-7890-ABCD-EF1234567890");

    #region Role Definitions

    /// <summary>
    /// The 13 built-in roles with stable IDs for reliable seeding.
    /// </summary>
    public static class BuiltInRoles
    {
        public const string SuperAdminId = "role-superadmin-00000000-0001";
        public const string AcquisitionManagerId = "role-acquisitionmgr-0000-0002";
        public const string LegalOfficerId = "role-legalofficer-00000-0003";
        public const string PlanningManagerId = "role-planningmgr-000000-0004";
        public const string ProjectManagerId = "role-projectmgr-0000000-0005";
        public const string SiteManagerId = "role-sitemgr-000000000-0006";
        public const string SalesManagerId = "role-salesmgr-00000000-0007";
        public const string CompletionManagerId = "role-completionmgr-000-0008";
        public const string PropertyManagerId = "role-propertymgr-00000-0009";
        public const string FinanceDirectorId = "role-financedir-000000-0010";
        public const string ValuationAnalystId = "role-valuationanlst-00-0011";
        public const string SurveyorId = "role-surveyor-00000000-0012";
        public const string AdminId = "role-admin-0000000000000-0013";

        public static ApplicationRole[] GetAll() =>
        [
            new()
            {
                Id = SuperAdminId,
                Name = "SuperAdmin",
                NormalizedName = "SUPERADMIN",
                Description = "Full system access with administrative control over all platform features",
                IsBuiltIn = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ConcurrencyStamp = "stamp-superadmin"
            },
            new()
            {
                Id = AcquisitionManagerId,
                Name = "AcquisitionManager",
                NormalizedName = "ACQUISITIONMANAGER",
                Description = "Manages land acquisition pipeline, evaluates opportunities, and submits for approval",
                IsBuiltIn = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ConcurrencyStamp = "stamp-acquisitionmgr"
            },
            new()
            {
                Id = LegalOfficerId,
                Name = "LegalOfficer",
                NormalizedName = "LEGALOFFICER",
                Description = "Performs due diligence, manages legal documents and compliance requirements",
                IsBuiltIn = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ConcurrencyStamp = "stamp-legalofficer"
            },
            new()
            {
                Id = PlanningManagerId,
                Name = "PlanningManager",
                NormalizedName = "PLANNINGMANAGER",
                Description = "Handles planning applications, council submissions, and approvals",
                IsBuiltIn = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ConcurrencyStamp = "stamp-planningmgr"
            },
            new()
            {
                Id = ProjectManagerId,
                Name = "ProjectManager",
                NormalizedName = "PROJECTMANAGER",
                Description = "Plans projects, manages budgets, timelines, and resources",
                IsBuiltIn = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ConcurrencyStamp = "stamp-projectmgr"
            },
            new()
            {
                Id = SiteManagerId,
                Name = "SiteManager",
                NormalizedName = "SITEMANAGER",
                Description = "Oversees construction, tracks progress, ensures quality and safety on-site",
                IsBuiltIn = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ConcurrencyStamp = "stamp-sitemgr"
            },
            new()
            {
                Id = SalesManagerId,
                Name = "SalesManager",
                NormalizedName = "SALESMANAGER",
                Description = "Manages marketing, leads, sales pipeline, and unit reservations",
                IsBuiltIn = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ConcurrencyStamp = "stamp-salesmgr"
            },
            new()
            {
                Id = CompletionManagerId,
                Name = "CompletionManager",
                NormalizedName = "COMPLETIONMANAGER",
                Description = "Coordinates handover, legal completion, and project closeout",
                IsBuiltIn = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ConcurrencyStamp = "stamp-completionmgr"
            },
            new()
            {
                Id = PropertyManagerId,
                Name = "PropertyManager",
                NormalizedName = "PROPERTYMANAGER",
                Description = "Manages rentals, tenants, maintenance, and day-to-day property operations",
                IsBuiltIn = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ConcurrencyStamp = "stamp-propertymgr"
            },
            new()
            {
                Id = FinanceDirectorId,
                Name = "FinanceDirector",
                NormalizedName = "FINANCEDIRECTOR",
                Description = "Monitors financial performance, profitability, and investor returns",
                IsBuiltIn = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ConcurrencyStamp = "stamp-financedir"
            },
            new()
            {
                Id = ValuationAnalystId,
                Name = "ValuationAnalyst",
                NormalizedName = "VALUATIONANALYST",
                Description = "Performs financial review and feasibility analysis for land opportunities",
                IsBuiltIn = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ConcurrencyStamp = "stamp-valuationanlst"
            },
            new()
            {
                Id = SurveyorId,
                Name = "Surveyor",
                NormalizedName = "SURVEYOR",
                Description = "Conducts technical assessments and produces survey reports",
                IsBuiltIn = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ConcurrencyStamp = "stamp-surveyor"
            },
            new()
            {
                Id = AdminId,
                Name = "Admin",
                NormalizedName = "ADMIN",
                Description = "Documentation, data entry, and general administrative support",
                IsBuiltIn = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                ConcurrencyStamp = "stamp-admin"
            }
        ];
    }

    #endregion

    #region Permission Definitions

    /// <summary>
    /// Generates a deterministic GUID from a permission name for stable seeding.
    /// Uses MD5 hash of namespace + name to produce a UUID v3 style identifier.
    /// </summary>
    private static Guid GeneratePermissionId(string permissionName)
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes($"{NamespaceGuid}{permissionName}");
        var hash = System.Security.Cryptography.MD5.HashData(bytes);
        // Set version 3 (name-based) and variant bits
        hash[6] = (byte)((hash[6] & 0x0F) | 0x30);
        hash[8] = (byte)((hash[8] & 0x3F) | 0x80);
        return new Guid(hash);
    }

    public static Permission[] GetPermissions()
    {
        var seedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        return
        [
            // Opportunities domain
            CreatePermission("opportunities.create", "Create Opportunities", "Opportunities", "Create new land opportunities in the pipeline", seedDate),
            CreatePermission("opportunities.read", "View Opportunities", "Opportunities", "View land opportunities and pipeline data", seedDate),
            CreatePermission("opportunities.update", "Update Opportunities", "Opportunities", "Edit existing land opportunity details", seedDate),
            CreatePermission("opportunities.delete", "Delete Opportunities", "Opportunities", "Remove land opportunities from the system", seedDate),
            CreatePermission("opportunities.approve", "Approve Opportunities", "Opportunities", "Approve land opportunities for acquisition", seedDate),

            // Projects domain
            CreatePermission("projects.create", "Create Projects", "Projects", "Create new development projects", seedDate),
            CreatePermission("projects.read", "View Projects", "Projects", "View project details and progress", seedDate),
            CreatePermission("projects.update", "Update Projects", "Projects", "Edit project information and milestones", seedDate),
            CreatePermission("projects.delete", "Delete Projects", "Projects", "Remove projects from the system", seedDate),
            CreatePermission("projects.approve", "Approve Projects", "Projects", "Approve project stages and milestones", seedDate),

            // Finance domain
            CreatePermission("finance.create", "Create Financial Records", "Finance", "Create budgets, invoices, and financial entries", seedDate),
            CreatePermission("finance.read", "View Financial Data", "Finance", "View budgets, costs, and financial reports", seedDate),
            CreatePermission("finance.update", "Update Financial Records", "Finance", "Edit financial data and budget allocations", seedDate),
            CreatePermission("finance.delete", "Delete Financial Records", "Finance", "Remove financial entries from the system", seedDate),
            CreatePermission("finance.approve", "Approve Financial Items", "Finance", "Approve payments, budgets, and financial decisions", seedDate),

            // Construction domain
            CreatePermission("construction.create", "Create Construction Records", "Construction", "Create construction stages and inspections", seedDate),
            CreatePermission("construction.read", "View Construction Data", "Construction", "View construction progress and reports", seedDate),
            CreatePermission("construction.update", "Update Construction Records", "Construction", "Update construction progress and stage status", seedDate),
            CreatePermission("construction.delete", "Delete Construction Records", "Construction", "Remove construction records from the system", seedDate),
            CreatePermission("construction.approve", "Approve Construction Stages", "Construction", "Approve construction stage completions", seedDate),

            // Sales domain
            CreatePermission("sales.create", "Create Sales Records", "Sales", "Create leads, reservations, and sales entries", seedDate),
            CreatePermission("sales.read", "View Sales Data", "Sales", "View sales pipeline, leads, and reservations", seedDate),
            CreatePermission("sales.update", "Update Sales Records", "Sales", "Edit sales entries and update pipeline stages", seedDate),
            CreatePermission("sales.delete", "Delete Sales Records", "Sales", "Remove sales entries from the system", seedDate),
            CreatePermission("sales.approve", "Approve Sales Transactions", "Sales", "Approve reservations and sales completions", seedDate),

            // Legal domain
            CreatePermission("legal.create", "Create Legal Records", "Legal", "Create legal cases, contracts, and compliance items", seedDate),
            CreatePermission("legal.read", "View Legal Data", "Legal", "View legal cases, contracts, and compliance status", seedDate),
            CreatePermission("legal.update", "Update Legal Records", "Legal", "Edit legal documents and compliance requirements", seedDate),
            CreatePermission("legal.delete", "Delete Legal Records", "Legal", "Remove legal entries from the system", seedDate),
            CreatePermission("legal.approve", "Approve Legal Items", "Legal", "Approve contracts and compliance checks", seedDate),

            // Planning domain
            CreatePermission("planning.create", "Create Planning Applications", "Planning", "Create planning submissions and applications", seedDate),
            CreatePermission("planning.read", "View Planning Data", "Planning", "View planning applications and approval status", seedDate),
            CreatePermission("planning.update", "Update Planning Applications", "Planning", "Edit planning applications and conditions", seedDate),
            CreatePermission("planning.delete", "Delete Planning Applications", "Planning", "Remove planning entries from the system", seedDate),
            CreatePermission("planning.approve", "Approve Planning Items", "Planning", "Approve planning application submissions", seedDate),

            // Reports domain
            CreatePermission("reports.view", "View Reports", "Reports", "Access standard and custom reports", seedDate),
            CreatePermission("reports.export", "Export Reports", "Reports", "Export report data to CSV/PDF formats", seedDate),
            CreatePermission("reports.create", "Create Custom Reports", "Reports", "Create and configure custom reports", seedDate),

            // Administration domain
            CreatePermission("administration.users", "Manage Users", "Administration", "Create, edit, deactivate, and manage user accounts", seedDate),
            CreatePermission("administration.roles", "Manage Roles", "Administration", "Create, edit, and delete roles and permissions", seedDate),
            CreatePermission("administration.audit", "View Audit Logs", "Administration", "Access and filter the system audit trail", seedDate),
            CreatePermission("administration.settings", "Manage System Settings", "Administration", "Configure system-wide settings and preferences", seedDate),
        ];
    }

    private static Permission CreatePermission(string name, string displayName, string domainArea, string description, DateTime createdAt)
    {
        return new Permission
        {
            Id = GeneratePermissionId(name),
            Name = name,
            DisplayName = displayName,
            DomainArea = domainArea,
            Description = description,
            CreatedAt = createdAt
        };
    }

    #endregion

    #region Role-Permission Mappings

    public static RolePermission[] GetRolePermissions()
    {
        var permissions = GetPermissions().ToDictionary(p => p.Name, p => p.Id);
        var mappings = new List<RolePermission>();

        // SuperAdmin gets ALL permissions
        foreach (var permissionId in permissions.Values)
        {
            mappings.Add(new RolePermission { RoleId = BuiltInRoles.SuperAdminId, PermissionId = permissionId });
        }

        // AcquisitionManager: Opportunities (full), Projects (read), Finance (read), Reports
        AddPermissions(mappings, BuiltInRoles.AcquisitionManagerId, permissions,
            "opportunities.create", "opportunities.read", "opportunities.update", "opportunities.delete", "opportunities.approve",
            "projects.read", "finance.read", "reports.view", "reports.export");

        // LegalOfficer: Legal (full), Opportunities (read), Projects (read), Reports
        AddPermissions(mappings, BuiltInRoles.LegalOfficerId, permissions,
            "legal.create", "legal.read", "legal.update", "legal.delete", "legal.approve",
            "opportunities.read", "projects.read", "reports.view", "reports.export");

        // PlanningManager: Planning (full), Opportunities (read), Projects (read), Legal (read), Reports
        AddPermissions(mappings, BuiltInRoles.PlanningManagerId, permissions,
            "planning.create", "planning.read", "planning.update", "planning.delete", "planning.approve",
            "opportunities.read", "projects.read", "legal.read", "reports.view", "reports.export");

        // ProjectManager: Projects (full), Construction (read/update), Finance (read), Opportunities (read), Reports
        AddPermissions(mappings, BuiltInRoles.ProjectManagerId, permissions,
            "projects.create", "projects.read", "projects.update", "projects.delete", "projects.approve",
            "construction.read", "construction.update", "finance.read", "opportunities.read",
            "reports.view", "reports.export");

        // SiteManager: Construction (full), Projects (read), Reports
        AddPermissions(mappings, BuiltInRoles.SiteManagerId, permissions,
            "construction.create", "construction.read", "construction.update", "construction.delete", "construction.approve",
            "projects.read", "reports.view", "reports.export");

        // SalesManager: Sales (full), Projects (read), Finance (read), Reports
        AddPermissions(mappings, BuiltInRoles.SalesManagerId, permissions,
            "sales.create", "sales.read", "sales.update", "sales.delete", "sales.approve",
            "projects.read", "finance.read", "reports.view", "reports.export");

        // CompletionManager: Sales (read/update), Construction (read), Projects (read), Legal (read), Reports
        AddPermissions(mappings, BuiltInRoles.CompletionManagerId, permissions,
            "sales.read", "sales.update", "construction.read", "projects.read", "legal.read",
            "reports.view", "reports.export");

        // PropertyManager: Projects (read), Construction (read), Sales (read), Finance (read), Reports
        AddPermissions(mappings, BuiltInRoles.PropertyManagerId, permissions,
            "projects.read", "construction.read", "sales.read", "finance.read",
            "reports.view", "reports.export");

        // FinanceDirector: Finance (full), Projects (read), Sales (read), Opportunities (read), Construction (read), Reports (full)
        AddPermissions(mappings, BuiltInRoles.FinanceDirectorId, permissions,
            "finance.create", "finance.read", "finance.update", "finance.delete", "finance.approve",
            "projects.read", "sales.read", "opportunities.read", "construction.read",
            "reports.view", "reports.export", "reports.create");

        // ValuationAnalyst: Finance (read), Opportunities (read/update), Projects (read), Reports
        AddPermissions(mappings, BuiltInRoles.ValuationAnalystId, permissions,
            "finance.read", "opportunities.read", "opportunities.update", "projects.read",
            "reports.view", "reports.export");

        // Surveyor: Construction (read), Opportunities (read), Projects (read), Planning (read), Reports
        AddPermissions(mappings, BuiltInRoles.SurveyorId, permissions,
            "construction.read", "opportunities.read", "projects.read", "planning.read",
            "reports.view", "reports.export");

        // Admin: Administration (users, roles, audit, settings), Reports (view)
        AddPermissions(mappings, BuiltInRoles.AdminId, permissions,
            "administration.users", "administration.roles", "administration.audit", "administration.settings",
            "reports.view");

        return mappings.ToArray();
    }

    private static void AddPermissions(
        List<RolePermission> mappings,
        string roleId,
        Dictionary<string, Guid> permissions,
        params string[] permissionNames)
    {
        foreach (var name in permissionNames)
        {
            if (permissions.TryGetValue(name, out var permissionId))
            {
                mappings.Add(new RolePermission { RoleId = roleId, PermissionId = permissionId });
            }
        }
    }

    #endregion

    #region Configuration Extension

    /// <summary>
    /// Applies seed data for roles, permissions, and role-permission mappings to the model builder.
    /// Should be called from OnModelCreating or a configuration class.
    /// </summary>
    public static void ApplySeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ApplicationRole>().HasData(BuiltInRoles.GetAll());
        modelBuilder.Entity<Permission>().HasData(GetPermissions());
        modelBuilder.Entity<RolePermission>().HasData(GetRolePermissions());
    }

    #endregion
}
