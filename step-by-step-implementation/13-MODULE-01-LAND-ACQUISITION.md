# Phase 13: Module 1 — Land Acquisition (The Foundation)

## Why This Module Is First

Land Acquisition is where every property development begins. It's also the module that establishes ALL the patterns used by the remaining 13 modules. Build it right, and everything else follows the same recipe.

---

## Business Context

An Acquisition Manager needs to:
1. Record a new land opportunity they've heard about
2. Evaluate whether it's worth pursuing (due diligence)
3. Make an offer if it passes checks
4. Track the purchase through to land registry completion
5. See their entire pipeline at a glance

---

## Entities (Already Defined in Phase 6)

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| `LandOpportunity` | Core pipeline record | Name, Location, LandSize, AskingPrice, Status |
| `LandOwner` | Who owns the land | Name, Contact, OwnershipType |
| `DueDiligence` | Check performed | OpportunityId, Type, Status, Findings, RiskLevel |
| `Offer` | Financial offer | OpportunityId, Amount, Currency, ValidUntil, Status |
| `Document` | Attached file | OpportunityId, DocType, FileName, FilePath |
| `LandAcquisitionRecord` | Completed purchase | OpportunityId, PurchasePrice, CompletionDate, RegistryRef |

---

## Status State Machine

```
Identified → InitialReview → DueDiligence → OfferMade → UnderContract → Acquired
                                                                            │
Any State → Withdrawn (terminal)                                       [COMPLETED]
```

### Transition Rules
- Can only advance forward (no going back without SuperAdmin)
- Must have at least one completed Legal due diligence before → OfferMade
- Must have an accepted offer before → UnderContract
- Must have acquisition record before → Acquired
- Withdrawn is terminal (end of pipeline)

---

## Backend Implementation Checklist

### Step 1: Entities ✓ (Phase 6)
### Step 2: Enums ✓ (Phase 6)
### Step 3: EF Core Configurations

Create configurations for ALL entities in this module:
- `LandOpportunityConfiguration.cs`
- `LandOwnerConfiguration.cs`
- `DueDiligenceConfiguration.cs`
- `OfferConfiguration.cs`
- `DocumentConfiguration.cs`
- `LandAcquisitionRecordConfiguration.cs`

### Step 4: Migration
```bash
dotnet ef migrations add AddLandAcquisitionModule ...
dotnet ef database update ...
```

### Step 5: DTOs

| DTO | Purpose |
|-----|---------|
| `OpportunityListItemDto` | Table row (Id, Name, Location, Price, Status, Date) |
| `OpportunityDetailDto` | Detail page (all fields + nested collections) |
| `CreateOpportunityCommand` | Create form submission |
| `UpdateOpportunityCommand` | Edit form submission |
| `ChangeOpportunityStatusCommand` | Status change |
| `DueDiligenceDto` | DD list item |
| `CreateDueDiligenceCommand` | Add DD check |
| `OfferDto` | Offer list item |
| `CreateOfferCommand` | Submit offer |

### Step 6: Commands & Handlers

| Command | What It Does |
|---------|-------------|
| `CreateOpportunity` | Creates new opportunity with status = Identified |
| `UpdateOpportunity` | Updates details (name, location, price, etc.) |
| `DeleteOpportunity` | Soft-deletes |
| `ChangeOpportunityStatus` | Advances status (with state machine validation) |
| `CreateDueDiligence` | Adds a DD check to an opportunity |
| `UpdateDueDiligence` | Updates DD status/findings |
| `CreateOffer` | Submits an offer (validates only one active offer) |
| `AcceptOffer` / `RejectOffer` | Changes offer status |
| `CreateAcquisitionRecord` | Records purchase completion |

### Step 7: Queries & Handlers

| Query | What It Returns |
|-------|----------------|
| `GetOpportunities` | Paginated list with search/filter/sort |
| `GetOpportunityById` | Full detail with nested DD, offers, documents |
| `GetDueDiligences` | DD checks for a specific opportunity |
| `GetOffers` | Offers for a specific opportunity |
| `GetPipelineStats` | KPI numbers (counts per status) |

### Step 8: Controller

```
OpportunitiesController
├── GET    /api/v1/opportunities           → List (paginated)
├── GET    /api/v1/opportunities/{id}      → Detail
├── POST   /api/v1/opportunities           → Create
├── PUT    /api/v1/opportunities/{id}      → Update
├── DELETE /api/v1/opportunities/{id}      → Soft delete
├── PATCH  /api/v1/opportunities/{id}/status → Change status
├── GET    /api/v1/opportunities/{id}/due-diligences → List DD
├── POST   /api/v1/opportunities/{id}/due-diligences → Add DD
├── GET    /api/v1/opportunities/{id}/offers → List offers
├── POST   /api/v1/opportunities/{id}/offers → Create offer
├── PATCH  /api/v1/opportunities/{id}/offers/{offerId}/accept → Accept
├── PATCH  /api/v1/opportunities/{id}/offers/{offerId}/reject → Reject
├── GET    /api/v1/opportunities/{id}/documents → List docs
└── POST   /api/v1/opportunities/{id}/documents → Upload doc
```

---

## Frontend Implementation Checklist

### NgRx Store

```
features/land-acquisition/store/
├── opportunities.actions.ts    — loadOpportunities, create, update, delete, changeStatus
├── opportunities.reducer.ts    — state transitions
├── opportunities.effects.ts    — API calls, toast notifications, navigation
├── opportunities.selectors.ts  — selectAll, selectById, selectLoading, selectStats
└── opportunities.state.ts      — interface + initial state
```

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| Opportunity List | `/opportunities` | Table with all opportunities, pipeline KPIs |
| Opportunity Form | `/opportunities/new` | Create new opportunity |
| Opportunity Detail | `/opportunities/:id` | Full details + tabs (DD, offers, docs, activity) |
| Opportunity Edit | `/opportunities/:id/edit` | Edit existing opportunity |
| Due Diligence List | `/due-diligence` | All DD checks across opportunities |
| Due Diligence Form | `/due-diligence/new` | Add new DD check |
| Acquisition Dashboard | `/acquisition/dashboard` | Pipeline metrics and charts |

### List Page Features
- Search (by name and location)
- Filter by status (dropdown)
- Sort by columns (name, price, date, status)
- Pagination (20 items per page)
- CSV Export button
- "Create New" button
- Status badge per row
- Click row → navigate to detail

### Detail Page Features
- All opportunity fields displayed
- Status badge (current)
- "Change Status" button (with valid next states)
- "Edit" button → navigate to edit form
- Tabs: Due Diligence | Offers | Documents | Activity
- Each tab shows relevant sub-records
- "Add" buttons on each tab for creating sub-records

### Create/Edit Form Features
- All fields with appropriate input types
- Required field indicators (*)
- Inline validation messages (on blur)
- Submit button (disabled until valid)
- Cancel button (with unsaved changes check)
- Toast on success → navigate to detail
- Error display on failure

---

## Business Rule Implementation

### Status Change Validation (in Handler)

```csharp
public class ChangeOpportunityStatusCommandHandler : ...
{
    public async Task<OpportunityDetailDto> Handle(...)
    {
        var opportunity = await _repository.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException("Opportunity", request.Id);

        var newStatus = Enum.Parse<OpportunityStatus>(request.NewStatus);

        // Validate transition
        ValidateStatusTransition(opportunity.Status, newStatus, opportunity);

        opportunity.Status = newStatus;
        await _unitOfWork.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Opportunity {Id} status changed: {Old} → {New}",
            opportunity.Id, opportunity.Status, newStatus);

        return _mapper.Map<OpportunityDetailDto>(opportunity);
    }

    private void ValidateStatusTransition(
        OpportunityStatus current, OpportunityStatus target, LandOpportunity opportunity)
    {
        // Withdrawn is always valid (from any state)
        if (target == OpportunityStatus.Withdrawn) return;

        // Must advance forward
        if ((int)target <= (int)current)
            throw new ConflictException($"Cannot move from {current} to {target}. Status can only advance forward.");

        // Must have legal DD before OfferMade
        if (target == OpportunityStatus.OfferMade)
        {
            var hasLegalDD = opportunity.DueDiligences
                .Any(dd => dd.Type == DueDiligenceType.Legal && dd.Status == DueDiligenceStatus.Completed);
            if (!hasLegalDD)
                throw new ConflictException("Legal due diligence must be completed before making an offer.");
        }

        // Must have accepted offer before UnderContract
        if (target == OpportunityStatus.UnderContract)
        {
            var hasAcceptedOffer = opportunity.Offers.Any(o => o.Status == OfferStatus.Accepted);
            if (!hasAcceptedOffer)
                throw new ConflictException("An offer must be accepted before moving to Under Contract.");
        }
    }
}
```

---

## Seed Data

Create 5-10 realistic opportunities with varying statuses:

```csharp
var opportunities = new[]
{
    new LandOpportunity { Name = "Riverside Plot, Kingston", Location = "Kingston upon Thames", LandSize = 2.5m, AskingPrice = 4500000, Status = OpportunityStatus.DueDiligence },
    new LandOpportunity { Name = "Old Mill Site, Guildford", Location = "Guildford, Surrey", LandSize = 1.8m, AskingPrice = 3200000, Status = OpportunityStatus.Identified },
    new LandOpportunity { Name = "Station Road Land", Location = "Woking, Surrey", LandSize = 3.2m, AskingPrice = 6800000, Status = OpportunityStatus.OfferMade },
    new LandOpportunity { Name = "Church Lane Plot", Location = "Epsom, Surrey", LandSize = 0.8m, AskingPrice = 1950000, Status = OpportunityStatus.Acquired },
    new LandOpportunity { Name = "Industrial Estate", Location = "Croydon, London", LandSize = 5.1m, AskingPrice = 12000000, Status = OpportunityStatus.UnderContract },
};
```

---

## Unit Tests Required

| Test | What It Verifies |
|------|-----------------|
| `CreateOpportunity_WithValidData_Succeeds` | Happy path |
| `CreateOpportunity_WithEmptyName_Fails` | Validation |
| `CreateOpportunity_WithNegativePrice_Fails` | Validation |
| `ChangeStatus_ForwardTransition_Succeeds` | State machine |
| `ChangeStatus_BackwardTransition_Fails` | State machine |
| `ChangeStatus_ToOfferMade_WithoutLegalDD_Fails` | Business rule |
| `ChangeStatus_ToWithdrawn_FromAnyState_Succeeds` | Business rule |
| `CreateOffer_WhenActiveOfferExists_Fails` | Business rule |

---

## Completion Criteria

- [ ] All CRUD operations work via Swagger
- [ ] Status changes enforce business rules
- [ ] Frontend list loads with seed data
- [ ] Frontend create form works end-to-end
- [ ] Frontend detail page shows all tabs
- [ ] Status change works from detail page
- [ ] Toast notifications on all actions
- [ ] CSV export works
- [ ] Pagination works
- [ ] Search and filter work
- [ ] All unit tests pass

---

*This module establishes the pattern. Modules 2-14 follow the exact same recipe with different entities and business rules.*

*Next: Phase 14 — Module 2: Planning & Approvals...*
