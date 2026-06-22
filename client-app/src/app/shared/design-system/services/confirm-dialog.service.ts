import { Injectable, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  ConfirmDialogComponent,
  ConfirmDialogResolution,
  ConfirmDialogSeverity,
} from '../dialogs/confirm-dialog/confirm-dialog.component';

/**
 * Options for the confirmation dialog.
 */
export interface IConfirmDialogOptions {
  /** Dialog title (max 100 characters) */
  title: string;
  /** Dialog message (max 500 characters) */
  message: string;
  /** Text for the confirm button. Default: 'Confirm' */
  confirmText?: string;
  /** Text for the cancel button. Default: 'Cancel' */
  cancelText?: string;
  /** Severity level. Default: 'info' */
  severity?: ConfirmDialogSeverity;
}

/**
 * ConfirmDialogService dynamically creates and manages confirm dialogs.
 *
 * Usage:
 * ```typescript
 * this.confirmDialogService.confirm({
 *   title: 'Delete Opportunity',
 *   message: 'Are you sure you want to delete this opportunity? This action cannot be undone.',
 *   confirmText: 'Delete',
 *   severity: 'danger',
 * }).subscribe(confirmed => {
 *   if (confirmed) { ... }
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  constructor(
    private readonly appRef: ApplicationRef,
    private readonly environmentInjector: EnvironmentInjector,
  ) {}

  /**
   * Opens a confirm dialog and returns an Observable<boolean>.
   *
   * Resolution mapping:
   * - confirm → true
   * - cancel → false
   * - backdrop → false
   * - escape → false
   */
  confirm(options: IConfirmDialogOptions): Observable<boolean> {
    const result$ = new Subject<boolean>();

    // Create a host element in the DOM
    const hostElement = document.createElement('div');
    hostElement.setAttribute('data-testid', 'confirm-dialog-host');
    document.body.appendChild(hostElement);

    // Dynamically create the component
    const componentRef = createComponent(ConfirmDialogComponent, {
      hostElement,
      environmentInjector: this.environmentInjector,
    });

    // Set inputs
    componentRef.instance.title = options.title;
    componentRef.instance.message = options.message;
    componentRef.instance.confirmText = options.confirmText ?? 'Confirm';
    componentRef.instance.cancelText = options.cancelText ?? 'Cancel';
    componentRef.instance.severity = options.severity ?? 'info';

    // Re-initialize severity styling after inputs are set
    componentRef.instance.ngOnInit();

    // Subscribe to the resolved output
    componentRef.instance.resolved.pipe(take(1)).subscribe((resolution: ConfirmDialogResolution) => {
      const confirmed = resolution === 'confirm';
      result$.next(confirmed);
      result$.complete();

      // Clean up the component
      this.destroyDialog(componentRef, hostElement);
    });

    // Attach the component to the application
    this.appRef.attachView(componentRef.hostView);

    return result$.asObservable();
  }

  /**
   * Cleans up the dynamically created dialog component and its host element.
   */
  private destroyDialog(
    componentRef: ReturnType<typeof createComponent>,
    hostElement: HTMLElement,
  ): void {
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();
    if (hostElement.parentNode) {
      hostElement.parentNode.removeChild(hostElement);
    }
  }
}
