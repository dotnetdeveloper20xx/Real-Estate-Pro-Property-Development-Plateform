import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnDestroy,
  inject
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

/**
 * Structural directive that conditionally renders content based on the current user's roles.
 *
 * Shows the element if the user has the specified role(s).
 * In dev mode (no explicit login), always shows the content.
 *
 * Usage:
 * ```html
 * <div *appHasRole="'SuperAdmin'">Admin only content</div>
 * <div *appHasRole="['SuperAdmin', 'ProjectManager']">Multi-role content</div>
 * ```
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly subscription: Subscription;
  private isRendered = false;
  private requiredRoles: string[] = [];

  constructor() {
    // React to user changes (login/logout)
    this.subscription = this.authService.currentUser$.subscribe(() => {
      this.updateView();
    });
  }

  @Input()
  set appHasRole(role: string | string[]) {
    this.requiredRoles = Array.isArray(role) ? role : [role];
    this.updateView();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateView(): void {
    const shouldShow = this.authService.isDevMode || this.authService.hasAnyRole(this.requiredRoles);

    if (shouldShow && !this.isRendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isRendered = true;
    } else if (!shouldShow && this.isRendered) {
      this.viewContainer.clear();
      this.isRendered = false;
    }
  }
}
