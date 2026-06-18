import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

interface IAuditLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly action: string;
  readonly performedByUserName: string;
  readonly targetUserName: string | null;
  readonly details: string | null;
  readonly ipAddress: string;
}

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
          <span class="text-white text-sm font-bold">6</span>
        </div>
        <h1 class="text-xl font-bold text-base-content uppercase tracking-wide">Activity Log</h1>
      </div>

      <!-- Filters Row -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select class="select select-bordered w-full" [(ngModel)]="actionFilter" (ngModelChange)="onFilterChange()">
          <option value="">All Actions</option>
          <option value="UserLogin">User Login</option>
          <option value="UserLogout">User Logout</option>
          <option value="UserCreated">User Created</option>
          <option value="UserUpdated">User Updated</option>
          <option value="UserDeactivated">User Deactivated</option>
          <option value="UserReactivated">User Reactivated</option>
          <option value="PasswordChanged">Password Changed</option>
          <option value="PasswordReset">Password Reset</option>
          <option value="RoleAssigned">Role Assigned</option>
          <option value="RoleUpdated">Role Updated</option>
          <option value="SessionRevoked">Session Revoked</option>
        </select>

        <select class="select select-bordered w-full" [(ngModel)]="userFilter" (ngModelChange)="onFilterChange()">
          <option value="">All Users</option>
          <option *ngFor="let u of uniqueUsers" [value]="u">{{ u }}</option>
        </select>

        <div class="relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-lg">calendar_today</span>
          <input type="date" class="input input-bordered w-full pl-10" [(ngModel)]="dateFrom" (ngModelChange)="onFilterChange()"
                 placeholder="Select Date Range" />
        </div>

        <select class="select select-bordered w-full" [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange()">
          <option [ngValue]="8">8 per page</option>
          <option [ngValue]="10">10 per page</option>
          <option [ngValue]="25">25 per page</option>
          <option [ngValue]="50">50 per page</option>
        </select>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Table -->
      <div *ngIf="!isLoading" class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
        <!-- Empty State -->
        <div *ngIf="filteredEntries.length === 0" class="p-12 text-center">
          <span class="material-symbols-outlined text-4xl text-base-content/30">history</span>
          <p class="mt-2 text-base-content/50 font-medium">No activity records found</p>
          <p class="text-xs text-base-content/40 mt-1">Try adjusting your filters or date range</p>
        </div>

        <div *ngIf="filteredEntries.length > 0" class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr class="bg-base-200/40">
                <th class="text-xs font-bold text-base-content uppercase">Date & Time</th>
                <th class="text-xs font-bold text-base-content uppercase">User</th>
                <th class="text-xs font-bold text-base-content uppercase">Action</th>
                <th class="text-xs font-bold text-base-content uppercase">Target</th>
                <th class="text-xs font-bold text-base-content uppercase">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of paginatedEntries" class="hover:bg-base-200/20">
                <td class="text-sm whitespace-nowrap">{{ entry.timestamp | date:'dd MMM yyyy, hh:mm a' }}</td>
                <td class="text-sm">{{ entry.performedByUserName }}</td>
                <td class="text-sm font-medium">{{ formatAction(entry.action) }}</td>
                <td class="text-sm">{{ entry.targetUserName || '—' }}</td>
                <td class="text-sm text-base-content/70 italic">{{ entry.details || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="filteredEntries.length > 0" class="flex items-center justify-between px-4 py-3 border-t border-base-200">
          <span class="text-sm text-primary">
            Showing {{ startRecord }} to {{ endRecord }} of {{ filteredEntries.length }} activities
          </span>
          <div class="flex items-center gap-1">
            <button class="btn btn-ghost btn-sm btn-square" (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1">
              <span class="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <ng-container *ngFor="let page of visiblePages">
              <button *ngIf="page !== -1" class="btn btn-sm btn-square"
                      [ngClass]="page === currentPage ? 'btn-primary text-white' : 'btn-ghost'"
                      (click)="goToPage(page)">{{ page }}</button>
              <span *ngIf="page === -1" class="px-1 text-base-content/40">...</span>
            </ng-container>
            <button class="btn btn-ghost btn-sm btn-square" (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages">
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
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

  allEntries: IAuditLogEntry[] = [];
  filteredEntries: IAuditLogEntry[] = [];
  uniqueUsers: string[] = [];
  isLoading = false;
  totalCount = 0;
  currentPage = 1;
  pageSize = 8;
  actionFilter = '';
  userFilter = '';
  dateFrom = '';
  dateTo = '';

  ngOnInit(): void { this.loadAuditLogs(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredEntries.length / this.pageSize)); }
  get startRecord(): number { return this.filteredEntries.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1; }
  get endRecord(): number { return Math.min(this.currentPage * this.pageSize, this.filteredEntries.length); }

  get paginatedEntries(): IAuditLogEntry[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEntries.slice(start, start + this.pageSize);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3, 4);
      if (this.currentPage > 4 && this.currentPage < total - 2) {
        pages.length = 0;
        pages.push(1, -1, this.currentPage - 1, this.currentPage, this.currentPage + 1, -1, total);
      } else {
        pages.push(-1, total);
      }
    }
    return pages;
  }

  onFilterChange(): void { this.currentPage = 1; this.applyFilters(); }
  onPageSizeChange(): void { this.currentPage = 1; }
  goToPage(page: number): void { if (page >= 1 && page <= this.totalPages) this.currentPage = page; }

  formatAction(action: string): string {
    return action.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  private applyFilters(): void {
    let result = [...this.allEntries];
    if (this.actionFilter) result = result.filter(e => e.action === this.actionFilter);
    if (this.userFilter) result = result.filter(e => e.performedByUserName === this.userFilter);
    if (this.dateFrom) {
      const from = new Date(this.dateFrom);
      result = result.filter(e => new Date(e.timestamp) >= from);
    }
    this.filteredEntries = result;
  }

  private loadAuditLogs(): void {
    this.isLoading = true;
    const params = new HttpParams().set('pageNumber', '1').set('pageSize', '200');

    this.http.get<any>('/api/v1/audit-logs', { params }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.allEntries = result?.data ?? result?.items ?? [];
        this.filteredEntries = [...this.allEntries];
        this.totalCount = this.allEntries.length;
        this.uniqueUsers = [...new Set(this.allEntries.map(e => e.performedByUserName))].sort();
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; this.toast.showError('Failed to load activity logs'); }
    });
  }
}
