# Planning & Approvals Module — Business Rules

## State Machines

The module implements 4 state machines that enforce valid status transitions. Users cannot skip steps or make invalid transitions.

### 1. Planning Application Status Transitions

```
Pre-Application → Submitted
Submitted → Validated, Withdrawn
Validated → Under Review, Withdrawn
Under Review → Committee Review, Approved, Approved with Conditions, Refused, Withdrawn
Committee Review → Approved, Approved with Conditions, Refused, Withdrawn
Refused → Appeal
Appeal → Approved, Approved with Conditions, Refused
```

**Conditional data requirements:**
- Moving to **Submitted**: requires ApplicationReference (5-50 chars)
- Moving to **Approved/ApprovedWithConditions/Refused**: requires DecisionDate (not in the future)
- Moving to **Withdrawn**: requires WithdrawalReason (10+ chars)

### 2. Condition Status Transitions

```
Outstanding → Submitted for Discharge
Submitted for Discharge → Discharged, Rejected
Rejected → Submitted for Discharge
```

**When discharging:** requires DischargeDate (past/present) and DischargeReference (3-50 chars)

### 3. Appeal Status Transitions

```
Lodged → Under Review
Under Review → Hearing Scheduled, Allowed, Dismissed
Hearing Scheduled → Allowed, Dismissed
Allowed → Closed
Dismissed → Closed
```

**When Allowed/Dismissed:** requires DecisionDate and DecisionSummary (20+ chars)

### 4. Fee Payment Status Transitions

```
Pending → Awaiting Approval, Paid
Awaiting Approval → Approved, Rejected
Approved → Paid
Rejected → Pending
```

**Threshold rule:** Fees above the configured threshold (default £10,000) CANNOT go directly from Pending → Paid. They must go through Awaiting Approval → Approved → Paid.

## Key Business Rules Enforced

| Rule | What Happens |
|------|-------------|
| Only Acquired opportunities can have planning applications | Returns HTTP 400 if opportunity is not Acquired |
| One active application per opportunity | Returns HTTP 409 if active application already exists |
| Conditions only on Approved with Conditions applications | Returns HTTP 400 if parent isn't in the right status |
| Appeals only on Refused applications | Returns HTTP 400 if parent isn't Refused |
| One active appeal per application | Returns HTTP 409 if active appeal already exists |
| Milestone type uniqueness per application | Returns HTTP 409 if duplicate milestone type |
| Fee threshold enforcement | Returns HTTP 400 if trying to skip approval path |
| File size limit (50MB) and type restrictions | Returns HTTP 400 for oversized or invalid files |

## Automatic Cascading Actions

| Trigger | Automatic Effect |
|---------|-----------------|
| Appeal Allowed | Parent application status transitions to Approved or Approved with Conditions |
| All Conditions Discharged | Notification sent to Planning Manager |
| Milestone becomes Overdue | Notification sent to Planning Manager |
| Application reaches decision (Approved/Refused) | Notification sent to Planning Manager and Acquisition Manager |
| Fee exceeds threshold | Notification sent to Finance Director |

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| Planning Manager | Create/update applications, create fees/milestones, view dashboard, full read access |
| Admin Support | Create/update applications, upload/delete documents |
| Legal & Compliance Officer | Create/manage conditions, create/manage appeals |
| Finance Director | Approve fee payments over threshold |
| Acquisition Manager | Read-only access to planning status for their sites |
