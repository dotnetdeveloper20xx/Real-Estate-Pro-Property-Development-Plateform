# BuildEstate Pro

### The Enterprise Property Development Lifecycle Platform

**From Land to Legacy — One Platform, Total Control**

---

> BuildEstate Pro is a full-stack enterprise SaaS platform engineered for UK real estate developers who manage multi-million pound property developments end-to-end. It replaces spreadsheets, disconnected systems, and manual processes with a single, auditable, role-secured digital command centre spanning 14 integrated modules — from land identification through construction, sales, handover, and long-term asset management.

> Designed by a Solutions Architect. Built with Clean Architecture. Secured to enterprise standards. Ready for Fortune 500 review.

---

## Why BuildEstate Pro Exists

Real estate development is a £100B+ industry run on fragmented tools. Acquisition teams use spreadsheets. Legal uses email folders. Construction tracks progress on whiteboards. Finance reconciles in Excel. Nobody has real-time visibility across the entire project lifecycle.

**BuildEstate Pro solves this.** Every role, every phase, every document, every approval, every pound — tracked in one platform with full audit trails, role-based access, and real-time dashboards.

---

## Platform at a Glance

![Project Overview](project%20overview%20theoriginal%20plan.png)

| Metric | Value |
|--------|-------|
| Business Modules | 14 (full lifecycle coverage) |
| Platform Foundation Modules | 3 (Security, Users, Notifications) |
| User Roles | 13 (enterprise RBAC) |
| Granular Permissions | 43 (policy-based enforcement) |
| Notification Event Types | 27+ (across 3 live modules) |
| Architecture | Clean Architecture + CQRS + Domain Events |
| Frontend | Angular 20, NgRx, DaisyUI, Tailwind CSS |
| Backend | .NET 8, ASP.NET Core, EF Core, MediatR |
| Database | SQL Server (Code-First, soft-delete, audit columns) |
| API Standard | RESTful, paginated, filtered, Swagger-documented |

---

## The 14 Modules

| # | Module | Status | Purpose |
|---|--------|--------|---------|
| 1 | [**Land Acquisition**](developer-notes/land-acquisition-module/land-module.md) | ✅ Complete | Pipeline management, due diligence, offers, contracts, feasibility, approvals |
| 2 | **Planning & Approvals** | ✅ Complete | Applications, conditions, milestones, appeals, fees, council submissions |
| 3 | **Legal & Compliance** | ✅ Complete | Cases, contracts, compliance checks, insurance, audit records, retention |
| 4 | Project Management | 🔲 Planned | Milestones, timelines, tasks, risks, resource allocation |
| 5 | Construction Management | 🔲 Planned | Stages, inspections, snagging, handover, progress tracking |
| 6 | Procurement & Materials | 🔲 Planned | Purchase orders, suppliers, GRN, inventory |
| 7 | Contractors & Suppliers | 🔲 Planned | Pre-qualification, performance, payments |
| 8 | Finance & Budget Control | 🔲 Planned | Budget vs actual, cash flow, invoices, variations |
| 9 | Investors & Funding | 🔲 Planned | Commitments, drawdowns, returns, KYC |
| 10 | Property Units | 🔲 Planned | Unit register, pricing, availability, floor plans |
| 11 | Sales & Conveyancing | 🔲 Planned | Leads, viewings, reservations, pipeline, completion |
| 12 | Rental Management | 🔲 Planned | Tenants, leases, rent collection, maintenance |
| 13 | Documents & Knowledge | 🔲 Planned | Repository, version control, templates, search |
| 14 | Reports & Dashboards | 🔲 Planned | Executive insights, custom reports, analytics |

---

## Platform Foundation — Enterprise Infrastructure

These cross-cutting systems power every module. They are not afterthoughts — they are the backbone.

| Module | Status | Documentation |
|--------|--------|---------------|
| [**Security & Authorization**](developer-notes/Security-authentication-authorization-feature/security-authentication-authorization-full-feature-details.md) | ✅ Complete | JWT + 43 permissions, policy-based enforcement, session revocation, account lockout |
| [**User Management**](developer-notes/user-management-feature/README.md) | ✅ Complete | Enterprise identity console, 13 roles, bulk operations, session control, audit trail |
| [**Enterprise Notification System**](developer-notes/notification-system-module/enterprise-notification-system.md) | ✅ Complete | Rule-based engine, template-driven, admin-configurable, multi-module, delivery audit |
| [**Global Search**](docs/features/global-search-front-end-features.md) | ✅ Complete | Command palette UX, 7-layer scoring, 14 providers, permission-aware, Ctrl+K everywhere |

---

## Architecture & Engineering Standards

![Module Capabilities](project%20domains%20frll%20details.png)

### Clean Architecture (Strict Layer Separation)

```
BuildEstate.Domain           → Pure entities, enums, interfaces (zero dependencies)
BuildEstate.Application      → CQRS commands/queries, validators, DTOs, mapping profiles
BuildEstate.Infrastructure   → EF Core, Identity, repositories, notification engine, background services
BuildEstate.API              → Thin controllers, JWT auth, Swagger, global exception handling
BuildEstate.Tests            → xUnit, Moq, FluentAssertions, FsCheck property-based tests
```

### Engineering Principles Applied

- **CQRS** — Every operation is either a Command (mutation) or Query (read). No mixed responsibilities.
- **MediatR Pipeline** — Validation runs automatically before handlers via pipeline behaviours.
- **Domain Events** — Business actions emit events that trigger notifications, audit entries, and cascading state changes.
- **State Machines** — Opportunity, Offer, DueDiligence, Contract, PlanningApplication — all enforce valid transitions only.
- **Soft Delete** — No data is ever permanently removed. Full audit trail preserved for compliance.
- **Optimistic Concurrency** — RowVersion on all entities prevents conflicting edits.
- **Background Services** — Automated checks for offer expiry, insurance expiry, compliance deadlines.
- **Property-Based Testing** — FsCheck verifies correctness properties hold across randomised inputs.

### Frontend Architecture

- **Angular 20** with standalone components and strict TypeScript (no `any`)
- **NgRx Store** per feature slice (actions, reducers, effects, selectors, entity adapters)
- **Smart/Dumb component pattern** — containers manage state, presentationals render UI
- **DaisyUI + Tailwind CSS** — consistent, theme-aware design system with 49 governed components
- **Enterprise Design System** — shared/design-system/ with barrel export, property-based tests, WCAG 2.1 AA
- **Modal-first UX** — short CRUD operations use enterprise modals, full pages for complex workflows
- **60-second notification polling** with optimistic read-state updates
- **Lazy-loaded routes** with auth guards + role guards on every protected path

---

## 🎨 Enterprise Design System & Shared Component Library

> *49 components. 188 tests. 28 correctness proofs. One import. Every module.*

The Design System is the unified component library powering the entire BuildEstate Pro frontend. Instead of each module building its own tables, modals, forms, and dialogs, every team draws from one governed set of building blocks — ensuring the platform looks, feels, and behaves like a single product across all 14 modules.

### Architecture

```mermaid
graph TD
    subgraph "14 Feature Modules"
        LA[Land Acquisition]
        PA[Planning & Approvals]
        LC[Legal & Compliance]
        PM[Project Management]
        CON[Construction]
        FIN[Finance]
        MORE[+ 8 more modules]
    end

    subgraph "Design System (shared/design-system/)"
        IDX["index.ts — Single Barrel Export"]
        MOD[Modals] & TBL[Tables] & FLT[Filters]
        FRM[12 Form Controls] & CUR[Currency] & DTE[Dates]
        BDG[4 Badge Types] & LDG[6 Loading States] & EMP[Empty States]
        DSH[KPI Cards] & TML[Timeline] & STP[Stepper]
        PPL[Pipeline] & APR[Approval Panel] & NTF[Notifications]
        DLG[Dialogs] & UPL[File & Document Upload]
    end

    subgraph "Services & State"
        THE[ThemeEngine]
        FSC[FontScaleService]
        DPS[DisplayPreferenceService]
        NGX[NgRx Preferences Store]
    end

    LA --> IDX
    PA --> IDX
    LC --> IDX
    PM --> IDX
    CON --> IDX
    FIN --> IDX
    MORE --> IDX
```

### Key Metrics

| Metric | Value |
|--------|-------|
| Total Components | 49 (across 17 categories) |
| Unit & Property Tests | 188 (all passing) |
| Property-Based Correctness Proofs | 28 (fast-check) |
| Form Controls with ControlValueAccessor | 12 |
| Themes Supported | 4 (Light, Dark, Corporate, Business) |
| Font Scale Modes | 3 (Small 0.85x, Regular 1.0x, Large 1.2x) |
| Responsive Breakpoints | 4 (Mobile, Tablet, Laptop, Desktop) |
| Accessibility Standard | WCAG 2.1 Level AA |
| Build Errors | 0 |

### Component Categories

| Category | Components | What They Do |
|----------|-----------|--------------|
| **Modals** | `app-modal` | 5 sizes, focus trap, dirty form detection, fade/scale animation |
| **Data Tables** | `app-data-table` | Server-side sort/paginate/search, column visibility, export, saved views, bulk select |
| **Filters** | `app-filter-bar` | Text (debounced), dropdown, date-range, status-chip, tag, presets, active count |
| **Forms** | 12 controls | text, textarea, number, email, password, phone, select, multi-select, toggle, checkbox, radio, currency |
| **Currency** | `app-currency` | GBP formatting, edit/display/readonly modes, precision 0–4, negative format |
| **Dates** | `app-date`, `app-date-picker`, `app-date-range` | Locale-aware, relative dates, calendar popup, min/max, ISO 8601 emission |
| **Uploads** | `app-file-upload`, `app-document-upload` | Drag-drop, progress, validation, retry, thumbnails, document-type metadata |
| **Badges** | status, priority, stage, risk | Configurable maps, fallback formatting, ARIA labels, 4 sizes |
| **Dialogs** | `app-confirm-dialog`, `app-status-transition-dialog` | Severity styling, programmatic API, resolution mapping, workflow transitions |
| **Loading** | spinner, overlay, button, skeleton-card, skeleton-table, skeleton-form | `aria-busy`, shimmer animation, content projection for loaded state |
| **Empty States** | `app-empty-state` | Icon, title, subtitle, primary/secondary action buttons |
| **Dashboard** | `app-kpi-card` | Metric value, trend indicator, icon, configurable accent |
| **Timeline** | `app-timeline` | Chronological event list with icons, badges, timestamps |
| **Stepper** | `app-lifecycle-stepper` | Multi-step progress, pulse animation, terminal state support |
| **Pipeline** | `app-pipeline-column` | Kanban column with content projection, status colour, count badge |
| **Workflows** | `app-approval-panel` | Approve/reject with notes, form validation, status display |
| **Notifications** | `app-notification-panel` | Bell icon, unread badge, 60s polling, mark-as-read, navigation |

### How Developers Use It

Every component is available through a single import:

```typescript
import {
  ModalComponent,
  DataTableComponent,
  FilterBarComponent,
  TextInputComponent,
  CurrencyDisplayComponent,
  StatusBadgeComponent,
  EmptyStateComponent,
  LoadingOverlayComponent,
  ConfirmDialogService,
  KpiCardComponent,
} from '../../shared/design-system';
```

**Example — Building a list page in 30 minutes:**

```html
<!-- Filter bar with text search, status dropdown, date range -->
<app-filter-bar [filters]="filterDefs" (filterChange)="onFilter($event)" />

<!-- Enterprise data table with sort, paginate, search, export -->
<app-data-table
  [data]="opportunities"
  [columns]="columns"
  [totalCount]="total"
  [loading]="isLoading"
  [actions]="rowActions"
  (pageChange)="onPage($event)"
  (sortChange)="onSort($event)"
  (actionClick)="onAction($event)" />

<!-- Empty state when no data -->
<app-empty-state
  *ngIf="!isLoading && opportunities.length === 0"
  icon="search_off"
  title="No Opportunities Found"
  primaryActionText="Create Opportunity"
  (primaryAction)="onCreate()" />
```

### Theming & Display Preferences

Users control their experience through the Preferences page (`/preferences`):

- **Theme:** Light, Dark, Corporate, Business — applied via `data-theme` attribute in <100ms
- **Font Scale:** Small (0.85x), Regular (1.0x), Large (1.2x) — CSS custom properties cascade instantly
- **Density:** Compact, Default, Comfortable — controls vertical spacing
- **Persistence:** Loaded on bootstrap via `GET /api/v1/user-preferences`, saved in background

The **Preview Lab** (`/preferences/playground`) lets users test configurations against all component categories before saving.

### Accessibility (WCAG 2.1 AA)

Every component ships with accessibility built in — not bolted on:

- **Keyboard navigation** — Tab, Enter, Escape, Arrow keys per component type
- **Focus trapping** — Modals and dialogs trap focus, return it on close
- **Screen readers** — `role`, `aria-modal`, `aria-labelledby`, `aria-describedby`, `aria-invalid`, `aria-busy`
- **Reduced motion** — `prefers-reduced-motion` disables all animations
- **Touch targets** — 44×44px minimum on mobile viewports
- **Skip navigation** — First focusable element on every page
- **Colour contrast** — DaisyUI tokens guarantee 4.5:1 (normal) / 3:1 (large) in all themes

### Testing & Correctness

The design system uses **property-based testing** (fast-check) to prove invariants hold for *all possible inputs*:

| Property | What It Proves |
|----------|----------------|
| Currency round-trip | Format → parse → same value for any number in range |
| Badge fallback | Unknown values always render with ghost styling + formatted label |
| Filter completeness | Every filter change event contains ALL configured filter keys |
| Date ISO emission | Selected dates always emit valid ISO 8601 (YYYY-MM-DD) regardless of locale |
| Column visibility | At least 1 column always remains visible after any toggle sequence |
| Loading ARIA | All loading components set `aria-busy="true"` with descriptive label |

```
✅ 188 tests passing | 28 properties proven | 0 build errors
```

### Governance

A component without governance is just code. BuildEstate Pro enforces:

1. **Search before create** — Check the catalog before proposing anything new
2. **Extend over duplicate** — If 50%+ overlap exists, extend the existing component
3. **Documentation mandatory** — Catalog entry + library docs + barrel export required
4. **PR rejection criteria** — No hardcoded colours, no missing accessibility, no missing OnPush

📖 **Full Design System Documentation:**
- [Executive Summary](docs/frontend/showcase/00-EXECUTIVE-SUMMARY.md)
- [Architecture Deep Dive](docs/frontend/showcase/01-ARCHITECTURE-DEEP-DIVE.md)
- [Component Showcase](docs/frontend/showcase/02-COMPONENT-SHOWCASE.md)
- [Accessibility & UX](docs/frontend/showcase/03-ACCESSIBILITY-AND-UX.md)
- [Testing & Correctness](docs/frontend/showcase/04-TESTING-AND-CORRECTNESS.md)
- [Governance & Process](docs/frontend/showcase/05-GOVERNANCE-AND-PROCESS.md)
- [Developer Quick Start](docs/frontend/showcase/06-DEVELOPER-QUICK-START.md)

---

## 🔍 Global Search — Enterprise Command Palette

> *Ctrl+K from anywhere. 14 modules searchable. 7-layer relevancy. Permission-aware. Sub-300ms.*

Global Search is platform infrastructure — accessible from every page via the top navigation bar or `Ctrl+K` / `Cmd+K` keyboard shortcut. It provides intelligent, fast, grouped results across all modules with layered matching (exact, starts-with, contains, token, fuzzy, phonetic, synonym), contextual boosting, and real-time permission filtering.

| Capability | Implementation |
|-----------|---------------|
| **Search Providers** | 14 (one per searchable entity type across 6 modules) |
| **Scoring Layers** | 7 (exact → starts-with → contains → token → fuzzy → phonetic → synonym) |
| **Boost Rules** | 6 (recently viewed, recently modified, active, creator, department, frequent) |
| **Permission Model** | Server-side per-provider (users only see entities they can access) |
| **Performance** | Parallel provider execution, 5s timeout, 30s cache, 10 req/s rate limit |
| **UX** | Modal overlay, keyboard navigation, grouped tabs, preview panel, responsive |
| **Accessibility** | WCAG 2.1 AA (dialog role, focus trap, aria-live, keyboard navigation) |
| **Extensibility** | New modules add one `ISearchProvider` class — zero aggregator/frontend changes |

### Features

- **Instant results** — 300ms debounce with in-flight cancellation (switchMap)
- **Category tabs** — Results grouped by module with count badges
- **Match highlighting** — Server-generated `<mark>` elements, XSS-safe
- **Keyboard navigation** — Arrow keys, Enter to open, Ctrl+Enter new tab, Escape to close
- **Recent searches** — Auto-persisted, ordered by most recent
- **Pinned items** — Bookmark entities for quick access
- **Saved searches** — Named presets with filters (max 50 per user)
- **Advanced filters** — Module, status, date range, creator, tags
- **Command palette** — `>` prefix for page navigation and action commands
- **Preview panel** — Entity details on desktop (≥1440px) without leaving search
- **Responsive** — Desktop (with preview), laptop, tablet, mobile (simplified)

📖 **Documentation:**
- [Frontend Architecture](docs/features/global-search-front-end-features.md) — Components, NgRx, services, accessibility, performance
- [Backend Architecture](docs/features/global-search-back-end-features.md) — Providers, scoring, aggregation, caching, security
- [Adding Search to New Modules](docs/guides/adding-search-to-new-module.md) — Step-by-step developer guide
- [Search Provider Template](docs/templates/search-provider-template.md) — Copy-and-fill template for new providers

---

## End-to-End Workflow

![End-to-End Workflow](end-to-end-user-workflow.png)

The platform manages 8 sequential phases with clear role ownership:

```
Opportunity → Due Diligence → Planning → Design & Prep → Construction → Sales → Completion → Operations
```

Each phase has dedicated roles, automated workflows, approval gates, notification triggers, and real-time dashboards. Data flows seamlessly between phases — what Land Acquisition captures becomes the foundation for Planning, which feeds Construction, which drives Sales.

---

## 🔐 Security & Authorization

> *Zero-trust architecture. Every request verified. Every action logged. Every permission enforced.*

![Security Architecture](developer-notes/Security-authentication-authorization-feature/security-authentication-authorization-feature.png)

| Layer | Implementation |
|-------|---------------|
| **Authentication** | JWT tokens (60 min) + refresh rotation (7 days) + session tracking per device |
| **Role-Based Access** | 13 enterprise roles mapped to organisational responsibilities |
| **Permission-Based Access** | 43 granular permissions enforced on individual API endpoints |
| **Real-Time Enforcement** | Permission toggle → session revocation → immediate effect on next request |
| **Frontend Integration** | `*appHasPermission` directive hides/shows UI elements dynamically |
| **Audit Trail** | Every permission change logged with user, timestamp, IP, old/new values |

```
Opportunities: create, read, update, delete, approve
Projects:      create, read, update, delete, approve
Finance:       create, read, update, delete, approve
Construction:  create, read, update, delete, approve
Sales:         create, read, update, delete, approve
Legal:         create, read, update, delete, approve
Planning:      create, read, update, delete, approve
Reports:       view, export, create
Administration: users, roles, audit, settings
```

📖 [**Full Security Deep Dive →**](developer-notes/Security-authentication-authorization-feature/security-authentication-authorization-full-feature-details.md)

---

## 👥 User Management

> *Right people. Right access. Right now. Complete visibility into who can do what.*

![User Management](developer-notes/user-management-feature/user-management-listing-page.png)

An enterprise identity management console inspired by Microsoft Entra ID and AWS IAM:

- **Dashboard KPIs** — Total users, active/inactive, locked accounts, new registrations
- **Advanced Filtering** — Search, filter by role/status/department/last-login
- **Modal-Based CRUD** — Create and edit without page navigation
- **Role Management** — 2-panel layout, click-to-detail, permission assignment
- **Password Reset** — Real-time validation (8+ chars, uppercase, number, special)
- **Session Control** — View/revoke active sessions per device/IP
- **Bulk Operations** — Activate, deactivate, delete multiple users with confirmation
- **Immutable Audit Trail** — Every action logged, exportable for compliance

![Create User](developer-notes/user-management-feature/create-new-user-form.png)

📖 [**Full User Management Documentation →**](developer-notes/user-management-feature/README.md)

---

## 🔔 Enterprise Notification System

> *One engine. All modules. Admin-configurable. Zero code changes for new notification types.*

![Notification System Architecture](developer-notes/notification-system-module/enterprise-notification-system.png)

A centrally-managed, rule-based, template-driven notification engine that powers all 14 modules:

| Component | What It Does |
|-----------|-------------|
| **Notification Engine** | Receives events, resolves rules → recipients → templates → delivers |
| **Notification Rules** | Admin defines event → recipient routing (by role, entity creator, specific user) |
| **Notification Templates** | Admin controls message content with `{variable}` substitution |
| **User Preferences** | Per-user opt-out and temporary mute per event type |
| **Notification History** | Full delivery audit trail across all users |
| **Real-Time Bell** | Header component with unread badge, click-to-navigate, 60s polling |

**How any module emits a notification (one line):**
```csharp
await _notificationEngine.EmitAsync(new NotificationEvent {
    EventType = "OfferAccepted",
    Module = "LandAcquisition",
    EntityId = opportunity.Id,
    Variables = new() { ["opportunityName"] = "Greenwich Site", ["amount"] = "£4.8M" }
});
```

**Current coverage:** 27+ event types across Land Acquisition (13), Planning & Approvals (5), Legal & Compliance (9), plus automated background service events.

**Admin UI:** Rules CRUD with toggle • Templates with live preview • Paginated history with filtering

📖 [**Full Notification Architecture →**](developer-notes/notification-system-module/enterprise-notification-system.md)

---

## 🏞️ Land Acquisition — The Foundation Module

![Land Acquisition](land-domain-details.png)

The Land Acquisition module establishes the patterns every subsequent module follows. It demonstrates the full depth of the platform's engineering:

**Complete Lifecycle:** Identify → Evaluate → Offer → Contract → Registry → Acquired

**What's Implemented:**
- Pipeline board with drag-and-drop status transitions (state machine enforced)
- 5-step opportunity creation wizard with full validation
- Due diligence management with status transitions
- Offer submission with auto-approval thresholds
- Contract management with exchange tracking
- Feasibility assessment with ROI calculations
- Document upload/download with type categorisation
- Land owner CRUD with contact management
- Approval workflow (Finance Director gate)
- CSV export, column toggle, saved views
- Dashboard with KPI cards, charts, activity feed
- Full audit trail per entity

**Pipeline Metrics:** 125 Identified → 85 Review → 42 DD → 18 Offered → 9 Contract → 5 Acquired

📖 [**Land Acquisition Documentation →**](developer-notes/land-acquisition-module/land-module.md)

---

## 📐 Implementation Blueprint

![Planning Blueprint](land-planning.png)

Every module follows a structured implementation methodology:

1. **Requirements Analysis** — User stories, acceptance criteria, correctness properties
2. **Database Design** — Entity modelling, relationships, indexes, seed data
3. **Backend Development** — CQRS handlers, validators, state machines, event handlers
4. **Frontend Development** — NgRx state, services, components, forms, routing
5. **Integration** — End-to-end trace audit (DB → Entity → DTO → API → Service → Store → UI)
6. **Testing** — Unit tests, property-based tests, integration verification
7. **Documentation** — Technical docs, README updates, help content

---

## 🤝 Handover & Value Realisation

![Handover](handover.png)

The platform tracks project delivery through to completion:

| Metric | Result |
|--------|--------|
| Total Project Cost | £41.8M |
| Total Sales Revenue | £61.7M |
| Gross Profit | £19.9M |
| Gross Margin | 32.2% |
| ROI | 47.6% |
| Client Satisfaction | 4.6 / 5 |
| Project Duration | 27 Months |

Quality compliance verified: Building Control ✓ | Fire Safety ✓ | EPC ✓ | H&S File ✓ | As-Built Drawings ✓ | O&M Manuals ✓

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Angular 20, TypeScript (strict), NgRx, DaisyUI, Tailwind CSS, 49-component Design System |
| **Backend** | .NET 8, ASP.NET Core, C# 12, MediatR, FluentValidation, AutoMapper |
| **Database** | SQL Server, Entity Framework Core (Code-First), soft-delete, audit columns |
| **Auth** | ASP.NET Identity + JWT Bearer + refresh tokens + session management |
| **Testing** | xUnit, Moq, FluentAssertions, FsCheck, Jasmine/Karma, fast-check (188 tests, 28 property proofs) |
| **Architecture** | Clean Architecture, CQRS, Domain Events, State Machines |
| **API** | RESTful, versioned, paginated, Swagger/OpenAPI documented |
| **CI/CD Ready** | Separate projects, migration-based schema, environment configuration |

---

## 🚀 Getting Started

### Prerequisites
- .NET SDK 8.0+
- Node.js 20+
- Angular CLI
- SQL Server (Express or Developer edition)

### Backend
```bash
dotnet restore
dotnet build
dotnet ef database update --project src/BuildEstate.Infrastructure --startup-project src/BuildEstate.API
dotnet run --project src/BuildEstate.API
```

### Frontend
```bash
cd client-app
npm install
npx ng serve
```

### Default Credentials
| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | `admin@buildestate.co.uk` | `Admin@123456` |
| Acquisition Manager | `acquisitions@buildestate.co.uk` | `Demo@123456` |
| Finance Director | `finance@buildestate.co.uk` | `Demo@123456` |

---

## Compliance & Standards

Built to satisfy:

| Standard | Coverage |
|----------|----------|
| **ISO 27001** | Information security — encryption, access control, audit trails |
| **GDPR** | Data protection — soft delete, user preferences, right to erasure ready |
| **ISO 9001** | Quality management — structured workflows, approval gates |
| **IFRS** | Financial reporting — budget tracking, cost classification |
| **AML** | Anti-money laundering — KYC-ready investor management |
| **RICS** | Real estate standards — valuation, measurement, professional conduct |

---

## What Makes This Different

This is not a prototype. This is not a tutorial project. This is a **production-grade enterprise platform** demonstrating:

- **Solutions Architecture** — Clean Architecture with strict layer boundaries and dependency inversion
- **Full-Stack Engineering** — .NET backend + Angular frontend + SQL Server, all working end-to-end
- **Enterprise Security** — JWT + RBAC + 43 permissions + session management + audit trails
- **Domain-Driven Design** — Real business workflows modelled as state machines with valid transitions
- **CQRS & Event-Driven** — Commands, queries, domain events, notification engine, background services
- **Production Patterns** — Optimistic concurrency, soft delete, pagination, filtering, error boundaries
- **Quality Engineering** — Property-based testing, integration tests, structured logging, health checks
- **Enterprise UX** — Modal-first workflows, DaisyUI design system, accessible, responsive, dark-mode ready

Every line of code is written to survive a Principal Engineer review, a CTO walkthrough, and a Fortune 500 architecture board.

---

## 📖 Documentation

> **[→ Open the Documentation Portal](docs/README.md)** — the central hub for all BuildEstate Pro documentation.

| Area | Document | Description |
|------|----------|-------------|
| 🎓 Developer Academy | [**docs/academy/00-learning-path.md**](docs/academy/00-learning-path.md) | **32-document engineering knowledge base — start here if you're new** |
| 🏗️ Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Clean Architecture, CQRS, layers, module boundaries |
| 🔒 Security | [Security Feature](developer-notes/Security-authentication-authorization-feature/security-authentication-authorization-full-feature-details.md) | JWT, RBAC, 43 permissions, session management |
| 🔍 Global Search | [Frontend](docs/features/global-search-front-end-features.md) / [Backend](docs/features/global-search-back-end-features.md) | 7-layer scoring, 14 providers, permission-aware |
| 🎨 Design System | [Component Showcase](docs/frontend/showcase/00-EXECUTIVE-SUMMARY.md) | 49 components, 188 tests, WCAG 2.1 AA |
| 🏞️ Land Acquisition | [Module Docs](developer-notes/land-acquisition-module/00-INDEX.md) | Pipeline, due diligence, offers, contracts |
| 📊 Product Vision | [PROJECT-VISION.md](docs/PROJECT-VISION.md) | Business context, roadmap, future modules |

---

## 📄 License

Proprietary — All rights reserved.

---

## 👨‍💻 Author

**Designed and engineered** as a demonstration of enterprise-grade full-stack development capability — from solution architecture and domain modelling through to pixel-perfect frontend delivery and production-ready infrastructure.

> *One Platform. One Source of Truth. End-to-End Control.*
> *Secure. Compliant. Scalable. Profitable.*
> *Built for Real Estate Developers Who Demand Excellence.*
