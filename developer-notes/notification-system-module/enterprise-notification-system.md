# BuildEstate Pro — Enterprise Notification System

## Technical Architecture Documentation

![Enterprise Notification System Architecture](enterprise-notification-system.png)

---

## Overview

BuildEstate Pro implements a **centrally-managed, rule-based, template-driven notification engine** that is fully decoupled from business modules. Any module in the platform (Land Acquisition, Planning & Approvals, Legal & Compliance, Construction, Finance, Sales — all 14 modules) can emit notification events without knowing anything about recipients, delivery channels, or message formatting.

The SuperAdmin controls the entire notification matrix through a web-based admin interface — **no code changes required** to add, modify, or disable notifications for any module.

---

## Design Principles

| Principle | Description |
|-----------|-------------|
| **Module-Agnostic** | Any module can emit notifications without knowing how delivery works |
| **Admin-Configurable** | SuperAdmin controls what events go to whom, via what channel, without code changes |
| **Multi-Channel Ready** | In-App now, Email/SMS/Teams/Webhook extensible in future |
| **Template-Driven** | Message content is configurable with variable substitution |
| **Auditable** | Every notification sent is logged with delivery status |
| **User-Controllable** | Each user can mute or opt-out of specific notification types |
| **Self-Notification Prevention** | Users never receive notifications about their own actions |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Angular 20)                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Notification Bell │  │ Admin: Rules     │  │ Admin:       │ │
│  │ (Real-time panel) │  │ CRUD + Toggle    │  │ Templates    │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │ GET /notifications   │ /notification-rules│ /templates│
└───────────┼──────────────────────┼───────────────────┼──────────┘
            │                      │                   │
┌───────────┼──────────────────────┼───────────────────┼──────────┐
│  API LAYER (ASP.NET Core)        │                   │          │
│  ┌────────┴─────────┐  ┌────────┴─────────┐  ┌──────┴───────┐ │
│  │Notifications      │  │NotificationRules │  │Notification  │ │
│  │Controller         │  │Controller (Admin)│  │Templates Ctrl│ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
            │
┌───────────┼─────────────────────────────────────────────────────┐
│  APPLICATION LAYER (CQRS Handlers / Event Handlers)             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Any module handler calls:                               │    │
│  │  await _notificationEngine.EmitAsync(NotificationEvent) │    │
│  └────────────────────────────┬────────────────────────────┘    │
└───────────────────────────────┼─────────────────────────────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────┐
│  NOTIFICATION ENGINE (Infrastructure Layer)                     │
│                                                                  │
│  Step 1 → Rule Lookup ─── Find active rules matching EventType  │
│  Step 2 → Recipient Resolution ─── Role / Creator / Specific   │
│  Step 3 → Preference Check ─── User opt-out / mute respected   │
│  Step 4 → Self-Skip ─── Don't notify triggering user           │
│  Step 5 → Template Resolution ─── Variable substitution        │
│  Step 6 → Notification Creation ─── Persisted to database      │
└─────────────────────────────────────────────────────────────────┘
            │
┌───────────┼─────────────────────────────────────────────────────┐
│  DATABASE (SQL Server)                                          │
│  ┌────────────────┐ ┌──────────────────┐ ┌───────────────────┐ │
│  │ Notifications   │ │ NotificationRules│ │NotificationTemplates│
│  │ (delivery log)  │ │ (routing config) │ │(message content)  │ │
│  └────────────────┘ └──────────────────┘ └───────────────────┘ │
│  ┌──────────────────────────┐                                   │
│  │ UserNotificationPrefs    │                                   │
│  │ (per-user opt-out/mute)  │                                   │
│  └──────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## How Notifications Are Raised

Every module handler injects `INotificationEngine` and emits a single event:

```csharp
await _notificationEngine.EmitAsync(new NotificationEvent
{
    EventType = "OfferAccepted",
    Module = "LandAcquisition",
    EntityId = opportunity.Id,
    EntityType = "LandOpportunity",
    RelatedUrl = $"/land-acquisition/opportunities/{opportunity.Id}",
    Variables = new Dictionary<string, string>
    {
        ["opportunityName"] = "Greenwich Site",
        ["amount"] = "4,800,000.00"
    },
    TriggeredByUserId = currentUser.Id
}, cancellationToken);
```

The handler knows nothing about WHO receives the notification, HOW it's delivered, or WHAT the message says. All routing and content is configured by the admin through the UI.

---

## The Notification Engine — 6-Step Processing Pipeline

### Step 1: Rule Lookup

The engine queries all active rules matching the event type:

```sql
SELECT * FROM NotificationRules
WHERE EventType = 'OfferAccepted' AND IsActive = 1 AND IsDeleted = 0
```

Multiple rules can match — each defines a different recipient path.

### Step 2: Recipient Resolution

Based on the rule's `RecipientType` enum:

| RecipientType | Resolution Logic |
|---------------|-----------------|
| `Role` | Queries Identity `UserRoles + Roles` tables → finds all users with that role |
| `EntityCreator` | Queries the entity's `CreatedBy` field → finds the original creator |
| `SpecificUser` | Directly uses the configured userId |
| `AllModuleRoles` | Resolves all roles mapped to the module (configurable per module) |

### Step 3: User Preference Check

For each resolved recipient:

```sql
SELECT * FROM UserNotificationPreferences
WHERE UserId = @userId AND EventType = 'OfferAccepted'
```

- If `InAppEnabled = false` → recipient is skipped
- If `MutedUntil > DateTime.UtcNow` → recipient is skipped (temporary mute)

### Step 4: Self-Notification Prevention

If a resolved recipient is the same user who triggered the event → skip. Users don't receive notifications about their own actions.

### Step 5: Template Resolution

The rule references a `NotificationTemplate`. The engine performs variable substitution:

```
TitleTemplate: "Offer Accepted — {opportunityName}"
BodyTemplate: "An offer of £{amount} has been accepted for {opportunityName}"

Result Title: "Offer Accepted — Greenwich Site"
Result Body: "An offer of £4,800,000.00 has been accepted for Greenwich Site"
```

### Step 6: Notification Persistence

A `Notification` record is created per recipient:

```sql
INSERT INTO Notifications
(RecipientUserId, EventType, Module, Title, Message, Icon, Severity, Priority,
 RelatedEntityId, RelatedEntityType, RelatedUrl, Channel, DeliveryStatus, SentAt)
VALUES (...)
```

---

## Database Schema

### NotificationRules — Routing Configuration (Admin-Managed)

| Column | Type | Purpose |
|--------|------|---------|
| Id | Guid (PK) | Unique rule identifier |
| EventType | string(100) | Business event that triggers this rule |
| Module | string(100) | Owning module (LandAcquisition, Planning, Legal, etc.) |
| Description | string | Human-readable description for admin UI |
| RecipientType | enum | Role, SpecificUser, EntityCreator, AllModuleRoles |
| RecipientValue | string | Role name, userId, or module name |
| Channel | enum | InApp, Email, Both |
| Priority | enum | Low, Normal, High, Urgent |
| TemplateId | Guid (FK) | Links to NotificationTemplate |
| IsActive | bool | Toggle on/off without deletion |

### NotificationTemplates — Message Content (Admin-Managed)

| Column | Type | Purpose |
|--------|------|---------|
| Id | Guid (PK) | Unique template identifier |
| Name | string | Human-readable name |
| EventType | string | Which event this template serves |
| TitleTemplate | string | Title with `{variable}` placeholders |
| BodyTemplate | string | Body with `{variable}` placeholders |
| IconName | string | Material Symbols icon (e.g., "check_circle") |
| Severity | enum | Info, Success, Warning, Error |
| Variables | JSON | Array of available variable names |
| IsActive | bool | Active/inactive toggle |

### Notifications — Delivery Log (System-Generated)

| Column | Type | Purpose |
|--------|------|---------|
| Id | Guid (PK) | Unique notification |
| RecipientUserId | string | Who received it |
| EventType | string | What triggered it |
| Module | string | Which module |
| Title | string | Resolved title (variables substituted) |
| Message | string | Resolved body |
| Icon | string | From template |
| Severity | string | Info/Success/Warning/Error |
| Priority | string | Low/Normal/High/Urgent |
| RelatedEntityId | Guid? | Clickable entity reference |
| RelatedEntityType | string | For frontend routing |
| RelatedUrl | string | Deep-link URL |
| IsRead | bool | User has seen it |
| ReadAt | DateTime? | When marked read |
| Channel | string | InApp/Email/Both |
| DeliveryStatus | string | Delivered/Failed/Pending |
| SentAt | DateTime | When engine created it |

### UserNotificationPreferences — Per-User Opt-Out

| Column | Type | Purpose |
|--------|------|---------|
| UserId | string | The user |
| EventType | string | Which event type |
| InAppEnabled | bool | Opt-out of in-app (default: true) |
| EmailEnabled | bool | Opt-out of email (default: true) |
| MutedUntil | DateTime? | Temporary mute (1h / 1d / 1w) |

---

## Admin Management Interface

### Notification Rules Page (`/admin/notification-rules`)

- Table showing all configured rules with module filter dropdown
- Inline active/inactive toggle — disable a rule instantly without deleting
- Create rule modal: event type, module, recipient type, channel, priority, template selector
- Edit and delete with confirmation dialogs
- Module-scoped filtering (view only Land Acquisition rules, only Planning rules, etc.)

### Notification Templates Page (`/admin/notification-templates`)

- Card grid showing all templates with live preview
- Title and body with highlighted `{variable}` syntax
- Severity badge and icon preview
- Create/edit modal with variable list, icon picker, severity selector
- Search and filter by name or event type

### Notification History Page (`/admin/notification-history`)

- Full audit trail of ALL sent notifications across all users
- Filterable by: module, event type, date range, read/unread status
- Server-side pagination (25 per page)
- Columns: sent timestamp, recipient, event, module, title, severity, channel, delivery status, read status

---

## Notification Event Matrix

### Land Acquisition Module (13 Templates, 10 Rules)

| Event | Default Recipients | Priority | Template Example |
|-------|-------------------|----------|------------------|
| OpportunityCreated | AcquisitionManager (Role) | Low | "New Opportunity: {opportunityName}" |
| OpportunityAcquired | All LA Roles | High | "Land Acquired: {opportunityName}" |
| OpportunityWithdrawn | Entity Creator | Normal | "Opportunity Withdrawn: {opportunityName}" |
| OfferSubmitted | FinanceDirector (Role) | Normal | "New Offer: {opportunityName} — £{amount}" |
| OfferAccepted | Entity Creator | High | "Offer Accepted: {opportunityName}" |
| OfferExpired | Entity Creator | High | "Offer Expired: {opportunityName}" |
| DueDiligenceCompleted | Entity Creator | Normal | "DD Complete: {checkType} — {opportunityName}" |
| DueDiligenceFailed | Entity Creator | High | "DD Failed: {checkType} — {opportunityName}" |
| ApprovalRequested | FinanceDirector (Role) | Urgent | "Approval Needed — £{amount}" |
| ApprovalDecided | Entity Creator | High | "Approval Decision: {decision}" |
| ContractExchanged | All LA Roles | High | "Contract Exchanged: {opportunityName}" |
| DocumentUploaded | Entity Creator | Low | "New Document: {docType}" |
| FeasibilityReady | FinanceDirector (Role) | Normal | "Feasibility Ready for Review" |

### Planning & Approvals Module

| Event | Default Recipients | Priority |
|-------|-------------------|----------|
| ApplicationStatusChanged | PlanningManager, AcquisitionManager | High |
| FeeRequiresApproval | FinanceDirector | High |
| MilestoneOverdue | PlanningManager | High |
| AllConditionsDischarged | PlanningManager | Normal |
| AppealAllowed | PlanningManager, LegalOfficer | High |

### Legal & Compliance Module

| Event | Default Recipients | Priority |
|-------|-------------------|----------|
| LegalCaseEscalated | FinanceDirector, LegalOfficer | Urgent |
| InsuranceExpiringSoon | LegalOfficer | High |
| InsuranceExpired | LegalOfficer, FinanceDirector | Urgent |
| ContractExecuted | LegalOfficer, AcquisitionManager | Normal |
| ContractTerminated | LegalOfficer, AcquisitionManager | High |
| ComplianceCheckNonCompliant | LegalOfficer, FinanceDirector | Urgent |
| AuditActionOverdue | LegalOfficer | High |
| ComplianceRequirementOverdue | Responsible Role (dynamic) | High |
| DocumentRetentionExpiring | LegalOfficer | Normal |

---

## Frontend Delivery

### Notification Bell (Header Component)

- `NotificationPanelComponent` embedded in the application shell header
- Polls `GET /api/v1/notifications?limit=20` every 60 seconds
- Displays unread count badge (capped at 99+)
- Dropdown panel shows: colour-coded icon, title, description, relative timestamp, unread dot
- Click notification → marks as read (optimistic UI update) + navigates to the related entity
- "View All Notifications" → navigates to admin notification history
- 18 event types mapped to Material Symbols icons with severity-based colouring:
  - Green (success): OfferAccepted, OpportunityAcquired, ContractExchanged, DueDiligenceCompleted
  - Amber (warning): ApprovalRequested, OfferExpired
  - Red (error): DueDiligenceFailed, OpportunityWithdrawn
  - Blue (info): OpportunityCreated, DocumentUploaded, StatusChange

### Navigation on Click

When a user clicks a notification, the app navigates to the related entity:
- `LandOpportunity` → `/land-acquisition/opportunities/{id}`
- `PlanningApplication` → `/planning-approvals/applications/{id}`
- `LegalCase` → `/legal-compliance/cases/{id}`

---

## Adding Notifications for New Modules

When a new module (e.g., Construction, Finance, Sales) is developed:

**Step 1 — Developer** (one line per event):
```csharp
await _notificationEngine.EmitAsync(new NotificationEvent {
    EventType = "InspectionFailed",
    Module = "Construction",
    EntityId = inspection.Id,
    EntityType = "SiteInspection",
    RelatedUrl = $"/construction/inspections/{inspection.Id}",
    Variables = new() { ["inspector"] = inspector.Name, ["site"] = site.Name }
});
```

**Step 2 — SuperAdmin** (via admin UI, no code deployment):
1. Create a **Template**: Name="Inspection Failed", Title="Inspection Failed — {site}", Body="{inspector} reported issues at {site}"
2. Create a **Rule**: EventType=InspectionFailed, Module=Construction, RecipientType=Role, RecipientValue=SiteManager, Priority=High

Zero engine code changes. No redeployment for rule/template CRUD.

---

## API Endpoints

### User-Facing

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/notifications?limit=20` | Get current user's recent notifications |
| PATCH | `/api/v1/notifications/{id}/read` | Mark notification as read |
| GET | `/api/v1/notifications/unread-count` | Get unread count for badge |

### Admin (SuperAdmin Only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/notifications/all` | All notifications with filtering & pagination |
| GET | `/api/v1/notification-rules` | List all rules (with module filter) |
| GET | `/api/v1/notification-rules/{id}` | Get rule by ID |
| POST | `/api/v1/notification-rules` | Create rule |
| PUT | `/api/v1/notification-rules/{id}` | Update rule |
| DELETE | `/api/v1/notification-rules/{id}` | Soft-delete rule |
| PATCH | `/api/v1/notification-rules/{id}/toggle` | Toggle active/inactive |
| GET | `/api/v1/notification-templates` | List all templates |
| GET | `/api/v1/notification-templates/{id}` | Get template by ID |
| POST | `/api/v1/notification-templates` | Create template |
| PUT | `/api/v1/notification-templates/{id}` | Update template |
| DELETE | `/api/v1/notification-templates/{id}` | Soft-delete template |

---

## Security & Governance

- Admin API endpoints protected with `[Authorize(Roles = "SuperAdmin")]`
- User notification API scoped to authenticated user only (`RecipientUserId == currentUser`)
- Soft-delete pattern across all entities (full audit trail, no data loss)
- All records include `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy` for compliance
- UserNotificationPreferences enable GDPR-compliant user control
- Notification History provides compliance-grade audit of all notifications delivered
- Immutable delivery log — notifications cannot be modified after creation

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Domain Entities | C# classes extending `BaseEntity` (soft delete, audit, row version) |
| Engine | `NotificationEngine : INotificationEngine` (Scoped, DI-registered) |
| Database | SQL Server with EF Core Code-First, indexed on `RecipientUserId+IsRead`, `EventType`, `Module`, `SentAt` |
| API | ASP.NET Core controllers, standard `{success, data, errors, pagination}` response envelope |
| Frontend Services | Angular `NotificationService` (user) + `NotificationAdminService` (admin) |
| Frontend UI | `NotificationPanelComponent` (bell), 3 admin pages (rules, templates, history) |
| Seed Data | 13 templates + 10 rules seeded via EF `HasData` for Land Acquisition |
| Tests | All handlers tested with Moq + FsCheck property-based tests |

---

## Extensibility Roadmap

| Capability | Status | Extension Point |
|-----------|--------|-----------------|
| In-App notifications | ✅ Live | `Channel = InApp` |
| Email delivery | Architecture ready | Add SMTP handler when `Channel = Email/Both` |
| SMS / Teams / Webhook | Architecture ready | Add channel handlers per `NotificationChannel` enum |
| SignalR real-time push | Architecture ready | Replace 60s polling with WebSocket push |
| Digest mode (daily/weekly) | Architecture ready | Add scheduler that batches by user preference |
| User preferences UI | Entity + DB exists | Add user-facing settings page |
| Mark all as read | API ready | Add bulk-update endpoint |

---

## Summary

The BuildEstate Pro notification system is not a bolt-on feature — it's an **enterprise notification platform** designed for scalability across all 14 modules. The SuperAdmin has complete control over what gets sent, to whom, through what channel, and with what content — all configurable through the admin UI without touching code.

Any new module simply calls `_notificationEngine.EmitAsync(...)` with the event type and relevant data. The engine handles everything else: rule matching, recipient resolution, preference checking, template rendering, and delivery logging.
