# 04 — Backend Operations (What the System Can Do)

## What This Section Covers

This is the meat of the application — the operations that users can perform. Each operation has been built as a separate, focused piece of code that does one thing well. They follow a pattern: receive a request, validate it, execute the business logic, return a result.

## Opportunity Operations

### Creating an Opportunity

When the Acquisition Manager fills in the form and hits "Create":
- The system checks: is the Name between 3-200 characters? Is Location between 3-500 characters? Is Land Size positive?
- It checks: does an opportunity with this same Name + Location already exist?
- If everything's valid: it creates the record, sets status to "Identified", stamps it with the current user and timestamp
- It returns the created record back to the frontend

### Updating an Opportunity

When someone edits an opportunity's basic details:
- Same validation rules apply
- The system uses the RowVersion to check nobody else changed it while you were editing
- Records who updated it and when

### Deleting an Opportunity (Soft Delete)

When someone deletes an opportunity:
- It's NOT actually removed from the database
- Instead, it's marked as IsDeleted = true, with who deleted it and when
- All queries automatically exclude deleted records — they become invisible but recoverable

### Transitioning Status

When someone moves an opportunity to the next stage:
- The state machine checks: is this a valid transition from the current state?
- If moving to Withdrawn: requires a reason (minimum 10 characters)
- Checks for pending approvals (blocks if any exist)
- If moving from Due Diligence to Offer Made: checks the due diligence gate
- Records the change in the audit trail
- Fires a notification event so relevant people are informed

### Searching and Filtering

The list view supports:
- **Pagination** — page 1, page 2, page 3... (doesn't load everything at once)
- **Filtering** — by Status, Location, Source, date range
- **Sorting** — by Name, Created Date, Land Size, Expected Acquisition, Status
- **Free-text search** — type "Manchester" and it searches across Name, Location, and Source

### Getting Full Details

When you click into an opportunity, it loads EVERYTHING related to it in one call: the land owner details, all due diligence checks, all offers, all documents, the contract, the feasibility assessment. All in one efficient database query.

## Land Owner Operations

- **Create** — Link an owner to an opportunity (name, contact details, address, freehold/leasehold)
- **Update** — Change the owner's details
- Both validate: Name 2-200 chars, Contact Details 5-500 chars

## Due Diligence Operations

- **Create** — Start a new check (Legal, Environmental, Planning, Utilities, or Valuation)
- **Transition Status** — Move it from Pending to In Progress, then to Completed or Failed
- **List by Opportunity** — See all checks for a specific opportunity, filterable by type and status
- When a check completes or fails, the Report Date is automatically set to now

## Offer Operations

- **Create** — Submit a new offer (amount, currency, valid until date). The offer date is set automatically to now, status starts as "Under Review"
- **Transition Status** — Accept, Reject, or Counter-Offer. If Counter-Offered, stores the counter amount
- **Acceptance Cascade** — If accepted and the opportunity is in "Offer Made" status, the opportunity automatically moves to "Under Contract"
- **Auto-Approval** — If the offer amount is £500k+, an approval request is automatically created
- **List by Opportunity** — All offers ordered by date (newest first)

## Contract Operations

- **Create** — Can only be created if the opportunity has an accepted offer. Stores solicitor details. Starts in "Draft" status
- **Transition Status** — Move through the legal process. When transitioning to "Exchanged," a deposit amount is required

## Document Operations

- **Upload** — Validates file size (≤25MB), content type (PDF/DOCX/XLSX/PNG/JPG), stores the file, creates the database record
- **Download** — Streams the file back with the correct content type
- **List** — All documents for an opportunity, filterable by type
- **Delete** — Soft deletes the record AND removes the file from storage. Restricted to Admin/Support role only

## Feasibility Operations

- **Create or Update** — Submits the financial numbers. The system automatically calculates Total Costs, Estimated Profit, and ROI Percentage
- **Get** — Retrieve the feasibility assessment for an opportunity
- When marked "ready for review" — automatically notifies the Finance Director

## Acquisition Operations

- **Create** — Records the purchase (price, completion date, registry reference). Only one per opportunity. Must have completed the purchase (date must be today or earlier)
- **Transition to Registered** — When the land registry confirms ownership, this cascades the parent opportunity to "Acquired"

## Approval Operations

- **Create** — Usually auto-triggered when an offer exceeds the threshold
- **Approve or Reject** — Finance Director decides. Approval records the approver, timestamp, and notes. Rejection records the reason and notifies the Acquisition Manager
- **List Pending** — Finance Director can see all approvals awaiting their decision

## Dashboard Operations

- **Get Metrics** — Calculates KPIs: opportunities by status, average acquisition cycle (days), conversion rate (%), due diligence pass rate (%), total evaluated
- **Get Recent Activity** — Last 10 status changes across all opportunities

## Questions to Ask the Developer

- "Walk me through what happens internally when I create an opportunity — every step"
- "What does the system calculate automatically for the feasibility assessment?"
- "Show me the approval auto-trigger — create an offer for £750,000 and show me the approval appearing"
- "What KPIs does the dashboard calculate? Show me the formulas"
- "Can you show me the pagination working — search with 100 records, show me page sizes"
