import { Injectable } from '@angular/core';

/**
 * Service for displaying toast notifications to the user.
 * Wraps the underlying notification mechanism (e.g., PrimeNG Toast, DaisyUI alerts).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /**
   * Display an error toast notification.
   */
  showError(message: string): void {
    // TODO: Integrate with actual toast/notification UI component
    console.error('[Toast Error]', message);
  }

  /**
   * Display a success toast notification.
   */
  showSuccess(message: string): void {
    // TODO: Integrate with actual toast/notification UI component
    console.info('[Toast Success]', message);
  }

  /**
   * Display an informational toast notification.
   */
  showInfo(message: string): void {
    // TODO: Integrate with actual toast/notification UI component
    console.info('[Toast Info]', message);
  }

  /**
   * Display a warning toast notification.
   */
  showWarning(message: string): void {
    // TODO: Integrate with actual toast/notification UI component
    console.warn('[Toast Warning]', message);
  }
}
