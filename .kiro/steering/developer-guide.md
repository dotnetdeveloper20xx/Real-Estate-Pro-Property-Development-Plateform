Absolutely — this version is aimed at developers, coders, team leads, and AI coding agents. It explains **how to implement each piece of the puzzle**, not just what the business does.

# developer-implementation-guide.md

# Property Development Lifecycle Platform

## Developer, Coder & Implementation Guide

## Purpose

This document explains how the Property Development Lifecycle Platform should be implemented from a developer and technical delivery perspective.

It converts the business workflows into practical software implementation guidance covering:

* Backend domains
* Database entities
* API endpoints
* CQRS commands and queries
* Angular pages
* NgRx state
* Reusable components
* Dashboards
* Forms
* Validation
* Testing
* Documentation
* Help Centre requirements

Every developer, team lead, architect, tester, and AI coding agent must use this guide before implementing any module.

---

# 1. Implementation Mindset

This platform must not be built as random CRUD screens.

Each module must be implemented as a business workflow.

For every module, the developer must ask:

* What real business process are we supporting?
* What data must be captured?
* What status changes are allowed?
* What approvals are needed?
* What documents are required?
* What should appear on dashboards?
* What should be audited?
* What help guidance should exist?
* What can go wrong?
* What must be tested?

A module is not complete just because pages, APIs, and tables exist.

A module is complete only when the user can perform the real workflow clearly and safely.

---

# 2. Standard Module Implementation Pattern

Every module should follow the same implementation pattern.

## Backend

Each module should normally contain:

* Domain entities
* Enums
* Entity configurations
* Database migration
* DTOs
* Commands
* Queries
* Validators
* Handlers
* Controllers
* Authorization rules
* Audit trail support
* Unit tests

## Frontend

Each module should normally contain:

* Routes
* List page
* Detail page
* Create page
* Edit page
* Dashboard section
* NgRx actions
* NgRx reducer
* NgRx effects
* NgRx selectors
* Service
* Models
* Reusable components
* Empty states
* Loading states
* Error states
* Toast notifications
* Confirmation dialogs
* Help links

## Documentation

Each module must update:

* Help Centre
* User Bible
* Module Guide
* Release Notes
* Implementation Log

---

# 3. Core Backend Architecture

Use ASP.NET Core with Clean Architecture.

Recommended projects:

* Domain
* Application
* Infrastructure
* API

## Domain Layer

The Domain layer contains business entities, enums, value objects, and domain rules.

It must not depend on EF Core, API, Angular, SQL Server, or infrastructure concerns.

## Application Layer

The Application layer contains CQRS commands, queries, validators, DTOs, and handlers.

Business workflows should live here.

## Infrastructure Layer

The Infrastructure layer contains EF Core DbContext, entity configurations, repositories if needed, external services, persistence, and seed data.

## API Layer

The API layer exposes controllers, authentication, authorization, Swagger, middleware, and HTTP endpoints.

Controllers must remain thin.

---

# 4. Core Frontend Architecture

Use Angular 20 with standalone components.

The frontend must be treated as a corporate application platform, not a collection of pages.

Recommended structure:

* core
* shared
* layout
* design-system
* features
* state
* help
* administration

## Core

Contains global services:

* Auth service
* Toast service
* Modal service
* Loading service
* Permission service
* Breadcrumb service
* Help service
* Theme service

## Shared

Contains reusable UI pieces:

* Page header
* Metric card
* Data grid
* Status badge
* Risk badge
* Empty state
* Error state
* Loading spinner
* Confirmation dialog
* Help panel
* Timeline
* Audit history

## Features

Each business module should live under features.

Example:

features/planning-approvals
features/land-acquisition
features/finance
features/construction

---

# 5. Portfolio Strategy Module

## Business Purpose

This module gives executives visibility across the whole development portfolio.

## Backend Implementation

Create entities such as:

* Portfolio
* PortfolioObjective
* PortfolioRegionTarget
* PortfolioRisk
* PortfolioPerformanceSnapshot

Key fields:

* Name
* Region
* Target units
* Target investment
* Target profit
* Risk level
* Status
* Reporting period
* Created/updated audit fields

## API Endpoints

Create endpoints for:

* Get portfolio dashboard
* Get active portfolios
* Create portfolio
* Update portfolio
* Get portfolio performance
* Get portfolio risks

## Frontend Pages

Create:

* Portfolio dashboard
* Portfolio list
* Portfolio detail
* Regional targets
* Portfolio risks
* Portfolio performance

## Dashboard Widgets

Show:

* Active projects
* Capital deployed
* Expected profit
* Regional exposure
* Portfolio risks
* Project pipeline

---

# 6. Land Opportunity Module

## Business Purpose

This module manages potential land before acquisition.

## Backend Entities

Create:

* LandOpportunity
* LandOwner
* LandLocation
* LandAgent
* OpportunityDocument
* OpportunityScore

## Core Workflow

Opportunity created
Initial review
Shortlisted
Due diligence
Approved for acquisition
Rejected
Archived

## Required Features

Users must be able to:

* Create opportunity
* Edit opportunity
* Search opportunities
* Filter by region/status/risk
* Compare opportunities
* Shortlist opportunity
* Reject opportunity
* Convert opportunity to acquisition

## Frontend Pages

Create:

* Land opportunity dashboard
* Opportunity list
* Opportunity pipeline
* Opportunity detail
* Create/edit opportunity form
* Opportunity comparison page

## NgRx

Create:

* actions
* reducer
* effects
* selectors
* state model

Actions should include:

* loadOpportunities
* createOpportunity
* updateOpportunity
* shortlistOpportunity
* rejectOpportunity
* convertToAcquisition

---

# 7. Feasibility & Viability Module

## Business Purpose

This module decides whether a land opportunity is financially viable.

## Backend Entities

Create:

* FeasibilityAssessment
* CostAssumption
* RevenueAssumption
* ScenarioModel
* ViabilityDecision

## Key Calculations

The system should calculate:

* Estimated land cost
* Estimated build cost
* Professional fees
* Finance costs
* Gross development value
* Expected sales revenue
* Estimated profit
* ROI
* Best case
* Expected case
* Worst case

## Frontend Pages

Create:

* Feasibility dashboard
* Assessment form
* Scenario modeller
* ROI summary
* Approval decision page

## Validation

Validate:

* Costs cannot be negative
* ROI must be calculated consistently
* Required assumptions must exist before approval
* Decision must have notes

---

# 8. Due Diligence Module

## Business Purpose

This module tracks all checks required before buying land.

## Backend Entities

Create:

* DueDiligenceChecklist
* DueDiligenceItem
* DueDiligenceIssue
* DueDiligenceDocument
* DueDiligenceApproval

## Checklist Areas

Include:

* Legal searches
* Title checks
* Environmental searches
* Flood risk
* Utilities
* Access rights
* Planning history
* Survey reports

## Frontend Pages

Create:

* Due diligence dashboard
* Checklist page
* Issues page
* Documents page
* Approval page

## Important Rules

An opportunity should not proceed to acquisition unless mandatory checks are passed or formally waived.

Waivers must be audited.

---

# 9. Land Acquisition Module

## Business Purpose

This module manages the actual land purchase.

## Backend Entities

Create:

* LandAcquisition
* LandOffer
* LandNegotiation
* LandContract
* LandRegistryRecord
* AcquisitionApproval

## Workflow

Draft offer
Offer submitted
Negotiation
Offer accepted
Contract issued
Exchange
Completion
Land registered
Acquired

## Required Features

Users must be able to:

* Create offer
* Submit offer
* Track negotiations
* Record accepted offer
* Manage solicitor details
* Track exchange
* Track completion
* Track Land Registry registration

## API Endpoints

Create endpoints for each workflow action.

Status changes must use state machine rules.

Do not allow invalid transitions.

---

# 10. Planning & Approvals Module

## Business Purpose

This module manages planning applications submitted to local councils.

## Backend Entities

Create:

* PlanningApplication
* PlanningCondition
* PlanningAppeal
* PlanningDocument

## Workflow

Pre-application
Submitted
Validated
Under review
Committee review
Approved
Approved with conditions
Refused
Appeal
Withdrawn

## Required Features

Users must be able to:

* Create planning application
* Submit application
* Change status
* Add conditions
* Discharge conditions
* Add appeal
* Track appeal decision
* Upload planning documents

## Frontend Pages

Create:

* Planning dashboard
* Application list
* Application detail
* Create/edit application
* Conditions tab
* Appeals tab
* Documents tab
* Activity tab

## Testing

Test:

* Validators
* Command handlers
* State transitions
* Invalid transitions
* Condition discharge rules

---

# 11. Legal & Compliance Module

## Business Purpose

This module protects the company legally and operationally.

## Backend Entities

Create:

* LegalCase
* LegalDocument
* ComplianceRequirement
* ComplianceCheck
* InsuranceRecord
* AuditRecord

## Required Features

Users must track:

* Contracts
* Legal documents
* Insurance
* Compliance checks
* Regulatory evidence
* Audit history

## Frontend Pages

Create:

* Legal dashboard
* Contract register
* Compliance checklist
* Insurance register
* Audit trail
* Document library

---

# 12. Design & Professional Services Module

## Business Purpose

This module manages architects, engineers, consultants, drawings, and design approvals.

## Backend Entities

Create:

* DesignPackage
* Drawing
* DesignRevision
* Consultant
* DesignReview
* DesignApproval

## Required Features

Users must be able to:

* Upload drawings
* Track versions
* Assign consultants
* Request reviews
* Approve design stages
* Track design issues

## Frontend Pages

Create:

* Design dashboard
* Drawing register
* Consultant list
* Design reviews
* Approval workflow

---

# 13. Procurement & Materials Module

## Business Purpose

This module controls purchasing and delivery of materials.

## Backend Entities

Create:

* Supplier
* PurchaseOrder
* PurchaseOrderLine
* Delivery
* InventoryItem
* SupplierInvoice

## Required Features

Users must be able to:

* Create purchase orders
* Track approvals
* Track deliveries
* Record damaged/missing items
* Track supplier invoices
* Monitor stock

## Frontend Pages

Create:

* Procurement dashboard
* Purchase order list
* Supplier list
* Delivery tracker
* Inventory page
* Invoice page

---

# 14. Construction Management Module

## Business Purpose

This module tracks physical project delivery.

## Backend Entities

Create:

* ConstructionStage
* ConstructionMilestone
* SiteProgressUpdate
* SiteInspection
* SnaggingItem
* HandoverRecord

## Workflow

Groundworks
Foundations
Frame
Roof
Windows
First fix
Second fix
Decoration
Inspection
Snagging
Handover

## Required Features

Users must be able to:

* Create stages
* Update progress
* Track milestones
* Record delays
* Add inspections
* Manage snagging
* Complete handover

## Frontend Pages

Create:

* Construction dashboard
* Stage board
* Timeline view
* Inspection list
* Snagging list
* Handover page

---

# 15. Finance & Budget Control Module

## Business Purpose

This module tracks project money.

## Backend Entities

Create:

* ProjectBudget
* BudgetLine
* CostTransaction
* Invoice
* CashFlowForecast
* ProfitabilitySnapshot

## Required Features

Users must track:

* Approved budget
* Revised budget
* Actual costs
* Committed costs
* Invoices
* Cash flow
* Profitability
* Budget variance

## Frontend Pages

Create:

* Finance dashboard
* Budget page
* Cost tracker
* Invoice register
* Cash flow page
* Profitability page

---

# 16. Investors & Funding Module

## Business Purpose

This module manages funding sources and investor returns.

## Backend Entities

Create:

* Investor
* FundingRound
* FundingCommitment
* Drawdown
* InvestorReturn
* RepaymentSchedule

## Required Features

Users must be able to:

* Register investors
* Track commitments
* Track drawdowns
* Track repayments
* Calculate expected returns
* Produce investor reports

## Frontend Pages

Create:

* Investor dashboard
* Investor register
* Funding rounds
* Drawdowns
* Returns
* Investor reporting

---

# 17. Property Units Module

## Business Purpose

This module manages individual flats, houses, or commercial units.

## Backend Entities

Create:

* BuildingBlock
* Floor
* PropertyUnit
* UnitSpecification
* UnitPriceHistory
* UnitStatusHistory

## Required Features

Users must be able to:

* Create units
* Assign unit types
* Set prices
* Track availability
* Track reservation/sale/rental status
* Track handover status

## Frontend Pages

Create:

* Unit dashboard
* Unit register
* Floor plan placeholder
* Pricing page
* Availability page
* Handover page

---

# 18. Sales & Conveyancing Module

## Business Purpose

This module manages sale of units.

## Backend Entities

Create:

* SalesLead
* Buyer
* Reservation
* Sale
* ConveyancingCase
* SalesCommission

## Workflow

Lead
Viewing
Reservation
Solicitor instructed
Mortgage progress
Exchange
Completion
Keys handed over

## Frontend Pages

Create:

* Sales dashboard
* Leads
* Reservations
* Sales pipeline
* Conveyancing tracker
* Completion list

---

# 19. Rental Management Module

## Business Purpose

This module manages retained rental properties.

## Backend Entities

Create:

* Tenant
* Tenancy
* RentPayment
* MaintenanceRequest
* RentalInspection

## Frontend Pages

Create:

* Rental dashboard
* Tenant list
* Lease register
* Rent collection
* Maintenance
* Inspections

---

# 20. Defects & Warranty Module

## Business Purpose

This module manages post-completion defects.

## Backend Entities

Create:

* Defect
* WarrantyClaim
* ContractorAssignment
* ResolutionRecord

## Frontend Pages

Create:

* Defects dashboard
* Defect list
* Warranty claims
* Contractor resolution tracker

---

# 21. Reports & Analytics

## Business Purpose

This module gives operational and executive insight.

## Required Reports

Create reports for:

* Portfolio performance
* Project profitability
* Land pipeline
* Planning status
* Construction progress
* Sales revenue
* Rental income
* Investor returns
* Compliance issues
* Risk register

## Frontend Pages

Create:

* Executive dashboard
* Financial reports
* Operational reports
* Custom report placeholder

---

# 22. Help Centre & User Bible

## Business Purpose

The application must teach users how to use it.

## Required Features

Create:

* Help Centre
* User Bible
* Module guides
* Workflow guides
* FAQs
* Glossary
* Release notes
* Training centre

Every module must have help content.

Every page should link to relevant help.

---

# 23. Testing Requirements

Every implemented module must include:

* Command handler tests
* Query handler tests where useful
* Validator tests
* State transition tests
* Angular component tests
* NgRx reducer tests
* NgRx selector tests
* NgRx effects tests where appropriate

Use AAA pattern.

Test naming:

MethodName_Scenario_ExpectedResult

---

# 24. Definition of Done

A module is complete only when:

* Backend builds
* Frontend builds
* Tests pass
* APIs exist
* Validators exist
* Authorization exists
* Audit trail exists
* Angular routes exist
* NgRx state exists
* Forms exist
* Validation messages exist
* Empty states exist
* Toasts exist
* Help articles exist
* Documentation updated
* Implementation log updated

Never mark incomplete functionality as complete.

---

# 25. Final Principle

Build this system like a real corporate product.

Every module must be:

* Useful
* Understandable
* Secure
* Auditable
* Testable
* Maintainable
* Scalable
* Documented
* Easy to navigate

The finished application should clearly demonstrate enterprise platform development, solution architecture, full-stack engineering, and product thinking.
