using BuildEstate.Domain.Entities.Notifications;
using BuildEstate.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BuildEstate.Infrastructure.Persistence.Seeds;

/// <summary>
/// Seeds default notification templates and rules for the Land Acquisition module.
/// Uses deterministic GUIDs for idempotent migrations.
/// </summary>
public static class NotificationSeedData
{
    // Deterministic template IDs
    private static readonly Guid TemplateOpportunityCreated = new("10000000-0000-0000-0000-000000000001");
    private static readonly Guid TemplateOpportunityAcquired = new("10000000-0000-0000-0000-000000000002");
    private static readonly Guid TemplateOpportunityWithdrawn = new("10000000-0000-0000-0000-000000000003");
    private static readonly Guid TemplateOfferSubmitted = new("10000000-0000-0000-0000-000000000004");
    private static readonly Guid TemplateOfferAccepted = new("10000000-0000-0000-0000-000000000005");
    private static readonly Guid TemplateOfferExpired = new("10000000-0000-0000-0000-000000000006");
    private static readonly Guid TemplateDueDiligenceCompleted = new("10000000-0000-0000-0000-000000000007");
    private static readonly Guid TemplateDueDiligenceFailed = new("10000000-0000-0000-0000-000000000008");
    private static readonly Guid TemplateApprovalRequested = new("10000000-0000-0000-0000-000000000009");
    private static readonly Guid TemplateApprovalDecided = new("10000000-0000-0000-0000-000000000010");
    private static readonly Guid TemplateContractExchanged = new("10000000-0000-0000-0000-000000000011");
    private static readonly Guid TemplateDocumentUploaded = new("10000000-0000-0000-0000-000000000012");
    private static readonly Guid TemplateFeasibilityReady = new("10000000-0000-0000-0000-000000000013");

    // Deterministic rule IDs
    private static readonly Guid RuleOfferExpired = new("20000000-0000-0000-0000-000000000001");
    private static readonly Guid RuleDueDiligenceFailed = new("20000000-0000-0000-0000-000000000002");
    private static readonly Guid RuleApprovalRequested = new("20000000-0000-0000-0000-000000000003");
    private static readonly Guid RuleApprovalDecided = new("20000000-0000-0000-0000-000000000004");
    private static readonly Guid RuleOpportunityAcquired = new("20000000-0000-0000-0000-000000000005");
    private static readonly Guid RuleOfferAccepted = new("20000000-0000-0000-0000-000000000006");
    private static readonly Guid RuleContractExchanged = new("20000000-0000-0000-0000-000000000007");
    private static readonly Guid RuleFeasibilityReady = new("20000000-0000-0000-0000-000000000008");
    private static readonly Guid RuleOpportunityWithdrawn = new("20000000-0000-0000-0000-000000000009");
    private static readonly Guid RuleDocumentUploaded = new("20000000-0000-0000-0000-000000000010");

    private static readonly DateTime SeedDate = new(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public static void SeedNotificationRulesAndTemplates(ModelBuilder builder)
    {
        SeedTemplates(builder);
        SeedRules(builder);
    }

    private static void SeedTemplates(ModelBuilder builder)
    {
        builder.Entity<NotificationTemplate>().HasData(
            new NotificationTemplate
            {
                Id = TemplateOpportunityCreated,
                Name = "OpportunityCreated",
                EventType = "OpportunityCreated",
                TitleTemplate = "New Opportunity: {opportunityName}",
                BodyTemplate = "A new land opportunity has been added at {location}",
                IconName = "add_location",
                Severity = NotificationSeverity.Info,
                Variables = "[\"opportunityName\",\"location\"]",
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationTemplate
            {
                Id = TemplateOpportunityAcquired,
                Name = "OpportunityAcquired",
                EventType = "OpportunityAcquired",
                TitleTemplate = "Land Acquired: {opportunityName}",
                BodyTemplate = "The acquisition of {opportunityName} is complete",
                IconName = "check_circle",
                Severity = NotificationSeverity.Success,
                Variables = "[\"opportunityName\"]",
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationTemplate
            {
                Id = TemplateOpportunityWithdrawn,
                Name = "OpportunityWithdrawn",
                EventType = "OpportunityWithdrawn",
                TitleTemplate = "Opportunity Withdrawn: {opportunityName}",
                BodyTemplate = "{opportunityName} has been withdrawn. Reason: {reason}",
                IconName = "cancel",
                Severity = NotificationSeverity.Warning,
                Variables = "[\"opportunityName\",\"reason\"]",
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationTemplate
            {
                Id = TemplateOfferSubmitted,
                Name = "OfferSubmitted",
                EventType = "OfferSubmitted",
                TitleTemplate = "New Offer: {opportunityName}",
                BodyTemplate = "A £{amount} offer has been submitted for {opportunityName}",
                IconName = "local_offer",
                Severity = NotificationSeverity.Info,
                Variables = "[\"opportunityName\",\"amount\"]",
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationTemplate
            {
                Id = TemplateOfferAccepted,
                Name = "OfferAccepted",
                EventType = "OfferAccepted",
                TitleTemplate = "Offer Accepted: {opportunityName}",
                BodyTemplate = "The £{amount} offer for {opportunityName} has been accepted",
                IconName = "thumb_up",
                Severity = NotificationSeverity.Success,
                Variables = "[\"opportunityName\",\"amount\"]",
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationTemplate
            {
                Id = TemplateOfferExpired,
                Name = "OfferExpired",
                EventType = "OfferExpired",
                TitleTemplate = "Offer Expired: {opportunityName}",
                BodyTemplate = "The offer for {opportunityName} has expired",
                IconName = "schedule",
                Severity = NotificationSeverity.Warning,
                Variables = "[\"opportunityName\"]",
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationTemplate
            {
                Id = TemplateDueDiligenceCompleted,
                Name = "DueDiligenceCompleted",
                EventType = "DueDiligenceCompleted",
                TitleTemplate = "DD Complete: {opportunityName}",
                BodyTemplate = "{checkType} due diligence for {opportunityName} is complete",
                IconName = "verified",
                Severity = NotificationSeverity.Success,
                Variables = "[\"opportunityName\",\"checkType\"]",
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationTemplate
            {
                Id = TemplateDueDiligenceFailed,
                Name = "DueDiligenceFailed",
                EventType = "DueDiligenceFailed",
                TitleTemplate = "DD Failed: {opportunityName}",
                BodyTemplate = "{checkType} due diligence for {opportunityName} has failed",
                IconName = "error",
                Severity = NotificationSeverity.Error,
                Variables = "[\"opportunityName\",\"checkType\"]",
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationTemplate
            {
                Id = TemplateApprovalRequested,
                Name = "ApprovalRequested",
                EventType = "ApprovalRequested",
                TitleTemplate = "Approval Needed",
                BodyTemplate = "An approval has been requested for {opportunityName} (£{amount})",
                IconName = "approval",
                Severity = NotificationSeverity.Warning,
                Variables = "[\"opportunityName\",\"amount\"]",
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationTemplate
            {
                Id = TemplateApprovalDecided,
                Name = "ApprovalDecided",
                EventType = "ApprovalDecided",
                TitleTemplate = "Approval Decision",
                BodyTemplate = "The approval request for {opportunityName} has been {decision}",
                IconName = "gavel",
                Severity = NotificationSeverity.Info,
                Variables = "[\"opportunityName\",\"decision\"]",
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationTemplate
            {
                Id = TemplateContractExchanged,
                Name = "ContractExchanged",
                EventType = "ContractExchanged",
                TitleTemplate = "Contract Exchanged: {opportunityName}",
                BodyTemplate = "Contracts have been exchanged for {opportunityName}",
                IconName = "handshake",
                Severity = NotificationSeverity.Success,
                Variables = "[\"opportunityName\"]",
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationTemplate
            {
                Id = TemplateDocumentUploaded,
                Name = "DocumentUploaded",
                EventType = "DocumentUploaded",
                TitleTemplate = "New Document",
                BodyTemplate = "A new {docType} document has been uploaded for {opportunityName}",
                IconName = "upload_file",
                Severity = NotificationSeverity.Info,
                Variables = "[\"opportunityName\",\"docType\"]",
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationTemplate
            {
                Id = TemplateFeasibilityReady,
                Name = "FeasibilityReady",
                EventType = "FeasibilityReady",
                TitleTemplate = "Feasibility Ready for Review",
                BodyTemplate = "The feasibility assessment for {opportunityName} is ready for review",
                IconName = "assessment",
                Severity = NotificationSeverity.Info,
                Variables = "[\"opportunityName\"]",
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            }
        );
    }

    private static void SeedRules(ModelBuilder builder)
    {
        builder.Entity<NotificationRule>().HasData(
            new NotificationRule
            {
                Id = RuleOfferExpired,
                EventType = "OfferExpired",
                Module = "LandAcquisition",
                Description = "Notify the entity creator when an offer expires",
                RecipientType = RecipientType.EntityCreator,
                RecipientValue = "",
                Channel = NotificationChannel.InApp,
                Priority = NotificationPriority.High,
                TemplateId = TemplateOfferExpired,
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationRule
            {
                Id = RuleDueDiligenceFailed,
                EventType = "DueDiligenceFailed",
                Module = "LandAcquisition",
                Description = "Notify the entity creator when due diligence fails",
                RecipientType = RecipientType.EntityCreator,
                RecipientValue = "",
                Channel = NotificationChannel.InApp,
                Priority = NotificationPriority.High,
                TemplateId = TemplateDueDiligenceFailed,
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationRule
            {
                Id = RuleApprovalRequested,
                EventType = "ApprovalRequested",
                Module = "LandAcquisition",
                Description = "Notify Finance Director when approval is requested",
                RecipientType = RecipientType.Role,
                RecipientValue = "FinanceDirector",
                Channel = NotificationChannel.InApp,
                Priority = NotificationPriority.Urgent,
                TemplateId = TemplateApprovalRequested,
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationRule
            {
                Id = RuleApprovalDecided,
                EventType = "ApprovalDecided",
                Module = "LandAcquisition",
                Description = "Notify the entity creator when an approval decision is made",
                RecipientType = RecipientType.EntityCreator,
                RecipientValue = "",
                Channel = NotificationChannel.InApp,
                Priority = NotificationPriority.High,
                TemplateId = TemplateApprovalDecided,
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationRule
            {
                Id = RuleOpportunityAcquired,
                EventType = "OpportunityAcquired",
                Module = "LandAcquisition",
                Description = "Notify all Land Acquisition roles when an opportunity is acquired",
                RecipientType = RecipientType.AllModuleRoles,
                RecipientValue = "LandAcquisition",
                Channel = NotificationChannel.InApp,
                Priority = NotificationPriority.High,
                TemplateId = TemplateOpportunityAcquired,
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationRule
            {
                Id = RuleOfferAccepted,
                EventType = "OfferAccepted",
                Module = "LandAcquisition",
                Description = "Notify the entity creator when an offer is accepted",
                RecipientType = RecipientType.EntityCreator,
                RecipientValue = "",
                Channel = NotificationChannel.InApp,
                Priority = NotificationPriority.Normal,
                TemplateId = TemplateOfferAccepted,
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationRule
            {
                Id = RuleContractExchanged,
                EventType = "ContractExchanged",
                Module = "LandAcquisition",
                Description = "Notify all Land Acquisition roles when contracts are exchanged",
                RecipientType = RecipientType.AllModuleRoles,
                RecipientValue = "LandAcquisition",
                Channel = NotificationChannel.InApp,
                Priority = NotificationPriority.High,
                TemplateId = TemplateContractExchanged,
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationRule
            {
                Id = RuleFeasibilityReady,
                EventType = "FeasibilityReady",
                Module = "LandAcquisition",
                Description = "Notify Finance Director when feasibility is ready for review",
                RecipientType = RecipientType.Role,
                RecipientValue = "FinanceDirector",
                Channel = NotificationChannel.InApp,
                Priority = NotificationPriority.Normal,
                TemplateId = TemplateFeasibilityReady,
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationRule
            {
                Id = RuleOpportunityWithdrawn,
                EventType = "OpportunityWithdrawn",
                Module = "LandAcquisition",
                Description = "Notify the entity creator when an opportunity is withdrawn",
                RecipientType = RecipientType.EntityCreator,
                RecipientValue = "",
                Channel = NotificationChannel.InApp,
                Priority = NotificationPriority.Normal,
                TemplateId = TemplateOpportunityWithdrawn,
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            },
            new NotificationRule
            {
                Id = RuleDocumentUploaded,
                EventType = "DocumentUploaded",
                Module = "LandAcquisition",
                Description = "Notify the entity creator when a document is uploaded",
                RecipientType = RecipientType.EntityCreator,
                RecipientValue = "",
                Channel = NotificationChannel.InApp,
                Priority = NotificationPriority.Low,
                TemplateId = TemplateDocumentUploaded,
                IsActive = true,
                CreatedAt = SeedDate,
                CreatedBy = "System"
            }
        );
    }
}
