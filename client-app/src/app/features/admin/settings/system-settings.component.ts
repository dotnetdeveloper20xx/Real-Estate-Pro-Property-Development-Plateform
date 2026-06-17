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

      <!-- Notifications Settings (Placeholder) -->
      <div class="card bg-base-100 shadow-sm border border-base-300/50">
        <div class="card-body">
          <h2 class="card-title text-lg flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">notifications</span>
            Notifications
          </h2>
          <p class="text-sm text-base-content/60">
            Configure system notification preferences and delivery channels.
          </p>
          <div class="mt-4 p-4 bg-base-200/50 rounded-lg text-center">
            <span class="material-symbols-outlined text-3xl text-base-content/30">construction</span>
            <p class="text-sm text-base-content/50 mt-2">Notification settings coming soon</p>
          </div>
        </div>
      </div>

      <!-- Security Settings (Placeholder) -->
      <div class="card bg-base-100 shadow-sm border border-base-300/50">
        <div class="card-body">
          <h2 class="card-title text-lg flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">security</span>
            Security
          </h2>
          <p class="text-sm text-base-content/60">
            Password policies, session timeouts, and authentication settings.
          </p>
          <div class="mt-4 p-4 bg-base-200/50 rounded-lg text-center">
            <span class="material-symbols-outlined text-3xl text-base-content/30">construction</span>
            <p class="text-sm text-base-content/50 mt-2">Security settings coming soon</p>
          </div>
        </div>
      </div>

      <!-- General Settings (Placeholder) -->
      <div class="card bg-base-100 shadow-sm border border-base-300/50">
        <div class="card-body">
          <h2 class="card-title text-lg flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">tune</span>
            General
          </h2>
          <p class="text-sm text-base-content/60">
            System-wide configuration options including locale, timezone, and defaults.
          </p>
          <div class="mt-4 p-4 bg-base-200/50 rounded-lg text-center">
            <span class="material-symbols-outlined text-3xl text-base-content/30">construction</span>
            <p class="text-sm text-base-content/50 mt-2">General settings coming soon</p>
          </div>
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
