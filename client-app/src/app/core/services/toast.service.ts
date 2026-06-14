import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Toast notification type determines styling and icon.
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Represents a single toast notification instance.
 */
export interface IToast {
  readonly id: number;
  readonly type: ToastType;
  readonly message: string;
  dismissing?: boolean;
}

/**
 * Service for displaying toast notifications to the user.
 * Maintains an observable array of active toasts that the container component subscribes to.
 * Supports success, error, warning, and info types with auto-dismiss.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly defaultDuration = 5000;
  private readonly toastsSubject = new BehaviorSubject<IToast[]>([]);

  /** Observable stream of active toasts for the container component. */
  readonly toasts$: Observable<IToast[]> = this.toastsSubject.asObservable();

  /**
   * Display a success toast notification.
   */
  showSuccess(message: string, duration?: number): void {
    this.addToast('success', message, duration);
  }

  /**
   * Display an error toast notification.
   */
  showError(message: string, duration?: number): void {
    this.addToast('error', message, duration);
  }

  /**
   * Display a warning toast notification.
   */
  showWarning(message: string, duration?: number): void {
    this.addToast('warning', message, duration);
  }

  /**
   * Display an informational toast notification.
   */
  showInfo(message: string, duration?: number): void {
    this.addToast('info', message, duration);
  }

  /**
   * Dismiss a toast by marking it as dismissing, then removing after animation.
   */
  dismiss(toast: IToast): void {
    const current = this.toastsSubject.getValue();
    const updated = current.map(t =>
      t.id === toast.id ? { ...t, dismissing: true } : t
    );
    this.toastsSubject.next(updated);

    // Remove after dismiss animation completes
    setTimeout(() => {
      this.removeToast(toast.id);
    }, 300);
  }

  private addToast(type: ToastType, message: string, duration?: number): void {
    const id = this.nextId++;
    const toast: IToast = { id, type, message, dismissing: false };
    const current = this.toastsSubject.getValue();
    this.toastsSubject.next([...current, toast]);

    // Auto-dismiss after configured duration
    const timeout = duration ?? this.defaultDuration;
    setTimeout(() => {
      this.dismiss(toast);
    }, timeout);
  }

  private removeToast(id: number): void {
    const current = this.toastsSubject.getValue();
    this.toastsSubject.next(current.filter(t => t.id !== id));
  }
}
