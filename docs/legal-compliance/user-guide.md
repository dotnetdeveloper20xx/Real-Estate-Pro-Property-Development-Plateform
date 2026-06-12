# Legal & Compliance Module — User Guide

## Getting Started

When you first navigate to the Legal & Compliance module, you'll land on the **Dashboard**. This gives you an instant overview of all legal metrics, compliance status, and items requiring attention.

---

## Managing Legal Cases

### Creating a Legal Case

1. Navigate to **Legal Cases** → Click **Create Case**
2. Fill in the required fields:
   - **Title** — A clear description of the legal matter (5–200 characters)
   - **Description** — Context about the case (10–2000 characters)
   - **Case Type** — Select from: Conveyancing, Dispute, Contract Review, Regulatory, Planning, or General
   - **Priority** — Low, Medium, High, or Critical
   - **Opportunity ID or Planning Application ID** — At least one must be provided to link the case
3. Click **Create Legal Case**
4. The system generates a unique reference (e.g., LC-2026-00001)

### Viewing the Pipeline

The pipeline view shows all cases organised in columns by status. This is like a kanban board:
- Each column represents a status (Open, In Progress, Under Review, etc.)
- Cards show the case title, reference, priority (colour-coded), and days since last change
- Click any card to view the full case detail

### Transitioning Case Status

1. Open a case detail page
2. Click **Change Status**
3. Select the target status from the permitted transitions
4. Some transitions require additional information:
   - **Resolved** → Must provide a Resolution Summary (≥20 characters) and Resolution Date
   - **Escalated** → Must provide an Escalation Reason (≥10 characters)
   - **On Hold** → Must provide a Hold Reason (≥10 characters)
   - **Closed** → All linked contracts must be in a terminal state

---

## Managing Contracts

### Creating a Contract

1. Navigate to **Contracts** → Click **Create Contract** (or create from within a case)
2. Fill in the required fields:
   - **Title** — Descriptive contract name (5–300 characters)
   - **Contract Type** — Land Purchase, Construction, Professional Services, Insurance, Lease, Settlement, or Framework Agreement
   - **Counterparty Name** — The other party (2–200 characters)
   - **Contract Value** — Must be positive. Values over £50,000 require Finance Director approval
   - **Currency** — ISO 4217 code (e.g., GBP, EUR, USD)
   - **Start Date / End Date** — Start must be before or equal to End
   - **Legal Case ID** — The case must exist and be in Open, In Progress, or Under Review status
3. Click **Create Contract**

### Contract Approval Workflow

For contracts exceeding the high-value threshold (default £50,000):
1. The contract starts in **Draft** status
2. A user with **Finance Director** role must approve the Draft → Under Review transition
3. Once Under Review, it can proceed to Approved → Awaiting Signature → Executed → Active

### Contract Register

The Contract Register provides a table view of all contracts with:
- Filtering by Status, Contract Type
- Search by reference, title, or counterparty
- Sorting by any column
- Pagination

---

## Compliance Management

### Setting Up Requirements

1. Navigate to **Compliance Checklist** → Click **Create Requirement** (if available)
2. Define:
   - **Name** — Unique within its category (5–200 characters)
   - **Category** — Health & Safety, Environmental, Financial, etc.
   - **Frequency** — How often checks are needed: Daily, Weekly, Monthly, Quarterly, Annually, One-Off, Ongoing
   - **Source Regulation** — The regulation or policy this requirement comes from
   - **Responsible Role** — Who is accountable for performing checks

### Understanding the Checklist

The compliance checklist uses colour-coded indicators:
- 🟢 **Green** — Compliant. Last check passed and next check not yet due
- 🟡 **Amber** — Due Soon. Next check is due within 7 days
- 🔴 **Red** — Overdue or Non-Compliant. Action needed immediately
- ⚪ **Grey** — Not Yet Checked. No compliance check has been recorded

### Recording a Compliance Check

1. Open a compliance requirement detail page
2. Click **Record New Check**
3. Fill in:
   - **Check Date** — When the check was performed (today or earlier)
   - **Outcome** — Compliant, Non-Compliant, Partially Compliant, or Not Applicable
   - **Findings** — What was observed (10–3000 characters)
   - **Evidence Reference** — Optional document or certificate reference
4. If **Non-Compliant**:
   - **Remediation Plan** — Required (≥20 characters)
   - **Remediation Due Date** — Required (must be future date)
5. Click **Record Compliance Check**

The system automatically calculates the next due date based on the requirement's frequency.

---

## Insurance Management

### Adding an Insurance Policy

1. Navigate to **Insurance** → Click **Create Insurance Record**
2. Fill in:
   - **Policy Number** — Unique among active policies (3–50 characters)
   - **Insurer** — Insurance company name (2–200 characters)
   - **Coverage Type** — Professional Indemnity, Public Liability, Employers Liability, Building Insurance, Title Insurance, Contractors All Risk, or Legal Expenses
   - **Cover Amount / Premium** — Positive values
   - **Currency** — ISO 4217 code
   - **Start Date / Expiry Date** — Start must be before Expiry
3. Click **Create Insurance Record**

### Expiry Monitoring

The system automatically monitors insurance expiry:
- **30 days before expiry** → Status transitions to "Expiring Soon" + notification sent
- **On expiry date** → Status transitions to "Expired" + notification sent to Legal Officer and Finance Director
- Expiring policies appear as alerts on the Dashboard and Insurance List pages

### Renewing a Policy

1. Open the insurance record detail
2. Click **Renew** (available when status is Expiring Soon or Expired)
3. Enter new coverage details (amount, premium, dates)
4. The system creates a new policy linked to the previous one and transitions the old policy to "Renewed"

---

## Audit Records

### Scheduling an Audit

1. Navigate to **Audit Records** → Click **New Audit**
2. Fill in:
   - **Audit Type** — Internal, External, Regulatory, or Spot Check
   - **Scope** — What will be examined (10–1000 characters)
   - **Auditor Name** — Who is conducting the audit (2–150 characters)
   - **Audit Date** — When the audit is scheduled
3. Click **Create Audit Record** — Starts in "Planned" status

### Recording Findings

When transitioning an audit to **Findings Recorded**:
- **Findings** — Summary of what was discovered (≥20 characters)
- **Risk Rating** — Low, Medium, High, or Critical

### Requiring Actions

When transitioning to **Actions Required**:
- **Recommendations** — Specific corrective actions needed (≥20 characters)
- **Action Due Date** — Deadline for completion (must be future date)

If the action due date passes without completion, the record is automatically marked as **Overdue** and a notification is sent to the Legal Compliance Officer.

---

## Document Management

### Uploading Documents

1. Navigate to a legal case or contract detail page
2. Use the **Document Upload** section
3. Select the file (max 50MB, allowed: PDF, DOCX, XLSX, PNG, JPG, TIFF)
4. Choose **Document Type** and **Confidentiality Level**
5. Click **Upload Document**

### Confidentiality Levels

- **Public** — Visible to all users
- **Internal** — Visible to all legal roles
- **Confidential** — Visible to all legal roles
- **Restricted** — Visible only to Legal Compliance Officers

### Versioning

When uploading a new version of an existing document:
- The version number increments automatically (1 → 2 → 3...)
- Previous versions are retained and accessible
- All uploads are recorded in the audit trail

---

## Tips & Best Practices

1. **Always link cases** — Every legal case should be linked to either a Land Opportunity or Planning Application for full traceability
2. **Set priorities carefully** — High and Critical cases appear in the risk summary on the dashboard
3. **Keep compliance on track** — Check the compliance checklist weekly for amber/red indicators
4. **Review insurance regularly** — The 30-day expiry warning gives you time to arrange renewals
5. **Use the audit trail** — Export audit data for regulatory reviews using the CSV export feature
6. **Document everything** — Upload relevant documents against cases and contracts as evidence
