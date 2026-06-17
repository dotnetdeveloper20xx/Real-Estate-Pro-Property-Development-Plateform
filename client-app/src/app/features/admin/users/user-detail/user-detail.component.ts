import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';

interface IUserDetail {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly isActive: boolean;
  readonly lastLoginAt: string | null;
  readonly createdAt: string;
  readonly passwordLastChangedAt: string | null;
  readonly failedLoginAttempts: number;
  readonly lastAuditActivity: string | null;
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- 404 State -->
    <div *ngIf="notFound" class="p-6 flex flex-col items-center justify-center min-h-[400px]">
      <span class="material-symbols-outlined text-6xl text-base-content/30 mb-4">person_off</span>
      <h2 class="text-xl font-bold text-base-content">User not found</h2>
      <p class="text-sm text-base-content/60 mt-2">The user you're looking for doesn't exist or has been removed.</p>
      <button class="btn btn-primary btn-sm mt-4" (click)="navigateToList()"><span class="material-symbols-outlined text-sm">arrow_back</span> Back to Users</button>
    </div>
    <!-- Loading -->
    <div *ngIf="loading" class="p-6"><div class="animate-pulse flex items-center gap-4"><div class="w-16 h-16 bg-base-300 rounded-full"></div><div class="space-y-2"><div class="h-6 bg-base-300 rounded w-48"></div><div class="h-4 bg-base-300 rounded w-32"></div></div></div></div>
    <!-- Content -->
    <div *ngIf="!loading && !notFound && user" class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-start justify-between flex-wrap gap-4">
        <div class="flex items-center gap-4">
          <button class="btn btn-ghost btn-sm btn-square" (click)="navigateToList()" aria-label="Back"><span class="material-symbols-outlined">arrow_back</span></button>
          <div class="avatar placeholder"><div class="bg-primary text-primary-content rounded-full w-14 h-14"><span class="text-xl font-bold">{{getInitials()}}</span></div></div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-2xl font-bold text-base-content">{{user.firstName}} {{user.lastName}}</h1>
              <span class="badge badge-sm" [ngClass]="user.isActive ? 'badge-success' : 'badge-error'">{{user.isActive ? 'Active' : 'Inactive'}}</span>
            </div>
            <p class="text-sm text-base-content/60 mt-0.5">{{user.email}}</p>
            <span *ngIf="user.roles.length" class="badge badge-sm badge-primary mt-1">{{formatRoleName(user.roles[0])}}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-outline btn-sm" (click)="navigateToEdit()"><span class="material-symbols-outlined text-sm">edit</span> Edit User</button>
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square"><span class="material-symbols-outlined">more_vert</span></div>
            <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-lg border border-base-200">
              <li><button (click)="showDeactivateDialog=true" class="text-warning"><span class="material-symbols-outlined text-sm">block</span>{{user.isActive?'Deactivate':'Reactivate'}}</button></li>
              <li><button (click)="showPasswordResetDialog=true"><span class="material-symbols-outlined text-sm">lock_reset</span>Reset Password</button></li>
              <li><button (click)="revokeAllSessions()" class="text-error"><span class="material-symbols-outlined text-sm">logout</span>Revoke All Sessions</button></li>
            </ul>
          </div>
        </div>
      </div>
      <!-- Quick Actions -->
      <div class="flex flex-wrap gap-2">
        <button class="btn btn-outline btn-sm gap-1" (click)="showPasswordResetDialog=true"><span class="material-symbols-outlined text-sm">lock_reset</span>Reset Password</button>
        <button class="btn btn-outline btn-sm gap-1" (click)="showDeactivateDialog=true"><span class="material-symbols-outlined text-sm">block</span>{{user.isActive?'Deactivate':'Reactivate'}}</button>
        <button class="btn btn-outline btn-sm gap-1" (click)="activeTab='sessions'"><span class="material-symbols-outlined text-sm">devices</span>View Sessions</button>
        <button class="btn btn-outline btn-sm gap-1" (click)="activeTab='activity'"><span class="material-symbols-outlined text-sm">history</span>View Activity</button>
      </div>
      <!-- Tabs -->
      <div role="tablist" class="tabs tabs-bordered">
        <button role="tab" class="tab" [class.tab-active]="activeTab==='overview'" (click)="activeTab='overview'">Overview</button>
        <button role="tab" class="tab" [class.tab-active]="activeTab==='roles'" (click)="activeTab='roles'">Roles</button>
        <button role="tab" class="tab" [class.tab-active]="activeTab==='security'" (click)="activeTab='security'">Security</button>
        <button role="tab" class="tab" [class.tab-active]="activeTab==='sessions'" (click)="activeTab='sessions'">Sessions</button>
        <button role="tab" class="tab" [class.tab-active]="activeTab==='activity'" (click)="activeTab='activity'">Activity</button>
      </div>
      <!-- Overview Tab -->
      <div *ngIf="activeTab==='overview'" class="space-y-4">
        <div class="card bg-base-100 shadow-sm border border-base-200/80"><div class="card-body">
          <h3 class="card-title text-base">User Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div><p class="text-xs text-base-content/50 uppercase">Full Name</p><p class="text-sm font-medium">{{user.firstName}} {{user.lastName}}</p></div>
            <div><p class="text-xs text-base-content/50 uppercase">Email</p><p class="text-sm font-medium">{{user.email}}</p></div>
            <div><p class="text-xs text-base-content/50 uppercase">Status</p><span class="badge badge-sm" [ngClass]="user.isActive?'badge-success':'badge-error'">{{user.isActive?'Active':'Inactive'}}</span></div>
            <div><p class="text-xs text-base-content/50 uppercase">Last Login</p><p class="text-sm">{{user.lastLoginAt?(user.lastLoginAt|date:'dd MMM yyyy, HH:mm'):'Never'}}</p></div>
            <div><p class="text-xs text-base-content/50 uppercase">Created</p><p class="text-sm">{{user.createdAt|date:'dd MMM yyyy'}}</p></div>
          </div>
        </div></div>
        <div class="card bg-base-100 shadow-sm border border-base-200/80"><div class="card-body">
          <h3 class="card-title text-base">Assigned Roles</h3>
          <div class="flex flex-wrap gap-2 mt-2">
            <span *ngFor="let role of user.roles" class="badge badge-sm" [ngClass]="getRoleBadgeClass(role)">{{formatRoleName(role)}}</span>
            <span *ngIf="!user.roles.length" class="text-sm text-base-content/50">No roles assigned</span>
          </div>
        </div></div>
        <div class="card bg-base-100 shadow-sm border border-base-200/80"><div class="card-body">
          <h3 class="card-title text-base">Security Summary</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div><p class="text-xs text-base-content/50 uppercase">Password Changed</p><p class="text-sm">{{user.passwordLastChangedAt?(user.passwordLastChangedAt|date:'dd MMM yyyy'):'Never'}}</p></div>
            <div><p class="text-xs text-base-content/50 uppercase">Failed Attempts</p><p class="text-sm" [ngClass]="user.failedLoginAttempts>0?'text-warning font-medium':''">{{user.failedLoginAttempts}}</p></div>
            <div><p class="text-xs text-base-content/50 uppercase">Last Activity</p><p class="text-sm">{{user.lastAuditActivity?(user.lastAuditActivity|date:'dd MMM yyyy, HH:mm'):'None'}}</p></div>
          </div>
        </div></div>
      </div>
      <!-- Roles Tab -->
      <div *ngIf="activeTab==='roles'" class="card bg-base-100 shadow-sm border border-base-200/80"><div class="card-body">
        <h3 class="card-title text-base">All Assigned Roles</h3>
        <div class="space-y-3 mt-3">
          <div *ngFor="let role of user.roles" class="flex items-center gap-3 p-3 bg-base-200/30 rounded-lg"><span class="badge badge-sm" [ngClass]="getRoleBadgeClass(role)">{{formatRoleName(role)}}</span></div>
          <div *ngIf="!user.roles.length" class="text-center py-8 text-base-content/50"><span class="material-symbols-outlined text-3xl mb-2">shield</span><p>No roles assigned</p></div>
        </div>
      </div></div>
      <!-- Security Tab -->
      <div *ngIf="activeTab==='security'" class="card bg-base-100 shadow-sm border border-base-200/80"><div class="card-body">
        <h3 class="card-title text-base">Security Details</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div class="p-3 bg-base-200/30 rounded-lg"><p class="text-xs text-base-content/50 uppercase">Password Last Changed</p><p class="text-sm font-medium mt-1">{{user.passwordLastChangedAt?(user.passwordLastChangedAt|date:'dd MMM yyyy, HH:mm'):'Never'}}</p></div>
          <div class="p-3 bg-base-200/30 rounded-lg"><p class="text-xs text-base-content/50 uppercase">Failed Attempts</p><p class="text-sm font-medium mt-1" [ngClass]="user.failedLoginAttempts>=3?'text-error':''">{{user.failedLoginAttempts}} / 5</p></div>
          <div class="p-3 bg-base-200/30 rounded-lg"><p class="text-xs text-base-content/50 uppercase">Account Status</p><span class="badge badge-sm mt-1" [ngClass]="user.isActive?'badge-success':'badge-error'">{{user.isActive?'Active':'Deactivated'}}</span></div>
          <div class="p-3 bg-base-200/30 rounded-lg"><p class="text-xs text-base-content/50 uppercase">Last Audit</p><p class="text-sm font-medium mt-1">{{user.lastAuditActivity?(user.lastAuditActivity|date:'dd MMM yyyy, HH:mm'):'None'}}</p></div>
        </div>
      </div></div>
      <!-- Sessions Tab -->
      <div *ngIf="activeTab==='sessions'" class="card bg-base-100 shadow-sm border border-base-200/80"><div class="card-body">
        <h3 class="card-title text-base">Active Sessions</h3>
        <div class="text-center py-8 text-base-content/50"><span class="material-symbols-outlined text-3xl mb-2">devices</span><p>Session management available from the Sessions page.</p></div>
      </div></div>
      <!-- Activity Tab -->
      <div *ngIf="activeTab==='activity'" class="card bg-base-100 shadow-sm border border-base-200/80"><div class="card-body">
        <h3 class="card-title text-base">Recent Activity</h3>
        <div class="text-center py-8 text-base-content/50"><span class="material-symbols-outlined text-3xl mb-2">history</span><p>Activity data available from the Audit Logs page.</p></div>
      </div></div>
    </div>
    <!-- Deactivation Dialog -->
    <dialog class="modal" [class.modal-open]="showDeactivateDialog">
      <div class="modal-box w-full max-w-md">
        <h3 class="text-lg font-bold">{{user?.isActive?'Deactivate':'Reactivate'}} User</h3>
        <p class="py-4 text-sm text-base-content/70">
          Are you sure you want to {{user?.isActive?'deactivate':'reactivate'}} <span class="font-semibold">{{user?.firstName}} {{user?.lastName}}</span>?
        </p>
        <div *ngIf="user?.isActive" class="alert alert-warning text-sm mb-4">
          <span class="material-symbols-outlined text-sm">info</span>
          <span>The user will be immediately signed out and this action can be undone.</span>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" (click)="showDeactivateDialog=false">Cancel</button>
          <button class="btn btn-warning" (click)="confirmDeactivation()">{{user?.isActive?'Deactivate':'Reactivate'}}</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button (click)="showDeactivateDialog=false">close</button></form>
    </dialog>
    <!-- Password Reset Dialog -->
    <dialog class="modal" [class.modal-open]="showPasswordResetDialog">
      <div class="modal-box w-full max-w-md">
        <h3 class="text-lg font-bold">Reset Password</h3>
        <p class="py-2 text-sm text-base-content/70">Set a new password for <span class="font-semibold">{{user?.firstName}} {{user?.lastName}}</span>.</p>
        <div class="form-control mt-2">
          <label class="label"><span class="label-text font-medium">New Password</span></label>
          <input [type]="showResetPw?'text':'password'" class="input input-bordered w-full" [(ngModel)]="resetPasswordValue" placeholder="Enter new password" />
        </div>
        <p class="text-xs text-base-content/50 mt-2"><span class="material-symbols-outlined text-xs align-middle">info</span> Password is not shared with anyone</p>
        <div class="modal-action">
          <button class="btn btn-ghost" (click)="showPasswordResetDialog=false">Cancel</button>
          <button class="btn btn-primary" (click)="confirmPasswordReset()" [disabled]="!resetPasswordValue">Reset Password</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button (click)="showPasswordResetDialog=false">close</button></form>
    </dialog>
  `
})
export class UserDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  user: IUserDetail | null = null;
  loading = true;
  notFound = false;
  activeTab: 'overview' | 'roles' | 'security' | 'sessions' | 'activity' = 'overview';
  showDeactivateDialog = false;
  showPasswordResetDialog = false;
  showResetPw = false;
  resetPasswordValue = '';

  private readonly roleBadgeClasses: Record<string, string> = {
    'SuperAdmin': 'badge-primary', 'Admin': 'badge-secondary', 'ProjectManager': 'badge-accent',
    'AcquisitionManager': 'badge-info', 'FinanceDirector': 'badge-warning', 'SalesManager': 'badge-success',
    'SiteManager': 'badge-error', 'LegalOfficer': 'badge-info', 'PlanningManager': 'badge-accent',
    'CompletionManager': 'badge-secondary', 'PropertyManager': 'badge-primary',
    'ValuationAnalyst': 'badge-warning', 'Surveyor': 'badge-ghost'
  };

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) { this.loadUser(userId); } else { this.notFound = true; this.loading = false; }
  }

  navigateToList(): void { this.router.navigate(['/admin/users']); }
  navigateToEdit(): void { if (this.user) this.router.navigate(['/admin/users', this.user.id, 'edit']); }
  getInitials(): string { return this.user ? `${this.user.firstName.charAt(0)}${this.user.lastName.charAt(0)}`.toUpperCase() : ''; }
  getRoleBadgeClass(role: string): string { return this.roleBadgeClasses[role] ?? 'badge-ghost'; }
  formatRoleName(role: string): string { return role.replace(/([a-z])([A-Z])/g, '$1 $2'); }

  confirmDeactivation(): void {
    if (!this.user) return;
    const endpoint = this.user.isActive ? `/api/v1/users/${this.user.id}/deactivate` : `/api/v1/users/${this.user.id}/reactivate`;
    this.http.post(endpoint, {}).subscribe({
      next: () => { this.showDeactivateDialog = false; this.toast.showSuccess(this.user!.isActive ? 'User deactivated' : 'User reactivated'); this.loadUser(this.user!.id); },
      error: () => { this.showDeactivateDialog = false; this.toast.showError('Operation failed'); }
    });
  }

  confirmPasswordReset(): void {
    if (!this.user || !this.resetPasswordValue) return;
    this.http.post(`/api/v1/users/${this.user.id}/reset-password`, { newPassword: this.resetPasswordValue }).subscribe({
      next: () => { this.showPasswordResetDialog = false; this.resetPasswordValue = ''; this.toast.showSuccess('Password reset successfully'); },
      error: () => { this.toast.showError('Failed to reset password'); }
    });
  }

  revokeAllSessions(): void {
    if (!this.user) return;
    this.http.post(`/api/v1/sessions/${this.user.id}/revoke-all`, {}).subscribe({
      next: () => { this.toast.showSuccess('All sessions revoked'); },
      error: () => { this.toast.showError('Failed to revoke sessions'); }
    });
  }

  private loadUser(userId: string): void {
    this.loading = true;
    this.http.get<IUserDetail>(`/api/v1/users/${userId}`).subscribe({
      next: (user) => { this.user = user; this.loading = false; },
      error: (err) => { this.loading = false; if (err.status === 404) { this.notFound = true; } else { this.toast.showError('Failed to load user'); } }
    });
  }
}
