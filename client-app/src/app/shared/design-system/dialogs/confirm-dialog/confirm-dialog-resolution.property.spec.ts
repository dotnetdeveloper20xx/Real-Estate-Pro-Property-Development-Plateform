/**
 * Property 26: Confirmation dialog resolution mapping
 *
 * For any user interaction with the confirmation dialog — confirm button click
 * resolves as `true`, cancel button click resolves as `false`, backdrop click
 * resolves as `false`, and Escape key resolves as `false`.
 *
 * **Validates: Requirements 10.4**
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';
import * as fc from 'fast-check';
import {
  ConfirmDialogComponent,
  ConfirmDialogResolution,
  ConfirmDialogSeverity,
} from './confirm-dialog.component';

/**
 * Host component to wrap ConfirmDialogComponent with dynamic inputs.
 */
@Component({
  standalone: true,
  imports: [ConfirmDialogComponent],
  template: `
    <app-confirm-dialog
      [title]="title"
      [message]="message"
      [severity]="severity"
      [confirmText]="confirmText"
      [cancelText]="cancelText"
      (resolved)="onResolved($event)"
    />
  `,
})
class ConfirmDialogHostComponent {
  title = 'Test Title';
  message = 'Test message';
  severity: ConfirmDialogSeverity = 'info';
  confirmText = 'Confirm';
  cancelText = 'Cancel';
  resolutions: ConfirmDialogResolution[] = [];

  onResolved(resolution: ConfirmDialogResolution): void {
    this.resolutions.push(resolution);
  }

  get lastResolution(): ConfirmDialogResolution | undefined {
    return this.resolutions[this.resolutions.length - 1];
  }

  reset(): void {
    this.resolutions = [];
  }
}

/** Arbitrary for severity values */
const severityArb = fc.constantFrom<ConfirmDialogSeverity>('info', 'warning', 'danger');

/** Arbitrary for non-empty title text (1-100 chars) */
const titleArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

/** Arbitrary for non-empty message text (1-500 chars) */
const messageArb = fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0);

/**
 * Maps a ConfirmDialogResolution to its expected boolean value.
 * This mirrors the service-level mapping: confirm → true, everything else → false.
 */
function mapResolutionToBoolean(resolution: ConfirmDialogResolution): boolean {
  return resolution === 'confirm';
}

describe('Property 26: Confirmation dialog resolution mapping', () => {
  let fixture: ComponentFixture<ConfirmDialogHostComponent>;
  let host: ConfirmDialogHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogHostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('confirm button click resolves as true for any severity and text', () => {
    fc.assert(
      fc.property(
        severityArb,
        titleArb,
        messageArb,
        (severity, title, message) => {
          host.severity = severity;
          host.title = title;
          host.message = message;
          host.reset();
          fixture.detectChanges();

          const confirmBtn = fixture.nativeElement.querySelector(
            '[data-testid="confirm-dialog-confirm"]'
          ) as HTMLButtonElement;
          expect(confirmBtn).not.toBeNull();
          confirmBtn.click();
          fixture.detectChanges();

          const resolution = host.lastResolution;
          expect(resolution).toBeDefined();
          expect(resolution).toEqual('confirm');
          expect(mapResolutionToBoolean(resolution!)).toBeTrue();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('cancel button click resolves as false for any severity and text', () => {
    fc.assert(
      fc.property(
        severityArb,
        titleArb,
        messageArb,
        (severity, title, message) => {
          host.severity = severity;
          host.title = title;
          host.message = message;
          host.reset();
          fixture.detectChanges();

          const cancelBtn = fixture.nativeElement.querySelector(
            '[data-testid="confirm-dialog-cancel"]'
          ) as HTMLButtonElement;
          expect(cancelBtn).not.toBeNull();
          cancelBtn.click();
          fixture.detectChanges();

          const resolution = host.lastResolution;
          expect(resolution).toBeDefined();
          expect(resolution).toEqual('cancel');
          expect(mapResolutionToBoolean(resolution!)).toBeFalse();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('backdrop click resolves as false for any severity and text', () => {
    fc.assert(
      fc.property(
        severityArb,
        titleArb,
        messageArb,
        (severity, title, message) => {
          host.severity = severity;
          host.title = title;
          host.message = message;
          host.reset();
          fixture.detectChanges();

          const backdrop = fixture.nativeElement.querySelector(
            '[data-testid="confirm-dialog-backdrop"]'
          ) as HTMLElement;
          expect(backdrop).not.toBeNull();
          backdrop.click();
          fixture.detectChanges();

          const resolution = host.lastResolution;
          expect(resolution).toBeDefined();
          expect(resolution).toEqual('backdrop');
          expect(mapResolutionToBoolean(resolution!)).toBeFalse();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Escape key resolves as false for any severity and text', () => {
    fc.assert(
      fc.property(
        severityArb,
        titleArb,
        messageArb,
        (severity, title, message) => {
          host.severity = severity;
          host.title = title;
          host.message = message;
          host.reset();
          fixture.detectChanges();

          const container = fixture.nativeElement.querySelector(
            '[role="presentation"]'
          ) as HTMLElement;
          expect(container).not.toBeNull();

          const escapeEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true,
          });
          container.dispatchEvent(escapeEvent);
          fixture.detectChanges();

          const resolution = host.lastResolution;
          expect(resolution).toBeDefined();
          expect(resolution).toEqual('escape');
          expect(mapResolutionToBoolean(resolution!)).toBeFalse();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('only confirm resolves as true; cancel, backdrop, and escape all resolve as false', () => {
    const resolutionTypeArb = fc.constantFrom<ConfirmDialogResolution>(
      'confirm',
      'cancel',
      'backdrop',
      'escape'
    );

    fc.assert(
      fc.property(
        resolutionTypeArb,
        severityArb,
        titleArb,
        messageArb,
        (resolutionType, severity, title, message) => {
          host.severity = severity;
          host.title = title;
          host.message = message;
          host.reset();
          fixture.detectChanges();

          switch (resolutionType) {
            case 'confirm': {
              const btn = fixture.nativeElement.querySelector(
                '[data-testid="confirm-dialog-confirm"]'
              ) as HTMLButtonElement;
              btn.click();
              break;
            }
            case 'cancel': {
              const btn = fixture.nativeElement.querySelector(
                '[data-testid="confirm-dialog-cancel"]'
              ) as HTMLButtonElement;
              btn.click();
              break;
            }
            case 'backdrop': {
              const el = fixture.nativeElement.querySelector(
                '[data-testid="confirm-dialog-backdrop"]'
              ) as HTMLElement;
              el.click();
              break;
            }
            case 'escape': {
              const container = fixture.nativeElement.querySelector(
                '[role="presentation"]'
              ) as HTMLElement;
              const event = new KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true,
                cancelable: true,
              });
              container.dispatchEvent(event);
              break;
            }
          }
          fixture.detectChanges();

          const resolution = host.lastResolution;
          expect(resolution).toBeDefined();
          expect(resolution).toEqual(resolutionType);

          const expectedBoolean = resolutionType === 'confirm';
          expect(mapResolutionToBoolean(resolution!)).toBe(expectedBoolean);
        }
      ),
      { numRuns: 100 }
    );
  });
});
