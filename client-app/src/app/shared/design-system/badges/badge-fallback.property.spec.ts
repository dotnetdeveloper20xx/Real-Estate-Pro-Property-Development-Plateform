import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { StatusBadgeComponent } from './status-badge/status-badge.component';

/**
 * Property 24: Badge fallback for unknown values
 *
 * **Validates: Requirements 9.6**
 *
 * For any badge value that is null, empty, or does not match any key in the
 * `badgeMap`, the badge SHALL render with `badge-ghost` styling. If the value
 * is a non-empty string, it SHALL be formatted from PascalCase/camelCase to
 * space-separated words. If null or empty, nothing SHALL be displayed.
 */
describe('Property 24: Badge fallback for unknown values', () => {
  // Known keys in the StatusBadgeComponent's default badge map
  const knownKeys = ['Active', 'Inactive', 'Pending', 'UnderReview', 'Completed', 'Archived'];

  /**
   * Helper: Create a StatusBadgeComponent fixture and set a value
   */
  function createBadgeWithValue(value: string | null | undefined): StatusBadgeComponent {
    TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    });

    const fixture = TestBed.createComponent(StatusBadgeComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    return component;
  }

  /**
   * Helper: Format PascalCase/camelCase to space-separated words
   * (mirrors the implementation logic for verification)
   */
  function formatFallbackLabel(value: string): string {
    if (!value) return '';
    const spaced = value.replace(/([a-z])([A-Z])/g, '$1 $2')
                        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  /**
   * Arbitrary: generates strings that are NOT keys in the default badge map.
   * These represent unknown/unmapped badge values.
   */
  const unknownNonEmptyStringArb = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => !knownKeys.includes(s) && s.trim().length > 0);

  /**
   * Arbitrary: generates PascalCase strings (e.g., "UnderConstruction", "NewPhase")
   */
  const pascalCaseArb = fc.array(
    fc.string({ minLength: 2, maxLength: 10 }).map(s => {
      // Generate a word: first char uppercase, rest lowercase (alpha only)
      const alpha = s.replace(/[^a-zA-Z]/g, '') || 'Word';
      return alpha.charAt(0).toUpperCase() + alpha.slice(1).toLowerCase();
    }),
    { minLength: 2, maxLength: 4 }
  ).map(words => words.join(''))
   .filter(s => !knownKeys.includes(s) && s.length > 0);

  /**
   * Arbitrary: generates camelCase strings (e.g., "inProgress", "underReview")
   */
  const camelCaseArb = fc.array(
    fc.string({ minLength: 2, maxLength: 10 }).map(s => {
      const alpha = s.replace(/[^a-zA-Z]/g, '') || 'word';
      return alpha.charAt(0).toUpperCase() + alpha.slice(1).toLowerCase();
    }),
    { minLength: 2, maxLength: 4 }
  ).map(words => {
    const first = words[0].charAt(0).toLowerCase() + words[0].slice(1);
    return first + words.slice(1).join('');
  }).filter(s => !knownKeys.includes(s) && s.length > 0);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should apply badge-ghost class for any unknown (non-mapped) non-empty string value', () => {
    fc.assert(
      fc.property(unknownNonEmptyStringArb, (value) => {
        TestBed.resetTestingModule();
        const component = createBadgeWithValue(value);

        // Unknown values should render with badge-ghost
        expect(component.cssClass()).toBe('badge-ghost');
        // Unknown values should still render (shouldRender = true)
        expect(component.shouldRender()).toBeTrue();
      }),
      { numRuns: 50 }
    );
  });

  it('should not render (shouldRender returns false) for null values', () => {
    TestBed.resetTestingModule();
    const component = createBadgeWithValue(null);
    expect(component.shouldRender()).toBeFalse();
  });

  it('should not render (shouldRender returns false) for undefined values', () => {
    TestBed.resetTestingModule();
    const component = createBadgeWithValue(undefined);
    expect(component.shouldRender()).toBeFalse();
  });

  it('should not render (shouldRender returns false) for empty string values', () => {
    TestBed.resetTestingModule();
    const component = createBadgeWithValue('');
    expect(component.shouldRender()).toBeFalse();
  });

  it('should format PascalCase strings to space-separated words for unknown values', () => {
    fc.assert(
      fc.property(pascalCaseArb, (value) => {
        TestBed.resetTestingModule();
        const component = createBadgeWithValue(value);

        const displayLabel = component.displayLabel();
        const expectedLabel = formatFallbackLabel(value);

        // The label should be the formatted version of the PascalCase value
        expect(displayLabel).toBe(expectedLabel);
        // Should use badge-ghost styling
        expect(component.cssClass()).toBe('badge-ghost');
      }),
      { numRuns: 50 }
    );
  });

  it('should format camelCase strings to space-separated words for unknown values', () => {
    fc.assert(
      fc.property(camelCaseArb, (value) => {
        TestBed.resetTestingModule();
        const component = createBadgeWithValue(value);

        const displayLabel = component.displayLabel();
        const expectedLabel = formatFallbackLabel(value);

        // The label should be the formatted version of the camelCase value
        expect(displayLabel).toBe(expectedLabel);
        // First character should be uppercase in the display label
        expect(displayLabel.charAt(0)).toBe(displayLabel.charAt(0).toUpperCase());
        // Should use badge-ghost styling
        expect(component.cssClass()).toBe('badge-ghost');
      }),
      { numRuns: 50 }
    );
  });

  it('should have no badge entry (returns null) for unknown values', () => {
    fc.assert(
      fc.property(unknownNonEmptyStringArb, (value) => {
        TestBed.resetTestingModule();
        const component = createBadgeWithValue(value);

        // Badge entry should be null since value is not in the map
        expect(component.badgeEntry()).toBeNull();
      }),
      { numRuns: 30 }
    );
  });
});
