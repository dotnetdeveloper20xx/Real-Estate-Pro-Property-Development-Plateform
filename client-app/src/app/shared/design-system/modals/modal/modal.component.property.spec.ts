import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import * as fc from 'fast-check';
import { ModalComponent, ModalSize } from './modal.component';

/**
 * Property 1: Modal size maps to correct CSS class
 *
 * For any valid modal size input (sm, md, lg, xl, fullscreen),
 * the rendered modal container SHALL have the corresponding Tailwind
 * max-width class applied, and when no size is specified, max-w-lg
 * SHALL be applied.
 *
 * **Validates: Requirements 2.1**
 */
describe('ModalComponent - Property: Modal size maps to correct CSS class', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  const SIZE_TO_CLASS: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    fullscreen: 'w-full h-full',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
  });

  it('should map any valid modal size to its corresponding CSS class', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ModalSize>('sm', 'md', 'lg', 'xl', 'fullscreen'),
        (size: ModalSize) => {
          component.size = size;
          component.ngOnChanges({
            size: {
              currentValue: size,
              previousValue: undefined,
              firstChange: true,
              isFirstChange: () => true,
            },
          });

          const expectedClass = SIZE_TO_CLASS[size];
          expect(component.sizeClass).toBe(expectedClass);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should default to max-w-lg when no size is specified', () => {
    // Verify that the default size is 'md' which maps to 'max-w-lg'
    const freshFixture = TestBed.createComponent(ModalComponent);
    const freshComponent = freshFixture.componentInstance;

    expect(freshComponent.size).toBe('md');
    expect(freshComponent.sizeClass).toBe('max-w-lg');
  });

  it('should apply the correct CSS class to the DOM when modal is visible', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ModalSize>('sm', 'md', 'lg', 'xl', 'fullscreen'),
        (size: ModalSize) => {
          // Use componentRef.setInput to properly trigger Angular's change detection
          fixture.componentRef.setInput('size', size);
          fixture.componentRef.setInput('visible', true);
          fixture.componentRef.setInput('title', 'Test Modal');
          fixture.detectChanges();

          const modalDialog = fixture.nativeElement.querySelector('[role="dialog"]');
          expect(modalDialog).toBeTruthy();

          // Verify the sizeClass was applied via ngClass
          const expectedClass = SIZE_TO_CLASS[size];
          const classes: string[] = expectedClass.split(' ');
          for (const cls of classes) {
            expect(modalDialog.classList.contains(cls))
              .withContext(`Expected class "${cls}" for size "${size}"`)
              .toBeTrue();
          }

          // Clean up: close the modal for next iteration
          fixture.componentRef.setInput('visible', false);
          fixture.detectChanges();
        }
      ),
      { numRuns: 50 }
    );
  });
});
