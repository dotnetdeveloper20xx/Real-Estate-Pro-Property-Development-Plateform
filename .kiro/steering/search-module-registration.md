# Search Module Registration

## Purpose

Every module in BuildEstate Pro MUST register itself with the global search infrastructure. This document defines the registration contract, the current registry of searchable modules, and the process for adding new searchable entities.

---

## Registration Contract

Each module must provide the following registration metadata:

```typescript
interface SearchModuleRegistration {
  moduleId: string;                    // Unique module identifier
  entityName: string;                  // Display name (e.g., "Land Opportunity")
  entityNamePlural: string;            // Plural form (e.g., "Land Opportunities")
  icon: string;                        // Material Symbols Outlined icon name
  category: string;                    // Grouping category for tabs
  searchFields: SearchFieldDefinition[];
  resultTemplate: SearchResultTemplate;
  navigationRoute: string;             // Angular route pattern with :id
  permissionPolicy: string;            // Backend authorization policy name
  quickActions: QuickAction[];
  enabled: boolean;                    // Can be disabled without removal
}

interface SearchFieldDefinition {
  fieldName: string;                   // Database column / property name
  displayName: string;                 // Human-readable label
  weight: number;                      // 1.0 = normal, 2.0 = double importance
  searchable: boolean;                 // Include in text search
  filterable: boolean;                 // Include in advanced filters
  sortable: boolean;                   // Allow sorting by this field
}

interface SearchResultTemplate {
  titleField: string;                  // Field used as result title
  subtitleField: string;               // Field used as subtitle
  statusField?: string;                // Field for status badge
  descriptionField?: string;           // Field for description/preview
  timestampField: string;              // Field for "last updated"
  additionalFields?: string[];         // Extra context fields
}

interface QuickAction {
  label: string;                       // Action button text
  icon: string;                        // Action icon
  route?: string;                      // Navigation target
  action?: string;                     // Custom action identifier
  permission?: string;                 // Required permission
}
```

---

## Backend Registration (C#)

```csharp
public interface ISearchProvider
{
    string ModuleId { get; }
    string EntityName { get; }
    string CategoryName { get; }
    int Priority { get; }
    
    Task<SearchProviderResult> SearchAsync(
        SearchRequest request,
        ClaimsPrincipal user,
        CancellationToken cancellationToken);
    
    Task<int> CountAsync(
        string query,
        ClaimsPrincipal user,
        CancellationToken cancellationToken);
}
```

Each module implements `ISearchProvider` and registers it via DI:

```csharp
services.AddScoped<ISearchProvider, LandOpportunitySearchProvider>();
services.AddScoped<ISearchProvider, PlanningApplicationSearchProvider>();
// etc.
```

---

## Current Module Registry

### Land Acquisition Module

| Entity | Icon | Category | Search Fields | Weight |
|--------|------|----------|---------------|--------|
| Land Opportunity | `landscape` | Land Acquisition | Name (2.0), Location (1.5), Status (1.0), Source (0.8) | High |
| Land Owner | `person` | Land Acquisition | Name (2.0), ContactDetails (1.0), Address (1.0) | Medium |
| Due Diligence | `fact_check` | Land Acquisition | Type (1.5), Status (1.0), Findings (1.0) | Medium |
| Offer | `local_offer` | Land Acquisition | Amount (1.0), Status (1.5), Currency (0.5) | Medium |
| Contract | `description` | Land Acquisition | Status (1.5), ContractType (1.0) | Medium |
| Acquisition | `real_estate_agent` | Land Acquisition | RegistryRef (2.0), Status (1.0), PurchasePrice (0.8) | High |

### Planning & Approvals Module

| Entity | Icon | Category | Search Fields | Weight |
|--------|------|----------|---------------|--------|
| Planning Application | `assignment` | Planning | ReferenceNumber (2.5), SiteName (2.0), Status (1.0), LocalAuthority (1.5) | High |
| Planning Condition | `checklist` | Planning | Description (1.5), Status (1.0) | Low |

### Legal & Compliance Module

| Entity | Icon | Category | Search Fields | Weight |
|--------|------|----------|---------------|--------|
| Legal Case | `gavel` | Legal | CaseReference (2.5), Title (2.0), Status (1.0), Type (1.0) | High |
| Compliance Check | `verified` | Legal | CheckType (1.5), Status (1.0), Entity (1.0) | Medium |

### User Management

| Entity | Icon | Category | Search Fields | Weight |
|--------|------|----------|---------------|--------|
| User | `person` | Users | FullName (2.5), Email (2.0), Role (1.5), Department (1.0) | High |
| Role | `admin_panel_settings` | Users | Name (2.0), Description (1.0) | Low |

### Documents

| Entity | Icon | Category | Search Fields | Weight |
|--------|------|----------|---------------|--------|
| Document | `article` | Documents | FileName (2.0), DocType (1.5), Description (1.0), Tags (1.5) | High |

### Notifications

| Entity | Icon | Category | Search Fields | Weight |
|--------|------|----------|---------------|--------|
| Notification | `notifications` | Notifications | Title (2.0), Message (1.0), Type (1.0) | Low |

---

## Adding a New Searchable Entity

### Step 1: Define Registration

Create the search provider configuration:
- Identify all text fields worth searching
- Assign weights (2.0+ for primary identifiers, 1.0 for standard, 0.5-0.8 for supplementary)
- Choose an appropriate icon from Material Symbols Outlined
- Define the category (usually the module name)
- Map the navigation route

### Step 2: Implement Backend Provider

- Create `{Entity}SearchProvider : ISearchProvider`
- Implement search with proper indexing
- Apply permission filtering
- Return typed results with relevancy scores

### Step 3: Register in DI

- Add to service registration in the module's `DependencyInjection.cs`

### Step 4: Update Frontend

- Add entity type to search result type union
- Add icon mapping in search result renderer
- Add navigation route in search result click handler
- Add tab if new category

### Step 5: Update Documentation

- Update this file with new entity row
- Update `docs/backend/search-architecture.md`
- Update `docs/frontend/global-search.md`

---

## Module Registration Validation

Before any module is marked complete, verify:

- [ ] All business entities are registered
- [ ] Field weights are reasonable (primary fields > secondary)
- [ ] Icons are distinct and meaningful
- [ ] Navigation routes are correct
- [ ] Permissions are enforced
- [ ] Result template shows useful information
- [ ] Quick actions are relevant to the entity type

---

## Future Modules (To Be Registered)

These modules MUST register search providers when implemented. Each section below provides the expected entities, icons, categories, and priorities. Developers implementing these modules should use `docs/templates/search-provider-template.md` as their starting point.

---

### Health & Safety Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Safety Incident | `health_and_safety` | Health & Safety | ReferenceNumber (2.5), Title (2.0), Location (1.5), Severity (1.5), Status (1.0) | High |
| Risk Assessment | `warning` | Health & Safety | Title (2.0), SiteName (1.5), RiskLevel (1.5), Status (1.0), AssessedBy (0.8) | High |
| Safety Inspection | `checklist` | Health & Safety | InspectionRef (2.5), SiteName (2.0), InspectorName (1.5), Status (1.0) | Medium |
| Safety Training Record | `school` | Health & Safety | CourseName (2.0), EmployeeName (2.0), CertificateNumber (2.5), Status (1.0) | Medium |
| Method Statement | `description` | Health & Safety | Title (2.0), Activity (1.5), Status (1.0), ApprovedBy (0.8) | Low |

---

### Facilities Management Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Facility | `domain` | Facilities | Name (2.5), Address (2.0), Type (1.5), Status (1.0) | High |
| Facility Asset | `inventory_2` | Facilities | AssetTag (2.5), Name (2.0), Location (1.5), Condition (1.0) | High |
| Service Contract | `handshake` | Facilities | ContractRef (2.5), ProviderName (2.0), ServiceType (1.5), Status (1.0) | Medium |
| Work Order | `build` | Facilities | WorkOrderRef (2.5), Description (1.5), Priority (1.0), AssignedTo (1.0), Status (1.0) | Medium |
| Booking | `event` | Facilities | FacilityName (2.0), BookedBy (1.5), Date (0.5), Status (1.0) | Low |

---

### CRM Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Contact | `contacts` | CRM | FullName (2.5), Email (2.0), Phone (1.5), Company (1.5), Type (1.0) | High |
| Company | `business` | CRM | CompanyName (2.5), RegistrationNumber (2.5), Sector (1.5), Status (1.0) | High |
| Interaction | `forum` | CRM | Subject (2.0), ContactName (1.5), Type (1.0), Date (0.5) | Medium |
| Deal | `handshake` | CRM | DealName (2.5), Value (0.8), Stage (1.5), AssignedTo (1.0), Status (1.0) | High |
| Campaign | `campaign` | CRM | CampaignName (2.0), Channel (1.5), Status (1.0), StartDate (0.5) | Low |

---

### Maintenance Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Maintenance Request | `build_circle` | Maintenance | RequestRef (2.5), Description (1.5), Property (2.0), Priority (1.5), Status (1.0) | High |
| Scheduled Maintenance | `event_repeat` | Maintenance | TaskName (2.0), AssetName (1.5), Frequency (1.0), NextDueDate (0.5), Status (1.0) | Medium |
| Contractor Assignment | `engineering` | Maintenance | ContractorName (2.0), TaskRef (2.0), Status (1.0), ScheduledDate (0.5) | Medium |
| Maintenance Asset | `settings` | Maintenance | AssetName (2.5), SerialNumber (2.5), Location (1.5), Condition (1.0) | Medium |

---

### Customer Support Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Support Ticket | `support_agent` | Customer Support | TicketRef (2.5), Subject (2.0), CustomerName (2.0), Priority (1.5), Status (1.0) | High |
| Knowledge Article | `menu_book` | Customer Support | Title (2.5), Category (1.5), Tags (1.5), Content (0.8) | Medium |
| FAQ | `help` | Customer Support | Question (2.5), Category (1.5), Tags (1.0) | Low |
| Customer Feedback | `rate_review` | Customer Support | CustomerName (2.0), Subject (1.5), Rating (0.5), Status (1.0) | Low |

---

### Analytics Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Saved Report | `summarize` | Analytics | ReportName (2.5), Module (1.5), CreatedBy (1.0), Type (1.0) | High |
| Dashboard | `dashboard` | Analytics | DashboardName (2.5), Owner (1.5), Category (1.0) | Medium |
| Scheduled Export | `schedule_send` | Analytics | ExportName (2.0), Format (1.0), Frequency (0.8), Status (1.0) | Low |
| Data Source | `storage` | Analytics | SourceName (2.5), Type (1.5), Status (1.0) | Low |

---

### Asset Management Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Asset | `account_balance` | Asset Management | AssetRef (2.5), Name (2.5), Address (2.0), Type (1.5), Status (1.0) | High |
| Asset Valuation | `trending_up` | Asset Management | AssetName (2.0), ValuationDate (0.5), MarketValue (0.8), Methodology (1.0) | Medium |
| Asset Performance | `monitoring` | Asset Management | AssetName (2.0), Period (0.5), NOI (0.8), OccupancyRate (0.8) | Low |
| Disposal | `sell` | Asset Management | AssetName (2.0), BuyerName (1.5), SalePrice (0.8), Status (1.0), CompletionDate (0.5) | Medium |

---

### Project Management Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Project | `engineering` | Project Management | Name (2.5), ReferenceNumber (2.5), Location (1.5), Status (1.0), ProjectManager (1.0) | High |
| Milestone | `flag` | Project Management | Name (2.0), ProjectName (1.5), DueDate (0.5), Status (1.0) | Medium |
| Task | `task_alt` | Project Management | Title (2.0), AssignedTo (1.5), ProjectName (1.5), Priority (1.0), Status (1.0) | Medium |
| Risk | `warning` | Project Management | Title (2.0), Severity (1.5), Likelihood (1.0), Status (1.0), Owner (1.0) | Medium |
| Issue | `error` | Project Management | Title (2.0), Priority (1.5), AssignedTo (1.5), Status (1.0) | Medium |

---

### Construction Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Construction Stage | `construction` | Construction | StageName (2.0), ProjectName (2.0), Status (1.0), Progress (0.5) | High |
| Site Inspection | `fact_check` | Construction | InspectionRef (2.5), SiteName (2.0), InspectorName (1.5), Status (1.0) | Medium |
| Snagging Item | `bug_report` | Construction | ItemRef (2.5), Description (1.5), Location (1.5), Priority (1.5), Status (1.0) | Medium |
| Progress Update | `update` | Construction | StageName (2.0), ReportDate (0.5), ReportedBy (1.0) | Low |
| Handover Record | `key` | Construction | UnitRef (2.5), BuyerName (2.0), HandoverDate (0.5), Status (1.0) | Medium |

---

### Procurement Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Supplier | `local_shipping` | Procurement | CompanyName (2.5), ContactName (1.5), Category (1.5), Status (1.0), Rating (0.5) | High |
| Purchase Order | `receipt_long` | Procurement | PONumber (2.5), SupplierName (2.0), ProjectName (1.5), TotalValue (0.8), Status (1.0) | High |
| Delivery | `inventory` | Procurement | DeliveryRef (2.5), SupplierName (2.0), PONumber (1.5), Status (1.0), DeliveryDate (0.5) | Medium |
| Material Request | `request_quote` | Procurement | RequestRef (2.5), MaterialName (2.0), RequestedBy (1.0), Urgency (1.5), Status (1.0) | Medium |
| Supplier Invoice | `payments` | Procurement | InvoiceNumber (2.5), SupplierName (2.0), Amount (0.8), Status (1.0) | Medium |

---

### Contractors Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Contractor | `badge` | Contractors | CompanyName (2.5), ContactName (2.0), TradeCategory (1.5), CertificationStatus (1.0) | High |
| Contractor Contract | `description` | Contractors | ContractRef (2.5), ContractorName (2.0), ProjectName (1.5), Value (0.8), Status (1.0) | High |
| Performance Review | `star` | Contractors | ContractorName (2.0), ProjectName (1.5), OverallRating (1.0), ReviewDate (0.5) | Medium |
| Payment Application | `request_page` | Contractors | ApplicationRef (2.5), ContractorName (2.0), Amount (0.8), Status (1.0) | Medium |
| Variation Order | `difference` | Contractors | VariationRef (2.5), ContractorName (2.0), Description (1.0), Value (0.8), Status (1.0) | Medium |

---

### Finance Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Budget | `account_balance_wallet` | Finance | BudgetName (2.5), ProjectName (2.0), FiscalYear (1.0), Status (1.0) | High |
| Invoice | `receipt` | Finance | InvoiceNumber (2.5), SupplierName (2.0), Amount (0.8), Status (1.0), DueDate (0.5) | High |
| Transaction | `swap_horiz` | Finance | TransactionRef (2.5), Description (1.5), Amount (0.8), Category (1.0), Date (0.5) | Medium |
| Cost Code | `tag` | Finance | Code (2.5), Description (2.0), Category (1.5) | Low |
| Cash Flow Forecast | `trending_up` | Finance | ProjectName (2.0), Period (1.0), ForecastDate (0.5) | Low |

---

### Investors Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Investor | `person_pin` | Investors | Name (2.5), Email (2.0), InvestorType (1.5), Status (1.0) | High |
| Funding Round | `monetization_on` | Investors | RoundName (2.5), ProjectName (2.0), TargetAmount (0.8), Status (1.0) | High |
| Drawdown | `download` | Investors | DrawdownRef (2.5), InvestorName (2.0), Amount (0.8), Status (1.0), Date (0.5) | Medium |
| Investor Return | `trending_up` | Investors | InvestorName (2.0), ProjectName (1.5), ReturnAmount (0.8), Period (0.5) | Low |
| Investment Agreement | `handshake` | Investors | AgreementRef (2.5), InvestorName (2.0), FundName (1.5), Status (1.0) | Medium |

---

### Property Units Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Building | `apartment` | Property Units | BuildingName (2.5), Address (2.0), ProjectName (1.5), Type (1.0), Status (1.0) | High |
| Floor | `layers` | Property Units | FloorName (2.0), BuildingName (2.0), Level (1.0) | Low |
| Property Unit | `home` | Property Units | UnitRef (2.5), UnitName (2.0), BuildingName (1.5), Type (1.5), Status (1.0), Price (0.8) | High |
| Unit Specification | `format_list_bulleted` | Property Units | UnitRef (2.0), Bedrooms (1.0), Area (0.8), Tenure (1.0) | Low |

---

### Sales & Conveyancing Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Sales Lead | `person_add` | Sales | FullName (2.5), Email (2.0), Phone (1.5), Source (1.0), Status (1.0) | High |
| Reservation | `event_available` | Sales | ReservationRef (2.5), BuyerName (2.0), UnitRef (2.0), Status (1.0), Amount (0.8) | High |
| Sale | `storefront` | Sales | SaleRef (2.5), BuyerName (2.0), UnitRef (2.0), SalePrice (0.8), Status (1.0) | High |
| Conveyancing Case | `gavel` | Sales | CaseRef (2.5), BuyerName (2.0), SolicitorName (1.5), Status (1.0) | Medium |
| Viewing | `visibility` | Sales | LeadName (2.0), UnitRef (2.0), ScheduledDate (0.5), Status (1.0) | Low |

---

### Rentals Module

| Entity | Icon | Category | Expected Search Fields | Priority |
|--------|------|----------|----------------------|----------|
| Tenant | `person` | Rentals | FullName (2.5), Email (2.0), Phone (1.5), UnitRef (1.5), Status (1.0) | High |
| Lease | `article` | Rentals | LeaseRef (2.5), TenantName (2.0), UnitRef (2.0), Status (1.0), MonthlyRent (0.8) | High |
| Rent Payment | `payments` | Rentals | PaymentRef (2.5), TenantName (2.0), Amount (0.8), Status (1.0), Date (0.5) | Medium |
| Maintenance Request | `build_circle` | Rentals | RequestRef (2.5), TenantName (2.0), Description (1.5), Priority (1.5), Status (1.0) | Medium |
| Rental Inspection | `fact_check` | Rentals | InspectionRef (2.5), UnitRef (2.0), InspectorName (1.5), Status (1.0), Date (0.5) | Low |

---

### Implementation Priority Order

When building future modules, register search providers in this order:

| Priority | Module | Rationale |
|----------|--------|-----------|
| 1 | Project Management | Core orchestration module, most searched |
| 2 | Construction | Largest operational module |
| 3 | Finance | Financial tracking critical for all roles |
| 4 | Property Units | Unit management drives sales/rentals |
| 5 | Sales & Conveyancing | Revenue generation, high search volume |
| 6 | Procurement | Supply chain lookups frequent |
| 7 | Contractors | Vendor management searches |
| 8 | Investors | Capital management |
| 9 | Rentals | Post-completion operations |
| 10 | CRM | Contact/company lookups |
| 11 | Maintenance | Operational requests |
| 12 | Health & Safety | Compliance searches |
| 13 | Facilities | Asset/booking lookups |
| 14 | Customer Support | Ticket/knowledge searches |
| 15 | Analytics | Report discovery |
| 16 | Asset Management | Portfolio-level searches |
