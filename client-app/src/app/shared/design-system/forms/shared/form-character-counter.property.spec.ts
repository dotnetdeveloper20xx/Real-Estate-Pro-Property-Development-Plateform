/**
 * Property 12: Form character counter accuracy
 *
 * For any text-input or textarea with a `maxLength` input configured, and for any
 * current text value, the displayed character counter SHALL show the format
 * "{currentLength}/{maxLength}" where currentLength equals the string length of
 * the current value.
 *
 * **Validates: Requirements 5.10**
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { TextInputComponent } from '../text-input/text-input.component';
import { TextareaComponent } from '../textarea/textarea.component';

describe('Property 12: Form character counter accuracy', () => {
  describe('TextInputComponent', () => {
    let fixture: ComponentFixture<TextInputComponent>;
    let component: TextInputComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TextInputComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TextInputComponent);
      component = fixture.componentInstance;
      component.label = 'Test';
    });

    it('should display "{currentLength}/{maxLength}" matching the string length of the current value', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 200 }),
          fc.integer({ min: 1, max: 500 }),
          (text: string, maxLength: number) => {
            // Set maxLength on the component
            component.maxLength = maxLength;

            // Use writeValue + updateValue to ensure the signal changes,
            // which forces the computed to re-evaluate and read current maxLength.
            // First reset to a sentinel to ensure signal change.
            component.writeValue(null);
            fixture.detectChanges();

            // Now write the actual text value
            component.writeValue(text);
            fixture.detectChanges();

            // Verify the character counter computed property
            const expectedCounter = `${text.length}/${maxLength}`;
            expect(component.characterCount()).toBe(expectedCounter);

            // Also verify it renders in the DOM
            const counterEl = fixture.nativeElement.querySelector('.label .label-text-alt');
            expect(counterEl).not.toBeNull();
            expect(counterEl.textContent.trim()).toBe(expectedCounter);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not display a character counter when maxLength is not configured', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          (text: string) => {
            // No maxLength set
            component.maxLength = undefined;

            // Write the value via the ControlValueAccessor interface
            component.writeValue(text);
            fixture.detectChanges();

            // characterCount should be undefined
            expect(component.characterCount()).toBeUndefined();

            // The DOM should not contain a counter with digit/digit format
            const labelEl = fixture.nativeElement.querySelector('.label');
            const altSpans = labelEl.querySelectorAll('.label-text-alt');
            for (let i = 0; i < altSpans.length; i++) {
              const content = altSpans[i].textContent.trim();
              expect(content).not.toMatch(/^\d+\/\d+$/);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('TextareaComponent', () => {
    let fixture: ComponentFixture<TextareaComponent>;
    let component: TextareaComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TextareaComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TextareaComponent);
      component = fixture.componentInstance;
      component.label = 'Test';
    });

    it('should display "{currentLength}/{maxLength}" matching the string length of the current value', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 200 }),
          fc.integer({ min: 1, max: 500 }),
          (text: string, maxLength: number) => {
            component.maxLength = maxLength;

            // Reset to null first to ensure signal change
            component.writeValue(null);
            fixture.detectChanges();

            // Write the actual value
            component.writeValue(text);
            fixture.detectChanges();

            // Verify the character counter computed property
            const expectedCounter = `${text.length}/${maxLength}`;
            expect(component.characterCount()).toBe(expectedCounter);

            // Also verify it renders in the DOM
            const counterEl = fixture.nativeElement.querySelector('.label .label-text-alt');
            expect(counterEl).not.toBeNull();
            expect(counterEl.textContent.trim()).toBe(expectedCounter);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not display a character counter when maxLength is not configured', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          (text: string) => {
            component.maxLength = undefined;

            component.writeValue(text);
            fixture.detectChanges();

            // characterCount should be undefined
            expect(component.characterCount()).toBeUndefined();

            // The DOM should not contain a counter with digit/digit format
            const labelEl = fixture.nativeElement.querySelector('.label');
            const altSpans = labelEl.querySelectorAll('.label-text-alt');
            for (let i = 0; i < altSpans.length; i++) {
              const content = altSpans[i].textContent.trim();
              expect(content).not.toMatch(/^\d+\/\d+$/);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
