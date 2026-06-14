using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BuildEstate.Infrastructure.Persistence;

/// <summary>
/// Seeds realistic UK property development demo data for stakeholder presentations.
/// All operations are idempotent — safe to run multiple times without creating duplicates.
/// Should only be called in Development environment after IdentitySeeder.
/// </summary>
public static class DemoDataSeeder
{
    private const string DefaultPassword = "Demo@123456";
    private const string SystemUser = "system@buildestate.co.uk";

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<BuildEstateDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        // Idempotency check — if demo data already exists, skip seeding
        if (await context.LandOpportunities.AnyAsync())
            return;

        // 1. Seed demo users
        var users = await SeedDemoUsersAsync(userManager);

        // 2. Seed land opportunities with owners
        var opportunities = SeedLandOpportunities(context, users);

        // 3. Seed due diligence records
        SeedDueDiligence(context, opportunities, users);

        // 4. Seed offers
        SeedOffers(context, opportunities, users);

        // 5. Seed feasibility assessments
        SeedFeasibilityAssessments(context, opportunities, users);

        // 6. Seed planning applications
        var planningApps = SeedPlanningApplications(context, opportunities, users);

        // 7. Seed legal cases
        SeedLegalCases(context, opportunities, planningApps, users);

        // 8. Seed compliance requirements
        SeedComplianceRequirements(context, users);

        // 9. Seed insurance records
        SeedInsuranceRecords(context, users);

        await context.SaveChangesAsync();
    }

    #region Demo Users

    private static async Task<Dictionary<string, string>> SeedDemoUsersAsync(
        UserManager<ApplicationUser> userManager)
    {
        var users = new Dictionary<string, string>();

        var demoUsers = new[]
        {
            ("john.mitchell@buildestate.co.uk", "John", "Mitchell", "AcquisitionManager"),
            ("sarah.williams@buildestate.co.uk", "Sarah", "Williams", "LegalOfficer"),
            ("david.thompson@buildestate.co.uk", "David", "Thompson", "PlanningManager"),
            ("emma.clarke@buildestate.co.uk", "Emma", "Clarke", "FinanceDirector"),
            ("robert.harris@buildestate.co.uk", "Robert", "Harris", "ProjectManager"),
            ("lisa.anderson@buildestate.co.uk", "Lisa", "Anderson", "Admin")
        };

        foreach (var (email, firstName, lastName, role) in demoUsers)
        {
            var existingUser = await userManager.FindByEmailAsync(email);
            if (existingUser is null)
            {
                var user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    FirstName = firstName,
                    LastName = lastName,
                    IsActive = true,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(user, DefaultPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, role);
                }
            }

            users[role] = email;
        }

        return users;
    }

    #endregion

    #region Land Opportunities

    private static List<LandOpportunity> SeedLandOpportunities(
        BuildEstateDbContext context,
        Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var acquisitionMgr = users["AcquisitionManager"];

        var opportunities = new List<LandOpportunity>
        {
            // 2x Identified (new leads)
            CreateOpportunity(
                "Greenfield Site, Epping Forest",
                "Epping, Essex, CM16 5HW",
                2.4m,
                OpportunityStatus.Identified,
                "Agent Referral",
                now.AddMonths(8),
                now.AddDays(-5),
                acquisitionMgr),

            CreateOpportunity(
                "Former Industrial Land, Croydon",
                "Purley Way, Croydon, CR0 4RG",
                1.1m,
                OpportunityStatus.Identified,
                "Off-Market",
                now.AddMonths(10),
                now.AddDays(-2),
                acquisitionMgr),

            // 2x InitialReview
            CreateOpportunity(
                "Residential Plot, Richmond",
                "Kew Road, Richmond, TW9 2NQ",
                0.8m,
                OpportunityStatus.InitialReview,
                "Auction Listing",
                now.AddMonths(6),
                now.AddDays(-21),
                acquisitionMgr),

            CreateOpportunity(
                "Mixed-Use Site, Stratford",
                "Stratford High Street, London, E15 2QN",
                3.2m,
                OpportunityStatus.InitialReview,
                "Council Disposal",
                now.AddMonths(9),
                now.AddDays(-14),
                acquisitionMgr),

            // 2x DueDiligence (in progress)
            CreateOpportunity(
                "Brownfield Land, Woolwich",
                "Royal Arsenal, Woolwich, SE18 6GH",
                4.5m,
                OpportunityStatus.DueDiligence,
                "Direct Approach",
                now.AddMonths(5),
                now.AddDays(-45),
                acquisitionMgr),

            CreateOpportunity(
                "Development Plot, Canary Wharf",
                "Westferry Road, Isle of Dogs, E14 8JH",
                1.8m,
                OpportunityStatus.DueDiligence,
                "Agent Referral",
                now.AddMonths(4),
                now.AddDays(-38),
                acquisitionMgr),

            // 1x OfferMade
            CreateOpportunity(
                "Former School Site, Hampstead",
                "Fitzjohns Avenue, Hampstead, NW3 5LT",
                1.5m,
                OpportunityStatus.OfferMade,
                "Public Sector Disposal",
                now.AddMonths(3),
                now.AddDays(-75),
                acquisitionMgr),

            // 1x UnderContract
            CreateOpportunity(
                "Waterfront Land, Greenwich",
                "Millennium Way, Greenwich, SE10 0PH",
                5.2m,
                OpportunityStatus.UnderContract,
                "Direct Approach",
                now.AddMonths(2),
                now.AddDays(-120),
                acquisitionMgr),

            // 1x Acquired (completed)
            CreateOpportunity(
                "Residential Land, Battersea",
                "Battersea Park Road, London, SW11 4NJ",
                2.1m,
                OpportunityStatus.Acquired,
                "Agent Referral",
                null,
                now.AddDays(-180),
                acquisitionMgr),

            // 1x Withdrawn
            CreateOpportunity(
                "Farm Land, Barnet",
                "Arkley Lane, Barnet, EN5 3JB",
                6.0m,
                OpportunityStatus.Withdrawn,
                "Off-Market",
                null,
                now.AddDays(-90),
                acquisitionMgr)
        };

        // Set withdrawal reason for the withdrawn opportunity
        opportunities[9].WithdrawalReason = "Environmental contamination discovered — remediation costs exceed land value.";

        context.LandOpportunities.AddRange(opportunities);

        // Seed matching LandOwner records for each opportunity
        SeedLandOwners(context, opportunities, acquisitionMgr, now);

        return opportunities;
    }

    private static LandOpportunity CreateOpportunity(
        string name,
        string location,
        decimal landSize,
        OpportunityStatus status,
        string source,
        DateTime? expectedAcquisition,
        DateTime createdAt,
        string createdBy)
    {
        return new LandOpportunity
        {
            Id = Guid.NewGuid(),
            Name = name,
            Location = location,
            LandSize = landSize,
            Status = status,
            Source = source,
            ExpectedAcquisition = expectedAcquisition,
            CreatedAt = createdAt,
            CreatedBy = createdBy,
            IsDeleted = false
        };
    }

    private static void SeedLandOwners(
        BuildEstateDbContext context,
        List<LandOpportunity> opportunities,
        string createdBy,
        DateTime now)
    {
        var owners = new List<LandOwner>
        {
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[0].Id,
                Name = "Epping Forest Trust Ltd",
                ContactDetails = "enquiries@eppingforesttrust.co.uk | 020 7946 0123",
                Address = "Trust House, Epping, Essex, CM16 4DN",
                OwnershipType = OwnershipType.Freehold,
                CreatedAt = now.AddDays(-5),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[1].Id,
                Name = "Croydon Industrial Holdings PLC",
                ContactDetails = "land@croydonindustrial.co.uk | 020 8688 4455",
                Address = "Commerce House, 14 George Street, Croydon, CR0 1LA",
                OwnershipType = OwnershipType.Freehold,
                CreatedAt = now.AddDays(-2),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[2].Id,
                Name = "Richmond Borough Estates",
                ContactDetails = "disposals@richmondestates.co.uk | 020 8940 3377",
                Address = "York House, Twickenham Road, Richmond, TW1 3AA",
                OwnershipType = OwnershipType.Freehold,
                CreatedAt = now.AddDays(-21),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[3].Id,
                Name = "London Borough of Newham",
                ContactDetails = "property.services@newham.gov.uk | 020 8430 2000",
                Address = "Newham Dockside, 1000 Dockside Road, London, E16 2QU",
                OwnershipType = OwnershipType.Freehold,
                CreatedAt = now.AddDays(-14),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[4].Id,
                Name = "Ministry of Defence Estates",
                ContactDetails = "dio-land@mod.uk | 0800 169 1234",
                Address = "DIO Head Office, St George's House, Sutton Coldfield, B75 7RL",
                OwnershipType = OwnershipType.Freehold,
                CreatedAt = now.AddDays(-45),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[5].Id,
                Name = "Docklands Development Corp",
                ContactDetails = "acquisitions@docklandscorp.co.uk | 020 7517 8900",
                Address = "Canary Wharf Tower, 1 Canada Square, London, E14 5AB",
                OwnershipType = OwnershipType.Leasehold,
                CreatedAt = now.AddDays(-38),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[6].Id,
                Name = "Camden Council Education Department",
                ContactDetails = "property@camden.gov.uk | 020 7974 4444",
                Address = "5 Pancras Square, London, N1C 4AG",
                OwnershipType = OwnershipType.Freehold,
                CreatedAt = now.AddDays(-75),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[7].Id,
                Name = "Greenwich Peninsula Partnership",
                ContactDetails = "land.sales@greenwichpeninsula.co.uk | 020 8305 4789",
                Address = "The Gateway Pavilions, Greenwich Peninsula, SE10 0ES",
                OwnershipType = OwnershipType.Freehold,
                CreatedAt = now.AddDays(-120),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[8].Id,
                Name = "Battersea Power Station Development Company",
                ContactDetails = "land@bpsdc.co.uk | 020 7501 0678",
                Address = "Battersea Power Station, 188 Kirtling Street, London, SW8 5BN",
                OwnershipType = OwnershipType.Freehold,
                CreatedAt = now.AddDays(-180),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[9].Id,
                Name = "Arkley Farm Holdings",
                ContactDetails = "office@arkleyfarm.co.uk | 020 8449 7766",
                Address = "Arkley Farm, Rowley Lane, Barnet, EN5 3HN",
                OwnershipType = OwnershipType.Freehold,
                CreatedAt = now.AddDays(-90),
                CreatedBy = createdBy,
                IsDeleted = false
            }
        };

        context.LandOwners.AddRange(owners);
    }

    #endregion

    #region Due Diligence

    private static void SeedDueDiligence(
        BuildEstateDbContext context,
        List<LandOpportunity> opportunities,
        Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var legalOfficer = users["LegalOfficer"];

        // Due diligence for opportunities past InitialReview (indices 4-8)
        var ddRecords = new List<DueDiligence>
        {
            // Woolwich (DueDiligence status) — mix of statuses
            CreateDueDiligence(opportunities[4].Id, DueDiligenceType.Legal, DueDiligenceStatus.Completed,
                "Title clear. No encumbrances identified. Freehold confirmed via Land Registry.",
                now.AddDays(-30), now.AddDays(-35), legalOfficer),

            CreateDueDiligence(opportunities[4].Id, DueDiligenceType.Environmental, DueDiligenceStatus.InProgress,
                null, null, now.AddDays(-28), legalOfficer),

            CreateDueDiligence(opportunities[4].Id, DueDiligenceType.Planning, DueDiligenceStatus.Completed,
                "Site allocated for residential in Local Plan 2021. No Green Belt constraints.",
                now.AddDays(-20), now.AddDays(-32), legalOfficer),

            CreateDueDiligence(opportunities[4].Id, DueDiligenceType.Utilities, DueDiligenceStatus.Pending,
                null, null, now.AddDays(-25), legalOfficer),

            CreateDueDiligence(opportunities[4].Id, DueDiligenceType.Valuation, DueDiligenceStatus.InProgress,
                null, null, now.AddDays(-22), legalOfficer),

            // Canary Wharf (DueDiligence status)
            CreateDueDiligence(opportunities[5].Id, DueDiligenceType.Legal, DueDiligenceStatus.Completed,
                "Leasehold with 125-year term remaining. Ground rent £2,500 p.a. No restrictions on development.",
                now.AddDays(-25), now.AddDays(-30), legalOfficer),

            CreateDueDiligence(opportunities[5].Id, DueDiligenceType.Environmental, DueDiligenceStatus.Completed,
                "Phase 1 desk study complete. Low risk. No contamination indicators.",
                now.AddDays(-22), now.AddDays(-28), legalOfficer),

            CreateDueDiligence(opportunities[5].Id, DueDiligenceType.Planning, DueDiligenceStatus.InProgress,
                null, null, now.AddDays(-20), legalOfficer),

            CreateDueDiligence(opportunities[5].Id, DueDiligenceType.Utilities, DueDiligenceStatus.Completed,
                "Thames Water and UKPN capacity confirmed. Gas main 50m from site boundary.",
                now.AddDays(-18), now.AddDays(-26), legalOfficer),

            // Hampstead (OfferMade) — all completed
            CreateDueDiligence(opportunities[6].Id, DueDiligenceType.Legal, DueDiligenceStatus.Completed,
                "Freehold. Section 106 obligation attached — 35% affordable housing requirement.",
                now.AddDays(-55), now.AddDays(-65), legalOfficer),

            CreateDueDiligence(opportunities[6].Id, DueDiligenceType.Environmental, DueDiligenceStatus.Completed,
                "Phase 2 intrusive investigation complete. Minor asbestos in former boiler room — removal cost estimated £45,000.",
                now.AddDays(-50), now.AddDays(-60), legalOfficer),

            CreateDueDiligence(opportunities[6].Id, DueDiligenceType.Planning, DueDiligenceStatus.Completed,
                "Pre-application meeting positive. Council supports residential conversion. Conservation area — design constraints apply.",
                now.AddDays(-48), now.AddDays(-58), legalOfficer),

            CreateDueDiligence(opportunities[6].Id, DueDiligenceType.Valuation, DueDiligenceStatus.Completed,
                "Red Book valuation: £3.8M. Residual land value supports 22% margin on 24-unit scheme.",
                now.AddDays(-45), now.AddDays(-55), legalOfficer),

            // Greenwich (UnderContract) — all completed
            CreateDueDiligence(opportunities[7].Id, DueDiligenceType.Legal, DueDiligenceStatus.Completed,
                "Clear title. Restrictive covenant removed via Lands Tribunal. Full development rights confirmed.",
                now.AddDays(-90), now.AddDays(-110), legalOfficer),

            CreateDueDiligence(opportunities[7].Id, DueDiligenceType.Environmental, DueDiligenceStatus.Completed,
                "Remediation strategy approved by EA. Costs included in land price negotiation.",
                now.AddDays(-85), now.AddDays(-105), legalOfficer),

            CreateDueDiligence(opportunities[7].Id, DueDiligenceType.Planning, DueDiligenceStatus.Completed,
                "Outline planning granted for 150 units (ref: 23/0456/OUT). Reserved matters pending.",
                now.AddDays(-80), now.AddDays(-100), legalOfficer),

            CreateDueDiligence(opportunities[7].Id, DueDiligenceType.Utilities, DueDiligenceStatus.Completed,
                "All utilities confirmed. New substation required — UKPN quote £180,000.",
                now.AddDays(-78), now.AddDays(-95), legalOfficer),

            CreateDueDiligence(opportunities[7].Id, DueDiligenceType.Valuation, DueDiligenceStatus.Completed,
                "Residual appraisal: GDV £62M. Land value £4.8M supports 25% profit on cost.",
                now.AddDays(-75), now.AddDays(-92), legalOfficer),

            // Battersea (Acquired) — all completed
            CreateDueDiligence(opportunities[8].Id, DueDiligenceType.Legal, DueDiligenceStatus.Completed,
                "Title registered. All searches clear. No ongoing liabilities.",
                now.AddDays(-160), now.AddDays(-170), legalOfficer),

            CreateDueDiligence(opportunities[8].Id, DueDiligenceType.Environmental, DueDiligenceStatus.Completed,
                "Clean site. Former residential garden land. No remediation required.",
                now.AddDays(-155), now.AddDays(-168), legalOfficer),

            CreateDueDiligence(opportunities[8].Id, DueDiligenceType.Planning, DueDiligenceStatus.Completed,
                "Full planning permission granted for 45-unit residential scheme.",
                now.AddDays(-150), now.AddDays(-165), legalOfficer),

            // Farm Land (Withdrawn) — one failed
            CreateDueDiligence(opportunities[9].Id, DueDiligenceType.Environmental, DueDiligenceStatus.Failed,
                "Significant hydrocarbon contamination from historic fuel storage. Remediation estimated at £2.1M — exceeds land value.",
                now.AddDays(-70), now.AddDays(-80), legalOfficer)
        };

        context.DueDiligences.AddRange(ddRecords);
    }

    private static DueDiligence CreateDueDiligence(
        Guid opportunityId,
        DueDiligenceType type,
        DueDiligenceStatus status,
        string? findings,
        DateTime? reportDate,
        DateTime createdAt,
        string createdBy)
    {
        return new DueDiligence
        {
            Id = Guid.NewGuid(),
            OpportunityId = opportunityId,
            Type = type,
            Status = status,
            Findings = findings,
            ReportDate = reportDate,
            CreatedAt = createdAt,
            CreatedBy = createdBy,
            IsDeleted = false
        };
    }

    #endregion

    #region Offers

    private static void SeedOffers(
        BuildEstateDbContext context,
        List<LandOpportunity> opportunities,
        Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var acquisitionMgr = users["AcquisitionManager"];

        var offers = new List<Offer>
        {
            // Hampstead (OfferMade) — active offer
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[6].Id,
                Amount = 3_650_000m,
                Currency = "GBP",
                OfferDate = now.AddDays(-30),
                ValidUntil = now.AddDays(14),
                Status = OfferStatus.UnderReview,
                CreatedAt = now.AddDays(-30),
                CreatedBy = acquisitionMgr,
                IsDeleted = false
            },

            // Greenwich (UnderContract) — accepted offer
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[7].Id,
                Amount = 4_500_000m,
                Currency = "GBP",
                OfferDate = now.AddDays(-100),
                ValidUntil = now.AddDays(-72),
                Status = OfferStatus.Rejected,
                CreatedAt = now.AddDays(-100),
                CreatedBy = acquisitionMgr,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[7].Id,
                Amount = 4_800_000m,
                Currency = "GBP",
                OfferDate = now.AddDays(-85),
                ValidUntil = now.AddDays(-57),
                Status = OfferStatus.CounterOffered,
                CounterOfferAmount = 5_100_000m,
                CreatedAt = now.AddDays(-85),
                CreatedBy = acquisitionMgr,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[7].Id,
                Amount = 4_950_000m,
                Currency = "GBP",
                OfferDate = now.AddDays(-78),
                ValidUntil = now.AddDays(-50),
                Status = OfferStatus.Accepted,
                CreatedAt = now.AddDays(-78),
                CreatedBy = acquisitionMgr,
                IsDeleted = false
            },

            // Battersea (Acquired) — accepted offer
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[8].Id,
                Amount = 2_750_000m,
                Currency = "GBP",
                OfferDate = now.AddDays(-165),
                ValidUntil = now.AddDays(-137),
                Status = OfferStatus.Accepted,
                CreatedAt = now.AddDays(-165),
                CreatedBy = acquisitionMgr,
                IsDeleted = false
            },

            // Expired offer for Woolwich (DueDiligence)
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[4].Id,
                Amount = 3_200_000m,
                Currency = "GBP",
                OfferDate = now.AddDays(-60),
                ValidUntil = now.AddDays(-32),
                Status = OfferStatus.Expired,
                CreatedAt = now.AddDays(-60),
                CreatedBy = acquisitionMgr,
                IsDeleted = false
            }
        };

        context.Offers.AddRange(offers);
    }

    #endregion

    #region Feasibility Assessments

    private static void SeedFeasibilityAssessments(
        BuildEstateDbContext context,
        List<LandOpportunity> opportunities,
        Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var financeDir = users["FinanceDirector"];

        var assessments = new List<FeasibilityAssessment>
        {
            // Hampstead (OfferMade)
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[6].Id,
                EstimatedLandCost = 3_650_000m,
                EstimatedBuildCost = 4_800_000m,
                ProfessionalFees = 720_000m,
                FinanceCosts = 580_000m,
                ExpectedSalesRevenue = 14_200_000m,
                TotalCosts = 9_750_000m,
                EstimatedProfit = 4_450_000m,
                RoiPercentage = 45.6m,
                Scenario = FeasibilityScenario.Expected,
                IsReadyForReview = true,
                CreatedAt = now.AddDays(-40),
                CreatedBy = financeDir,
                IsDeleted = false
            },

            // Greenwich (UnderContract)
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[7].Id,
                EstimatedLandCost = 4_950_000m,
                EstimatedBuildCost = 28_500_000m,
                ProfessionalFees = 4_275_000m,
                FinanceCosts = 3_420_000m,
                ExpectedSalesRevenue = 62_000_000m,
                TotalCosts = 41_145_000m,
                EstimatedProfit = 20_855_000m,
                RoiPercentage = 50.7m,
                Scenario = FeasibilityScenario.Expected,
                IsReadyForReview = true,
                CreatedAt = now.AddDays(-70),
                CreatedBy = financeDir,
                IsDeleted = false
            },

            // Battersea (Acquired)
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[8].Id,
                EstimatedLandCost = 2_750_000m,
                EstimatedBuildCost = 9_200_000m,
                ProfessionalFees = 1_380_000m,
                FinanceCosts = 1_104_000m,
                ExpectedSalesRevenue = 21_500_000m,
                TotalCosts = 14_434_000m,
                EstimatedProfit = 7_066_000m,
                RoiPercentage = 48.9m,
                Scenario = FeasibilityScenario.Expected,
                IsReadyForReview = true,
                CreatedAt = now.AddDays(-150),
                CreatedBy = financeDir,
                IsDeleted = false
            },

            // Canary Wharf (DueDiligence) — best case scenario
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[5].Id,
                EstimatedLandCost = 2_200_000m,
                EstimatedBuildCost = 6_100_000m,
                ProfessionalFees = 915_000m,
                FinanceCosts = 732_000m,
                ExpectedSalesRevenue = 15_800_000m,
                TotalCosts = 9_947_000m,
                EstimatedProfit = 5_853_000m,
                RoiPercentage = 58.8m,
                Scenario = FeasibilityScenario.BestCase,
                IsReadyForReview = false,
                CreatedAt = now.AddDays(-20),
                CreatedBy = financeDir,
                IsDeleted = false
            }
        };

        context.FeasibilityAssessments.AddRange(assessments);
    }

    #endregion

    #region Planning Applications

    private static List<PlanningApplication> SeedPlanningApplications(
        BuildEstateDbContext context,
        List<LandOpportunity> opportunities,
        Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var planningMgr = users["PlanningManager"];

        var applications = new List<PlanningApplication>
        {
            // Draft — linked to Canary Wharf
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[5].Id,
                Description = "Full planning application for 60-unit residential tower with ground-floor commercial space and riverside walkway.",
                ApplicationType = PlanningApplicationType.Full,
                Status = PlanningApplicationStatus.PreApplication,
                CouncilName = "London Borough of Tower Hamlets",
                CreatedAt = now.AddDays(-15),
                CreatedBy = planningMgr,
                IsDeleted = false
            },

            // Submitted — linked to Battersea
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[8].Id,
                Description = "Full planning application for demolition of existing structures and erection of 45 residential apartments with basement car parking.",
                ApplicationType = PlanningApplicationType.Full,
                Status = PlanningApplicationStatus.Submitted,
                ApplicationReference = "2024/1234/FUL",
                CouncilName = "London Borough of Wandsworth",
                SubmissionDate = now.AddDays(-28),
                TargetDecisionDate = now.AddDays(56),
                CreatedAt = now.AddDays(-30),
                CreatedBy = planningMgr,
                IsDeleted = false
            },

            // UnderReview — linked to Hampstead
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[6].Id,
                Description = "Full planning application for conversion of former school site to 24 residential apartments with associated landscaping and parking.",
                ApplicationType = PlanningApplicationType.Full,
                Status = PlanningApplicationStatus.UnderReview,
                ApplicationReference = "2024/0987/FUL",
                CouncilName = "London Borough of Camden",
                SubmissionDate = now.AddDays(-45),
                TargetDecisionDate = now.AddDays(10),
                CreatedAt = now.AddDays(-48),
                CreatedBy = planningMgr,
                IsDeleted = false
            },

            // Approved — linked to Woolwich (already acquired DD)
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[4].Id,
                Description = "Outline planning permission for residential development of brownfield land — up to 80 units with access approved.",
                ApplicationType = PlanningApplicationType.Outline,
                Status = PlanningApplicationStatus.Approved,
                ApplicationReference = "2023/3456/OUT",
                CouncilName = "Royal Borough of Greenwich",
                SubmissionDate = now.AddDays(-160),
                TargetDecisionDate = now.AddDays(-100),
                ActualDecisionDate = now.AddDays(-95),
                DecisionDate = now.AddDays(-95),
                CreatedAt = now.AddDays(-165),
                CreatedBy = planningMgr,
                IsDeleted = false
            },

            // ApprovedWithConditions — linked to Greenwich (outline)
            new()
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[7].Id,
                Description = "Outline planning application for mixed-use waterfront development comprising 150 residential units and 2,000 sqm commercial space.",
                ApplicationType = PlanningApplicationType.Outline,
                Status = PlanningApplicationStatus.ApprovedWithConditions,
                ApplicationReference = "2023/0456/OUT",
                CouncilName = "Royal Borough of Greenwich",
                SubmissionDate = now.AddDays(-180),
                TargetDecisionDate = now.AddDays(-110),
                ActualDecisionDate = now.AddDays(-105),
                DecisionDate = now.AddDays(-105),
                CreatedAt = now.AddDays(-185),
                CreatedBy = planningMgr,
                IsDeleted = false
            }
        };

        context.PlanningApplications.AddRange(applications);

        // Seed conditions for the ApprovedWithConditions application
        SeedPlanningConditions(context, applications[4], planningMgr, now);

        // Seed milestones
        SeedPlanningMilestones(context, applications, planningMgr, now);

        // Seed fees
        SeedPlanningFees(context, applications, planningMgr, now);

        // Seed council contacts
        SeedCouncilContacts(context, applications, planningMgr, now);

        return applications;
    }

    private static void SeedPlanningConditions(
        BuildEstateDbContext context,
        PlanningApplication application,
        string createdBy,
        DateTime now)
    {
        var conditions = new List<PlanningCondition>
        {
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = application.Id,
                ConditionNumber = 1,
                Description = "Reserved matters applications for appearance, landscaping, layout and scale shall be submitted within 3 years.",
                ConditionType = ConditionType.PreCommencement,
                Status = ConditionStatus.Outstanding,
                DueDate = now.AddMonths(12),
                CreatedAt = now.AddDays(-105),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = application.Id,
                ConditionNumber = 2,
                Description = "Contamination remediation strategy to be submitted and approved prior to commencement of development.",
                ConditionType = ConditionType.PreCommencement,
                Status = ConditionStatus.SubmittedForDischarge,
                DueDate = now.AddDays(-10),
                DischargeReference = "DC/2024/0089",
                CreatedAt = now.AddDays(-105),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = application.Id,
                ConditionNumber = 3,
                Description = "Construction Management Plan including traffic routes, working hours, and dust suppression measures.",
                ConditionType = ConditionType.PreCommencement,
                Status = ConditionStatus.Discharged,
                DueDate = now.AddDays(-30),
                DischargeDate = now.AddDays(-20),
                DischargeReference = "DC/2024/0067",
                CreatedAt = now.AddDays(-105),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = application.Id,
                ConditionNumber = 4,
                Description = "Noise impact assessment and mitigation scheme for residential units facing the A206.",
                ConditionType = ConditionType.PreOccupation,
                Status = ConditionStatus.Outstanding,
                DueDate = now.AddMonths(6),
                CreatedAt = now.AddDays(-105),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = application.Id,
                ConditionNumber = 5,
                Description = "Flood risk mitigation and sustainable drainage scheme to be implemented throughout construction.",
                ConditionType = ConditionType.DuringConstruction,
                Status = ConditionStatus.Outstanding,
                DueDate = now.AddMonths(9),
                CreatedAt = now.AddDays(-105),
                CreatedBy = createdBy,
                IsDeleted = false
            }
        };

        context.PlanningConditions.AddRange(conditions);
    }

    private static void SeedPlanningMilestones(
        BuildEstateDbContext context,
        List<PlanningApplication> applications,
        string createdBy,
        DateTime now)
    {
        var milestones = new List<PlanningMilestone>
        {
            // Submitted app (Battersea FUL)
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[1].Id,
                MilestoneType = MilestoneType.SubmissionDate,
                Status = MilestoneStatus.Completed,
                TargetDate = now.AddDays(-28),
                ActualDate = now.AddDays(-28),
                VarianceDays = 0,
                CreatedAt = now.AddDays(-30),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[1].Id,
                MilestoneType = MilestoneType.ValidationDate,
                Status = MilestoneStatus.Completed,
                TargetDate = now.AddDays(-21),
                ActualDate = now.AddDays(-23),
                VarianceDays = -2,
                CreatedAt = now.AddDays(-30),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[1].Id,
                MilestoneType = MilestoneType.ConsultationStart,
                Status = MilestoneStatus.Completed,
                TargetDate = now.AddDays(-20),
                ActualDate = now.AddDays(-20),
                VarianceDays = 0,
                CreatedAt = now.AddDays(-30),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[1].Id,
                MilestoneType = MilestoneType.ConsultationEnd,
                Status = MilestoneStatus.Pending,
                TargetDate = now.AddDays(1),
                CreatedAt = now.AddDays(-30),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[1].Id,
                MilestoneType = MilestoneType.TargetDecisionDate,
                Status = MilestoneStatus.Pending,
                TargetDate = now.AddDays(56),
                CreatedAt = now.AddDays(-30),
                CreatedBy = createdBy,
                IsDeleted = false
            },

            // ApprovedWithConditions app (Greenwich OUT) — all completed
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[4].Id,
                MilestoneType = MilestoneType.SubmissionDate,
                Status = MilestoneStatus.Completed,
                TargetDate = now.AddDays(-180),
                ActualDate = now.AddDays(-180),
                VarianceDays = 0,
                CreatedAt = now.AddDays(-185),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[4].Id,
                MilestoneType = MilestoneType.TargetDecisionDate,
                Status = MilestoneStatus.Completed,
                TargetDate = now.AddDays(-110),
                ActualDate = now.AddDays(-105),
                VarianceDays = 5,
                CreatedAt = now.AddDays(-185),
                CreatedBy = createdBy,
                IsDeleted = false
            }
        };

        context.PlanningMilestones.AddRange(milestones);
    }

    private static void SeedPlanningFees(
        BuildEstateDbContext context,
        List<PlanningApplication> applications,
        string createdBy,
        DateTime now)
    {
        var fees = new List<PlanningFee>
        {
            // Battersea FUL
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[1].Id,
                Amount = 23_100m,
                Currency = "GBP",
                FeeType = FeeType.ApplicationFee,
                Description = "Full planning application fee — major development (50+ dwellings band)",
                PaymentStatus = PaymentStatus.Paid,
                CreatedAt = now.AddDays(-30),
                CreatedBy = createdBy,
                IsDeleted = false
            },

            // Greenwich OUT
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[4].Id,
                Amount = 15_433m,
                Currency = "GBP",
                FeeType = FeeType.ApplicationFee,
                Description = "Outline planning application fee — per 0.1 hectare of site area",
                PaymentStatus = PaymentStatus.Paid,
                CreatedAt = now.AddDays(-185),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[4].Id,
                Amount = 3_500m,
                Currency = "GBP",
                FeeType = FeeType.PreApplicationFee,
                Description = "Pre-application advice meeting with planning officer",
                PaymentStatus = PaymentStatus.Paid,
                CreatedAt = now.AddDays(-200),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[4].Id,
                Amount = 234m,
                Currency = "GBP",
                FeeType = FeeType.ConditionDischargeFee,
                Description = "Fee for discharge of condition 3 — Construction Management Plan",
                PaymentStatus = PaymentStatus.Paid,
                CreatedAt = now.AddDays(-40),
                CreatedBy = createdBy,
                IsDeleted = false
            },

            // Greenwich Reserved Matters (PreApplication)
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[0].Id,
                Amount = 2_800m,
                Currency = "GBP",
                FeeType = FeeType.PreApplicationFee,
                Description = "Pre-application advice for reserved matters submission",
                PaymentStatus = PaymentStatus.Pending,
                CreatedAt = now.AddDays(-15),
                CreatedBy = createdBy,
                IsDeleted = false
            }
        };

        context.PlanningFees.AddRange(fees);
    }

    private static void SeedCouncilContacts(
        BuildEstateDbContext context,
        List<PlanningApplication> applications,
        string createdBy,
        DateTime now)
    {
        var contacts = new List<CouncilContact>
        {
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[1].Id,
                CouncilName = "London Borough of Wandsworth",
                PlanningOfficerName = "James Robertson",
                Email = "james.robertson@wandsworth.gov.uk",
                Phone = "020 8871 7620",
                Address = "The Town Hall, Wandsworth High Street, London, SW18 2PU",
                CreatedAt = now.AddDays(-30),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                ApplicationId = applications[4].Id,
                CouncilName = "Royal Borough of Greenwich",
                PlanningOfficerName = "Helen Matthews",
                Email = "helen.matthews@royalgreenwich.gov.uk",
                Phone = "020 8854 8888",
                Address = "The Woolwich Centre, 35 Wellington Street, London, SE18 6HQ",
                CreatedAt = now.AddDays(-185),
                CreatedBy = createdBy,
                IsDeleted = false
            }
        };

        context.CouncilContacts.AddRange(contacts);
    }

    #endregion

    #region Legal Cases

    private static void SeedLegalCases(
        BuildEstateDbContext context,
        List<LandOpportunity> opportunities,
        List<PlanningApplication> planningApps,
        Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var legalOfficer = users["LegalOfficer"];

        var cases = new List<LegalCase>
        {
            // Conveyancing — Greenwich acquisition
            new()
            {
                Id = Guid.NewGuid(),
                CaseReference = "LC-2024-00012",
                Title = "Greenwich Waterfront Land Acquisition",
                Description = "Conveyancing for the purchase of 5.2 acres waterfront land at Greenwich Peninsula. Managing exchange and completion.",
                CaseType = LegalCaseType.Conveyancing,
                Status = LegalCaseStatus.InProgress,
                Priority = LegalCasePriority.High,
                AssignedSolicitor = "Patricia Hughes",
                SolicitorFirm = "Clifford Chance LLP",
                SolicitorEmail = "patricia.hughes@cliffordchance.com",
                SolicitorPhone = "020 7006 1000",
                OpportunityId = opportunities[7].Id,
                CreatedAt = now.AddDays(-90),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },

            // Conveyancing — Battersea (completed)
            new()
            {
                Id = Guid.NewGuid(),
                CaseReference = "LC-2024-00008",
                Title = "Battersea Residential Land Purchase",
                Description = "Conveyancing for acquisition of 2.1 acres residential land at Battersea Park Road. Land Registry registration complete.",
                CaseType = LegalCaseType.Conveyancing,
                Status = LegalCaseStatus.Closed,
                Priority = LegalCasePriority.Medium,
                AssignedSolicitor = "Michael Barnes",
                SolicitorFirm = "Herbert Smith Freehills",
                SolicitorEmail = "michael.barnes@hsf.com",
                SolicitorPhone = "020 7374 8000",
                Notes = "Completion achieved ahead of schedule. All post-completion registrations filed.",
                ResolutionSummary = "Purchase completed. Title registered at HMLR under title number TGL456789.",
                ResolutionDate = now.AddDays(-140),
                OpportunityId = opportunities[8].Id,
                CreatedAt = now.AddDays(-175),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },

            // Planning related — Greenwich s106 negotiation
            new()
            {
                Id = Guid.NewGuid(),
                CaseReference = "LC-2024-00015",
                Title = "Greenwich S106 Agreement Negotiation",
                Description = "Negotiating Section 106 agreement for the Greenwich waterfront scheme. Obligations include 35% affordable housing, transport contribution £500K, and public realm.",
                CaseType = LegalCaseType.Planning,
                Status = LegalCaseStatus.UnderReview,
                Priority = LegalCasePriority.High,
                AssignedSolicitor = "Rebecca Taylor",
                SolicitorFirm = "Ashurst LLP",
                SolicitorEmail = "rebecca.taylor@ashurst.com",
                SolicitorPhone = "020 7638 1111",
                PlanningApplicationId = planningApps[4].Id,
                OpportunityId = opportunities[7].Id,
                CreatedAt = now.AddDays(-60),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },

            // Contract Review
            new()
            {
                Id = Guid.NewGuid(),
                CaseReference = "LC-2024-00018",
                Title = "Hampstead Development JCT Contract Review",
                Description = "Review and negotiation of JCT Design & Build 2016 contract for the Hampstead former school site development.",
                CaseType = LegalCaseType.ContractReview,
                Status = LegalCaseStatus.Open,
                Priority = LegalCasePriority.Medium,
                AssignedSolicitor = "Andrew Scott",
                SolicitorFirm = "Pinsent Masons LLP",
                SolicitorEmail = "andrew.scott@pinsentmasons.com",
                SolicitorPhone = "020 7418 7000",
                OpportunityId = opportunities[6].Id,
                CreatedAt = now.AddDays(-10),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },

            // Regulatory — AML compliance
            new()
            {
                Id = Guid.NewGuid(),
                CaseReference = "LC-2024-00020",
                Title = "AML Enhanced Due Diligence — Docklands Corp",
                Description = "Enhanced due diligence required for Docklands Development Corp transaction. Complex corporate structure requires additional KYC checks.",
                CaseType = LegalCaseType.Regulatory,
                Status = LegalCaseStatus.InProgress,
                Priority = LegalCasePriority.Critical,
                AssignedSolicitor = "Sarah Williams",
                SolicitorFirm = "In-house",
                SolicitorEmail = "sarah.williams@buildestate.co.uk",
                OpportunityId = opportunities[5].Id,
                CreatedAt = now.AddDays(-18),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },

            // Dispute — neighbour objection
            new()
            {
                Id = Guid.NewGuid(),
                CaseReference = "LC-2024-00022",
                Title = "Battersea Boundary Dispute Resolution",
                Description = "Adjacent landowner disputes boundary line shown on approved plans. Surveyor appointed to resolve. Low risk to development programme.",
                CaseType = LegalCaseType.Dispute,
                Status = LegalCaseStatus.OnHold,
                Priority = LegalCasePriority.Low,
                AssignedSolicitor = "Daniel White",
                SolicitorFirm = "Slaughter and May",
                SolicitorEmail = "daniel.white@slaughterandmay.com",
                SolicitorPhone = "020 7600 1200",
                HoldReason = "Awaiting independent surveyor report — expected within 14 days.",
                OpportunityId = opportunities[8].Id,
                CreatedAt = now.AddDays(-25),
                CreatedBy = legalOfficer,
                IsDeleted = false
            }
        };

        context.LegalCases.AddRange(cases);

        // Add contracts to relevant legal cases
        SeedLegalContracts(context, cases, legalOfficer, now);

        // Add documents to legal cases
        SeedLegalDocuments(context, cases, legalOfficer, now);
    }

    private static void SeedLegalContracts(
        BuildEstateDbContext context,
        List<LegalCase> cases,
        string createdBy,
        DateTime now)
    {
        var contracts = new List<Domain.Entities.LegalCompliance.Contract>
        {
            // Land purchase agreement — Greenwich
            new()
            {
                Id = Guid.NewGuid(),
                ContractReference = "CON-2024-00034",
                Title = "Agreement for Sale — Greenwich Peninsula Land",
                ContractType = LegalContractType.LandPurchase,
                Status = LegalContractStatus.AwaitingSignature,
                CounterpartyName = "Greenwich Peninsula Partnership",
                ContractValue = 4_950_000m,
                Currency = "GBP",
                StartDate = now.AddDays(-60),
                EndDate = now.AddDays(30),
                PaymentTerms = "10% deposit on exchange, balance on completion within 28 days",
                LegalCaseId = cases[0].Id,
                CreatedAt = now.AddDays(-60),
                CreatedBy = createdBy,
                IsDeleted = false
            },

            // Completed land purchase — Battersea
            new()
            {
                Id = Guid.NewGuid(),
                ContractReference = "CON-2024-00021",
                Title = "Agreement for Sale — Battersea Park Road",
                ContractType = LegalContractType.LandPurchase,
                Status = LegalContractStatus.Completed,
                CounterpartyName = "Battersea Power Station Development Company",
                ContractValue = 2_750_000m,
                Currency = "GBP",
                StartDate = now.AddDays(-170),
                EndDate = now.AddDays(-140),
                ExecutionDate = now.AddDays(-155),
                SignatoryNames = "Robert Harris (BuildEstate), James Whitfield (BPSDC)",
                PaymentTerms = "10% deposit on exchange, 90% on completion",
                LegalCaseId = cases[1].Id,
                CreatedAt = now.AddDays(-170),
                CreatedBy = createdBy,
                IsDeleted = false
            },

            // S106 agreement
            new()
            {
                Id = Guid.NewGuid(),
                ContractReference = "CON-2024-00038",
                Title = "Section 106 Agreement — Greenwich Waterfront",
                ContractType = LegalContractType.FrameworkAgreement,
                Status = LegalContractStatus.UnderReview,
                CounterpartyName = "Royal Borough of Greenwich",
                ContractValue = 2_100_000m,
                Currency = "GBP",
                StartDate = now.AddDays(-30),
                EndDate = now.AddYears(5),
                SpecialConditions = "35% affordable housing, £500K transport contribution, public realm obligation",
                LegalCaseId = cases[2].Id,
                CreatedAt = now.AddDays(-30),
                CreatedBy = createdBy,
                IsDeleted = false
            },

            // Professional services contract — in review
            new()
            {
                Id = Guid.NewGuid(),
                ContractReference = "CON-2024-00041",
                Title = "JCT Design & Build 2016 — Hampstead Development",
                ContractType = LegalContractType.Construction,
                Status = LegalContractStatus.Draft,
                CounterpartyName = "Wates Construction Ltd",
                ContractValue = 4_800_000m,
                Currency = "GBP",
                StartDate = now.AddDays(-5),
                EndDate = now.AddMonths(18),
                PaymentTerms = "Monthly valuations, 5% retention, 2.5% released at practical completion",
                LegalCaseId = cases[3].Id,
                CreatedAt = now.AddDays(-5),
                CreatedBy = createdBy,
                IsDeleted = false
            }
        };

        context.LegalContracts.AddRange(contracts);
    }

    private static void SeedLegalDocuments(
        BuildEstateDbContext context,
        List<LegalCase> cases,
        string createdBy,
        DateTime now)
    {
        var documents = new List<LegalDocument>
        {
            new()
            {
                Id = Guid.NewGuid(),
                DocumentType = LegalDocumentType.TitleDeed,
                ConfidentialityLevel = ConfidentialityLevel.Confidential,
                FileName = "Greenwich_Peninsula_Title_TGL123456.pdf",
                ContentType = "application/pdf",
                FileSize = 2_450_000,
                StoragePath = "/documents/legal/greenwich/title-deed.pdf",
                Version = 1,
                UploadedAt = now.AddDays(-85),
                UploadedBy = createdBy,
                LegalCaseId = cases[0].Id,
                CreatedAt = now.AddDays(-85),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                DocumentType = LegalDocumentType.SearchReport,
                ConfidentialityLevel = ConfidentialityLevel.Internal,
                FileName = "Greenwich_Local_Authority_Search.pdf",
                ContentType = "application/pdf",
                FileSize = 1_890_000,
                StoragePath = "/documents/legal/greenwich/la-search.pdf",
                Version = 1,
                UploadedAt = now.AddDays(-80),
                UploadedBy = createdBy,
                LegalCaseId = cases[0].Id,
                CreatedAt = now.AddDays(-80),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                DocumentType = LegalDocumentType.Contract,
                ConfidentialityLevel = ConfidentialityLevel.Restricted,
                FileName = "Battersea_Signed_Contract_Final.pdf",
                ContentType = "application/pdf",
                FileSize = 3_200_000,
                StoragePath = "/documents/legal/battersea/signed-contract.pdf",
                Version = 2,
                UploadedAt = now.AddDays(-155),
                UploadedBy = createdBy,
                LegalCaseId = cases[1].Id,
                CreatedAt = now.AddDays(-155),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                DocumentType = LegalDocumentType.LandRegistryRecord,
                ConfidentialityLevel = ConfidentialityLevel.Internal,
                FileName = "Battersea_HMLR_Registration_Confirmation.pdf",
                ContentType = "application/pdf",
                FileSize = 890_000,
                StoragePath = "/documents/legal/battersea/hmlr-registration.pdf",
                Version = 1,
                UploadedAt = now.AddDays(-138),
                UploadedBy = createdBy,
                LegalCaseId = cases[1].Id,
                CreatedAt = now.AddDays(-138),
                CreatedBy = createdBy,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                DocumentType = LegalDocumentType.LegalOpinion,
                ConfidentialityLevel = ConfidentialityLevel.Confidential,
                FileName = "AML_Enhanced_DD_Report_DocklandsCorp.pdf",
                ContentType = "application/pdf",
                FileSize = 1_560_000,
                StoragePath = "/documents/legal/canary-wharf/aml-report.pdf",
                Version = 1,
                UploadedAt = now.AddDays(-12),
                UploadedBy = createdBy,
                LegalCaseId = cases[4].Id,
                CreatedAt = now.AddDays(-12),
                CreatedBy = createdBy,
                IsDeleted = false
            }
        };

        context.LegalDocuments.AddRange(documents);
    }

    #endregion

    #region Compliance Requirements

    private static void SeedComplianceRequirements(
        BuildEstateDbContext context,
        Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var legalOfficer = users["LegalOfficer"];

        var requirements = new List<ComplianceRequirement>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Name = "GDPR Data Protection Compliance",
                Category = ComplianceCategory.DataProtection,
                Description = "Ensure all personal data processing complies with UK GDPR and Data Protection Act 2018. Annual review of data processing activities, privacy notices, and data retention schedules.",
                SourceRegulation = "UK GDPR / Data Protection Act 2018",
                Frequency = ComplianceFrequency.Annually,
                ResponsibleRole = "LegalOfficer",
                Status = ComplianceRequirementStatus.Active,
                NextDueDate = now.AddMonths(3),
                CreatedAt = now.AddDays(-180),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Anti-Money Laundering (AML) Checks",
                Category = ComplianceCategory.AntiMoneyLaundering,
                Description = "Conduct CDD/EDD on all counterparties in land transactions exceeding £15,000. Report suspicious activity to NCA via SAR.",
                SourceRegulation = "Money Laundering Regulations 2017 / Proceeds of Crime Act 2002",
                Frequency = ComplianceFrequency.Ongoing,
                ResponsibleRole = "LegalOfficer",
                Status = ComplianceRequirementStatus.Active,
                NextDueDate = null,
                CreatedAt = now.AddDays(-180),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "RICS Professional Standards",
                Category = ComplianceCategory.Financial,
                Description = "Ensure all valuations and professional advice adhere to RICS Red Book (Global Standards). Annual CPD requirements for qualified staff.",
                SourceRegulation = "RICS Valuation - Global Standards 2022",
                Frequency = ComplianceFrequency.Annually,
                ResponsibleRole = "FinanceDirector",
                Status = ComplianceRequirementStatus.Active,
                NextDueDate = now.AddMonths(6),
                CreatedAt = now.AddDays(-180),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Building Regulations Compliance",
                Category = ComplianceCategory.BuildingRegulations,
                Description = "All construction works must comply with Building Regulations 2010 (as amended). Building Control sign-off required at each stage.",
                SourceRegulation = "Building Regulations 2010 / Building Safety Act 2022",
                Frequency = ComplianceFrequency.Ongoing,
                ResponsibleRole = "ProjectManager",
                Status = ComplianceRequirementStatus.Active,
                NextDueDate = null,
                CreatedAt = now.AddDays(-180),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Health & Safety (CDM Regulations)",
                Category = ComplianceCategory.HealthAndSafety,
                Description = "Comply with Construction (Design and Management) Regulations 2015. Appoint Principal Designer and Principal Contractor. Maintain H&S file.",
                SourceRegulation = "CDM Regulations 2015 / Health and Safety at Work Act 1974",
                Frequency = ComplianceFrequency.Ongoing,
                ResponsibleRole = "ProjectManager",
                Status = ComplianceRequirementStatus.Active,
                NextDueDate = null,
                CreatedAt = now.AddDays(-180),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Environmental Impact Assessment",
                Category = ComplianceCategory.Environmental,
                Description = "Environmental Impact Assessment screening/scoping required for developments exceeding threshold. Submit to LPA with planning application.",
                SourceRegulation = "Town and Country Planning (EIA) Regulations 2017",
                Frequency = ComplianceFrequency.OneOff,
                ResponsibleRole = "PlanningManager",
                Status = ComplianceRequirementStatus.Active,
                NextDueDate = now.AddMonths(1),
                CreatedAt = now.AddDays(-120),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Planning Compliance Monitoring",
                Category = ComplianceCategory.PlanningCompliance,
                Description = "Monitor ongoing compliance with planning conditions and S106 obligations. Report breaches immediately to legal team.",
                SourceRegulation = "Town and Country Planning Act 1990",
                Frequency = ComplianceFrequency.Monthly,
                ResponsibleRole = "PlanningManager",
                Status = ComplianceRequirementStatus.Active,
                NextDueDate = now.AddDays(15),
                CreatedAt = now.AddDays(-90),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Employment Law Compliance",
                Category = ComplianceCategory.Employment,
                Description = "Ensure compliance with Employment Rights Act 1996, Working Time Regulations, and Modern Slavery Act 2015 across all contractors and suppliers.",
                SourceRegulation = "Employment Rights Act 1996 / Modern Slavery Act 2015",
                Frequency = ComplianceFrequency.Quarterly,
                ResponsibleRole = "Admin",
                Status = ComplianceRequirementStatus.Active,
                NextDueDate = now.AddMonths(2),
                CreatedAt = now.AddDays(-180),
                CreatedBy = legalOfficer,
                IsDeleted = false
            }
        };

        context.ComplianceRequirements.AddRange(requirements);

        // Seed compliance checks for some requirements
        SeedComplianceChecks(context, requirements, users, now);
    }

    private static void SeedComplianceChecks(
        BuildEstateDbContext context,
        List<ComplianceRequirement> requirements,
        Dictionary<string, string> users,
        DateTime now)
    {
        var legalOfficer = users["LegalOfficer"];
        var financeDir = users["FinanceDirector"];

        var checks = new List<ComplianceCheck>
        {
            // GDPR — compliant
            new()
            {
                Id = Guid.NewGuid(),
                ComplianceRequirementId = requirements[0].Id,
                CheckDate = now.AddDays(-60),
                Outcome = ComplianceCheckOutcome.Compliant,
                Findings = "Annual DPIA review completed. All processing activities documented. Privacy notices updated. No breaches reported in period.",
                EvidenceReference = "GDPR-REVIEW-2024-Q3",
                ReviewerUserId = legalOfficer,
                ReviewerName = "Sarah Williams",
                CreatedAt = now.AddDays(-60),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },

            // AML — partially compliant
            new()
            {
                Id = Guid.NewGuid(),
                ComplianceRequirementId = requirements[1].Id,
                CheckDate = now.AddDays(-20),
                Outcome = ComplianceCheckOutcome.PartiallyCompliant,
                Findings = "CDD completed on 5 of 6 active counterparties. One EDD still pending for Docklands Development Corp — complex corporate structure requires additional verification.",
                EvidenceReference = "AML-CHECK-2024-NOV",
                RemediationPlan = "Complete EDD for Docklands Corp by end of month. Engage external verification service for beneficial ownership checks.",
                RemediationDueDate = now.AddDays(10),
                ReviewerUserId = legalOfficer,
                ReviewerName = "Sarah Williams",
                CreatedAt = now.AddDays(-20),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },

            // RICS — compliant
            new()
            {
                Id = Guid.NewGuid(),
                ComplianceRequirementId = requirements[2].Id,
                CheckDate = now.AddDays(-90),
                Outcome = ComplianceCheckOutcome.Compliant,
                Findings = "All valuations conducted per Red Book standards. CPD records up to date for all RICS-qualified staff.",
                EvidenceReference = "RICS-ANNUAL-2024",
                ReviewerUserId = financeDir,
                ReviewerName = "Emma Clarke",
                CreatedAt = now.AddDays(-90),
                CreatedBy = financeDir,
                IsDeleted = false
            },

            // H&S — non-compliant (historic, now remediated)
            new()
            {
                Id = Guid.NewGuid(),
                ComplianceRequirementId = requirements[4].Id,
                CheckDate = now.AddDays(-45),
                Outcome = ComplianceCheckOutcome.NonCompliant,
                Findings = "H&S file not updated following change of Principal Contractor. Two method statements missing for demolition phase.",
                EvidenceReference = "HS-AUDIT-2024-OCT",
                RemediationPlan = "Update H&S file immediately. Obtain missing method statements from new PC within 5 working days.",
                RemediationDueDate = now.AddDays(-38),
                ReviewerUserId = legalOfficer,
                ReviewerName = "Sarah Williams",
                CreatedAt = now.AddDays(-45),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },

            // H&S — subsequent check — now compliant
            new()
            {
                Id = Guid.NewGuid(),
                ComplianceRequirementId = requirements[4].Id,
                CheckDate = now.AddDays(-30),
                Outcome = ComplianceCheckOutcome.Compliant,
                Findings = "Remediation complete. H&S file updated. All method statements received and reviewed. No outstanding issues.",
                EvidenceReference = "HS-FOLLOWUP-2024-OCT",
                ReviewerUserId = legalOfficer,
                ReviewerName = "Sarah Williams",
                CreatedAt = now.AddDays(-30),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },

            // Environmental — not applicable (no active construction)
            new()
            {
                Id = Guid.NewGuid(),
                ComplianceRequirementId = requirements[5].Id,
                CheckDate = now.AddDays(-15),
                Outcome = ComplianceCheckOutcome.NotApplicable,
                Findings = "EIA screening determined not required for current schemes under Schedule 2 thresholds. Will re-assess for Greenwich waterfront scheme.",
                EvidenceReference = "EIA-SCREEN-2024-NOV",
                ReviewerUserId = users["PlanningManager"],
                ReviewerName = "David Thompson",
                CreatedAt = now.AddDays(-15),
                CreatedBy = users["PlanningManager"],
                IsDeleted = false
            }
        };

        context.ComplianceChecks.AddRange(checks);
    }

    #endregion

    #region Insurance Records

    private static void SeedInsuranceRecords(
        BuildEstateDbContext context,
        Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var legalOfficer = users["LegalOfficer"];

        var records = new List<InsuranceRecord>
        {
            new()
            {
                Id = Guid.NewGuid(),
                PolicyNumber = "PI/2024/BE/001234",
                Insurer = "Hiscox Ltd",
                CoverageType = CoverageType.ProfessionalIndemnity,
                CoverAmount = 10_000_000m,
                Premium = 45_000m,
                Currency = "GBP",
                StartDate = now.AddDays(-200),
                ExpiryDate = now.AddDays(165),
                Status = InsuranceStatus.Active,
                CreatedAt = now.AddDays(-200),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                PolicyNumber = "PL/2024/BE/005678",
                Insurer = "Aviva PLC",
                CoverageType = CoverageType.PublicLiability,
                CoverAmount = 5_000_000m,
                Premium = 12_500m,
                Currency = "GBP",
                StartDate = now.AddDays(-150),
                ExpiryDate = now.AddDays(215),
                Status = InsuranceStatus.Active,
                CreatedAt = now.AddDays(-150),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                PolicyNumber = "CAR/2024/BE/009012",
                Insurer = "Zurich Insurance Group",
                CoverageType = CoverageType.ContractorsAllRisk,
                CoverAmount = 25_000_000m,
                Premium = 87_500m,
                Currency = "GBP",
                StartDate = now.AddDays(-100),
                ExpiryDate = now.AddDays(265),
                Status = InsuranceStatus.Active,
                CreatedAt = now.AddDays(-100),
                CreatedBy = legalOfficer,
                IsDeleted = false
            },
            new()
            {
                Id = Guid.NewGuid(),
                PolicyNumber = "EL/2023/BE/003456",
                Insurer = "AXA UK",
                CoverageType = CoverageType.EmployersLiability,
                CoverAmount = 10_000_000m,
                Premium = 8_200m,
                Currency = "GBP",
                StartDate = now.AddDays(-365),
                ExpiryDate = now.AddDays(-5),
                Status = InsuranceStatus.ExpiringSoon,
                CreatedAt = now.AddDays(-365),
                CreatedBy = legalOfficer,
                IsDeleted = false
            }
        };

        context.InsuranceRecords.AddRange(records);
    }

    #endregion
}
