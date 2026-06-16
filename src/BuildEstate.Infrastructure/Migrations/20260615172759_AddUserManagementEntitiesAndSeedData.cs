using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BuildEstate.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserManagementEntitiesAndSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contracts_Legal_LegalCases_LegalCaseId",
                table: "Contracts_Legal");

            migrationBuilder.AddColumn<string>(
                name: "DeviceInfo",
                table: "RefreshTokens",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "RefreshTokens",
                type: "nvarchar(45)",
                maxLength: 45,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "AspNetUsers",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLoginAt",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "AspNetUsers",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "AspNetRoles",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsBuiltIn",
                table: "AspNetRoles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AuditLogEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    PerformedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    PerformedByUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    TargetEntityType = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    TargetEntityId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    TargetUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: false),
                    OldValues = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    NewValues = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    AffectedFields = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CorrelationId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Details = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PasswordHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PasswordHistories_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    DomainArea = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    DeviceInfo = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    Browser = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    OperatingSystem = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: false),
                    City = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastActiveAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRevoked = table.Column<bool>(type: "bit", nullable: false),
                    RevokedReason = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSessions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RolePermissions",
                columns: table => new
                {
                    RoleId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    PermissionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermissions", x => new { x.RoleId, x.PermissionId });
                    table.ForeignKey(
                        name: "FK_RolePermissions_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Permissions_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "Permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "CreatedAt", "Description", "IsBuiltIn", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "role-acquisitionmgr-0000-0002", "stamp-acquisitionmgr", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Manages land acquisition pipeline, evaluates opportunities, and submits for approval", true, "AcquisitionManager", "ACQUISITIONMANAGER" },
                    { "role-admin-0000000000000-0013", "stamp-admin", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Documentation, data entry, and general administrative support", true, "Admin", "ADMIN" },
                    { "role-completionmgr-000-0008", "stamp-completionmgr", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Coordinates handover, legal completion, and project closeout", true, "CompletionManager", "COMPLETIONMANAGER" },
                    { "role-financedir-000000-0010", "stamp-financedir", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Monitors financial performance, profitability, and investor returns", true, "FinanceDirector", "FINANCEDIRECTOR" },
                    { "role-legalofficer-00000-0003", "stamp-legalofficer", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Performs due diligence, manages legal documents and compliance requirements", true, "LegalOfficer", "LEGALOFFICER" },
                    { "role-planningmgr-000000-0004", "stamp-planningmgr", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Handles planning applications, council submissions, and approvals", true, "PlanningManager", "PLANNINGMANAGER" },
                    { "role-projectmgr-0000000-0005", "stamp-projectmgr", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Plans projects, manages budgets, timelines, and resources", true, "ProjectManager", "PROJECTMANAGER" },
                    { "role-propertymgr-00000-0009", "stamp-propertymgr", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Manages rentals, tenants, maintenance, and day-to-day property operations", true, "PropertyManager", "PROPERTYMANAGER" },
                    { "role-salesmgr-00000000-0007", "stamp-salesmgr", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Manages marketing, leads, sales pipeline, and unit reservations", true, "SalesManager", "SALESMANAGER" },
                    { "role-sitemgr-000000000-0006", "stamp-sitemgr", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Oversees construction, tracks progress, ensures quality and safety on-site", true, "SiteManager", "SITEMANAGER" },
                    { "role-superadmin-00000000-0001", "stamp-superadmin", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Full system access with administrative control over all platform features", true, "SuperAdmin", "SUPERADMIN" },
                    { "role-surveyor-00000000-0012", "stamp-surveyor", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Conducts technical assessments and produces survey reports", true, "Surveyor", "SURVEYOR" },
                    { "role-valuationanlst-00-0011", "stamp-valuationanlst", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Performs financial review and feasibility analysis for land opportunities", true, "ValuationAnalyst", "VALUATIONANALYST" }
                });

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "CreatedAt", "Description", "DisplayName", "DomainArea", "Name" },
                values: new object[,]
                {
                    { new Guid("028c0e60-0a42-683f-943d-990a61df2212"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Configure system-wide settings and preferences", "Manage System Settings", "Administration", "administration.settings" },
                    { new Guid("0c98f122-191e-403c-b870-476c8a70137e"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Create legal cases, contracts, and compliance items", "Create Legal Records", "Legal", "legal.create" },
                    { new Guid("1282fab2-e057-243c-a259-6cbd6c091503"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Edit existing land opportunity details", "Update Opportunities", "Opportunities", "opportunities.update" },
                    { new Guid("12f68deb-d61c-0c32-b727-190bec4a425e"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Create planning submissions and applications", "Create Planning Applications", "Planning", "planning.create" },
                    { new Guid("15a10da3-c268-4231-8f18-979ec6416402"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Approve payments, budgets, and financial decisions", "Approve Financial Items", "Finance", "finance.approve" },
                    { new Guid("17f4940e-47ce-cc31-bec2-fe2975810db2"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Access and filter the system audit trail", "View Audit Logs", "Administration", "administration.audit" },
                    { new Guid("189fb6db-765d-8139-b14f-24c7d3eb097a"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "View construction progress and reports", "View Construction Data", "Construction", "construction.read" },
                    { new Guid("1aa71bcb-ea52-b836-8207-c24037ce0339"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Update construction progress and stage status", "Update Construction Records", "Construction", "construction.update" },
                    { new Guid("209bd5fa-9c7a-b83e-9657-b9e8c92b3b6a"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Create leads, reservations, and sales entries", "Create Sales Records", "Sales", "sales.create" },
                    { new Guid("48dc2e8e-565f-e43d-b9fa-dfe3d760d495"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Remove financial entries from the system", "Delete Financial Records", "Finance", "finance.delete" },
                    { new Guid("522221ae-7107-f23a-bccc-2e8e4a46bcc2"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Edit project information and milestones", "Update Projects", "Projects", "projects.update" },
                    { new Guid("5b990f59-7f40-df39-a7cf-17903b570de9"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Create budgets, invoices, and financial entries", "Create Financial Records", "Finance", "finance.create" },
                    { new Guid("5e0fd6d5-3425-d838-b478-58d75c804eed"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Approve planning application submissions", "Approve Planning Items", "Planning", "planning.approve" },
                    { new Guid("5fe44f44-30ee-4239-9e47-ad8e511abc23"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Create and configure custom reports", "Create Custom Reports", "Reports", "reports.create" },
                    { new Guid("6243f5b3-7ec5-f63d-bf6d-74892dcbe7b8"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "View land opportunities and pipeline data", "View Opportunities", "Opportunities", "opportunities.read" },
                    { new Guid("6924d6f0-a512-b53b-b494-6a3df737cdfd"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Remove legal entries from the system", "Delete Legal Records", "Legal", "legal.delete" },
                    { new Guid("6ab89998-b47c-fb35-a5ec-1269c45cf988"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "View sales pipeline, leads, and reservations", "View Sales Data", "Sales", "sales.read" },
                    { new Guid("6b9222ec-ed1e-bb3b-8589-08c02fcd08a6"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Create, edit, and delete roles and permissions", "Manage Roles", "Administration", "administration.roles" },
                    { new Guid("6c78480d-708a-9c32-b8fa-7d6a81e03018"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "View project details and progress", "View Projects", "Projects", "projects.read" },
                    { new Guid("6f313074-752a-4d34-890a-b42d5ac2f175"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Approve reservations and sales completions", "Approve Sales Transactions", "Sales", "sales.approve" },
                    { new Guid("75d25f70-d5a7-ac3a-a4ed-1e4edf2e1c68"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Edit legal documents and compliance requirements", "Update Legal Records", "Legal", "legal.update" },
                    { new Guid("78d03a92-b3c1-1c32-a3c6-3d65733374a8"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Create new land opportunities in the pipeline", "Create Opportunities", "Opportunities", "opportunities.create" },
                    { new Guid("7e3c7735-74ce-b93e-b996-3e943fdccc39"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Approve contracts and compliance checks", "Approve Legal Items", "Legal", "legal.approve" },
                    { new Guid("8099fcfd-8a9d-9c33-8868-a31af58fb9e1"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Create, edit, deactivate, and manage user accounts", "Manage Users", "Administration", "administration.users" },
                    { new Guid("8623c0e1-c163-fb3d-bbf0-19eeee934d78"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "View legal cases, contracts, and compliance status", "View Legal Data", "Legal", "legal.read" },
                    { new Guid("8887ef85-43d3-713f-b044-ba2e3c035363"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Approve construction stage completions", "Approve Construction Stages", "Construction", "construction.approve" },
                    { new Guid("a279049f-7876-d231-a2a8-5d5c15e1672f"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Approve project stages and milestones", "Approve Projects", "Projects", "projects.approve" },
                    { new Guid("a2c749f8-b601-933c-a26c-3e88d21e2755"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Create new development projects", "Create Projects", "Projects", "projects.create" },
                    { new Guid("a68c4e40-7195-e33e-9ff9-c9d994fc9dcc"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Create construction stages and inspections", "Create Construction Records", "Construction", "construction.create" },
                    { new Guid("b47b0ebd-02e5-f734-babb-c1e33e23df74"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Edit planning applications and conditions", "Update Planning Applications", "Planning", "planning.update" },
                    { new Guid("c964c017-0aa6-c339-bbb3-d73a35fb8b0f"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Remove projects from the system", "Delete Projects", "Projects", "projects.delete" },
                    { new Guid("cd8ab91f-0284-4635-ad94-c8abb0a7441d"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Edit sales entries and update pipeline stages", "Update Sales Records", "Sales", "sales.update" },
                    { new Guid("d64041bd-6bfa-8f34-b9a7-71451d0b90a9"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Export report data to CSV/PDF formats", "Export Reports", "Reports", "reports.export" },
                    { new Guid("d7acb01c-27a6-9d38-b777-0068349ed309"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Remove sales entries from the system", "Delete Sales Records", "Sales", "sales.delete" },
                    { new Guid("d9a72cd4-1717-9933-a706-f77ccf172ec9"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Remove planning entries from the system", "Delete Planning Applications", "Planning", "planning.delete" },
                    { new Guid("d9aeef87-343d-4f38-b5c0-bd790f6907f7"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "View planning applications and approval status", "View Planning Data", "Planning", "planning.read" },
                    { new Guid("e2cc17e9-bd33-c238-93fc-47b2f68ed471"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Remove land opportunities from the system", "Delete Opportunities", "Opportunities", "opportunities.delete" },
                    { new Guid("e6648710-d659-6c3d-ab8d-db84fa90bf8c"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Approve land opportunities for acquisition", "Approve Opportunities", "Opportunities", "opportunities.approve" },
                    { new Guid("ebb49a61-e7f7-7831-a074-05d3319ed3bd"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "View budgets, costs, and financial reports", "View Financial Data", "Finance", "finance.read" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Access standard and custom reports", "View Reports", "Reports", "reports.view" },
                    { new Guid("fc471112-c100-3d3d-ba01-feab0a1c58be"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Edit financial data and budget allocations", "Update Financial Records", "Finance", "finance.update" },
                    { new Guid("fe4a36d4-c9ec-a230-8064-1a7122ccafb8"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Remove construction records from the system", "Delete Construction Records", "Construction", "construction.delete" }
                });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "PermissionId", "RoleId" },
                values: new object[,]
                {
                    { new Guid("1282fab2-e057-243c-a259-6cbd6c091503"), "role-acquisitionmgr-0000-0002" },
                    { new Guid("6243f5b3-7ec5-f63d-bf6d-74892dcbe7b8"), "role-acquisitionmgr-0000-0002" },
                    { new Guid("6c78480d-708a-9c32-b8fa-7d6a81e03018"), "role-acquisitionmgr-0000-0002" },
                    { new Guid("78d03a92-b3c1-1c32-a3c6-3d65733374a8"), "role-acquisitionmgr-0000-0002" },
                    { new Guid("d64041bd-6bfa-8f34-b9a7-71451d0b90a9"), "role-acquisitionmgr-0000-0002" },
                    { new Guid("e2cc17e9-bd33-c238-93fc-47b2f68ed471"), "role-acquisitionmgr-0000-0002" },
                    { new Guid("e6648710-d659-6c3d-ab8d-db84fa90bf8c"), "role-acquisitionmgr-0000-0002" },
                    { new Guid("ebb49a61-e7f7-7831-a074-05d3319ed3bd"), "role-acquisitionmgr-0000-0002" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), "role-acquisitionmgr-0000-0002" },
                    { new Guid("028c0e60-0a42-683f-943d-990a61df2212"), "role-admin-0000000000000-0013" },
                    { new Guid("17f4940e-47ce-cc31-bec2-fe2975810db2"), "role-admin-0000000000000-0013" },
                    { new Guid("6b9222ec-ed1e-bb3b-8589-08c02fcd08a6"), "role-admin-0000000000000-0013" },
                    { new Guid("8099fcfd-8a9d-9c33-8868-a31af58fb9e1"), "role-admin-0000000000000-0013" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), "role-admin-0000000000000-0013" },
                    { new Guid("189fb6db-765d-8139-b14f-24c7d3eb097a"), "role-completionmgr-000-0008" },
                    { new Guid("6ab89998-b47c-fb35-a5ec-1269c45cf988"), "role-completionmgr-000-0008" },
                    { new Guid("6c78480d-708a-9c32-b8fa-7d6a81e03018"), "role-completionmgr-000-0008" },
                    { new Guid("8623c0e1-c163-fb3d-bbf0-19eeee934d78"), "role-completionmgr-000-0008" },
                    { new Guid("cd8ab91f-0284-4635-ad94-c8abb0a7441d"), "role-completionmgr-000-0008" },
                    { new Guid("d64041bd-6bfa-8f34-b9a7-71451d0b90a9"), "role-completionmgr-000-0008" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), "role-completionmgr-000-0008" },
                    { new Guid("15a10da3-c268-4231-8f18-979ec6416402"), "role-financedir-000000-0010" },
                    { new Guid("189fb6db-765d-8139-b14f-24c7d3eb097a"), "role-financedir-000000-0010" },
                    { new Guid("48dc2e8e-565f-e43d-b9fa-dfe3d760d495"), "role-financedir-000000-0010" },
                    { new Guid("5b990f59-7f40-df39-a7cf-17903b570de9"), "role-financedir-000000-0010" },
                    { new Guid("5fe44f44-30ee-4239-9e47-ad8e511abc23"), "role-financedir-000000-0010" },
                    { new Guid("6243f5b3-7ec5-f63d-bf6d-74892dcbe7b8"), "role-financedir-000000-0010" },
                    { new Guid("6ab89998-b47c-fb35-a5ec-1269c45cf988"), "role-financedir-000000-0010" },
                    { new Guid("6c78480d-708a-9c32-b8fa-7d6a81e03018"), "role-financedir-000000-0010" },
                    { new Guid("d64041bd-6bfa-8f34-b9a7-71451d0b90a9"), "role-financedir-000000-0010" },
                    { new Guid("ebb49a61-e7f7-7831-a074-05d3319ed3bd"), "role-financedir-000000-0010" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), "role-financedir-000000-0010" },
                    { new Guid("fc471112-c100-3d3d-ba01-feab0a1c58be"), "role-financedir-000000-0010" },
                    { new Guid("0c98f122-191e-403c-b870-476c8a70137e"), "role-legalofficer-00000-0003" },
                    { new Guid("6243f5b3-7ec5-f63d-bf6d-74892dcbe7b8"), "role-legalofficer-00000-0003" },
                    { new Guid("6924d6f0-a512-b53b-b494-6a3df737cdfd"), "role-legalofficer-00000-0003" },
                    { new Guid("6c78480d-708a-9c32-b8fa-7d6a81e03018"), "role-legalofficer-00000-0003" },
                    { new Guid("75d25f70-d5a7-ac3a-a4ed-1e4edf2e1c68"), "role-legalofficer-00000-0003" },
                    { new Guid("7e3c7735-74ce-b93e-b996-3e943fdccc39"), "role-legalofficer-00000-0003" },
                    { new Guid("8623c0e1-c163-fb3d-bbf0-19eeee934d78"), "role-legalofficer-00000-0003" },
                    { new Guid("d64041bd-6bfa-8f34-b9a7-71451d0b90a9"), "role-legalofficer-00000-0003" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), "role-legalofficer-00000-0003" },
                    { new Guid("12f68deb-d61c-0c32-b727-190bec4a425e"), "role-planningmgr-000000-0004" },
                    { new Guid("5e0fd6d5-3425-d838-b478-58d75c804eed"), "role-planningmgr-000000-0004" },
                    { new Guid("6243f5b3-7ec5-f63d-bf6d-74892dcbe7b8"), "role-planningmgr-000000-0004" },
                    { new Guid("6c78480d-708a-9c32-b8fa-7d6a81e03018"), "role-planningmgr-000000-0004" },
                    { new Guid("8623c0e1-c163-fb3d-bbf0-19eeee934d78"), "role-planningmgr-000000-0004" },
                    { new Guid("b47b0ebd-02e5-f734-babb-c1e33e23df74"), "role-planningmgr-000000-0004" },
                    { new Guid("d64041bd-6bfa-8f34-b9a7-71451d0b90a9"), "role-planningmgr-000000-0004" },
                    { new Guid("d9a72cd4-1717-9933-a706-f77ccf172ec9"), "role-planningmgr-000000-0004" },
                    { new Guid("d9aeef87-343d-4f38-b5c0-bd790f6907f7"), "role-planningmgr-000000-0004" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), "role-planningmgr-000000-0004" },
                    { new Guid("189fb6db-765d-8139-b14f-24c7d3eb097a"), "role-projectmgr-0000000-0005" },
                    { new Guid("1aa71bcb-ea52-b836-8207-c24037ce0339"), "role-projectmgr-0000000-0005" },
                    { new Guid("522221ae-7107-f23a-bccc-2e8e4a46bcc2"), "role-projectmgr-0000000-0005" },
                    { new Guid("6243f5b3-7ec5-f63d-bf6d-74892dcbe7b8"), "role-projectmgr-0000000-0005" },
                    { new Guid("6c78480d-708a-9c32-b8fa-7d6a81e03018"), "role-projectmgr-0000000-0005" },
                    { new Guid("a279049f-7876-d231-a2a8-5d5c15e1672f"), "role-projectmgr-0000000-0005" },
                    { new Guid("a2c749f8-b601-933c-a26c-3e88d21e2755"), "role-projectmgr-0000000-0005" },
                    { new Guid("c964c017-0aa6-c339-bbb3-d73a35fb8b0f"), "role-projectmgr-0000000-0005" },
                    { new Guid("d64041bd-6bfa-8f34-b9a7-71451d0b90a9"), "role-projectmgr-0000000-0005" },
                    { new Guid("ebb49a61-e7f7-7831-a074-05d3319ed3bd"), "role-projectmgr-0000000-0005" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), "role-projectmgr-0000000-0005" },
                    { new Guid("189fb6db-765d-8139-b14f-24c7d3eb097a"), "role-propertymgr-00000-0009" },
                    { new Guid("6ab89998-b47c-fb35-a5ec-1269c45cf988"), "role-propertymgr-00000-0009" },
                    { new Guid("6c78480d-708a-9c32-b8fa-7d6a81e03018"), "role-propertymgr-00000-0009" },
                    { new Guid("d64041bd-6bfa-8f34-b9a7-71451d0b90a9"), "role-propertymgr-00000-0009" },
                    { new Guid("ebb49a61-e7f7-7831-a074-05d3319ed3bd"), "role-propertymgr-00000-0009" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), "role-propertymgr-00000-0009" },
                    { new Guid("209bd5fa-9c7a-b83e-9657-b9e8c92b3b6a"), "role-salesmgr-00000000-0007" },
                    { new Guid("6ab89998-b47c-fb35-a5ec-1269c45cf988"), "role-salesmgr-00000000-0007" },
                    { new Guid("6c78480d-708a-9c32-b8fa-7d6a81e03018"), "role-salesmgr-00000000-0007" },
                    { new Guid("6f313074-752a-4d34-890a-b42d5ac2f175"), "role-salesmgr-00000000-0007" },
                    { new Guid("cd8ab91f-0284-4635-ad94-c8abb0a7441d"), "role-salesmgr-00000000-0007" },
                    { new Guid("d64041bd-6bfa-8f34-b9a7-71451d0b90a9"), "role-salesmgr-00000000-0007" },
                    { new Guid("d7acb01c-27a6-9d38-b777-0068349ed309"), "role-salesmgr-00000000-0007" },
                    { new Guid("ebb49a61-e7f7-7831-a074-05d3319ed3bd"), "role-salesmgr-00000000-0007" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), "role-salesmgr-00000000-0007" },
                    { new Guid("189fb6db-765d-8139-b14f-24c7d3eb097a"), "role-sitemgr-000000000-0006" },
                    { new Guid("1aa71bcb-ea52-b836-8207-c24037ce0339"), "role-sitemgr-000000000-0006" },
                    { new Guid("6c78480d-708a-9c32-b8fa-7d6a81e03018"), "role-sitemgr-000000000-0006" },
                    { new Guid("8887ef85-43d3-713f-b044-ba2e3c035363"), "role-sitemgr-000000000-0006" },
                    { new Guid("a68c4e40-7195-e33e-9ff9-c9d994fc9dcc"), "role-sitemgr-000000000-0006" },
                    { new Guid("d64041bd-6bfa-8f34-b9a7-71451d0b90a9"), "role-sitemgr-000000000-0006" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), "role-sitemgr-000000000-0006" },
                    { new Guid("fe4a36d4-c9ec-a230-8064-1a7122ccafb8"), "role-sitemgr-000000000-0006" },
                    { new Guid("028c0e60-0a42-683f-943d-990a61df2212"), "role-superadmin-00000000-0001" },
                    { new Guid("0c98f122-191e-403c-b870-476c8a70137e"), "role-superadmin-00000000-0001" },
                    { new Guid("1282fab2-e057-243c-a259-6cbd6c091503"), "role-superadmin-00000000-0001" },
                    { new Guid("12f68deb-d61c-0c32-b727-190bec4a425e"), "role-superadmin-00000000-0001" },
                    { new Guid("15a10da3-c268-4231-8f18-979ec6416402"), "role-superadmin-00000000-0001" },
                    { new Guid("17f4940e-47ce-cc31-bec2-fe2975810db2"), "role-superadmin-00000000-0001" },
                    { new Guid("189fb6db-765d-8139-b14f-24c7d3eb097a"), "role-superadmin-00000000-0001" },
                    { new Guid("1aa71bcb-ea52-b836-8207-c24037ce0339"), "role-superadmin-00000000-0001" },
                    { new Guid("209bd5fa-9c7a-b83e-9657-b9e8c92b3b6a"), "role-superadmin-00000000-0001" },
                    { new Guid("48dc2e8e-565f-e43d-b9fa-dfe3d760d495"), "role-superadmin-00000000-0001" },
                    { new Guid("522221ae-7107-f23a-bccc-2e8e4a46bcc2"), "role-superadmin-00000000-0001" },
                    { new Guid("5b990f59-7f40-df39-a7cf-17903b570de9"), "role-superadmin-00000000-0001" },
                    { new Guid("5e0fd6d5-3425-d838-b478-58d75c804eed"), "role-superadmin-00000000-0001" },
                    { new Guid("5fe44f44-30ee-4239-9e47-ad8e511abc23"), "role-superadmin-00000000-0001" },
                    { new Guid("6243f5b3-7ec5-f63d-bf6d-74892dcbe7b8"), "role-superadmin-00000000-0001" },
                    { new Guid("6924d6f0-a512-b53b-b494-6a3df737cdfd"), "role-superadmin-00000000-0001" },
                    { new Guid("6ab89998-b47c-fb35-a5ec-1269c45cf988"), "role-superadmin-00000000-0001" },
                    { new Guid("6b9222ec-ed1e-bb3b-8589-08c02fcd08a6"), "role-superadmin-00000000-0001" },
                    { new Guid("6c78480d-708a-9c32-b8fa-7d6a81e03018"), "role-superadmin-00000000-0001" },
                    { new Guid("6f313074-752a-4d34-890a-b42d5ac2f175"), "role-superadmin-00000000-0001" },
                    { new Guid("75d25f70-d5a7-ac3a-a4ed-1e4edf2e1c68"), "role-superadmin-00000000-0001" },
                    { new Guid("78d03a92-b3c1-1c32-a3c6-3d65733374a8"), "role-superadmin-00000000-0001" },
                    { new Guid("7e3c7735-74ce-b93e-b996-3e943fdccc39"), "role-superadmin-00000000-0001" },
                    { new Guid("8099fcfd-8a9d-9c33-8868-a31af58fb9e1"), "role-superadmin-00000000-0001" },
                    { new Guid("8623c0e1-c163-fb3d-bbf0-19eeee934d78"), "role-superadmin-00000000-0001" },
                    { new Guid("8887ef85-43d3-713f-b044-ba2e3c035363"), "role-superadmin-00000000-0001" },
                    { new Guid("a279049f-7876-d231-a2a8-5d5c15e1672f"), "role-superadmin-00000000-0001" },
                    { new Guid("a2c749f8-b601-933c-a26c-3e88d21e2755"), "role-superadmin-00000000-0001" },
                    { new Guid("a68c4e40-7195-e33e-9ff9-c9d994fc9dcc"), "role-superadmin-00000000-0001" },
                    { new Guid("b47b0ebd-02e5-f734-babb-c1e33e23df74"), "role-superadmin-00000000-0001" },
                    { new Guid("c964c017-0aa6-c339-bbb3-d73a35fb8b0f"), "role-superadmin-00000000-0001" },
                    { new Guid("cd8ab91f-0284-4635-ad94-c8abb0a7441d"), "role-superadmin-00000000-0001" },
                    { new Guid("d64041bd-6bfa-8f34-b9a7-71451d0b90a9"), "role-superadmin-00000000-0001" },
                    { new Guid("d7acb01c-27a6-9d38-b777-0068349ed309"), "role-superadmin-00000000-0001" },
                    { new Guid("d9a72cd4-1717-9933-a706-f77ccf172ec9"), "role-superadmin-00000000-0001" },
                    { new Guid("d9aeef87-343d-4f38-b5c0-bd790f6907f7"), "role-superadmin-00000000-0001" },
                    { new Guid("e2cc17e9-bd33-c238-93fc-47b2f68ed471"), "role-superadmin-00000000-0001" },
                    { new Guid("e6648710-d659-6c3d-ab8d-db84fa90bf8c"), "role-superadmin-00000000-0001" },
                    { new Guid("ebb49a61-e7f7-7831-a074-05d3319ed3bd"), "role-superadmin-00000000-0001" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), "role-superadmin-00000000-0001" },
                    { new Guid("fc471112-c100-3d3d-ba01-feab0a1c58be"), "role-superadmin-00000000-0001" },
                    { new Guid("fe4a36d4-c9ec-a230-8064-1a7122ccafb8"), "role-superadmin-00000000-0001" },
                    { new Guid("189fb6db-765d-8139-b14f-24c7d3eb097a"), "role-surveyor-00000000-0012" },
                    { new Guid("6243f5b3-7ec5-f63d-bf6d-74892dcbe7b8"), "role-surveyor-00000000-0012" },
                    { new Guid("6c78480d-708a-9c32-b8fa-7d6a81e03018"), "role-surveyor-00000000-0012" },
                    { new Guid("d64041bd-6bfa-8f34-b9a7-71451d0b90a9"), "role-surveyor-00000000-0012" },
                    { new Guid("d9aeef87-343d-4f38-b5c0-bd790f6907f7"), "role-surveyor-00000000-0012" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), "role-surveyor-00000000-0012" },
                    { new Guid("1282fab2-e057-243c-a259-6cbd6c091503"), "role-valuationanlst-00-0011" },
                    { new Guid("6243f5b3-7ec5-f63d-bf6d-74892dcbe7b8"), "role-valuationanlst-00-0011" },
                    { new Guid("6c78480d-708a-9c32-b8fa-7d6a81e03018"), "role-valuationanlst-00-0011" },
                    { new Guid("d64041bd-6bfa-8f34-b9a7-71451d0b90a9"), "role-valuationanlst-00-0011" },
                    { new Guid("ebb49a61-e7f7-7831-a074-05d3319ed3bd"), "role-valuationanlst-00-0011" },
                    { new Guid("ed4353ad-9e77-bd36-a916-d84bf921f7c9"), "role-valuationanlst-00-0011" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_CreatedAt",
                table: "RefreshTokens",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_CreatedAt",
                table: "AspNetUsers",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_Email",
                table: "AspNetUsers",
                column: "Email",
                unique: true,
                filter: "[Email] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_IsActive",
                table: "AspNetUsers",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoles_CreatedAt",
                table: "AspNetRoles",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoles_Name",
                table: "AspNetRoles",
                column: "Name",
                unique: true,
                filter: "[Name] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogEntries_Action",
                table: "AuditLogEntries",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogEntries_CorrelationId",
                table: "AuditLogEntries",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogEntries_PerformedByUserId",
                table: "AuditLogEntries",
                column: "PerformedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogEntries_Timestamp",
                table: "AuditLogEntries",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogEntries_Timestamp_Action",
                table: "AuditLogEntries",
                columns: new[] { "Timestamp", "Action" });

            migrationBuilder.CreateIndex(
                name: "IX_PasswordHistories_UserId",
                table: "PasswordHistories",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordHistories_UserId_CreatedAt",
                table: "PasswordHistories",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_DomainArea",
                table: "Permissions",
                column: "DomainArea");

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_Name",
                table: "Permissions",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_PermissionId",
                table: "RolePermissions",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_CreatedAt",
                table: "UserSessions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_UserId",
                table: "UserSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_UserId_IsRevoked",
                table: "UserSessions",
                columns: new[] { "UserId", "IsRevoked" });

            migrationBuilder.AddForeignKey(
                name: "FK_Contracts_Legal_LegalCases_LegalCaseId",
                table: "Contracts_Legal",
                column: "LegalCaseId",
                principalTable: "LegalCases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contracts_Legal_LegalCases_LegalCaseId",
                table: "Contracts_Legal");

            migrationBuilder.DropTable(
                name: "AuditLogEntries");

            migrationBuilder.DropTable(
                name: "PasswordHistories");

            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropTable(
                name: "UserSessions");

            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_CreatedAt",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_CreatedAt",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_Email",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_IsActive",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetRoles_CreatedAt",
                table: "AspNetRoles");

            migrationBuilder.DropIndex(
                name: "IX_AspNetRoles_Name",
                table: "AspNetRoles");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "role-acquisitionmgr-0000-0002");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "role-admin-0000000000000-0013");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "role-completionmgr-000-0008");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "role-financedir-000000-0010");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "role-legalofficer-00000-0003");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "role-planningmgr-000000-0004");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "role-projectmgr-0000000-0005");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "role-propertymgr-00000-0009");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "role-salesmgr-00000000-0007");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "role-sitemgr-000000000-0006");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "role-superadmin-00000000-0001");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "role-surveyor-00000000-0012");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "role-valuationanlst-00-0011");

            migrationBuilder.DropColumn(
                name: "DeviceInfo",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastLoginAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "AspNetRoles");

            migrationBuilder.DropColumn(
                name: "IsBuiltIn",
                table: "AspNetRoles");

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Contracts_Legal_LegalCases_LegalCaseId",
                table: "Contracts_Legal",
                column: "LegalCaseId",
                principalTable: "LegalCases",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
