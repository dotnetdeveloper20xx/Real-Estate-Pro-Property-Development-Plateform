# 02 — Data Foundations (What We Store and How)

## What This Section Covers

This is about the database — the permanent storage where all the land acquisition data lives. Think of it like a filing cabinet with very specific drawers, each holding a particular type of document, all cross-referenced and indexed so you can find anything instantly.

## The 10 Data Tables We Created

### 1. Land Opportunities (the main table)

This is the heart of the module. Every piece of land we're looking at has a record here.

**What we store:** Name, Location, Land Size (in acres), Status (where it is in the pipeline), Source (how we found it), Expected Acquisition Date, and optionally a Withdrawal Reason if we decide not to pursue it.

**Why it matters:** This is what the pipeline view shows. When someone asks "how many opportunities are we tracking?" — this table answers that.

**Business rule enforced:** You cannot have two opportunities with the same Name AND Location. If someone tries to create a duplicate, the system blocks it and says "this already exists."

### 2. Land Owners

Every opportunity can have one associated landowner.

**What we store:** Owner's Name, Contact Details, Address, and whether it's Freehold or Leasehold.

**Why it matters:** When the Acquisition Manager needs to call the landowner, all the details are right there linked to the opportunity.

### 3. Due Diligence Checks

Each opportunity can have multiple due diligence checks — one for legal, one for environmental, one for planning, etc.

**What we store:** Which opportunity it belongs to, the Type of check (Legal, Environmental, Planning, Utilities, or Valuation), the Status (Pending, In Progress, Completed, or Failed), any Findings, and a Report Date.

**Why it matters:** You cannot make an offer on land unless the mandatory checks (Legal, Environmental, Planning) are all Completed. The system enforces this — it's not optional.

### 4. Offers

Each opportunity can have multiple offers — because you might offer, get rejected, counter-offer, offer again.

**What we store:** Amount, Currency (GBP, USD, EUR etc.), Offer Date, Valid Until date, Status (Under Review, Accepted, Rejected, Counter-Offered, Expired), and if there's a counter-offer, the counter amount and which original offer it links back to.

**Why it matters:** Offers have expiry dates. If nobody responds before the Valid Until date passes, the system automatically marks it as Expired (there's a background job that checks this every hour).

### 5. Contracts

Each opportunity can have one active contract — the legal agreement between us and the seller.

**What we store:** Status (Draft, Under Legal Review, Approved, Rejected, Signed, Exchanged, Completed), Solicitor Name, Firm, Contact, and Deposit Amount (required when contracts are exchanged).

**Why it matters:** The legal process is tracked step by step. You can see exactly where the contract is — is it still in draft? Is it with the lawyers? Has it been signed?

### 6. Documents

Each opportunity can have many documents attached — title deeds, environmental reports, legal documents, etc.

**What we store:** Document Type, File Name, where it's stored on disk, Content Type (PDF, DOCX, etc.), File Size, and Upload Date.

**Why it matters:** All paperwork is organised and attached to the right opportunity. Files can't be over 25MB, and only PDF, DOCX, XLSX, PNG, and JPG are allowed.

### 7. Land Acquisitions (completion records)

When we actually buy the land, this records the purchase details.

**What we store:** Purchase Price, Completion Date, Land Registry Reference, and Status (Completed or Registered).

**Why it matters:** Only ONE acquisition record per opportunity is allowed. When it reaches "Registered" status, the parent opportunity automatically moves to "Acquired."

### 8. Feasibility Assessments

The financial analysis — is this land worth buying?

**What we store:** Estimated Land Cost, Build Cost, Professional Fees, Finance Costs, Expected Sales Revenue, and then three calculated fields: Total Costs, Estimated Profit, and ROI Percentage.

**Why it matters:** The ROI is calculated automatically using the formula: ((Revenue - Total Costs) / Total Costs) × 100. This supports Best Case, Expected Case, and Worst Case scenarios.

### 9. Approval Requests

When an offer exceeds £500,000, the system automatically creates an approval request that must be approved by the Finance Director before the opportunity can progress.

**What we store:** Which opportunity, the amount requiring approval, Status (Pending, Approved, Rejected), who approved/rejected, when, and their notes or rejection reason.

**Why it matters:** Big financial decisions can't slip through without proper authorisation.

### 10. Notifications

Every important event in the system generates a notification.

**What we store:** Who it's for, what type of event triggered it, the message, when it was sent, and whether it's been read.

**Why it matters:** People stay informed without having to manually check — the system tells them what needs attention.

## How Every Record Is Protected

Every single one of these tables has:

- **A unique ID** — so we can always find exactly the right record
- **Created At / Created By** — who made this record and when
- **Updated At / Updated By** — who last changed it and when
- **Soft Delete** — records are never truly deleted. They're marked as "deleted" but kept for audit purposes
- **Row Version** — prevents two people from editing the same record at the same time (if someone else changed it between you loading and saving, you'll be told)

## The Indexes (Making Searches Fast)

We've added database indexes on all the fields people commonly search or filter by. Think of indexes like the index at the back of a book — they let the database find things quickly instead of reading every single record.

Key indexes include:
- Status (so filtering the pipeline by status is instant)
- Created Date (so sorting by newest/oldest is fast)
- Combined Status + Created Date (for "show me all new opportunities from last week")
- All foreign keys (so finding "all offers for opportunity X" is instant)

## Questions to Ask the Developer

- "Show me what happens in the database when I create a new opportunity"
- "If I delete an opportunity, is it actually gone? Can we recover it?"
- "What stops two people from editing the same opportunity at the same time?"
- "Show me the relationship between an opportunity and its due diligence checks"
- "How fast is it to search for opportunities by status when we have 10,000 records?"
