/**
 * Property 11: Form control accessibility attributes
 *
 * For any form control wrapper component:
 * (a) a unique ID SHALL be generated and the associated `<label>` element's `for`
 *     attribute SHALL reference that ID,
 * (b) `aria-describedby` SHALL reference the IDs of the help text and/or error
 *     message elements when they exist, and
 * (c) `aria-invalid="true"` SHALL be present if and only if the control has a
 *     validation error.
 *
 * **Validates: Requirements 5.7, 5.8, 5.9**
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as fc from 'fast-check';
import { TextInputComponent } from '../text-input/text-input.component';

// --- Test Host Component ---

@Component({
  standalone: true,
  imports: [TextInputComponent, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <app-text-input
        [label]="label"
        [helpText]="helpText"
        [required]="required"
        formControlName="testField"
      />
    </form>
  `,
})
class FormAccessibilityHostComponent {
  label = 'Test Label';
  helpText = '';
  required = false;
  form = new FormGroup({
    testField: new FormControl(''),
  });
}

describe('Property 11: Form control accessibility attributes', () => {
  let fixture: ComponentFixture<FormAccessibilityHostComponent>;
  let host: FormAccessibilityHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormAccessibilityHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FormAccessibilityHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('(a) Label for attribute references input ID', () => {
    it('should generate a unique ID and label for attribute SHALL reference that ID for any label text', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (labelText: string) => {
            host.label = labelText;
            fixture.detectChanges();

            const label = fixture.nativeElement.querySelector('label');
            const input = fixture.nativeElement.querySelector('input');

            expect(label).not.toBeNull();
            expect(input).not.toBeNull();

            const labelFor = label.getAttribute('for');
            const inputId = input.getAttribute('id');

            // Label for must reference the input's ID
            expect(labelFor).toBeTruthy();
            expect(inputId).toBeTruthy();
            expect(labelFor).toBe(inputId);

            // ID must follow the unique pattern
            expect(inputId).toMatch(/^ds-fc-\d+$/);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('(b) aria-describedby references help text and error IDs', () => {
    it('should include helpTextId in aria-describedby when helpText is provided', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          (helpText: string) => {
            host.helpText = helpText;
            fixture.detectChanges();

            const input = fixture.nativeElement.querySelector('input');
            const helpEl = fixture.nativeElement.querySelector('[id$="-help"]');

            expect(input).not.toBeNull();
            expect(helpEl).not.toBeNull();

            const ariaDescribedBy = input.getAttribute('aria-describedby');
            expect(ariaDescribedBy).toBeTruthy();
            expect(ariaDescribedBy).toContain(helpEl.getAttribute('id'));
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should NOT have aria-describedby when no helpText and no errors', () => {
      host.helpText = '';
      host.form.get('testField')!.clearValidators();
      host.form.get('testField')!.updateValueAndValidity();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input');
      const ariaDescribedBy = input.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toBeNull();
    });

    it('should include errorId in aria-describedby when there are validation errors and field is touched', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (labelText: string) => {
            host.label = labelText;
            host.helpText = '';

            // Set up required validator and empty value to trigger error
            const control = host.form.get('testField')!;
            control.setValidators([Validators.required]);
            control.setValue('');
            control.updateValueAndValidity();

            // Mark touched by simulating blur on the input
            const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
            input.dispatchEvent(new Event('blur'));
            fixture.detectChanges();

            const errorEl = fixture.nativeElement.querySelector('[id$="-error"]');

            expect(input).not.toBeNull();
            expect(errorEl).not.toBeNull();

            const ariaDescribedBy = input.getAttribute('aria-describedby');
            expect(ariaDescribedBy).toBeTruthy();
            expect(ariaDescribedBy).toContain(errorEl.getAttribute('id'));
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should include both helpTextId and errorId when both exist', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (labelText: string, helpText: string) => {
            host.label = labelText;
            host.helpText = helpText;

            // Set up required validator and empty value to trigger error
            const control = host.form.get('testField')!;
            control.setValidators([Validators.required]);
            control.setValue('');
            control.updateValueAndValidity();

            // Mark touched by simulating blur on the input
            const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
            input.dispatchEvent(new Event('blur'));
            fixture.detectChanges();

            const helpEl = fixture.nativeElement.querySelector('[id$="-help"]');
            const errorEl = fixture.nativeElement.querySelector('[id$="-error"]');

            expect(input).not.toBeNull();
            expect(helpEl).not.toBeNull();
            expect(errorEl).not.toBeNull();

            const ariaDescribedBy = input.getAttribute('aria-describedby');
            expect(ariaDescribedBy).toBeTruthy();
            expect(ariaDescribedBy).toContain(helpEl.getAttribute('id'));
            expect(ariaDescribedBy).toContain(errorEl.getAttribute('id'));
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('(c) aria-invalid is present if and only if validation error exists', () => {
    it('should set aria-invalid="true" when the control has a validation error', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (labelText: string) => {
            host.label = labelText;

            // Set up required validator with empty value
            const control = host.form.get('testField')!;
            control.setValidators([Validators.required]);
            control.setValue('');
            control.updateValueAndValidity();
            fixture.detectChanges();

            const input = fixture.nativeElement.querySelector('input');
            expect(input).not.toBeNull();
            expect(input.getAttribute('aria-invalid')).toBe('true');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should NOT have aria-invalid when the control has no validation error', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (value: string) => {
            const control = host.form.get('testField')!;
            control.setValidators([Validators.required]);
            control.setValue(value);
            control.updateValueAndValidity();
            fixture.detectChanges();

            const input = fixture.nativeElement.querySelector('input');
            expect(input).not.toBeNull();
            // aria-invalid should be absent (null) when no errors
            expect(input.getAttribute('aria-invalid')).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should toggle aria-invalid based on validation state changes', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (validValue: string) => {
            const control = host.form.get('testField')!;

            // Start with error
            control.setValidators([Validators.required]);
            control.setValue('');
            control.updateValueAndValidity();
            fixture.detectChanges();

            const input = fixture.nativeElement.querySelector('input');
            expect(input.getAttribute('aria-invalid')).toBe('true');

            // Fix the error by providing a valid value
            control.setValue(validValue);
            control.updateValueAndValidity();
            fixture.detectChanges();

            expect(input.getAttribute('aria-invalid')).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
