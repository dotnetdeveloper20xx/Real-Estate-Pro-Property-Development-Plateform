using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BuildEstate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EnhanceNotificationEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Channel",
                table: "Notifications",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "InApp");

            migrationBuilder.AddColumn<string>(
                name: "DeliveryStatus",
                table: "Notifications",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Delivered");

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "Notifications",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "notifications");

            migrationBuilder.AddColumn<string>(
                name: "Module",
                table: "Notifications",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "Notifications",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Normal");

            migrationBuilder.AddColumn<DateTime>(
                name: "ReadAt",
                table: "Notifications",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RelatedEntityType",
                table: "Notifications",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RelatedUrl",
                table: "Notifications",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Severity",
                table: "Notifications",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Info");

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "Notifications",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "NotificationTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TitleTemplate = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    BodyTemplate = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    IconName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Severity = table.Column<int>(type: "int", nullable: false),
                    Variables = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserNotificationPreferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    InAppEnabled = table.Column<bool>(type: "bit", nullable: false),
                    EmailEnabled = table.Column<bool>(type: "bit", nullable: false),
                    MutedUntil = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNotificationPreferences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Module = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    RecipientType = table.Column<int>(type: "int", nullable: false),
                    RecipientValue = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Channel = table.Column<int>(type: "int", nullable: false),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NotificationRules_NotificationTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "NotificationTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "NotificationTemplates",
                columns: new[] { "Id", "BodyTemplate", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "EventType", "IconName", "IsActive", "IsDeleted", "Name", "Severity", "TitleTemplate", "UpdatedAt", "UpdatedBy", "Variables" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000001"), "A new land opportunity has been added at {location}", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "OpportunityCreated", "add_location", true, false, "OpportunityCreated", 0, "New Opportunity: {opportunityName}", null, null, "[\"opportunityName\",\"location\"]" },
                    { new Guid("10000000-0000-0000-0000-000000000002"), "The acquisition of {opportunityName} is complete", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "OpportunityAcquired", "check_circle", true, false, "OpportunityAcquired", 1, "Land Acquired: {opportunityName}", null, null, "[\"opportunityName\"]" },
                    { new Guid("10000000-0000-0000-0000-000000000003"), "{opportunityName} has been withdrawn. Reason: {reason}", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "OpportunityWithdrawn", "cancel", true, false, "OpportunityWithdrawn", 2, "Opportunity Withdrawn: {opportunityName}", null, null, "[\"opportunityName\",\"reason\"]" },
                    { new Guid("10000000-0000-0000-0000-000000000004"), "A £{amount} offer has been submitted for {opportunityName}", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "OfferSubmitted", "local_offer", true, false, "OfferSubmitted", 0, "New Offer: {opportunityName}", null, null, "[\"opportunityName\",\"amount\"]" },
                    { new Guid("10000000-0000-0000-0000-000000000005"), "The £{amount} offer for {opportunityName} has been accepted", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "OfferAccepted", "thumb_up", true, false, "OfferAccepted", 1, "Offer Accepted: {opportunityName}", null, null, "[\"opportunityName\",\"amount\"]" },
                    { new Guid("10000000-0000-0000-0000-000000000006"), "The offer for {opportunityName} has expired", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "OfferExpired", "schedule", true, false, "OfferExpired", 2, "Offer Expired: {opportunityName}", null, null, "[\"opportunityName\"]" },
                    { new Guid("10000000-0000-0000-0000-000000000007"), "{checkType} due diligence for {opportunityName} is complete", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "DueDiligenceCompleted", "verified", true, false, "DueDiligenceCompleted", 1, "DD Complete: {opportunityName}", null, null, "[\"opportunityName\",\"checkType\"]" },
                    { new Guid("10000000-0000-0000-0000-000000000008"), "{checkType} due diligence for {opportunityName} has failed", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "DueDiligenceFailed", "error", true, false, "DueDiligenceFailed", 3, "DD Failed: {opportunityName}", null, null, "[\"opportunityName\",\"checkType\"]" },
                    { new Guid("10000000-0000-0000-0000-000000000009"), "An approval has been requested for {opportunityName} (£{amount})", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "ApprovalRequested", "approval", true, false, "ApprovalRequested", 2, "Approval Needed", null, null, "[\"opportunityName\",\"amount\"]" },
                    { new Guid("10000000-0000-0000-0000-000000000010"), "The approval request for {opportunityName} has been {decision}", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "ApprovalDecided", "gavel", true, false, "ApprovalDecided", 0, "Approval Decision", null, null, "[\"opportunityName\",\"decision\"]" },
                    { new Guid("10000000-0000-0000-0000-000000000011"), "Contracts have been exchanged for {opportunityName}", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "ContractExchanged", "handshake", true, false, "ContractExchanged", 1, "Contract Exchanged: {opportunityName}", null, null, "[\"opportunityName\"]" },
                    { new Guid("10000000-0000-0000-0000-000000000012"), "A new {docType} document has been uploaded for {opportunityName}", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "DocumentUploaded", "upload_file", true, false, "DocumentUploaded", 0, "New Document", null, null, "[\"opportunityName\",\"docType\"]" },
                    { new Guid("10000000-0000-0000-0000-000000000013"), "The feasibility assessment for {opportunityName} is ready for review", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "FeasibilityReady", "assessment", true, false, "FeasibilityReady", 0, "Feasibility Ready for Review", null, null, "[\"opportunityName\"]" }
                });

            migrationBuilder.InsertData(
                table: "NotificationRules",
                columns: new[] { "Id", "Channel", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "EventType", "IsActive", "IsDeleted", "Module", "Priority", "RecipientType", "RecipientValue", "TemplateId", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("20000000-0000-0000-0000-000000000001"), 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "Notify the entity creator when an offer expires", "OfferExpired", true, false, "LandAcquisition", 2, 2, "", new Guid("10000000-0000-0000-0000-000000000006"), null, null },
                    { new Guid("20000000-0000-0000-0000-000000000002"), 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "Notify the entity creator when due diligence fails", "DueDiligenceFailed", true, false, "LandAcquisition", 2, 2, "", new Guid("10000000-0000-0000-0000-000000000008"), null, null },
                    { new Guid("20000000-0000-0000-0000-000000000003"), 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "Notify Finance Director when approval is requested", "ApprovalRequested", true, false, "LandAcquisition", 3, 0, "FinanceDirector", new Guid("10000000-0000-0000-0000-000000000009"), null, null },
                    { new Guid("20000000-0000-0000-0000-000000000004"), 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "Notify the entity creator when an approval decision is made", "ApprovalDecided", true, false, "LandAcquisition", 2, 2, "", new Guid("10000000-0000-0000-0000-000000000010"), null, null },
                    { new Guid("20000000-0000-0000-0000-000000000005"), 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "Notify all Land Acquisition roles when an opportunity is acquired", "OpportunityAcquired", true, false, "LandAcquisition", 2, 4, "LandAcquisition", new Guid("10000000-0000-0000-0000-000000000002"), null, null },
                    { new Guid("20000000-0000-0000-0000-000000000006"), 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "Notify the entity creator when an offer is accepted", "OfferAccepted", true, false, "LandAcquisition", 1, 2, "", new Guid("10000000-0000-0000-0000-000000000005"), null, null },
                    { new Guid("20000000-0000-0000-0000-000000000007"), 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "Notify all Land Acquisition roles when contracts are exchanged", "ContractExchanged", true, false, "LandAcquisition", 2, 4, "LandAcquisition", new Guid("10000000-0000-0000-0000-000000000011"), null, null },
                    { new Guid("20000000-0000-0000-0000-000000000008"), 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "Notify Finance Director when feasibility is ready for review", "FeasibilityReady", true, false, "LandAcquisition", 1, 0, "FinanceDirector", new Guid("10000000-0000-0000-0000-000000000013"), null, null },
                    { new Guid("20000000-0000-0000-0000-000000000009"), 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "Notify the entity creator when an opportunity is withdrawn", "OpportunityWithdrawn", true, false, "LandAcquisition", 1, 2, "", new Guid("10000000-0000-0000-0000-000000000003"), null, null },
                    { new Guid("20000000-0000-0000-0000-000000000010"), 0, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "System", null, null, "Notify the entity creator when a document is uploaded", "DocumentUploaded", true, false, "LandAcquisition", 0, 2, "", new Guid("10000000-0000-0000-0000-000000000012"), null, null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_EventType",
                table: "Notifications",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_Module",
                table: "Notifications",
                column: "Module");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRules_EventType_IsActive",
                table: "NotificationRules",
                columns: new[] { "EventType", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRules_Module",
                table: "NotificationRules",
                column: "Module");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationRules_TemplateId",
                table: "NotificationRules",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationTemplates_EventType",
                table: "NotificationTemplates",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotificationPreferences_UserId_EventType",
                table: "UserNotificationPreferences",
                columns: new[] { "UserId", "EventType" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NotificationRules");

            migrationBuilder.DropTable(
                name: "UserNotificationPreferences");

            migrationBuilder.DropTable(
                name: "NotificationTemplates");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_EventType",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_Module",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Channel",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "DeliveryStatus",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Module",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "ReadAt",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RelatedEntityType",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RelatedUrl",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Severity",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "Notifications");
        }
    }
}
