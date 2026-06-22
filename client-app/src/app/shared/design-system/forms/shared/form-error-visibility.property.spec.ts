/**
 * Property 10: Form control error visibility rule
 *
 * For any form control wrapper component, the inline error message SHALL be visible
 * if and only if the control has a validation error AND the field has been touched.
 * If the control has a validation error but has NOT been touched, the error message
 * SHALL NOT be displayed.
 *
 * **Validates: Requirements 5.2, 5.3**
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import * as fc from 'fast-check';
import { TextInputComponent } from '../text-input/text-input.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, TextInputComponent],
  template: `<app-text-input [formControl]="control" label="Test Field" [required]="true" />`,
})
class TestHostComponent {
  control = new FormControl('', Validators.required);
}

describe('Property 10: Form control error visibility rule', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * Helper to simulate touched state by triggering blur on the input element,
   * which calls the component's markAsTouched() method and properly updates
   * the internal touched signal.
   */
  function simulateTouch(): void {
    const input = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }



  it('error message SHALL be visible if and only if the control has a validation error AND has been touched', () => {
    fc.assert(
      fc.property(
        fc.record({
          value: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 50 })),
          touched: fc.boolean(),
        }),
        ({ value, touched }) => {
          // Reset to a known state: create fresh fixture per iteration
          // Instead, reset the control programmatically
          host.control.setValue(value);
          host.control.updateValueAndValidity();

          if (touched) {
            // Simulate blur to trigger internal markAsTouched()
            const input = fixture.nativeElement.querySelector('input');
            input.dispatchEvent(new Event('blur'));
          } else {
            // Mark untouched on the FormControl and trigger status update
            // to sync the internal signal via statusChanges
            host.control.markAsUntouched();
            host.control.updateValueAndValidity();
          }
          fixture.detectChanges();

          const hasError = host.control.invalid;
          const errorEl = fixture.nativeElement.querySelector('[role="alert"]');

          if (hasError && touched) {
            // Error message SHALL be visible
            expect(errorEl).withContext(
              `Expected error visible: value="${value}", touched=${touched}, invalid=${hasError}`
            ).not.toBeNull();
          } else {
            // Error message SHALL NOT be displayed
            expect(errorEl).withContext(
              `Expected no error: value="${value}", touched=${touched}, invalid=${hasError}`
            ).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('error message SHALL NOT be displayed when control has error but is NOT touched', () => {
    // Control starts untouched with empty value (invalid due to required)
    host.control.setValue('');
    host.control.updateValueAndValidity();
    fixture.detectChanges();

    expect(host.control.invalid).toBeTrue();

    const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorEl).toBeNull();
  });

  it('error message SHALL be visible when control has error AND is touched', () => {
    // Set empty value (triggers required error)
    host.control.setValue('');
    host.control.updateValueAndValidity();
    fixture.detectChanges();

    // Simulate user touching the field
    simulateTouch();

    expect(host.control.invalid).toBeTrue();

    const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorEl).not.toBeNull();
  });

  it('error message SHALL NOT be displayed when control has no error regardless of touched state', () => {
    fc.assert(
      fc.property(
        fc.record({
          value: fc.string({ minLength: 1, maxLength: 100 }),
          touched: fc.boolean(),
        }),
        ({ value, touched }) => {
          host.control.setValue(value);
          host.control.updateValueAndValidity();

          if (touched) {
            const input = fixture.nativeElement.querySelector('input');
            input.dispatchEvent(new Event('blur'));
          } else {
            host.control.markAsUntouched();
            host.control.updateValueAndValidity();
          }
          fixture.detectChanges();

          // No error because value is non-empty (satisfies required)
          expect(host.control.valid).withContext(
            `Expected valid: value="${value}"`
          ).toBeTrue();

          const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
          expect(errorEl).withContext(
            `Expected no error when valid: value="${value}", touched=${touched}`
          ).toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });
});
