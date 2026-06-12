# Legal & Compliance Module — Frequently Asked Questions

## General

**Q: What is the Legal & Compliance Module?**
A: It's the system that manages all legal matters, contracts, compliance obligations, insurance policies, audit records, and legal documents for BuildEstate Pro property development projects.

**Q: Who should use this module?**
A: Primarily the Legal & Compliance Officer. Finance Directors use it for contract approvals. Acquisition Managers use it to monitor legal status of their opportunities. Admin/Support staff handle data entry and document uploads.

**Q: How does this module connect to other modules?**
A: Legal cases link to Land Opportunities (via OpportunityId) and Planning Applications (via PlanningApplicationId). Summary endpoints allow other modules to check legal status without accessing full case details.

---

## Legal Cases

**Q: Why can't I close a legal case?**
A: All linked contracts must be in a terminal state (Completed, Terminated, Expired, Cancelled, or Closed) before a case can be closed. Check the Contracts tab on the case detail page.

**Q: What happens when I escalate a case?**
A: The Finance Director and Legal Compliance Officer both receive a notification. An escalation reason is required (minimum 10 characters).

**Q: Can I reopen a closed case?**
A: Yes. Closed cases can transition to Reopened, which then moves to In Progress.

**Q: What does the case reference format mean?**
A: LC-YYYY-NNNNN where YYYY is the year and NNNNN is a sequential number. Example: LC-2026-00042 is the 42nd case created in 2026.

---

## Contracts

**Q: Why does my contract need Finance Director approval?**
A: Contracts with a value exceeding £50,000 (configurable threshold) require Finance Director approval when moving from Draft to Under Review. This is a governance control.

**Q: What's the difference between the contract list and the register?**
A: They show the same data but the register is formatted for formal reporting — a paginated table view optimised for printing and export.

**Q: Can I change the contract value after creation?**
A: Yes, use the Edit function. However, if the new value exceeds the threshold, the approval requirement will apply on the next status transition.

---

## Compliance

**Q: What do the checklist colours mean?**
A: 🟢 Green = Compliant (check passed, next not yet due). 🟡 Amber = Due Soon (next check due within 7 days). 🔴 Red = Overdue or Non-Compliant (action needed). ⚪ Grey = No checks recorded yet.

**Q: How is the NextDueDate calculated?**
A: It's the date of the last check plus the frequency interval. Daily adds 1 day, Weekly adds 7 days, Monthly adds 1 month, Quarterly adds 3 months, Annually adds 1 year. One-Off and Ongoing requirements don't have a recurring due date.

**Q: What happens when a requirement becomes overdue?**
A: A notification is sent to the user in the responsible role. The checklist indicator turns red. The compliance rate on the dashboard decreases.

**Q: Can I retire a compliance requirement?**
A: Yes. You can mark it as Superseded (replaced by a newer requirement) or Retired (no longer applicable). A reason of at least 10 characters is required.

---

## Insurance

**Q: How does the system know when a policy is expiring?**
A: A background service runs daily, checking all Active policies. Those within 30 days of expiry are automatically transitioned to "Expiring Soon" with a notification sent.

**Q: What happens when I renew a policy?**
A: A new insurance record is created with a link to the previous policy (PreviousPolicyId). The system carries forward: Policy Number, Insurer, Coverage Type, and any linked Opportunity/Legal Case. The old policy transitions to "Renewed" status.

**Q: Why can't I use the same policy number?**
A: Policy numbers must be unique among active policies. If you've renewed a policy, the old one is no longer Active, so the number becomes available for the new policy.

---

## Audit Records

**Q: What's the difference between audit types?**
A: Internal = conducted by your own team. External = independent third-party auditor. Regulatory = mandated by a regulatory body (e.g., FCA, HSE). Spot Check = unplanned compliance verification.

**Q: What happens when an audit action is overdue?**
A: The system marks the record as Overdue (IsOverdue = true), publishes an AuditActionOverdueEvent, and sends a notification to the Legal Compliance Officer.

**Q: Can I close an audit without recording findings?**
A: No. You must transition through Findings Recorded first. From there, you can go directly to Closed (if no actions needed) or to Actions Required (if remediation is needed).

---

## Documents

**Q: What file types can I upload?**
A: PDF, DOCX (Word), XLSX (Excel), PNG, JPG, and TIFF. Maximum file size is 50MB.

**Q: What are confidentiality levels?**
A: Public (anyone), Internal (legal roles), Confidential (legal roles), and Restricted (Legal Compliance Officers only). Documents marked Restricted are hidden from other roles.

**Q: Can I delete a document?**
A: Only Legal Compliance Officers can delete documents. Deletion is a soft-delete — the document is hidden but retained in the database for audit compliance. The deletion is logged in the audit trail.

**Q: How does versioning work?**
A: When you upload a new version, the system creates a new document record with Version = previous + 1. The original version is preserved. Both versions remain accessible.

---

## Dashboard

**Q: What is the Compliance Rate?**
A: The percentage of compliance checks with a "Compliant" outcome out of all checks recorded in the current reporting period (calendar year).

**Q: What does Average Resolution Time measure?**
A: The average number of days from case creation (CreatedAt) to resolution (ResolutionDate) for cases that are Resolved or Closed.

**Q: Who can see the dashboard?**
A: Only Legal Compliance Officers. Other roles access their relevant data through the list and detail views.

---

## Audit Trail

**Q: Can audit trail entries be modified or deleted?**
A: No. The audit trail is immutable (append-only). Any attempt to modify or delete audit entries is rejected by the system.

**Q: How do I export audit data for a compliance review?**
A: Navigate to the Audit Trail page, set your date range and optional entity type filter, then click Export CSV. The file downloads immediately.

**Q: What is the Correlation ID?**
A: A unique identifier that links all audit entries created by a single HTTP request. It enables end-to-end request tracing for investigation purposes.
