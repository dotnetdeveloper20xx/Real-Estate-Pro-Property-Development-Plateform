import { CanDeactivateFn } from '@angular/router';

/**
 * Interface for components that track unsaved form changes.
 * Components implementing this interface can be protected by the unsavedChangesGuard.
 */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Route guard that warns the user before navigating away from a page with unsaved form data.
 * Displays a browser confirmation dialog if the component reports unsaved changes.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component: HasUnsavedChanges
) => {
  if (component.hasUnsavedChanges()) {
    return confirm(
      'You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.'
    );
  }
  return true;
};
