import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Role option for the assignment panel.
 */
interface IRoleOption {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

/**
 * Edit user form interface (no password fields).
 */
interface IEditUserForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  roles: FormControl<string[]>;
}

/**
 * User data for pre-population.
 */
interface IUserData {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly roles: string[];
  readonly isActive: boolean;
}

/**
 * User Edit Page Component
 *
 * Features:
 * - Pre-populated form with current data (excluding password)
 * - Same role assignment panel as create
 * - Submit → update user → success notification
 *
 * Requirements: 4.5
 */
@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-6">
      <!-- Loading state -->
      <div *ngIf="loading" class="animate-pulse space-y-4">
        <div class="h-8 bg-base-300 rounded w-48"></div>
        <div class="h-64 bg-base-300 rounded"></div>
      </div>

      <!-- Form content -->
      <ng-container *ngIf="!loading && userData">
        <!-- Page Header -->
        <div class="flex items-center gap-4">
          <button class="btn btn-ghost btn-sm btn-square" (click)="navigateBack()" aria-label="Back">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-base-content">Edit User</h1>
            <p class="text-sm text-base-content/60 mt-1">
              Update {{ userData.firstName }} {{ userData.lastName }}'s account details
            </p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Personal Information Card -->
          <div class="card bg-base-100 shadow-sm border border-base-200/80">
            <div class="card-body">
              <h2 class="card-title text-base">Personal Information</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div class="form-control">
                  <label class="label" for="firstName">
                    <span class="label-text font-medium">First Name <span class="text-error">*</span></span>
                  </label>
                  <input id="firstName" type="text" formControlName="firstName"
                    class="input input-bordered w-full"
                    [class.input-error]="isFieldInvalid('firstName')" />
                  <label class="label" *ngIf="isFieldInvalid('firstName')">
                    <span class="label-text-alt text-error">First name is required</span>
                  </label>
                </div>
                <div class="form-control">
                  <label class="label" for="lastName">
                    <span class="label-text font-medium">Last Name <span class="text-error">*</span></span>
                  </label>
                  <input id="lastName" type="text" formControlName="lastName"
                    class="input input-bordered w-full"
                    [class.input-error]="isFieldInvalid('lastName')" />
                  <label class="label" *ngIf="isFieldInvalid('lastName')">
                    <span class="label-text-alt text-error">Last name is required</span>
                  </label>
                </div>
              </div>

              <!-- Email -->
              <div class="form-control mt-4">
                <label class="label" for="email">
                  <span class="label-text font-medium">Email Address <span class="text-error">*</span></span>
                </label>
                <input id="email" type="email" formControlName="email"
                  class="input input-bordered w-full"
                  [class.input-error]="isFieldInvalid('email')" />
                <label class="label" *ngIf="isFieldInvalid('email')">
                  <span class="label-text-alt text-error">Valid email is required</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Role Assignment Card -->
          <div class="card bg-base-100 shadow-sm border border-base-200/80">
            <div class="card-body">
              <h2 class="card-title text-base">Role Assignment</h2>
              <p class="text-sm text-base-content/60">
                Modify this user's roles. Role changes will revoke active sessions.
              </p>

              <!-- Role search -->
              <div class="form-control mt-3">
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm">search</span>
                  <input type="text" placeholder="Search roles..."
                    class="input input-bordered input-sm pl-9 w-full max-w-xs"
                    [(ngModel)]="roleSearchTerm" [ngModelOptions]="{standalone: true}"
                    aria-label="Search roles" />
                </div>
              </div>

              <!-- Roles Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                <label *ngFor="let role of filteredRoles"
                  class="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200/50 cursor-pointer transition-colors">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-primary"
                    [checked]="isRoleSelected(role.name)" (change)="toggleRole(role.name)" />
                  <div>
                    <span class="text-sm font-medium">{{ formatRoleName(role.name) }}</span>
                    <p class="text-xs text-base-content/50" *ngIf="role.description">{{ role.description }}</p>
                  </div>
                </label>
              </div>
              <p class="text-xs text-base-content/50 mt-2" *ngIf="selectedRolesCount > 0">
                {{ selectedRolesCount }} role(s) selected
              </p>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-end gap-3">
            <button type="button" class="btn btn-ghost" (click)="navigateBack()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="submitting || form.invalid">
              <span *ngIf="submitting" class="loading loading-spinner loading-sm"></span>
              Update User
            </button>
          </div>
        </form>
      </ng-container>
    </div>
  `
})
export class UserEditComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // State
  loading = true;
  submitting = false;
  userData: IUserData | null = null;
  roleSearchTerm = '';
  availableRoles: IRoleOption[] = [];

  /** Reactive form for editing user (no password). */
  form: FormGroup<IEditUserForm> = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    roles: [[] as string[]]
  });

  get filteredRoles(): IRoleOption[] {
    if (!this.roleSearchTerm.trim()) return this.availableRoles;
    const term = this.roleSearchTerm.toLowerCase();
    return this.availableRoles.filter(r =>
      r.name.toLowerCase().includes(term) || r.description.toLowerCase().includes(term)
    );
  }

  get selectedRolesCount(): number {
    return this.form.controls.roles.value.length;
  }

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUser(userId);
      this.loadRoles();
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.userData) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const { firstName, lastName, email, roles } = this.form.getRawValue();
    const userId = this.userData.id;

    // Update profile info
    this.http.put(`/api/v1/users/${userId}`, {
      firstName, lastName, email, isActive: this.userData.isActive
    }).subscribe({
      next: () => {
        // Also update roles via the separate endpoint
        this.http.put(`/api/v1/users/${userId}/roles`, { roles }).subscribe({
          next: () => {
            this.submitting = false;
            this.toast.showSuccess('User updated successfully');
            this.router.navigate(['/admin/users', userId]);
          },
          error: () => {
            this.submitting = false;
            this.toast.showSuccess('User profile updated but role assignment failed');
            this.router.navigate(['/admin/users', userId]);
          }
        });
      },
      error: (err) => {
        this.submitting = false;
        const message = err?.error?.errors?.[0] ?? 'Failed to update user';
        this.toast.showError(message);
      }
    });
  }

  navigateBack(): void {
    if (this.userData) {
      this.router.navigate(['/admin/users', this.userData.id]);
    } else {
      this.router.navigate(['/admin/users']);
    }
  }

  isRoleSelected(roleName: string): boolean {
    return this.form.controls.roles.value.includes(roleName);
  }

  toggleRole(roleName: string): void {
    const current = [...this.form.controls.roles.value];
    const index = current.indexOf(roleName);
    if (index >= 0) { current.splice(index, 1); }
    else { current.push(roleName); }
    this.form.controls.roles.setValue(current);
  }

  formatRoleName(role: string): string {
    return role.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  isFieldInvalid(field: keyof IEditUserForm): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  private loadUser(userId: string): void {
    this.http.get<any>(`/api/v1/users/${userId}`).subscribe({
      next: (response) => {
        const user = response.data ?? response;
        this.userData = user;
        this.form.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roles: [...user.roles]
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Failed to load user data');
        this.router.navigate(['/admin/users']);
      }
    });
  }

  private loadRoles(): void {
    this.http.get<any>('/api/v1/roles').subscribe({
      next: (response) => { this.availableRoles = response.data ?? (Array.isArray(response) ? response : []); },
      error: () => {
        this.availableRoles = [
          { id: '1', name: 'SuperAdmin', description: 'Full system access' },
          { id: '2', name: 'AcquisitionManager', description: 'Manages land opportunities' },
          { id: '3', name: 'LegalOfficer', description: 'Legal & compliance management' },
          { id: '4', name: 'PlanningManager', description: 'Planning applications & approvals' },
          { id: '5', name: 'ProjectManager', description: 'Project planning & execution' },
          { id: '6', name: 'SiteManager', description: 'Construction site management' },
          { id: '7', name: 'SalesManager', description: 'Sales & marketing' },
          { id: '8', name: 'CompletionManager', description: 'Handover & completion' },
          { id: '9', name: 'PropertyManager', description: 'Property operations' },
          { id: '10', name: 'FinanceDirector', description: 'Financial oversight' },
          { id: '11', name: 'ValuationAnalyst', description: 'Valuations & feasibility' },
          { id: '12', name: 'Surveyor', description: 'Technical assessments' },
          { id: '13', name: 'Admin', description: 'System administration' }
        ];
      }
    });
  }
}
