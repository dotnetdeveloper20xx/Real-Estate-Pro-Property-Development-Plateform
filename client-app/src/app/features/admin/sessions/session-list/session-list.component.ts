import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

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

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
          <span class="text-white text-sm font-bold">7</span>
        </div>
        <h1 class="text-xl font-bold text-base-content uppercase tracking-wide">Session Management</h1>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Sessions Table -->
      <div *ngIf="!isLoading" class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
        <!-- Empty State -->
        <div *ngIf="sessions.length === 0" class="p-12 text-center">
          <span class="material-symbols-outlined text-4xl text-base-content/30">devices</span>
          <p class="mt-2 text-base-content/50 font-medium">No active sessions found</p>
        </div>

        <div *ngIf="sessions.length > 0" class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr class="bg-base-200/30">
                <th class="text-xs font-bold text-base-content uppercase">Device</th>
                <th class="text-xs font-bold text-base-content uppercase">Location</th>
                <th class="text-xs font-bold text-base-content uppercase">IP Address</th>
                <th class="text-xs font-bold text-base-content uppercase">Last Active</th>
                <th class="text-xs font-bold text-base-content uppercase">Status</th>
                <th class="text-xs font-bold text-base-content uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let session of sessions" class="hover:bg-base-200/20">
                <td class="text-sm font-medium">{{ session.browser }} on {{ session.operatingSystem }}</td>
                <td class="text-sm">{{ getLocation(session) }}</td>
                <td class="text-sm font-mono">{{ session.ipAddress }}</td>
                <td class="text-sm">{{ session.lastActiveAt | date:'dd MMM yyyy, hh:mm a' }}</td>
                <td>
                  <span *ngIf="session.isCurrent"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-success text-success bg-success/5">
                    Current
                  </span>
                  <span *ngIf="!session.isCurrent && !session.isRevoked"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-success text-success bg-success/5">
                    Active
                  </span>
                  <span *ngIf="session.isRevoked"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-error text-error bg-error/5">
                    Expired
                  </span>
                </td>
                <td>
                  <button *ngIf="!session.isCurrent && !session.isRevoked"
                          class="btn btn-outline btn-error btn-xs px-3"
                          (click)="revokeSession(session)" [disabled]="isRevoking">
                    Revoke
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer: Info + Revoke All -->
        <div *ngIf="sessions.length > 0" class="flex items-center justify-between px-5 py-4 border-t border-base-200 bg-base-200/20">
          <p class="text-sm text-base-content/60 italic">
            You can revoke other active sessions. Current session cannot be revoked.
          </p>
          <button class="btn btn-error btn-sm px-4 gap-1.5 font-semibold"
                  (click)="revokeAllOther()" [disabled]="isRevoking || sessions.length <= 1">
            Revoke All Other Sessions
          </button>
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

  ngOnInit(): void { this.loadSessions(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  getLocation(session: ISessionItem): string {
    if (session.city && session.country) return `${session.city}, ${session.country}`;
    if (session.city) return session.city;
    if (session.country) return session.country;
    return 'Unknown';
  }

  revokeSession(session: ISessionItem): void {
    this.isRevoking = true;
    this.http.post(`/api/v1/sessions/${session.id}/revoke`, {}).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.sessions = this.sessions.filter(s => s.id !== session.id); this.isRevoking = false; this.toast.showSuccess('Session revoked'); },
      error: () => { this.isRevoking = false; this.toast.showError('Failed to revoke session'); }
    });
  }

  revokeAllOther(): void {
    this.isRevoking = true;
    this.http.post('/api/v1/sessions/revoke-all', {}).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.sessions = this.sessions.filter(s => s.isCurrent); this.isRevoking = false; this.toast.showSuccess('All other sessions revoked'); },
      error: () => { this.isRevoking = false; this.toast.showError('Failed to revoke sessions'); }
    });
  }

  private loadSessions(): void {
    this.isLoading = true;
    const userId = this.route.snapshot.queryParamMap.get('userId');
    const url = userId ? `/api/v1/sessions?userId=${userId}` : '/api/v1/sessions';
    this.http.get<ISessionItem[]>(url).pipe(takeUntil(this.destroy$)).subscribe({
      next: (sessions) => { this.sessions = Array.isArray(sessions) ? sessions : (sessions as any)?.data ?? []; this.isLoading = false; },
      error: () => { this.isLoading = false; this.toast.showError('Failed to load sessions'); }
    });
  }
}
