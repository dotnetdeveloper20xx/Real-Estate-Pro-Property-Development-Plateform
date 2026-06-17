import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Role List Page Component
 *
 * Features:
 * - Paginated data table: Role Name, Description, Users count, Actions
 * - Search by name/description with 300ms debounce
 * - "+ New Role" button
 * - Click row → open details side panel
 *
 * Requirements: 8.1, 8.5
 */
@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">Role Management</h1>
          <p class="text-sm text-base-content/60 mt-1">
            Define and manage system roles, permissions, and access control
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn btn-outline btn-sm gap-2" (click)="navigateToPermissionMatrix()">
            <span class="material-symbols-outlined text-lg">grid_view</span>
            Permission Matrix
          </button>
          <button class="btn btn-primary gap-2" (click)="navigateToCreate()">
            <span class="material-symbols-outlined text-lg">add_circle</span>
            + New Role
          </button>
        </div>
      </div>

      <!-- Filters and Search Bar -->
      <div class="card bg-base-100 shadow-sm border border-base-200/80">
        <div class="px-4 py-3 flex flex-wrap items-center gap-3">
          <!-- Search input with debounce -->
          <div class="relative flex-1 min-w-[250px]">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm">search</span>
            <input
              type="text"
              placeholder="Search by role name or description..."
              class="input input-bordered input-sm pl-9 w-full"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchInput($event)"
              aria-label="Search roles by name or description" />
          </div>

          <!-- Page size selector -->
          <select
            class="select select-bordered select-sm"
            [(ngModel)]="pageSize"
            (ngModelChange)="onPageSizeChange($event)"
            aria-label="Page size">
            <option [ngValue]="10">10 per page</option>
            <option [ngValue]="25">25 per page</option>
            <option [ngValue]="50">50 per page</option>
          </select>
        </div>
      </div>

      <!-- Data Table -->
      <div class="card bg-base-100 shadow-sm border border-base-200/80 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table table-sm" role="grid" aria-label="Roles table">
            <thead>
              <tr class="bg-base-200/50">
                <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Role Name</th>
                <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Description</th>
                <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 w-24">Users</th>
                <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 w-20">Type</th>
                <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              <!-- Loading skeleton -->
              <ng-container *ngIf="loading">
                <tr *ngFor="let row of skeletonRows" class="animate-pulse">
                  <td><div class="h-4 bg-base-300 rounded w-32"></div></td>
                  <td><div class="h-4 bg-base-300 rounded w-48"></div></td>
                  <td><div class="h-4 bg-base-300 rounded w-12"></div></td>
                  <td><div class="h-4 bg-base-300 rounded w-16"></div></td>
                  <td><div class="h-4 bg-base-300 rounded w-16"></div></td>
                </tr>
              </ng-container>

              <!-- Empty state -->
              <tr *ngIf="!loading && filteredRoles.length === 0">
                <td colspan="5">
                  <div class="flex flex-col items-center justify-center py-12 text-base-content/50">
                    <span class="material-symbols-outlined text-5xl mb-3">admin_panel_settings</span>
                    <p class="text-base font-medium">No roles found</p>
                    <p class="text-sm mt-1">Try adjusting your search or create a new role</p>
                  </div>
                </td>
              </tr>

              <!-- Data rows -->
              <ng-container *ngIf="!loading && filteredRoles.length > 0">
                <tr
                  *ngFor="let role of paginatedRoles; trackBy: trackById"
                  class="hover:bg-base-200/30 transition-colors cursor-pointer"
                  (click)="openDetailPanel(role)">
                  <td>
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-primary text-lg">shield</span>
                      <span class="font-medium text-sm">{{ formatRoleName(role.name) }}</span>
                    </div>
                  </td>
                  <td class="text-sm text-base-content/70 max-w-xs truncate">{{ role.description }}</td>
                  <td>
                    <span class="badge badge-sm badge-ghost font-medium">{{ role.userCount }}</span>
                  </td>
                  <td>
                    <span
                      class="badge badge-sm"
                      [ngClass]="role.isBuiltIn ? 'badge-info' : 'badge-accent'">
                      {{ role.isBuiltIn ? 'Built-in' : 'Custom' }}
                    </span>
                  </td>
                  <td (click)="$event.stopPropagation()">
                    <div class="flex items-center gap-1">
                      <button
                        class="btn btn-ghost btn-xs btn-square"
                        aria-label="View role details"
                        (click)="openDetailPanel(role)">
                        <span class="material-symbols-outlined text-sm">visibility</span>
                      </button>
                      <button
                        *ngIf="!role.isBuiltIn"
                        class="btn btn-ghost btn-xs btn-square"
                        aria-label="Edit role"
                        (click)="navigateToEdit(role.id)">
                        <span class="material-symbols-outlined text-sm">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

        <!-- Pagination footer -->
        <div
          class="flex flex-wrap items-center justify-between px-4 py-3 border-t border-base-200/80 bg-base-100/50 gap-2"
          *ngIf="!loading && filteredRoles.length > 0">
          <span class="text-sm text-base-content/60">
            {{ startRecord }} to {{ endRecord }} of {{ filteredRoles.length }} roles
          </span>
          <div class="join">
            <button
              class="join-item btn btn-sm"
              [disabled]="currentPage === 1"
              (click)="goToPage(currentPage - 1)"
              aria-label="Previous page">
              <span class="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <ng-container *ngFor="let page of visiblePages">
              <button
                class="join-item btn btn-sm"
                [class.btn-active]="page === currentPage"
                (click)="goToPage(page)">
                {{ page }}
              </button>
            </ng-container>
            <button
              class="join-item btn btn-sm"
              [disabled]="currentPage === totalPages"
              (click)="goToPage(currentPage + 1)"
              aria-label="Next page">
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Role Detail Side Panel (Drawer) -->
    <div class="drawer drawer-end" [class.drawer-open]="showDetailPanel">
      <input type="checkbox" class="drawer-toggle" [checked]="showDetailPanel" />
      <div class="drawer-side z-50">
        <label class="drawer-overlay" (click)="closeDetailPanel()"></label>
        <div class="bg-base-100 min-h-full w-96 p-6 border-l border-base-200 space-y-6">
          <ng-container *ngIf="selectedRole">
            <!-- Panel Header -->
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold text-base-content">Role Details</h2>
              <button class="btn btn-ghost btn-sm btn-square" (click)="closeDetailPanel()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <!-- Role Info -->
            <div class="space-y-4">
              <div>
                <p class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Role Name</p>
                <p class="text-base font-semibold">{{ formatRoleName(selectedRole.name) }}</p>
              </div>
              <div>
                <p class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Description</p>
                <p class="text-sm text-base-content/80">{{ selectedRole.description || 'No description' }}</p>
              </div>
              <div class="flex items-center gap-4">
                <div>
                  <p class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Users</p>
                  <span class="badge badge-ghost">{{ selectedRole.userCount }} assigned</span>
                </div>
                <div>
                  <p class="text-xs text-base-content/50 uppercase tracking-wider mb-1">Type</p>
                  <span class="badge badge-sm" [ngClass]="selectedRole.isBuiltIn ? 'badge-info' : 'badge-accent'">
                    {{ selectedRole.isBuiltIn ? 'Built-in' : 'Custom' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Permissions Summary -->
            <div *ngIf="selectedRoleDetail">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs text-base-content/50 uppercase tracking-wider">
                  Permissions ({{ selectedRoleDetail.permissions.length }})
                </p>
                <button class="btn btn-ghost btn-xs gap-1" (click)="navigateToPermissionMatrix()">
                  View All
                  <span class="material-symbols-outlined text-xs">open_in_new</span>
                </button>
              </div>
              <div class="space-y-1 max-h-48 overflow-y-auto">
                <div
                  *ngFor="let perm of selectedRoleDetail.permissions"
                  class="flex items-center gap-2 py-1 px-2 rounded bg-base-200/50 text-sm">
                  <span class="material-symbols-outlined text-success text-sm">check_circle</span>
                  <span>{{ perm.displayName }}</span>
                </div>
                <p *ngIf="selectedRoleDetail.permissions.length === 0" class="text-sm text-base-content/50 italic">
                  No permissions assigned
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="pt-4 border-t border-base-200 space-y-2">
              <button
                *ngIf="!selectedRole.isBuiltIn"
                class="btn btn-outline btn-sm w-full gap-2"
                (click)="navigateToEdit(selectedRole.id)">
                <span class="material-symbols-outlined text-sm">edit</span>
                Edit Role
              </button>
              <button
                *ngIf="!selectedRole.isBuiltIn"
                class="btn btn-error btn-outline btn-sm w-full gap-2"
                (click)="openDeleteConfirm()">
                <span class="material-symbols-outlined text-sm">delete</span>
                Delete Role
              </button>
            </div>
          </ng-container>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <dialog class="modal" [class.modal-open]="showDeleteModal">
      <div class="modal-box w-full max-w-sm">
        <h3 class="text-lg font-bold text-error">Delete Role</h3>
        <p class="py-4 text-sm text-base-content/70">
          Are you sure you want to delete the role
          <span class="font-semibold">"{{ selectedRole?.name }}"</span>?
          This action cannot be undone.
        </p>
        <div *ngIf="selectedRole && selectedRole.userCount > 0" class="alert alert-warning text-sm mb-4">
          <span class="material-symbols-outlined text-lg">warning</span>
          <span>This role is assigned to {{ selectedRole.userCount }} user(s). They will lose this role's permissions.</span>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" (click)="showDeleteModal = false">Cancel</button>
          <button class="btn btn-error" (click)="confirmDelete()" [disabled]="deleting">
            <span *ngIf="deleting" class="loading loading-spinner loading-sm"></span>
            Delete Role
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button (click)="showDeleteModal = false">close</button>
      </form>
    </dialog>
  `
})
export class RoleListComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // Table state
  roles: IRoleListItem[] = [];
  filteredRoles: IRoleListItem[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  searchTerm = '';

  // Side panel state
  showDetailPanel = false;
  selectedRole: IRoleListItem | null = null;
  selectedRoleDetail: IRoleDetail | null = null;

  // Delete state
  showDeleteModal = false;
  deleting = false;

  readonly skeletonRows = Array.from({ length: 5 });

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.applyFilter();
    });

    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Computed properties ─────────────────────────────────────────────────────

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRoles.length / this.pageSize));
  }

  get startRecord(): number {
    if (this.filteredRoles.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredRoles.length);
  }

  get paginatedRoles(): IRoleListItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRoles.slice(start, start + this.pageSize);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  onSearchInput(term: string): void {
    this.searchSubject.next(term);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = +size;
    this.currentPage = 1;
    this.applyFilter();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  navigateToCreate(): void {
    this.router.navigate(['/admin/roles/create']);
  }

  navigateToEdit(roleId: string): void {
    this.router.navigate(['/admin/roles/create'], { queryParams: { edit: roleId } });
  }

  navigateToPermissionMatrix(): void {
    this.router.navigate(['/admin/permissions']);
  }

  // ── Side Panel ──────────────────────────────────────────────────────────────

  openDetailPanel(role: IRoleListItem): void {
    this.selectedRole = role;
    this.selectedRoleDetail = null;
    this.showDetailPanel = true;
    this.loadRoleDetail(role.id);
  }

  closeDetailPanel(): void {
    this.showDetailPanel = false;
    this.selectedRole = null;
    this.selectedRoleDetail = null;
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  openDeleteConfirm(): void {
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.selectedRole) return;
    this.deleting = true;

    this.http.delete(`/api/v1/roles/${this.selectedRole.id}`).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.closeDetailPanel();
        this.toast.showSuccess('Role deleted successfully');
        this.loadRoles();
      },
      error: () => {
        this.deleting = false;
        this.toast.showError('Failed to delete role. Built-in roles cannot be deleted.');
      }
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  trackById(_index: number, role: IRoleListItem): string {
    return role.id;
  }

  formatRoleName(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ');
  }

  // ── Data loading ────────────────────────────────────────────────────────────

  private loadRoles(): void {
    this.loading = true;

    this.http.get<IRoleListItem[]>('/api/v1/roles').subscribe({
      next: (roles) => {
        this.roles = roles;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Failed to load roles. Please try again.');
      }
    });
  }

  private loadRoleDetail(roleId: string): void {
    this.http.get<IRoleDetail>(`/api/v1/roles/${roleId}`).subscribe({
      next: (detail) => {
        this.selectedRoleDetail = detail;
      },
      error: () => {
        this.toast.showError('Failed to load role details.');
      }
    });
  }

  private applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredRoles = [...this.roles];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredRoles = this.roles.filter(r =>
        r.name.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term)
      );
    }
  }
}

/**
 * Role list item interface (local, mirrors the model).
 */
interface IRoleListItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly userCount: number;
  readonly isBuiltIn: boolean;
}

/**
 * Detailed role with permissions.
 */
interface IRoleDetail extends IRoleListItem {
  readonly permissions: readonly IPermissionItem[];
}

/**
 * Permission item.
 */
interface IPermissionItem {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly domainArea: string;
}
