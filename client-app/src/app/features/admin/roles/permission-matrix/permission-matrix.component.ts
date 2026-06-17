import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Permission item.
 */
interface IPermissionItem {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly domainArea: string;
}

/**
 * Role item.
 */
interface IRoleItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly userCount: number;
  readonly isBuiltIn: boolean;
}

/**
 * Assignment cell in the matrix.
 */
interface IAssignmentCell {
  readonly roleId: string;
  readonly permissionId: string;
  readonly isGranted: boolean;
}

/**
 * Full permission matrix from API.
 */
interface IPermissionMatrix {
  readonly roles: readonly IRoleItem[];
  readonly permissionGroups: readonly { readonly domainArea: string; readonly permissions: readonly IPermissionItem[] }[];
  readonly cells: readonly IAssignmentCell[];
}

/**
 * Grouped permissions for display.
 */
interface IPermissionGroup {
  domainArea: string;
  permissions: IPermissionItem[];
  expanded: boolean;
}

/**
 * Permission Matrix Page Component
 *
 * Features:
 * - Grid: permissions as rows (grouped by domain area, collapsible), roles as columns
 * - Checkmark cells for granted permissions
 * - Search input filtering permission rows (300ms debounce)
 * - Toggle click → confirmation dialog (role name, permission name, session revocation warning)
 * - Confirm → update → success notification; failure → revert checkbox state + error notification
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
@Component({
  selector: 'app-permission-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button class="btn btn-ghost btn-sm btn-square" (click)="navigateBack()" aria-label="Go back">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-base-content">Permission Matrix</h1>
            <p class="text-sm text-base-content/60 mt-1">
              View and manage permission assignments across all roles
            </p>
          </div>
        </div>
      </div>

      <!-- Search and Info -->
      <div class="card bg-base-100 shadow-sm border border-base-200/80">
        <div class="px-4 py-3 flex flex-wrap items-center gap-3">
          <div class="relative flex-1 min-w-[250px]">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm">search</span>
            <input
              type="text"
              placeholder="Search permissions..."
              class="input input-bordered input-sm pl-9 w-full"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchInput($event)"
              aria-label="Search permissions" />
          </div>
          <div class="text-sm text-base-content/60" *ngIf="matrix">
            {{ matrix.permissions.length }} permissions × {{ matrix.roles.length }} roles
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading" class="flex items-center justify-center py-16">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <span class="ml-3 text-base-content/60">Loading permission matrix...</span>
      </div>

      <!-- Matrix Grid -->
      <div *ngIf="!loading && matrix" class="card bg-base-100 shadow-sm border border-base-200/80 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table table-xs table-pin-rows" role="grid" aria-label="Permission matrix">
            <thead>
              <tr class="bg-base-200/70">
                <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 sticky left-0 bg-base-200/70 z-10 min-w-[200px]">
                  Permission
                </th>
                <th
                  *ngFor="let role of matrix.roles; trackBy: trackByRoleId"
                  class="text-xs font-semibold text-center text-base-content/60 min-w-[100px] max-w-[120px]">
                  <div class="writing-mode-normal">
                    <span class="block truncate" [title]="role.name">{{ formatRoleName(role.name) }}</span>
                    <span class="text-[10px] text-base-content/40 font-normal">({{ role.userCount }})</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let group of filteredGroups; trackBy: trackByDomain">
                <!-- Domain Group Header -->
                <tr class="bg-base-200/30 cursor-pointer hover:bg-base-200/50" (click)="toggleGroup(group)">
                  <td [attr.colspan]="matrix.roles.length + 1" class="sticky left-0 bg-base-200/30">
                    <div class="flex items-center gap-2 py-1">
                      <span class="material-symbols-outlined text-sm transition-transform"
                        [class.rotate-90]="group.expanded">
                        chevron_right
                      </span>
                      <span class="material-symbols-outlined text-primary text-sm">folder</span>
                      <span class="font-medium text-sm">{{ group.domainArea }}</span>
                      <span class="badge badge-xs badge-ghost">{{ group.permissions.length }}</span>
                    </div>
                  </td>
                </tr>

                <!-- Permission Rows -->
                <ng-container *ngIf="group.expanded">
                  <tr *ngFor="let perm of group.permissions; trackBy: trackByPermId"
                    class="hover:bg-base-200/20 transition-colors">
                    <td class="sticky left-0 bg-base-100 z-10 border-r border-base-200/50">
                      <span class="text-sm text-base-content/80 pl-6">{{ perm.displayName }}</span>
                    </td>
                    <td *ngFor="let role of matrix.roles; trackBy: trackByRoleId" class="text-center">
                      <button
                        class="btn btn-ghost btn-xs btn-square"
                        [class.text-success]="isGranted(role.id, perm.id)"
                        [class.text-base-content\/20]="!isGranted(role.id, perm.id)"
                        (click)="onToggleClick(role, perm)"
                        [attr.aria-label]="(isGranted(role.id, perm.id) ? 'Revoke' : 'Grant') + ' ' + perm.displayName + ' for ' + role.name">
                        <span class="material-symbols-outlined text-lg">
                          {{ isGranted(role.id, perm.id) ? 'check_circle' : 'radio_button_unchecked' }}
                        </span>
                      </button>
                    </td>
                  </tr>
                </ng-container>
              </ng-container>

              <!-- Empty state -->
              <tr *ngIf="filteredGroups.length === 0">
                <td [attr.colspan]="(matrix?.roles?.length || 0) + 1">
                  <div class="flex flex-col items-center justify-center py-12 text-base-content/50">
                    <span class="material-symbols-outlined text-4xl mb-3">search_off</span>
                    <p class="text-sm">No permissions match your search</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Toggle Confirmation Dialog -->
    <dialog class="modal" [class.modal-open]="showConfirmDialog">
      <div class="modal-box w-full max-w-sm">
        <h3 class="text-lg font-bold">
          {{ pendingToggle?.isCurrentlyGranted ? 'Revoke Permission' : 'Grant Permission' }}
        </h3>
        <div class="py-4 space-y-3">
          <div class="text-sm text-base-content/70">
            <p>
              {{ pendingToggle?.isCurrentlyGranted ? 'Revoke' : 'Grant' }}
              "<span class="font-semibold">{{ pendingToggle?.permissionName }}</span>"
              {{ pendingToggle?.isCurrentlyGranted ? 'from' : 'to' }}
              role "<span class="font-semibold">{{ pendingToggle?.roleName }}</span>"?
            </p>
          </div>
          <div class="alert alert-warning text-xs">
            <span class="material-symbols-outlined text-sm">info</span>
            <span>All active sessions for users with this role will be revoked. They will need to sign in again.</span>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost btn-sm" (click)="cancelToggle()">Cancel</button>
          <button
            class="btn btn-sm"
            [ngClass]="pendingToggle?.isCurrentlyGranted ? 'btn-error' : 'btn-primary'"
            (click)="confirmToggle()"
            [disabled]="toggling">
            <span *ngIf="toggling" class="loading loading-spinner loading-xs"></span>
            {{ pendingToggle?.isCurrentlyGranted ? 'Revoke' : 'Grant' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button (click)="cancelToggle()">close</button>
      </form>
    </dialog>
  `
})
export class PermissionMatrixComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // Data state
  matrix: IPermissionMatrix | null = null;
  loading = false;
  searchTerm = '';

  // Display state
  permissionGroups: IPermissionGroup[] = [];
  filteredGroups: IPermissionGroup[] = [];

  // Assignment lookup (roleId:permissionId → boolean)
  private assignmentMap = new Map<string, boolean>();

  // Toggle state
  showConfirmDialog = false;
  toggling = false;
  pendingToggle: {
    roleId: string;
    roleName: string;
    permissionId: string;
    permissionName: string;
    isCurrentlyGranted: boolean;
  } | null = null;

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm = term;
      this.applyFilter();
    });

    this.loadMatrix();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  onSearchInput(term: string): void {
    this.searchSubject.next(term);
  }

  toggleGroup(group: IPermissionGroup): void {
    group.expanded = !group.expanded;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  navigateBack(): void {
    this.router.navigate(['/admin/roles']);
  }

  // ── Matrix Helpers ──────────────────────────────────────────────────────────

  isGranted(roleId: string, permissionId: string): boolean {
    return this.assignmentMap.get(`${roleId}:${permissionId}`) ?? false;
  }

  trackByRoleId(_index: number, role: IRoleItem): string {
    return role.id;
  }

  trackByPermId(_index: number, perm: IPermissionItem): string {
    return perm.id;
  }

  trackByDomain(_index: number, group: IPermissionGroup): string {
    return group.domainArea;
  }

  formatRoleName(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ');
  }

  // ── Toggle Permission ───────────────────────────────────────────────────────

  onToggleClick(role: IRoleItem, permission: IPermissionItem): void {
    const isCurrentlyGranted = this.isGranted(role.id, permission.id);
    this.pendingToggle = {
      roleId: role.id,
      roleName: role.name,
      permissionId: permission.id,
      permissionName: permission.displayName,
      isCurrentlyGranted
    };
    this.showConfirmDialog = true;
  }

  cancelToggle(): void {
    this.showConfirmDialog = false;
    this.pendingToggle = null;
  }

  confirmToggle(): void {
    if (!this.pendingToggle) return;
    this.toggling = true;

    const { roleId, permissionId, isCurrentlyGranted } = this.pendingToggle;
    const newState = !isCurrentlyGranted;

    this.http.put('/api/v1/permissions/toggle', {
      roleId,
      permissionId,
      isGranted: newState
    }).subscribe({
      next: () => {
        // Update local state
        this.assignmentMap.set(`${roleId}:${permissionId}`, newState);
        this.toggling = false;
        this.showConfirmDialog = false;
        this.pendingToggle = null;
        this.toast.showSuccess(
          newState ? 'Permission granted successfully' : 'Permission revoked successfully'
        );
      },
      error: () => {
        // Revert — keep existing state
        this.toggling = false;
        this.showConfirmDialog = false;
        this.pendingToggle = null;
        this.toast.showError('Failed to update permission. The change has been reverted.');
      }
    });
  }

  // ── Data Loading ────────────────────────────────────────────────────────────

  private loadMatrix(): void {
    this.loading = true;

    this.http.get<IPermissionMatrix>('/api/v1/permissions/matrix').subscribe({
      next: (matrix) => {
        this.matrix = matrix;
        this.buildAssignmentMap(matrix);
        // permissionGroups from API are already grouped by domain
        this.permissionGroups = matrix.permissionGroups.map(g => ({
          domainArea: g.domainArea,
          permissions: [...g.permissions],
          expanded: true
        }));
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Failed to load permission matrix. Please try again.');
      }
    });
  }

  private buildAssignmentMap(matrix: IPermissionMatrix): void {
    this.assignmentMap.clear();
    for (const cell of matrix.cells) {
      this.assignmentMap.set(`${cell.roleId}:${cell.permissionId}`, cell.isGranted);
    }
  }

  private applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredGroups = this.permissionGroups.map(g => ({ ...g }));
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredGroups = this.permissionGroups
        .map(group => ({
          ...group,
          permissions: group.permissions.filter(p =>
            p.displayName.toLowerCase().includes(term) ||
            p.name.toLowerCase().includes(term)
          )
        }))
        .filter(group => group.permissions.length > 0);
    }
  }
}
