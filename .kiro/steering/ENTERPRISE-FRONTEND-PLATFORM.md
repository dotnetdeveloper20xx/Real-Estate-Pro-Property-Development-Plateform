---
inclusion: auto
---

# ENTERPRISE FRONTEND PLATFORM STANDARDS

## Mindset

You are NOT building an Angular application.
You are building an **Enterprise Frontend Platform**.

This platform is expected to support:
- Multiple development teams
- Multiple business domains (14 modules)
- Hundreds of screens
- Thousands of components
- Years of future development

Every decision must optimize:
- Maintainability
- Reusability
- Scalability
- Consistency
- Accessibility
- Performance
- Testability
- Developer Experience
- User Experience

Assume this application will become one of the company's most critical business systems.

**Never generate page-by-page code. Design the frontend platform first.**

---

## Application Architecture (Build Before Features)

Before creating ANY feature, these must exist:
1. Application Architecture
2. Design System (tokens, colours, spacing, typography)
3. Theme System (light, dark, future themes)
4. Component Library (40+ reusable components)
5. State Management Strategy (NgRx governance)
6. Layout Framework (7 layouts)
7. Testing Framework
8. Folder Standards
9. Naming Standards
10. Accessibility Standards
11. Documentation Standards

---

## Application Structure

```
app/
├── core/                    # Singleton services, guards, interceptors
│   ├── services/            # Global services (auth, notification, toast, modal, etc.)
│   ├── guards/              # Route guards
│   ├── interceptors/        # HTTP interceptors
│   └── models/              # Shared interfaces/types
├── shared/                  # Reusable components, pipes, directives
│   ├── components/          # Reusable UI components (40+)
│   ├── pipes/               # Transform pipes
│   ├── directives/          # Custom directives
│   └── validators/          # Custom form validators
├── layout/                  # Layout framework (7 layouts)
│   ├── main-layout/         # Corporate layout with sidebar
│   ├── auth-layout/         # Authentication pages
│   ├── dashboard-layout/    # Dashboard specific
│   ├── wizard-layout/       # Multi-step wizards
│   ├── master-detail-layout/# List + detail split
│   ├── report-layout/       # Full-width reports
│   └── fullscreen-layout/   # Fullscreen presentations
├── design-system/           # Design tokens, themes, global styles
│   ├── tokens/              # Colour, spacing, typography, elevation tokens
│   ├── themes/              # Light, dark, corporate themes
│   └── utilities/           # Tailwind extensions
├── state/                   # Global NgRx state (auth, notifications, UI)
│   ├── auth/
│   ├── notifications/
│   └── ui/
└── features/                # Business domain features (lazy loaded)
    ├── land-acquisition/
    ├── planning/
    ├── legal/
    ├── project-management/
    ├── construction/
    └── ...
```

Every folder has purpose. No random folders. No dumping grounds.

---

## Core Platform Services (Required)

These must exist as singleton services in `core/services/`:

| Service | Responsibility |
|---------|---------------|
| `AuthService` | Login, logout, token management |
| `NotificationService` | In-app notifications |
| `ToastService` | Transient toast messages |
| `ModalService` | Programmatic modal management |
| `DialogService` | Confirmation dialogs |
| `NavigationService` | Programmatic navigation + breadcrumbs |
| `PermissionsService` | Role/permission checking |
| `ThemeService` | Theme switching (light/dark) |
| `SettingsService` | User preferences |
| `StorageService` | LocalStorage/SessionStorage abstraction |
| `LoggingService` | Frontend error logging |
| `LoadingService` | Global loading state |
| `UserContextService` | Current user info |
| `BreadcrumbService` | Dynamic breadcrumb management |

---

## Layout System (7 Required Layouts)

Every page uses a layout. No page invents its own structure.

| Layout | Use Case |
|--------|----------|
| `MainLayout` | Corporate sidebar + header + content |
| `AuthLayout` | Login, register, forgot password |
| `DashboardLayout` | Dashboard with widget grid |
| `WizardLayout` | Multi-step form wizards |
| `MasterDetailLayout` | List on left, detail on right |
| `ReportLayout` | Full-width reports and exports |
| `FullscreenLayout` | Presentations, large visualizations |

---

## Design System (Build Before Components)

### Design Tokens (Centralized)
- **Colours:** Primary, secondary, accent, neutral, semantic (success, warning, error, info)
- **Spacing:** 4px base unit scale (4, 8, 12, 16, 24, 32, 48, 64, 96)
- **Typography:** Font families, sizes (xs through 5xl), weights, line heights
- **Elevation:** Shadow levels (sm, md, lg, xl)
- **Border Radius:** none, sm, md, lg, xl, full
- **Animation:** Duration tokens (fast, normal, slow), easing curves

### Rules
- No component hardcodes colours
- No component hardcodes spacing
- No component owns branding
- All styling through design tokens + Tailwind utilities + DaisyUI themes
- Themes are centralized — components consume them

---

## Global Theme System

### Required Themes
- Corporate Light Theme (default)
- Corporate Dark Theme
- Future custom themes (per-client)

### Rules
- Themes defined via DaisyUI `data-theme` attribute
- ThemeService manages active theme
- Components use DaisyUI semantic colour classes (`text-primary`, `bg-base-100`, etc.)
- No `#hex` values in component styles
- Theme preference persisted in StorageService

---

## Reusable Component Library (Build Before Pages)

### Required Components (40+)

**Layout Components:**
- PageHeaderComponent
- PageContainerComponent
- SectionComponent

**Card Components:**
- CardComponent
- MetricCardComponent / StatCardComponent
- DashboardCardComponent
- StatusCardComponent
- ProgressCardComponent
- RiskCardComponent
- KpiCardComponent

**Badge Components:**
- BadgeComponent
- StatusBadgeComponent
- RiskBadgeComponent
- PriorityBadgeComponent

**User Components:**
- AvatarComponent
- UserChipComponent
- TagComponent

**Feedback Components:**
- AlertComponent
- NotificationComponent
- ToastComponent
- LoadingSpinnerComponent
- SkeletonLoaderComponent
- EmptyStateComponent
- ErrorStateComponent

**Dialog Components:**
- ConfirmationDialogComponent
- ModalComponent
- DrawerComponent

**Data Display:**
- TimelineComponent
- CommentPanelComponent
- AuditHistoryComponent
- FileUploadComponent
- DocumentViewerComponent

**Controls:**
- SearchBoxComponent
- FilterPanelComponent
- SortControlComponent
- PaginationComponent
- DataGridComponent (enterprise)
- ActionMenuComponent
- TabContainerComponent
- WizardComponent

### Rules
- NEVER duplicate functionality
- ALWAYS reuse existing components
- Every component uses `ChangeDetectionStrategy.OnPush`
- Every component is a standalone component
- Every component has @Input/@Output (presentation pattern)
- Every component has aria attributes

---

## Enterprise Data Grid

Every list page uses the reusable DataGrid. Built-in support for:
- Search
- Sort (multi-column)
- Filter (per column)
- Pagination (server-side)
- Column visibility toggle
- Column resize
- Export (CSV, Excel)
- Row actions (menu)
- Bulk actions (select + action)
- Loading state (skeleton rows)
- Empty state
- Error state with retry
- Row selection (single/multi)
- Responsive mode (cards on mobile)

**No custom tables unless architecturally justified and documented.**

---

## Form Framework

### Reusable Form Controls
- TextInputComponent
- NumberInputComponent
- CurrencyInputComponent
- DateInputComponent
- DateRangeInputComponent
- DropdownComponent
- MultiSelectComponent
- AutocompleteComponent
- CheckboxComponent
- RadioComponent
- ToggleComponent
- TextAreaComponent
- FileUploadComponent
- AddressInputComponent
- PhoneInputComponent
- EmailInputComponent
- PercentageInputComponent

### All form controls share:
- Validation display (inline errors)
- Consistent styling (DaisyUI form-control)
- Labels (with required indicator)
- Error messages (from validators)
- Accessibility (aria-describedby, aria-invalid)
- Consistent layout (form-control wrapper)
- Typed FormControl/FormGroup binding

---

## NgRx Governance (Mandatory)

- Business data belongs in Store
- API calls belong in Effects
- Selectors provide UI data
- Components do NOT call APIs directly
- Components do NOT manage application state

### Required per feature:
- Actions (meaningful names: `[Feature] Verb Noun`)
- Reducers (immutable state transitions)
- Effects (API calls, navigation, toasts)
- Selectors (memoized, composable)
- Entity Adapters (for collections)
- Facade services (optional, for complex orchestration)

### State Principles
- Single source of truth
- No duplicated state
- No synchronization hacks
- No component-owned business state
- Normalize collections (EntityAdapter)
- Use selectors heavily

---

## Dashboard Excellence

This application is **executive software**. Users understand information immediately.

### Reusable Dashboard Widgets
- MetricWidget
- TrendWidget
- ComparisonWidget
- WarningWidget
- RiskWidget
- TimelineWidget
- ProgressWidget
- FinancialWidget
- StatusWidget
- ActivityWidget

### Target feel:
- Azure Portal
- Power BI
- Salesforce

**NOT basic CRUD pages.**

---

## Accessibility (Mandatory)

WCAG 2.1 AA compliance mindset:
- Keyboard navigation on all interactive elements
- Focus management on route changes and modals
- Screen reader support (ARIA labels, live regions)
- Colour contrast (4.5:1 minimum)
- Label associations on all form inputs
- Accessible forms (aria-describedby for errors)
- Skip navigation links
- Focus indicators visible

---

## Responsive Design

Desktop-first, but fully responsive:
- Desktop (1440px+)
- Laptop (1024px-1439px)
- Tablet (768px-1023px)
- Mobile (320px-767px)

Every component must be responsive. No desktop-only implementations.

---

## Performance Standards

- `ChangeDetectionStrategy.OnPush` on ALL components
- `trackBy` on ALL `@for` loops
- Lazy loading on all feature routes
- Bundle size monitoring
- NgRx selectors for memoized data
- Virtual scrolling for large lists
- Skeleton loaders instead of spinners for content
- Image lazy loading

---

## Testing Strategy

### Framework
- Jasmine + Karma (Angular default)
- Angular Testing Utilities

### What to test:
- Components (render, inputs, outputs, interactions)
- Pipes (transform logic)
- Services (API calls, business logic)
- Selectors (derived state)
- Reducers (state transitions)
- Effects (side effects)
- Forms (validation rules)
- Reusable components (all variants)
- Critical user journeys (integration)

### Target: High confidence, low maintenance

---

## Developer Experience

Future developers should love this codebase.

Prioritize:
- **Discoverability** — find anything in seconds
- **Consistency** — everything follows the same patterns
- **Documentation** — README per feature, JSDoc on services
- **Predictability** — no surprises, no magic
- **Reusable patterns** — copy patterns, not code
- **Simple onboarding** — productive in day one

---

## Final Rule (Before Building ANY Feature)

Ask:
1. Can an existing reusable component solve this?
2. Can an existing store solve this?
3. Can an existing layout solve this?
4. Can an existing pattern solve this?

If YES → **Reuse. Do not duplicate.**

The application should demonstrate **enterprise Angular mastery**, not feature delivery speed.

Every screen feels like it belongs to the same premium corporate platform.
Every component is reusable.
Every style is governed.
Every interaction is intentional.
Every future developer immediately recognizes the architecture standards.
