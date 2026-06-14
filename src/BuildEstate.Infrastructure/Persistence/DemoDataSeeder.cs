using BuildEstate.Domain.Entities.LandAcquisition;
using BuildEstate.Domain.Entities.LegalCompliance;
using BuildEstate.Domain.Entities.PlanningApprovals;
using BuildEstate.Domain.Enums;
using BuildEstate.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

using LegalContract = BuildEstate.Domain.Entities.LegalCompliance.Contract;

namespace BuildEstate.Infrastructure.Persistence;

/// <summary>
/// Seeds comprehensive UK property development demo data for stakeholder presentations.
/// Creates 50 opportunities with full entity data across all tabs.
/// </summary>
public static class DemoDataSeeder
{
    private const string DefaultPassword = "Demo@123456";
    private static readonly string[] Sources = ["Agent Referral", "Off-Market", "Auction Listing", "Council Disposal", "Direct Approach", "Public Sector Disposal", "Estate Agent", "Land Registry Alert"];
    private static readonly string[] Locations = [
        "Epping, Essex", "Croydon, Surrey", "Richmond, London", "Stratford, London", "Woolwich, London",
        "Canary Wharf, London", "Hampstead, London", "Greenwich, London", "Battersea, London", "Barnet, London",
        "Manchester City Centre", "Manchester Salford Quays", "Birmingham Jewellery Quarter", "Birmingham Digbeth",
        "Leeds City Centre", "Leeds Headingley", "Bristol Harbourside", "Bristol Temple Meads", "Edinburgh New Town",
        "Edinburgh Leith", "Cardiff Bay", "Cardiff Canton", "Brighton Hove", "Brighton Kemptown",
        "Oxford Jericho", "Cambridge Mill Road", "Reading Town Centre", "Slough Trading Estate",
        "Guildford Town Centre", "Windsor", "Maidenhead", "Cheltenham", "Bath", "York",
        "Newcastle Quayside", "Liverpool Waterfront", "Sheffield Kelham Island", "Nottingham Lace Market",
        "Coventry City Centre", "Southampton Ocean Village", "Portsmouth Gunwharf", "Exeter", "Norwich",
        "Ipswich Waterfront", "Milton Keynes", "Swindon Old Town", "Bournemouth", "Plymouth", "Aberdeen", "Glasgow"
    ];
    private static readonly string[] OwnerNames = [
        "Meridian Land Holdings Ltd", "Crown Estate Developments", "Thames Valley Properties PLC", "Northern Trust Land Co",
        "Eastgate Development Corp", "Westfield Land Partners", "Harbour Point Estates", "Kingsbridge Property Group",
        "Silverstone Assets Ltd", "Oakwood Capital Holdings", "Regent Park Developments", "Millbrook Properties",
        "Cornerstone Land Trust", "Highgate Investments", "Riverside Holdings PLC", "Greenfield Estates Ltd",
        "Burlington Land Co", "Cavendish Property Group", "Devonshire Capital", "Ashford Land Holdings",
        "Whitehall Property Trust", "Lancaster Developments", "Pembroke Estates", "Clarendon Holdings Ltd",
        "Montague Property Corp", "Belgravia Land Partners", "Kensington Capital", "Chelsea Land Holdings",
        "Mayfair Development Co", "St James's Estates", "Knightsbridge Properties", "Bloomsbury Land Trust",
        "Fitzrovia Holdings", "Marylebone Property Group", "Pimlico Estates", "Westminster Capital",
        "Vauxhall Development Corp", "Bermondsey Land Co", "Shoreditch Properties", "Hackney Land Trust",
        "Islington Development Co", "Camden Land Holdings", "Fulham Estate Partners", "Wandsworth Land Group",
        "Lambeth Property Corp", "Southwark Development Ltd", "Tower Hamlets Estates", "Lewisham Land Co",
        "Brent Property Holdings", "Haringey Development Trust"
    ];

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<BuildEstateDbContext>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        if (await context.LandOpportunities.AnyAsync())
            return;

        var users = await SeedDemoUsersAsync(userManager);
        var opportunities = SeedLandOpportunities(context, users);
        SeedDueDiligence(context, opportunities, users);
        SeedOffers(context, opportunities, users);
        SeedFeasibilityAssessments(context, opportunities, users);
        SeedDocuments(context, opportunities, users);
        var planningApps = SeedPlanningApplications(context, opportunities, users);
        SeedLegalCases(context, opportunities, planningApps, users);
        SeedComplianceRequirements(context, users);
        SeedInsuranceRecords(context, users);

        await context.SaveChangesAsync();
    }

    private static async Task<Dictionary<string, string>> SeedDemoUsersAsync(UserManager<ApplicationUser> userManager)
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
                var user = new ApplicationUser { UserName = email, Email = email, FirstName = firstName, LastName = lastName, IsActive = true, EmailConfirmed = true };
                var result = await userManager.CreateAsync(user, DefaultPassword);
                if (result.Succeeded) await userManager.AddToRoleAsync(user, role);
            }
            users[role] = email;
        }
        return users;
    }

    private static List<LandOpportunity> SeedLandOpportunities(BuildEstateDbContext context, Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var acqMgr = users["AcquisitionManager"];
        var opportunities = new List<LandOpportunity>();
        var random = new Random(42); // Fixed seed for reproducibility

        // Distribution: 15 Identified, 10 InitialReview, 8 DueDiligence, 6 OfferMade, 5 UnderContract, 4 Acquired, 2 Withdrawn
        var statuses = new List<(OpportunityStatus status, int count)>
        {
            (OpportunityStatus.Identified, 15),
            (OpportunityStatus.InitialReview, 10),
            (OpportunityStatus.DueDiligence, 8),
            (OpportunityStatus.OfferMade, 6),
            (OpportunityStatus.UnderContract, 5),
            (OpportunityStatus.Acquired, 4),
            (OpportunityStatus.Withdrawn, 2)
        };

        int idx = 0;
        foreach (var (status, count) in statuses)
        {
            for (int i = 0; i < count; i++)
            {
                var landSize = Math.Round((decimal)(random.NextDouble() * 8 + 0.5), 2);
                var daysAgo = status switch
                {
                    OpportunityStatus.Identified => random.Next(1, 30),
                    OpportunityStatus.InitialReview => random.Next(15, 60),
                    OpportunityStatus.DueDiligence => random.Next(30, 90),
                    OpportunityStatus.OfferMade => random.Next(60, 150),
                    OpportunityStatus.UnderContract => random.Next(90, 200),
                    OpportunityStatus.Acquired => random.Next(150, 365),
                    OpportunityStatus.Withdrawn => random.Next(60, 180),
                    _ => 30
                };

                var opp = new LandOpportunity
                {
                    Id = Guid.NewGuid(),
                    Name = $"{GetSiteName(idx)} — {Locations[idx % Locations.Length].Split(',')[0]}",
                    Location = Locations[idx % Locations.Length],
                    LandSize = landSize,
                    Status = status,
                    Source = Sources[random.Next(Sources.Length)],
                    ExpectedAcquisition = status == OpportunityStatus.Acquired || status == OpportunityStatus.Withdrawn ? null : now.AddMonths(random.Next(2, 12)),
                    CreatedAt = now.AddDays(-daysAgo),
                    CreatedBy = acqMgr,
                    IsDeleted = false
                };

                if (status == OpportunityStatus.Withdrawn)
                    opp.WithdrawalReason = idx % 2 == 0
                        ? "Environmental contamination discovered — remediation costs exceed land value by £1.2M."
                        : "Owner withdrew from sale after receiving higher offer from competing developer.";

                opportunities.Add(opp);
                idx++;
            }
        }

        context.LandOpportunities.AddRange(opportunities);

        // Seed owners
        for (int i = 0; i < opportunities.Count; i++)
        {
            context.LandOwners.Add(new LandOwner
            {
                Id = Guid.NewGuid(),
                OpportunityId = opportunities[i].Id,
                Name = OwnerNames[i % OwnerNames.Length],
                ContactDetails = $"enquiries@{OwnerNames[i % OwnerNames.Length].ToLower().Replace(" ", "").Replace("ltd", "").Replace("plc", "")[..12]}.co.uk | 020 {7000 + i:D4} {1000 + i:D4}",
                Address = $"{i + 1} {(i % 2 == 0 ? "Victoria" : "King's")} Road, {Locations[i % Locations.Length]}",
                OwnershipType = i % 4 == 0 ? OwnershipType.Leasehold : OwnershipType.Freehold,
                CreatedAt = opportunities[i].CreatedAt,
                CreatedBy = acqMgr,
                IsDeleted = false
            });
        }

        return opportunities;
    }

    private static void SeedDueDiligence(BuildEstateDbContext context, List<LandOpportunity> opportunities, Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var legal = users["LegalOfficer"];
        var ddTypes = new[] { DueDiligenceType.Legal, DueDiligenceType.Environmental, DueDiligenceType.Planning, DueDiligenceType.Utilities, DueDiligenceType.Valuation };

        var findings = new Dictionary<DueDiligenceType, string[]>
        {
            [DueDiligenceType.Legal] = ["Title clear. No encumbrances. Freehold confirmed.", "Leasehold with 999-year term. No restrictive covenants.", "Title registered. Minor easement for utility access — no development impact.", "Restrictive covenant identified — removal via Lands Tribunal recommended."],
            [DueDiligenceType.Environmental] = ["Phase 1 desk study complete. No contamination indicators.", "Phase 2 intrusive investigation: minor hydrocarbon traces. Remediation £35K.", "Clean site. Former agricultural land. No remediation required.", "Asbestos identified in existing structures — removal cost £80K estimated."],
            [DueDiligenceType.Planning] = ["Site allocated for residential in Local Plan. No Green Belt constraints.", "Pre-application response positive. Council supports 40-unit scheme.", "Conservation area — design constraints apply but development supported.", "Outline permission already granted for commercial use — change of use needed."],
            [DueDiligenceType.Utilities] = ["All utilities confirmed within 30m. Capacity available.", "Thames Water confirmed capacity. UKPN requires substation — £150K.", "Gas main 80m from boundary. Water main adjacent. Electricity capacity confirmed.", "New sewer connection required. Thames Water quote: £45K."],
            [DueDiligenceType.Valuation] = ["Red Book valuation: GDV £8.5M. Residual land value supports 22% margin.", "RICS valuation complete. Site value £2.1M supports 18% profit on cost.", "Market analysis confirms £550/sqft achievable for residential in this location.", "Comparable evidence supports asking price. Recommend offer at 95% of valuation."]
        };

        // DueDiligence records for opportunities from DueDiligence stage onwards (indices 25+)
        foreach (var opp in opportunities.Where(o => o.Status >= OpportunityStatus.DueDiligence))
        {
            var random = new Random(opp.Id.GetHashCode());
            var typesForOpp = ddTypes.OrderBy(_ => random.Next()).Take(random.Next(3, 6)).ToArray();

            foreach (var ddType in typesForOpp)
            {
                var status = opp.Status >= OpportunityStatus.OfferMade
                    ? DueDiligenceStatus.Completed
                    : (DueDiligenceStatus)random.Next(0, 3);

                var findingsText = status == DueDiligenceStatus.Completed || status == DueDiligenceStatus.Failed
                    ? findings[ddType][random.Next(findings[ddType].Length)]
                    : null;

                context.DueDiligences.Add(new DueDiligence
                {
                    Id = Guid.NewGuid(),
                    OpportunityId = opp.Id,
                    Type = ddType,
                    Status = status,
                    Findings = findingsText,
                    ReportDate = status == DueDiligenceStatus.Completed ? opp.CreatedAt.AddDays(random.Next(5, 30)) : null,
                    CreatedAt = opp.CreatedAt.AddDays(random.Next(1, 10)),
                    CreatedBy = legal,
                    IsDeleted = false
                });
            }
        }
    }

    private static void SeedOffers(BuildEstateDbContext context, List<LandOpportunity> opportunities, Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var acqMgr = users["AcquisitionManager"];

        foreach (var opp in opportunities.Where(o => o.Status >= OpportunityStatus.OfferMade))
        {
            var random = new Random(opp.Id.GetHashCode());
            var baseAmount = (decimal)(random.NextDouble() * 4_000_000 + 500_000);
            baseAmount = Math.Round(baseAmount / 25000) * 25000; // Round to nearest £25K

            // First offer (might be rejected for Under Contract / Acquired)
            if (opp.Status >= OpportunityStatus.UnderContract)
            {
                context.Offers.Add(new Offer
                {
                    Id = Guid.NewGuid(), OpportunityId = opp.Id,
                    Amount = baseAmount * 0.85m, Currency = "GBP",
                    OfferDate = opp.CreatedAt.AddDays(5), ValidUntil = opp.CreatedAt.AddDays(33),
                    Status = OfferStatus.Rejected,
                    CreatedAt = opp.CreatedAt.AddDays(5), CreatedBy = acqMgr, IsDeleted = false
                });

                // Counter offer
                context.Offers.Add(new Offer
                {
                    Id = Guid.NewGuid(), OpportunityId = opp.Id,
                    Amount = baseAmount * 0.92m, Currency = "GBP",
                    OfferDate = opp.CreatedAt.AddDays(15), ValidUntil = opp.CreatedAt.AddDays(43),
                    Status = OfferStatus.CounterOffered, CounterOfferAmount = baseAmount,
                    CreatedAt = opp.CreatedAt.AddDays(15), CreatedBy = acqMgr, IsDeleted = false
                });

                // Accepted final offer
                context.Offers.Add(new Offer
                {
                    Id = Guid.NewGuid(), OpportunityId = opp.Id,
                    Amount = baseAmount * 0.97m, Currency = "GBP",
                    OfferDate = opp.CreatedAt.AddDays(22), ValidUntil = opp.CreatedAt.AddDays(50),
                    Status = OfferStatus.Accepted,
                    CreatedAt = opp.CreatedAt.AddDays(22), CreatedBy = acqMgr, IsDeleted = false
                });
            }
            else
            {
                // Active offer for OfferMade status
                context.Offers.Add(new Offer
                {
                    Id = Guid.NewGuid(), OpportunityId = opp.Id,
                    Amount = baseAmount, Currency = "GBP",
                    OfferDate = opp.CreatedAt.AddDays(3), ValidUntil = now.AddDays(random.Next(7, 28)),
                    Status = OfferStatus.UnderReview,
                    CreatedAt = opp.CreatedAt.AddDays(3), CreatedBy = acqMgr, IsDeleted = false
                });
            }
        }
    }

    private static void SeedFeasibilityAssessments(BuildEstateDbContext context, List<LandOpportunity> opportunities, Dictionary<string, string> users)
    {
        var finDir = users["FinanceDirector"];

        foreach (var opp in opportunities.Where(o => o.Status >= OpportunityStatus.OfferMade))
        {
            var random = new Random(opp.Id.GetHashCode());
            var landCost = (decimal)(random.NextDouble() * 4_000_000 + 500_000);
            var buildCost = landCost * (decimal)(random.NextDouble() * 1.5 + 1.5);
            var fees = buildCost * 0.15m;
            var finance = (landCost + buildCost) * 0.08m;
            var totalCosts = landCost + buildCost + fees + finance;
            var revenue = totalCosts * (decimal)(random.NextDouble() * 0.4 + 1.2);
            var profit = revenue - totalCosts;
            var roi = (profit / totalCosts) * 100;

            context.FeasibilityAssessments.Add(new FeasibilityAssessment
            {
                Id = Guid.NewGuid(), OpportunityId = opp.Id,
                EstimatedLandCost = Math.Round(landCost, 2),
                EstimatedBuildCost = Math.Round(buildCost, 2),
                ProfessionalFees = Math.Round(fees, 2),
                FinanceCosts = Math.Round(finance, 2),
                ExpectedSalesRevenue = Math.Round(revenue, 2),
                TotalCosts = Math.Round(totalCosts, 2),
                EstimatedProfit = Math.Round(profit, 2),
                RoiPercentage = Math.Round(roi, 2),
                Scenario = FeasibilityScenario.Expected,
                IsReadyForReview = opp.Status >= OpportunityStatus.UnderContract,
                CreatedAt = opp.CreatedAt.AddDays(random.Next(10, 30)),
                CreatedBy = finDir, IsDeleted = false
            });
        }
    }

    private static void SeedDocuments(BuildEstateDbContext context, List<LandOpportunity> opportunities, Dictionary<string, string> users)
    {
        var acqMgr = users["AcquisitionManager"];
        var legal = users["LegalOfficer"];

        var docTemplates = new (DocumentType type, string prefix, string contentType, long minSize, long maxSize)[]
        {
            (DocumentType.TitleDeed, "Title_Deed", "application/pdf", 500_000, 3_000_000),
            (DocumentType.SearchReport, "Local_Authority_Search", "application/pdf", 800_000, 2_500_000),
            (DocumentType.EnvironmentalReport, "Phase1_Environmental_Report", "application/pdf", 1_500_000, 8_000_000),
            (DocumentType.LegalDocument, "Solicitor_Report_on_Title", "application/pdf", 400_000, 1_500_000),
            (DocumentType.PlanningDocument, "Pre_Application_Response", "application/pdf", 200_000, 1_000_000),
            (DocumentType.Valuation, "Red_Book_Valuation", "application/pdf", 600_000, 2_000_000),
            (DocumentType.Correspondence, "Agent_Particulars", "application/pdf", 100_000, 500_000),
            (DocumentType.Contract, "Draft_Contract", "application/pdf", 300_000, 1_200_000)
        };

        foreach (var opp in opportunities.Where(o => o.Status >= OpportunityStatus.InitialReview))
        {
            var random = new Random(opp.Id.GetHashCode());
            var docsToCreate = opp.Status switch
            {
                OpportunityStatus.InitialReview => 2,
                OpportunityStatus.DueDiligence => 4,
                OpportunityStatus.OfferMade => 5,
                OpportunityStatus.UnderContract => 6,
                OpportunityStatus.Acquired => 7,
                _ => 1
            };

            var selectedDocs = docTemplates.OrderBy(_ => random.Next()).Take(docsToCreate);
            foreach (var doc in selectedDocs)
            {
                var siteName = opp.Name.Split('—')[0].Trim().Replace(" ", "_");
                context.Documents.Add(new Document
                {
                    Id = Guid.NewGuid(), OpportunityId = opp.Id,
                    DocType = doc.type,
                    FileName = $"{doc.prefix}_{siteName}.pdf",
                    FilePath = $"/documents/{opp.Id}/{doc.prefix}.pdf",
                    ContentType = doc.contentType,
                    FileSizeBytes = random.NextInt64(doc.minSize, doc.maxSize),
                    UploadedAt = opp.CreatedAt.AddDays(random.Next(2, 20)),
                    CreatedAt = opp.CreatedAt.AddDays(random.Next(2, 20)),
                    CreatedBy = doc.type == DocumentType.LegalDocument ? legal : acqMgr,
                    IsDeleted = false
                });
            }
        }
    }

    private static List<PlanningApplication> SeedPlanningApplications(BuildEstateDbContext context, List<LandOpportunity> opportunities, Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var planMgr = users["PlanningManager"];
        var apps = new List<PlanningApplication>();
        var acquiredAndContract = opportunities.Where(o => o.Status >= OpportunityStatus.UnderContract).Take(9).ToList();

        var appStatuses = new[] { PlanningApplicationStatus.PreApplication, PlanningApplicationStatus.Submitted, PlanningApplicationStatus.UnderReview, PlanningApplicationStatus.Approved, PlanningApplicationStatus.ApprovedWithConditions };

        for (int i = 0; i < acquiredAndContract.Count; i++)
        {
            var opp = acquiredAndContract[i];
            var status = appStatuses[i % appStatuses.Length];
            var app = new PlanningApplication
            {
                Id = Guid.NewGuid(), OpportunityId = opp.Id,
                Description = $"Full planning application for residential development of {(int)(opp.LandSize * 15)} units with associated parking, landscaping and amenity space.",
                ApplicationType = i % 3 == 0 ? PlanningApplicationType.Outline : PlanningApplicationType.Full,
                Status = status,
                ApplicationReference = status >= PlanningApplicationStatus.Submitted ? $"2024/{1000 + i}/FUL" : null,
                CouncilName = $"London Borough of {opp.Location.Split(',')[0]}",
                SubmissionDate = status >= PlanningApplicationStatus.Submitted ? opp.CreatedAt.AddDays(30) : null,
                TargetDecisionDate = status >= PlanningApplicationStatus.Submitted ? opp.CreatedAt.AddDays(90) : null,
                ActualDecisionDate = status >= PlanningApplicationStatus.Approved ? opp.CreatedAt.AddDays(85) : null,
                DecisionDate = status >= PlanningApplicationStatus.Approved ? opp.CreatedAt.AddDays(85) : null,
                CreatedAt = opp.CreatedAt.AddDays(20), CreatedBy = planMgr, IsDeleted = false
            };
            apps.Add(app);
            context.PlanningApplications.Add(app);

            // Add fees
            context.PlanningFees.Add(new PlanningFee
            {
                Id = Guid.NewGuid(), ApplicationId = app.Id,
                Amount = 15000 + i * 2500, Currency = "GBP",
                FeeType = FeeType.ApplicationFee, Description = "Planning application fee",
                PaymentStatus = PaymentStatus.Paid,
                CreatedAt = app.CreatedAt, CreatedBy = planMgr, IsDeleted = false
            });

            // Add council contact
            context.CouncilContacts.Add(new CouncilContact
            {
                Id = Guid.NewGuid(), ApplicationId = app.Id,
                CouncilName = app.CouncilName, PlanningOfficerName = $"Officer {i + 1}",
                Email = $"planning.officer{i + 1}@council.gov.uk", Phone = $"020 8{800 + i:D3} {1000 + i:D4}",
                Address = $"Council Offices, {opp.Location}",
                CreatedAt = app.CreatedAt, CreatedBy = planMgr, IsDeleted = false
            });
        }
        return apps;
    }

    private static void SeedLegalCases(BuildEstateDbContext context, List<LandOpportunity> opportunities, List<PlanningApplication> planningApps, Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var legal = users["LegalOfficer"];
        var caseTypes = new[] { LegalCaseType.Conveyancing, LegalCaseType.Planning, LegalCaseType.ContractReview, LegalCaseType.Regulatory, LegalCaseType.Dispute };
        var firms = new[] { "Clifford Chance LLP", "Herbert Smith Freehills", "Ashurst LLP", "Pinsent Masons", "Slaughter and May", "Allen & Overy" };
        var advanced = opportunities.Where(o => o.Status >= OpportunityStatus.UnderContract).Take(10).ToList();

        for (int i = 0; i < advanced.Count; i++)
        {
            var lc = new LegalCase
            {
                Id = Guid.NewGuid(),
                CaseReference = $"LC-2024-{100 + i:D5}",
                Title = $"{caseTypes[i % caseTypes.Length]} — {advanced[i].Name.Split('—')[0].Trim()}",
                Description = $"Legal case for {advanced[i].Name}. Managing all legal aspects of the transaction.",
                CaseType = caseTypes[i % caseTypes.Length],
                Status = i < 3 ? LegalCaseStatus.InProgress : i < 6 ? LegalCaseStatus.UnderReview : LegalCaseStatus.Closed,
                Priority = i < 2 ? LegalCasePriority.Critical : i < 5 ? LegalCasePriority.High : LegalCasePriority.Medium,
                AssignedSolicitor = $"Solicitor {i + 1}",
                SolicitorFirm = firms[i % firms.Length],
                SolicitorEmail = $"solicitor{i + 1}@{firms[i % firms.Length].ToLower().Replace(" ", "")[..8]}.com",
                OpportunityId = advanced[i].Id,
                CreatedAt = advanced[i].CreatedAt.AddDays(10), CreatedBy = legal, IsDeleted = false
            };
            context.LegalCases.Add(lc);

            // Add contract per case
            context.LegalContracts.Add(new LegalContract
            {
                Id = Guid.NewGuid(),
                ContractReference = $"CON-2024-{200 + i:D5}",
                Title = $"Agreement for Sale — {advanced[i].Name.Split('—')[0].Trim()}",
                ContractType = LegalContractType.LandPurchase,
                Status = i < 4 ? LegalContractStatus.AwaitingSignature : LegalContractStatus.Completed,
                CounterpartyName = OwnerNames[i % OwnerNames.Length],
                ContractValue = advanced[i].LandSize * 500000,
                Currency = "GBP", StartDate = lc.CreatedAt, EndDate = lc.CreatedAt.AddMonths(3),
                PaymentTerms = "10% deposit on exchange, balance on completion",
                LegalCaseId = lc.Id,
                CreatedAt = lc.CreatedAt, CreatedBy = legal, IsDeleted = false
            });
        }
    }

    private static void SeedComplianceRequirements(BuildEstateDbContext context, Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var legal = users["LegalOfficer"];
        var reqs = new (string name, ComplianceCategory cat, string reg, ComplianceFrequency freq)[]
        {
            ("GDPR Data Protection", ComplianceCategory.DataProtection, "UK GDPR / DPA 2018", ComplianceFrequency.Annually),
            ("Anti-Money Laundering", ComplianceCategory.AntiMoneyLaundering, "MLR 2017 / POCA 2002", ComplianceFrequency.Ongoing),
            ("RICS Professional Standards", ComplianceCategory.Financial, "RICS Red Book 2022", ComplianceFrequency.Annually),
            ("Building Regulations", ComplianceCategory.BuildingRegulations, "Building Regs 2010", ComplianceFrequency.Ongoing),
            ("Health & Safety (CDM)", ComplianceCategory.HealthAndSafety, "CDM Regs 2015", ComplianceFrequency.Ongoing),
            ("Environmental Impact", ComplianceCategory.Environmental, "EIA Regs 2017", ComplianceFrequency.OneOff),
            ("Planning Compliance", ComplianceCategory.PlanningCompliance, "TCPA 1990", ComplianceFrequency.Monthly),
            ("Employment Law", ComplianceCategory.Employment, "ERA 1996", ComplianceFrequency.Quarterly),
            ("Fire Safety", ComplianceCategory.HealthAndSafety, "Fire Safety Order 2005", ComplianceFrequency.Annually),
            ("Insurance Adequacy", ComplianceCategory.Financial, "FCA Requirements", ComplianceFrequency.Annually)
        };

        foreach (var (name, cat, reg, freq) in reqs)
        {
            context.ComplianceRequirements.Add(new ComplianceRequirement
            {
                Id = Guid.NewGuid(), Name = name, Category = cat,
                Description = $"Ensure compliance with {reg}. Regular reviews and evidence documentation required.",
                SourceRegulation = reg, Frequency = freq, ResponsibleRole = "LegalOfficer",
                Status = ComplianceRequirementStatus.Active, NextDueDate = now.AddMonths(new Random().Next(1, 6)),
                CreatedAt = now.AddDays(-180), CreatedBy = legal, IsDeleted = false
            });
        }
    }

    private static void SeedInsuranceRecords(BuildEstateDbContext context, Dictionary<string, string> users)
    {
        var now = DateTime.UtcNow;
        var legal = users["LegalOfficer"];
        var records = new (string policy, string insurer, CoverageType type, decimal cover, decimal premium)[]
        {
            ("PI/2024/001", "Hiscox", CoverageType.ProfessionalIndemnity, 10_000_000, 45_000),
            ("PL/2024/002", "Aviva", CoverageType.PublicLiability, 5_000_000, 12_500),
            ("CAR/2024/003", "Zurich", CoverageType.ContractorsAllRisk, 25_000_000, 87_500),
            ("EL/2024/004", "AXA", CoverageType.EmployersLiability, 10_000_000, 8_200),
            ("BG/2024/005", "RSA", CoverageType.BuildingInsurance, 15_000_000, 35_000),
            ("DO/2024/006", "Allianz", CoverageType.LegalExpenses, 5_000_000, 18_000)
        };

        foreach (var (policy, insurer, type, cover, premium) in records)
        {
            context.InsuranceRecords.Add(new InsuranceRecord
            {
                Id = Guid.NewGuid(), PolicyNumber = policy, Insurer = insurer,
                CoverageType = type, CoverAmount = cover, Premium = premium, Currency = "GBP",
                StartDate = now.AddDays(-200), ExpiryDate = now.AddDays(165),
                Status = InsuranceStatus.Active,
                CreatedAt = now.AddDays(-200), CreatedBy = legal, IsDeleted = false
            });
        }
    }

    private static string GetSiteName(int index)
    {
        var names = new[] { "Riverside Development", "Greenfield Site", "Former Industrial Land", "Residential Plot", "Mixed-Use Site", "Brownfield Land", "Waterfront Land", "Former School Site", "Commercial Plot", "Development Opportunity", "Church Lane Site", "Station Road Land", "High Street Redevelopment", "Parkside Plot", "Millbrook Site", "Victoria Quarter", "King's Wharf", "Old Brewery Site", "Harbour View", "Castle Hill", "The Meadows", "Oak Lane Site", "Elm Street Plot", "Chapel Road", "Bridge Street", "Market Square", "Canal Side", "Railway Arches", "Dockside Plot", "Hillcrest Site", "Valley View", "Windmill Lane", "Orchard Place", "The Stables", "Foundry Lane", "Clocktower Site", "Beacon Hill", "Lakeside Plot", "Moorgate", "Priory Gardens", "The Granary", "Wharf Road", "Ironworks Site", "Temple Gate", "Covent Quarter", "Merchant's Yard", "Neptune Wharf", "Atlas Place", "Sovereign Quay", "Pacific Drive" };
        return names[index % names.Length];
    }
}
