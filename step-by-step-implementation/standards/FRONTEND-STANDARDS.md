# BuildEstate Pro — Frontend Standards

## Core Technology
- Angular 20 (Standalone Components)
- TypeScript (strict mode — no `any`)
- NgRx Store (state management)
- Reactive Forms (all data entry)
- Tailwind CSS + DaisyUI (styling)
- RxJS (reactive patterns)

---

## Component Architecture

### Smart (Container) Components
- Connect to NgRx Store
- Dispatch actions
- Subscribe to selectors
- Handle routing logic
- Pass data down to presentational components
- Named with page context: `OpportunityListComponent`, `OpportunityDetailComponent`

### Presentational (Dumb) Components
- Receive data via @Input()
- Emit events via @Output()
- No store dependency
- No service injection (except UI utilities)
- Reusable across features
- Testable in isolation
- Named generically: `MetricCardComponent`, `StatusBadgeComponent`

### Component Rules
- No business logic in templates
- No complex expressions in templates (use methods or pipes)
- Max ~100 lines of template
- Use `ChangeDetectionStrategy.OnPush` on ALL components
- Unsubscribe from observables (use `takeUntilDestroyed`, `async` pipe, or `DestroyRef`)
- One component per file
- Single responsibility — one UI concern per component

---

## NgRx State Management

### Store Structure (Per Feature)
```
store/
└── {feature}/
    ├── {feature}.actions.ts    — What happened
    ├── {feature}.reducer.ts    — How state changes
    ├── {feature}.effects.ts    — Side effects (API calls)
    ├── {feature}.selectors.ts  — Derived data
    ├── {feature}.state.ts      — State interface
    └── index.ts                — Public API
```

### Action Naming Convention
```typescript
export const loadOpportunities = createAction('[Opportunities] Load Opportunities');
export const loadOpportunitiesSuccess = createAction(
    '[Opportunities] Load Opportunities Success',
    props<{ opportunities: IOpportunity[] }>()
);
export const loadOpportunitiesFailure = createAction(
    '[Opportunities] Load Opportunities Failure',
    props<{ error: string }>()
);
```

### Rules
- One store slice per feature
- Actions follow format: `[Feature] Verb Noun`
- Effects handle ALL side effects (API calls, navigation, notifications)
- Selectors for ALL derived state (memoized)
- Never access store state directly — always through selectors
- Use `@ngrx/entity` for normalized collections
- Components do NOT call APIs directly — always dispatch actions

---

## Forms (Reactive Forms Only)

### Rules
- NEVER use template-driven forms
- FormGroup/FormArray for all data entry
- Typed forms: `FormGroup<IOpportunityForm>`
- Validate on client AND server
- Show inline validation messages on blur/submit
- Disable submit until valid
- Custom validators for business rules
- Form state in component (not store — unless multi-step wizard)

### Pattern
```typescript
export interface IOpportunityForm {
    name: FormControl<string>;
    location: FormControl<string>;
    landSize: FormControl<number>;
    askingPrice: FormControl<number>;
    status: FormControl<OpportunityStatus>;
}

// In component:
this.form = this.fb.group<IOpportunityForm>({
    name: this.fb.control('', { validators: [Validators.required, Validators.maxLength(200)] }),
    location: this.fb.control('', { validators: [Validators.required] }),
    landSize: this.fb.control(0, { validators: [Validators.required, Validators.min(0.01)] }),
    askingPrice: this.fb.control(0, { validators: [Validators.required, Validators.min(1)] }),
    status: this.fb.control(OpportunityStatus.Identified)
});
```

---

## Services

### API Services
- One service per API resource
- Return `Observable<T>` (typed)
- Use HttpClient with interceptors
- Handle errors via interceptor (not per-call)
- Base URL from environment config

```typescript
@Injectable({ providedIn: 'root' })
export class OpportunityService {
    private readonly baseUrl = `${environment.apiUrl}/api/v1/opportunities`;

    constructor(private http: HttpClient) {}

    getAll(params: IOpportunityListParams): Observable<IPagedResult<IOpportunity>> {
        return this.http.get<IPagedResult<IOpportunity>>(this.baseUrl, { params: toHttpParams(params) });
    }

    getById(id: string): Observable<IOpportunityDetail> {
        return this.http.get<IOpportunityDetail>(`${this.baseUrl}/${id}`);
    }

    create(command: ICreateOpportunityCommand): Observable<IOpportunity> {
        return this.http.post<IOpportunity>(this.baseUrl, command);
    }
}
```

---

## Routing
- Lazy-loaded feature routes
- Route guards for auth/authorization
- Consistent URL patterns: `/features/{module}/{action}/{id}`
- Breadcrumb support via route data

```typescript
{
    path: 'opportunities',
    loadComponent: () => import('./features/land-acquisition/opportunities/opportunity-list/opportunity-list.component')
        .then(m => m.OpportunityListComponent),
    data: { breadcrumb: 'Opportunities' }
}
```

---

## UI/UX Standards

### Every Screen Must Answer
1. What happened? (recent activity)
2. What is happening? (current status)
3. What requires attention? (alerts, pending items)
4. What should I do next? (clear actions)

### Prefer
- Cards for entity summaries
- Dashboards for overview screens
- Status indicators (badges, chips, icons)
- Data tables with sorting, filtering, pagination
- Toast notifications for feedback
- Confirmation dialogs for destructive actions
- Empty states when no data exists
- Loading skeletons during async operations

### Avoid
- Long paragraphs of text
- Data overload on single screens
- Deep nesting (max 3 levels)
- Inconsistent layouts between modules
- Raw error messages from server

---

## TypeScript Rules

- Strict mode enabled
- No `any` type — EVER
- Use interfaces for contracts: `IOpportunity`
- Use enums for finite sets: `OpportunityStatus`
- Prefer `readonly` where immutability intended
- Use utility types: `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`
- No magic strings — use constants or enums

---

## Error Handling

- HTTP interceptor catches all API errors
- Display user-friendly messages (never raw server errors)
- Toast notifications for transient errors
- Full-page error for critical failures
- Retry logic for network issues
- Loading states on ALL async operations

---

## Performance Rules

- `ChangeDetectionStrategy.OnPush` on ALL components
- `trackBy` on ALL `@for` loops
- Lazy loading on all feature routes
- NgRx selectors for memoized data
- Virtual scrolling for large lists (100+ items)
- Skeleton loaders instead of spinners for content
