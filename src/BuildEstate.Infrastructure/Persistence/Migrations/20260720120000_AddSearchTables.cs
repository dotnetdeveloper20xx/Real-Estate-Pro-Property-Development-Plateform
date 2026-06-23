using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildEstate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSearchTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create RecentSearches table
            migrationBuilder.CreateTable(
                name: "RecentSearches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Query = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ResultCount = table.Column<int>(type: "int", nullable: false),
                    SearchedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecentSearches", x => x.Id);
                });

            // Create PinnedItems table
            migrationBuilder.CreateTable(
                name: "PinnedItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    EntityId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Subtitle = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Icon = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NavigationRoute = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PinnedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PinnedItems", x => x.Id);
                });

            // Create SavedSearches table
            migrationBuilder.CreateTable(
                name: "SavedSearches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Query = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FiltersJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    SavedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedSearches", x => x.Id);
                });

            // Indexes for RecentSearches
            migrationBuilder.CreateIndex(
                name: "IX_RecentSearches_UserId_SearchedAt",
                table: "RecentSearches",
                columns: new[] { "UserId", "SearchedAt" },
                descending: new[] { false, true });

            // Indexes for PinnedItems (unique composite to prevent duplicate pins)
            migrationBuilder.CreateIndex(
                name: "IX_PinnedItems_UserId_EntityId",
                table: "PinnedItems",
                columns: new[] { "UserId", "EntityId" },
                unique: true,
                filter: "[IsDeleted] = 0");

            // Indexes for SavedSearches
            migrationBuilder.CreateIndex(
                name: "IX_SavedSearches_UserId",
                table: "SavedSearches",
                column: "UserId");

            // Search indexes on existing module tables for search performance
            migrationBuilder.CreateIndex(
                name: "IX_LandOpportunities_Name",
                table: "LandOpportunities",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_LandOpportunities_Location",
                table: "LandOpportunities",
                column: "Location");

            migrationBuilder.CreateIndex(
                name: "IX_LegalCases_Title",
                table: "LegalCases",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_FileName",
                table: "Documents",
                column: "FileName");

            // Full-Text Catalog and Full-Text Indexes for search performance
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.fulltext_catalogs WHERE name = 'FT_CATALOG_BuildEstate')
                BEGIN
                    CREATE FULLTEXT CATALOG FT_CATALOG_BuildEstate AS DEFAULT;
                END
            ");

            // Full-Text Index on LandOpportunities (Name, Location)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('LandOpportunities'))
                BEGIN
                    CREATE FULLTEXT INDEX ON LandOpportunities(Name, Location)
                    KEY INDEX PK_LandOpportunities ON FT_CATALOG_BuildEstate
                    WITH CHANGE_TRACKING AUTO;
                END
            ");

            // Full-Text Index on PlanningApplications (Description)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('PlanningApplications'))
                BEGIN
                    CREATE FULLTEXT INDEX ON PlanningApplications(Description)
                    KEY INDEX PK_PlanningApplications ON FT_CATALOG_BuildEstate
                    WITH CHANGE_TRACKING AUTO;
                END
            ");

            // Full-Text Index on LegalCases (Title, Description)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('LegalCases'))
                BEGIN
                    CREATE FULLTEXT INDEX ON LegalCases(Title, Description)
                    KEY INDEX PK_LegalCases ON FT_CATALOG_BuildEstate
                    WITH CHANGE_TRACKING AUTO;
                END
            ");

            // Full-Text Index on Documents (FileName)
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('Documents'))
                BEGIN
                    CREATE FULLTEXT INDEX ON Documents(FileName)
                    KEY INDEX PK_Documents ON FT_CATALOG_BuildEstate
                    WITH CHANGE_TRACKING AUTO;
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop Full-Text Indexes
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('Documents'))
                    DROP FULLTEXT INDEX ON Documents;
                IF EXISTS (SELECT 1 FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('LegalCases'))
                    DROP FULLTEXT INDEX ON LegalCases;
                IF EXISTS (SELECT 1 FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('PlanningApplications'))
                    DROP FULLTEXT INDEX ON PlanningApplications;
                IF EXISTS (SELECT 1 FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('LandOpportunities'))
                    DROP FULLTEXT INDEX ON LandOpportunities;
            ");

            // Drop Full-Text Catalog
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.fulltext_catalogs WHERE name = 'FT_CATALOG_BuildEstate')
                    DROP FULLTEXT CATALOG FT_CATALOG_BuildEstate;
            ");

            // Drop search indexes on existing tables
            migrationBuilder.DropIndex(
                name: "IX_Documents_FileName",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_LegalCases_Title",
                table: "LegalCases");

            migrationBuilder.DropIndex(
                name: "IX_LandOpportunities_Location",
                table: "LandOpportunities");

            migrationBuilder.DropIndex(
                name: "IX_LandOpportunities_Name",
                table: "LandOpportunities");

            // Drop search tables
            migrationBuilder.DropTable(
                name: "SavedSearches");

            migrationBuilder.DropTable(
                name: "PinnedItems");

            migrationBuilder.DropTable(
                name: "RecentSearches");
        }
    }
}
