import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith, switchMap } from 'rxjs/operators';

import { NotificationService } from '@core/services/notification.service';
import { INotification, NotificationEventType } from '@features/land-acquisition/models/notification.model';

/**
 * Icon mapping for each notification event type.
 * Uses Material Symbols Outlined icon names.
 */
const EVENT_TYPE_ICON_MAP: Record<NotificationEventType, string> = {
  [NotificationEventType.StatusChange]: 'swap_horiz',
  [NotificationEventType.ApprovalRequest]: 'approval',
  [NotificationEventType.OfferExpiry]: 'timer_off',
  [NotificationEventType.DueDiligenceFailure]: 'warning',
  [NotificationEventType.ContractSigned]: 'handshake'
};

/**
 * Returns the Material Symbols icon name for a given notification event type.
 * Falls back to 'notifications' if the event type is unrecognized.
 */
export function getNotificationIcon(eventType: NotificationEventType): string {
  return EVENT_TYPE_ICON_MAP[eventType] ?? 'notifications';
}

/**
 * NotificationPanelComponent — Application-wide notification bell with dropdown panel.
 *
 * Displays:
 * - Bell icon button with unread count badge (DaisyUI indicator)
 * - Dropdown panel showing the 20 most recent notifications
 * - Each notification: event type icon, title, description, relative timestamp, read status
 *
 * Behavior:
 * - Fetches notifications on init and every 60 seconds
 * - On notification click: marks as read and emits navigation event
 * - Loading state and empty state handled
 *
 * Lives in shared/components because it's used application-wide in the app header.
 */
@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- DaisyUI dropdown with bell icon -->
    <div class="dropdown dropdown-end">
      <!-- Bell icon button with indicator badge -->
      <button
        tabindex="0"
        class="btn btn-ghost btn-circle btn-sm relative"
        aria-label="Notifications"
        (click)="togglePanel()">
        <span class="material-symbols-outlined text-xl">notifications</span>
        <span
          *ngIf="unreadCount > 0"
          class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          [attr.aria-label]="unreadCount + ' unread notifications'">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <!-- Notification dropdown panel -->
      <div
        tabindex="0"
        class="dropdown-content bg-base-100 rounded-xl z-50 w-80 shadow-xl border border-base-200 mt-2"
        role="region"
        aria-label="Notifications panel">

        <!-- Panel header -->
        <div class="p-3 border-b border-base-200 flex items-center justify-between">
          <h3 class="text-sm font-semibold">Notifications</h3>
          <span
            *ngIf="unreadCount > 0"
            class="badge badge-sm badge-primary">
            {{ unreadCount }} unread
          </span>
        </div>

        <!-- Loading state -->
        <div *ngIf="loading" class="p-6 flex items-center justify-center">
          <span class="loading loading-spinner loading-sm text-primary"></span>
          <span class="ml-2 text-sm text-base-content/60">Loading notifications...</span>
        </div>

        <!-- Empty state -->
        <div *ngIf="!loading && notifications.length === 0" class="p-6 text-center">
          <span class="material-symbols-outlined text-3xl text-base-content/30 mb-2">notifications_off</span>
          <p class="text-sm text-base-content/50">No notifications</p>
          <p class="text-xs text-base-content/40 mt-1">You're all caught up</p>
        </div>

        <!-- Notification list -->
        <div
          *ngIf="!loading && notifications.length > 0"
          class="max-h-80 overflow-y-auto">
          <div
            *ngFor="let notification of notifications; trackBy: trackById"
            class="flex items-start gap-3 p-3 hover:bg-base-200/50 border-b border-base-200/50 cursor-pointer transition-colors"
            [class.bg-base-200/30]="!notification.isRead"
            (click)="onNotificationClick(notification)"
            role="button"
            [attr.aria-label]="notification.title + ' - ' + notification.description">

            <!-- Event type icon -->
            <div
              class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              [ngClass]="getIconContainerClass(notification.eventType)">
              <span class="material-symbols-outlined text-sm">
                {{ getIcon(notification.eventType) }}
              </span>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p
                class="text-sm truncate"
                [class.font-semibold]="!notification.isRead"
                [class.font-medium]="notification.isRead">
                {{ notification.title }}
              </p>
              <p class="text-xs text-base-content/60 truncate mt-0.5">
                {{ notification.description }}
              </p>
              <p class="text-xs text-base-content/40 mt-1">
                {{ getRelativeTime(notification.createdAt) }}
              </p>
            </div>

            <!-- Unread indicator dot -->
            <div
              *ngIf="!notification.isRead"
              class="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"
              aria-hidden="true">
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          *ngIf="!loading && notifications.length > 0"
          class="p-2 border-t border-base-200">
          <button
            class="btn btn-ghost btn-sm btn-block text-xs"
            (click)="onViewAll()">
            View All Notifications
          </button>
        </div>
      </div>
    </div>
  `
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  /** Emitted when user clicks a notification — parent should navigate to the relevant entity */
  @Output() navigate = new EventEmitter<{ entityId: string; entityType: string }>();

  notifications: INotification[] = [];
  unreadCount = 0;
  loading = false;

  private readonly destroy$ = new Subject<void>();
  private readonly POLL_INTERVAL_MS = 60_000;
  private readonly MAX_NOTIFICATIONS = 20;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Fetch notifications immediately and then every 60 seconds
    interval(this.POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => {
          this.loading = this.notifications.length === 0;
          this.cdr.markForCheck();
          return this.notificationService.getRecent(this.MAX_NOTIFICATIONS);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success && response.data) {
            this.notifications = response.data;
            this.unreadCount = this.notifications.filter(n => !n.isRead).length;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Toggle panel visibility — DaisyUI handles this via the dropdown focus pattern */
  togglePanel(): void {
    // DaisyUI dropdown handles open/close via tabindex focus
  }

  /** Handle notification click: mark as read and emit navigation event */
  onNotificationClick(notification: INotification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Update local state optimistically
            this.notifications = this.notifications.map(n =>
              n.id === notification.id ? { ...n, isRead: true } : n
            );
            this.unreadCount = this.notifications.filter(n => !n.isRead).length;
            this.cdr.markForCheck();
          }
        });
    }

    this.navigate.emit({
      entityId: notification.entityId,
      entityType: notification.entityType
    });
  }

  /** Emit a generic view-all event (parent handles navigation) */
  onViewAll(): void {
    this.navigate.emit({ entityId: '', entityType: 'all' });
  }

  /** Get the Material Symbols icon name for a notification event type */
  getIcon(eventType: NotificationEventType): string {
    return getNotificationIcon(eventType);
  }

  /** Get the background/text color class for the icon container based on event type */
  getIconContainerClass(eventType: NotificationEventType): string {
    switch (eventType) {
      case NotificationEventType.StatusChange:
        return 'bg-info/10 text-info';
      case NotificationEventType.ApprovalRequest:
        return 'bg-warning/10 text-warning';
      case NotificationEventType.OfferExpiry:
        return 'bg-error/10 text-error';
      case NotificationEventType.DueDiligenceFailure:
        return 'bg-error/10 text-error';
      case NotificationEventType.ContractSigned:
        return 'bg-success/10 text-success';
      default:
        return 'bg-base-200 text-base-content/60';
    }
  }

  /** Convert ISO date string to relative time display (e.g., "2 hours ago") */
  getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }

  /** TrackBy function for notification list performance */
  trackById(_index: number, item: INotification): string {
    return item.id;
  }
}
