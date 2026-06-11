# 03 — Business Rules (What the System Enforces Automatically)

## What This Section Covers

These are the rules that the system enforces without anyone having to remember them. They're built into the code, not written on a poster on the wall. If someone tries to break a rule, the system stops them and explains why.

## State Machine Rules (The Pipeline Steps)

### The Opportunity Pipeline

The system enforces that opportunities can ONLY move in specific directions. You can't skip steps. You can't go backwards. Here's exactly what's allowed:

- From **Identified** → you can go to **Initial Review** only
- From **Initial Review** → you can go to **Due Diligence** or **Withdrawn**
- From **Due Diligence** → you can go to **Offer Made** or **Withdrawn**
- From **Offer Made** → you can go to **Under Contract** or **Withdrawn**
- From **Under Contract** → you can go to **Acquired** or **Withdrawn**
- **Acquired** and **Withdrawn** are end states — nowhere to go from here

So if someone tries to jump from "Identified" straight to "Offer Made," the system will say: "No. You can only go to Initial Review from here." And it tells them what their valid options are.

**Why this matters:** It guarantees the business process is followed. No shortcuts, no accidents.

### Due Diligence Status

Each individual due diligence check follows its own mini-pipeline:

- **Pending** → **In Progress** (someone starts working on it)
- **In Progress** → **Completed** or **Failed** (the check is done — it either passed or failed)

You can't go backwards. A completed check can't go back to pending. A failed check can't magically become completed without starting fresh.

### Offer Status

- **Under Review** → **Accepted**, **Rejected**, **Counter-Offered**, or **Expired**
- **Counter-Offered** → **Under Review** (back for another round), **Accepted**, or **Rejected**

Once an offer is Accepted, Rejected, or Expired — it's final.

### Contract Status

- **Draft** → **Under Legal Review**
- **Under Legal Review** → **Approved** or **Rejected**
- **Approved** → **Signed**
- **Signed** → **Exchanged**
- **Exchanged** → **Completed**

This mirrors the real legal process: you draft it, lawyers review it, they approve it, both parties sign it, contracts are exchanged (this is when the deal becomes legally binding), and then it's completed.

## The Due Diligence Gate

This is a critical business rule. Look, before anyone can make an offer on a piece of land, three specific checks MUST be completed:

1. **Legal check** — Completed ✓
2. **Environmental check** — Completed ✓
3. **Planning check** — Completed ✓

If even one of these is missing or has failed, the system will NOT allow the opportunity to move from "Due Diligence" to "Offer Made." It will say something like: "Cannot transition to Offer Made. Incomplete or missing due diligence: Environmental, Planning."

**Why this matters:** You never make an offer on land that hasn't been properly checked. This protects the company from buying land with hidden problems.

## The Approval Threshold

Here's how this works:

- When someone creates an offer for £500,000 or more, the system automatically creates an approval request
- This approval request goes to the Finance Director
- While that approval is pending, the opportunity CANNOT move forward in the pipeline
- The Finance Director must either Approve (with optional notes) or Reject (with a required reason)
- Only after approval can the opportunity continue progressing

The threshold (£500,000) is configurable — if the business decides it should be £250,000 or £1,000,000, we can change it without touching the code.

**Why this matters:** Big financial commitments always get proper oversight. No one person can commit the company to half a million pounds without a second pair of eyes.

## The Offer Acceptance Cascade

When an offer is accepted:
- The offer status changes to "Accepted"
- AND the parent opportunity automatically transitions to "Under Contract"

This happens in one action — the user doesn't have to manually update both. Accept the offer, and the opportunity moves forward automatically.

Similarly for acquisitions:
- When a land acquisition record reaches "Registered" status
- The parent opportunity automatically moves to "Acquired"

## Withdrawal Rules

You can withdraw an opportunity at any point (except if it's already Acquired or already Withdrawn). But there's a rule: **you must provide a reason, and it must be at least 10 characters long.**

No one can just silently withdraw an opportunity without explaining why. This creates accountability and a paper trail.

## Duplicate Prevention

The system won't let you create two opportunities with the same Name AND Location combination. If someone already logged "Greenfield Site, Manchester" — you can't create another one with those exact same details.

## One Acquisition Per Opportunity

Each opportunity can only have ONE active acquisition record. You can't accidentally create two purchase records for the same land.

## Document Upload Rules

- Maximum file size: 25 MB
- Allowed file types: PDF, Word documents, Excel spreadsheets, PNG images, JPEG images
- Only Admin/Support users can delete documents (to prevent accidental loss of important paperwork)

## Input Validation (Data Quality)

The system validates all data before saving:

- Opportunity Name: must be 3-200 characters
- Location: must be 3-500 characters
- Land Size: must be a positive number
- Offer Amount: must be positive
- Offer Currency: must be a valid 3-letter code (like GBP, USD, EUR)
- Offer Valid Until: must be a future date
- Purchase Price: must be positive
- Completion Date: must be today or earlier (you can't complete a purchase in the future)
- Registry Reference: must be 3-50 characters

If any of these fail, the system returns clear error messages explaining exactly what's wrong.

## Questions to Ask the Developer

- "Try to move an opportunity from Identified to Offer Made — what happens?"
- "Create an offer for £600,000 — does the approval request appear automatically?"
- "Try to move to Offer Made when only the Legal check is completed but Environmental isn't"
- "Accept an offer — does the opportunity automatically go to Under Contract?"
- "Try to withdraw without a reason — what error do you get?"
- "Try to upload a 30MB file — what happens?"
- "Try to create two opportunities with the same name and location"
