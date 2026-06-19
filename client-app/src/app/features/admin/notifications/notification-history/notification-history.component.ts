import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NotificationAdminService, INotificationHistoryItem } from '../../services/notification-admin.service';

/**
 * Notification History page for SuperAdmin.
 * Shows all sent notifications across all users with filtering.
 * Provides full audit view of the notification delivery system.
 */
@Component({
  selector: 'app-notification-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="p-6 pb-0">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-base-content">Notification History</h1>
          <p class="text-sm text-base-content/60 mt-1">
            View all sent notifications across all users. Full audit trail of the notification system.
          </p>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <select
          class="select select-bordered select-sm w-44"
          [(ngModel)]="filters.module"
          (ngModelChange)="loadHistory()">
          <option value="">All Modules</option>
          <option *ngFor="let m of availableModules" [value]="m">{{ m }}</option>
        </select>

        <select
          class="select select-bordered select-sm w-36"
          [(ngModel)]="filters.isRead"
          (ngModelChange)="loadHistory()">
          <option value="">All Status</option>
          <option value="true">Read</option>
          <option value="false">Unread</option>
        </select>

        <input
          type="date"
          class="input input-bordered input-sm w-40"
          [(ngModel)]="filters.startDate"
          (ngModelChange)="loadHistory()" />

        <input
          type="date"
          class="input input-bordered input-sm w-40"
          [(ngModel)]="filters.endDate"
          (ngModelChange)="loadHistory()" />

        <button class="btn btn-ghost btn-sm" (click)="clearFilters()">
          <span class="material-symbols-outlined text-sm">filter_alt_off</span>
          Clear
        </button>

        <span class="text-sm text-base-content/50 ml-auto">
          {{ notifications.length }} notification{{ notifications.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- History Table -->
    <div class="px-6 pb-6">
      <!-- Loading -->
      <div *ngIf="loading" class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-md text-primary"></span>
        <span class="ml-3 text-sm text-base-content/60">Loading notification history...</span>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && notifications.length === 0" class="card bg-base-100 border border-base-200 p-12 text-center">
        <span class="material-symbols-outlined text-5xl text-base-content/20 mb-3">history</span>
        <p class="text-base-content/60 font-medium">No notifications found</p>
        <p class="text-sm text-base-content/40 mt-1">Notifications will appear here as the system sends them.</p>
      </div>

      <!-- Table -->
      <div *ngIf="!loading && notifications.length > 0" class="card bg-base-100 border border-base-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr class="bg-base-200/50">
                <th class="font-semibold text-xs uppercase tracking-wider">Sent At</th>
                <th class="font-semibold text-xs uppercase tracking-wider">Recipient</th>
                <th class="font-semibold text-xs uppercase tracking-wider">Event</th>
                <th class="font-semibold text-xs uppercase tracking-wider">Module</th>
                <th class="font-semibold text-xs uppercase tracking-wider">Title</th>
                <th class="font-semibold text-xs uppercase tracking-wider">Severity</th>
                <th class="font-semibold text-xs uppercase tracking-wider">Channel</th>
                <th class="font-semibold text-xs uppercase tracking-wider">Status</th>
                <th class="font-semibold text-xs uppercase tracking-wider">Read</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let n of notifications; trackBy: trackById" class="hover:bg-base-200/30">
                <td class="text-xs text-base-content/70 whitespace-nowrap">
                  {{ formatDate(n.sentAt || n.createdAt) }}
                </td>
                <td class="text-sm">
                  {{ n.recipientName || n.recipientUserId }}
                </td>
                <td>
                  <span class="font-mono text-xs bg-base-200 px-2 py-0.5 rounded">{{ n.eventType }}</span>
                </td>
                <td>
                  <span class="badge badge-sm badge-outline">{{ n.module }}</span>
                </td>
                <td class="max-w-xs truncate text-sm">{{ n.title }}</td>
                <td>
                  <span class="badge badge-xs" [ngClass]="getSeverityClass(n.severity)">
                    {{ n.severity }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-xs" [ngClass]="getChannelClass(n.channel)">
                    {{ n.channel }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-xs" [ngClass]="getDeliveryClass(n.deliveryStatus)">
                    {{ n.deliveryStatus }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="material-symbols-outlined text-sm"
                        [class.text-success]="n.isRead"
                        [class.text-base-content/30]="!n.isRead">
                    {{ n.isRead ? 'mark_email_read' : 'mark_email_unread' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between p-3 border-t border-base-200">
          <span class="text-xs text-base-content/50">
            Page {{ currentPage }} of {{ totalPages || 1 }}
          </span>
          <div class="flex gap-1">
            <button
              class="btn btn-ghost btn-xs"
              [disabled]="currentPage <= 1"
              (click)="goToPage(currentPage - 1)">
              Previous
            </button>
            <button
              class="btn btn-ghost btn-xs"
              [disabled]="currentPage >= totalPages"
              (click)="goToPage(currentPage + 1)">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationHistoryComponent implements OnInit, OnDestroy {
  notifications: INotificationHistoryItem[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 1;
  pageSize = 25;

  filters = {
    module: '',
    isRead: '',
    startDate: '',
    endDate: ''
  };

  readonly availableModules = [
    'LandAcquisition', 'PlanningApprovals', 'LegalCompliance',
    'ProjectManagement', 'Construction', 'Finance',
    'PropertyUnits', 'Sales', 'Documents'
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly service: NotificationAdminService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHistory(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const params: any = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };
    if (this.filters.module) params.module = this.filters.module;
    if (this.filters.isRead) params.isRead = this.filters.isRead === 'true';
    if (this.filters.startDate) params.startDate = this.filters.startDate;
    if (this.filters.endDate) params.endDate = this.filters.endDate;

    this.service.getAllNotifications(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.notifications = res.data ?? [];
          if (res.pagination) {
            this.totalPages = res.pagination.totalPages;
            this.currentPage = res.pagination.pageNumber;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadHistory();
  }

  clearFilters(): void {
    this.filters = { module: '', isRead: '', startDate: '', endDate: '' };
    this.currentPage = 1;
    this.loadHistory();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'Info': return 'badge-info';
      case 'Success': return 'badge-success';
      case 'Warning': return 'badge-warning';
      case 'Error': return 'badge-error';
      default: return 'badge-ghost';
    }
  }

  getChannelClass(channel: string): string {
    switch (channel) {
      case 'InApp': return 'badge-info';
      case 'Email': return 'badge-secondary';
      case 'Both': return 'badge-primary';
      default: return 'badge-ghost';
    }
  }

  getDeliveryClass(status: string): string {
    switch (status) {
      case 'Delivered': return 'badge-success';
      case 'Failed': return 'badge-error';
      case 'Pending': return 'badge-warning';
      default: return 'badge-ghost';
    }
  }

  trackById(_: number, item: INotificationHistoryItem): string {
    return item.id;
  }
}
