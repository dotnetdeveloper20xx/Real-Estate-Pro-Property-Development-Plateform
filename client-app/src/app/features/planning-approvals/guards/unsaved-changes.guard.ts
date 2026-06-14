import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

/**
 * Interface for components that track unsaved form state.
 */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Route guard that warns the user before navigating away from a page with unsaved form data.
 * Displays a styled DaisyUI modal confirmation dialog.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component: HasUnsavedChanges
) => {
  if (component.hasUnsavedChanges()) {
    const confirmDialog = inject(ConfirmDialogService);
    return confirmDialog.confirm({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.',
      confirmText: 'Leave Page',
      cancelText: 'Stay',
      confirmClass: 'btn-error',
      icon: 'warning',
      iconClass: 'text-warning'
    });
  }
  return true;
};
