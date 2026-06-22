import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';
import * as fc from 'fast-check';
import { ModalComponent } from './modal.component';

/**
 * Property 2: Modal error array rendering completeness
 *
 * For any non-empty array of error strings passed to the modal's `errors` input,
 * every string in the array SHALL be rendered as a visible line item in the
 * error summary section above the footer.
 *
 * **Validates: Requirements 2.5**
 */

@Component({
  standalone: true,
  imports: [ModalComponent],
  template: `
    <app-modal [visible]="true" [errors]="errors" title="Test Modal">
      <p>Body</p>
      <div modal-footer>Footer</div>
    </app-modal>
  `,
})
class TestHostComponent {
  errors: string[] = [];
}

describe('Modal Error Array Rendering Property', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  it('should render every error string as a visible line item for any non-empty error array', () => {
    // Generate unique error strings using only safe characters (letters, digits, spaces)
    // This avoids HTML-encoding edge cases while still testing the property
    const safeErrorString = fc.array(
      fc.constantFrom(
        ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '.split('')
      ),
      { minLength: 1, maxLength: 50 }
    ).map(chars => chars.join(''))
     .filter(s => s.trim().length > 0);

    const uniqueErrorArray = fc.uniqueArray(safeErrorString, { minLength: 1, maxLength: 10 });

    fc.assert(
      fc.property(uniqueErrorArray, (errors: string[]) => {
        // Create a fresh fixture for each property test run
        const fixture = TestBed.createComponent(TestHostComponent);
        fixture.componentInstance.errors = errors;
        fixture.detectChanges();

        // Act: query rendered error list items
        const nativeElement: HTMLElement = fixture.nativeElement;
        const errorListItems = nativeElement.querySelectorAll('li.text-sm.text-error');

        // Assert: number of rendered items equals array length
        expect(errorListItems.length).toBe(errors.length);

        // Assert: each error string appears in the rendered DOM text content
        for (const error of errors) {
          const found = Array.from(errorListItems).some(
            (li) => li.textContent === error
          );
          expect(found)
            .withContext(`Expected error "${error}" to be rendered in the DOM`)
            .toBeTrue();
        }

        fixture.destroy();
      }),
      { numRuns: 50 }
    );
  });
});
