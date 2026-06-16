import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * User list item from the API.
 */
interface IUserListItem {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly isActive: boolean;
  readonly lastLoginAt: string | null;
}

/**
 * Paginated API response envelope.
 */
interface IPagedResponse {
  readonly items: IUserListItem[];
  readonly totalCount: number;
  readonly pageNumber: number;
  readonly pageSize: number;
}

/**
 * User List Page Component
 *
 * Features:
 * - Paginated data table with Name, Email, Roles (colored badges), Status, Last Login, Actions
 * - Default page size 10, selectable 10/25/50
 * - Search input with 300ms debounce filtering by name/email
 * - Status filter dropdown (All, Active, Inactive)
 * - Pagination controls showing "1 to 9 of 25 users"
 * - "+ New User" button, "Import Users" button
 *
 * Requirements: 4.1, 4.6, 4.7, 4.8
 */
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
            Manage user accounts, roles, and access permissions
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn btn-outline btn-sm gap-2" (click)="openBulkImport()">
            <span class="material-symbols-outlined text-lg">upload_file</span>
            Import Users
          </button>
          <button class="btn btn-primary gap-2" (click)="navigateToCreate()">
            <span class="material-symbols-outlined text-lg">person_add</span>
            + New User
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
              placeholder="Search by name or email..."
              class="input input-bordered input-sm pl-9 w-full"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchInput($event)"
              aria-label="Search users by name or email" />
          </div>

          <!-- Status filter dropdown -->
          <select
            class="select select-bordered select-sm"
            [(ngModel)]="statusFilter"
            (ngModelChange)="onStatusFilterChange($event)"
            aria-label="Filter by status">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

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
          <table class="table table-sm" role="grid" aria-label="Users table">
            <thead>
              <tr class="bg-base-200/50">
                <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Name</th>
                <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Email</th>
                <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Roles</th>
                <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Status</th>
                <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Last Login</th>
                <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              <!-- Loading skeleton -->
              <ng-container *ngIf="loading">
                <tr *ngFor="let row of skeletonRows" class="animate-pulse">
                  <td><div class="h-4 bg-base-300 rounded w-32"></div></td>
                  <td><div class="h-4 bg-base-300 rounded w-40"></div></td>
                  <td><div class="h-4 bg-base-300 rounded w-24"></div></td>
                  <td><div class="h-4 bg-base-300 rounded w-16"></div></td>
                  <td><div class="h-4 bg-base-300 rounded w-24"></div></td>
                  <td><div class="h-4 bg-base-300 rounded w-16"></div></td>
                </tr>
              </ng-container>

              <!-- Empty state -->
              <tr *ngIf="!loading && users.length === 0">
                <td colspan="6">
                  <div class="flex flex-col items-center justify-center py-12 text-base-content/50">
                    <span class="material-symbols-outlined text-5xl mb-3">people</span>
                    <p class="text-base font-medium">No users found</p>
                    <p class="text-sm mt-1">Try adjusting your search or filters, or create a new user</p>
                  </div>
                </td>
              </tr>

              <!-- Data rows -->
              <ng-container *ngIf="!loading && users.length > 0">
                <tr
                  *ngFor="let user of users; trackBy: trackById"
                  class="hover:bg-base-200/30 transition-colors cursor-pointer"
                  (click)="navigateToDetail(user.id)">
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar placeholder">
                        <div class="bg-primary/10 text-primary rounded-full w-8 h-8">
                          <span class="text-xs font-semibold">{{ getInitials(user) }}</span>
                        </div>
                      </div>
                      <span class="font-medium text-sm">{{ user.firstName }} {{ user.lastName }}</span>
                    </div>
                  </td>
                  <td class="text-sm text-base-content/70">{{ user.email }}</td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      <span
                        *ngFor="let role of user.roles.slice(0, 2)"
                        class="badge badge-sm"
                        [ngClass]="getRoleBadgeClass(role)">
                        {{ formatRoleName(role) }}
                      </span>
                      <span
                        *ngIf="user.roles.length > 2"
                        class="badge badge-sm badge-ghost">
                        +{{ user.roles.length - 2 }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      class="badge badge-sm"
                      [ngClass]="user.isActive ? 'badge-success' : 'badge-error'">
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="text-sm text-base-content/60">
                    {{ user.lastLoginAt ? (user.lastLoginAt | date:'dd MMM yyyy, HH:mm') : 'Never' }}
                  </td>
                  <td (click)="$event.stopPropagation()">
                    <div class="flex items-center gap-1">
                      <button
                        class="btn btn-ghost btn-xs btn-square"
                        aria-label="View user details"
                        (click)="navigateToDetail(user.id)">
                        <span class="material-symbols-outlined text-sm">visibility</span>
                      </button>
                      <button
                        class="btn btn-ghost btn-xs btn-square"
                        aria-label="Edit user"
                        (click)="navigateToEdit(user.id)">
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
          *ngIf="!loading && totalCount > 0">
          <span class="text-sm text-base-content/60">
            {{ startRecord }} to {{ endRecord }} of {{ totalCount }} users
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

    <!-- Bulk Import Dialog (Task 13.6 placeholder trigger) -->
    <dialog class="modal" [class.modal-open]="showBulkImportDialog">
      <div class="modal-box">
        <h3 class="text-lg font-bold">Import Users</h3>
        <p class="py-4 text-sm text-base-content/70">
          Bulk import functionality is available via the Import Users dialog.
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost" (click)="showBulkImportDialog = false">Close</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button (click)="showBulkImportDialog = false">close</button>
      </form>
    </dialog>
  `
})
export class UserListComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // Table state
  users: IUserListItem[] = [];
  loading = false;
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;
  searchTerm = '';
  statusFilter = '';
  showBulkImportDialog = false;

  readonly skeletonRows = Array.from({ length: 5 });

  /** Role-to-badge-class mapping for visual differentiation. */
  private readonly roleBadgeClasses: Record<string, string> = {
    'SuperAdmin': 'badge-primary',
    'Admin': 'badge-secondary',
    'ProjectManager': 'badge-accent',
    'AcquisitionManager': 'badge-info',
    'FinanceDirector': 'badge-warning',
    'SalesManager': 'badge-success',
    'SiteManager': 'badge-error',
    'LegalOfficer': 'badge-info',
    'PlanningManager': 'badge-accent',
    'CompletionManager': 'badge-secondary',
    'PropertyManager': 'badge-primary',
    'ValuationAnalyst': 'badge-warning',
    'Surveyor': 'badge-ghost'
  };

  ngOnInit(): void {
    // Set up search debounce (300ms)
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.loadUsers();
    });

    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Computed properties ─────────────────────────────────────────────────────

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get startRecord(): number {
    if (this.totalCount === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalCount);
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

  onStatusFilterChange(value: string): void {
    this.statusFilter = value;
    this.currentPage = 1;
    this.loadUsers();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = +size;
    this.currentPage = 1;
    this.loadUsers();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadUsers();
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  navigateToCreate(): void {
    this.router.navigate(['/admin/users/create']);
  }

  navigateToDetail(userId: string): void {
    this.router.navigate(['/admin/users', userId]);
  }

  navigateToEdit(userId: string): void {
    this.router.navigate(['/admin/users', userId, 'edit']);
  }

  openBulkImport(): void {
    this.showBulkImportDialog = true;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  trackById(_index: number, user: IUserListItem): string {
    return user.id;
  }

  getInitials(user: IUserListItem): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  getRoleBadgeClass(role: string): string {
    return this.roleBadgeClasses[role] ?? 'badge-ghost';
  }

  formatRoleName(role: string): string {
    return role.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  // ── Data loading ────────────────────────────────────────────────────────────

  private loadUsers(): void {
    this.loading = true;

    let params = new HttpParams()
      .set('pageNumber', this.currentPage.toString())
      .set('pageSize', this.pageSize.toString());

    if (this.searchTerm) {
      params = params.set('search', this.searchTerm);
    }
    if (this.statusFilter) {
      params = params.set('status', this.statusFilter);
    }

    this.http.get<IPagedResponse>('/api/v1/admin/users', { params }).subscribe({
      next: (response) => {
        this.users = response.items;
        this.totalCount = response.totalCount;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Failed to load users. Please try again.');
      }
    });
  }
}
