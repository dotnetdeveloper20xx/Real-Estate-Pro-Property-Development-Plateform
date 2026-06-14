import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Profile page component.
 *
 * Displays user information, activity summary, and role permissions.
 * Uses mock data for demonstration purposes.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6">
      <!-- Page Header -->
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-primary text-3xl">person</span>
        <div>
          <h1 class="text-2xl font-bold text-base-content">My Profile</h1>
          <p class="text-sm text-base-content/60">View your account information and activity</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- User Info Card -->
        <div class="card bg-base-100 shadow-sm border border-base-300 lg:col-span-1">
          <div class="card-body items-center text-center">
            <!-- Avatar -->
            <div class="avatar placeholder mb-4">
              <div class="bg-primary text-primary-content rounded-full w-20 h-20">
                <span class="text-2xl font-bold">JM</span>
              </div>
            </div>

            <h2 class="card-title text-lg">{{ user.name }}</h2>
            <p class="text-sm text-base-content/60">{{ user.email }}</p>

            <div class="badge badge-primary badge-outline mt-2">{{ user.role }}</div>

            <div class="divider my-3"></div>

            <div class="w-full space-y-3 text-left">
              <div class="flex items-center gap-3 text-sm">
                <span class="material-symbols-outlined text-base text-base-content/50">calendar_today</span>
                <div>
                  <p class="text-xs text-base-content/50">Joined</p>
                  <p class="font-medium">{{ user.joinedDate }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <span class="material-symbols-outlined text-base text-base-content/50">location_on</span>
                <div>
                  <p class="text-xs text-base-content/50">Office</p>
                  <p class="font-medium">{{ user.office }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <span class="material-symbols-outlined text-base text-base-content/50">phone</span>
                <div>
                  <p class="text-xs text-base-content/50">Phone</p>
                  <p class="font-medium">{{ user.phone }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <span class="material-symbols-outlined text-base text-base-content/50">badge</span>
                <div>
                  <p class="text-xs text-base-content/50">Employee ID</p>
                  <p class="font-medium">{{ user.employeeId }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Activity Summary -->
          <div class="card bg-base-100 shadow-sm border border-base-300">
            <div class="card-body">
              <h3 class="card-title text-base flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">history</span>
                Recent Activity
              </h3>
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Module</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let activity of recentActivity">
                      <td class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm text-base-content/50">{{ activity.icon }}</span>
                        {{ activity.action }}
                      </td>
                      <td>
                        <span class="badge badge-ghost badge-sm">{{ activity.module }}</span>
                      </td>
                      <td class="text-base-content/60 text-xs">{{ activity.date }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Role & Permissions -->
          <div class="card bg-base-100 shadow-sm border border-base-300">
            <div class="card-body">
              <h3 class="card-title text-base flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">shield</span>
                Role &amp; Permissions
              </h3>
              <p class="text-sm text-base-content/60 mb-3">
                Your access level is determined by your assigned role. Contact your administrator to request changes.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  *ngFor="let perm of permissions"
                  class="flex items-center gap-2 p-2 rounded-lg bg-base-200/50">
                  <span class="material-symbols-outlined text-success text-sm">check_circle</span>
                  <span class="text-sm">{{ perm }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistics -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div *ngFor="let stat of stats"
              class="card bg-base-100 shadow-sm border border-base-300">
              <div class="card-body p-4 items-center text-center">
                <span class="material-symbols-outlined text-primary text-xl">{{ stat.icon }}</span>
                <p class="text-2xl font-bold">{{ stat.value }}</p>
                <p class="text-xs text-base-content/60">{{ stat.label }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent {
  readonly user = {
    name: 'John Mitchell',
    email: 'j.mitchell@buildestate.co.uk',
    role: 'Acquisition Manager',
    joinedDate: '15 March 2023',
    office: 'London HQ',
    phone: '+44 20 7946 0958',
    employeeId: 'BE-2023-0042'
  };

  readonly recentActivity = [
    { action: 'Created opportunity "Riverside Site"', module: 'Land Acquisition', date: '2 hours ago', icon: 'add_circle' },
    { action: 'Updated pipeline status', module: 'Land Acquisition', date: '5 hours ago', icon: 'edit' },
    { action: 'Submitted planning application', module: 'Planning', date: '1 day ago', icon: 'send' },
    { action: 'Approved due diligence report', module: 'Legal', date: '2 days ago', icon: 'check_circle' },
    { action: 'Added contract document', module: 'Legal', date: '3 days ago', icon: 'upload_file' },
    { action: 'Reviewed compliance checklist', module: 'Legal', date: '4 days ago', icon: 'fact_check' }
  ];

  readonly permissions = [
    'View Land Opportunities',
    'Create Land Opportunities',
    'Edit Land Opportunities',
    'Manage Pipeline',
    'Submit for Approval',
    'View Planning Applications',
    'View Legal Cases',
    'Upload Documents',
    'View Reports',
    'Export Data'
  ];

  readonly stats = [
    { icon: 'terrain', value: '24', label: 'Opportunities' },
    { icon: 'assignment', value: '8', label: 'Applications' },
    { icon: 'task_alt', value: '156', label: 'Tasks Done' },
    { icon: 'calendar_month', value: '14', label: 'This Month' }
  ];
}
