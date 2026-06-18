import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnDestroy,
  inject
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, combineLatest } from 'rxjs';
import { selectUserPermissions, selectUserRoles } from '../../core/store/auth/auth.selectors';
import { AuthService } from '../../core/services/auth.service';

/**
 * Structural directive that conditionally renders content based on the current user's permissions.
 *
 * Subscribes to the NgRx auth store for dynamic permission updates — when permissions change
 * (e.g., after re-login following a permission toggle), the view is automatically updated.
 *
 * Shows the element if the user has at least one of the specified permission(s),
 * or if the user has the SuperAdmin role (which bypasses all permission checks).
 * In dev mode (no explicit login), always shows the content.
 *
 * Usage:
 * ```html
 * <button *appHasPermission="'opportunities.create'">Create Opportunity</button>
 * <div *appHasPermission="['legal.create', 'legal.update']">Legal Actions</div>
 * ```
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnDestroy {
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private subscription: Subscription | null = null;
  private isRendered = false;
  private requiredPermissions: string[] = [];

  @Input()
  set appHasPermission(permission: string | string[]) {
    this.requiredPermissions = Array.isArray(permission) ? permission : [permission];
    this.setupSubscription();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private setupSubscription(): void {
    // Unsubscribe from previous subscription if permission input changes
    this.subscription?.unsubscribe();

    // Subscribe to both permissions and roles for dynamic updates
    this.subscription = combineLatest([
      this.store.select(selectUserPermissions),
      this.store.select(selectUserRoles)
    ]).subscribe(([permissions, roles]) => {
      this.updateView(permissions, roles);
    });
  }

  private updateView(userPermissions: readonly string[], userRoles: readonly string[]): void {
    const shouldShow = this.authService.isDevMode ||
      userRoles.includes('SuperAdmin') ||
      this.requiredPermissions.some(permission => userPermissions.includes(permission));

    if (shouldShow && !this.isRendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isRendered = true;
    } else if (!shouldShow && this.isRendered) {
      this.viewContainer.clear();
      this.isRendered = false;
    }
  }
}
