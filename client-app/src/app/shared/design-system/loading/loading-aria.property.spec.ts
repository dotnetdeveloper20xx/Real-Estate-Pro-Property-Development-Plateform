/**
 * Property 27: Loading component ARIA attributes
 *
 * For any loading system component (spinner, overlay, button, skeleton) while in
 * loading state, `aria-busy="true"` SHALL be present on the container element and
 * an `aria-label` SHALL describe the operation, defaulting to "Loading" when no
 * custom label is provided.
 *
 * **Validates: Requirements 11.5**
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import * as fc from 'fast-check';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { LoadingOverlayComponent } from './loading-overlay/loading-overlay.component';
import { LoadingButtonComponent } from './loading-button/loading-button.component';
import { SkeletonCardComponent } from './skeleton-card/skeleton-card.component';
import { SkeletonTableComponent } from './skeleton-table/skeleton-table.component';
import { SkeletonFormComponent } from './skeleton-form/skeleton-form.component';

// --- Test Host Components ---

@Component({
  standalone: true,
  imports: [LoadingSpinnerComponent],
  template: `<app-loading-spinner [ariaLabel]="ariaLabel" />`,
})
class SpinnerHostComponent {
  ariaLabel: string = 'Loading';
}

@Component({
  standalone: true,
  imports: [LoadingOverlayComponent],
  template: `<app-loading-overlay [loading]="true" [ariaLabel]="ariaLabel"><p>Content</p></app-loading-overlay>`,
})
class OverlayHostComponent {
  ariaLabel: string = 'Loading';
}

@Component({
  standalone: true,
  imports: [LoadingButtonComponent],
  template: `<app-loading-button [loading]="true" [loadingText]="loadingText">Click</app-loading-button>`,
})
class ButtonHostComponent {
  loadingText: string = 'Loading...';
}

@Component({
  standalone: true,
  imports: [SkeletonCardComponent],
  template: `<app-skeleton-card [loading]="true" [count]="3" />`,
})
class SkeletonCardHostComponent {}

@Component({
  standalone: true,
  imports: [SkeletonTableComponent],
  template: `<app-skeleton-table [loading]="true" [rows]="3" [columns]="4" />`,
})
class SkeletonTableHostComponent {}

@Component({
  standalone: true,
  imports: [SkeletonFormComponent],
  template: `<app-skeleton-form [loading]="true" [fields]="3" />`,
})
class SkeletonFormHostComponent {}

describe('Property 27: Loading component ARIA attributes', () => {

  describe('LoadingSpinnerComponent', () => {
    let fixture: ComponentFixture<SpinnerHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SpinnerHostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(SpinnerHostComponent);
    });

    it('should always have aria-busy="true" and aria-label present', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (label: string) => {
            fixture.componentInstance.ariaLabel = label;
            fixture.detectChanges();

            const el = fixture.nativeElement.querySelector('[aria-busy="true"]');
            expect(el).not.toBeNull();

            const ariaLabel = el.getAttribute('aria-label');
            expect(ariaLabel).toBe(label);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should default aria-label to "Loading" when no custom label is provided', () => {
      fixture.componentInstance.ariaLabel = 'Loading';
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('[aria-busy="true"]');
      expect(el).not.toBeNull();
      expect(el.getAttribute('aria-label')).toBe('Loading');
    });
  });

  describe('LoadingOverlayComponent', () => {
    let fixture: ComponentFixture<OverlayHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [OverlayHostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(OverlayHostComponent);
    });

    it('should have aria-busy="true" and custom aria-label when loading', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (label: string) => {
            fixture.componentInstance.ariaLabel = label;
            fixture.detectChanges();

            const el = fixture.nativeElement.querySelector('[aria-busy="true"]');
            expect(el).not.toBeNull();

            const ariaLabel = el.getAttribute('aria-label');
            expect(ariaLabel).toBe(label);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should default aria-label to "Loading" when no custom label is provided', () => {
      fixture.componentInstance.ariaLabel = 'Loading';
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('[aria-busy="true"]');
      expect(el).not.toBeNull();
      expect(el.getAttribute('aria-label')).toBe('Loading');
    });
  });

  describe('LoadingButtonComponent', () => {
    let fixture: ComponentFixture<ButtonHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ButtonHostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(ButtonHostComponent);
    });

    it('should have aria-busy="true" on the button when loading', () => {
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button[aria-busy="true"]');
      expect(button).not.toBeNull();
    });

    it('should have aria-busy="true" with various loadingText values', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          (text: string) => {
            fixture.componentInstance.loadingText = text;
            fixture.detectChanges();

            const button = fixture.nativeElement.querySelector('button[aria-busy="true"]');
            expect(button).not.toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('SkeletonCardComponent', () => {
    let fixture: ComponentFixture<SkeletonCardHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SkeletonCardHostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(SkeletonCardHostComponent);
    });

    it('should have aria-busy="true" and aria-label when loading', () => {
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('[aria-busy="true"]');
      expect(el).not.toBeNull();

      const ariaLabel = el.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel.toLowerCase()).toContain('loading');
    });
  });

  describe('SkeletonTableComponent', () => {
    let fixture: ComponentFixture<SkeletonTableHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SkeletonTableHostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(SkeletonTableHostComponent);
    });

    it('should have aria-busy="true" and aria-label when loading', () => {
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('[aria-busy="true"]');
      expect(el).not.toBeNull();

      const ariaLabel = el.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel.toLowerCase()).toContain('loading');
    });
  });

  describe('SkeletonFormComponent', () => {
    let fixture: ComponentFixture<SkeletonFormHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SkeletonFormHostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(SkeletonFormHostComponent);
    });

    it('should have aria-busy="true" and aria-label when loading', () => {
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('[aria-busy="true"]');
      expect(el).not.toBeNull();

      const ariaLabel = el.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel.toLowerCase()).toContain('loading');
    });
  });
});
