import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Session item model.
 */
interface ISessionItem {
  readonly id: string;
  readonly deviceInfo: string;
  readonly browser: string;
  readonly operatingSystem: string;
  readonly ipAddress: string;
  readonly city: string | null;
  readonly country: string | null;
  readonly lastActiveAt: string;
  readonly isCurrent: boolean;
  readonly isRevoked: boolean;
}

/**
 * Session List Page Component
 *
 * Features:
 * - Table: Device (browser/OS), Location (city/country), IP Address, Last Active, Status
 * - "Revoke" button per row (disabled for current session)
 * - "Revoke All Other Sessions" button
 * - Notice about current session protection
 * - Real-time removal of revoked sessions without page reload
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.6
 */
@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 space-y-6 animate-[fade-in_0.4s_ease-out]">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">Active Sessions</h1>
          <p class="text-sm text-base-content/60 mt-1">
            Manage active user sessions across devices
          </p>
        </div>
        <button
          class="btn btn-error btn-sm gap-2"
          (click)="revokeAllOther()"
          [disabled]="isRevoking || sessions.length <= 1">
          <span class="material-symbols-outlined text-base">block</span>
          Revoke All Other Sessions
        </button>
      </div>

      <!-- Info Notice -->
      <div class="alert alert-info shadow-sm">
        <span class="material-symbols-outlined">info</span>
        <span>You can revoke other active sessions. Current session cannot be revoked.</span>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Sessions Table -->
      <div *ngIf="!isLoading" class="card bg-base-100 shadow-sm border border-base-300/50">
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Device</th>
                <th>Location</th>
                <th>IP Address</th>
                <th>Last Active</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let session of sessions" class="hover">
                <td>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-base-content/50">devices</span>
                    <div>
                      <div class="font-medium text-sm">{{ session.browser }}</div>
                      <div class="text-xs text-base-content/50">{{ session.operatingSystem }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span *ngIf="session.city || session.country">
                    {{ session.city }}{{ session.city && session.country ? ', ' : '' }}{{ session.country }}
                  </span>
                  <span *ngIf="!session.city && !session.country" class="text-base-content/40">Unknown</span>
                </td>
                <td class="font-mono text-sm">{{ session.ipAddress }}</td>
                <td class="text-sm">{{ session.lastActiveAt | date:'short' }}</td>
                <td>
                  <span *ngIf="session.isCurrent" class="badge badge-success badge-sm">Current</span>
                  <span *ngIf="!session.isCurrent && !session.isRevoked" class="badge badge-info badge-sm">Active</span>
                  <span *ngIf="session.isRevoked" class="badge badge-error badge-sm">Revoked</span>
                </td>
                <td>
                  <button
                    class="btn btn-ghost btn-xs text-error"
                    (click)="revokeSession(session)"
                    [disabled]="session.isCurrent || session.isRevoked || isRevoking">
                    Revoke
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div *ngIf="sessions.length === 0" class="p-12 text-center">
          <span class="material-symbols-outlined text-4xl text-base-content/30">devices</span>
          <p class="mt-2 text-base-content/50">No active sessions found</p>
        </div>
      </div>
    </div>
  `
})
export class SessionListComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  sessions: ISessionItem[] = [];
  isLoading = false;
  isRevoking = false;

  ngOnInit(): void {
    this.loadSessions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSessions(): void {
    this.isLoading = true;
    // Check if contextual (from user detail page via query param)
    const userId = this.route.snapshot.queryParamMap.get('userId');
    const url = userId
      ? `/api/v1/sessions?userId=${userId}`
      : '/api/v1/sessions';

    this.http.get<ISessionItem[]>(url).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toast.showError('Failed to load sessions');
      }
    });
  }

  revokeSession(session: ISessionItem): void {
    this.isRevoking = true;
    this.http.post(`/api/v1/sessions/${session.id}/revoke`, {}).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.sessions = this.sessions.filter(s => s.id !== session.id);
        this.isRevoking = false;
        this.toast.showSuccess('Session revoked successfully');
      },
      error: () => {
        this.isRevoking = false;
        this.toast.showError('Failed to revoke session');
      }
    });
  }

  revokeAllOther(): void {
    this.isRevoking = true;
    this.http.post('/api/v1/sessions/revoke-all', {}).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.sessions = this.sessions.filter(s => s.isCurrent);
        this.isRevoking = false;
        this.toast.showSuccess('All other sessions revoked');
      },
      error: () => {
        this.isRevoking = false;
        this.toast.showError('Failed to revoke sessions');
      }
    });
  }
}
