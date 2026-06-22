/**
 * Property 25: Badge ARIA attributes
 *
 * For any rendered badge component, `role="status"` SHALL be present and the
 * `aria-label` attribute SHALL contain both the badge category name and the
 * display label (e.g., "Status: Under Review").
 *
 * **Validates: Requirements 9.7**
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Type } from '@angular/core';
import * as fc from 'fast-check';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { PriorityBadgeComponent } from './priority-badge/priority-badge.component';
import { StageBadgeComponent } from './stage-badge/stage-badge.component';
import { RiskBadgeComponent } from './risk-badge/risk-badge.component';

/**
 * Helper: creates a test host component that wraps a badge component with a
 * dynamic [value] input, since badge components use signal inputs.
 */
@Component({
  standalone: true,
  imports: [StatusBadgeComponent],
  template: `<app-status-badge [value]="value" />`,
})
class StatusBadgeHostComponent {
  value: string | null | undefined = undefined;
}

@Component({
  standalone: true,
  imports: [PriorityBadgeComponent],
  template: `<app-priority-badge [value]="value" />`,
})
class PriorityBadgeHostComponent {
  value: string | null | undefined = undefined;
}

@Component({
  standalone: true,
  imports: [StageBadgeComponent],
  template: `<app-stage-badge [value]="value" />`,
})
class StageBadgeHostComponent {
  value: string | null | undefined = undefined;
}

@Component({
  standalone: true,
  imports: [RiskBadgeComponent],
  template: `<app-risk-badge [value]="value" />`,
})
class RiskBadgeHostComponent {
  value: string | null | undefined = undefined;
}

interface BadgeTestConfig {
  name: string;
  hostComponent: Type<{ value: string | null | undefined }>;
  category: string;
  knownValues: string[];
}

const BADGE_CONFIGS: BadgeTestConfig[] = [
  {
    name: 'StatusBadge',
    hostComponent: StatusBadgeHostComponent,
    category: 'Status',
    knownValues: ['Active', 'Inactive', 'Pending', 'UnderReview', 'Completed', 'Archived'],
  },
  {
    name: 'PriorityBadge',
    hostComponent: PriorityBadgeHostComponent,
    category: 'Priority',
    knownValues: ['Critical', 'High', 'Medium', 'Low'],
  },
  {
    name: 'StageBadge',
    hostComponent: StageBadgeHostComponent,
    category: 'Stage',
    knownValues: ['Planning', 'Design', 'Construction', 'Sales', 'Completion'],
  },
  {
    name: 'RiskBadge',
    hostComponent: RiskBadgeHostComponent,
    category: 'Risk',
    knownValues: ['Critical', 'High', 'Medium', 'Low', 'None'],
  },
];

describe('Property 25: Badge ARIA attributes', () => {
  for (const config of BADGE_CONFIGS) {
    describe(`${config.name} (category: "${config.category}")`, () => {
      let fixture: ComponentFixture<{ value: string | null | undefined }>;

      beforeEach(async () => {
        await TestBed.configureTestingModule({
          imports: [config.hostComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(config.hostComponent);
      });

      it('should have role="status" and aria-label containing "Category: Label" for known values', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(...config.knownValues),
            (value: string) => {
              fixture.componentInstance.value = value;
              fixture.detectChanges();

              const spanEl = fixture.nativeElement.querySelector('span[role="status"]');

              // role="status" must be present
              expect(spanEl).not.toBeNull();

              // aria-label must contain the category
              const ariaLabel: string = spanEl.getAttribute('aria-label');
              expect(ariaLabel).toBeTruthy();
              expect(ariaLabel.startsWith(`${config.category}:`)).toBeTrue();

              // aria-label must contain a non-empty label after the colon
              const labelPart = ariaLabel.substring(config.category.length + 1).trim();
              expect(labelPart.length).toBeGreaterThan(0);
            }
          ),
          { numRuns: config.knownValues.length * 3 }
        );
      });

      it('should have role="status" and aria-label containing category for unknown/fallback values', () => {
        // Generate arbitrary non-empty strings that are NOT in the known values
        const unknownValueArb = fc.string({ minLength: 1, maxLength: 30 })
          .filter(s => !config.knownValues.includes(s) && s.trim().length > 0);

        fc.assert(
          fc.property(
            unknownValueArb,
            (value: string) => {
              fixture.componentInstance.value = value;
              fixture.detectChanges();

              const spanEl = fixture.nativeElement.querySelector('span[role="status"]');

              // role="status" must be present
              expect(spanEl).not.toBeNull();

              // aria-label must start with "Category: "
              const ariaLabel: string = spanEl.getAttribute('aria-label');
              expect(ariaLabel).toBeTruthy();
              expect(ariaLabel.startsWith(`${config.category}:`)).toBeTrue();

              // The label portion after category should be non-empty (formatted from value)
              const labelPart = ariaLabel.substring(config.category.length + 1).trim();
              expect(labelPart.length).toBeGreaterThan(0);
            }
          ),
          { numRuns: 50 }
        );
      });
    });
  }
});
