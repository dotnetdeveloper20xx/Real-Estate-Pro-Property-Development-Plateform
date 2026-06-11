# Phase 11: Shared Services — Auth, Audit, Notifications, Help

## What You'll Build

These are cross-cutting capabilities used by EVERY module. Build them once, reuse everywhere.

---

## 1. Authentication Flow (End-to-End)

### Backend: Auth Controller

```csharp
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            return Unauthorized(new { success = false, errors = new[] { "Invalid email or password" } });

        if (await _userManager.IsLockedOutAsync(user))
            return Unauthorized(new { success = false, errors = new[] { "Account locked. Try again later." } });

        var roles = await _userManager.GetRolesAsync(user);
        var token = GenerateJwtToken(user, roles);
        var refreshToken = GenerateRefreshToken();

        // Save refresh token to database
        await SaveRefreshToken(user.Id, refreshToken);

        return Ok(new
        {
            success = true,
            data = new
            {
                token,
                refreshToken,
                expiresIn = 3600,
                user = new { user.Id, user.Email, user.FirstName, user.LastName, roles }
            }
        });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        // Validate refresh token, issue new access token
        // Rotate refresh token (one-time use)
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        // Invalidate refresh token
        return Ok(new { success = true });
    }
}
```

### Frontend: Login Component

```typescript
@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="min-h-screen flex items-center justify-center bg-base-200">
            <div class="card w-96 bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title justify-center text-2xl">BuildEstate Pro</h2>
                    <p class="text-center text-base-content/60">Sign in to your account</p>

                    <form [formGroup]="form" (ngSubmit)="onSubmit()">
                        <div class="form-control mt-4">
                            <label class="label"><span class="label-text">Email</span></label>
                            <input type="email" formControlName="email"
                                   class="input input-bordered" placeholder="you@company.co.uk" />
                        </div>

                        <div class="form-control mt-4">
                            <label class="label"><span class="label-text">Password</span></label>
                            <input type="password" formControlName="password"
                                   class="input input-bordered" />
                        </div>

                        @if (errorMessage()) {
                            <div class="alert alert-error mt-4">
                                <span>{{ errorMessage() }}</span>
                            </div>
                        }

                        <button type="submit" class="btn btn-primary w-full mt-6"
                                [disabled]="form.invalid || loading()">
                            @if (loading()) { <span class="loading loading-spinner"></span> }
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `
})
export class LoginComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    form = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required])
    });

    loading = signal(false);
    errorMessage = signal('');

    onSubmit(): void {
        if (this.form.invalid) return;

        this.loading.set(true);
        this.errorMessage.set('');

        const { email, password } = this.form.value;
        this.authService.login(email!, password!).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.error?.errors?.[0] || 'Login failed');
            }
        });
    }
}
```

---

## 2. Audit Trail Viewing

### Backend: Activity/Audit Endpoint

```csharp
[Authorize(Roles = "SuperAdmin")]
[HttpGet("api/v1/admin/audit")]
public async Task<IActionResult> GetAuditLogs([FromQuery] GetAuditLogsQuery query, CancellationToken ct)
{
    var result = await _mediator.Send(query, ct);
    return Ok(result);
}
```

### Frontend: Audit Log Component

Shows a timeline of all system actions — who did what, when:

```typescript
@Component({
    selector: 'app-audit-log',
    standalone: true,
    template: `
        <app-page-header title="Audit Log" description="Complete history of all system actions" />

        <div class="card bg-base-100 shadow">
            <div class="card-body">
                <!-- Filters -->
                <div class="flex gap-4 mb-4">
                    <input type="text" placeholder="Search by user or action..."
                           class="input input-bordered flex-1" (input)="onSearch($event)" />
                    <select class="select select-bordered" (change)="onFilterAction($event)">
                        <option value="">All Actions</option>
                        <option value="Create">Create</option>
                        <option value="Update">Update</option>
                        <option value="Delete">Delete</option>
                    </select>
                </div>

                <!-- Audit entries -->
                @for (entry of auditLogs(); track entry.id) {
                    <div class="border-l-4 border-primary pl-4 py-2 mb-3">
                        <div class="flex justify-between">
                            <span class="font-semibold">{{ entry.userName }}</span>
                            <span class="text-sm text-base-content/60">{{ entry.timestamp | date:'medium' }}</span>
                        </div>
                        <p class="text-sm">
                            <app-status-badge [status]="entry.action" />
                            {{ entry.entityName }} — {{ entry.entityId }}
                        </p>
                    </div>
                }
            </div>
        </div>
    `
})
export class AuditLogComponent { ... }
```

---

## 3. Activity Feed (Per Module)

A reusable component showing recent activity for any entity:

```typescript
@Component({
    selector: 'app-activity-feed',
    standalone: true,
    template: `
        <div class="card bg-base-100 shadow">
            <div class="card-body">
                <h3 class="card-title text-base">Recent Activity</h3>
                @for (item of activities(); track item.id) {
                    <div class="flex items-start gap-3 py-2 border-b last:border-0">
                        <div class="avatar placeholder">
                            <div class="bg-primary text-primary-content w-8 rounded-full">
                                <span class="text-xs">{{ item.userName | slice:0:2 }}</span>
                            </div>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm">
                                <span class="font-medium">{{ item.userName }}</span>
                                {{ item.description }}
                            </p>
                            <span class="text-xs text-base-content/50">{{ item.timestamp | date:'short' }}</span>
                        </div>
                    </div>
                } @empty {
                    <p class="text-sm text-base-content/50 py-4 text-center">No recent activity</p>
                }
            </div>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityFeedComponent {
    @Input() activities = signal<IActivityItem[]>([]);
}
```

---

## 4. Role-Based Sidebar Navigation

The sidebar only shows items the current user's role can access:

```typescript
// Mapping: which roles can see which menu items
const ROLE_NAV_MAP: Record<string, string[]> = {
    SuperAdmin: ['*'],  // All items
    AcquisitionManager: ['dashboard', 'opportunities', 'due-diligence', 'feasibility', 'documents', 'help'],
    LegalOfficer: ['dashboard', 'legal/contracts', 'legal/compliance', 'legal/tasks', 'due-diligence', 'documents', 'help'],
    PlanningManager: ['dashboard', 'planning', 'documents', 'help'],
    ProjectManager: ['dashboard', 'projects', 'construction', 'design', 'procurement', 'finance', 'units', 'documents', 'reports', 'help'],
    SiteManager: ['dashboard', 'construction', 'defects', 'procurement', 'contractors', 'documents', 'help'],
    SalesManager: ['dashboard', 'sales', 'units', 'documents', 'reports', 'help'],
    PropertyManager: ['dashboard', 'rentals', 'units', 'defects', 'documents', 'help'],
    FinanceDirector: ['dashboard', 'finance', 'investors', 'portfolio', 'projects', 'opportunities', 'reports', 'help'],
};

filterNavForRole(items: INavItem[], role: string): INavItem[] {
    const allowed = ROLE_NAV_MAP[role];
    if (!allowed) return [];
    if (allowed.includes('*')) return items;
    return items.filter(item => allowed.some(route => item.route.startsWith(route)));
}
```

---

## 5. Toast Notification System

Already covered in Phase 10. Key integration point — Effects dispatch toasts:

```typescript
// In NgRx effects:
createOpportunitySuccess$ = createEffect(() =>
    this.actions$.pipe(
        ofType(createOpportunitySuccess),
        tap(() => this.toast.success('Opportunity created successfully')),
        map(({ opportunity }) => /* navigate to detail */)
    )
);

createOpportunityFailure$ = createEffect(() =>
    this.actions$.pipe(
        ofType(createOpportunityFailure),
        tap(({ error }) => this.toast.error(error || 'Failed to create opportunity'))
    ), { dispatch: false }
);
```

---

## 6. Dashboard Component

The executive dashboard showing portfolio-level KPIs:

```typescript
@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [PageHeaderComponent, MetricCardComponent, ActivityFeedComponent],
    template: `
        <app-page-header title="Dashboard" description="Portfolio overview and key metrics" />

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <app-metric-card title="Active Projects" [value]="stats()?.totalProjects" icon="🏗️" />
            <app-metric-card title="Total Units" [value]="stats()?.totalUnits" icon="🏠" />
            <app-metric-card title="Portfolio Value" [value]="stats()?.portfolioValue" prefix="£" icon="💷" />
            <app-metric-card title="Pipeline" [value]="stats()?.pipelineCount" icon="📋" />
        </div>

        <!-- Two-column layout -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Attention Needed -->
            <div class="card bg-base-100 shadow">
                <div class="card-body">
                    <h3 class="card-title text-warning">⚠️ Attention Needed</h3>
                    @for (item of attentionItems(); track item.id) {
                        <div class="py-2 border-b">{{ item.message }}</div>
                    }
                </div>
            </div>

            <!-- Recent Activity -->
            <app-activity-feed [activities]="recentActivity()" />
        </div>
    `
})
export class DashboardComponent { ... }
```

---

## 7. Help Centre Structure

```typescript
// Pre-built help articles organized by category
const HELP_CATEGORIES = [
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'land-acquisition', name: 'Land Acquisition', icon: '🏞️' },
    { id: 'planning', name: 'Planning & Approvals', icon: '📐' },
    { id: 'construction', name: 'Construction', icon: '🏗️' },
    { id: 'finance', name: 'Finance', icon: '💷' },
    { id: 'sales', name: 'Sales', icon: '🏷️' },
    { id: 'administration', name: 'Administration', icon: '⚙️' },
];

// Each category has multiple articles
const HELP_ARTICLES = [
    {
        id: 'create-opportunity',
        categoryId: 'land-acquisition',
        title: 'Creating a Land Opportunity',
        content: '...',  // Markdown content
        relatedRoutes: ['/opportunities/new']
    },
    // ... more articles
];
```

---

## 8. Unsaved Changes Guard

Warns users before navigating away from forms with unsaved data:

```typescript
export const unsavedChangesGuard: CanDeactivateFn<{ hasUnsavedChanges: () => boolean }> = (component) => {
    if (component.hasUnsavedChanges && component.hasUnsavedChanges()) {
        return confirm('You have unsaved changes. Are you sure you want to leave?');
    }
    return true;
};
```

---

## Verification

After building all shared services:
- [ ] Login works and returns JWT token
- [ ] Token is attached to all subsequent requests
- [ ] Unauthorized requests redirect to login
- [ ] Role-based sidebar filtering works per role
- [ ] Toast notifications appear on actions
- [ ] Audit log page shows system activity
- [ ] Dashboard renders KPI cards
- [ ] Help Centre is accessible and searchable
- [ ] Unsaved changes guard prompts before leaving dirty forms

---

*Next: Phase 12 — The Module Implementation Pattern (already created)...*
*Then: Phase 13 — Building Module 1: Land Acquisition...*
