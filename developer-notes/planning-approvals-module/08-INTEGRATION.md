# Planning & Approvals Module — Integration & Wiring

## Dependency Injection Registration

The following services are registered in `BuildEstate.Infrastructure/DependencyInjection.cs`:

### State Machines (Singleton — stateless, thread-safe)
```csharp
services.AddSingleton<IPlanningStatusStateMachine, PlanningStatusStateMachine>();
services.AddSingleton<IConditionStatusStateMachine, ConditionStatusStateMachine>();
services.AddSingleton<IAppealStatusStateMachine, AppealStatusStateMachine>();
services.AddSingleton<IFeeStatusStateMachine, FeeStatusStateMachine>();
```

### Configuration (IOptions pattern)
```csharp
services.Configure<PlanningFeeSettings>(
    configuration.GetSection(PlanningFeeSettings.SectionName));
```

The `PlanningFeeSettings` class has one property:
- `ApprovalThreshold` (decimal, default 10000) — configurable in `appsettings.json`

### Auto-Discovered Services
- **Event Handlers** — Discovered automatically by MediatR's assembly scanning (no manual registration needed)
- **Validators** — Discovered automatically by the FluentValidation pipeline behavior
- **AutoMapper Profiles** — Discovered automatically by assembly scanning

## Domain Events Flow

The module uses domain events for cross-entity side effects:

```
1. TransitionAppealStatus handler → Raises AppealAllowedDomainEvent
   → AppealAllowedEventHandler transitions parent application + sends notifications

2. TransitionConditionStatus handler → Raises AllConditionsDischargedDomainEvent (when all discharged)
   → AllConditionsDischargedEventHandler notifies Planning Manager

3. TransitionApplicationStatus handler → Raises ApplicationStatusChangedDomainEvent
   → ApplicationStatusChangedEventHandler notifies Planning Manager + Acquisition Manager (on decisions)

4. CreateFee handler → Raises FeeRequiresApprovalDomainEvent (when amount > threshold)
   → FeeRequiresApprovalEventHandler notifies Finance Director

5. Milestone overdue detection → Raises MilestoneOverdueDomainEvent
   → MilestoneOverdueEventHandler notifies Planning Manager
```

## Frontend Integration

### App Routing (`app.routes.ts`)
```typescript
{
  path: 'planning-approvals',
  loadChildren: () =>
    import('./features/planning-approvals/planning-approvals.routes')
      .then(m => m.planningApprovalsRoutes)
}
```

### NgRx Store Registration (`app.config.ts`)
```typescript
provideStore({
  planningApplications: applicationReducer,
  planningDashboard: dashboardReducer
}),
provideEffects([ApplicationEffects, DashboardEffects])
```

### Navigation (`core/navigation/nav-items.ts`)
```typescript
{
  label: 'Planning & Approvals',
  routerLink: '/planning-approvals',
  icon: 'assignment',
  roles: ['Planning_Manager', 'Admin_Support', 'Legal_Compliance_Officer', 'Finance_Director'],
  enabled: true
}
```

## Cross-Module Integration

### Land Acquisition → Planning & Approvals
- **Connection point:** `PlanningApplication.OpportunityId → LandOpportunity.Id`
- **Validation:** Handler queries the `LandOpportunity` table to verify `Status = Acquired`
- **API endpoint:** `GET /api/v1/planning-applications/by-opportunity/{opportunityId}` returns planning status for Land Acquisition module to display

### Notification Service
- Uses the shared `INotificationService` interface
- `SendToRoleAsync(roleName, eventType, message, entityId, cancellationToken)` dispatches notifications to all users with the specified role

### Audit Trail
- **Automatic:** The `AuditInterceptor` captures all create/update/delete operations on SaveChanges
- **Manual logging:** Status transitions also log structured events via ILogger
- **Dashboard integration:** `IAuditLogQueryService` reads audit entries for the "Recent Activity" dashboard section

## Configuration

### appsettings.json
```json
{
  "PlanningFeeSettings": {
    "ApprovalThreshold": 10000
  }
}
```

This value can be overridden per environment (Development, Staging, Production).
