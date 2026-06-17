import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * System Settings Page Component
 *
 * Provides administrative system-level settings including:
 * - Theme selection (light, dark, corporate, business)
 * - Placeholder sections for future settings (notifications, security, etc.)
 *
 * Requirements: 18.1
 */
@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 space-y-6 animate-[fade-in_0.4s_ease-out]">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-bold text-base-content">System Settings</h1>
        <p class="text-sm text-base-content/60 mt-1">
          Configure system-wide settings and preferences
        </p>
      </div>

      <!-- Theme Settings -->
      <div class="card bg-base-100 shadow-sm border border-base-300/50">
        <div class="card-body">
          <h2 class="card-title text-lg flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">palette</span>
            Appearance
          </h2>
          <p class="text-sm text-base-content/60 mb-4">
            Choose a theme for the application. Your preference is saved and applied automatically.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              *ngFor="let theme of availableThemes"
              class="card border-2 p-4 cursor-pointer transition-all hover:shadow-md"
              [class.border-primary]="currentTheme === theme"
              [class.border-base-300]="currentTheme !== theme"
              (click)="selectTheme(theme)">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center"
                  [ngClass]="getThemeIconClass(theme)">
                  <span class="material-symbols-outlined text-sm text-white">
                    {{ getThemeIcon(theme) }}
                  </span>
                </div>
                <div class="text-left">
                  <p class="font-medium text-sm capitalize">{{ theme }}</p>
                  <p class="text-xs text-base-content/50">{{ getThemeDescription(theme) }}</p>
                </div>
              </div>
              <div *ngIf="currentTheme === theme" class="mt-2 flex justify-end">
                <span class="badge badge-primary badge-sm">Active</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Notifications Settings -->
      <div class="card bg-base-100 shadow-sm border border-base-300/50">
        <div class="card-body">
          <h2 class="card-title text-lg flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">notifications</span>
            Notifications
          </h2>
          <p class="text-sm text-base-content/60">
            Configure system notification preferences and delivery channels.
          </p>
          <div class="mt-4 space-y-3">
            <div class="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
              <div>
                <p class="text-sm font-medium">Email on login</p>
                <p class="text-xs text-base-content/50">Send email notification when a user logs in from a new device</p>
              </div>
              <input type="checkbox" class="toggle toggle-primary toggle-sm" disabled checked />
            </div>
            <div class="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
              <div>
                <p class="text-sm font-medium">Email on password change</p>
                <p class="text-xs text-base-content/50">Notify users when their password is changed or reset</p>
              </div>
              <input type="checkbox" class="toggle toggle-primary toggle-sm" disabled checked />
            </div>
            <div class="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
              <div>
                <p class="text-sm font-medium">In-app notifications</p>
                <p class="text-xs text-base-content/50">Show real-time notifications within the application</p>
              </div>
              <input type="checkbox" class="toggle toggle-primary toggle-sm" disabled checked />
            </div>
            <p class="text-xs text-base-content/40 italic mt-2">These settings will be configurable in a future release.</p>
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="card bg-base-100 shadow-sm border border-base-300/50">
        <div class="card-body">
          <h2 class="card-title text-lg flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">security</span>
            Security
          </h2>
          <p class="text-sm text-base-content/60">
            Password policies, session timeouts, and authentication settings.
          </p>
          <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-base-200/50 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined text-sm text-primary">password</span>
                <p class="text-sm font-semibold">Password Policy</p>
              </div>
              <ul class="text-xs text-base-content/70 space-y-1">
                <li>• Min 8 characters</li>
                <li>• 1 uppercase letter</li>
                <li>• 1 number</li>
                <li>• 1 special character</li>
              </ul>
            </div>
            <div class="p-4 bg-base-200/50 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined text-sm text-warning">lock</span>
                <p class="text-sm font-semibold">Account Lockout</p>
              </div>
              <ul class="text-xs text-base-content/70 space-y-1">
                <li>• 5 failed attempts</li>
                <li>• 15 min lockout duration</li>
              </ul>
            </div>
            <div class="p-4 bg-base-200/50 rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined text-sm text-info">schedule</span>
                <p class="text-sm font-semibold">Session Timeout</p>
              </div>
              <ul class="text-xs text-base-content/70 space-y-1">
                <li>• 60 minutes inactivity</li>
                <li>• Token refresh rotation</li>
              </ul>
            </div>
          </div>
          <p class="text-xs text-base-content/40 italic mt-3">These values are enforced server-side. Configuration UI will be available in a future release.</p>
        </div>
      </div>

      <!-- General Settings -->
      <div class="card bg-base-100 shadow-sm border border-base-300/50">
        <div class="card-body">
          <h2 class="card-title text-lg flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">tune</span>
            General
          </h2>
          <p class="text-sm text-base-content/60">
            System-wide configuration options including locale, timezone, and defaults.
          </p>
          <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-base-200/50 rounded-lg">
              <p class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Application Name</p>
              <p class="text-sm font-semibold">BuildEstate Pro</p>
            </div>
            <div class="p-4 bg-base-200/50 rounded-lg">
              <p class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Version</p>
              <p class="text-sm font-semibold">1.0.0</p>
            </div>
            <div class="p-4 bg-base-200/50 rounded-lg">
              <p class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Environment</p>
              <p class="text-sm font-semibold">Development</p>
            </div>
          </div>
          <p class="text-xs text-base-content/40 italic mt-3">Additional configuration options will be available in a future release.</p>
        </div>
      </div>
    </div>
  `
})
export class SystemSettingsComponent {
  private readonly themeService = inject(ThemeService);

  readonly availableThemes = this.themeService.getAvailableThemes();

  get currentTheme(): string {
    return this.themeService.getTheme();
  }

  selectTheme(theme: string): void {
    this.themeService.setTheme(theme);
  }

  getThemeIcon(theme: string): string {
    switch (theme) {
      case 'light': return 'light_mode';
      case 'dark': return 'dark_mode';
      case 'corporate': return 'business';
      case 'business': return 'work';
      default: return 'palette';
    }
  }

  getThemeIconClass(theme: string): string {
    switch (theme) {
      case 'light': return 'bg-amber-400';
      case 'dark': return 'bg-slate-700';
      case 'corporate': return 'bg-blue-600';
      case 'business': return 'bg-indigo-600';
      default: return 'bg-primary';
    }
  }

  getThemeDescription(theme: string): string {
    switch (theme) {
      case 'light': return 'Clean and bright';
      case 'dark': return 'Easy on the eyes';
      case 'corporate': return 'Professional blue';
      case 'business': return 'Sleek and modern';
      default: return '';
    }
  }
}
