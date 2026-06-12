# Planning & Approvals Module — Overview

## What Does This Module Do?

The Planning & Approvals module manages the full lifecycle of planning applications submitted to local councils. Once a piece of land is acquired, the development company must obtain planning permission before construction can begin. This module tracks that entire journey.

## The Planning Lifecycle

Every planning application follows this general path:

```
Pre-Application → Submitted → Validated → Under Review → Decision
```

The possible decision outcomes are:
- **Approved** — Permission granted, proceed to construction
- **Approved with Conditions** — Permission granted but with obligations to fulfil
- **Refused** — Permission denied (can appeal)
- **Withdrawn** — Company chooses to withdraw the application

If refused, the company can **appeal** to the Planning Inspectorate.

## What the System Manages

| Area | Description |
|------|-------------|
| **Planning Applications** | The core entity — tracks the application from pre-application discussions to final decision |
| **Council Contacts** | Records which council and planning officer is handling each application |
| **Planning Conditions** | Tracks obligations imposed on approved applications (must be discharged before/during construction) |
| **Planning Appeals** | Manages formal challenges against refused decisions |
| **Planning Documents** | Stores all drawings, reports, and council correspondence |
| **Planning Fees** | Records and tracks all costs associated with planning submissions |
| **Planning Milestones** | Tracks key dates and deadlines (submission, validation, target decision, etc.) |
| **Dashboard & KPIs** | Provides metrics like approval rate, average decision time, and pipeline summary |

## Key Design Decisions

1. **State Machine Pattern** — The system enforces strict rules about which status transitions are allowed. You can't skip steps (e.g., go directly from Pre-Application to Approved).

2. **Integration via Foreign Key** — The module links to Land Acquisition through the OpportunityId. Only acquired opportunities can have planning applications.

3. **One Active Application Per Opportunity** — The system prevents creating a new application if one already exists (unless the previous one was withdrawn or refused).

4. **Configurable Fee Threshold** — Fees above a configurable amount (default £10,000) require Finance Director approval before payment.

5. **Domain Events for Cross-Entity Effects** — When an appeal is allowed, it automatically transitions the parent application status. When all conditions are discharged, stakeholders are notified.

## Technology Stack

- **Backend:** ASP.NET Core, EF Core, MediatR (CQRS), FluentValidation, FsCheck (property testing)
- **Frontend:** Angular 20, NgRx, Reactive Forms, Tailwind CSS, DaisyUI
- **Database:** SQL Server with EF Core Code-First migrations
- **Architecture:** Clean Architecture with strict layer separation
