import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { IBadgeMapEntry } from './base-badge.component';

/**
 * Property 23: Badge map rendering
 *
 * For any badge value that exists as a key in the provided `badgeMap`,
 * the rendered badge SHALL display the configured label, apply the configured
 * CSS class, and if an icon is specified, render it as a leading Material Symbols
 * element with `aria-hidden="true"`.
 *
 * **Validates: Requirements 9.2, 9.4**
 */
describe('Badge Map Rendering Property', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;
  let component: StatusBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should render label and CSS class from the default badge map for any known key', () => {
    const defaultKeys = ['Active', 'Inactive', 'Pending', 'UnderReview', 'Completed', 'Archived'];

    fc.assert(
      fc.property(
        fc.constantFrom(...defaultKeys),
        (key: string) => {
          // Arrange
          fixture.componentRef.setInput('value', key);
          fixture.detectChanges();

          const nativeElement: HTMLElement = fixture.nativeElement;
          const badgeSpan = nativeElement.querySelector('span.badge');

          // Assert: badge is rendered
          expect(badgeSpan).toBeTruthy();

          // Get the expected entry from the default map
          const expectedEntry = (component as unknown as { defaultBadgeMap: Record<string, IBadgeMapEntry> }).defaultBadgeMap[key];

          // Assert: label text is displayed
          expect(badgeSpan!.textContent!.trim()).toContain(expectedEntry.label);

          // Assert: CSS class is applied
          expect(badgeSpan!.classList.contains(expectedEntry.cssClass)).toBeTrue();

          // Assert: icon is rendered with aria-hidden="true" (all default entries have icons)
          if (expectedEntry.icon) {
            const iconElement = badgeSpan!.querySelector('span.material-symbols-outlined');
            expect(iconElement).toBeTruthy();
            expect(iconElement!.getAttribute('aria-hidden')).toBe('true');
            expect(iconElement!.textContent!.trim()).toBe(expectedEntry.icon);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should render label, CSS class, and optional icon from an arbitrary custom badge map', () => {
    // Arbitrary for a badge map entry with optional icon
    // Label must have non-whitespace content so it is visible in rendered output
    const badgeMapEntryArb = fc.record({
      label: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
      cssClass: fc.constantFrom('badge-success', 'badge-info', 'badge-warning', 'badge-error', 'badge-ghost'),
      icon: fc.option(
        fc.constantFrom('check_circle', 'cancel', 'schedule', 'visibility', 'task_alt', 'archive', 'flag', 'warning'),
        { nil: undefined }
      ),
    });

    // Generate a badge map with 1-6 entries keyed by unique alphabetic strings
    const badgeMapArb = fc.uniqueArray(
      fc.tuple(
        fc.string({ minLength: 1, maxLength: 20, unit: fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')) }),
        badgeMapEntryArb
      ),
      { minLength: 1, maxLength: 6, selector: ([key]) => key }
    ).map(entries => Object.fromEntries(entries));

    fc.assert(
      fc.property(
        badgeMapArb,
        (badgeMap: Record<string, IBadgeMapEntry>) => {
          const keys = Object.keys(badgeMap);
          // Pick one key to test
          const keyIndex = Math.floor(Math.random() * keys.length);
          const selectedKey = keys[keyIndex];
          const expectedEntry = badgeMap[selectedKey];

          // Arrange
          fixture.componentRef.setInput('badgeMap', badgeMap);
          fixture.componentRef.setInput('value', selectedKey);
          fixture.detectChanges();

          const nativeElement: HTMLElement = fixture.nativeElement;
          const badgeSpan = nativeElement.querySelector('span.badge');

          // Assert: badge is rendered
          expect(badgeSpan).toBeTruthy();

          // Assert: label text is displayed (trim both sides for comparison)
          expect(badgeSpan!.textContent!.trim()).toContain(expectedEntry.label.trim());

          // Assert: CSS class is applied
          expect(badgeSpan!.classList.contains(expectedEntry.cssClass)).toBeTrue();

          // Assert: icon rendering
          const iconElement = badgeSpan!.querySelector('span.material-symbols-outlined');
          if (expectedEntry.icon) {
            expect(iconElement).toBeTruthy();
            expect(iconElement!.getAttribute('aria-hidden')).toBe('true');
            expect(iconElement!.textContent!.trim()).toBe(expectedEntry.icon);
          } else {
            expect(iconElement).toBeFalsy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
