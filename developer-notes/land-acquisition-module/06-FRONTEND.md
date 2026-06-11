# 06 — Frontend (What Users See and Interact With)

## What This Section Covers

This is what the users actually see — the screens, buttons, forms, and data they interact with. We built this using Angular 20 (the latest), with a modern component-based architecture, proper state management, and a clean corporate design using Tailwind CSS and DaisyUI.

## The Pages

### Dashboard Page

This is the landing page for the Land Acquisition module. When someone navigates here, they see at a glance:

- **4 KPI Cards** at the top:
  - Average Acquisition Cycle (how many days it typically takes to buy land)
  - Total Opportunities Evaluated (how many have progressed past "Identified")
  - Conversion Rate (what percentage of opportunities end up being acquired)
  - Due Diligence Pass Rate (what percentage of DD checks pass)

- **Pipeline Summary** — A visual count of how many opportunities sit in each status

- **Alerts Section** — Warnings about offers expiring soon and overdue due diligence

- **Recent Activity** — The last 5 actions performed by anyone in the system

While the data loads, users see skeleton placeholders (grey animated boxes) so they know something is happening. If the data fails to load, they see a clear error with a retry button.

### Pipeline Page

This is a Kanban-style board — think Trello, but for land opportunities.

- 7 columns, one for each status: Identified, Initial Review, Due Diligence, Offer Made, Under Contract, Acquired, Withdrawn
- Each opportunity appears as a card showing: Name, Location, Land Size, and how many days it's been in the current status
- Clicking a card takes you to the detail page
- The whole board scrolls horizontally if needed
- Empty columns show a helpful "No opportunities" message

### Opportunity Detail Page

This is the deep-dive view. A full header with the opportunity name, location, size, status, source, and target date. Below that, a tabbed interface:

- **Overview tab** — All the key details laid out clearly, plus the land owner information
- **Due Diligence tab** — A checklist of all DD checks with create/transition capabilities
- **Offers tab** — All offers with counter-offer display, create form, and status actions
- **Documents tab** — Table of uploaded files with type, size, date
- **Financials tab** — The feasibility assessment with costs, revenue, profit, and ROI displayed in a clear grid with colour coding (green for profit, red for loss)
- **Activity tab** — A timeline of all status changes

At the top, contextual action buttons appear based on the current status. So if you're looking at an opportunity in "Initial Review," you'll see a "Start Due Diligence" button. If it's in "Offer Made," you'll see "Under Contract." There's always a "Withdraw" button (with a reason prompt) and an "Edit" button.

### Opportunity Create Page

A clean form with:
- Name field (3-200 characters, required)
- Location field (3-500 characters, required, textarea for longer addresses)
- Land Size field (positive number, required)
- Source field (optional — how we found it)
- Expected Acquisition Date (optional — target date)

Each field has:
- Helper text explaining what's expected
- Inline validation errors shown on blur (when you click away) or on submit
- The submit button is disabled until the form is valid

If you try to navigate away with unsaved changes, a browser confirmation dialog appears: "You have unsaved changes. Are you sure you want to leave?"

Server-side errors (like the duplicate name/location check) are mapped back to the relevant form fields and displayed inline.

### Opportunity Edit Page

Same form as create, but pre-populated with existing data. The submit button is disabled until you've actually changed something (it checks both valid AND dirty/changed).

## The Reusable Components

These are building blocks used across multiple pages:

### Status Badge
A coloured pill/tag showing the current status. Colour coded:
- Grey = Identified (just spotted, no action yet)
- Blue = Initial Review or Offer Made (in progress)
- Amber = Due Diligence or Under Contract (needs attention)
- Green = Acquired (success!)
- Red = Withdrawn (didn't proceed)

### Status Progress Indicator
A horizontal step bar showing where the opportunity is in the lifecycle — like those delivery tracking bars you see on courier websites.

### KPI Card
A nice card with a metric label, the value in big text, an icon, and optionally a trend arrow (up/down/flat with percentage).

### Activity Timeline
A vertical timeline showing chronological events with date, user, and what status changed from/to.

### Pipeline Column
A single column in the Kanban board with a header (status name + count badge) and a scrollable list of opportunity cards.

### Opportunity Card
A compact card for the pipeline view showing name, location, size, and days-since-last-change.

### Document Upload
A drag-and-drop area (or click to browse), document type selector, file validation (size + type), progress bar during upload, and error messages.

### Approval Panel
Shows the pending approval details, with approve (green) and reject (red) buttons. The reject button requires a reason (minimum 5 characters). The approve button has an optional notes field.

### Due Diligence Tab Component
Shows all DD checks as a checklist with create form, status transitions, and summary stats.

### Offers Tab Component
Shows all offers with a create form, counter-offer modal, status transitions, and expiry warnings.

### Contract Tab Component
Shows the contract lifecycle with a progress indicator, create form, solicitor details, and status transitions. Includes a deposit modal for the "Exchange" step.

## State Management

The frontend uses NgRx — a centralized state store that acts as the "single source of truth" for the application data.

This means:
- When you load opportunities, they're stored centrally
- Every component reads from the same data source
- Changes are predictable and traceable
- If a network call fails, the error is stored centrally and displayed via toast notifications

We have two store slices:
1. **Opportunity Store** — All opportunity list data, loading states, errors, selected ID
2. **Dashboard Store** — Metrics, recent activity, loading states

## HTTP Error Handling

A global HTTP interceptor catches ALL API errors:
- **401** — Session expired, redirects to login, shows warning toast
- **403** — Shows "you don't have permission" warning
- **500** — Shows "server error, please try again" message
- **Network error** — Shows "can't reach server, check your connection"
- **400/422** — Shows the specific validation error message

Users never see raw technical errors. Everything is translated to human-readable messages.

## Route Protection

- Write routes (create, edit) are protected by a role guard — only AcquisitionManager and AdminSupport can access them
- An unsaved changes guard prevents accidental data loss when navigating away from forms

## Questions to Ask the Developer

- "Show me the dashboard loading — what do users see while data is fetching?"
- "Navigate to the pipeline page — show me the 7 columns with cards"
- "Click into an opportunity — show me each tab"
- "Create an opportunity — show me the validation working (try submitting empty, try a name with 2 characters)"
- "Navigate away from a dirty form — does the warning appear?"
- "What happens when the API returns an error? Show me the toast notification"
- "Show me the approval panel — how does the Finance Director approve or reject?"
