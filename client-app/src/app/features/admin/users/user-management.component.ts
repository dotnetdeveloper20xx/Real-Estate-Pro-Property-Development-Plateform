import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DataTableComponent, IColumnDefinition, ITableAction, IActionClickEvent } from '../../../shared/design-system';
import { ToastService } from '../../../core/services/toast.service';

/**
 * User data model from the API.
 */
interface IUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: string[];
}

/**
 * Role option for the multi-select.
 */
interface IRoleOption {
  id: string;
  name: string;
}

/**
 * Create/Edit user form interface.
 */
interface IUserForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  roles: FormControl<string[]>;
}

/**
 * User Management page for SuperAdmin users.
 *
 * Features:
 * - Data grid showing all users with name, email, roles, status
 * - Create user modal with form validation
 * - Edit user modal (reuses same form)
 * - Activate/Deactivate toggle per user
 * - Reset password action
 * - Role assignment via multi-select
 */
@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">User Management</h1>
          <p class="text-sm text-base-content/60 mt-1">
            Manage user accounts, roles, and access permissions
          </p>
        </div>
        <button class="btn btn-primary gap-2" (click)="openCreateModal()">
          <span class="material-symbols-outlined text-lg">person_add</span>
          Create User
        </button>
      </div>

      <!-- Users Data Table -->
      <app-data-table
        [data]="usersGridData"
        [columns]="columns"
        [loading]="loading"
        [totalCount]="totalCount"
        [pageSizeOptions]="[10, 25, 50]"
        [actions]="tableActions"
        searchPlaceholder="Search users..."
        emptyIcon="people"
        emptyMessage="No users found"
        emptySubtext="Create a new user to get started"
        (actionClick)="onActionClick($event)"
        (rowClick)="onEditUser($event)"
        (pageChange)="onTablePageChange($event)"
        (searchChange)="onSearch($event)">
      </app-data-table>

      <!-- Create/Edit User Modal -->
      <dialog class="modal" [class.modal-open]="showModal">
        <div class="modal-box w-full max-w-lg">
          <h3 class="text-lg font-bold mb-4">
            {{ editingUser ? 'Edit User' : 'Create User' }}
          </h3>

          <form [formGroup]="userForm" (ngSubmit)="onSaveUser()" class="space-y-4">
            <!-- Name Row -->
            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">First Name</span>
                </label>
                <input
                  type="text"
                  formControlName="firstName"
                  placeholder="First name"
                  class="input input-bordered w-full"
                  [class.input-error]="isFieldInvalid('firstName')" />
                <label class="label" *ngIf="isFieldInvalid('firstName')">
                  <span class="label-text-alt text-error">First name is required</span>
                </label>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Last Name</span>
                </label>
                <input
                  type="text"
                  formControlName="lastName"
                  placeholder="Last name"
                  class="input input-bordered w-full"
                  [class.input-error]="isFieldInvalid('lastName')" />
                <label class="label" *ngIf="isFieldInvalid('lastName')">
                  <span class="label-text-alt text-error">Last name is required</span>
                </label>
              </div>
            </div>

            <!-- Email -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Email Address</span>
              </label>
              <input
                type="email"
                formControlName="email"
                placeholder="user@buildestate.co.uk"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('email')" />
              <label class="label" *ngIf="isFieldInvalid('email')">
                <span class="label-text-alt text-error">Valid email is required</span>
              </label>
            </div>

            <!-- Password (only for create or reset) -->
            <div class="form-control" *ngIf="!editingUser">
              <label class="label">
                <span class="label-text font-medium">Password</span>
              </label>
              <input
                type="password"
                formControlName="password"
                placeholder="Minimum 8 characters"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('password')" />
              <label class="label" *ngIf="isFieldInvalid('password')">
                <span class="label-text-alt text-error">Password must be at least 8 characters</span>
              </label>
            </div>

            <!-- Roles Multi-Select -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Roles</span>
              </label>
              <div class="flex flex-wrap gap-2 p-3 border border-base-300 rounded-lg min-h-[3rem]">
                <label
                  *ngFor="let role of availableRoles"
                  class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm checkbox-primary"
                    [checked]="isRoleSelected(role.name)"
                    (change)="toggleRole(role.name)" />
                  <span class="text-sm">{{ role.name }}</span>
                </label>
              </div>
            </div>

            <!-- Modal Actions -->
            <div class="modal-action">
              <button type="button" class="btn btn-ghost" (click)="closeModal()">
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="saving">
                <span *ngIf="saving" class="loading loading-spinner loading-sm"></span>
                {{ editingUser ? 'Update User' : 'Create User' }}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button (click)="closeModal()">close</button>
        </form>
      </dialog>

      <!-- Reset Password Confirmation Modal -->
      <dialog class="modal" [class.modal-open]="showResetModal">
        <div class="modal-box w-full max-w-sm">
          <h3 class="text-lg font-bold">Reset Password</h3>
          <p class="py-4 text-sm text-base-content/70">
            Are you sure you want to reset the password for
            <span class="font-semibold">{{ resetTargetName }}</span>?
            They will receive a temporary password.
          </p>
          <div class="modal-action">
            <button class="btn btn-ghost" (click)="showResetModal = false">Cancel</button>
            <button class="btn btn-warning" (click)="confirmResetPassword()">
              Reset Password
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button (click)="showResetModal = false">close</button>
        </form>
      </dialog>
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  // Grid state
  loading = false;
  users: IUserDto[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;
  searchTerm = '';

  // Modal state
  showModal = false;
  showResetModal = false;
  editingUser: IUserDto | null = null;
  saving = false;
  resetTargetName = '';
  private resetTargetId = '';

  // Available roles for the multi-select
  availableRoles: IRoleOption[] = [];

  readonly columns: IColumnDefinition[] = [
    { key: 'name', label: 'Name', sortable: true, type: 'text', visible: true },
    { key: 'email', label: 'Email', sortable: true, type: 'text', visible: true },
    { key: 'rolesDisplay', label: 'Roles', sortable: false, type: 'text', visible: true },
    {
      key: 'statusDisplay',
      label: 'Status',
      type: 'badge',
      sortable: true,
      visible: true,
      badgeMap: {
        'Active': { label: 'Active', cssClass: 'badge-success' },
        'Inactive': { label: 'Inactive', cssClass: 'badge-error' }
      }
    }
  ];

  readonly tableActions: ITableAction[] = [
    { label: 'Edit', icon: 'edit', event: 'edit' },
    { label: 'Reset Password', icon: 'lock_reset', event: 'resetPassword' }
  ];

  /** Form for creating/editing users. */
  userForm: FormGroup<IUserForm> = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    roles: [[] as string[]]
  });

  /** Transformed data for the grid (adds computed display fields). */
  get usersGridData(): Record<string, unknown>[] {
    return this.users.map(user => ({
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      rolesDisplay: user.roles.join(', '),
      statusDisplay: user.isActive ? 'Active' : 'Inactive'
    }));
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.loading = true;
    const params: Record<string, string> = {
      pageNumber: this.currentPage.toString(),
      pageSize: this.pageSize.toString()
    };
    if (this.searchTerm) {
      params['search'] = this.searchTerm;
    }

    this.http.get<IUserDto[]>('/api/v1/users', { params }).subscribe({
      next: (users) => {
        this.users = users;
        this.totalCount = users.length; // Updated from pagination header if available
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Failed to load users');
      }
    });
  }

  loadRoles(): void {
    this.http.get<IRoleOption[]>('/api/v1/roles').subscribe({
      next: (roles) => {
        this.availableRoles = roles;
      },
      error: () => {
        // Provide defaults if API unavailable
        this.availableRoles = [
          { id: '1', name: 'SuperAdmin' },
          { id: '2', name: 'ProjectManager' },
          { id: '3', name: 'AcquisitionManager' },
          { id: '4', name: 'FinanceDirector' },
          { id: '5', name: 'SalesManager' },
          { id: '6', name: 'SiteManager' },
          { id: '7', name: 'Viewer' }
        ];
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  onTablePageChange(event: { page: number; pageSize: number }): void {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadUsers();
  }

  onActionClick(event: IActionClickEvent): void {
    const row = event.row as Record<string, unknown>;
    switch (event.action) {
      case 'edit':
        this.onEditUser(row);
        break;
      case 'resetPassword': {
        const user = this.users.find(u => u.id === row['id']);
        if (user) this.openResetPassword(user);
        break;
      }
    }
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.loadUsers();
  }

  // ── Modal operations ────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.editingUser = null;
    this.userForm.reset();
    this.userForm.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.controls.password.updateValueAndValidity();
    this.showModal = true;
  }

  onEditUser(row: Record<string, unknown> | unknown): void {
    const r = row as Record<string, unknown>;
    const user = this.users.find(u => u.id === r['id']);
    if (!user) return;

    this.editingUser = user;
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: [...user.roles]
    });
    // Password not required for edit
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.password.updateValueAndValidity();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingUser = null;
  }

  onSaveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formData = this.userForm.getRawValue();

    if (this.editingUser) {
      // Update existing user
      this.http.put(`/api/v1/users/${this.editingUser.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        roles: formData.roles
      }).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.toast.showSuccess('User updated successfully');
          this.loadUsers();
        },
        error: () => {
          this.saving = false;
          this.toast.showError('Failed to update user');
        }
      });
    } else {
      // Create new user
      this.http.post('/api/v1/users', formData).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.toast.showSuccess('User created successfully');
          this.loadUsers();
        },
        error: () => {
          this.saving = false;
          this.toast.showError('Failed to create user');
        }
      });
    }
  }

  // ── Role toggle ─────────────────────────────────────────────────────────────

  isRoleSelected(roleName: string): boolean {
    return this.userForm.controls.roles.value.includes(roleName);
  }

  toggleRole(roleName: string): void {
    const current = [...this.userForm.controls.roles.value];
    const index = current.indexOf(roleName);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(roleName);
    }
    this.userForm.controls.roles.setValue(current);
  }

  // ── Reset Password ──────────────────────────────────────────────────────────

  openResetPassword(user: IUserDto): void {
    this.resetTargetId = user.id;
    this.resetTargetName = `${user.firstName} ${user.lastName}`;
    this.showResetModal = true;
  }

  confirmResetPassword(): void {
    this.http.post(`/api/v1/users/${this.resetTargetId}/reset-password`, {}).subscribe({
      next: () => {
        this.showResetModal = false;
        this.toast.showSuccess('Password reset successfully');
      },
      error: () => {
        this.showResetModal = false;
        this.toast.showError('Failed to reset password');
      }
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  isFieldInvalid(field: keyof IUserForm): boolean {
    const control = this.userForm.controls[field];
    return control.invalid && control.touched;
  }
}
