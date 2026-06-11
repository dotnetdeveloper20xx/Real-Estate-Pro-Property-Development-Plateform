# 08 — Integration & Cross-Cutting Concerns

## What This Section Covers

These are the pieces that run behind the scenes — background jobs, automatic triggers, the audit system, and error handling. They're the things users don't directly interact with but that make the system reliable and trustworthy.

## The Offer Expiry Background Service

**What it does:** Every hour, a background job wakes up and checks: "Are there any offers that are still Under Review but whose Valid Until date has passed?" If it finds any, it marks them as Expired and sends a notification to the person who created the offer.

**Why it matters:** Offers don't hang around forever in "Under Review" status after they've expired. The system automatically cleans them up and alerts the responsible person. No one needs to manually check dates.

**How it works:**
- Runs as a hosted background service (starts with the application, runs continuously)
- Checks every hour (configurable)
- Queries: Status == UnderReview AND ValidUntil < now
- Updates each match to Expired
- Publishes a notification for each expired offer
- Handles errors gracefully (logs them, doesn't crash)

## The Approval Threshold Trigger

**What it does:** When an offer is created with an amount of £500,000 or more, the system automatically creates an Approval Request. This blocks the opportunity from progressing until the Finance Director approves or rejects it.

**Why it matters:** Big financial commitments get automatic oversight. Nobody has to remember to seek approval — the system does it for them.

**How it works:**
- Built into the Create Offer handler (not a separate background job — it happens immediately)
- Reads the threshold from configuration (so it can be changed without code changes)
- Default: £500,000
- Creates an ApprovalRequest with Status = Pending
- Sends a notification to the Finance Director role
- The existing transition handler checks for pending approvals and blocks if any exist

## The Notification System

Four key events trigger automatic notifications:

1. **Opportunity Acquired** — When an opportunity reaches "Acquired" status, ALL land acquisition roles are notified. Everyone should know when we successfully buy land.

2. **Offer Expired** — When an offer expires (via the background service), the Acquisition Manager who created it is notified. They need to know their offer expired so they can decide what to do next.

3. **Due Diligence Failed** — When a DD check fails, the Acquisition Manager on the parent opportunity is notified. A failed check might mean the deal is off, so the AM needs to know immediately.

4. **Approval Created** — When the threshold trigger creates an approval request, the Finance Director is notified. They need to know there's a decision waiting for them.

All notifications are persisted in the database with: recipient, event type, message, timestamp, and read status. This means we have a complete record of every notification sent.

## The Audit Interceptor

**What it does:** Automatically captures EVERY create, update, and delete operation across ALL entities in the module. This happens at the database level — no handler code needs to explicitly "log" anything.

**What it captures:**
- **Who** — User ID and User Name
- **What** — Action (Create/Update/Delete), Entity Name, Entity ID
- **When** — UTC timestamp
- **Changes** — Old Values (JSON), New Values (JSON), and which columns were affected
- **Context** — IP Address and Correlation ID (so you can trace a full request path)

**Why it matters:** Full regulatory compliance. If an auditor asks "who changed this record, when, and what did they change?" — we can answer that instantly. The audit log is append-only — it cannot be modified or deleted. Attempting to do so throws an error.

## The Frontend HTTP Error Interceptor

**What it does:** A global handler that catches every API error and translates it into something useful for the user.

**How it handles each error type:**
- **401 Unauthorized** → Shows "Session expired" message, redirects to login
- **403 Forbidden** → Shows "You don't have permission" message
- **404 Not Found** → Shows "Resource not found" message
- **409 Conflict** → Shows the specific conflict (like "duplicate record" or "concurrency conflict")
- **400 Bad Request** → Shows the specific validation error from the server
- **500 Server Error** → Shows "Something went wrong, please try again"
- **No network** → Shows "Can't reach the server, check your connection"

Every error also dispatches an NgRx action — so the error state is tracked centrally and can be used by any component that cares about it.

## The Unsaved Changes Guard

**What it does:** If a user is filling out a form (create or edit) and tries to navigate away without saving, a browser confirmation dialog appears: "You have unsaved changes. Are you sure you want to leave?"

**Why it matters:** Prevents accidental data loss. If someone spent 5 minutes filling out a form and accidentally clicks a link, they get a chance to go back and save first.

## Questions to Ask the Developer

- "Show me the background service logs — has it run? Did it find any expired offers?"
- "Create an offer for £600,000 — show me the approval request appearing and the notification being sent"
- "Show me the audit log for a recent operation — what does a full audit entry look like?"
- "Turn off the internet while the app is open — what does the user see?"
- "Show me what happens when two browser tabs are editing the same opportunity"
