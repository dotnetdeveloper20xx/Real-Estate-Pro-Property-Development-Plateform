import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService, ICurrentUser } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * Profile page component.
 *
 * Displays the current logged-in user's information and allows them
 * to update their personal details (first name, last name).
 * Email and roles are read-only (managed by admin).
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6">
      <!-- Page Header -->
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-primary text-3xl">person</span>
        <div>
          <h1 class="text-2xl font-bold text-base-content">My Profile</h1>
          <p class="text-sm text-base-content/60">View and update your account information</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- User Info Card -->
        <div class="card bg-base-100 shadow-sm border border-base-300 lg:col-span-1">
          <div class="card-body items-center text-center">
            <!-- Avatar -->
            <div class="avatar placeholder mb-4">
              <div class="bg-primary text-primary-content rounded-full w-20 h-20">
                <span class="text-2xl font-bold">{{ userInitials }}</span>
              </div>
            </div>

            <h2 class="card-title text-lg">{{ userFullName }}</h2>
            <p class="text-sm text-base-content/60">{{ userEmail }}</p>

            <div class="badge badge-primary badge-outline mt-2">{{ userRoleDisplay }}</div>

            <div class="divider my-3"></div>

            <div class="w-full space-y-3 text-left">
              <div class="flex items-center gap-3 text-sm">
                <span class="material-symbols-outlined text-base text-base-content/50">shield</span>
                <div>
                  <p class="text-xs text-base-content/50">Role(s)</p>
                  <p class="font-medium">{{ userRoles }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <span class="material-symbols-outlined text-base text-base-content/50">email</span>
                <div>
                  <p class="text-xs text-base-content/50">Email</p>
                  <p class="font-medium">{{ userEmail }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Edit Personal Details -->
          <div class="card bg-base-100 shadow-sm border border-base-300">
            <div class="card-body">
              <h3 class="card-title text-base flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">edit</span>
                Personal Information
              </h3>
              <p class="text-sm text-base-content/60 mb-4">
                Update your personal details below. Email and roles are managed by your administrator.
              </p>

              <form [formGroup]="profileForm" (ngSubmit)="onSaveProfile()" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="form-control">
                    <label class="label"><span class="label-text font-medium">First Name</span></label>
                    <input type="text" formControlName="firstName" class="input input-bordered" />
                  </div>
                  <div class="form-control">
                    <label class="label"><span class="label-text font-medium">Last Name</span></label>
                    <input type="text" formControlName="lastName" class="input input-bordered" />
                  </div>
                </div>

                <div class="form-control">
                  <label class="label"><span class="label-text font-medium">Email Address</span></label>
                  <input type="email" class="input input-bordered bg-base-200" [value]="userEmail" readonly disabled />
                  <label class="label"><span class="label-text-alt text-base-content/50">Managed by administrator</span></label>
                </div>

                <div class="flex justify-end">
                  <button type="submit" class="btn btn-primary btn-sm" [disabled]="saving || profileForm.invalid || profileForm.pristine">
                    <span *ngIf="saving" class="loading loading-spinner loading-xs"></span>
                    Save Changes
                  </button>
                </div>
              </form>
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
              <div class="flex flex-wrap gap-2">
                <span *ngFor="let role of currentUser?.roles ?? []" class="badge badge-primary badge-outline">
                  {{ formatRole(role) }}
                </span>
                <span *ngIf="!currentUser?.roles?.length" class="text-sm text-base-content/50">No roles assigned</span>
              </div>
            </div>
          </div>

          <!-- Change Password -->
          <div class="card bg-base-100 shadow-sm border border-base-300">
            <div class="card-body">
              <h3 class="card-title text-base flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">lock</span>
                Change Password
              </h3>
              <p class="text-sm text-base-content/60 mb-4">
                Update your password. You'll need to enter your current password for verification.
              </p>

              <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()" class="space-y-4">
                <div class="form-control">
                  <label class="label"><span class="label-text font-medium">Current Password</span></label>
                  <input type="password" formControlName="currentPassword" class="input input-bordered" placeholder="Enter current password" />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="form-control">
                    <label class="label"><span class="label-text font-medium">New Password</span></label>
                    <input type="password" formControlName="newPassword" class="input input-bordered" placeholder="Enter new password" />
                  </div>
                  <div class="form-control">
                    <label class="label"><span class="label-text font-medium">Confirm New Password</span></label>
                    <input type="password" formControlName="confirmPassword" class="input input-bordered" placeholder="Confirm new password" />
                  </div>
                </div>
                <div class="flex justify-end">
                  <button type="submit" class="btn btn-warning btn-sm" [disabled]="changingPassword || passwordForm.invalid">
                    <span *ngIf="changingPassword" class="loading loading-spinner loading-xs"></span>
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  currentUser: ICurrentUser | null = null;
  saving = false;
  changingPassword = false;

  profileForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required]
  });

  passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  get userInitials(): string {
    const u = this.currentUser;
    return u ? `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase() : 'U';
  }

  get userFullName(): string {
    const u = this.currentUser;
    return u ? `${u.firstName} ${u.lastName}` : 'User';
  }

  get userEmail(): string {
    return this.currentUser?.email ?? '';
  }

  get userRoleDisplay(): string {
    const roles = this.currentUser?.roles ?? [];
    return roles.length > 0 ? this.formatRole(roles[0]) : 'No role';
  }

  get userRoles(): string {
    return (this.currentUser?.roles ?? []).map(r => this.formatRole(r)).join(', ') || 'None';
  }

  formatRole(role: string): string {
    return role.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName
      });
    }
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid || !this.currentUser) return;
    this.saving = true;

    const { firstName, lastName } = this.profileForm.getRawValue();

    this.http.put(`/api/v1/users/${this.currentUser.id}`, {
      firstName,
      lastName,
      email: this.currentUser.email,
      isActive: true
    }).subscribe({
      next: () => {
        this.saving = false;
        this.toast.showSuccess('Profile updated successfully');
        // Update local user state
        if (this.currentUser) {
          const updated = { ...this.currentUser, firstName, lastName };
          this.currentUser = updated;
          // Update localStorage so the top bar reflects changes
          localStorage.setItem('be_current_user', JSON.stringify(updated));
        }
        this.profileForm.markAsPristine();
      },
      error: () => {
        this.saving = false;
        this.toast.showError('Failed to update profile');
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) return;

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();

    if (newPassword !== confirmPassword) {
      this.toast.showError('New passwords do not match');
      return;
    }

    this.changingPassword = true;

    this.http.post('/api/v1/auth/change-password', {
      currentPassword,
      newPassword
    }).subscribe({
      next: () => {
        this.changingPassword = false;
        this.toast.showSuccess('Password changed successfully');
        this.passwordForm.reset();
      },
      error: (err) => {
        this.changingPassword = false;
        const msg = err?.error?.errors?.[0] ?? err?.error?.message ?? 'Failed to change password';
        this.toast.showError(msg);
      }
    });
  }
}
