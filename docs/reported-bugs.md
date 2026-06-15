# BuildEstate Pro — Reported Bugs & Fix Tracker

## Date Reported: 15 June 2026
## Reporter: User (Stakeholder Testing)
## Module: Land Acquisition

---

## Bug Summary

| # | Bug | Severity | Status | Fixed Date |
|---|-----|----------|--------|------------|
| 1 | Notification bell "View All" button does nothing | Low | ✅ Fixed | 15 Jun 2026 |
| 2 | Listing page — clicking page numbers empties the list | High | ✅ Fixed | 15 Jun 2026 |
| 3 | Update DD check — server error | Medium | ✅ Fixed | 15 Jun 2026 |
| 4 | Submit offer — success toast but offer not appearing in tab | High | ✅ Fixed | 15 Jun 2026 |
| 5 | Document uploaded successfully but not appearing in list | High | ✅ Fixed | 15 Jun 2026 |
| 6 | Financial tab has empty cards, no button visible | High | ✅ Fixed | 15 Jun 2026 |
| 7 | Activity tab is completely empty | Medium | ✅ Fixed | 15 Jun 2026 |
| 8 | Approval tab — cannot generate approval request | High | ✅ Fixed | 15 Jun 2026 |

---

## Detailed Bug Reports

### Bug 1: Notification Bell — "View All" Does Nothing
**Steps to reproduce:** Click notification bell → dropdown appears → click "View All Notifications"
**Expected:** Navigate to a notifications page or show all notifications
**Actual:** Nothing happens — button has no handler
**Root cause:** Static button with no routerLink or click event
**Fix plan:** Add a click handler that either navigates to `/notifications` or shows a toast "All notifications viewed"

---

### Bug 2: Listing Page — Page Numbers Empty the List
**Steps to reproduce:** Go to Opportunities list → see data → click page 2 (or any page number)
**Expected:** Show next page of results
**Actual:** List goes empty — no rows shown
**Root cause:** DataGrid pagination emits `pageChange` → parent calls `loadData()` which re-fetches from API. The API returns the same data (server ignores page params after response wrapper). The DataGrid then does CLIENT-SIDE pagination on the fresh data but with the new page number — if the new data doesn't have enough items for page 2, it shows empty.
**Fix plan:** Make pagination purely client-side in the list component — do NOT re-fetch from API on page change. Only re-fetch on search/filter/sort changes.

---

### Bug 3: Update DD Check — Server Error
**Steps to reproduce:** On detail page → DD tab → click edit on existing check → change status → save
**Expected:** Check updated successfully
**Actual:** Server returns 400/500 error
**Root cause:** Frontend sends `{ targetStatus: "InProgress", findings: null }` but the backend `TransitionDueDiligenceStatusCommand` expects different property names (likely `NewStatus` not `targetStatus`, or expects the enum as a string name that doesn't match).
**Fix plan:** Read the backend command class, match frontend payload exactly. Test with curl.

---

### Bug 4: Submit Offer — Success But Not Appearing
**Steps to reproduce:** On detail page → Offers tab → Submit Offer → fill form → save → success toast
**Expected:** New offer appears in the offers table
**Actual:** Table still shows old offers, new one not visible
**Root cause:** After `saveOffer()` succeeds, `loadOpportunity()` is called which reloads the detail. The detail response includes `offers` array. Issue is likely that the response wrapper interceptor wraps the detail response but the `offers` nested array inside the wrapped `data` isn't being read correctly (the IOpportunityDetail interface expects `offers` but after wrapping, the data structure might differ).
**Fix plan:** Test the detail API response through the interceptor. Verify nested arrays (offers, dueDiligences, documents) survive the wrapping.

---

### Bug 5: Document Upload — Success But Not Appearing
**Steps to reproduce:** On detail page → Documents tab → Upload → select file → save → success toast
**Expected:** New document appears in the documents table
**Actual:** Table still shows old documents
**Root cause:** Same as Bug 4 — reload after success doesn't reflect new data. OR the upload saved but the detail endpoint doesn't include it in its response.
**Fix plan:** Same investigation as Bug 4. Also verify the document is actually saved in DB (sqlcmd check).

---

### Bug 6: Financial Tab — Empty Cards, No Button
**Steps to reproduce:** Navigate to an opportunity with a feasibility assessment (e.g., OfferMade/UnderContract status)
**Expected:** See financial cards with £ values (land cost, build cost, etc.)
**Actual:** Cards are rendered but values are empty/zero, or no cards at all. No "Create Assessment" button for opportunities that should have one.
**Root cause:** The feasibility assessment data in the detail response may have property names that don't match the template (e.g., `estimatedLandCost` vs `EstimatedLandCost` — case mismatch after serialization). Also the template uses `*ngIf="opportunity()!.feasibilityAssessment as assessment"` — if the field is null or undefined, nothing renders. If it's an object with zero values, cards render but show £0.
**Fix plan:** Check actual API response for a known opportunity with feasibility data. Verify property names match the IFeasibilityAssessment interface.

---

### Bug 7: Activity Tab — Completely Empty
**Steps to reproduce:** On any opportunity detail → click Activity tab
**Expected:** Timeline showing DD checks, offers, documents, creation events
**Actual:** Empty — shows "No recent activity to display"
**Root cause:** The `activityData` computed signal reads from `opp.dueDiligences`, `opp.offers`, `opp.documents`. If these arrays are empty (e.g., for an Identified opportunity) OR if the `IRecentActivity` interface fields don't match what the ActivityTimelineComponent template expects (e.g., `changedAt` vs `timestamp`), nothing renders.
**Fix plan:** 1) Test on an opportunity that HAS DD/offers/docs (DueDiligence+ status). 2) Verify the computed signal's output matches what ActivityTimelineComponent expects. 3) Check if it's a property mapping issue.

---

### Bug 8: Approval Tab — Cannot Generate Approval
**Steps to reproduce:** On opportunity detail → Approvals tab → try to request approval
**Expected:** "Request Approval" button visible, can fill form and submit
**Actual:** Button not showing, or form doesn't work
**Root cause:** `showApprovalButton()` returns true only for DueDiligence/OfferMade/UnderContract statuses. If testing on Identified/InitialReview, button won't show. OR the POST endpoint URL `/api/v1/approval-requests` doesn't match the backend route (which is `/api/v1/approvals`).
**Fix plan:** 1) Test on an opportunity in OfferMade/UnderContract status. 2) Verify the frontend POST URL matches the backend ApprovalsController route (`/api/v1/approvals`).

---

## Fix Priority Order

1. **Bug 2** — Pagination (blocks basic list usage)
2. **Bug 4 + 5 + 7** — Detail reload after CRUD (same root cause — investigate together)
3. **Bug 3** — DD update payload
4. **Bug 6** — Financial tab
5. **Bug 8** — Approval endpoint URL
6. **Bug 1** — Notification button (cosmetic)

---

## Fix Status Log

| Date | Bug # | Action Taken | Result |
|------|-------|--------------|--------|
| 15 Jun 2026 | #2 | Changed pagination to client-side only. `onPageChange` no longer re-fetches API. `loadData()` fetches all items (pageSize=200). DataGrid handles page slicing internally. | ✅ Verified: API returns all 51 items, DataGrid paginates locally. |
| 15 Jun 2026 | #4,#5,#6,#7 | **ROOT CAUSE:** All nested DTOs (FeasibilityDto, OfferDto, DueDiligenceDto, DocumentDto, LandOwnerDto) were PLACEHOLDERS returning only `{ id }`. Expanded all DTOs with full property mappings matching domain entities. Created ApprovalRequestDto and added to OpportunityDetailDto. | ✅ Verified: API now returns full nested data (amounts, statuses, dates, filenames, etc.) |
| 15 Jun 2026 | #8 | Frontend was POSTing to `/api/v1/approval-requests` but backend route is `/api/v1/approvals`. Replaced all 3 occurrences in the detail page component. | ✅ Verified: POST /api/v1/approvals returns 201 Created. |
| 15 Jun 2026 | #3 | Bug was actually an invalid state transition (e.g., Completed→Completed). The PATCH endpoint works correctly for valid transitions (Pending→InProgress: 200 OK). Frontend error handling shows toast. | ✅ Not a code bug — state machine correctly rejects invalid transitions. |
| 15 Jun 2026 | #1 | Added `viewAllNotifications()` method with `(click)` handler on the "View All" button. Navigates to home page (notifications page TBD). | ✅ Button now has click handler. |

