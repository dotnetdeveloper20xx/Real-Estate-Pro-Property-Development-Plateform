---
inclusion: auto
---

# State Machine Review

## Verification Checklist

For every entity with status transitions, verify:

- Only valid transitions are permitted (no skipping stages)
- No impossible states can be reached
- Visual pipeline/stepper matches backend transition map exactly
- Audit entries are created on every transition
- Notifications are generated on key transitions
- Permissions are enforced (only authorized roles can transition)
- Approvals are enforced where required (pending approval blocks progress)
- Activity timeline is updated
- Dashboard metrics are updated
- Frontend and backend transition maps are identical

## Known State Machines

### Opportunity Status
Identified → InitialReview → DueDiligence → OfferMade → UnderContract → Acquired
(Withdrawn available from any non-terminal status)

### Due Diligence Status
Pending → InProgress → Completed | Failed

### Offer Status
UnderReview → Accepted | Rejected | CounterOffered | Expired
CounterOffered → UnderReview | Accepted | Rejected

### Contract Status
Draft → UnderLegalReview → Approved | Rejected
Approved → Signed → Exchanged → Completed

### Acquisition Status
Completed → Registered

### Approval Status
Pending → Approved | Rejected
