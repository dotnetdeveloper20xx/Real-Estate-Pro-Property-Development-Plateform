import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseBadgeComponent, IBadgeMapEntry } from '../base-badge.component';

/**
 * Priority badge component for displaying item priority levels.
 *
 * Default mappings: Critical, High, Medium, Low.
 * Uses DaisyUI semantic badge classes for consistent colour communication.
 *
 * Usage:
 * ```html
 * <app-priority-badge [value]="task.priority" />
 * <app-priority-badge [value]="task.priority" size="sm" />
 * ```
 */
@Component({
  selector: 'app-priority-badge',
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
export class PriorityBadgeComponent extends BaseBadgeComponent {
  protected readonly category = 'Priority';

  protected readonly defaultBadgeMap: Record<string, IBadgeMapEntry> = {
    'Critical': { label: 'Critical', cssClass: 'badge-error', icon: 'error' },
    'High': { label: 'High', cssClass: 'badge-warning', icon: 'priority_high' },
    'Medium': { label: 'Medium', cssClass: 'badge-info', icon: 'drag_handle' },
    'Low': { label: 'Low', cssClass: 'badge-success', icon: 'low_priority' },
  };
}
