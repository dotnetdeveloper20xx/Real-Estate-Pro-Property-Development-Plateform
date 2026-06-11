# BuildEstate Pro — Module Design Document

## Module Architecture Pattern
Every module in BuildEstate Pro follows the same structural pattern.
This ensures consistency, predictability, and ease of onboarding.

---

## Module Structure (Backend)

```
BuildEstate.Domain/
└── Entities/{ModuleName}/
    ├── {Entity}.cs
    └── ...

BuildEstate.Application/
└── Features/{ModuleName}/
    └── {SubFeature}/
        ├── Commands/
        │   └── {Action}{Entity}/
        │       ├── {Action}{Entity}Command.cs
        │       ├── {Action}{Entity}CommandHandler.cs
        │       └── {Action}{Entity}CommandValidator.cs
        ├── Queries/
        │   └── {Get}{Entity}/
        │       ├── {Get}{Entity}Query.cs
        │       └── {Get}{Entity}QueryHandler.cs
        ├── DTOs/
        │   ├── {Entity}Dto.cs
        │   ├── {Entity}DetailDto.cs
        │   └── {Entity}ListItemDto.cs
        └── Mappings/
            └── {Entity}MappingProfile.cs

BuildEstate.Infrastructure/
└── Persistence/Configurations/
    └── {Entity}Configuration.cs

BuildEstate.API/
└── Controllers/{ModuleName}/
    └── {Entity}Controller.cs
```

## Module Structure (Frontend)

```
src/app/features/{module-name}/
├── components/
│   ├── {entity}-list/
│   │   ├── {entity}-list.component.ts
│   │   ├── {entity}-list.component.html
│   │   └── {entity}-list.component.scss
│   ├── {entity}-detail/
│   ├── {entity}-form/
│   └── {entity}-card/
├── containers/
│   ├── {entity}-list-page/
│   └── {entity}-detail-page/
├── services/
│   └── {entity}.service.ts
├── store/
│   ├── {entity}.actions.ts
│   ├── {entity}.reducer.ts
│   ├── {entity}.effects.ts
│   ├── {entity}.selectors.ts
│   └── {entity}.state.ts
├── models/
│   ├── {entity}.model.ts
│   └── {entity}-form.model.ts
├── {module-name}.routes.ts
└── index.ts
```

---

## Module 1: Land Acquisition

### Entities
| Entity | Purpose | Key Fields |
|--------|---------|------------|
| LandOpportunity | Core pipeline entity | Name, Location, Status, AskingPrice, ROI |
| LandOwner | Owner of the land | Name, Contact, OwnershipType |
| DueDiligence | Checks performed | Type, Status, Findings, RiskLevel |
| Offer | Offers made/received | Amount, Status, ValidUntil |
| Document | Attached documents | FileName, DocType, FilePath |
| LandAcquisitionRecord | Completed acquisition | PurchasePrice, CompletionDate, RegistryRef |

### API Endpoints
| Method | Endpoint | Purpose | Auth Roles |
|--------|----------|---------|-----------|
| GET | /api/v1/opportunities | List with pagination/filter | AcquisitionManager, SuperAdmin |
| GET | /api/v1/opportunities/{id} | Get detail | AcquisitionManager, SuperAdmin |
| POST | /api/v1/opportunities | Create new | AcquisitionManager |
| PUT | /api/v1/opportunities/{id} | Update | AcquisitionManager |
| DELETE | /api/v1/opportunities/{id} | Soft delete | SuperAdmin |
| PATCH | /api/v1/opportunities/{id}/status | Change status | AcquisitionManager, SuperAdmin |
| GET | /api/v1/opportunities/{id}/due-diligences | List DD checks | LegalOfficer, AcquisitionManager |
| POST | /api/v1/opportunities/{id}/due-diligences | Add DD check | LegalOfficer |
| GET | /api/v1/opportunities/{id}/offers | List offers | AcquisitionManager |
| POST | /api/v1/opportunities/{id}/offers | Create offer | AcquisitionManager |
| GET | /api/v1/opportunities/{id}/documents | List documents | AcquisitionManager |
| POST | /api/v1/opportunities/{id}/documents | Upload document | AcquisitionManager |

### Status Transitions (State Machine)
```
Identified → InitialReview → DueDiligence → OfferMade → UnderContract → Acquired
                                                                           ↓
Any State → Withdrawn (terminal)                                      [COMPLETED]
```
Rules:
- Status can only advance forward (no going back without SuperAdmin)
- Due Diligence must be complete before Offer Made
- Offer must be accepted before Under Contract
- Contract must be exchanged before Acquired

### Business Rules
1. Opportunity name + location combination must be unique
2. Asking price must be positive
3. Land size must be positive
4. At least one due diligence of type Legal must pass before advancing to OfferMade
5. Offer amount must be positive and have a valid currency
6. Only one active offer per opportunity at a time
7. Documents must have valid file types (PDF, DOCX, XLSX, PNG, JPG)
8. Status changes trigger audit log entry with old → new value

---

## Module 2: Planning & Approvals (Future)

### Planned Entities
- PlanningApplication
- CouncilSubmission
- PlanningCondition
- PlanningAppeal
- BuildingControlApplication

### Key Relationships
- PlanningApplication belongs to LandOpportunity (FK)
- One opportunity can have multiple planning applications (revisions)

---

## Module 3-14: (To Be Designed)
Each module will be designed following this same template before implementation begins.
Design document must be approved before any code is written.
