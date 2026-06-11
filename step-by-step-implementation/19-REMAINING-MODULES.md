# Phase 19: Modules 7-14 — Overview & Implementation Notes

## The Pattern Is Established

By now you've built 6 modules using the same recipe. Modules 7-14 follow identical patterns with different entities and business rules. This document provides the specification for each.

---

## Module 7: Procurement & Materials

**Purpose:** Manage purchase orders for construction materials and track deliveries.

**Entities:**
- `PurchaseOrder` — ProjectId, SupplierId, Items, TotalAmount, OrderDate, DeliveryDate, Status
- `Delivery` — OrderId, ReceivedDate, ReceivedBy, Condition, Discrepancies

**Status:** Draft → Submitted → Approved → Ordered → PartiallyDelivered → Delivered → Closed

**Key Routes:** `/procurement`, `/procurement/new`, `/procurement/:id`, `/procurement/:id/edit`

**Business Rules:**
- Orders must be approved before being sent to supplier
- Delivery received quantity cannot exceed ordered quantity
- Damaged/missing items create discrepancy records
- Budget impact calculated from order totals

---

## Module 8: Contractors & Suppliers

**Purpose:** Maintain a database of contractors with qualifications, performance tracking, and payment history.

**Entities:**
- `Contractor` — Name, TradeName, ContactPerson, Phone, Email, Type, Certifications, Rating, Status

**Status:** Prospect → PreQualified → Approved → Active → Suspended → Blacklisted

**Key Routes:** `/contractors`, `/contractors/new`, `/contractors/:id`, `/contractors/:id/edit`

**Business Rules:**
- Must have valid insurance before Active status
- Certifications have expiry dates (flag when approaching)
- Performance rating calculated from inspection results and snag resolution
- Cannot assign work to Suspended/Blacklisted contractors

---

## Module 9: Property Units

**Purpose:** Manage individual apartments, houses, or commercial units within a development.

**Entities:**
- `PropertyUnit` — ProjectId, BlockName, Floor, UnitNumber, Type, Bedrooms, Bathrooms, SquareFootage, Price, Status

**Status:** Planned → UnderConstruction → Available → Reserved → Sold → HandedOver → Rented

**Key Routes:** `/units`, `/units/new`, `/units/:id`, `/units/:id/edit`

**Business Rules:**
- Unit number must be unique within a project
- Price must be positive
- Cannot change status to Sold without a linked SalesLead
- Cannot rent a unit that's already sold
- Reserved units have a reservation expiry (auto-release if not progressed)

---

## Module 10: Sales & Conveyancing

**Purpose:** Manage the sales pipeline from lead capture through to legal completion.

**Entities:**
- `SalesLead` — UnitId, BuyerName, BuyerEmail, BuyerPhone, Source, InterestedUnit, ReservationDate, Status

**Status:** New → Contacted → Viewing → Offer → Reserved → ExchangeProgress → Completed → Withdrawn

**Key Routes:** `/sales`, `/sales/new`, `/sales/:id`, `/sales/:id/edit`

**Business Rules:**
- Lead must reference a valid available unit
- Only one active reservation per unit
- Reservation creates hold on unit (changes unit status to Reserved)
- Withdrawn/lost leads release the unit back to Available
- Sales commission calculated as percentage of sale price

---

## Module 11: Rental Management

**Purpose:** Manage retained rental properties — tenants, leases, rent collection, maintenance.

**Entities:**
- `Tenancy` — UnitId, TenantName, TenantEmail, TenantPhone, StartDate, EndDate, MonthlyRent, Deposit, Status

**Status:** Pending → Active → InArrears → NoticeGiven → Ended → Evicted

**Key Routes:** `/rentals`, `/rentals/new`, `/rentals/:id`, `/rentals/:id/edit`

**Business Rules:**
- Unit must be in Rented status
- End date must be after start date
- Rent amount must be positive
- Deposit typically 1 month's rent (validate >= 0)
- Arrears flagged if payment overdue > 14 days
- Ended tenancy releases unit back to Available

---

## Module 12: Defects & Warranty

**Purpose:** Track post-completion defects reported by buyers/tenants and manage warranty claims.

**Entities:**
- `Defect` — UnitId, ReportedBy, Description, Location, Priority, AssignedContractor, Status

**Status:** Reported → Acknowledged → Assigned → InProgress → Resolved → Verified → Closed

**Key Routes:** `/defects`, `/defects/new`, `/defects/:id`, `/defects/:id/edit`

**Business Rules:**
- Must reference a specific unit
- Priority levels: Low, Medium, High, Critical
- Critical defects must be acknowledged within 24 hours (SLA)
- Resolution must include description of work done
- Warranty period typically 2 years from handover
- Out-of-warranty defects flagged differently

---

## Module 13: Documents & Knowledge

**Purpose:** Central document repository with version control, categorisation, and search.

**Entities:**
- `KnowledgeDocument` — Title, Category, Description, Version, FileName, FilePath, Tags, UploadedBy, Status

**Categories:** Contract, Drawing, Report, Certificate, Correspondence, Legal, Financial, Planning, Construction

**Key Routes:** `/documents`, `/documents/new`, `/documents/:id`

**Business Rules:**
- File types restricted (PDF, DOCX, XLSX, PNG, JPG, DWG)
- Maximum file size: 25MB
- Version control: uploading new version increments version number
- Documents can be linked to any entity (polymorphic reference)
- Access control based on document category and user role

---

## Module 14: Reports & Dashboards

**Purpose:** Executive-level reporting and custom report generation.

**Entities:**
- `SavedReport` — Name, Type, Description, Filters (JSON), CreatedBy, Schedule

**Report Types:** Financial, Operational, Pipeline, Portfolio, Custom

**Key Routes:** `/reports`, `/reports/new`, `/reports/:id`

**Standard Reports (Pre-Built):**
1. Portfolio Performance Summary
2. Project Profitability Report
3. Land Pipeline Report
4. Construction Progress Report
5. Sales Revenue Report
6. Budget Variance Report
7. Risk Register Summary
8. Compliance Status Report

**Business Rules:**
- Reports pull live data from across all modules
- Filters allow date range, project, status selection
- Export to PDF and Excel
- Scheduled reports (future: email delivery)

---

## Implementation Priority

Build in this order (matches dependencies):

```
Module 7:  Procurement      (needs: Projects, Contractors)
Module 8:  Contractors      (standalone)
Module 9:  Units            (needs: Projects)
Module 10: Sales            (needs: Units)
Module 11: Rentals          (needs: Units)
Module 12: Defects          (needs: Units, Contractors)
Module 13: Documents        (standalone, enhances all modules)
Module 14: Reports          (needs: all other modules for data)
```

---

## For Each Module, Remember:

1. Follow the 10-step recipe (Phase 12)
2. Run quality gates (Phase 23)
3. Seed demo data (5+ records)
4. Write unit tests for handlers and validators
5. Ensure frontend matches backend DTOs exactly
6. Add help article to Help Centre
7. Update dashboard with relevant KPIs

---

*Every module is the same pattern. Different data, same recipe.*
