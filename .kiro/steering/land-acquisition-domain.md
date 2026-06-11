# BuildEstate Pro — Land Acquisition Domain (Module 1)

## Objective
Manage the full lifecycle of land opportunities from identification and evaluation to acquisition and ownership transfer.

## Land Acquisition Lifecycle (7 Steps)
1. **Identify Opportunity** — Find potential land leads, capture basic info, link source & agent, save to pipeline
2. **Evaluate & Due Diligence** — Conduct legal checks, environmental reports, planning potential, feasibility analysis, risk assessment
3. **Offer & Negotiation** — Prepare offer, negotiate terms, record counter-offers, manage LOI, track approvals
4. **Contract & Exchange** — Draft contracts, legal review, sign contracts, exchange contracts, pay deposit
5. **Valuation & Feasibility** — Assess value & development potential (investment committee approval)
6. **Land Registry & Transfer** — Submit to land registry, track registration, update ownership, store title documents
7. **Acquisition Completed** — Record completion date, update status, notify stakeholders, move to planning phase

## Key Capabilities
- Land Opportunity Pipeline
- Land Details & Ownership
- Sellers, Agents & Brokers
- Valuation & Feasibility Analysis
- Due Diligence Management
- Offers, Negotiations & LOIs
- Contracts & Exchange
- Land Registry & Title Tracking
- Acquisition Completion

## Modules in This Domain
- Opportunity Management
- Due Diligence Management
- Valuation & Feasibility
- Offer & Negotiation
- Contracts & Documents
- Land Registry Tracking
- Acquisition & Handover

## Key Data Entities (Database Structure)

### LandOpportunity
- Id (PK)
- Name
- Location
- LandSize
- Status (Identified, Initial Review, Due Diligence, Offer Made, Under Contract, Acquired)
- Source
- ExpectedAcquisition (date)
- ConversionRate

### LandOwner
- Id (PK)
- Name
- ContactDetails
- Address
- OwnershipType

### DueDiligence
- Id (PK)
- OpportunityId (FK)
- Type (Legal, Environmental, Planning, Utilities, Valuation)
- Status (Pending, In Progress, Completed, Failed)
- ReportDate
- Findings

### Offer
- Id (PK)
- OpportunityId (FK)
- Amount
- OfferDate
- Currency
- ValidUntil
- Status (Under Review, Accepted, Rejected, Counter-Offered)

### Document
- Id (PK)
- OpportunityId (FK)
- DocType (Title Deed, Search Report, Legal Document, Environmental Report)
- FilePath
- UploadedAt

### LandAcquisition
- Id (PK)
- OpportunityId (FK)
- PurchasePrice
- CompletionDate
- RegistryRef
- Status (Completed, Registered)

## Information Gathered Per Opportunity

### Land Details
- Location & Address
- Land Size & Area
- Current Use
- Title Number
- Boundaries
- Access & Roads

### Ownership
- Current Owner
- Contact Details
- Ownership Type
- Leasehold/Freehold
- Encumbrances

### Planning Information
- Planning Status
- Local Plan Zoning
- Planning History
- Permitted Uses
- Planning Constraints
- Section 106 / CIL

### Financial Information
- Asking Price
- Estimated Value
- Est. Development Cost
- Est. Profit / ROI
- Funding Source
- Cash Flow Impact

### Legal & Compliance
- Title Deed
- Search Reports
- Legal Documents
- Regulatory Checks
- Environmental Reports
- Risk & Liabilities

### Physical & Technical
- Topography
- Soil & Ground Reports
- Utilities & Services
- Flood Risk
- Access & Infrastructure
- Environmental Impact

## Forms & Data Entry Screens
1. Opportunity Capture Form
2. Land Details Form
3. Due Diligence Checklist
4. Valuation & Feasibility Form
5. Offer & Negotiation Form
6. Contract & Exchange Form
7. Land Registry Form
8. Acquisition Completion Form

## Approval Workflow
1. **Created** → Land Acquisition Manager
2. **Reviewed** → Legal / Technical Team
3. **Evaluated** → Valuation / Finance
4. **Approved** → Project Director (final approval & decision)
5. **Acquired** → Admin / Support (documentation & data entry)

## Integrations
- Land Registry API
- Companies House API
- Google Maps / Mapbox
- Planning Portal API
- Document e-Signature (Adobe / DocuSign)
- Email & Notifications

## KPIs
- Average Acquisition Cycle: 45 Days
- Opportunities Evaluated: 125
- Opportunities Converted: 12%
- Due Diligence Pass Rate: 68%
- Acquisition Success Rate: 4%

## Reports & Dashboards
- Pipeline Report
- Opportunities by Location (map view)
- Acquisition Forecast
- ROI Analysis
- Due Diligence Status

## Business Value
- Find the right land at the right price
- Reduce acquisition risks
- Ensure legal & regulatory compliance
- Improve decision making with real data
- Faster acquisition cycle
