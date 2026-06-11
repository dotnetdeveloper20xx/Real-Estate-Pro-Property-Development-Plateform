# 09 — Sign-Off Checklist

## How to Use This

Go through each item. Ask the developer to demonstrate it. Mark it off. If something doesn't work, flag it for fixing before approving the module.

---

## Data & Structure

- [ ] All 10 database tables exist and are configured correctly
- [ ] Soft-delete is working (deleted records are hidden but recoverable)
- [ ] Row version concurrency is configured on all entities
- [ ] The database migration applies cleanly
- [ ] All indexes are in place for performance

## Business Rules — State Machines

- [ ] Opportunity can ONLY move through valid transitions (test an invalid one — expect rejection)
- [ ] Due Diligence checks follow their state machine
- [ ] Offers follow their state machine
- [ ] Contracts follow their state machine

## Business Rules — Gates & Triggers

- [ ] Cannot move to "Offer Made" without completing Legal, Environmental, and Planning DD checks
- [ ] Creating an offer ≥ £500,000 auto-creates an approval request
- [ ] While approval is pending, opportunity cannot progress
- [ ] Accepting an offer auto-transitions opportunity to "Under Contract"
- [ ] Registering an acquisition auto-transitions opportunity to "Acquired"
- [ ] Withdrawal requires a reason (minimum 10 characters)
- [ ] Cannot create duplicate opportunity (same name + location)
- [ ] Only one acquisition record per opportunity

## Role-Based Access Control

- [ ] Acquisition Manager can create/edit/delete opportunities and offers
- [ ] Legal Officer can create/manage DD checks and contracts
- [ ] Valuation Analyst can create feasibility assessments
- [ ] Finance Director can approve/reject approval requests
- [ ] Admin/Support can do all write operations
- [ ] All roles can READ all data
- [ ] Unauthenticated requests get 401
- [ ] Unauthorized role requests get 403
- [ ] Only Admin can delete documents

## API Endpoints

- [ ] All 30+ endpoints respond correctly
- [ ] Validation errors return clear messages with 400 status
- [ ] Not-found returns 404
- [ ] Swagger documentation is accessible and accurate

## Frontend Pages

- [ ] Dashboard loads with KPI cards, pipeline summary, activity, alerts
- [ ] Pipeline page shows 7 columns with opportunity cards
- [ ] Clicking a card navigates to the detail page
- [ ] Detail page shows all tabs with correct data
- [ ] Create form validates all fields inline
- [ ] Edit form pre-populates and validates
- [ ] Unsaved changes guard works on create/edit pages
- [ ] Skeleton loading states appear during data fetching
- [ ] Error states with retry buttons work
- [ ] Empty states show helpful guidance messages

## Background Services & Automation

- [ ] Offer expiry service runs periodically
- [ ] Expired offers get Expired status and notification is sent
- [ ] Approval threshold trigger fires on creation of large offers
- [ ] Finance Director notification is sent for new approval requests

## Notifications

- [ ] Opportunity acquired → notifies all roles
- [ ] Offer expired → notifies the Acquisition Manager
- [ ] DD failed → notifies the Acquisition Manager
- [ ] Approval created → notifies Finance Director
- [ ] All notifications are persisted in database

## Audit Trail

- [ ] Every create operation generates an audit entry
- [ ] Every update operation records old values and new values
- [ ] Every delete operation is logged
- [ ] Audit log includes user, timestamp, action, entity, IP, correlation ID
- [ ] Audit log cannot be modified or deleted (append-only)

## Testing

- [ ] All property-based tests pass (100+ iterations each)
- [ ] All integration tests pass
- [ ] Full lifecycle integration test completes successfully
- [ ] RBAC integration tests confirm 401/403/201 responses

## Code Quality

- [ ] Solution builds with 0 errors and 0 warnings
- [ ] No hardcoded values (thresholds are in configuration)
- [ ] Consistent naming conventions throughout
- [ ] All code follows the established project architecture

---

## Final Approval

| Area | Status | Notes |
|------|--------|-------|
| Data Foundations | ☐ Approved / ☐ Needs Work | |
| Business Rules | ☐ Approved / ☐ Needs Work | |
| RBAC | ☐ Approved / ☐ Needs Work | |
| API Layer | ☐ Approved / ☐ Needs Work | |
| Frontend | ☐ Approved / ☐ Needs Work | |
| Testing | ☐ Approved / ☐ Needs Work | |
| Integration | ☐ Approved / ☐ Needs Work | |
| Audit & Compliance | ☐ Approved / ☐ Needs Work | |

**Module Status:** ☐ APPROVED / ☐ APPROVED WITH CONDITIONS / ☐ REQUIRES REWORK

**Reviewed by:** ______________________ **Date:** __________

**Notes:**

---
---
---
