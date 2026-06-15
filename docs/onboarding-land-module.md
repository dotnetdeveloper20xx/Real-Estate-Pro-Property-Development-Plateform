# BuildEstate Pro — Land Acquisition Module
## New Staff Onboarding Guide

Welcome to BuildEstate Pro. This guide will walk you through the Land Acquisition module — the first and most important module in our property development platform. Every project starts here.

---

## What Is This Module?

The Land Acquisition module manages the **entire journey of finding, evaluating, and purchasing land** for development. It tracks every opportunity from the moment we first hear about a potential site, through legal checks, financial analysis, offer negotiations, and all the way to completion of purchase.

Think of it as your central hub for answering: *"What land are we looking at, and how far along is each deal?"*

---

## Who Uses This Module?

| Role | What They Do Here |
|------|-------------------|
| **Acquisition Manager** | Finds land, creates opportunities, submits offers, manages the pipeline |
| **Legal & Compliance Officer** | Conducts due diligence checks (legal, environmental, planning) |
| **Finance Director** | Creates feasibility assessments, approves investment decisions |
| **Admin / Support** | Uploads documents, manages data entry |
| **Project Director** | Reviews pipeline, approves acquisitions |

---

## The Land Acquisition Lifecycle

Every land opportunity moves through these stages (in order):

```
1. Identified → 2. Initial Review → 3. Due Diligence → 4. Offer Made → 5. Under Contract → 6. Acquired
                                                                                              ↘ Withdrawn
```

| Stage | What Happens |
|-------|-------------|
| **Identified** | A potential site has been found. Basic details captured. |
| **Initial Review** | The team does a first-pass assessment — is this worth pursuing? |
| **Due Diligence** | Legal, environmental, planning, and financial checks are conducted. |
| **Offer Made** | A formal offer has been submitted to the landowner. |
| **Under Contract** | Contracts exchanged. Legal completion in progress. |
| **Acquired** | Purchase complete. Land is ours. Ready for next phase (Planning). |
| **Withdrawn** | We decided not to proceed (with a recorded reason). |

You can move an opportunity forward by clicking the action buttons on the detail page (e.g., "Start Review", "Start Due Diligence", "Make Offer").

---

## Pages in This Module

### 1. Dashboard
**What it shows:** A quick overview of your pipeline health.
- KPI cards: Average acquisition cycle, total evaluated, conversion rate, due diligence pass rate
- Pipeline summary: How many opportunities are at each stage
- Alerts: Expiring offers, overdue due diligence

**When to use it:** First thing in the morning — check what needs attention today.

---

### 2. Pipeline (Kanban Board)
**What it shows:** All opportunities arranged in columns by their current status.
- Each column represents a lifecycle stage
- Each card is one opportunity
- Cards show name, location, land size, and days in current status

**When to use it:** When you want to see the big picture — how many deals are at each stage, what's moving forward, what's stuck.

**Actions:** Click any card to open its detail page.

---

### 3. Opportunities List
**What it shows:** A searchable, sortable table of all opportunities.
- Search by name or location
- Filter by status
- Sort by any column
- Paginate through results

**When to use it:** When you need to find a specific opportunity quickly, or want to export/review data in a structured format.

---

### 4. New Opportunity (Create Form)
**What it does:** Captures a new land opportunity in the system.

**Required fields:**
- Opportunity Name (3–200 characters) — A descriptive name like "Riverside Plot, Greenwich"
- Location (3–500 characters) — The full address or area description
- Land Size (acres) — Must be greater than zero

**Optional fields:**
- Source — How we found this opportunity (Agent, Auction, Off-Market, etc.)
- Expected Acquisition Date — Target date for completing the purchase

**After creation:** The opportunity enters the pipeline at "Identified" status.

---

### 5. Opportunity Detail Page
**What it shows:** Everything about a single opportunity, organised into tabs.

This is where most of the work happens. The page has:

#### Header Section
- Opportunity name with status badge
- Key metadata (location, land size, source, target date, created date)
- **Action buttons** — Move the opportunity forward in the lifecycle, edit, or withdraw
- **Status progress tracker** — Visual indicator showing where this opportunity is in the journey

#### Tabs

| Tab | What's Inside | Who Uses It |
|-----|---------------|-------------|
| **Overview** | Opportunity details + Land Owner information | Everyone |
| **Due Diligence** | Legal, environmental, planning, utilities, and valuation checks | Legal Officer |
| **Offers** | All offers submitted, with Accept/Reject/Counter actions | Acquisition Manager |
| **Documents** | Uploaded files (title deeds, reports, contracts) with download/delete | Everyone |
| **Financials** | Feasibility assessment with costs, revenue, profit, and ROI | Finance Director |
| **Activity** | Timeline of all actions taken on this opportunity | Everyone |
| **Approvals** | Request and manage investment approval decisions | Acquisition Manager + Finance Director |

---

## Key Actions You'll Perform

### As an Acquisition Manager

| Action | Where | How |
|--------|-------|-----|
| Create a new opportunity | Sidebar → New Opportunity | Fill in name, location, land size → Click "Create Opportunity" |
| Move opportunity to next stage | Detail page → Header buttons | Click "Start Review", "Start Due Diligence", "Make Offer", etc. |
| Submit an offer | Detail page → Offers tab → "Submit Offer" | Enter amount and valid-until date → Click "Submit Offer" |
| Upload a document | Detail page → Documents tab → "Upload Document" | Select file type, choose file → Click "Upload" |
| Request approval | Detail page → Approvals tab → "Request Approval" | Enter requested investment amount → Click "Submit Request" |
| Withdraw an opportunity | Detail page → "Withdraw" button | Provide a reason (minimum 10 characters) → Confirm |

### As a Legal & Compliance Officer

| Action | Where | How |
|--------|-------|-----|
| Add a due diligence check | Detail page → Due Diligence tab → "Add Check" | Select type (Legal/Environmental/Planning/Utilities/Valuation), set status, add findings |
| Update a check status | Detail page → Due Diligence tab → Edit icon on a row | Change status to InProgress/Completed/Failed, add findings |
| Accept or reject an offer | Detail page → Offers tab → Action buttons on a row | Click "Accept", "Reject", or "Counter" with an amount |

### As a Finance Director

| Action | Where | How |
|--------|-------|-----|
| Create a feasibility assessment | Detail page → Financials tab → "Create Feasibility Assessment" | Enter land cost, build cost, fees, finance costs, expected revenue, select scenario |
| Edit an assessment | Detail page → Financials tab → "Edit" button | Modify any values, see ROI recalculate live |
| Mark ready for review | Detail page → Financials tab → "Mark Ready for Review" | One click — signals the investment committee |
| Approve/reject a request | Detail page → Approvals tab → Approval panel | Add notes (optional for approve) or reason (required for reject) → Click Approve/Reject |

---

## Things to Know

### Toast Notifications
When you perform an action (create, save, delete), a notification will slide in from the bottom-right corner telling you if it succeeded or failed. These auto-dismiss after 5 seconds.

### Unsaved Changes Warning
If you've started filling in a form and try to navigate away, the system will ask you to confirm. This prevents accidental data loss.

### Status Colours
| Colour | Meaning |
|--------|---------|
| Grey | Neutral / New |
| Blue | Information / In Progress |
| Amber/Yellow | Warning / Needs Attention |
| Green | Success / Complete |
| Red | Error / Critical / Withdrawn |

### Currency Fields
All money fields show a **£** prefix and format numbers with commas (e.g., £1,500,000). Click into the field to edit the raw number, click out to see formatted.

---

## What Must Be Done Before Moving to the Next Module?

Before an opportunity can progress to the **Planning & Approvals** module, these steps must be completed:

- [ ] Opportunity status must be **Acquired** (purchase complete)
- [ ] All due diligence checks must be **Completed** (not Pending or InProgress)
- [ ] At least one **accepted offer** must exist
- [ ] A **feasibility assessment** must exist and be marked **Ready for Review**
- [ ] All required **documents** must be uploaded (Title Deed at minimum)
- [ ] An **approval request** must be submitted and **Approved** by the Finance Director

Once all of the above are done, the opportunity represents purchased land ready for the planning phase. The Planning & Approvals module then picks up from here to manage council submissions and permits.

---

## Quick Reference: Keyboard Shortcuts

| Action | Key |
|--------|-----|
| Navigate to home | Click the BuildEstate Pro logo |
| Search in tables | Type directly in the search box (no shortcut needed) |
| Cancel a form | Press Escape or click "Cancel" |
| Submit a form | Press Enter (when submit button is focused) |

---

## Need Help?

- Click your name in the top-right → **Settings** to configure notification preferences
- Click your name → **Profile** to view your role and recent activity
- If something isn't working, check the notification bell (top-right) for any system alerts

Welcome to the team. Start by exploring the Pipeline view to see what's currently in progress.
