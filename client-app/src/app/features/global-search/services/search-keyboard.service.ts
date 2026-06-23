import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, Subject, fromEvent } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

/**
 * SearchKeyboardService manages the global Ctrl+K / Cmd+K keyboard shortcut
 * for opening the search overlay. It handles platform detection (Windows vs macOS)
 * and overrides the default browser action even when focus is inside
 * contenteditable elements or text input fields.
 */
@Injectable({ providedIn: 'root' })
export class SearchKeyboardService {
  private readonly document = inject(DOCUMENT);
  private readonly destroy$ = new Subject<void>();
  private readonly openOverlay$ = new Subject<void>();

  /**
   * Observable that emits when the user triggers the search shortcut.
   * Subscribe to this in the component that manages the search overlay.
   */
  get onOpenOverlay(): Observable<void> {
    return this.openOverlay$.asObservable();
  }

  /**
   * Register the global Ctrl+K (Windows/Linux) / Cmd+K (macOS) keyboard listener.
   * This should be called once at application bootstrap (e.g., in AppComponent or a core initializer).
   *
   * The shortcut fires regardless of whether the user is focused in a text input,
   * textarea, or contenteditable element, fulfilling Requirement 1.4.
   */
  register(): void {
    fromEvent<KeyboardEvent>(this.document, 'keydown')
      .pipe(
        filter((event: KeyboardEvent) => {
          // Ctrl+K on Windows/Linux or Cmd+K on macOS
          const isShortcut = (event.ctrlKey || event.metaKey) && event.key === 'k';
          return isShortcut;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((event: KeyboardEvent) => {
        // Prevent default browser action (e.g., Chrome's address bar focus on Ctrl+K)
        event.preventDefault();
        // Stop propagation so other handlers don't interfere
        event.stopPropagation();
        this.openOverlay$.next();
      });
  }

  /**
   * Unregister the keyboard listener and clean up resources.
   * Call this when the application or relevant module is destroyed.
   */
  unregister(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
