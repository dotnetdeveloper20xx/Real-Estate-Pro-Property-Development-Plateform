# Legal & Compliance Module — Workflow Guide

## Legal Case Lifecycle

```
Open ──→ In Progress ──→ Under Review ──→ Resolved ──→ Closed
  │          │                │                            ↑
  │          │                │                            │
  │          ↓                ↓                      Reopened
  │       On Hold ←──── Escalated                        │
  │          ↑                ↑                            │
  └──→ On Hold               └──────────────────── In Progress
```

### Valid Transitions (15 total)

| From | To | Conditions |
|------|----|------------|
| Open | In Progress | None |
| Open | On Hold | Hold Reason required (≥10 chars) |
| In Progress | Under Review | None |
| In Progress | On Hold | Hold Reason required (≥10 chars) |
| In Progress | Escalated | Escalation Reason required (≥10 chars) |
| Under Review | Resolved | Resolution Summary (≥20 chars) + Resolution Date required |
| Under Review | Escalated | Escalation Reason required (≥10 chars) |
| Under Review | In Progress | None |
| On Hold | Open | None |
| On Hold | In Progress | None |
| Escalated | In Progress | None |
| Escalated | Under Review | None |
| Resolved | Closed | All linked contracts must be in terminal state |
| Closed | Reopened | None |
| Reopened | In Progress | None |

---

## Contract Lifecycle

```
Draft ──→ Under Review ──→ Approved ──→ Awaiting Signature ──→ Executed ──→ Active
  │            │                                                               │
  └→ Cancelled ←──────────── Awaiting Signature                              │
                                                                    ┌─────────┼─────────┐
                                                                    ↓         ↓         ↓
                                                               Completed  Terminated  Expired
                                                                    │         │         │
                                                                    ↓         ↓         ↓
                                                                  Closed    Closed  Renewed/Closed
```

### Valid Transitions (21 total)

| From | To | Conditions |
|------|----|------------|
| Draft | Under Review | Finance Director role required if value > £50,000 |
| Draft | Cancelled | None |
| Under Review | Approved | None |
| Under Review | Rejected | None |
| Under Review | Draft | None (return for changes) |
| Approved | Awaiting Signature | None |
| Awaiting Signature | Executed | Execution Date + Signatory Names (≥5 chars) required |
| Awaiting Signature | Cancelled | None |
| Executed | Active | None |
| Active | Completed | None |
| Active | Terminated | Termination Reason (≥20 chars) + Termination Date required |
| Active | Expired | None |
| Active | Under Dispute | None |
| Under Dispute | Active | None |
| Under Dispute | Terminated | Termination Reason + Termination Date required |
| Terminated | Closed | None |
| Completed | Closed | None |
| Expired | Renewed | None |
| Expired | Closed | None |
| Renewed | Active | None |
| Cancelled | Closed | None |

---

## Insurance Lifecycle

```
Active ──→ Expiring Soon ──→ Expired ──→ Renewed ──→ Active (new policy)
  │              │                           ↑
  └→ Cancelled   └→ Renewed ─────────────────┘
       │              └→ Cancelled
       ↓
     Closed
```

### Valid Transitions (8 total)

| From | To | Trigger |
|------|----|---------|
| Active | Expiring Soon | Automatic (≤30 days to expiry) |
| Active | Cancelled | Manual |
| Expiring Soon | Renewed | Manual (Renew action) |
| Expiring Soon | Expired | Automatic (past expiry date) |
| Expiring Soon | Cancelled | Manual |
| Expired | Renewed | Manual (Renew action) |
| Renewed | Active | Automatic (new policy created) |
| Cancelled | Closed | Manual |

---

## Audit Record Lifecycle

```
Planned ──→ In Progress ──→ Findings Recorded ──→ Actions Required ──→ Remediation In Progress ──→ Verified ──→ Closed
                                      │
                                      └──→ Closed (if no actions needed)
```

### Valid Transitions (7 total)

| From | To | Conditions |
|------|----|------------|
| Planned | In Progress | None |
| In Progress | Findings Recorded | Findings (≥20 chars) + Risk Rating required |
| Findings Recorded | Actions Required | Recommendations (≥20 chars) + Action Due Date (future) required |
| Findings Recorded | Closed | None (no actions needed) |
| Actions Required | Remediation In Progress | None |
| Remediation In Progress | Verified | None |
| Verified | Closed | None |

---

## Compliance Check Workflow

```
1. Requirement defined (Status: Active)
2. NextDueDate calculated based on Frequency
3. Check performed → Outcome recorded
4. NextDueDate recalculated:
   - Daily: +1 day
   - Weekly: +7 days
   - Monthly: +1 month
   - Quarterly: +3 months
   - Annually: +1 year
   - One-Off/Ongoing: null (no recurrence)
5. If Non-Compliant → Remediation Plan + Due Date required
6. Notifications sent for Non-Compliant outcomes
7. Background service checks for overdue requirements daily
```

---

## Notification Workflow

| Event | Recipients | Priority |
|-------|-----------|----------|
| Case escalated | Finance Director, Legal Officer | High |
| Contract executed/terminated | Legal Officer, Acquisition Manager | Medium |
| Insurance expiring (30 days) | Legal Officer | High |
| Insurance expired | Legal Officer, Finance Director | Critical |
| Compliance check non-compliant | Legal Officer, Finance Director | High |
| Compliance requirement overdue | Responsible Role | High |
| Audit action overdue | Legal Officer | High |
| Document retention expiring | Legal Officer | Medium |
