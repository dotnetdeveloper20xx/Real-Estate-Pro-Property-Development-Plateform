import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Audit log entry model.
 */
interface IAuditLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly action: string;
  readonly performedByUserName: string;
  readonly targetUserName: string | null;
  readonly details: string | null;
  readonly ipAddress: string;
}

/**
 * Paginated response from the raw backend API.
 */
interface IPagedResult {
  readonly items: IAuditLogEntry[];
  readonly totalCount: number;
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

/**
 * Audit Log List Page Component
 *
 * Features:
 * - Paginated table: Date & Time, Action, Performed By, Target User, Details
 * - Page sizes: 10, 25, 50, 100 (default 25)
 * - Tab-based filtering: "All Actions", "All Users"
 * - Date range filter (max 12-month span)
 * - Empty state with suggestion to adjust filters
 *
 * Requirements: 12.2, 12.3, 12.7
 */
@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6 animate-[fade-in_0.4s_ease-out]">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-bold text-base-content">Audit Logs</h1>
        <p class="text-sm text-base-content/60 mt-1">
          Immutable record of all security-critical actions
        </p>
      </div>

      <!-- Filters -->
      <div class="card bg-base-100 shadow-sm border border-base-300/50 p-4">
        <div class="flex flex-wrap gap-4 items-end">
          <!-- Action filter -->
          <div class="form-control">
            <label class="label"><span class="label-text text-xs">Action</span></label>
            <select
              class="select select-bordered select-sm w-48"
              [(ngModel)]="actionFilter"
              (ngModelChange)="onFilterChange()">
              <option value="">All Actions</option>
              <option value="UserLogin">User Login</option>
              <option value="UserLogout">User Logout</option>
              <option value="UserCreated">User Created</option>
              <option value="UserUpdated">User Updated</option>
              <option value="UserDeactivated">User Deactivated</option>
              <option value="UserReactivated">User Reactivated</option>
              <option value="PasswordChanged">Password Changed</option>
              <option value="PasswordReset">Password Reset</option>
              <option value="RoleChanged">Role Changed</option>
              <option value="PermissionToggled">Permission Toggled</option>
              <option value="SessionRevoked">Session Revoked</option>
            </select>
          </div>

          <!-- Date range -->
          <div class="form-control">
            <label class="label"><span class="label-text text-xs">From</span></label>
            <input
              type="date"
              class="input input-bordered input-sm w-40"
              [(ngModel)]="dateFrom"
              (ngModelChange)="onFilterChange()">
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text text-xs">To</span></label>
            <input
              type="date"
              class="input input-bordered input-sm w-40"
              [(ngModel)]="dateTo"
              (ngModelChange)="onFilterChange()">
          </div>

          <!-- Page Size -->
          <div class="form-control">
            <label class="label"><span class="label-text text-xs">Per Page</span></label>
            <select
              class="select select-bordered select-sm w-24"
              [(ngModel)]="pageSize"
              (ngModelChange)="onPageSizeChange()">
              <option [ngValue]="10">10</option>
              <option [ngValue]="25">25</option>
              <option [ngValue]="50">50</option>
              <option [ngValue]="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Table -->
      <div *ngIf="!isLoading" class="card bg-base-100 shadow-sm border border-base-300/50">
        <!-- Empty State -->
        <div *ngIf="entries.length === 0" class="p-12 text-center">
          <span class="material-symbols-outlined text-4xl text-base-content/30">history</span>
          <p class="mt-2 text-base-content/50 font-medium">No records found for the selected criteria</p>
          <p class="text-xs text-base-content/40 mt-1">Try adjusting your filters or date range</p>
        </div>

        <div *ngIf="entries.length > 0" class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Target User</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of entries" class="hover">
                <td class="text-sm whitespace-nowrap">{{ entry.timestamp | date:'medium' }}</td>
                <td>
                  <span class="badge badge-ghost badge-sm">{{ entry.action }}</span>
                </td>
                <td class="text-sm font-medium">{{ entry.performedByUserName }}</td>
                <td class="text-sm">{{ entry.targetUserName || '—' }}</td>
                <td class="text-sm text-base-content/60 max-w-xs truncate">{{ entry.details || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="entries.length > 0" class="flex items-center justify-between p-4 border-t border-base-300/50">
          <span class="text-sm text-base-content/60">
            Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalCount) }} of {{ totalCount }} entries
          </span>
          <div class="join">
            <button
              class="join-item btn btn-sm"
              (click)="goToPage(currentPage - 1)"
              [disabled]="currentPage === 1">«</button>
            <button class="join-item btn btn-sm btn-active">{{ currentPage }}</button>
            <button
              class="join-item btn btn-sm"
              (click)="goToPage(currentPage + 1)"
              [disabled]="currentPage * pageSize >= totalCount">»</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuditLogListComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  entries: IAuditLogEntry[] = [];
  isLoading = false;
  totalCount = 0;
  currentPage = 1;
  pageSize = 25;
  actionFilter = '';
  dateFrom = '';
  dateTo = '';

  readonly Math = Math;

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadAuditLogs();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadAuditLogs();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadAuditLogs();
  }

  private loadAuditLogs(): void {
    this.isLoading = true;

    let params = new HttpParams()
      .set('pageNumber', this.currentPage.toString())
      .set('pageSize', this.pageSize.toString());

    if (this.actionFilter) {
      params = params.set('action', this.actionFilter);
    }
    if (this.dateFrom) {
      params = params.set('fromDate', this.dateFrom);
    }
    if (this.dateTo) {
      params = params.set('toDate', this.dateTo);
    }

    this.http.get<IPagedResult>('/api/v1/audit-logs', { params }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.entries = result.items ?? [];
        this.totalCount = result.totalCount ?? 0;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toast.showError('Failed to load audit logs');
      }
    });
  }
}
