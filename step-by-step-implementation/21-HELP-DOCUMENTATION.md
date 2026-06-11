# Phase 21: Help Centre & Documentation

## Why Documentation Matters

A feature is not complete until users can understand it without asking someone. The application must teach itself. Every page should feel like it has a knowledgeable assistant behind it.

---

## Help Centre Structure

```
Help Centre
├── Getting Started
│   ├── Welcome to BuildEstate Pro
│   ├── Quick Start Guide
│   ├── Understanding Your Dashboard
│   └── Your First 30 Minutes
├── Land Acquisition
│   ├── Creating an Opportunity
│   ├── Managing the Pipeline
│   ├── Running Due Diligence
│   ├── Making and Managing Offers
│   └── Completing an Acquisition
├── Planning & Approvals
│   ├── Submitting a Planning Application
│   ├── Managing Conditions
│   └── Handling Appeals
├── Project Management
│   ├── Creating a Project
│   ├── Milestones and Tasks
│   └── Managing Risks
├── Construction
│   ├── Tracking Build Progress
│   ├── Running Inspections
│   └── Managing Snags
├── Finance
│   ├── Setting Up Budgets
│   ├── Recording Transactions
│   └── Understanding Reports
├── Sales
│   ├── Managing Leads
│   ├── Processing Reservations
│   └── Sales Pipeline
├── Administration
│   ├── Managing Users
│   ├── Roles and Permissions
│   └── Viewing Audit Logs
├── FAQ
├── Glossary
└── Release Notes
```

---

## Help Article Format

Every help article follows the same structure:

```typescript
interface IHelpArticle {
    id: string;
    categoryId: string;
    title: string;
    summary: string;          // One-line description
    content: string;          // Markdown content
    relatedRoutes: string[];  // Links to relevant pages
    roles: string[];          // Which roles this applies to
    lastUpdated: string;
}
```

### Article Content Template

```markdown
# [Article Title]

## What This Does
[One paragraph explaining the feature in plain English]

## How To Use It
1. Navigate to [Page Name] from the sidebar
2. Click [Button Name]
3. Fill in the form:
   - **Field 1** — What to enter and why
   - **Field 2** — What to enter and why
4. Click [Submit Button]

## What Happens Next
[Explain what the system does after the user's action]

## Tips
- [Practical tip 1]
- [Practical tip 2]

## Common Questions
**Q: [Common question]?**
A: [Clear answer]

## Related Features
- [Link to related help article]
- [Link to related page in the app]
```

---

## User Bible

A comprehensive guide covering everything:

```
User Bible
├── Platform Overview
│   ├── What is BuildEstate Pro?
│   ├── The 14 Modules Explained
│   ├── The Development Lifecycle
│   └── Your Role in the Platform
├── How Each Module Works
│   ├── Land Acquisition (detailed walkthrough)
│   ├── Planning & Approvals
│   ├── ... (one section per module)
│   └── Reports & Dashboards
├── Common Tasks
│   ├── Creating Records
│   ├── Editing Records
│   ├── Changing Status
│   ├── Uploading Documents
│   ├── Searching and Filtering
│   └── Exporting Data
├── Best Practices
│   ├── Data Entry Standards
│   ├── Document Management
│   ├── Keeping Records Up to Date
│   └── Using the Dashboard Effectively
├── Troubleshooting
│   ├── Can't Log In
│   ├── Permission Denied
│   ├── Page Not Loading
│   └── Data Not Saving
└── Role Responsibilities
    ├── Acquisition Manager Guide
    ├── Legal Officer Guide
    ├── Project Manager Guide
    ├── Site Manager Guide
    ├── Sales Manager Guide
    ├── Finance Director Guide
    └── Administrator Guide
```

---

## Glossary (Key Terms)

| Term | Definition |
|------|-----------|
| Opportunity | A potential piece of land being evaluated for development |
| Due Diligence | Checks performed before purchasing land (legal, environmental, etc.) |
| Planning Permission | Council approval to build on land |
| Section 106 | A legal agreement between developer and council for community contributions |
| CIL | Community Infrastructure Levy — a charge on new developments |
| Snagging | Defects identified during construction inspections |
| Conveyancing | The legal process of transferring property ownership |
| Practical Completion | The point where a building is sufficiently complete for handover |
| Retention | Money withheld from contractor payments as insurance against defects |

---

## Release Notes Format

```markdown
# Release Notes — v2.1.0 (June 2026)

## New Features
- **Planning Module** — Submit and track planning applications
- **Condition Management** — Manage and discharge planning conditions

## Improvements
- Dashboard now shows planning KPIs
- Improved search across all modules
- Faster page load times

## Bug Fixes
- Fixed: Status filter not resetting on page change
- Fixed: CSV export missing last column

## Coming Soon
- Project Management module (v2.2.0)
- Finance & Budget Control (v2.3.0)
```

---

## Learning Paths (Role-Based)

Each role gets a guided learning path:

### Acquisition Manager Path
1. Welcome & Dashboard Overview
2. Creating Your First Opportunity
3. Managing the Pipeline
4. Running Due Diligence Checks
5. Making Offers
6. Completing Acquisitions
7. Using Reports and Exports
8. Tips for Power Users

### Finance Director Path
1. Welcome & Dashboard Overview
2. Understanding the Financial Dashboard
3. Setting Up Project Budgets
4. Recording Transactions
5. Tracking Budget vs Actual
6. Managing Investors
7. Generating Financial Reports
8. Portfolio Analysis

---

## Implementation (Frontend)

The Help Centre is a frontend-only feature with static data:

```
features/help-centre/
├── help-centre.component.ts        — Main help page (categories)
├── help-category.component.ts      — Category page (article list)
├── help-article.component.ts       — Individual article view
├── learning-paths.component.ts     — Role-based learning paths
├── release-notes.component.ts      — Version history
├── user-bible.component.ts         — Comprehensive guide
├── data/
│   └── help-articles.data.ts       — All article content
└── models/
    └── help-article.model.ts       — TypeScript interfaces
```

---

## Documentation Rules

1. Every new module MUST add help articles before it's considered complete
2. Help articles MUST be written in plain English (no developer jargon)
3. Screenshots/examples should show realistic data
4. Glossary MUST be updated when new domain terms are introduced
5. Release notes MUST be updated with every deployment
6. The User Bible MUST evolve alongside the product

**A feature without documentation is an incomplete feature.**
