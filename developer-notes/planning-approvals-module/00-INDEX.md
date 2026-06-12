# Planning & Approvals Module — Developer Notes for Management

## What Is This?

These notes explain everything our development team built for the Planning & Approvals Module — the second business module of BuildEstate Pro. They're written for you, a non-technical manager, to understand what was done, why it was done, and how to verify it's working correctly.

Think of this module as the engine that powers the entire planning permission process — from the moment an acquired piece of land needs planning approval, through formal submission to the council, validation, review, decision, and if necessary, appeal.

## How to Read These Notes

Each file covers a different part of the system. Read them in order, or jump to the area you're most interested in:

| File | What It Covers |
|------|----------------|
| [01-OVERVIEW.md](./01-OVERVIEW.md) | The big picture — what the module does and who uses it |
| [02-DATA-FOUNDATIONS.md](./02-DATA-FOUNDATIONS.md) | The data structure — what information we store and how |
| [03-BUSINESS-RULES.md](./03-BUSINESS-RULES.md) | The rules — what the system enforces automatically |
| [04-BACKEND-OPERATIONS.md](./04-BACKEND-OPERATIONS.md) | The backend operations — creating, updating, searching, and managing records |
| [05-API-ENDPOINTS.md](./05-API-ENDPOINTS.md) | The API layer — how the frontend talks to the backend |
| [06-FRONTEND.md](./06-FRONTEND.md) | The user interface — what users see and interact with |
| [07-TESTING.md](./07-TESTING.md) | The testing — how we verify everything works correctly |
| [08-INTEGRATION.md](./08-INTEGRATION.md) | The wiring — domain events, notifications, and cross-cutting concerns |
| [09-SIGN-OFF-CHECKLIST.md](./09-SIGN-OFF-CHECKLIST.md) | Your sign-off checklist — what to verify before approving |

## Quick Stats

- **Total tasks completed:** 107
- **Backend files created:** ~150 C# files across Domain, Application, Infrastructure, and API projects
- **Frontend files created:** ~60 TypeScript files (components, services, store, models, routes, guards)
- **Test files created:** ~17 test files (16 property-based tests + 1 infrastructure integration test)
- **API endpoints:** 25 RESTful endpoints across 8 controllers
- **Database tables:** 7 new tables with full indexing, relationships, audit support, and soft-delete query filters
- **State machines:** 4 (Application, Condition, Appeal, Fee payment status)
- **Domain events:** 5 (with corresponding notification handlers)

## Who Uses This Module?

- **Planning Manager** — Creates applications, manages the pipeline, tracks decisions and milestones
- **Legal & Compliance Officer** — Manages conditions, handles appeals, tracks condition discharge
- **Admin/Support** — Uploads documents, assists with data entry
- **Finance Director** — Approves high-value fee payments exceeding the configured threshold
- **Acquisition Manager** — Read-only view of planning status for their acquired sites

## Module Relationship

This module sits directly after Land Acquisition in the development lifecycle:

```
Land Acquisition (Module 1) → Planning & Approvals (Module 2) → ...
```

A planning application can only be created for a land opportunity that has reached "Acquired" status.
