import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, debounceTime, switchMap, of, map, catchError } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Permission item for the assignment panel.
 */
interface IPermissionItem {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly domainArea: string;
}

/**
 * Grouped permissions by domain area.
 */
interface IPermissionGroup {
  readonly domainArea: string;
  readonly permissions: IPermissionItem[];
  expanded: boolean;
}

/**
 * Role detail for edit mode.
 */
interface IRoleDetail {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly permissions: readonly IPermissionItem[];
  readonly isBuiltIn: boolean;
}

/**
 * Role Create/Edit Component
 *
 * Features:
 * - Form: Role Name (alphanumeric + hyphens, max 50), Description (max 200)
 * - Permission assignment panel grouped by domain area
 * - Name uniqueness validation (async)
 *
 * Requirements: 8.2, 8.8
 */
@Component({
  selector: 'app-role-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 space-y-6 max-w-4xl mx-auto">
      <!-- Page Header -->
      <div class="flex items-center gap-3">
        <button class="btn btn-ghost btn-sm btn-square" (click)="navigateBack()" aria-label="Go back">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-base-content">
            {{ isEditMode ? 'Edit Role' : 'Create Role' }}
          </h1>
          <p class="text-sm text-base-content/60 mt-1">
            {{ isEditMode ? 'Update role details and permissions' : 'Define a new role with permissions' }}
          </p>
        </div>
      </div>

      <form [formGroup]="roleForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Role Details Card -->
        <div class="card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body space-y-4">
            <h2 class="card-title text-base">Role Details</h2>

            <!-- Role Name -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Role Name <span class="text-error">*</span></span>
              </label>
              <input
                type="text"
                formControlName="name"
                placeholder="e.g. project-manager"
                class="input input-bordered w-full max-w-md"
                [class.input-error]="isFieldInvalid('name')"
                maxlength="50" />
              <label class="label">
                <span class="label-text-alt" *ngIf="!isFieldInvalid('name')">
                  Alphanumeric characters and hyphens only. Max 50 characters.
                </span>
                <span class="label-text-alt text-error" *ngIf="getFieldError('name') as error">
                  {{ error }}
                </span>
                <span class="label-text-alt">{{ roleForm.controls.name.value.length }}/50</span>
              </label>
            </div>

            <!-- Description -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Description <span class="text-error">*</span></span>
              </label>
              <textarea
                formControlName="description"
                placeholder="Describe the responsibilities and access level for this role"
                class="textarea textarea-bordered w-full h-24"
                [class.textarea-error]="isFieldInvalid('description')"
                maxlength="200">
              </textarea>
              <label class="label">
                <span class="label-text-alt text-error" *ngIf="isFieldInvalid('description')">
                  Description is required (max 200 characters)
                </span>
                <span class="label-text-alt">{{ roleForm.controls.description.value.length }}/200</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Permission Assignment Card -->
        <div class="card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="card-title text-base">
                Permission Assignment
                <span class="badge badge-sm badge-ghost">{{ selectedPermissionIds.size }} selected</span>
              </h2>
              <div class="flex gap-2">
                <button type="button" class="btn btn-ghost btn-xs" (click)="selectAllPermissions()">
                  Select All
                </button>
                <button type="button" class="btn btn-ghost btn-xs" (click)="deselectAllPermissions()">
                  Clear All
                </button>
              </div>
            </div>

            <!-- Loading state -->
            <div *ngIf="loadingPermissions" class="flex items-center justify-center py-8">
              <span class="loading loading-spinner loading-md text-primary"></span>
              <span class="ml-2 text-sm text-base-content/60">Loading permissions...</span>
            </div>

            <!-- Permission groups (collapsible) -->
            <div *ngIf="!loadingPermissions" class="space-y-2">
              <div
                *ngFor="let group of permissionGroups; trackBy: trackByDomain"
                class="collapse collapse-arrow bg-base-200/40 border border-base-200/80 rounded-lg">
                <input
                  type="checkbox"
                  [checked]="group.expanded"
                  (change)="group.expanded = !group.expanded" />
                <div class="collapse-title text-sm font-medium flex items-center gap-2 py-2 min-h-0">
                  <span class="material-symbols-outlined text-primary text-sm">folder</span>
                  {{ group.domainArea }}
                  <span class="badge badge-xs badge-ghost">
                    {{ getGroupSelectedCount(group) }}/{{ group.permissions.length }}
                  </span>
                </div>
                <div class="collapse-content px-4 pb-3">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <label
                      *ngFor="let perm of group.permissions"
                      class="flex items-center gap-2 p-2 rounded hover:bg-base-200/60 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm checkbox-primary"
                        [checked]="selectedPermissionIds.has(perm.id)"
                        (change)="togglePermission(perm.id)" />
                      <span class="text-sm">{{ perm.displayName }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Empty permissions state -->
              <div *ngIf="permissionGroups.length === 0" class="text-center py-8 text-base-content/50">
                <span class="material-symbols-outlined text-3xl mb-2">lock_open</span>
                <p class="text-sm">No permissions available</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex items-center justify-end gap-3">
          <button type="button" class="btn btn-ghost" (click)="navigateBack()">Cancel</button>
          <button
            type="submit"
            class="btn btn-primary gap-2"
            [disabled]="saving || roleForm.invalid || roleForm.pending">
            <span *ngIf="saving" class="loading loading-spinner loading-sm"></span>
            <span class="material-symbols-outlined text-lg" *ngIf="!saving">save</span>
            {{ isEditMode ? 'Update Role' : 'Create Role' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class RoleCreateComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  // Form
  roleForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
    description: ['', [Validators.required, Validators.maxLength(200)]]
  });

  // Permission state
  permissionGroups: IPermissionGroup[] = [];
  selectedPermissionIds = new Set<string>();
  loadingPermissions = false;

  // Mode state
  isEditMode = false;
  editRoleId: string | null = null;
  saving = false;
  private originalName = '';

  ngOnInit(): void {
    // Check if editing
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['edit']) {
        this.editRoleId = params['edit'];
        this.isEditMode = true;
        this.loadRoleForEdit(this.editRoleId!);
      }
    });

    // Add async name uniqueness validator
    this.roleForm.controls.name.addAsyncValidators(this.nameUniquenessValidator());
    this.loadPermissions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Form Helpers ────────────────────────────────────────────────────────────

  isFieldInvalid(field: 'name' | 'description'): boolean {
    const control = this.roleForm.controls[field];
    return control.invalid && control.touched;
  }

  getFieldError(field: 'name' | 'description'): string | null {
    const control = this.roleForm.controls[field];
    if (!control.invalid || !control.touched) return null;

    if (control.errors?.['required']) return 'This field is required.';
    if (control.errors?.['maxlength']) {
      const max = control.errors['maxlength'].requiredLength;
      return `Maximum ${max} characters allowed.`;
    }
    if (control.errors?.['pattern']) return 'Only alphanumeric characters and hyphens are allowed.';
    if (control.errors?.['nameTaken']) return 'A role with this name already exists.';
    return null;
  }

  // ── Permission Helpers ──────────────────────────────────────────────────────

  togglePermission(permissionId: string): void {
    if (this.selectedPermissionIds.has(permissionId)) {
      this.selectedPermissionIds.delete(permissionId);
    } else {
      this.selectedPermissionIds.add(permissionId);
    }
  }

  selectAllPermissions(): void {
    for (const group of this.permissionGroups) {
      for (const perm of group.permissions) {
        this.selectedPermissionIds.add(perm.id);
      }
    }
  }

  deselectAllPermissions(): void {
    this.selectedPermissionIds.clear();
  }

  getGroupSelectedCount(group: IPermissionGroup): number {
    return group.permissions.filter(p => this.selectedPermissionIds.has(p.id)).length;
  }

  trackByDomain(_index: number, group: IPermissionGroup): string {
    return group.domainArea;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  navigateBack(): void {
    this.router.navigate(['/admin/roles']);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formData = this.roleForm.getRawValue();
    const payload = {
      name: formData.name,
      description: formData.description,
      permissionIds: Array.from(this.selectedPermissionIds)
    };

    if (this.isEditMode && this.editRoleId) {
      this.http.put(`/api/v1/admin/roles/${this.editRoleId}`, payload).subscribe({
        next: () => {
          this.saving = false;
          this.toast.showSuccess('Role updated successfully');
          this.navigateBack();
        },
        error: () => {
          this.saving = false;
          this.toast.showError('Failed to update role. Please try again.');
        }
      });
    } else {
      this.http.post('/api/v1/admin/roles', payload).subscribe({
        next: () => {
          this.saving = false;
          this.toast.showSuccess('Role created successfully');
          this.navigateBack();
        },
        error: () => {
          this.saving = false;
          this.toast.showError('Failed to create role. Please try again.');
        }
      });
    }
  }

  // ── Data Loading ────────────────────────────────────────────────────────────

  private loadPermissions(): void {
    this.loadingPermissions = true;
    this.http.get<IPermissionItem[]>('/api/v1/permissions').subscribe({
      next: (permissions) => {
        this.permissionGroups = this.groupPermissions(permissions);
        this.loadingPermissions = false;
      },
      error: () => {
        this.loadingPermissions = false;
        this.toast.showError('Failed to load permissions.');
      }
    });
  }

  private loadRoleForEdit(roleId: string): void {
    this.http.get<IRoleDetail>(`/api/v1/admin/roles/${roleId}`).subscribe({
      next: (role) => {
        this.originalName = role.name;
        this.roleForm.patchValue({
          name: role.name,
          description: role.description
        });
        // Pre-select permissions
        for (const perm of role.permissions) {
          this.selectedPermissionIds.add(perm.id);
        }
      },
      error: () => {
        this.toast.showError('Failed to load role. Returning to list.');
        this.navigateBack();
      }
    });
  }

  private groupPermissions(permissions: IPermissionItem[]): IPermissionGroup[] {
    const groups = new Map<string, IPermissionItem[]>();
    for (const perm of permissions) {
      const area = perm.domainArea || 'General';
      if (!groups.has(area)) {
        groups.set(area, []);
      }
      groups.get(area)!.push(perm);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([domainArea, perms]) => ({
        domainArea,
        permissions: perms.sort((a, b) => a.displayName.localeCompare(b.displayName)),
        expanded: true
      }));
  }

  // ── Async Validator ─────────────────────────────────────────────────────────

  private nameUniquenessValidator() {
    return (control: AbstractControl) => {
      if (!control.value || control.value === this.originalName) {
        return of(null);
      }

      return of(control.value).pipe(
        debounceTime(400),
        switchMap(name =>
          this.http.get<{ exists: boolean }>(`/api/v1/admin/roles/check-name?name=${encodeURIComponent(name)}`).pipe(
            map(response => response.exists ? { nameTaken: true } as ValidationErrors : null),
            catchError(() => of(null))
          )
        )
      );
    };
  }
}
