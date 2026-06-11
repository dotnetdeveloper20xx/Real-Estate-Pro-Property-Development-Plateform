# Phase 10: Frontend Foundations

## What You'll Build

Before creating any feature pages, you need the foundation: layout system, core services, shared components, routing setup, and state management infrastructure.

---

## Application Structure

```
frontend/src/app/
├── core/                    # Singleton services, guards, interceptors
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── toast.service.ts
│   │   └── permission.service.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── unsaved-changes.guard.ts
│   └── interceptors/
│       ├── auth.interceptor.ts
│       └── error.interceptor.ts
├── shared/                  # Reusable components
│   └── components/
│       ├── page-header/
│       ├── metric-card/
│       ├── status-badge/
│       ├── empty-state/
│       └── confirmation-dialog/
├── layout/                  # Page layouts
│   ├── main-layout/         # Sidebar + header + content
│   └── auth-layout/         # Login pages (no sidebar)
├── features/                # Business modules (lazy loaded)
│   └── (created per module)
├── app.config.ts            # App configuration (providers)
├── app.routes.ts            # Route definitions
└── app.ts                   # Root component
```

---

## Step 1: App Configuration

```typescript
// app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideStore({}),       // Root store (feature stores added per module)
        provideEffects([]),     // Root effects
        provideStoreDevtools({ maxAge: 25 }),
    ]
};
```

---

## Step 2: Auth Service

```typescript
// core/services/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly baseUrl = `${environment.apiUrl}/api/v1/auth`;
    private tokenKey = 'access_token';
    private refreshKey = 'refresh_token';

    constructor(private http: HttpClient, private router: Router) {}

    login(email: string, password: string): Observable<ILoginResponse> {
        return this.http.post<ILoginResponse>(`${this.baseUrl}/login`, { email, password })
            .pipe(tap(response => {
                localStorage.setItem(this.tokenKey, response.token);
                localStorage.setItem(this.refreshKey, response.refreshToken);
            }));
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshKey);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;
        // Check expiry
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
    }

    getCurrentUser(): ICurrentUser | null {
        const token = this.getToken();
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            roles: payload.role ? [].concat(payload.role) : []
        };
    }
}
```

---

## Step 3: Auth Interceptor

Automatically attaches JWT token to every API request:

```typescript
// core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    if (token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    return next(req);
};
```

---

## Step 4: Error Interceptor

Catches HTTP errors globally:

```typescript
// core/interceptors/error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toast = inject(ToastService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            switch (error.status) {
                case 401:
                    router.navigate(['/login']);
                    break;
                case 403:
                    toast.error('You do not have permission to perform this action');
                    break;
                case 404:
                    toast.error('The requested resource was not found');
                    break;
                case 400:
                    // Validation errors — let the component handle these
                    break;
                case 500:
                    toast.error('An unexpected error occurred. Please try again.');
                    break;
            }
            return throwError(() => error);
        })
    );
};
```

---

## Step 5: Auth Guard

Protects routes from unauthenticated users:

```typescript
// core/guards/auth.guard.ts
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    router.navigate(['/login']);
    return false;
};
```

---

## Step 6: Toast Service

Simple notification service:

```typescript
// core/services/toast.service.ts
@Injectable({ providedIn: 'root' })
export class ToastService {
    private toasts: IToast[] = [];
    toasts$ = new BehaviorSubject<IToast[]>([]);

    success(message: string): void {
        this.show({ message, type: 'success', duration: 4000 });
    }

    error(message: string): void {
        this.show({ message, type: 'error', duration: 0 }); // Manual dismiss
    }

    warning(message: string): void {
        this.show({ message, type: 'warning', duration: 6000 });
    }

    private show(toast: IToast): void {
        const id = Date.now();
        this.toasts.push({ ...toast, id });
        this.toasts$.next([...this.toasts]);

        if (toast.duration > 0) {
            setTimeout(() => this.dismiss(id), toast.duration);
        }
    }

    dismiss(id: number): void {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.toasts$.next([...this.toasts]);
    }
}
```

---

## Step 7: Main Layout

The layout with sidebar navigation and header:

```typescript
// layout/main-layout/main-layout.component.ts
@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [RouterOutlet, SidebarComponent, HeaderComponent, ToastContainerComponent],
    template: `
        <div class="flex h-screen bg-base-200">
            <app-sidebar />
            <div class="flex-1 flex flex-col overflow-hidden">
                <app-header />
                <main class="flex-1 overflow-y-auto p-6">
                    <router-outlet />
                </main>
            </div>
        </div>
        <app-toast-container />
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {}
```

---

## Step 8: Shared Components (Build Before Features)

### Page Header
```typescript
@Component({
    selector: 'app-page-header',
    standalone: true,
    template: `
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-base-content">{{ title }}</h1>
            @if (description) {
                <p class="text-sm text-base-content/60 mt-1">{{ description }}</p>
            }
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
    @Input({ required: true }) title = '';
    @Input() description = '';
}
```

### Status Badge
```typescript
@Component({
    selector: 'app-status-badge',
    standalone: true,
    template: `<span class="badge" [ngClass]="badgeClass">{{ status }}</span>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
    @Input({ required: true }) status = '';

    get badgeClass(): string {
        switch (this.status.toLowerCase()) {
            case 'acquired': case 'completed': case 'approved': return 'badge-success';
            case 'identified': case 'pending': return 'badge-info';
            case 'withdrawn': case 'failed': case 'rejected': return 'badge-error';
            default: return 'badge-warning';
        }
    }
}
```

### Empty State
```typescript
@Component({
    selector: 'app-empty-state',
    standalone: true,
    template: `
        <div class="text-center py-12">
            <div class="text-5xl mb-4">📋</div>
            <h3 class="text-lg font-semibold text-base-content">{{ title }}</h3>
            <p class="text-sm text-base-content/60 mt-2">{{ message }}</p>
            @if (actionLabel) {
                <button class="btn btn-primary mt-4" (click)="action.emit()">
                    {{ actionLabel }}
                </button>
            }
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
    @Input({ required: true }) title = '';
    @Input() message = '';
    @Input() actionLabel = '';
    @Output() action = new EventEmitter<void>();
}
```

---

## Step 9: Environment Configuration

```typescript
// environments/environment.ts
export const environment = {
    production: false,
    apiUrl: 'https://localhost:5001'
};

// environments/environment.prod.ts
export const environment = {
    production: true,
    apiUrl: 'https://api.buildestate.co.uk'
};
```

---

## Verification

```bash
cd frontend
ng build
# Should compile with 0 errors

ng serve
# Should start at http://localhost:4200
# Login page should render
```

---

*Next: Phase 11 — Shared Services (auth flow, audit viewing, notification system)...*
