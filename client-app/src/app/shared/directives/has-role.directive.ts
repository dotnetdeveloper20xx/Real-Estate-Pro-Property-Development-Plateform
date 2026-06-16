import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnDestroy,
  inject
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { selectUserRoles } from '../../core/store/auth/auth.selectors';
import { AuthService } from '../../core/services/auth.service';

/**
 * Structural directive that conditionally renders content based on the current user's roles.
 *
 * Subscribes to the NgRx auth store for dynamic role updates — when roles change,
 * the view is automatically updated within the same change detection cycle (< 2 seconds).
 *
 * Shows the element if the user has at least one of the specified role(s).
 * In dev mode (no explicit login), always shows the content.
 *
 * Usage:
 * ```html
 * <div *appHasRole="'SuperAdmin'">Admin only content</div>
 * <div *appHasRole="['SuperAdmin', 'ProjectManager']">Multi-role content</div>
 * ```
 *
 * Requirements: 13.2, 13.9
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnDestroy {
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private subscription: Subscription | null = null;
  private isRendered = false;
  private requiredRoles: string[] = [];

  @Input()
  set appHasRole(role: string | string[]) {
    this.requiredRoles = Array.isArray(role) ? role : [role];
    this.setupSubscription();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private setupSubscription(): void {
    // Unsubscribe from previous subscription if role input changes
    this.subscription?.unsubscribe();

    // Subscribe to role changes from the NgRx store for dynamic updates
    this.subscription = this.store.select(selectUserRoles).subscribe((roles) => {
      this.updateView(roles);
    });
  }

  private updateView(userRoles: readonly string[]): void {
    const shouldShow = this.authService.isDevMode ||
      this.requiredRoles.some(role => userRoles.includes(role));

    if (shouldShow && !this.isRendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isRendered = true;
    } else if (!shouldShow && this.isRendered) {
      this.viewContainer.clear();
      this.isRendered = false;
    }
  }
}
