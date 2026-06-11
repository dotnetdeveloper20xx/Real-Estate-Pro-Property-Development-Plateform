# 07 — Testing (How We Verify Everything Works)

## What This Section Covers

Testing isn't optional — it's how we prove the system works correctly. We've written two types of tests: property-based tests (which generate random scenarios and verify rules hold universally) and integration tests (which test the full stack from HTTP request to database and back).

## Property-Based Tests — The Smart Approach

Normal tests check one specific case: "if I pass amount = 500, does it work?" Property-based tests are cleverer. They say: "for ANY amount, does the system behave correctly?" They generate hundreds of random inputs and verify the rules hold every time.

We use a minimum of 100 random iterations per property. Here's what we test:

### Property 1: Opportunity State Machine Correctness

"For ANY pair of statuses, the system only allows transitions that are in the official transition list. Everything else is blocked."

What this catches: If someone accidentally adds a shortcut transition in the code (like Identified → Acquired), this test will catch it because that pair isn't in the approved list.

### Property 2: Due Diligence State Machine Correctness

Same principle for DD checks. Only Pending→InProgress and InProgress→Completed/Failed are allowed.

### Property 3: Offer State Machine Correctness

Same for offers. Only the defined transitions are permitted.

### Property 4: Contract State Machine Correctness

Same for contracts. Draft→UnderLegalReview→Approved/Rejected, etc.

### Property 5: Due Diligence Completion Gate

"For ANY combination of DD check completions, the system only allows transition to Offer Made if Legal, Environmental, AND Planning are ALL Completed."

What this catches: Edge cases like "what if Legal and Environmental are Completed but Planning is still In Progress?" — this test verifies it's blocked.

### Property 6: ROI Calculation Correctness

"For ANY set of non-negative cost/revenue numbers, the calculated TotalCosts, EstimatedProfit, and ROI match the formula exactly."

The formula: ROI = ((Revenue - TotalCosts) / TotalCosts) × 100

What this catches: Rounding errors, division by zero if all costs are zero, overflow issues with very large numbers.

### Property 7: Input Validation Correctness

"For ANY random input, the validator correctly rejects invalid inputs and accepts valid ones."

Tests boundary conditions: What about a name with exactly 3 characters? Exactly 200? 201? An amount of 0? Of -1? A date in the past?

### Properties 8 & 9: Cascade Behaviour

"Accepted offer always cascades to Under Contract" and "Registered acquisition always cascades to Acquired."

### Property 10: RBAC Enforcement

"For ANY random (role, operation) pair, the access decision matches our permission matrix."

This generates every possible combination of role and operation and verifies:
- Acquisition Managers CAN create opportunities
- Legal Officers CANNOT create opportunities
- Finance Directors CAN approve
- Everyone CAN read

### Property 11: Dashboard Metrics Correctness

"For ANY random dataset of opportunities and DD checks, the dashboard calculations are correct."

### Properties 12-16: Pagination, Filtering, Sorting, Soft-Delete, Search

These verify that:
- Pagination math is correct (right items on right pages)
- Filters correctly include/exclude records
- Sort order is consistent
- Deleted records never appear in results
- Search terms match the right fields

### Properties 17-21: Approval Blocking, Threshold Triggers, Audit Immutability, One Acquisition, Duplicate Detection

More business rule verification through random scenario generation.

## Integration Tests — The Full Stack Approach

These tests start the actual web application, make real HTTP requests, and check the full pipeline works. They use an in-memory database (fast, isolated) and a fake authentication system (so we can test as different roles).

### Test 1: Full Lifecycle

The big one. Creates an opportunity and walks it through the ENTIRE pipeline:
1. Create → status is "Identified"
2. Transition to InitialReview
3. Transition to DueDiligence
4. Create 3 DD checks (Legal, Environmental, Planning)
5. Complete all 3 DD checks
6. Transition to OfferMade
7. Create an offer
8. Accept the offer (auto-transitions to UnderContract)
9. Verify opportunity is now "UnderContract"
10. Create a contract
11. Progress contract through all statuses
12. Create acquisition record
13. Register acquisition (auto-transitions to Acquired)
14. Verify opportunity is now "Acquired"

If any step fails, the test fails — proving the full workflow works end-to-end.

### Test 2: RBAC (Role-Based Access)

- Calls create opportunity with the LegalComplianceOfficer role → expects 403 Forbidden
- Calls create opportunity with no auth at all → expects 401 Unauthorized
- Calls create opportunity with AcquisitionManager role → expects 201 Created

### Test 3: Concurrency

Tests what happens when two people try to edit the same opportunity at the same time (using the RowVersion field for conflict detection).

### Test 4: Audit Trail

Creates an opportunity, then queries the audit log directly to verify:
- An audit entry exists for the "Create" action
- It records the entity name, entity ID, user, timestamp, and the new values

## Why This Testing Strategy Matters

- **Property-based tests** catch edge cases that humans would never think to test manually
- **Integration tests** prove the whole system works together (not just isolated units)
- Together, they give us confidence that:
  - The business rules are correctly implemented
  - The API behaves correctly for different roles
  - The database records what it should
  - The full lifecycle works from start to finish

## Questions to Ask the Developer

- "Run the test suite — do they all pass?"
- "Show me the full lifecycle integration test running — how long does it take?"
- "What happens if a property test finds a failing case — show me what that looks like"
- "How many total test iterations run when we execute the full suite?"
- "If I change a business rule (like the DD gate), which tests would catch it?"
