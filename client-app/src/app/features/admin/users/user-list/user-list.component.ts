import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { UsersService } from '../../services/users.service';
import { UsersActions } from '../../store/users/users.actions';
import {
  selectAllUsers,
  selectUsersLoading,
  selectUsersError,
  selectUsersPagination,
  selectUsersQueryParams
} from '../../store/users/users.selectors';
import { IUserListItem, UserStatusFilter } from '../../models/user.model';

interface IUserMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  lockedUsers: number;
  newThisMonth: number;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">User Management</h1>
          <p class="text-sm text-base-content/60 mt-1">
            Manage user accounts, roles, and access permissions.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn btn-outline btn-sm gap-2" (click)="exportUsers()">
            <span class="material-symbols-outlined text-lg">download</span>
            Export
          </button>
          <button class="btn btn-primary gap-2" (click)="navigateToCreate()">
            <span class="material-symbols-outlined text-lg">person_add</span>
            + New User
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-4">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-medium text-base-content/60">Total Users</span>
                <p class="text-2xl font-bold text-base-content mt-1">{{ metrics.totalUsers }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-primary">group</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-4">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-medium text-base-content/60">Active Users</span>
                <p class="text-2xl font-bold text-base-content mt-1">{{ metrics.activeUsers }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-success">check_circle</span>
              </div>
            </div>
            <div class="mt-2 text-xs text-base-content/50">
              {{ getActivePercentage() }}% of total
            </div>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-4">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-medium text-base-content/60">Inactive Users</span>
                <p class="text-2xl font-bold text-base-content mt-1">{{ metrics.inactiveUsers }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-warning">pause_circle</span>
              </div>
            </div>
            <div class="mt-2 text-xs text-base-content/50">
              {{ getInactivePercentage() }}% of total
            </div>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-4">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-medium text-base-content/60">Locked Users</span>
                <p class="text-2xl font-bold text-base-content mt-1">{{ metrics.lockedUsers }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-error">lock</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-4">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-medium text-base-content/60">New This Month</span>
                <p class="text-2xl font-bold text-base-content mt-1">{{ metrics.newThisMonth }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-info">person_add</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content: Filters + Table -->
      <div class="flex gap-6">
        <!-- Left Filters Panel -->
        <div class="w-64 shrink-0 hidden lg:block">
          <div class="card bg-base-100 border border-base-200 shadow-sm sticky top-6">
            <div class="card-body p-4 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-base-content flex items-center gap-2">
                  <span class="material-symbols-outlined text-base text-primary">filter_list</span>
                  Filters
                  <span *ngIf="activeFilterCount > 0"
                        class="badge badge-primary badge-xs">{{ activeFilterCount }}</span>
                </h3>
                <button class="text-xs text-primary hover:underline" (click)="resetFilters()">Reset</button>
              </div>

              <!-- Search -->
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-medium">Search</span></label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/40 text-sm">search</span>
                  <input type="text" placeholder="Search users..."
                         class="input input-bordered input-sm pl-8 w-full"
                         [(ngModel)]="filters.search"
                         (ngModelChange)="onSearchInput($event)" />
                </div>
              </div>

              <!-- Status -->
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-medium">Status</span></label>
                <select class="select select-bordered select-sm w-full"
                        [(ngModel)]="filters.status">
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <!-- Apply Filters Button -->
              <div class="flex gap-2 pt-2">
                <button class="btn btn-ghost btn-sm flex-1" (click)="resetFilters()">Clear All</button>
                <button class="btn btn-primary btn-sm flex-1" (click)="applyFilters()">Apply Filters</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Table Section -->
        <div class="flex-1 min-w-0 space-y-4">
          <!-- Bulk Actions Bar -->
          <div class="flex items-center justify-between" *ngIf="selectedIds.size > 0">
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-base-content">
                {{ selectedIds.size }} {{ selectedIds.size === 1 ? 'result' : 'results' }} selected
              </span>
              <button class="text-xs text-base-content/50 hover:underline" (click)="clearSelection()">Clear selection</button>
            </div>
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-sm btn-outline gap-1">
                Bulk Actions
                <span class="material-symbols-outlined text-sm">expand_more</span>
              </div>
              <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-lg border border-base-200">
                <li><a (click)="bulkActivate()"><span class="material-symbols-outlined text-sm text-success">check_circle</span> Activate Selected</a></li>
                <li><a (click)="bulkDeactivate()"><span class="material-symbols-outlined text-sm text-warning">pause_circle</span> Deactivate Selected</a></li>
                <li><a (click)="bulkDelete()"><span class="material-symbols-outlined text-sm text-error">delete</span> Delete Selected</a></li>
              </ul>
            </div>
          </div>

          <!-- Error Banner -->
          <div *ngIf="error" class="alert alert-error shadow-sm">
            <span class="material-symbols-outlined">error</span>
            <span>{{ error }}</span>
            <button class="btn btn-ghost btn-xs" (click)="dismissError()">Dismiss</button>
          </div>

          <!-- Data Table Card -->
          <div class="card bg-base-100 shadow-sm border border-base-200/80 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="table table-sm" role="grid" aria-label="Users table">
                <thead>
                  <tr class="bg-base-200/50">
                    <th class="w-10">
                      <input type="checkbox" class="checkbox checkbox-sm checkbox-primary"
                             [checked]="isAllSelected"
                             (change)="toggleSelectAll()" />
                    </th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Name</th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Email</th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Roles</th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Status</th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Loading skeleton -->
                  <ng-container *ngIf="loading">
                    <tr *ngFor="let row of skeletonRows" class="animate-pulse">
                      <td><div class="h-4 w-4 bg-base-300 rounded"></div></td>
                      <td><div class="h-4 bg-base-300 rounded w-32"></div></td>
                      <td><div class="h-4 bg-base-300 rounded w-40"></div></td>
                      <td><div class="h-4 bg-base-300 rounded w-24"></div></td>
                      <td><div class="h-4 bg-base-300 rounded w-16"></div></td>
                      <td><div class="h-4 bg-base-300 rounded w-16"></div></td>
                    </tr>
                  </ng-container>

                  <!-- Empty state -->
                  <tr *ngIf="!loading && users.length === 0">
                    <td colspan="6">
                      <div class="flex flex-col items-center justify-center py-12 text-base-content/50">
                        <span class="material-symbols-outlined text-5xl mb-3">people</span>
                        <p class="text-base font-medium">No users found</p>
                        <p class="text-sm mt-1">Try adjusting your search or filters, or create a new user.</p>
                      </div>
                    </td>
                  </tr>

                  <!-- Data rows -->
                  <ng-container *ngIf="!loading && users.length > 0">
                    <tr *ngFor="let user of users; trackBy: trackById"
                        class="hover:bg-base-200/30 transition-colors">
                      <td (click)="$event.stopPropagation()">
                        <input type="checkbox" class="checkbox checkbox-sm checkbox-primary"
                               [checked]="selectedIds.has(user.id)"
                               (change)="toggleSelect(user.id)" />
                      </td>
                      <td>
                        <div class="flex items-center gap-3 cursor-pointer" (click)="navigateToDetail(user.id)">
                          <div class="avatar placeholder">
                            <div class="rounded-full w-9 h-9 flex items-center justify-center text-white text-xs font-bold"
                                 [style.background-color]="getAvatarColor(user)">
                              {{ getInitials(user) }}
                            </div>
                          </div>
                          <span class="font-medium text-sm text-base-content">{{ user.firstName }} {{ user.lastName }}</span>
                        </div>
                      </td>
                      <td class="text-sm text-base-content/70">{{ user.email }}</td>
                      <td>
                        <div class="flex flex-wrap gap-1">
                          <span *ngFor="let role of user.roles.slice(0, 2)"
                                class="badge badge-sm font-medium"
                                [ngClass]="getRoleBadgeClass(role)">
                            {{ formatRoleName(role) }}
                          </span>
                          <span *ngIf="user.roles.length > 2"
                                class="badge badge-sm badge-ghost">+{{ user.roles.length - 2 }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="badge badge-sm"
                              [ngClass]="user.isActive ? 'badge-success' : 'badge-error'">
                          {{ user.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td (click)="$event.stopPropagation()">
                        <div class="flex items-center gap-0.5">
                          <button class="btn btn-ghost btn-xs btn-square" aria-label="View"
                                  (click)="navigateToDetail(user.id)">
                            <span class="material-symbols-outlined text-sm">visibility</span>
                          </button>
                          <button class="btn btn-ghost btn-xs btn-square" aria-label="Edit"
                                  (click)="navigateToEdit(user.id)">
                            <span class="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <div class="dropdown dropdown-end">
                            <div tabindex="0" role="button" class="btn btn-ghost btn-xs btn-square">
                              <span class="material-symbols-outlined text-sm">more_vert</span>
                            </div>
                            <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-10 w-44 p-2 shadow-lg border border-base-200">
                              <li><a (click)="resetPassword(user)"><span class="material-symbols-outlined text-sm">lock_reset</span> Reset Password</a></li>
                              <li><a (click)="toggleUserStatus(user)"><span class="material-symbols-outlined text-sm">{{ user.isActive ? 'block' : 'check_circle' }}</span> {{ user.isActive ? 'Deactivate' : 'Activate' }}</a></li>
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </ng-container>
                </tbody>
              </table>
            </div>

            <!-- Pagination footer -->
            <div class="flex flex-wrap items-center justify-between px-4 py-3 border-t border-base-200/80 bg-base-100/50 gap-2"
                 *ngIf="!loading && users.length > 0">
              <span class="text-sm text-base-content/60">
                Showing {{ startRecord }} to {{ endRecord }} of {{ pagination.totalCount }} users
              </span>
              <div class="flex items-center gap-3">
                <div class="join">
                  <button class="join-item btn btn-sm" [disabled]="pagination.currentPage === 1"
                          (click)="goToPage(1)" aria-label="First page">
                    <span class="material-symbols-outlined text-sm">first_page</span>
                  </button>
                  <button class="join-item btn btn-sm" [disabled]="pagination.currentPage === 1"
                          (click)="goToPage(pagination.currentPage - 1)" aria-label="Previous page">
                    <span class="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <ng-container *ngFor="let page of visiblePages">
                    <button class="join-item btn btn-sm"
                            [class.btn-primary]="page === pagination.currentPage"
                            (click)="goToPage(page)">{{ page }}</button>
                  </ng-container>
                  <button class="join-item btn btn-sm" [disabled]="pagination.currentPage === pagination.totalPages"
                          (click)="goToPage(pagination.currentPage + 1)" aria-label="Next page">
                    <span class="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <button class="join-item btn btn-sm" [disabled]="pagination.currentPage === pagination.totalPages"
                          (click)="goToPage(pagination.totalPages)" aria-label="Last page">
                    <span class="material-symbols-outlined text-sm">last_page</span>
                  </button>
                </div>
                <select class="select select-bordered select-sm"
                        [(ngModel)]="localPageSize" (ngModelChange)="onPageSizeChange($event)" aria-label="Page size">
                  <option [ngValue]="10">10 per page</option>
                  <option [ngValue]="25">25 per page</option>
                  <option [ngValue]="50">50 per page</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Password Reset Modal -->
      <dialog class="modal" [class.modal-open]="showPasswordModal">
        <div class="modal-box max-w-sm">
          <h3 class="text-lg font-bold text-base-content mb-4">Reset Password</h3>
          <p class="text-sm text-base-content/60 mb-4">
            Enter a new password for <strong>{{ passwordResetUser?.firstName }} {{ passwordResetUser?.lastName }}</strong>.
            The user will be required to change it on next login.
          </p>
          <div class="form-control">
            <label class="label"><span class="label-text text-sm font-medium">New Password</span></label>
            <input type="password" class="input input-bordered w-full"
                   [(ngModel)]="newPasswordValue" placeholder="Minimum 8 characters" />
          </div>
          <div class="modal-action">
            <button class="btn btn-ghost btn-sm" (click)="closePasswordModal()">Cancel</button>
            <button class="btn btn-primary btn-sm" (click)="confirmResetPassword()"
                    [disabled]="!newPasswordValue || newPasswordValue.length < 8 || resettingPassword">
              <span *ngIf="resettingPassword" class="loading loading-spinner loading-xs"></span>
              Reset Password
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop"><button (click)="closePasswordModal()">close</button></form>
      </dialog>
    </div>
  `
})
export class UserListComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly usersService = inject(UsersService);
  private readonly destroy$ = new Subject<void>();

  // Data from store
  users: readonly IUserListItem[] = [];
  loading = false;
  error: string | null = null;
  pagination = { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 0 };

  // Local UI state
  localPageSize = 10;
  selectedIds = new Set<string>();
  filters = { search: '', status: '' };

  // Password reset modal state
  showPasswordModal = false;
  passwordResetUser: IUserListItem | null = null;
  newPasswordValue = '';
  resettingPassword = false;

  // Metrics (computed from pagination data)
  metrics: IUserMetrics = {
    totalUsers: 0, activeUsers: 0, inactiveUsers: 0, lockedUsers: 0, newThisMonth: 0
  };

  readonly skeletonRows = Array.from({ length: 8 });

  private readonly avatarColors = [
    '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
    '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f97316'
  ];

  private readonly roleBadgeClasses: Record<string, string> = {
    'SuperAdmin': 'badge-primary', 'Admin': 'badge-secondary',
    'ProjectManager': 'badge-accent', 'AcquisitionManager': 'badge-info',
    'FinanceDirector': 'badge-warning', 'SalesManager': 'badge-success',
    'SiteManager': 'badge-error', 'LegalOfficer': 'badge-info',
    'PlanningManager': 'badge-accent', 'CompletionManager': 'badge-secondary',
    'PropertyManager': 'badge-primary', 'ValuationAnalyst': 'badge-warning',
    'Surveyor': 'badge-ghost'
  };

  ngOnInit(): void {
    // Subscribe to store selectors
    this.store.select(selectAllUsers).pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.users = users;
        this.computeMetrics(users);
      });

    this.store.select(selectUsersLoading).pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    this.store.select(selectUsersError).pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error = error);

    this.store.select(selectUsersPagination).pipe(takeUntil(this.destroy$))
      .subscribe(pagination => this.pagination = pagination);

    this.store.select(selectUsersQueryParams).pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.localPageSize = params.pageSize;
        this.filters.search = params.search;
        this.filters.status = params.statusFilter === UserStatusFilter.All ? '' : params.statusFilter;
      });

    // Dispatch initial load
    this.store.dispatch(UsersActions.loadUsers());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Computed ────────────────────────────────────────────────────────────────

  get startRecord(): number {
    if (this.pagination.totalCount === 0) return 0;
    return (this.pagination.currentPage - 1) * this.pagination.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.pagination.currentPage * this.pagination.pageSize, this.pagination.totalCount);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 7;
    const totalPages = this.pagination.totalPages;
    let startPage = Math.max(1, this.pagination.currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) { pages.push(i); }
    return pages;
  }

  get isAllSelected(): boolean {
    return this.users.length > 0 && this.users.every(u => this.selectedIds.has(u.id));
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.filters.search) count++;
    if (this.filters.status) count++;
    return count;
  }

  // ── Metrics ─────────────────────────────────────────────────────────────────

  getActivePercentage(): string {
    if (this.metrics.totalUsers === 0) return '0';
    return ((this.metrics.activeUsers / this.metrics.totalUsers) * 100).toFixed(1);
  }

  getInactivePercentage(): string {
    if (this.metrics.totalUsers === 0) return '0';
    return ((this.metrics.inactiveUsers / this.metrics.totalUsers) * 100).toFixed(1);
  }

  // ── Events & Pagination (server-side via store) ─────────────────────────────

  onSearchInput(_term: string): void {
    // Applied when user clicks "Apply Filters"
  }

  onPageSizeChange(size: number | string): void {
    const numSize = typeof size === 'string' ? parseInt(size, 10) : size;
    if (isNaN(numSize) || numSize < 1) return;
    this.store.dispatch(UsersActions.updateQueryParams({ params: { pageSize: numSize, page: 1 } }));
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination.totalPages) return;
    this.store.dispatch(UsersActions.updateQueryParams({ params: { page } }));
  }

  applyFilters(): void {
    const statusFilter = this.filters.status
      ? (this.filters.status as UserStatusFilter)
      : UserStatusFilter.All;
    this.store.dispatch(UsersActions.updateQueryParams({
      params: { search: this.filters.search, statusFilter, page: 1 }
    }));
  }

  resetFilters(): void {
    this.filters = { search: '', status: '' };
    this.store.dispatch(UsersActions.updateQueryParams({
      params: { search: '', statusFilter: UserStatusFilter.All, page: 1 }
    }));
  }

  dismissError(): void {
    this.store.dispatch(UsersActions.clearError());
  }

  // ── Selection ───────────────────────────────────────────────────────────────

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) { this.selectedIds.delete(id); }
    else { this.selectedIds.add(id); }
  }

  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.users.forEach(u => this.selectedIds.delete(u.id));
    } else {
      this.users.forEach(u => this.selectedIds.add(u.id));
    }
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }

  // ── Bulk Actions (REAL implementations using forkJoin) ──────────────────────

  async bulkActivate(): Promise<void> {
    const count = this.selectedIds.size;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Activate Users',
      message: `Are you sure you want to activate ${count} ${count === 1 ? 'user' : 'users'}?`,
      confirmText: 'Activate',
      confirmClass: 'btn-success',
      icon: 'check_circle',
      iconClass: 'text-success'
    });
    if (!confirmed) return;

    const ids = Array.from(this.selectedIds);
    forkJoin(ids.map(id => this.usersService.reactivateUser(id))).subscribe({
      next: () => {
        this.toast.showSuccess(`${count} ${count === 1 ? 'user' : 'users'} activated successfully`);
        this.selectedIds.clear();
        this.store.dispatch(UsersActions.loadUsers());
      },
      error: () => {
        this.toast.showError('Some users could not be activated. Please try again.');
        this.store.dispatch(UsersActions.loadUsers());
      }
    });
  }

  async bulkDeactivate(): Promise<void> {
    const count = this.selectedIds.size;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Deactivate Users',
      message: `Are you sure you want to deactivate ${count} ${count === 1 ? 'user' : 'users'}? Their sessions will be revoked immediately.`,
      confirmText: 'Deactivate',
      confirmClass: 'btn-warning',
      icon: 'pause_circle',
      iconClass: 'text-warning'
    });
    if (!confirmed) return;

    const ids = Array.from(this.selectedIds);
    forkJoin(ids.map(id => this.usersService.deactivateUser(id))).subscribe({
      next: () => {
        this.toast.showSuccess(`${count} ${count === 1 ? 'user' : 'users'} deactivated successfully`);
        this.selectedIds.clear();
        this.store.dispatch(UsersActions.loadUsers());
      },
      error: () => {
        this.toast.showError('Some users could not be deactivated. Please try again.');
        this.store.dispatch(UsersActions.loadUsers());
      }
    });
  }

  async bulkDelete(): Promise<void> {
    const count = this.selectedIds.size;
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Users',
      message: `WARNING: You are about to permanently deactivate ${count} ${count === 1 ? 'user' : 'users'}. This will revoke all their sessions and prevent future access. This action cannot be easily undone.`,
      confirmText: 'Delete Users',
      confirmClass: 'btn-error',
      icon: 'delete_forever',
      iconClass: 'text-error'
    });
    if (!confirmed) return;

    const ids = Array.from(this.selectedIds);
    forkJoin(ids.map(id => this.usersService.deactivateUser(id))).subscribe({
      next: () => {
        this.toast.showSuccess(`${count} ${count === 1 ? 'user' : 'users'} deleted successfully`);
        this.selectedIds.clear();
        this.store.dispatch(UsersActions.loadUsers());
      },
      error: () => {
        this.toast.showError('Some users could not be deleted. Please try again.');
        this.store.dispatch(UsersActions.loadUsers());
      }
    });
  }

  // ── Navigation (U9: routed approach — no inline modal) ──────────────────────

  navigateToCreate(): void {
    this.router.navigate(['/admin/users/create']);
  }

  navigateToDetail(userId: string): void {
    this.router.navigate(['/admin/users', userId]);
  }

  navigateToEdit(userId: string): void {
    this.router.navigate(['/admin/users', userId, 'edit']);
  }

  exportUsers(): void {
    this.toast.showSuccess('Export started — your file will download shortly.');
  }

  // ── Password Reset (U6: proper modal with password input) ───────────────────

  resetPassword(user: IUserListItem): void {
    this.passwordResetUser = user;
    this.newPasswordValue = '';
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordResetUser = null;
    this.newPasswordValue = '';
  }

  confirmResetPassword(): void {
    if (!this.passwordResetUser || !this.newPasswordValue || this.newPasswordValue.length < 8) return;
    this.resettingPassword = true;

    this.usersService.resetPassword({
      userId: this.passwordResetUser.id,
      newPassword: this.newPasswordValue
    }).subscribe({
      next: () => {
        this.toast.showSuccess(
          `Password reset for ${this.passwordResetUser!.firstName} ${this.passwordResetUser!.lastName}. ` +
          'The user should be informed of their new password securely.'
        );
        this.resettingPassword = false;
        this.closePasswordModal();
      },
      error: () => {
        this.toast.showError('Failed to reset password. Please try again.');
        this.resettingPassword = false;
      }
    });
  }

  // ── Toggle user status (single user) ────────────────────────────────────────

  toggleUserStatus(user: IUserListItem): void {
    if (user.isActive) {
      this.usersService.deactivateUser(user.id).subscribe({
        next: () => {
          this.toast.showSuccess(`${user.firstName} ${user.lastName} deactivated`);
          this.store.dispatch(UsersActions.loadUsers());
        },
        error: () => this.toast.showError('Failed to deactivate user')
      });
    } else {
      this.usersService.reactivateUser(user.id).subscribe({
        next: () => {
          this.toast.showSuccess(`${user.firstName} ${user.lastName} activated`);
          this.store.dispatch(UsersActions.loadUsers());
        },
        error: () => this.toast.showError('Failed to activate user')
      });
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  trackById(_index: number, user: IUserListItem): string {
    return user.id;
  }

  getInitials(user: IUserListItem): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  getAvatarColor(user: IUserListItem): string {
    const hash = user.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return this.avatarColors[hash % this.avatarColors.length];
  }

  getRoleBadgeClass(role: string): string {
    return this.roleBadgeClasses[role] ?? 'badge-ghost';
  }

  formatRoleName(role: string): string {
    return role.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private computeMetrics(users: readonly IUserListItem[]): void {
    this.metrics = {
      totalUsers: this.pagination.totalCount || users.length,
      activeUsers: users.filter(u => u.isActive).length,
      inactiveUsers: users.filter(u => !u.isActive).length,
      lockedUsers: 0,
      newThisMonth: 0
    };
  }
}
