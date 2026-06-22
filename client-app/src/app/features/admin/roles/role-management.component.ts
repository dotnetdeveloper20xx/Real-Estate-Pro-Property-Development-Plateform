import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DataTableComponent, IColumnDefinition, ITableAction, IActionClickEvent } from '../../../shared/design-system';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Role data model from the API.
 */
interface IRoleDto {
  id: string;
  name: string;
  description: string;
  userCount: number;
}

/**
 * Create/Edit role form interface.
 */
interface IRoleForm {
  name: FormControl<string>;
  description: FormControl<string>;
}

/**
 * Role Management page for SuperAdmin users.
 *
 * Features:
 * - Data grid showing all roles with name, description, and user count
 * - Create role modal with form validation
 * - Edit role modal (reuses same form)
 * - Delete role confirmation
 * - Click row to see users in that role (future enhancement)
 */
@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">Role Management</h1>
          <p class="text-sm text-base-content/60 mt-1">
            Manage system roles and permissions assignments
          </p>
        </div>
        <button class="btn btn-primary gap-2" (click)="openCreateModal()">
          <span class="material-symbols-outlined text-lg">add_circle</span>
          Create Role
        </button>
      </div>

      <!-- Roles Data Table -->
      <app-data-table
        [data]="rolesGridData"
        [columns]="columns"
        [loading]="loading"
        [totalCount]="totalCount"
        [actions]="tableActions"
        searchPlaceholder="Search roles..."
        emptyIcon="admin_panel_settings"
        emptyMessage="No roles found"
        emptySubtext="Create a new role to get started"
        (actionClick)="onActionClick($event)"
        (rowClick)="onRowClick($event)"
        (searchChange)="onSearch($event)">
      </app-data-table>

      <!-- Create/Edit Role Modal -->
      <dialog class="modal" [class.modal-open]="showModal">
        <div class="modal-box w-full max-w-md">
          <h3 class="text-lg font-bold mb-4">
            {{ editingRole ? 'Edit Role' : 'Create Role' }}
          </h3>

          <form [formGroup]="roleForm" (ngSubmit)="onSaveRole()" class="space-y-4">
            <!-- Role Name -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Role Name</span>
              </label>
              <input
                type="text"
                formControlName="name"
                placeholder="e.g. ProjectManager"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('name')" />
              <label class="label" *ngIf="isFieldInvalid('name')">
                <span class="label-text-alt text-error">Role name is required</span>
              </label>
            </div>

            <!-- Description -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Description</span>
              </label>
              <textarea
                formControlName="description"
                placeholder="Describe the responsibilities and access level for this role"
                class="textarea textarea-bordered w-full h-24"
                [class.textarea-error]="isFieldInvalid('description')">
              </textarea>
              <label class="label" *ngIf="isFieldInvalid('description')">
                <span class="label-text-alt text-error">Description is required</span>
              </label>
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
                {{ editingRole ? 'Update Role' : 'Create Role' }}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button (click)="closeModal()">close</button>
        </form>
      </dialog>

      <!-- Delete Confirmation Modal -->
      <dialog class="modal" [class.modal-open]="showDeleteModal">
        <div class="modal-box w-full max-w-sm">
          <h3 class="text-lg font-bold text-error">Delete Role</h3>
          <p class="py-4 text-sm text-base-content/70">
            Are you sure you want to delete the role
            <span class="font-semibold">{{ deleteTargetName }}</span>?
            This action cannot be undone.
          </p>
          <div *ngIf="deleteTargetUserCount > 0" class="alert alert-warning text-sm mb-4">
            <span class="material-symbols-outlined text-lg">warning</span>
            <span>This role is assigned to {{ deleteTargetUserCount }} user(s).</span>
          </div>
          <div class="modal-action">
            <button class="btn btn-ghost" (click)="showDeleteModal = false">Cancel</button>
            <button class="btn btn-error" (click)="confirmDelete()">
              Delete Role
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button (click)="showDeleteModal = false">close</button>
        </form>
      </dialog>

      <!-- Role Users Panel -->
      <dialog class="modal" [class.modal-open]="showUsersPanel">
        <div class="modal-box w-full max-w-md">
          <h3 class="text-lg font-bold mb-2">
            Users in "{{ selectedRoleName }}"
          </h3>
          <p class="text-sm text-base-content/60 mb-4" *ngIf="roleUsers.length === 0">
            No users are currently assigned to this role.
          </p>
          <ul class="space-y-2" *ngIf="roleUsers.length > 0">
            <li *ngFor="let user of roleUsers" class="flex items-center gap-3 p-2 rounded-lg bg-base-200/50">
              <div class="avatar placeholder">
                <div class="bg-primary text-primary-content rounded-full w-8">
                  <span class="text-xs">{{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}</span>
                </div>
              </div>
              <div>
                <p class="text-sm font-medium">{{ user.firstName }} {{ user.lastName }}</p>
                <p class="text-xs text-base-content/60">{{ user.email }}</p>
              </div>
            </li>
          </ul>
          <div class="modal-action">
            <button class="btn btn-ghost" (click)="showUsersPanel = false">Close</button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button (click)="showUsersPanel = false">close</button>
        </form>
      </dialog>
    </div>
  `
})
export class RoleManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  // Grid state
  loading = false;
  roles: IRoleDto[] = [];
  totalCount = 0;
  searchTerm = '';

  // Modal state
  showModal = false;
  showDeleteModal = false;
  showUsersPanel = false;
  editingRole: IRoleDto | null = null;
  saving = false;

  // Delete state
  deleteTargetName = '';
  deleteTargetUserCount = 0;
  private deleteTargetId = '';

  // Users panel state
  selectedRoleName = '';
  roleUsers: Array<{ firstName: string; lastName: string; email: string }> = [];

  readonly columns: IColumnDefinition[] = [
    { key: 'name', label: 'Role Name', sortable: true, type: 'text', visible: true },
    { key: 'description', label: 'Description', sortable: false, type: 'text', visible: true },
    { key: 'userCount', label: 'Users', sortable: true, type: 'number', visible: true, width: '100px' }
  ];

  readonly tableActions: ITableAction[] = [
    { label: 'Edit', icon: 'edit', event: 'edit' },
    { label: 'Delete', icon: 'delete', event: 'delete' }
  ];

  /** Form for creating/editing roles. */
  roleForm: FormGroup<IRoleForm> = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]]
  });

  /** Transformed data for the grid. */
  get rolesGridData(): Record<string, unknown>[] {
    return this.roles.map(role => ({
      ...role
    }));
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.http.get<IRoleDto[]>('/api/v1/roles').subscribe({
      next: (roles) => {
        this.roles = roles;
        this.totalCount = roles.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Failed to load roles');
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    // Client-side filter since role list is typically small
    if (term) {
      this.roles = this.roles.filter(r =>
        r.name.toLowerCase().includes(term.toLowerCase()) ||
        r.description.toLowerCase().includes(term.toLowerCase())
      );
    } else {
      this.loadRoles();
    }
  }

  onActionClick(event: IActionClickEvent): void {
    const row = event.row as Record<string, unknown>;
    switch (event.action) {
      case 'edit':
        this.onEditRole(row);
        break;
      case 'delete':
        this.onDeleteRole(row);
        break;
    }
  }

  onRowClick(row: Record<string, unknown> | unknown): void {
    const r = row as Record<string, unknown>;
    const role = this.roles.find(rl => rl.id === r['id']);
    if (!role) return;
    this.selectedRoleName = role.name;
    this.loadRoleUsers(role.id);
  }

  // ── Create/Edit Modal ───────────────────────────────────────────────────────

  openCreateModal(): void {
    this.editingRole = null;
    this.roleForm.reset();
    this.showModal = true;
  }

  onEditRole(row: Record<string, unknown>): void {
    const role = this.roles.find(r => r.id === row['id']);
    if (!role) return;

    this.editingRole = role;
    this.roleForm.patchValue({
      name: role.name,
      description: role.description
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingRole = null;
  }

  onSaveRole(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formData = this.roleForm.getRawValue();

    if (this.editingRole) {
      this.http.put(`/api/v1/roles/${this.editingRole.id}`, formData).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.toast.showSuccess('Role updated successfully');
          this.loadRoles();
        },
        error: () => {
          this.saving = false;
          this.toast.showError('Failed to update role');
        }
      });
    } else {
      this.http.post('/api/v1/roles', formData).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.toast.showSuccess('Role created successfully');
          this.loadRoles();
        },
        error: () => {
          this.saving = false;
          this.toast.showError('Failed to create role');
        }
      });
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  onDeleteRole(row: Record<string, unknown>): void {
    const role = this.roles.find(r => r.id === row['id']);
    if (!role) return;

    this.deleteTargetId = role.id;
    this.deleteTargetName = role.name;
    this.deleteTargetUserCount = role.userCount;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    this.http.delete(`/api/v1/roles/${this.deleteTargetId}`).subscribe({
      next: () => {
        this.showDeleteModal = false;
        this.toast.showSuccess('Role deleted successfully');
        this.loadRoles();
      },
      error: () => {
        this.showDeleteModal = false;
        this.toast.showError('Failed to delete role');
      }
    });
  }

  // ── Users Panel ─────────────────────────────────────────────────────────────

  private loadRoleUsers(roleId: string): void {
    this.http.get<Array<{ firstName: string; lastName: string; email: string }>>(
      `/api/v1/roles/${roleId}/users`
    ).subscribe({
      next: (users) => {
        this.roleUsers = users;
        this.showUsersPanel = true;
      },
      error: () => {
        this.roleUsers = [];
        this.showUsersPanel = true;
      }
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  isFieldInvalid(field: keyof IRoleForm): boolean {
    const control = this.roleForm.controls[field];
    return control.invalid && control.touched;
  }
}
