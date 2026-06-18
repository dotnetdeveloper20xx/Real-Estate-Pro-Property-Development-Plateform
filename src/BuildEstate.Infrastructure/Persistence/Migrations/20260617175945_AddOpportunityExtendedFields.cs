using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuildEstate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOpportunityExtendedFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "County",
                table: "LandOpportunities",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentUse",
                table: "LandOpportunities",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "LandOpportunities",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SiteType",
                table: "LandOpportunities",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tenure",
                table: "LandOpportunities",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "County",
                table: "LandOpportunities");

            migrationBuilder.DropColumn(
                name: "CurrentUse",
                table: "LandOpportunities");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "LandOpportunities");

            migrationBuilder.DropColumn(
                name: "SiteType",
                table: "LandOpportunities");

            migrationBuilder.DropColumn(
                name: "Tenure",
                table: "LandOpportunities");
        }
    }
}
