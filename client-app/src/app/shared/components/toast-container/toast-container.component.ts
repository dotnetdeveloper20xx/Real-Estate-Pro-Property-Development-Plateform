import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, IToast, ToastType } from '@core/services/toast.service';

/**
 * Toast container component that renders active toasts in the bottom-right corner.
 * Subscribes to the ToastService observable and displays stacked notifications
 * with slide-in animation and dismiss capability.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
         aria-live="polite"
         aria-atomic="false">
      <div *ngFor="let toast of toasts; trackBy: trackById"
        class="alert shadow-lg pointer-events-auto animate-[slide-in-right_0.3s_ease-out]"
        [class.alert-success]="toast.type === 'success'"
        [class.alert-error]="toast.type === 'error'"
        [class.alert-warning]="toast.type === 'warning'"
        [class.alert-info]="toast.type === 'info'"
        [class.opacity-0]="toast.dismissing"
        [class.translate-x-full]="toast.dismissing"
        [attr.role]="toast.type === 'error' ? 'alert' : 'status'"
        style="transition: opacity 0.3s ease, transform 0.3s ease;">
        <span class="material-symbols-outlined text-lg">{{ getIcon(toast.type) }}</span>
        <span class="text-sm flex-1">{{ toast.message }}</span>
        <button class="btn btn-ghost btn-xs btn-circle"
                (click)="dismiss(toast)"
                aria-label="Dismiss notification">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);

  toasts: IToast[] = [];

  constructor() {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  trackById(_index: number, toast: IToast): number {
    return toast.id;
  }

  getIcon(type: ToastType): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
    }
  }

  dismiss(toast: IToast): void {
    this.toastService.dismiss(toast);
  }
}
