import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseBadgeComponent, IBadgeMapEntry } from '../base-badge.component';

/**
 * Stage badge component for displaying project development stages.
 *
 * Default mappings: Planning, Design, Construction, Sales, Completion.
 * Uses DaisyUI semantic badge classes for consistent colour communication.
 *
 * Usage:
 * ```html
 * <app-stage-badge [value]="project.stage" />
 * <app-stage-badge [value]="project.stage" size="lg" />
 * ```
 */
@Component({
  selector: 'app-stage-badge',
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
export class StageBadgeComponent extends BaseBadgeComponent {
  protected readonly category = 'Stage';

  protected readonly defaultBadgeMap: Record<string, IBadgeMapEntry> = {
    'Planning': { label: 'Planning', cssClass: 'badge-info', icon: 'map' },
    'Design': { label: 'Design', cssClass: 'badge-info', icon: 'design_services' },
    'Construction': { label: 'Construction', cssClass: 'badge-warning', icon: 'construction' },
    'Sales': { label: 'Sales', cssClass: 'badge-success', icon: 'storefront' },
    'Completion': { label: 'Completion', cssClass: 'badge-success', icon: 'flag' },
  };
}
