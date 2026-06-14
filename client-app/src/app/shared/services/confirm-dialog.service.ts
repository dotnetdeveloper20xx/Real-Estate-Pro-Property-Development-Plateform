import { Injectable } from '@angular/core';

export interface IConfirmDialogOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmClass?: string;
  icon?: string;
  iconClass?: string;
}

/**
 * Service for showing a styled confirmation dialog using DaisyUI modal.
 * Returns a Promise<boolean> so it can be used in route guards.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {

  confirm(options: IConfirmDialogOptions = {}): Promise<boolean> {
    const {
      title = 'Unsaved Changes',
      message = 'You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.',
      confirmText = 'Leave Page',
      cancelText = 'Stay',
      confirmClass = 'btn-error',
      icon = 'warning',
      iconClass = 'text-warning'
    } = options;

    return new Promise<boolean>((resolve) => {
      // Create modal backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal modal-open';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');

      // Determine background color from icon class
      const iconBg = iconClass.includes('error') ? 'error' : iconClass.includes('warning') ? 'warning' : 'primary';

      backdrop.innerHTML = `
        <div class="modal-box max-w-sm shadow-2xl border border-base-200 animate-[scale-in_0.2s_ease-out]">
          <div class="flex flex-col items-center text-center gap-3 pt-2 pb-4">
            <div class="w-14 h-14 rounded-full flex items-center justify-center bg-${iconBg}/10">
              <span class="material-symbols-outlined text-3xl ${iconClass}">${icon}</span>
            </div>
            <div class="space-y-1">
              <h3 class="text-base font-bold text-base-content">${title}</h3>
              <p class="text-sm text-base-content/60 leading-relaxed">${message}</p>
            </div>
          </div>
          <div class="flex gap-2 justify-end pt-2 border-t border-base-200">
            <button class="btn btn-ghost btn-sm" id="confirm-cancel">${cancelText}</button>
            <button class="btn ${confirmClass} btn-sm shadow-sm" id="confirm-ok">${confirmText}</button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop bg-black/30 backdrop-blur-[2px]">
          <button id="confirm-backdrop">close</button>
        </form>
      `;

      document.body.appendChild(backdrop);

      const cleanup = (result: boolean) => {
        backdrop.classList.remove('modal-open');
        setTimeout(() => document.body.removeChild(backdrop), 200);
        resolve(result);
      };

      backdrop.querySelector('#confirm-ok')!.addEventListener('click', () => cleanup(true));
      backdrop.querySelector('#confirm-cancel')!.addEventListener('click', () => cleanup(false));
      backdrop.querySelector('#confirm-backdrop')!.addEventListener('click', () => cleanup(false));
    });
  }
}
