import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/design-system/services/confirm-dialog.service';

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
      <!-- Page Header -->
      <div class="mb-2">
        <h1 class="text-2xl font-bold text-base-content">User Details</h1>
        <p class="text-sm text-base-content/60 mt-1">View and manage user account information, roles, and security settings.</p>
      </div>

      <!-- User Header Card -->
      <div class="card bg-base-100 shadow-sm border border-base-200 p-6">
        <div class="flex items-start justify-between flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <button class="btn btn-ghost btn-sm btn-square" (click)="navigateToList()" aria-label="Back"><span class="material-symbols-outlined">arrow_back</span></button>
            <div class="avatar placeholder"><div class="bg-primary text-primary-content rounded-full w-14 h-14"><span class="text-xl font-bold">{{getInitials()}}</span></div></div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-xl font-bold text-base-content">{{user.firstName}} {{user.lastName}}</h2>
                <span class="badge badge-sm badge-success">{{user.isActive ? 'Active' : 'Inactive'}}</span>
              </div>
              <p class="text-sm text-base-content/60 mt-0.5" *ngIf="user.roles.length">{{formatRoleName(user.roles[0])}}</p>
              <p class="text-sm text-base-content/50">{{user.email}}</p>
              <p class="text-xs text-base-content/40 mt-0.5">Last Login: {{user.lastLoginAt?(user.lastLoginAt|date:'dd MMM yyyy, hh:mm a'):'Never'}}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-outline btn-sm gap-1.5" (click)="navigateToEdit()"><span class="material-symbols-outlined text-sm">edit</span> Edit User</button>
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-outline btn-sm gap-1.5">More Actions <span class="material-symbols-outlined text-sm">expand_more</span></div>
              <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-lg border border-base-200">
                <li><button (click)="showDeactivateDialog=true" class="text-warning"><span class="material-symbols-outlined text-sm">block</span>{{user.isActive?'Deactivate':'Reactivate'}}</button></li>
                <li><button (click)="showPasswordResetDialog=true"><span class="material-symbols-outlined text-sm">lock_reset</span>Reset Password</button></li>
                <li><button (click)="revokeAllSessions()" class="text-error"><span class="material-symbols-outlined text-sm">logout</span>Revoke All Sessions</button></li>
              </ul>
            </div>
          </div>
        </div>
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
      <div *ngIf="activeTab==='overview'">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <!-- User Information -->
          <div class="card bg-base-100 shadow-sm border border-base-200 p-5">
            <h3 class="text-sm font-bold text-primary mb-4">User Information</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between"><span class="text-base-content/50">First Name</span><span class="font-medium text-base-content">{{user.firstName}}</span></div>
              <div class="flex justify-between"><span class="text-base-content/50">Last Name</span><span class="font-medium text-base-content">{{user.lastName}}</span></div>
              <div class="flex justify-between"><span class="text-base-content/50">Email</span><span class="font-medium text-base-content text-xs">{{user.email}}</span></div>
              <div class="flex justify-between items-center"><span class="text-base-content/50">Status</span><span class="badge badge-sm badge-success">{{user.isActive?'Active':'Inactive'}}</span></div>
              <div class="flex justify-between"><span class="text-base-content/50">Created At</span><span class="text-base-content">{{user.createdAt|date:'dd MMM yyyy, hh:mm a'}}</span></div>
              <div class="flex justify-between"><span class="text-base-content/50">Created By</span><span class="text-base-content">admin&#64;buildestate.co.uk</span></div>
              <div class="flex justify-between"><span class="text-base-content/50">Updated At</span><span class="text-base-content">{{user.lastLoginAt?(user.lastLoginAt|date:'dd MMM yyyy, hh:mm a'):'—'}}</span></div>
            </div>
          </div>
          <!-- Assigned Roles -->
          <div class="card bg-base-100 shadow-sm border border-base-200 p-5">
            <h3 class="text-sm font-bold text-primary mb-4">Assigned Roles</h3>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let role of user.roles" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border" [ngClass]="getRoleBadgeClass(role)">{{role}}</span>
              <span *ngIf="!user.roles.length" class="text-sm text-base-content/50">No roles assigned</span>
            </div>
          </div>
          <!-- Security Summary -->
          <div class="card bg-base-100 shadow-sm border border-base-200 p-5">
            <h3 class="text-sm font-bold text-primary mb-4">Security Summary</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between"><span class="text-base-content/50">Password Last Changed</span><span class="text-base-content">{{user.passwordLastChangedAt?(user.passwordLastChangedAt|date:'dd MMM yyyy, hh:mm a'):'Never'}}</span></div>
              <div class="flex justify-between"><span class="text-base-content/50">Failed Login Attempts</span><span class="text-base-content" [class.text-warning]="user.failedLoginAttempts>0" [class.font-bold]="user.failedLoginAttempts>0">{{user.failedLoginAttempts}}</span></div>
              <div class="flex justify-between"><span class="text-base-content/50">Account Locked</span><span class="text-base-content">No</span></div>
              <div class="flex justify-between"><span class="text-base-content/50">Two Factor Auth</span><span class="text-base-content">Not Enabled</span></div>
            </div>
          </div>
        </div>
        <!-- Quick Actions -->
        <div>
          <h3 class="text-sm font-bold text-base-content mb-3">Quick Actions</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button class="flex items-center gap-3 px-4 py-3 rounded-xl border border-base-200 bg-base-100 hover:bg-base-200/30 transition-colors" (click)="showPasswordResetDialog=true">
              <span class="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center"><span class="material-symbols-outlined text-warning text-lg">lock_reset</span></span>
              <span class="text-sm font-medium text-base-content">Reset Password</span>
            </button>
            <button class="flex items-center gap-3 px-4 py-3 rounded-xl border border-base-200 bg-base-100 hover:bg-base-200/30 transition-colors" (click)="showDeactivateDialog=true">
              <span class="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center"><span class="material-symbols-outlined text-error text-lg">block</span></span>
              <span class="text-sm font-medium text-base-content">{{user.isActive?'Deactivate User':'Activate User'}}</span>
            </button>
            <button class="flex items-center gap-3 px-4 py-3 rounded-xl border border-base-200 bg-base-100 hover:bg-base-200/30 transition-colors" (click)="activeTab='sessions'">
              <span class="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center"><span class="material-symbols-outlined text-secondary text-lg">devices</span></span>
              <span class="text-sm font-medium text-base-content">View Sessions</span>
            </button>
            <button class="flex items-center gap-3 px-4 py-3 rounded-xl border border-base-200 bg-base-100 hover:bg-base-200/30 transition-colors" (click)="activeTab='activity'">
              <span class="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center"><span class="material-symbols-outlined text-info text-lg">history</span></span>
              <span class="text-sm font-medium text-base-content">View Activity</span>
            </button>
          </div>
        </div>
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
      <div class="modal-box w-full max-w-lg p-0 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center gap-3 px-6 pt-6 pb-4">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span class="text-white text-xs font-bold">9</span>
          </div>
          <h3 class="text-lg font-bold text-base-content uppercase tracking-wide">Deactivate User</h3>
        </div>
        <div class="px-6 pb-6 space-y-4">
          <p class="text-sm font-semibold text-base-content">Deactivate User</p>
          <!-- Warning -->
          <div class="flex items-start gap-3 bg-warning/10 border border-warning/20 rounded-lg p-3">
            <span class="material-symbols-outlined text-warning text-xl mt-0.5">warning</span>
            <p class="text-sm text-base-content">Are you sure you want to deactivate <span class="font-bold">{{user?.firstName}} {{user?.lastName}}</span>?</p>
          </div>
          <p class="text-sm text-base-content/70">The user will be immediately signed out and cannot log in until reactivated.</p>
          <!-- Info box -->
          <div class="bg-warning/5 border border-warning/20 rounded-lg px-4 py-2.5">
            <p class="text-sm text-base-content/70 italic">This action can be undone.</p>
          </div>
          <!-- Reason dropdown -->
          <div>
            <label class="text-sm font-medium text-base-content mb-1.5 block">Reason (Optional)</label>
            <select class="select select-bordered w-full" [(ngModel)]="deactivateReason">
              <option value="">Select reason...</option>
              <option value="no_longer_with_company">User no longer with company</option>
              <option value="role_change">Role change</option>
              <option value="security_concern">Security concern</option>
              <option value="temporary_leave">Temporary leave</option>
              <option value="other">Other</option>
            </select>
          </div>
          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-2 border-t border-base-200">
            <button class="btn btn-ghost" (click)="showDeactivateDialog=false">Cancel</button>
            <button class="btn btn-error px-5" (click)="confirmDeactivation()">Deactivate User</button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button (click)="showDeactivateDialog=false">close</button></form>
    </dialog>
    <!-- Password Reset Dialog -->
    <dialog class="modal" [class.modal-open]="showPasswordResetDialog">
      <div class="modal-box w-full max-w-lg p-0 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center gap-3 px-6 pt-6 pb-4">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span class="text-white text-xs font-bold">8</span>
          </div>
          <h3 class="text-lg font-bold text-base-content uppercase tracking-wide">Reset Password</h3>
        </div>
        <div class="px-6 pb-6 space-y-4">
          <!-- User info -->
          <div>
            <p class="text-xs text-base-content/50 mb-2">Reset Password for:</p>
            <div class="flex items-center gap-3">
              <div class="avatar placeholder">
                <div class="bg-primary text-white rounded-full w-10 h-10"><span class="text-sm font-bold">{{getInitials()}}</span></div>
              </div>
              <div>
                <p class="text-sm font-bold text-base-content">{{user?.firstName}} {{user?.lastName}}</p>
                <p class="text-xs text-base-content/60">{{user?.email}}</p>
              </div>
            </div>
          </div>
          <!-- Password input -->
          <div>
            <label class="text-sm font-semibold text-base-content mb-1.5 block">Enter new password</label>
            <div class="relative">
              <input [type]="showResetPw?'text':'password'" class="input input-bordered w-full pr-10"
                     [(ngModel)]="resetPasswordValue" placeholder="••••••••••" (ngModelChange)="updatePasswordRules()" />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                      (click)="showResetPw=!showResetPw">
                <span class="material-symbols-outlined text-xl">{{showResetPw?'visibility_off':'visibility'}}</span>
              </button>
            </div>
          </div>
          <!-- Password rules -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-2 text-sm" *ngFor="let rule of passwordRules">
              <span class="material-symbols-outlined text-base" [ngClass]="rule.met ? 'text-success' : 'text-base-content/30'">
                {{rule.met ? 'check_circle' : 'radio_button_unchecked'}}
              </span>
              <span [ngClass]="rule.met ? 'text-success' : 'text-base-content/60'">{{rule.label}}</span>
            </div>
          </div>
          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-2 border-t border-base-200">
            <button class="btn btn-ghost" (click)="showPasswordResetDialog=false">Cancel</button>
            <button class="btn btn-primary px-5" (click)="confirmPasswordReset()" [disabled]="!isPasswordValid">Reset Password</button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button (click)="showPasswordResetDialog=false">close</button></form>
    </dialog>

    <!-- Edit User Modal -->
    <dialog class="modal" [class.modal-open]="showEditModal">
      <div class="modal-box w-full max-w-4xl p-0 overflow-hidden">
        <div class="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-base-200">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span class="text-white text-xs font-bold">3</span>
          </div>
          <h3 class="text-lg font-bold text-base-content uppercase tracking-wide">Create / Edit User</h3>
        </div>
        <div class="px-6 pt-3 border-b border-base-200">
          <div class="flex gap-0">
            <button type="button" class="px-5 py-2.5 text-sm font-medium border-b-2 border-transparent text-base-content/60">Create User</button>
            <button type="button" class="px-5 py-2.5 text-sm font-medium border-b-2 border-primary text-primary">Edit User</button>
          </div>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-bold text-base-content mb-1.5 block">First Name <span class="text-error">*</span></label>
                <input type="text" class="input input-bordered w-full" [(ngModel)]="editForm.firstName" />
              </div>
              <div>
                <label class="text-sm font-bold text-base-content mb-1.5 block">Last Name <span class="text-error">*</span></label>
                <input type="text" class="input input-bordered w-full" [(ngModel)]="editForm.lastName" />
              </div>
              <div>
                <label class="text-sm font-bold text-base-content mb-1.5 block">Email Address <span class="text-error">*</span></label>
                <input type="email" class="input input-bordered w-full" [(ngModel)]="editForm.email" />
              </div>
              <div>
                <label class="text-sm font-bold text-base-content mb-1.5 block">Password <span class="text-error">*</span></label>
                <div class="relative">
                  <input [type]="showEditPw?'text':'password'" class="input input-bordered w-full pr-10" [(ngModel)]="editForm.password" placeholder="••••••••" />
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content" (click)="showEditPw=!showEditPw">
                    <span class="material-symbols-outlined text-xl">{{showEditPw?'visibility_off':'visibility'}}</span>
                  </button>
                </div>
              </div>
              <div>
                <label class="text-sm font-bold text-base-content mb-1.5 block">Confirm Password <span class="text-error">*</span></label>
                <div class="relative">
                  <input [type]="showEditCpw?'text':'password'" class="input input-bordered w-full pr-10" [(ngModel)]="editForm.confirmPassword" placeholder="••••••••" />
                  <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content" (click)="showEditCpw=!showEditCpw">
                    <span class="material-symbols-outlined text-xl">{{showEditCpw?'visibility_off':'visibility'}}</span>
                  </button>
                </div>
              </div>
              <div>
                <label class="text-sm font-bold text-base-content mb-1.5 block">Status</label>
                <select class="select select-bordered w-full" [(ngModel)]="editForm.status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label class="text-sm font-bold text-base-content mb-3 block">Assign Roles <span class="text-error">*</span></label>
              <div class="relative mb-3">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">search</span>
                <input type="text" placeholder="Search roles..." class="input input-bordered w-full pl-10" [(ngModel)]="editRoleSearch" />
              </div>
              <div class="border border-base-200 rounded-lg max-h-[380px] overflow-y-auto">
                <label *ngFor="let role of filteredEditRoles" class="flex items-center gap-3 px-4 py-3 border-b border-base-200/50 last:border-b-0 hover:bg-base-200/30 cursor-pointer transition-colors">
                  <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" [checked]="editForm.roles.includes(role)" (change)="toggleEditRole(role)" />
                  <span class="text-sm font-medium text-base-content">{{role}}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-base-200">
            <button class="btn btn-ghost" (click)="showEditModal=false">Cancel</button>
            <button class="btn btn-primary px-6" (click)="saveEditUser()" [disabled]="savingEdit">
              <span *ngIf="savingEdit" class="loading loading-spinner loading-sm"></span> Save User
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button (click)="showEditModal=false">close</button></form>
    </dialog>
  `
})
export class UserDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  user: IUserDetail | null = null;
  loading = true;
  notFound = false;
  activeTab: 'overview' | 'roles' | 'security' | 'sessions' | 'activity' = 'overview';
  showDeactivateDialog = false;
  showPasswordResetDialog = false;
  showResetPw = false;
  resetPasswordValue = '';
  deactivateReason = '';
  showEditModal = false;
  showEditPw = false;
  showEditCpw = false;
  savingEdit = false;
  editRoleSearch = '';
  editForm = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', status: 'active', roles: [] as string[] };

  readonly allRoles = [
    'SuperAdmin', 'AcquisitionManager', 'LegalOfficer', 'PlanningManager',
    'ProjectManager', 'SiteManager', 'SalesManager', 'CompletionManager',
    'PropertyManager', 'FinanceDirector', 'ValuationAnalyst', 'Surveyor', 'Admin'
  ];

  get filteredEditRoles(): string[] {
    if (!this.editRoleSearch.trim()) return this.allRoles;
    const t = this.editRoleSearch.toLowerCase();
    return this.allRoles.filter(r => r.toLowerCase().includes(t));
  }

  toggleEditRole(role: string): void {
    const idx = this.editForm.roles.indexOf(role);
    if (idx >= 0) this.editForm.roles.splice(idx, 1);
    else this.editForm.roles.push(role);
  }

  saveEditUser(): void {
    if (!this.user || !this.editForm.firstName || !this.editForm.lastName || !this.editForm.email) return;
    this.savingEdit = true;
    this.http.put(`/api/v1/users/${this.user.id}`, {
      firstName: this.editForm.firstName, lastName: this.editForm.lastName,
      email: this.editForm.email, isActive: this.editForm.status === 'active'
    }).subscribe({
      next: () => {
        this.http.put(`/api/v1/users/${this.user!.id}/roles`, { roles: this.editForm.roles }).subscribe({
          next: () => { this.savingEdit = false; this.showEditModal = false; this.toast.showSuccess('User updated'); this.loadUser(this.user!.id); },
          error: () => { this.savingEdit = false; this.showEditModal = false; this.toast.showSuccess('User updated'); this.loadUser(this.user!.id); }
        });
      },
      error: () => { this.savingEdit = false; this.toast.showError('Failed to update user'); }
    });
  }

  passwordRules = [
    { label: 'Minimum 8 characters', met: false },
    { label: 'At least 1 uppercase letter', met: false },
    { label: 'At least 1 number', met: false },
    { label: 'At least 1 special character', met: false }
  ];

  get isPasswordValid(): boolean {
    return this.passwordRules.every(r => r.met);
  }

  updatePasswordRules(): void {
    const v = this.resetPasswordValue;
    this.passwordRules = [
      { label: 'Minimum 8 characters', met: v.length >= 8 },
      { label: 'At least 1 uppercase letter', met: /[A-Z]/.test(v) },
      { label: 'At least 1 number', met: /[0-9]/.test(v) },
      { label: 'At least 1 special character', met: /[!@#$%^&*()\-_+=\[\]{}|;:',.<>?/`~]/.test(v) }
    ];
  }

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
  navigateToEdit(): void {
    if (!this.user) return;
    this.editForm = {
      firstName: this.user.firstName, lastName: this.user.lastName,
      email: this.user.email, password: '', confirmPassword: '',
      status: this.user.isActive ? 'active' : 'inactive',
      roles: [...this.user.roles]
    };
    this.showEditModal = true;
  }
  getInitials(): string { return this.user ? `${this.user.firstName.charAt(0)}${this.user.lastName.charAt(0)}`.toUpperCase() : ''; }
  getRoleBadgeClass(role: string): string { return this.roleBadgeClasses[role] ?? 'badge-ghost'; }
  formatRoleName(role: string): string { return role.replace(/([a-z])([A-Z])/g, '$1 $2'); }

  confirmDeactivation(): void {
    if (!this.user) return;
    const endpoint = this.user.isActive ? `/api/v1/users/${this.user.id}/deactivate` : `/api/v1/users/${this.user.id}/activate`;
    this.http.patch(endpoint, {}).subscribe({
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
    this.confirmDialog.confirm({
      title: 'Revoke All Sessions',
      message: `Are you sure you want to revoke all active sessions for ${this.user.firstName} ${this.user.lastName}? They will be signed out of all devices immediately.`,
      confirmText: 'Revoke All',
      cancelText: 'Cancel',
      severity: 'danger',
    }).subscribe(confirmed => {
      if (!confirmed || !this.user) return;
      this.http.post(`/api/v1/sessions/user/${this.user.id}/revoke-all`, {}).subscribe({
        next: () => { this.toast.showSuccess('All sessions revoked'); },
        error: () => { this.toast.showError('Failed to revoke sessions'); }
      });
    });
  }

  private loadUser(userId: string): void {
    this.loading = true;
    this.http.get<any>(`/api/v1/users/${userId}`).subscribe({
      next: (response) => { this.user = response.data ?? response; this.loading = false; },
      error: (err) => { this.loading = false; if (err.status === 404) { this.notFound = true; } else { this.toast.showError('Failed to load user'); } }
    });
  }
}
