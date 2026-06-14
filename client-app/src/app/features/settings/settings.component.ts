import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Settings page component.
 *
 * Provides user-configurable application settings:
 * - Account info (read-only for demo)
 * - Notification preferences (toggles)
 * - Theme selection (light/dark)
 * - Display preferences
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-6">
      <!-- Page Header -->
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-primary text-3xl">settings</span>
        <div>
          <h1 class="text-2xl font-bold text-base-content">Settings</h1>
          <p class="text-sm text-base-content/60">Manage your account preferences and application settings</p>
        </div>
      </div>

      <!-- Account Settings -->
      <div class="card bg-base-100 shadow-sm border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base flex items-center gap-2 mb-4">
            <span class="material-symbols-outlined text-primary">person</span>
            Account Information
          </h3>
          <p class="text-sm text-base-content/60 mb-4">
            Your account details are managed by your organisation administrator. Contact support to request changes.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text text-sm font-medium">Full Name</span>
              </label>
              <input
                type="text"
                class="input input-bordered input-sm bg-base-200"
                [value]="account.name"
                readonly
                aria-label="Full Name" />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text text-sm font-medium">Email Address</span>
              </label>
              <input
                type="email"
                class="input input-bordered input-sm bg-base-200"
                [value]="account.email"
                readonly
                aria-label="Email Address" />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text text-sm font-medium">Role</span>
              </label>
              <input
                type="text"
                class="input input-bordered input-sm bg-base-200"
                [value]="account.role"
                readonly
                aria-label="Role" />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text text-sm font-medium">Department</span>
              </label>
              <input
                type="text"
                class="input input-bordered input-sm bg-base-200"
                [value]="account.department"
                readonly
                aria-label="Department" />
            </div>
          </div>
        </div>
      </div>

      <!-- Notification Preferences -->
      <div class="card bg-base-100 shadow-sm border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base flex items-center gap-2 mb-4">
            <span class="material-symbols-outlined text-primary">notifications</span>
            Notification Preferences
          </h3>
          <p class="text-sm text-base-content/60 mb-4">
            Choose how and when you receive notifications from BuildEstate Pro.
          </p>

          <div class="space-y-4">
            <div *ngFor="let pref of notificationPrefs"
              class="flex items-center justify-between p-3 rounded-lg bg-base-200/50">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-base-content/50">{{ pref.icon }}</span>
                <div>
                  <p class="text-sm font-medium">{{ pref.label }}</p>
                  <p class="text-xs text-base-content/50">{{ pref.description }}</p>
                </div>
              </div>
              <input
                type="checkbox"
                class="toggle toggle-primary toggle-sm"
                [checked]="pref.enabled"
                (change)="pref.enabled = !pref.enabled"
                [attr.aria-label]="pref.label" />
            </div>
          </div>
        </div>
      </div>

      <!-- Theme & Display -->
      <div class="card bg-base-100 shadow-sm border border-base-300">
        <div class="card-body">
          <h3 class="card-title text-base flex items-center gap-2 mb-4">
            <span class="material-symbols-outlined text-primary">palette</span>
            Appearance
          </h3>
          <p class="text-sm text-base-content/60 mb-4">
            Customise the look and feel of your workspace.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Theme Selection -->
            <div class="form-control">
              <label class="label">
                <span class="label-text text-sm font-medium">Theme</span>
              </label>
              <select
                class="select select-bordered select-sm"
                [(ngModel)]="selectedTheme"
                (ngModelChange)="applyTheme($event)"
                aria-label="Theme selection">
                <option *ngFor="let theme of themes" [value]="theme.value">
                  {{ theme.label }}
                </option>
              </select>
            </div>

            <!-- Sidebar Default -->
            <div class="form-control">
              <label class="label">
                <span class="label-text text-sm font-medium">Sidebar Default</span>
              </label>
              <select
                class="select select-bordered select-sm"
                [(ngModel)]="sidebarDefault"
                aria-label="Sidebar default state">
                <option value="expanded">Expanded</option>
                <option value="collapsed">Collapsed</option>
              </select>
            </div>

            <!-- Items Per Page -->
            <div class="form-control">
              <label class="label">
                <span class="label-text text-sm font-medium">Items Per Page</span>
              </label>
              <select
                class="select select-bordered select-sm"
                [(ngModel)]="itemsPerPage"
                aria-label="Items per page">
                <option *ngFor="let opt of pageOptions" [value]="opt">{{ opt }}</option>
              </select>
            </div>

            <!-- Date Format -->
            <div class="form-control">
              <label class="label">
                <span class="label-text text-sm font-medium">Date Format</span>
              </label>
              <select
                class="select select-bordered select-sm"
                [(ngModel)]="dateFormat"
                aria-label="Date format">
                <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                <option value="yyyy-MM-dd">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Actions -->
      <div class="flex justify-end gap-3">
        <button class="btn btn-ghost btn-sm">Reset to Defaults</button>
        <button class="btn btn-primary btn-sm" (click)="saveSettings()">
          <span class="material-symbols-outlined text-sm">save</span>
          Save Preferences
        </button>
      </div>
    </div>
  `
})
export class SettingsComponent {
  readonly account = {
    name: 'John Mitchell',
    email: 'j.mitchell@buildestate.co.uk',
    role: 'Acquisition Manager',
    department: 'Land Acquisition'
  };

  notificationPrefs = [
    {
      label: 'Email Notifications',
      description: 'Receive important updates and alerts via email',
      icon: 'email',
      enabled: true
    },
    {
      label: 'In-App Notifications',
      description: 'Show real-time notifications within the application',
      icon: 'notifications_active',
      enabled: true
    },
    {
      label: 'Daily Digest',
      description: 'Receive a daily summary of activity and pending items',
      icon: 'summarize',
      enabled: false
    },
    {
      label: 'Weekly Report',
      description: 'Receive a weekly performance and status report',
      icon: 'calendar_month',
      enabled: true
    },
    {
      label: 'Approval Alerts',
      description: 'Immediate notification when items require your approval',
      icon: 'approval',
      enabled: true
    },
    {
      label: 'Deadline Reminders',
      description: 'Get reminded 24 hours before task deadlines',
      icon: 'alarm',
      enabled: true
    }
  ];

  readonly themes = [
    { value: 'corporate', label: 'Corporate (Light)' },
    { value: 'business', label: 'Business (Dark)' },
    { value: 'nord', label: 'Nord' },
    { value: 'winter', label: 'Winter' }
  ];

  selectedTheme = 'corporate';
  sidebarDefault = 'expanded';
  itemsPerPage = 25;
  dateFormat = 'dd/MM/yyyy';
  readonly pageOptions = [10, 25, 50, 100];

  applyTheme(theme: string): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  saveSettings(): void {
    // In a real app this would persist to backend/localStorage
    alert('Preferences saved successfully.');
  }
}
