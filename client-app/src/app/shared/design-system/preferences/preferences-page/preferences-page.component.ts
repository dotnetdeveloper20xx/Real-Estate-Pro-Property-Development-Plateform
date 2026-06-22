import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PreferencesActions } from '../../services/state/preferences.actions';
import {
  selectPreferences,
  selectPreferencesLoading,
  selectPreferencesSaving,
  selectPreferencesError,
} from '../../services/state/preferences.selectors';
import {
  IUserPreferences,
  INotificationPreferences,
  DEFAULT_USER_PREFERENCES,
} from '../../services/state/preferences.state';
import { DisplayPreferenceService } from '../../services/display-preference.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

/**
 * PreferencesPageComponent
 *
 * A dedicated page allowing users to configure their display preferences:
 *   - Theme (light, dark, corporate, business)
 *   - Font scale (small / regular / large)
 *   - Display density (compact / default / comfortable)
 *   - Notification preferences (inApp, email, dailyDigest, weeklyDigest)
 *   - Date format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
 *
 * Features:
 *   - Live preview section with sample card, button, table row, form field, badge
 *   - Save button with success/error notifications
 *   - Unsaved changes detection with confirmation dialog on navigate-away
 *   - Reset to defaults button
 *   - Wired to NgRx preferences store for persistence
 *
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8
 */
@Component({
  selector: 'app-preferences-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-6xl mx-auto p-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold">Display Preferences</h1>
        <p class="text-base-content/70 mt-1">
          Customize your display settings. Changes are previewed in real time below.
        </p>

        <!-- Tab Navigation (Req 16.4) -->
        <div class="tabs tabs-bordered mt-4">
          <a class="tab tab-active">Preferences</a>
          <a class="tab" routerLink="/preferences/playground">Component Playground</a>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Settings Panel -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Theme Selection -->
          <div class="card bg-base-200 shadow-sm">
            <div class="card-body">
              <h2 class="card-title text-lg">Theme</h2>
              <p class="text-sm text-base-content/60 mb-3">
                Choose a colour theme for the application.
              </p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                @for (option of themeOptions; track option.value) {
                  <button
                    type="button"
                    class="btn btn-sm"
                    [class.btn-primary]="currentTheme() === option.value"
                    [class.btn-ghost]="currentTheme() !== option.value"
                    (click)="onThemeChange(option.value)"
                    [attr.aria-pressed]="currentTheme() === option.value">
                    {{ option.label }}
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Font Scale -->
          <div class="card bg-base-200 shadow-sm">
            <div class="card-body">
              <h2 class="card-title text-lg">Font Scale</h2>
              <p class="text-sm text-base-content/60 mb-3">
                Adjust font size and spacing for readability.
              </p>
              <div class="grid grid-cols-3 gap-3">
                @for (option of fontScaleOptions; track option.value) {
                  <button
                    type="button"
                    class="btn btn-sm"
                    [class.btn-primary]="currentFontScale() === option.value"
                    [class.btn-ghost]="currentFontScale() !== option.value"
                    (click)="onFontScaleChange(option.value)"
                    [attr.aria-pressed]="currentFontScale() === option.value">
                    {{ option.label }}
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Display Density -->
          <div class="card bg-base-200 shadow-sm">
            <div class="card-body">
              <h2 class="card-title text-lg">Display Density</h2>
              <p class="text-sm text-base-content/60 mb-3">
                Control vertical spacing between UI elements.
              </p>
              <div class="grid grid-cols-3 gap-3">
                @for (option of densityOptions; track option.value) {
                  <button
                    type="button"
                    class="btn btn-sm"
                    [class.btn-primary]="currentDensity() === option.value"
                    [class.btn-ghost]="currentDensity() !== option.value"
                    (click)="onDensityChange(option.value)"
                    [attr.aria-pressed]="currentDensity() === option.value">
                    {{ option.label }}
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Date Format -->
          <div class="card bg-base-200 shadow-sm">
            <div class="card-body">
              <h2 class="card-title text-lg">Date Format</h2>
              <p class="text-sm text-base-content/60 mb-3">
                Select how dates are displayed throughout the application.
              </p>
              <div class="grid grid-cols-3 gap-3">
                @for (option of dateFormatOptions; track option.value) {
                  <button
                    type="button"
                    class="btn btn-sm"
                    [class.btn-primary]="currentDateFormat() === option.value"
                    [class.btn-ghost]="currentDateFormat() !== option.value"
                    (click)="onDateFormatChange(option.value)"
                    [attr.aria-pressed]="currentDateFormat() === option.value">
                    {{ option.label }}
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Notifications -->
          <div class="card bg-base-200 shadow-sm">
            <div class="card-body">
              <h2 class="card-title text-lg">Notifications</h2>
              <p class="text-sm text-base-content/60 mb-3">
                Configure how and when you receive notifications.
              </p>
              <div class="space-y-3">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    class="toggle toggle-primary toggle-sm"
                    [checked]="currentNotifications().inApp"
                    (change)="onNotificationChange('inApp', $event)" />
                  <span class="label-text">In-app notifications</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    class="toggle toggle-primary toggle-sm"
                    [checked]="currentNotifications().email"
                    (change)="onNotificationChange('email', $event)" />
                  <span class="label-text">Email notifications</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    class="toggle toggle-primary toggle-sm"
                    [checked]="currentNotifications().dailyDigest"
                    (change)="onNotificationChange('dailyDigest', $event)" />
                  <span class="label-text">Daily digest</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    class="toggle toggle-primary toggle-sm"
                    [checked]="currentNotifications().weeklyDigest"
                    (change)="onNotificationChange('weeklyDigest', $event)" />
                  <span class="label-text">Weekly digest</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="!hasUnsavedChanges() || saving()"
              (click)="onSave()">
              @if (saving()) {
                <span class="loading loading-spinner loading-xs"></span>
                Saving...
              } @else {
                Save Preferences
              }
            </button>
            <button
              type="button"
              class="btn btn-ghost"
              [disabled]="saving()"
              (click)="onResetToDefaults()">
              Reset to Defaults
            </button>
          </div>

          <!-- Success / Error notifications -->
          @if (saveSuccess()) {
            <div class="alert alert-success shadow-sm">
              <span class="material-symbols-outlined">check_circle</span>
              <span>Preferences saved successfully.</span>
            </div>
          }
          @if (saveError()) {
            <div class="alert alert-error shadow-sm">
              <span class="material-symbols-outlined">error</span>
              <span>{{ saveError() }}</span>
            </div>
          }
        </div>

        <!-- Live Preview Panel -->
        <div class="lg:col-span-1">
          <div class="sticky top-6 space-y-4">
            <h2 class="text-lg font-semibold mb-3">Live Preview</h2>

            <!-- Sample Card -->
            <div class="card bg-base-100 shadow-sm border border-base-300">
              <div class="card-body p-4">
                <h3 class="card-title text-sm">Sample Project</h3>
                <p class="text-xs text-base-content/60">London SE1 — Residential Development</p>
                <div class="flex items-center gap-2 mt-2">
                  <span class="badge badge-success badge-sm">Active</span>
                  <span class="text-xs text-base-content/50">Updated 2 days ago</span>
                </div>
              </div>
            </div>

            <!-- Sample Button -->
            <div class="flex gap-2">
              <button type="button" class="btn btn-primary btn-sm">Primary</button>
              <button type="button" class="btn btn-ghost btn-sm">Ghost</button>
              <button type="button" class="btn btn-outline btn-sm">Outline</button>
            </div>

            <!-- Sample Table Row -->
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Status</th>
                    <th scope="col">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Riverside Plot</td>
                    <td><span class="badge badge-info badge-xs">Under Review</span></td>
                    <td>£1,250,000</td>
                  </tr>
                  <tr>
                    <td>Park Lane Site</td>
                    <td><span class="badge badge-success badge-xs">Active</span></td>
                    <td>£3,400,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Sample Form Field -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text text-sm">Project Name</span>
              </label>
              <input
                type="text"
                class="input input-bordered input-sm w-full"
                placeholder="Enter project name"
                disabled />
            </div>

            <!-- Sample Badge Collection -->
            <div class="flex flex-wrap gap-2">
              <span class="badge badge-success badge-sm">Active</span>
              <span class="badge badge-warning badge-sm">Pending</span>
              <span class="badge badge-error badge-sm">Critical</span>
              <span class="badge badge-info badge-sm">Info</span>
              <span class="badge badge-ghost badge-sm">Archived</span>
            </div>

            <!-- Date Format Preview -->
            <div class="text-sm text-base-content/70">
              <span class="font-medium">Date format:</span>
              {{ formattedDatePreview() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PreferencesPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly displayPreferenceService = inject(DisplayPreferenceService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly destroy$ = new Subject<void>();

  // --- Option Definitions ---

  readonly themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'business', label: 'Business' },
  ];

  readonly fontScaleOptions: { value: 'small' | 'regular' | 'large'; label: string }[] = [
    { value: 'small', label: 'Small (75%)' },
    { value: 'regular', label: 'Regular (100%)' },
    { value: 'large', label: 'Large (125%)' },
  ];

  readonly densityOptions: { value: 'compact' | 'default' | 'comfortable'; label: string }[] = [
    { value: 'compact', label: 'Compact' },
    { value: 'default', label: 'Default' },
    { value: 'comfortable', label: 'Comfortable' },
  ];

  readonly dateFormatOptions: { value: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'; label: string }[] = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  ];

  // --- Signals for current working preferences ---

  readonly currentTheme = signal<string>('light');
  readonly currentFontScale = signal<'small' | 'regular' | 'large'>('regular');
  readonly currentDensity = signal<'compact' | 'default' | 'comfortable'>('default');
  readonly currentDateFormat = signal<'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'>('DD/MM/YYYY');
  readonly currentNotifications = signal<INotificationPreferences>({
    inApp: true,
    email: true,
    dailyDigest: false,
    weeklyDigest: false,
  });

  // --- Last saved preferences (for unsaved detection) ---
  private savedPreferences: IUserPreferences | null = null;

  // --- UI State Signals ---
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly saveSuccess = signal<boolean>(false);
  readonly saveError = signal<string | null>(null);

  // --- Computed ---

  readonly hasUnsavedChanges = computed(() => {
    if (!this.savedPreferences) return false;
    const current = this.buildCurrentPreferences();
    return (
      current.theme !== this.savedPreferences.theme ||
      current.fontScale !== this.savedPreferences.fontScale ||
      current.density !== this.savedPreferences.density ||
      current.dateFormat !== this.savedPreferences.dateFormat ||
      current.notifications.inApp !== this.savedPreferences.notifications.inApp ||
      current.notifications.email !== this.savedPreferences.notifications.email ||
      current.notifications.dailyDigest !== this.savedPreferences.notifications.dailyDigest ||
      current.notifications.weeklyDigest !== this.savedPreferences.notifications.weeklyDigest
    );
  });

  readonly formattedDatePreview = computed(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    switch (this.currentDateFormat()) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  });

  // --- Lifecycle ---

  ngOnInit(): void {
    // Dispatch load preferences action
    this.store.dispatch(PreferencesActions.loadPreferences());

    // Subscribe to store state
    this.store.select(selectPreferences).pipe(takeUntil(this.destroy$)).subscribe(prefs => {
      if (prefs) {
        this.savedPreferences = prefs;
        this.currentTheme.set(prefs.theme);
        this.currentFontScale.set(prefs.fontScale);
        this.currentDensity.set(prefs.density);
        this.currentDateFormat.set(prefs.dateFormat);
        this.currentNotifications.set({ ...prefs.notifications });
      }
    });

    this.store.select(selectPreferencesLoading).pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading.set(loading);
    });

    this.store.select(selectPreferencesSaving).pipe(takeUntil(this.destroy$)).subscribe(saving => {
      this.saving.set(saving);
    });

    this.store.select(selectPreferencesError).pipe(takeUntil(this.destroy$)).subscribe(error => {
      if (error) {
        this.saveError.set(`Failed to save preferences: ${error}`);
        this.saveSuccess.set(false);
        // Revert to last saved values on error (Requirement 15.6)
        if (this.savedPreferences) {
          this.applyPreferencesLocally(this.savedPreferences);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Event Handlers ---

  onThemeChange(theme: string): void {
    this.currentTheme.set(theme);
    this.displayPreferenceService.applyTheme(theme);
    this.clearNotifications();
  }

  onFontScaleChange(scale: 'small' | 'regular' | 'large'): void {
    this.currentFontScale.set(scale);
    this.displayPreferenceService.applyFontScale(scale);
    this.clearNotifications();
  }

  onDensityChange(density: 'compact' | 'default' | 'comfortable'): void {
    this.currentDensity.set(density);
    this.displayPreferenceService.applyDensity(density);
    this.clearNotifications();
  }

  onDateFormatChange(dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'): void {
    this.currentDateFormat.set(dateFormat);
    this.clearNotifications();
  }

  onNotificationChange(key: keyof INotificationPreferences, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.currentNotifications();
    this.currentNotifications.set({ ...current, [key]: checked });
    this.clearNotifications();
  }

  onSave(): void {
    const preferences = this.buildCurrentPreferences();
    this.saveError.set(null);
    this.saveSuccess.set(false);
    this.store.dispatch(PreferencesActions.savePreferences({ preferences }));

    // Listen for save result
    this.store.select(selectPreferencesSaving).pipe(takeUntil(this.destroy$)).subscribe(saving => {
      if (!saving && !this.saveError()) {
        // Check if save completed successfully by verifying saving just turned off
        const error = this.saveError();
        if (!error) {
          this.saveSuccess.set(true);
          this.savedPreferences = preferences;
          // Auto-hide success after 3 seconds
          setTimeout(() => this.saveSuccess.set(false), 3000);
        }
      }
    });
  }

  onResetToDefaults(): void {
    const defaults = DEFAULT_USER_PREFERENCES;
    this.applyPreferencesLocally(defaults);
    this.displayPreferenceService.applyAllVisualPreferences(defaults);
    this.clearNotifications();
  }

  /**
   * Called by a CanDeactivate guard to check for unsaved changes.
   * Returns an Observable<boolean> where true = allow navigation, false = stay.
   *
   * Requirement 15.7: Unsaved changes detection with confirmation dialog on navigate-away.
   */
  canDeactivate(): boolean | import('rxjs').Observable<boolean> {
    if (!this.hasUnsavedChanges()) {
      return true;
    }
    return this.confirmDialogService.confirm({
      title: 'Unsaved Changes',
      message: 'You have unsaved preference changes. Are you sure you want to leave? Your changes will be lost.',
      confirmText: 'Discard Changes',
      cancelText: 'Stay',
      severity: 'warning',
    });
  }

  // --- Private Helpers ---

  private buildCurrentPreferences(): IUserPreferences {
    return {
      theme: this.currentTheme(),
      fontScale: this.currentFontScale(),
      density: this.currentDensity(),
      dateFormat: this.currentDateFormat(),
      notifications: { ...this.currentNotifications() },
    };
  }

  private applyPreferencesLocally(prefs: IUserPreferences): void {
    this.currentTheme.set(prefs.theme);
    this.currentFontScale.set(prefs.fontScale);
    this.currentDensity.set(prefs.density);
    this.currentDateFormat.set(prefs.dateFormat);
    this.currentNotifications.set({ ...prefs.notifications });
  }

  private clearNotifications(): void {
    this.saveSuccess.set(false);
    this.saveError.set(null);
  }
}
