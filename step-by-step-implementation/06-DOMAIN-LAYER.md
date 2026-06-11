# Phase 6: Building the Domain Layer

## What You'll Build

The Domain layer is the heart of the application. It contains your business entities (the "things" in your system), enums (the possible states/types), and interface contracts (what the outer layers must provide).

---

## Golden Rule

The Domain layer has ZERO external dependencies. No NuGet packages. No references to EF Core, ASP.NET, or Angular. Just pure C#.

Why? Because your business rules don't change when you swap databases or web frameworks.

---

## Base Types (Already Created in Phase 5)

```
BuildEstate.Domain/
├── Common/
│   ├── BaseEntity.cs         — Shared fields for all entities
│   └── IAuditableEntity.cs   — Interface for audit tracking
└── Interfaces/
    ├── IRepository.cs        — Data access contract
    └── IUnitOfWork.cs        — Save changes contract
```

---

## Entity Structure (All 14 Modules)

Create one folder per module under `Entities/`:

```
BuildEstate.Domain/Entities/
├── LandAcquisition/
│   ├── LandOpportunity.cs
│   ├── LandOwner.cs
│   ├── DueDiligence.cs
│   ├── Offer.cs
│   ├── Document.cs
│   └── LandAcquisitionRecord.cs
├── Planning/
│   ├── PlanningApplication.cs
│   ├── PlanningCondition.cs
│   ├── PlanningAppeal.cs
│   └── PlanningDocument.cs
├── Legal/
│   ├── Contract.cs
│   ├── ComplianceCheck.cs
│   ├── LegalDocument.cs
│   └── LegalTask.cs
├── Projects/
│   ├── Project.cs
│   ├── Milestone.cs
│   ├── ProjectTask.cs
│   └── ProjectRisk.cs
├── Construction/
│   ├── ConstructionStage.cs
│   ├── Inspection.cs
│   └── Snag.cs
├── Procurement/
│   ├── PurchaseOrder.cs
│   └── Delivery.cs
├── Contractors/
│   └── Contractor.cs
├── Finance/
│   ├── BudgetLine.cs
│   ├── FinancialTransaction.cs
│   └── Investor.cs
├── Units/
│   └── PropertyUnit.cs
├── Sales/
│   └── SalesLead.cs
├── Rentals/
│   └── Tenancy.cs
├── Defects/
│   └── Defect.cs
├── Documents/
│   └── KnowledgeDocument.cs
├── Reports/
│   └── SavedReport.cs
├── Portfolio/
│   └── Portfolio.cs
└── Identity/
    ├── Permission.cs
    └── RefreshToken.cs
```

---

## Example Entity: LandOpportunity (The Foundation)

```csharp
namespace BuildEstate.Domain.Entities.LandAcquisition;

using BuildEstate.Domain.Common;
using BuildEstate.Domain.Enums;

/// <summary>
/// Represents a potential land development opportunity in the acquisition pipeline.
/// This is the core entity of Module 1 and the starting point of the entire lifecycle.
/// </summary>
public class LandOpportunity : BaseEntity
{
    // Basic information
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? PostCode { get; set; }

    // Land details
    public decimal LandSize { get; set; }
    public string? CurrentUse { get; set; }
    public string? TitleNumber { get; set; }

    // Financial
    public decimal AskingPrice { get; set; }
    public decimal? EstimatedValue { get; set; }
    public decimal? EstimatedDevelopmentCost { get; set; }
    public decimal? EstimatedProfit { get; set; }

    // Status & pipeline
    public OpportunityStatus Status { get; set; } = OpportunityStatus.Identified;
    public DateTime? ExpectedAcquisitionDate { get; set; }

    // Source & agent
    public string? Source { get; set; }
    public string? AgentName { get; set; }
    public string? AgentContact { get; set; }
    public string? AgentCompany { get; set; }

    // Notes
    public string? Description { get; set; }
    public string? Notes { get; set; }

    // Navigation properties (relationships)
    public Guid? LandOwnerId { get; set; }
    public LandOwner? LandOwner { get; set; }

    public ICollection<DueDiligence> DueDiligences { get; set; } = new List<DueDiligence>();
    public ICollection<Offer> Offers { get; set; } = new List<Offer>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
    public LandAcquisitionRecord? AcquisitionRecord { get; set; }
}
```

---

## Enum Structure

Create one file per enum under `Enums/`:

```
BuildEstate.Domain/Enums/
├── OpportunityStatus.cs
├── DueDiligenceType.cs
├── DueDiligenceStatus.cs
├── OfferStatus.cs
├── DocumentType.cs
├── PlanningApplicationStatus.cs
├── PlanningConditionStatus.cs
├── ContractStatus.cs
├── ContractType.cs
├── ProjectStatus.cs
├── MilestoneStatus.cs
├── ConstructionStageStatus.cs
├── InspectionStatus.cs
├── PurchaseOrderStatus.cs
├── ContractorStatus.cs
├── DefectStatus.cs
├── DefectPriority.cs
├── UnitStatus.cs
├── LeadStatus.cs
├── TenancyStatus.cs
└── ... (one per concept)
```

### Example Enums

```csharp
public enum OpportunityStatus
{
    Identified = 0,
    InitialReview = 1,
    DueDiligence = 2,
    OfferMade = 3,
    UnderContract = 4,
    Acquired = 5,
    Withdrawn = 6
}

public enum DueDiligenceType
{
    Legal = 0,
    Environmental = 1,
    Planning = 2,
    Utilities = 3,
    Valuation = 4,
    Survey = 5
}

public enum DueDiligenceStatus
{
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Failed = 3
}
```

---

## Design Principles for Entities

### 1. Match the Business Language
Entity names and property names should read like the business talks:
- ✅ `LandOpportunity`, `DueDiligence`, `PlanningApplication`
- ❌ `Item`, `Record`, `Data`, `Info`

### 2. One Entity Per Business Concept
Don't combine concepts:
- ✅ Separate `LandOpportunity` and `LandAcquisitionRecord`
- ❌ Single `Land` entity with 50 properties covering both

### 3. Relationships via Foreign Keys
Use explicit FK properties + navigation properties:
```csharp
public Guid OpportunityId { get; set; }       // FK property
public LandOpportunity Opportunity { get; set; } // Navigation
```

### 4. Collections Default to Empty
```csharp
public ICollection<DueDiligence> DueDiligences { get; set; } = new List<DueDiligence>();
```
This prevents null reference exceptions.

### 5. No Logic in Entities
Entities are data holders only. Business logic belongs in Application layer handlers.

---

## Building Order

Build entities in this order (matches module dependencies):

1. **Identity** (Permission, RefreshToken) — needed for auth
2. **LandAcquisition** (LandOpportunity + children) — foundation module
3. **Planning** (PlanningApplication + children) — depends on land
4. **Legal** (Contract, ComplianceCheck) — cross-cutting
5. **Projects** (Project, Milestone, Task, Risk) — orchestration
6. **Construction** (Stage, Inspection, Snag) — depends on project
7. **Procurement** (PurchaseOrder, Delivery) — depends on project
8. **Contractors** (Contractor) — standalone
9. **Finance** (BudgetLine, Transaction, Investor) — cross-cutting
10. **Units** (PropertyUnit) — depends on project
11. **Sales** (SalesLead) — depends on units
12. **Rentals** (Tenancy) — depends on units
13. **Defects** (Defect) — depends on units/construction
14. **Documents** (KnowledgeDocument) — standalone
15. **Reports** (SavedReport) — standalone
16. **Portfolio** (Portfolio) — aggregation

---

## Verification

After creating all entities, run:
```bash
cd backend
dotnet build
```

The Domain project should compile with zero errors and zero warnings. It has no external dependencies, so if it compiles, you know the types are correct.

---

*Next: Phase 7 — Building the Infrastructure Layer (database, EF Core, audit)...*
