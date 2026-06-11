# Phase 2: Understanding the Domain — All 14 Modules

## Why This Phase Matters

You cannot build software for a business you don't understand. This phase teaches you what each module does in the real world, what data it manages, and how it connects to other modules.

---

## How Data Flows Through The Platform

```
Land Acquisition → Due Diligence → Planning → Design & Prep → Construction → Sales → Handover → Operations → Analytics
```

Each arrow represents a handoff. When one phase completes, the next phase begins with the data from the previous phase already in the system.

**Shared data entities** exist across all modules:
- Projects
- Documents
- Contacts / Companies
- Financials
- Contracts
- Units / Properties
- Tasks & Approvals
- Compliance Records
- Risks & Issues
- Communications
- Audit Logs

---

## Module 1: Land Acquisition

### Real-World Story
An Acquisition Manager hears about a 5-acre plot for sale in Surrey. They need to capture this lead, evaluate whether it's worth pursuing, run legal and environmental checks, make an offer, negotiate, exchange contracts, and register ownership.

### What The Software Does
- Captures land opportunity leads (location, size, price, agent details)
- Manages a pipeline (like a sales CRM, but for land)
- Tracks due diligence checks (legal, environmental, planning, utilities)
- Records offers and negotiations
- Manages contract exchange and completion
- Tracks land registry registration

### Key Entities
- **LandOpportunity** — The core record (name, location, size, status, asking price)
- **LandOwner** — Who owns the land currently
- **DueDiligence** — Each check performed (type, status, findings)
- **Offer** — Financial offers made (amount, date, conditions, status)
- **Document** — Attached files (title deeds, surveys, reports)
- **LandAcquisitionRecord** — Completed purchase details

### Status Lifecycle
```
Identified → Initial Review → Due Diligence → Offer Made → Under Contract → Acquired
```

### Business Rules
- Must complete legal due diligence before making an offer
- Only one active offer per opportunity at a time
- Cannot go backwards in status without admin override
- All status changes logged to audit trail

---

## Module 2: Planning & Approvals

### Real-World Story
After buying land, you can't just build on it. You must submit a planning application to the local council explaining what you want to build. The council reviews it, may impose conditions, and either approves or refuses. If refused, you can appeal.

### What The Software Does
- Creates and tracks planning applications
- Manages status through council process
- Tracks conditions imposed by the council
- Manages condition discharge (proving you've met conditions)
- Tracks appeals if applications are refused
- Stores planning documents (drawings, statements, reports)

### Key Entities
- **PlanningApplication** — The application record (reference, council, type, status)
- **PlanningCondition** — Conditions imposed (description, deadline, discharge status)
- **PlanningAppeal** — Appeal records if refused (grounds, decision, date)
- **PlanningDocument** — Drawings, statements, reports

### Status Lifecycle
```
Pre-Application → Submitted → Validated → Under Review → Committee → Approved/Refused → Appeal
```

---

## Module 3: Legal & Compliance

### Real-World Story
Property development is heavily regulated. Every contract needs legal review. Every purchase needs compliance checks. Insurance must be maintained. The company must prove to regulators that it follows the rules.

### What The Software Does
- Manages all contracts (land purchase, construction, sales, leases)
- Tracks compliance requirements and checks
- Manages insurance records
- Provides a complete audit trail for regulators
- Stores legal documents with version control
- Tracks legal tasks and deadlines

### Key Entities
- **Contract** — Any legal agreement (type, parties, value, dates, status)
- **ComplianceCheck** — Regulatory requirement verification
- **LegalDocument** — Stored legal files with version tracking
- **LegalTask** — Things the legal team needs to do (deadlines, priority)

---

## Module 4: Project Management

### Real-World Story
Once planning is approved, the Project Manager creates a development plan. They break the project into phases, set milestones, assign tasks, manage budgets, and track risks. This is the orchestration layer — everything else feeds into or out of the project plan.

### What The Software Does
- Creates and manages development projects
- Defines phases and milestones with dates
- Breaks work into tasks assigned to team members
- Tracks budgets (planned vs actual)
- Manages risks and issues with mitigation plans
- Provides timeline/Gantt views
- Generates progress reports for stakeholders

### Key Entities
- **Project** — The development project (name, location, budget, timeline, status)
- **Milestone** — Key dates/deliverables (planned date, actual date, status)
- **ProjectTask** — Individual work items (assignee, priority, status, due date)
- **ProjectRisk** — Identified risks (probability, impact, mitigation, owner)

---

## Module 5: Construction Management

### Real-World Story
The Site Manager oversees the physical build. They track progress stage by stage (foundations, frame, roof, internals), schedule inspections, record snagging items (defects found during build), and prepare for handover.

### What The Software Does
- Defines construction stages per project
- Tracks progress percentage with evidence
- Schedules and records inspections
- Manages snagging lists (defects during construction)
- Monitors health & safety compliance
- Tracks handover readiness

### Key Entities
- **ConstructionStage** — Build phases (name, planned dates, progress %, status)
- **Inspection** — Scheduled checks (type, date, result, inspector)
- **Snag** — Defects found (location, description, priority, assigned contractor)

---

## Module 6: Procurement & Materials

### Real-World Story
Building requires materials — concrete, steel, bricks, windows, pipes. The procurement team creates purchase orders, manages supplier relationships, tracks deliveries, and handles invoices.

### What The Software Does
- Creates and approves purchase orders
- Tracks supplier information and performance
- Records deliveries (what arrived, what's damaged/missing)
- Monitors inventory and stock levels
- Manages supplier invoices and payments

### Key Entities
- **PurchaseOrder** — Order placed with supplier (items, quantities, amounts, status)
- **Delivery** — Goods received (order reference, date, condition, discrepancies)

---

## Module 7: Contractors & Suppliers

### Real-World Story
Construction work is done by specialist contractors — electricians, plumbers, bricklayers, roofers. The company needs to manage contractor information, evaluate performance, and process payments.

### What The Software Does
- Maintains a contractor/supplier database
- Tracks pre-qualification and certifications
- Records performance evaluations
- Manages payment schedules and invoices
- Monitors insurance and compliance status

### Key Entities
- **Contractor** — External company/individual (name, trade, certifications, rating, status)

---

## Module 8: Finance & Budget Control

### Real-World Story
The Finance Director needs to know: Are we making money? Every project has a budget. Costs are tracked against it. Cash flow is monitored. Profitability is calculated. Variances are flagged.

### What The Software Does
- Sets up project budgets with line items
- Records actual costs as incurred
- Calculates budget variance (over/under)
- Projects cash flow (money in vs money out over time)
- Monitors profitability per project
- Generates financial reports (P&L, cost breakdowns)
- Flags budget overruns automatically

### Key Entities
- **BudgetLine** — Individual budget item (category, planned amount, actual amount)
- **FinancialTransaction** — Money movement (amount, date, type, category, project)

---

## Module 9: Investors & Funding

### Real-World Story
Development projects are expensive. Often funded by external investors who expect returns. The company needs to track who invested, how much, when drawdowns happen, and what returns are generated.

### What The Software Does
- Registers investors with KYC/AML information
- Tracks funding commitments and drawdowns
- Calculates expected and actual returns
- Manages repayment schedules
- Produces investor reports and statements

### Key Entities
- **Investor** — External funding source (name, type, committed amount, KYC status)

---

## Module 10: Property Units

### Real-World Story
A development might contain 100 apartments, 20 houses, and 5 commercial units. Each unit has a type, floor plan, price, and status. Units move through: Available → Reserved → Sold → Handed Over.

### What The Software Does
- Creates and manages individual units within projects
- Defines unit types, specifications, and pricing
- Tracks unit status through lifecycle
- Shows availability for sales team
- Records handover status

### Key Entities
- **PropertyUnit** — Individual unit (type, floor, bedrooms, price, status, project)

---

## Module 11: Sales & Conveyancing

### Real-World Story
The Sales Manager markets units, manages leads (potential buyers), books viewings, takes reservations, and manages the legal sales process (conveyancing) through to completion.

### What The Software Does
- Captures and manages sales leads
- Tracks the sales pipeline (lead → viewing → reservation → sale → completion)
- Manages reservations with deposits
- Tracks conveyancing progress per sale
- Calculates commissions

### Key Entities
- **SalesLead** — Potential buyer (name, contact, source, interested unit, status)

---

## Module 12: Rental Management

### Real-World Story
Some units are retained as rental properties. The Property Manager needs to manage tenants, leases, rent collection, and maintenance requests.

### What The Software Does
- Manages tenants and tenancy agreements
- Tracks rent payments and arrears
- Handles maintenance requests
- Schedules property inspections
- Monitors occupancy rates

### Key Entities
- **Tenancy** — Rental agreement (tenant, unit, start date, end date, rent amount, status)

---

## Module 13: Documents & Knowledge

### Real-World Story
A single project generates hundreds of documents — title deeds, planning drawings, contracts, inspection reports, certificates. The team needs a central, searchable repository with version control.

### What The Software Does
- Provides a centralised document repository
- Supports version control (track changes over time)
- Categories and tags for easy searching
- Access control (who can see what)
- Templates for common documents
- Integration with other modules (link documents to opportunities, projects, units)

### Key Entities
- **KnowledgeDocument** — Document record (name, category, version, upload date, tags)

---

## Module 14: Reports & Dashboards

### Real-World Story
Executives need real-time visibility across the entire portfolio. They want dashboards showing key metrics, trends, risks, and performance — without running manual reports.

### What The Software Does
- Executive dashboard with portfolio-level KPIs
- Module-specific dashboards (land pipeline, construction progress, sales velocity)
- Custom report builder
- Financial reports (P&L, cash flow, ROI analysis)
- Operational reports (schedule adherence, defect rates)
- Export capabilities (PDF, Excel, CSV)

### Key Entities
- **SavedReport** — User-created report definitions (name, type, filters, schedule)

---

## How Modules Connect (Data Relationships)

```
LandOpportunity
    └── DueDiligence (many)
    └── Offers (many)
    └── Documents (many)
    └── PlanningApplication (one-to-one, after acquisition)
    └── Project (one-to-one, after planning approved)
            └── Milestones (many)
            └── Tasks (many)
            └── Risks (many)
            └── ConstructionStages (many)
                    └── Inspections (many)
                    └── Snags (many)
            └── BudgetLines (many)
            └── FinancialTransactions (many)
            └── PurchaseOrders (many)
            └── PropertyUnits (many)
                    └── SalesLeads (many)
                    └── Tenancies (many)
            └── Contracts (many)
            └── Documents (many)
```

---

## The Approval Pattern (Used Everywhere)

Every module follows the same approval workflow:

1. **Submitted** — User submits item for review
2. **Under Review** — Assigned reviewer evaluates
3. **Approved / Rejected** — Decision recorded with notes
4. **Escalation** — Auto-escalate if no response within SLA

This is a reusable pattern. Build it once, use it in every module.

---

## Key Insight for Implementation

Notice how every module has:
- A **list** (table with search, filter, sort, pagination)
- A **create form** (capture new records)
- A **detail view** (show all information about one record)
- An **edit form** (modify existing records)
- A **status lifecycle** (records move through defined states)
- An **audit trail** (who did what, when)
- A **dashboard section** (KPIs and metrics)

This is why we create a **repeatable pattern** and apply it to every module. You'll learn this pattern once and use it 14 times.

---

*Next: Phase 3 — Understanding the Architecture...*
