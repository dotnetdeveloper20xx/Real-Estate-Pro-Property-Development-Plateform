# BuildEstate Pro — Frontend Standards (Enterprise Grade)

## Technology
- Angular 20 (Standalone Components)
- TypeScript (strict mode — no `any`)
- NgRx Store (state management)
- Reactive Forms (all data entry)
- Angular Material / PrimeNG (UI components)
- SCSS (BEM naming convention)
- RxJS (reactive patterns)

## Component Architecture

### Smart (Container) Components
- Connect to NgRx Store
- Dispatch actions
- Subscribe to selectors
- Handle routing logic
- Pass data down to presentational components

### Presentational (Dumb) Components
- Receive data via @Input()
- Emit events via @Output()
- No store dependency
- No service injection (except UI utilities)
- Reusable across features
- Testable in isolation

### Component Rules
- No business logic in templates
- No complex expressions in templates (use component methods or pipes)
- No large components (max ~100 lines of template)
- Use OnPush change detection strategy
- Unsubscribe from observables (takeUntilDestroyed, async pipe, or DestroyRef)
- One component per file
- Keep component focused on a single UI concern

## State Management (NgRx)

### Store Structure
```
store/
└── {feature}/
    ├── {feature}.actions.ts
    ├── {feature}.reducer.ts
    ├── {feature}.effects.ts
    ├── {feature}.selectors.ts
    ├── {feature}.state.ts
    └── index.ts
```

### Rules
- One store slice per feature module
- Actions follow format: `[Feature] Action Name`
- Effects handle all side effects (API calls, navigation, notifications)
- Selectors for ALL derived state (memoized)
- Never access store state directly — always through selectors
- Use createFeature() for concise store setup
- Entities use @ngrx/entity for normalized state

### Action Naming
```typescript
// CORRECT
export const loadOpportunities = createAction('[Opportunities] Load Opportunities');
export const loadOpportunitiesSuccess = createAction(
  '[Opportunities] Load Opportunities Success',
  props<{ opportunities: OpportunityDto[] }>()
);
export const loadOpportunitiesFailure = createAction(
  '[Opportunities] Load Opportunities Failure',
  props<{ error: string }>()
);
```

## Forms (Reactive Forms Only)

### Rules
- NEVER use template-driven forms
- FormGroup/FormArray for all data entry
- Typed forms (FormGroup<IOpportunityForm>)
- Validate on the client AND the server
- Show inline validation messages on blur/submit
- Disable submit until form is valid
- Custom validators for business rules
- Form state in component (not store — unless multi-step)

### Pattern
```typescript
export interface IOpportunityForm {
  name: FormControl<string>;
  location: FormControl<string>;
  landSize: FormControl<number>;
  status: FormControl<OpportunityStatus>;
}
```

## Services

### API Services
- One service per API resource
- Return Observable<T> (typed)
- Use HttpClient with interceptors
- Handle errors via interceptor (not per-call)
- Base URL from environment config

### Rules
- Services are singleton (providedIn: 'root')
- No business logic in services (they are data conduits)
- Services call APIs and return typed observables
- Error transformation happens in effects or interceptors

## Routing
- Lazy-loaded feature routes
- Route guards for authentication/authorization
- Resolve data before navigation where appropriate
- Breadcrumb support via route data
- Consistent URL patterns: `/features/{module}/{action}/{id}`

## UI/UX Standards (Corporate Users)
Design for corporate users who need clarity instantly.

### Prefer
- Cards for entity summaries
- Dashboards for overview screens
- Charts for metrics and trends
- Status indicators (badges, chips, icons)
- Progress bars for lifecycle tracking
- Timelines for activity/history
- Summary panels for key metrics
- Data tables with sorting, filtering, pagination

### Avoid
- Long paragraphs of text
- Data overload on single screens
- Confusing navigation
- Deep nesting (max 3 levels)
- Inconsistent layouts between modules

### Every Screen Must Answer
1. What happened? (recent activity)
2. What is happening? (current status)
3. What requires attention? (alerts, pending items)
4. What should I do next? (clear actions)

## Error Handling (Frontend)
- HTTP interceptor catches all API errors
- Display user-friendly error messages (never raw server errors)
- Toast notifications for transient errors
- Full-page error for critical failures
- Retry logic for network issues
- Loading states on all async operations (skeleton screens or spinners)

## TypeScript Standards
- Strict mode enabled
- No `any` type — ever
- Use interfaces for contracts, types for unions/intersects
- Use enums for finite sets
- Prefer `readonly` where immutability is intended
- Use utility types (Partial, Pick, Omit, Record)
- No magic strings — use constants or enums

## File & Folder Naming
- Files: kebab-case (`opportunity-list.component.ts`)
- Components: PascalCase suffix (`OpportunityListComponent`)
- Services: PascalCase suffix (`OpportunityService`)
- Interfaces: prefix with `I` (`IOpportunity`)
- Models: PascalCase (`OpportunityDto`)
- Constants: UPPER_SNAKE_CASE (`MAX_PAGE_SIZE`)
