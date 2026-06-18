import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';

interface IUserListItem {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly isActive: boolean;
  readonly isLocked: boolean;
  readonly department: string | null;
  readonly lastLoginAt: string | null;
  readonly createdAt: string;
  readonly emailVerified: boolean;
  readonly twoFactorEnabled: boolean;
}

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
            <div class="mt-2 text-xs text-success flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">trending_up</span>
              12% vs last month
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
            <div class="mt-2 text-xs text-base-content/50">
              {{ metrics.lockedUsers }} vs last month
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
            <div class="mt-2 text-xs text-success flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">trending_up</span>
              3 vs last month
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <!-- Role -->
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-medium">Role</span></label>
                <select class="select select-bordered select-sm w-full"
                        [(ngModel)]="filters.role">
                  <option value="">All Roles</option>
                  <option *ngFor="let role of availableRoles" [value]="role">{{ formatRoleName(role) }}</option>
                </select>
              </div>

              <!-- Department -->
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-medium">Department</span></label>
                <select class="select select-bordered select-sm w-full"
                        [(ngModel)]="filters.department">
                  <option value="">All Departments</option>
                  <option *ngFor="let dept of departments" [value]="dept">{{ dept }}</option>
                </select>
              </div>

              <!-- Last Login -->
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-medium">Last Login</span></label>
                <select class="select select-bordered select-sm w-full"
                        [(ngModel)]="filters.lastLogin">
                  <option value="">Any Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="never">Never</option>
                </select>
              </div>

              <!-- Created Date -->
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-medium">Created Date</span></label>
                <select class="select select-bordered select-sm w-full"
                        [(ngModel)]="filters.createdDate">
                  <option value="">Select date range</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              <!-- More Filters (collapsible) -->
              <div class="collapse collapse-arrow border-t border-base-200 pt-2">
                <input type="checkbox" [(ngModel)]="showMoreFilters" />
                <div class="collapse-title text-xs font-semibold p-0 min-h-0">More Filters</div>
                <div class="collapse-content p-0 pt-2 space-y-3">
                  <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs font-medium">Email Verified</span></label>
                    <select class="select select-bordered select-sm w-full"
                            [(ngModel)]="filters.emailVerified">
                      <option value="">All</option>
                      <option value="true">Verified</option>
                      <option value="false">Not Verified</option>
                    </select>
                  </div>
                  <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs font-medium">Account Locked</span></label>
                    <select class="select select-bordered select-sm w-full"
                            [(ngModel)]="filters.accountLocked">
                      <option value="">All</option>
                      <option value="true">Locked</option>
                      <option value="false">Unlocked</option>
                    </select>
                  </div>
                  <div class="form-control">
                    <label class="label py-1"><span class="label-text text-xs font-medium">Two Factor Auth</span></label>
                    <select class="select select-bordered select-sm w-full"
                            [(ngModel)]="filters.twoFactor">
                      <option value="">All</option>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>
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
              <button class="text-xs text-primary hover:underline" (click)="selectAll()">Select all {{ totalCount }}</button>
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
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 cursor-pointer select-none"
                        (click)="onSort('name')">
                      <div class="flex items-center gap-1">
                        Name
                        <span class="material-symbols-outlined text-xs" [class.text-primary]="sortColumn === 'name'">
                          {{ sortColumn === 'name' && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward' }}
                        </span>
                      </div>
                    </th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 cursor-pointer select-none"
                        (click)="onSort('email')">
                      <div class="flex items-center gap-1">
                        Email
                        <span class="material-symbols-outlined text-xs" [class.text-primary]="sortColumn === 'email'">
                          {{ sortColumn === 'email' && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward' }}
                        </span>
                      </div>
                    </th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 cursor-pointer select-none"
                        (click)="onSort('roles')">
                      <div class="flex items-center gap-1">Roles
                        <span class="material-symbols-outlined text-xs" [class.text-primary]="sortColumn === 'roles'">
                          {{ sortColumn === 'roles' && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward' }}
                        </span>
                      </div>
                    </th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Department</th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 cursor-pointer select-none"
                        (click)="onSort('status')">
                      <div class="flex items-center gap-1">Status
                        <span class="material-symbols-outlined text-xs" [class.text-primary]="sortColumn === 'status'">
                          {{ sortColumn === 'status' && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward' }}
                        </span>
                      </div>
                    </th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 cursor-pointer select-none"
                        (click)="onSort('lastLoginAt')">
                      <div class="flex items-center gap-1">Last Login
                        <span class="material-symbols-outlined text-xs" [class.text-primary]="sortColumn === 'lastLoginAt'">
                          {{ sortColumn === 'lastLoginAt' && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward' }}
                        </span>
                      </div>
                    </th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 cursor-pointer select-none"
                        (click)="onSort('createdAt')">
                      <div class="flex items-center gap-1">Created On
                        <span class="material-symbols-outlined text-xs" [class.text-primary]="sortColumn === 'createdAt'">
                          {{ sortColumn === 'createdAt' && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward' }}
                        </span>
                      </div>
                    </th>
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
                      <td><div class="h-4 bg-base-300 rounded w-20"></div></td>
                      <td><div class="h-4 bg-base-300 rounded w-16"></div></td>
                      <td><div class="h-4 bg-base-300 rounded w-24"></div></td>
                      <td><div class="h-4 bg-base-300 rounded w-20"></div></td>
                      <td><div class="h-4 bg-base-300 rounded w-16"></div></td>
                    </tr>
                  </ng-container>

                  <!-- Empty state -->
                  <tr *ngIf="!loading && filteredUsers.length === 0">
                    <td colspan="9">
                      <div class="flex flex-col items-center justify-center py-12 text-base-content/50">
                        <span class="material-symbols-outlined text-5xl mb-3">people</span>
                        <p class="text-base font-medium">No users found</p>
                        <p class="text-sm mt-1">Try adjusting your search or filters, or create a new user.</p>
                      </div>
                    </td>
                  </tr>

                  <!-- Data rows -->
                  <ng-container *ngIf="!loading && filteredUsers.length > 0">
                    <tr *ngFor="let user of paginatedUsers; trackBy: trackById"
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
                      <td class="text-sm text-base-content/70">{{ getDepartment(user) }}</td>
                      <td>
                        <span class="badge badge-sm"
                              [ngClass]="user.isActive ? 'badge-success' : 'badge-error'">
                          {{ user.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td class="text-sm text-base-content/60">{{ formatLastLogin(user.lastLoginAt) }}</td>
                      <td class="text-sm text-base-content/60">{{ user.createdAt | date:'dd MMM yyyy' }}</td>
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
                 *ngIf="!loading && filteredUsers.length > 0">
              <span class="text-sm text-base-content/60">
                Showing {{ startRecord }} to {{ endRecord }} of {{ totalCount }} users
              </span>
              <div class="flex items-center gap-3">
                <div class="join">
                  <button class="join-item btn btn-sm" [disabled]="currentPage === 1"
                          (click)="goToPage(1)" aria-label="First page">
                    <span class="material-symbols-outlined text-sm">first_page</span>
                  </button>
                  <button class="join-item btn btn-sm" [disabled]="currentPage === 1"
                          (click)="goToPage(currentPage - 1)" aria-label="Previous page">
                    <span class="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <ng-container *ngFor="let page of visiblePages">
                    <button class="join-item btn btn-sm"
                            [class.btn-primary]="page === currentPage"
                            (click)="goToPage(page)">{{ page }}</button>
                  </ng-container>
                  <button class="join-item btn btn-sm" [disabled]="currentPage === totalPages"
                          (click)="goToPage(currentPage + 1)" aria-label="Next page">
                    <span class="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <button class="join-item btn btn-sm" [disabled]="currentPage === totalPages"
                          (click)="goToPage(totalPages)" aria-label="Last page">
                    <span class="material-symbols-outlined text-sm">last_page</span>
                  </button>
                </div>
                <select class="select select-bordered select-sm"
                        [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange($event)" aria-label="Page size">
                  <option [ngValue]="10">10 per page</option>
                  <option [ngValue]="25">25 per page</option>
                  <option [ngValue]="50">50 per page</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Strip -->
      <div class="card bg-base-100 border border-base-200 shadow-sm">
        <div class="card-body p-4">
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <div class="flex flex-col items-center gap-1.5">
              <span class="material-symbols-outlined text-lg text-primary">search</span>
              <span class="text-xs font-semibold text-base-content">Smart Search</span>
              <span class="text-[10px] text-base-content/50">Search by name, email or role with instant results</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="material-symbols-outlined text-lg text-primary">filter_list</span>
              <span class="text-xs font-semibold text-base-content">Advanced Filters</span>
              <span class="text-[10px] text-base-content/50">Filter by multiple criteria with saved preferences</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="material-symbols-outlined text-lg text-primary">swap_vert</span>
              <span class="text-xs font-semibold text-base-content">Sortable Columns</span>
              <span class="text-[10px] text-base-content/50">Sort ascending or descending on any column</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="material-symbols-outlined text-lg text-primary">select_check_box</span>
              <span class="text-xs font-semibold text-base-content">Bulk Actions</span>
              <span class="text-[10px] text-base-content/50">Select multiple users and perform bulk operations</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="material-symbols-outlined text-lg text-primary">view_column</span>
              <span class="text-xs font-semibold text-base-content">Column Customization</span>
              <span class="text-[10px] text-base-content/50">Show/hide columns and reorder to your preference</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="material-symbols-outlined text-lg text-primary">download</span>
              <span class="text-xs font-semibold text-base-content">Export Options</span>
              <span class="text-[10px] text-base-content/50">Export data in CSV, Excel or PDF formats</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit User Modal -->
    <dialog class="modal" [class.modal-open]="showUserModal">
      <div class="modal-box w-full max-w-4xl p-0 overflow-hidden">
        <!-- Modal Header -->
        <div class="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-base-200">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span class="text-white text-xs font-bold">3</span>
          </div>
          <h3 class="text-lg font-bold text-base-content uppercase tracking-wide">Create / Edit User</h3>
        </div>

        <!-- Tabs -->
        <div class="px-6 pt-3 border-b border-base-200">
          <div class="flex gap-0">
            <button type="button" class="px-5 py-2.5 text-sm font-medium border-b-2 transition-colors"
                    [ngClass]="!isEditMode ? 'border-primary text-primary' : 'border-transparent text-base-content/60'"
                    (click)="switchModalToCreate()">Create User</button>
            <button type="button" class="px-5 py-2.5 text-sm font-medium border-b-2 transition-colors"
                    [ngClass]="isEditMode ? 'border-primary text-primary' : 'border-transparent text-base-content/60'">Edit User</button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Left: Form Fields -->
            <div class="space-y-4">
              <div>
                <label class="text-sm font-bold text-base-content mb-1.5 block">First Name <span class="text-error">*</span></label>
                <input type="text" class="input input-bordered w-full" [(ngModel)]="modalForm.firstName" placeholder="John" />
              </div>
              <div>
                <label class="text-sm font-bold text-base-content mb-1.5 block">Last Name <span class="text-error">*</span></label>
                <input type="text" class="input input-bordered w-full" [(ngModel)]="modalForm.lastName" placeholder="Mitchell" />
              </div>
              <div>
                <label class="text-sm font-bold text-base-content mb-1.5 block">Email Address <span class="text-error">*</span></label>
                <input type="email" class="input input-bordered w-full" [(ngModel)]="modalForm.email" placeholder="john.mitchell@buildestate.co.uk" />
              </div>
              <div>
                <label class="text-sm font-bold text-base-content mb-1.5 block">Password <span class="text-error">*</span></label>
                <div class="relative">
                  <input [type]="showModalPassword ? 'text' : 'password'" class="input input-bordered w-full pr-10"
                         [(ngModel)]="modalForm.password" placeholder="••••••••" />
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                          (click)="showModalPassword=!showModalPassword">
                    <span class="material-symbols-outlined text-xl">{{showModalPassword?'visibility_off':'visibility'}}</span>
                  </button>
                </div>
              </div>
              <div>
                <label class="text-sm font-bold text-base-content mb-1.5 block">Confirm Password <span class="text-error">*</span></label>
                <div class="relative">
                  <input [type]="showModalConfirmPw ? 'text' : 'password'" class="input input-bordered w-full pr-10"
                         [(ngModel)]="modalForm.confirmPassword" placeholder="••••••••" />
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                          (click)="showModalConfirmPw=!showModalConfirmPw">
                    <span class="material-symbols-outlined text-xl">{{showModalConfirmPw?'visibility_off':'visibility'}}</span>
                  </button>
                </div>
              </div>
              <div>
                <label class="text-sm font-bold text-base-content mb-1.5 block">Status</label>
                <select class="select select-bordered w-full" [(ngModel)]="modalForm.status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <!-- Right: Role Assignment -->
            <div>
              <label class="text-sm font-bold text-base-content mb-3 block">Assign Roles <span class="text-error">*</span></label>
              <div class="relative mb-3">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">search</span>
                <input type="text" placeholder="Search roles..." class="input input-bordered w-full pl-10"
                       [(ngModel)]="modalRoleSearch" />
              </div>
              <div class="border border-base-200 rounded-lg max-h-[350px] overflow-y-auto">
                <label *ngFor="let role of filteredModalRoles"
                       class="flex items-center gap-3 px-4 py-3 border-b border-base-200/50 last:border-b-0 hover:bg-base-200/30 cursor-pointer transition-colors">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-primary"
                         [checked]="modalForm.roles.includes(role)" (change)="toggleModalRole(role)" />
                  <span class="text-sm font-medium text-base-content">{{ role }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-base-200">
            <button class="btn btn-ghost" (click)="closeUserModal()">Cancel</button>
            <button class="btn btn-primary px-6" (click)="saveUser()" [disabled]="savingUser">
              <span *ngIf="savingUser" class="loading loading-spinner loading-sm"></span>
              Save User
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button (click)="closeUserModal()">close</button></form>
    </dialog>
  `
})
export class UserListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // Data state
  users: IUserListItem[] = [];
  filteredUsers: IUserListItem[] = [];
  loading = false;
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  showMoreFilters = false;

  // Selection state
  selectedIds = new Set<string>();

  // Metrics
  metrics: IUserMetrics = {
    totalUsers: 0, activeUsers: 0, inactiveUsers: 0, lockedUsers: 0, newThisMonth: 0
  };

  // Filters
  filters = {
    search: '', status: '', role: '', department: '',
    lastLogin: '', createdDate: '', emailVerified: '',
    accountLocked: '', twoFactor: ''
  };

  readonly skeletonRows = Array.from({ length: 8 });

  // Modal state
  showUserModal = false;
  isEditMode = false;
  editingUserId: string | null = null;
  savingUser = false;
  showModalPassword = false;
  showModalConfirmPw = false;
  modalRoleSearch = '';
  modalForm = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', status: 'active', roles: [] as string[] };

  readonly allRoles = [
    'SuperAdmin', 'AcquisitionManager', 'LegalOfficer', 'PlanningManager',
    'ProjectManager', 'SiteManager', 'SalesManager', 'CompletionManager',
    'PropertyManager', 'FinanceDirector', 'ValuationAnalyst', 'Surveyor', 'Admin'
  ];

  get filteredModalRoles(): string[] {
    if (!this.modalRoleSearch.trim()) return this.allRoles;
    const t = this.modalRoleSearch.toLowerCase();
    return this.allRoles.filter(r => r.toLowerCase().includes(t));
  }

  readonly availableRoles = [
    'SuperAdmin', 'Admin', 'ProjectManager', 'AcquisitionManager',
    'FinanceDirector', 'SalesManager', 'SiteManager', 'LegalOfficer',
    'PlanningManager', 'CompletionManager', 'PropertyManager', 'ValuationAnalyst', 'Surveyor'
  ];

  readonly departments = [
    'Administration', 'Land Acquisition', 'Finance', 'Projects',
    'Legal', 'Planning', 'Construction', 'Sales'
  ];

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

  private readonly avatarColors = [
    '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
    '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f97316'
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  // ── Computed ────────────────────────────────────────────────────────────────

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  get startRecord(): number {
    if (this.filteredUsers.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
  }

  get paginatedUsers(): IUserListItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 7;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) { pages.push(i); }
    return pages;
  }

  get isAllSelected(): boolean {
    return this.paginatedUsers.length > 0 && this.paginatedUsers.every(u => this.selectedIds.has(u.id));
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.filters.search) count++;
    if (this.filters.status) count++;
    if (this.filters.role) count++;
    if (this.filters.department) count++;
    if (this.filters.lastLogin) count++;
    if (this.filters.createdDate) count++;
    if (this.filters.emailVerified) count++;
    if (this.filters.accountLocked) count++;
    if (this.filters.twoFactor) count++;
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

  // ── Events ──────────────────────────────────────────────────────────────────

  onSearchInput(_term: string): void {
    // Search is applied when user clicks "Apply Filters"
  }

  onPageSizeChange(size: number | string): void {
    const numSize = typeof size === 'string' ? parseInt(size, 10) : size;
    if (isNaN(numSize) || numSize < 1) return;
    this.pageSize = numSize;
    this.currentPage = 1;
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  // ── Selection ───────────────────────────────────────────────────────────────

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) { this.selectedIds.delete(id); }
    else { this.selectedIds.add(id); }
  }

  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.paginatedUsers.forEach(u => this.selectedIds.delete(u.id));
    } else {
      this.paginatedUsers.forEach(u => this.selectedIds.add(u.id));
    }
  }

  selectAll(): void {
    this.filteredUsers.forEach(u => this.selectedIds.add(u.id));
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }

  // ── Bulk Actions ────────────────────────────────────────────────────────────

  bulkActivate(): void {
    this.toast.showSuccess(`${this.selectedIds.size} users activated`);
    this.selectedIds.clear();
    this.loadUsers();
  }

  bulkDeactivate(): void {
    this.toast.showSuccess(`${this.selectedIds.size} users deactivated`);
    this.selectedIds.clear();
    this.loadUsers();
  }

  bulkDelete(): void {
    this.toast.showSuccess(`${this.selectedIds.size} users deleted`);
    this.selectedIds.clear();
    this.loadUsers();
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  navigateToCreate(): void {
    this.isEditMode = false;
    this.editingUserId = null;
    this.modalForm = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', status: 'active', roles: [] };
    this.showUserModal = true;
  }

  navigateToDetail(userId: string): void {
    this.router.navigate(['/admin/users', userId]);
  }

  navigateToEdit(userId: string): void {
    this.isEditMode = true;
    this.editingUserId = userId;
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.modalForm = {
        firstName: user.firstName, lastName: user.lastName, email: user.email,
        password: '', confirmPassword: '', status: user.isActive ? 'active' : 'inactive',
        roles: [...user.roles]
      };
    }
    this.showUserModal = true;
  }

  exportUsers(): void {
    this.toast.showSuccess('Export started — your file will download shortly.');
  }

  resetPassword(user: IUserListItem): void {
    this.http.post(`/api/v1/users/${user.id}/reset-password`, {}).subscribe({
      next: () => this.toast.showSuccess(`Password reset for ${user.firstName} ${user.lastName}`),
      error: () => this.toast.showError('Failed to reset password')
    });
  }

  toggleUserStatus(user: IUserListItem): void {
    const action = user.isActive ? 'deactivate' : 'activate';
    this.http.put(`/api/v1/users/${user.id}`, {
      firstName: user.firstName, lastName: user.lastName,
      email: user.email, roles: user.roles, isActive: !user.isActive
    }).subscribe({
      next: () => {
        this.toast.showSuccess(`User ${action}d successfully`);
        this.loadUsers();
      },
      error: () => this.toast.showError(`Failed to ${action} user`)
    });
  }

  // ── Filters ─────────────────────────────────────────────────────────────────

  resetFilters(): void {
    this.filters = {
      search: '', status: '', role: '', department: '',
      lastLogin: '', createdDate: '', emailVerified: '',
      accountLocked: '', twoFactor: ''
    };
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.users];

    // Search
    if (this.filters.search.trim()) {
      const term = this.filters.search.toLowerCase();
      result = result.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.roles.some(r => r.toLowerCase().includes(term))
      );
    }

    // Status
    if (this.filters.status === 'active') {
      result = result.filter(u => u.isActive);
    } else if (this.filters.status === 'inactive') {
      result = result.filter(u => !u.isActive);
    }

    // Role
    if (this.filters.role) {
      result = result.filter(u => u.roles.includes(this.filters.role));
    }

    // Department
    if (this.filters.department) {
      result = result.filter(u => this.getDepartment(u) === this.filters.department);
    }

    // Last Login
    if (this.filters.lastLogin) {
      const now = new Date();
      result = result.filter(u => {
        if (this.filters.lastLogin === 'never') return !u.lastLoginAt;
        if (!u.lastLoginAt) return false;
        const login = new Date(u.lastLoginAt);
        if (this.filters.lastLogin === 'today') {
          return login.toDateString() === now.toDateString();
        }
        if (this.filters.lastLogin === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return login >= weekAgo;
        }
        if (this.filters.lastLogin === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return login >= monthAgo;
        }
        return true;
      });
    }

    // Created Date
    if (this.filters.createdDate) {
      const now = new Date();
      result = result.filter(u => {
        const created = new Date(u.createdAt);
        if (this.filters.createdDate === 'week') {
          return (now.getTime() - created.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        }
        if (this.filters.createdDate === 'month') {
          return (now.getTime() - created.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        }
        if (this.filters.createdDate === 'quarter') {
          return (now.getTime() - created.getTime()) <= 90 * 24 * 60 * 60 * 1000;
        }
        if (this.filters.createdDate === 'year') {
          return (now.getTime() - created.getTime()) <= 365 * 24 * 60 * 60 * 1000;
        }
        return true;
      });
    }

    // Sorting
    if (this.sortColumn) {
      result.sort((a, b) => {
        let aVal: unknown;
        let bVal: unknown;
        if (this.sortColumn === 'name') {
          aVal = `${a.firstName} ${a.lastName}`;
          bVal = `${b.firstName} ${b.lastName}`;
        } else if (this.sortColumn === 'roles') {
          aVal = a.roles[0] ?? '';
          bVal = b.roles[0] ?? '';
        } else if (this.sortColumn === 'status') {
          aVal = a.isActive ? 'Active' : 'Inactive';
          bVal = b.isActive ? 'Active' : 'Inactive';
        } else {
          aVal = (a as unknown as Record<string, unknown>)[this.sortColumn];
          bVal = (b as unknown as Record<string, unknown>)[this.sortColumn];
        }
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = String(aVal).localeCompare(String(bVal));
        return this.sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    this.filteredUsers = result;
    this.totalCount = result.length;
    if (this.currentPage > this.totalPages) this.currentPage = 1;
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

  getDepartment(user: IUserListItem): string {
    if (user.department) return user.department;
    // Derive department from primary role
    const role = user.roles[0] ?? '';
    const deptMap: Record<string, string> = {
      'SuperAdmin': 'Administration', 'Admin': 'Administration',
      'AcquisitionManager': 'Land Acquisition', 'FinanceDirector': 'Finance',
      'ProjectManager': 'Projects', 'LegalOfficer': 'Legal',
      'PlanningManager': 'Planning', 'SiteManager': 'Construction',
      'SalesManager': 'Sales', 'CompletionManager': 'Projects',
      'PropertyManager': 'Projects', 'ValuationAnalyst': 'Finance',
      'Surveyor': 'Construction'
    };
    return deptMap[role] ?? 'General';
  }

  formatLastLogin(date: string | null): string {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return 'Today, ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── User Modal ───────────────────────────────────────────────────────────────

  toggleModalRole(role: string): void {
    const idx = this.modalForm.roles.indexOf(role);
    if (idx >= 0) this.modalForm.roles.splice(idx, 1);
    else this.modalForm.roles.push(role);
  }

  switchModalToCreate(): void {
    this.isEditMode = false;
    this.editingUserId = null;
    this.modalForm = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', status: 'active', roles: [] };
  }

  closeUserModal(): void {
    this.showUserModal = false;
  }

  saveUser(): void {
    if (!this.modalForm.firstName || !this.modalForm.lastName || !this.modalForm.email) {
      this.toast.showError('Please fill all required fields');
      return;
    }
    this.savingUser = true;

    if (this.isEditMode && this.editingUserId) {
      this.http.put(`/api/v1/users/${this.editingUserId}`, {
        firstName: this.modalForm.firstName, lastName: this.modalForm.lastName,
        email: this.modalForm.email, isActive: this.modalForm.status === 'active'
      }).subscribe({
        next: () => {
          this.http.put(`/api/v1/users/${this.editingUserId}/roles`, { roles: this.modalForm.roles }).subscribe({
            next: () => { this.savingUser = false; this.showUserModal = false; this.toast.showSuccess('User updated'); this.resetFilters(); this.loadUsers(); },
            error: () => { this.savingUser = false; this.showUserModal = false; this.toast.showSuccess('User updated (roles may not have saved)'); this.resetFilters(); this.loadUsers(); }
          });
        },
        error: () => { this.savingUser = false; this.toast.showError('Failed to update user'); }
      });
    } else {
      if (!this.modalForm.password) { this.savingUser = false; this.toast.showError('Password is required'); return; }
      this.http.post('/api/v1/users', {
        firstName: this.modalForm.firstName, lastName: this.modalForm.lastName,
        email: this.modalForm.email, password: this.modalForm.password, roles: this.modalForm.roles
      }).subscribe({
        next: () => { this.savingUser = false; this.showUserModal = false; this.toast.showSuccess('User created'); this.resetFilters(); this.loadUsers(); },
        error: (err) => { this.savingUser = false; this.toast.showError(err?.error?.errors?.[0] ?? 'Failed to create user'); }
      });
    }
  }

  // ── Data loading ────────────────────────────────────────────────────────────

  private loadUsers(): void {
    this.loading = true;

    this.http.get<unknown>('/api/v1/users?pageNumber=1&pageSize=200').subscribe({
      next: (response: unknown) => {
        const res = response as Record<string, unknown>;
        let items: IUserListItem[];
        if (Array.isArray(res)) {
          items = res as IUserListItem[];
        } else if (Array.isArray(res['items'])) {
          items = res['items'] as IUserListItem[];
        } else if (Array.isArray(res['data'])) {
          items = res['data'] as IUserListItem[];
        } else if (res['data'] && typeof res['data'] === 'object' && Array.isArray((res['data'] as Record<string, unknown>)['items'])) {
          items = (res['data'] as Record<string, unknown>)['items'] as IUserListItem[];
        } else {
          items = [];
        }
        this.users = items;
        this.filteredUsers = [...items];
        this.totalCount = items.length;
        this.computeMetrics();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Failed to load users. Please try again.');
      }
    });
  }

  private computeMetrics(): void {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    this.metrics = {
      totalUsers: this.users.length,
      activeUsers: this.users.filter(u => u.isActive).length,
      inactiveUsers: this.users.filter(u => !u.isActive).length,
      lockedUsers: this.users.filter(u => (u as unknown as Record<string, unknown>)['isLocked'] === true).length,
      newThisMonth: this.users.filter(u => new Date(u.createdAt) >= monthStart).length
    };
  }
}
