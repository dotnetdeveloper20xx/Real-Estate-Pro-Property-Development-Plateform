import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseBadgeComponent, IBadgeMapEntry } from '../base-badge.component';

/**
 * Status badge component for displaying entity lifecycle states.
 *
 * Default mappings: Active, Inactive, Pending, Under Review, Completed, Archived.
 * Uses DaisyUI semantic badge classes for consistent colour communication.
 *
 * Usage:
 * ```html
 * <app-status-badge [value]="opportunity.status" />
 * <app-status-badge [value]="opportunity.status" size="sm" />
 * ```
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (shouldRender()) {
      <span
        [class]="'badge gap-1 ' + (sizeClass() || '') + ' ' + (cssClass() || '')"
        role="status"
        [attr.aria-label]="ariaLabel()">
        @if (icon()) {
          <span class="material-symbols-outlined text-xs" aria-hidden="true">{{ icon() }}</span>
        }
        {{ displayLabel() }}
      </span>
    }
  `,
})
export class StatusBadgeComponent extends BaseBadgeComponent {
  protected readonly category = 'Status';

  protected readonly defaultBadgeMap: Record<string, IBadgeMapEntry> = {
    'Active': { label: 'Active', cssClass: 'badge-success', icon: 'check_circle' },
    'Inactive': { label: 'Inactive', cssClass: 'badge-ghost', icon: 'cancel' },
    'Pending': { label: 'Pending', cssClass: 'badge-warning', icon: 'schedule' },
    'UnderReview': { label: 'Under Review', cssClass: 'badge-info', icon: 'visibility' },
    'Completed': { label: 'Completed', cssClass: 'badge-success', icon: 'task_alt' },
    'Archived': { label: 'Archived', cssClass: 'badge-ghost', icon: 'archive' },
  };
}
