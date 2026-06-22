import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseBadgeComponent, IBadgeMapEntry } from '../base-badge.component';

/**
 * Risk badge component for displaying risk assessment levels.
 *
 * Default mappings: Critical, High, Medium, Low, None.
 * Uses DaisyUI semantic badge classes for consistent colour communication.
 *
 * Usage:
 * ```html
 * <app-risk-badge [value]="risk.level" />
 * <app-risk-badge [value]="risk.level" size="xs" />
 * ```
 */
@Component({
  selector: 'app-risk-badge',
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
export class RiskBadgeComponent extends BaseBadgeComponent {
  protected readonly category = 'Risk';

  protected readonly defaultBadgeMap: Record<string, IBadgeMapEntry> = {
    'Critical': { label: 'Critical', cssClass: 'badge-error', icon: 'dangerous' },
    'High': { label: 'High', cssClass: 'badge-error', icon: 'warning' },
    'Medium': { label: 'Medium', cssClass: 'badge-warning', icon: 'report' },
    'Low': { label: 'Low', cssClass: 'badge-info', icon: 'info' },
    'None': { label: 'None', cssClass: 'badge-success', icon: 'verified_user' },
  };
}
