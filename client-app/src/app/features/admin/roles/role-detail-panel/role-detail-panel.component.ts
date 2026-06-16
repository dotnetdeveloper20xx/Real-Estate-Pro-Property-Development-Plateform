import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Permission item interface.
 */
interface IPermissionItem {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly domainArea: string;
}

/**
 * Role detail interface for the panel.
 */
interface IRoleDetail {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly userCount: number;
  readonly isBuiltIn: boolean;
  readonly permissions: readonly IPermissionItem[];
}

/**
 * Role Detail Side Panel Component
 *
 * Standalone presentational component for displaying role details in a drawer.
 *
 * Features:
 * - Show: role name, description, "Edit Role" button, total permissions count, assigned permissions list
 * - "View All Permissions" link to permission matrix
 * - Delete button with warning dialog showing affected user count for roles with users
 *
 * Requirements: 8.3, 8.4, 8.7
 */
@Component({
  selector: 'app-role-detail-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-base-100 min-h-full w-96 p-6 border-l border-base-200 space-y-6" *ngIf="role">
      <!-- Panel Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-base-content">Role Details</h2>
        <button class="btn btn-ghost btn-sm btn-square" (click)="close.emit()" aria-label="Close panel">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Role Info -->
      <div class="space-y-4">
        <div>
          <p class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Role Name</p>
          <p class="text-base font-semibold">{{ formatRoleName(role.name) }}</p>
        </div>
        <div>
          <p class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Description</p>
          <p class="text-sm text-base-content/80">{{ role.description || 'No description provided' }}</p>
        </div>
        <div class="flex items-center gap-4">
          <div>
            <p class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Users Assigned</p>
            <span class="badge badge-ghost">{{ role.userCount }}</span>
          </div>
          <div>
            <p class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Type</p>
            <span class="badge badge-sm" [ngClass]="role.isBuiltIn ? 'badge-info' : 'badge-accent'">
              {{ role.isBuiltIn ? 'Built-in' : 'Custom' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Permissions Section -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs text-base-content/50 uppercase tracking-wider">
            Permissions ({{ role.permissions.length }})
          </p>
          <button class="btn btn-ghost btn-xs gap-1" (click)="viewAllPermissions.emit()">
            View All Permissions
            <span class="material-symbols-outlined text-xs">open_in_new</span>
          </button>
        </div>
        <div class="space-y-1 max-h-64 overflow-y-auto pr-1">
          <div
            *ngFor="let perm of role.permissions"
            class="flex items-center gap-2 py-1.5 px-2 rounded bg-base-200/50 text-sm">
            <span class="material-symbols-outlined text-success text-sm">check_circle</span>
            <div class="flex-1 min-w-0">
              <span class="truncate block">{{ perm.displayName }}</span>
              <span class="text-xs text-base-content/40">{{ perm.domainArea }}</span>
            </div>
          </div>
          <p *ngIf="role.permissions.length === 0" class="text-sm text-base-content/50 italic py-4 text-center">
            No permissions assigned to this role
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-4 border-t border-base-200 space-y-2">
        <button
          class="btn btn-outline btn-sm w-full gap-2"
          (click)="editRole.emit(role.id)"
          *ngIf="!role.isBuiltIn">
          <span class="material-symbols-outlined text-sm">edit</span>
          Edit Role
        </button>
        <button
          class="btn btn-error btn-outline btn-sm w-full gap-2"
          (click)="showDeleteWarning = true"
          *ngIf="!role.isBuiltIn">
          <span class="material-symbols-outlined text-sm">delete</span>
          Delete Role
        </button>
        <p *ngIf="role.isBuiltIn" class="text-xs text-base-content/50 text-center italic">
          Built-in roles cannot be edited or deleted
        </p>
      </div>

      <!-- Delete Warning (inline) -->
      <div *ngIf="showDeleteWarning" class="card bg-error/10 border border-error/30 p-4 space-y-3">
        <p class="text-sm font-medium text-error">Confirm Deletion</p>
        <p class="text-sm text-base-content/70">
          Are you sure you want to delete "<span class="font-semibold">{{ role.name }}</span>"?
        </p>
        <div *ngIf="role.userCount > 0" class="alert alert-warning text-xs py-2">
          <span class="material-symbols-outlined text-sm">warning</span>
          <span>{{ role.userCount }} user(s) will lose this role's permissions.</span>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-xs flex-1" (click)="showDeleteWarning = false">Cancel</button>
          <button class="btn btn-error btn-xs flex-1" (click)="onConfirmDelete()">Delete</button>
        </div>
      </div>
    </div>
  `
})
export class RoleDetailPanelComponent {
  @Input() role: IRoleDetail | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() editRole = new EventEmitter<string>();
  @Output() deleteRole = new EventEmitter<string>();
  @Output() viewAllPermissions = new EventEmitter<void>();

  showDeleteWarning = false;

  formatRoleName(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ');
  }

  onConfirmDelete(): void {
    if (this.role) {
      this.deleteRole.emit(this.role.id);
      this.showDeleteWarning = false;
    }
  }
}
