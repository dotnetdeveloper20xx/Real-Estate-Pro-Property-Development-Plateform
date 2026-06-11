# BuildEstate Pro — UX Standards

## Core Principle
**Users should never need to guess.**

Users should never wonder:
- "What does this button do?"
- "What happens next?"
- "Where am I?"
- "What should I do now?"
- "Why is this required?"

The application must answer those questions automatically.

---

## Page Design Rules

Every page MUST answer:
1. **What is this page?** (clear title + description)
2. **Why does it exist?** (business context)
3. **What can I do here?** (visible actions)
4. **What should I do next?** (guidance)
5. **What information is important?** (visual hierarchy)

Users should understand a page within 5 seconds.

---

## Colour System

Colours have meaning. Use them consistently:

| Colour | Meaning | Use For |
|--------|---------|---------|
| Green | Success | Completed, approved, healthy |
| Blue | Information | Active, in progress, neutral info |
| Amber/Yellow | Warning | Approaching deadline, needs attention |
| Red | Critical/Danger | Overdue, failed, error, destructive action |
| Grey | Neutral | Disabled, archived, secondary info |

Never use colour decoratively. Every colour communicates purpose.

---

## Button Standards

### Labels Must Describe Outcomes

**Good:** Create Opportunity, Submit Offer, Approve Application, Complete Handover
**Bad:** Save, Submit, Process, Execute, OK

### Button Types
| Type | Use For | Style |
|------|---------|-------|
| Primary | Main action on page | Filled, prominent |
| Secondary | Alternative actions | Outlined |
| Danger | Destructive actions | Red filled |
| Ghost | Low-priority actions | Text only |

### Destructive Actions
Always require confirmation dialog:
```
Are you sure you want to withdraw this opportunity?
This action cannot be undone.
[Cancel] [Withdraw Opportunity]
```

---

## Form Design

### Rules
- Group related fields together (sections with headings)
- Logical top-to-bottom flow
- Required fields marked with asterisk (*)
- Helpful descriptions below complex fields
- Inline validation on blur (not on every keystroke)
- Disable submit until form is valid
- Show progress for multi-step forms

### Validation Messages
**Bad:** "Invalid input", "Required field"
**Good:** "Please enter the land title number", "Expected format: LN123456"

Validation messages should help users succeed, not punish them.

---

## Table / Data Grid Standards

Every data table MUST support:
- Search (full-text across visible columns)
- Sorting (click column headers)
- Filtering (per-column or global filters)
- Pagination (server-side for large datasets)
- Export (CSV minimum)
- Column visibility (user can show/hide columns)
- Responsive behaviour (cards on mobile)

---

## Empty States

Never show a blank white screen. When no data exists:

```
[Icon or illustration]
No Land Opportunities Found
Create your first opportunity to begin evaluating development sites.
[+ Create Opportunity]
```

Provide: Explanation → Guidance → Action button

---

## Loading States

- Skeleton loaders for content areas (not spinners)
- Spinners only for actions (button loading state)
- Never leave the user wondering "is it loading or is it broken?"

---

## Error States

Errors must explain:
1. What happened
2. Why it happened (in user terms)
3. What the user can do next

**Bad:** "500 Internal Server Error"
**Good:** "We couldn't save your changes. Please check your connection and try again. If the problem persists, contact support."

---

## Dashboard Design

Dashboards are strategic decision tools, not data dumps.

### Must Include:
- KPI cards (key metrics at a glance)
- Status indicators (what needs attention)
- Progress tracking (how things are going)
- Recent activity (what happened lately)
- Action items (what to do next)

### Design Principles:
- Executives should understand the business in 30 seconds
- Managers should identify issues quickly
- Users should prioritize their work

---

## Navigation

### Sidebar
- Group by domain (Land, Planning, Construction, etc.)
- Active item clearly highlighted
- Collapsible for more screen space
- Show only items the user's role can access

### Breadcrumbs
Every page deeper than top-level shows breadcrumbs:
```
Dashboard > Opportunities > Surrey Land Plot > Due Diligence
```

### Page Header
Every page has a consistent header:
```
[Breadcrumb]
[Title]                                    [Primary Action Button]
[Description / context]
```

---

## Notifications & Feedback

### Toast Notifications
- Success: Green, auto-dismiss after 4 seconds
- Error: Red, requires manual dismiss
- Warning: Amber, auto-dismiss after 6 seconds
- Info: Blue, auto-dismiss after 4 seconds

### Position: Top-right corner, stacked

### Every Action Gets Feedback
- Create → "Opportunity created successfully"
- Update → "Changes saved"
- Delete → "Opportunity removed"
- Error → "Failed to save. Please try again."

---

## Accessibility (Non-Negotiable)

- Keyboard navigation on all interactive elements
- Focus indicators visible on all focusable elements
- Screen reader support (ARIA labels on icons, live regions)
- Colour contrast minimum 4.5:1
- Form labels associated with inputs
- Alt text on all images
- Skip navigation link

---

## Responsive Design

Desktop-first, but fully responsive:
- Desktop (1440px+): Full layout with sidebar
- Laptop (1024px-1439px): Slightly condensed
- Tablet (768px-1023px): Collapsible sidebar, stacked cards
- Mobile (320px-767px): Drawer navigation, card-based lists
