import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';

import { SearchOverlayComponent } from './search-overlay.component';
import { ISearchState, initialSearchState } from '../../store/search.state';

/**
 * Unit tests for SearchOverlayComponent accessibility compliance.
 * Validates ARIA attributes, structural rendering, and accessible markup
 * per WCAG 2.1 AA requirements and search-review-checklist.md accessibility section.
 */
describe('SearchOverlayComponent — Accessibility', () => {
  let component: SearchOverlayComponent;
  let fixture: ComponentFixture<SearchOverlayComponent>;
  let store: MockStore;

  const initialState: { search: ISearchState } = {
    search: {
      ...initialSearchState,
      overlayOpen: true
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchOverlayComponent],
      providers: [
        provideMockStore({ initialState })
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(SearchOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('ARIA attributes', () => {
    it('should render the dialog with role="dialog"', () => {
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
    });

    it('should have aria-modal="true" on the dialog element', () => {
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-label="Global search" on the dialog element', () => {
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog.getAttribute('aria-label')).toBe('Global search');
    });

    it('should have aria-label="Search query" on the search input', () => {
      const input = fixture.nativeElement.querySelector('input[type="text"]');
      expect(input).not.toBeNull();
      expect(input.getAttribute('aria-label')).toBe('Search query');
    });

    it('should have role="listbox" on the results container', () => {
      const listbox = fixture.nativeElement.querySelector('[role="listbox"]');
      expect(listbox).not.toBeNull();
    });

    it('should have aria-label="Search results" on the listbox', () => {
      const listbox = fixture.nativeElement.querySelector('[role="listbox"]');
      expect(listbox).not.toBeNull();
      expect(listbox.getAttribute('aria-label')).toBe('Search results');
    });

    it('should have an aria-live region for result count announcements', () => {
      const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
      expect(liveRegion).not.toBeNull();
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
    });
  });

  describe('Structural rendering', () => {
    it('should render the overlay when overlayOpen is true', () => {
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
    });

    it('should not render the overlay when overlayOpen is false', () => {
      store.setState({ search: { ...initialSearchState, overlayOpen: false } });
      fixture.detectChanges();

      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog).toBeNull();
    });

    it('should render a backdrop element with aria-hidden="true"', () => {
      const backdrop = fixture.nativeElement.querySelector('[aria-hidden="true"]');
      expect(backdrop).not.toBeNull();
    });

    it('should render the search input element', () => {
      const input = fixture.nativeElement.querySelector('input[type="text"]');
      expect(input).not.toBeNull();
      expect(input.getAttribute('placeholder')).toContain('Search');
    });

    it('should render the ESC keyboard hint', () => {
      const kbd = fixture.nativeElement.querySelector('kbd');
      expect(kbd).not.toBeNull();
      expect(kbd.textContent).toContain('ESC');
    });
  });

  describe('Keyboard support', () => {
    it('should close overlay on Escape keydown', () => {
      spyOn(component, 'close');
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      dialog.dispatchEvent(event);
      expect(component.close).toHaveBeenCalled();
    });
  });
});
