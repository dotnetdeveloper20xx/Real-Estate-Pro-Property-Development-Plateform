import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';

interface IPermissionItem { readonly id: string; readonly name: string; readonly displayName: string; readonly domainArea: string; }
interface IRoleItem { readonly id: string; readonly name: string; readonly description: string; readonly userCount: number; readonly isBuiltIn: boolean; }
interface IAssignmentCell { readonly roleId: string; readonly permissionId: string; readonly isGranted: boolean; }
interface IPermissionMatrix { readonly roles: readonly IRoleItem[]; readonly permissionGroups: readonly { readonly domainArea: string; readonly permissions: readonly IPermissionItem[] }[]; readonly cells: readonly IAssignmentCell[]; }
interface IPermGroup { domainArea: string; permissions: IPermissionItem[]; expanded: boolean; }

@Component({
  selector: 'app-permission-matrix',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">Permission Matrix</h1>
          <p class="text-sm text-base-content/60 mt-1">Manage role-based access and permissions across the platform.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-outline btn-sm gap-1.5"><span class="material-symbols-outlined text-sm">compare_arrows</span>Compare Roles</button>
          <button class="btn btn-outline btn-sm gap-1.5"><span class="material-symbols-outlined text-sm">content_copy</span>Clone Role</button>
          <button class="btn btn-outline btn-sm gap-1.5"><span class="material-symbols-outlined text-sm">download</span>Export</button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex items-center justify-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <ng-container *ngIf="!loading && matrix">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="card bg-base-100 border border-base-200 shadow-sm"><div class="card-body p-4">
            <div class="flex items-start justify-between"><div><p class="text-xs text-base-content/50">Total Permissions</p><p class="text-2xl font-bold text-base-content mt-1">{{ getTotalPermCount() }}</p></div>
            <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><span class="material-symbols-outlined text-primary">key</span></div></div>
          </div></div>
          <div class="card bg-base-100 border border-base-200 shadow-sm"><div class="card-body p-4">
            <div class="flex items-start justify-between"><div><p class="text-xs text-base-content/50">Total Roles</p><p class="text-2xl font-bold text-base-content mt-1">{{ matrix.roles.length }}</p></div>
            <div class="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center"><span class="material-symbols-outlined text-info">shield</span></div></div>
          </div></div>
          <div class="card bg-base-100 border border-base-200 shadow-sm"><div class="card-body p-4">
            <div class="flex items-start justify-between"><div><p class="text-xs text-base-content/50">Granted (This Role)</p><p class="text-2xl font-bold text-success mt-1">{{ getGrantedCount() }}</p></div>
            <div class="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center"><span class="material-symbols-outlined text-success">check_circle</span></div></div>
          </div></div>
          <div class="card bg-base-100 border border-base-200 shadow-sm"><div class="card-body p-4">
            <div class="flex items-start justify-between"><div><p class="text-xs text-base-content/50">Users Assigned</p><p class="text-2xl font-bold text-base-content mt-1">{{ selectedRole?.userCount ?? 0 }}</p></div>
            <div class="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center"><span class="material-symbols-outlined text-warning">group</span></div></div>
          </div></div>
          <div class="card bg-base-100 border border-base-200 shadow-sm"><div class="card-body p-4">
            <div class="flex items-start justify-between"><div><p class="text-xs text-base-content/50">Business Areas</p><p class="text-2xl font-bold text-base-content mt-1">{{ permGroups.length }}</p></div>
            <div class="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><span class="material-symbols-outlined text-accent">category</span></div></div>
          </div></div>
        </div>

        <!-- Role Cards -->
        <div>
          <h2 class="text-sm font-bold text-base-content mb-3">Select Role</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            <div *ngFor="let role of matrix.roles" (click)="selectRole(role)"
                 class="cursor-pointer rounded-xl border-2 p-4 transition-all"
                 [ngClass]="selectedRole?.id === role.id ? 'border-primary bg-primary/5 shadow-md' : 'border-base-200 bg-base-100 hover:border-primary/40 hover:shadow-sm'">
              <p class="text-sm font-bold text-base-content truncate">{{ formatRoleName(role.name) }}</p>
              <p class="text-xs text-base-content/50 mt-0.5 truncate">{{ role.description || 'No description' }}</p>
              <div class="flex items-center gap-3 mt-2 text-xs text-base-content/60">
                <span>{{ getRoleGrantedCount(role.id) }} perms</span>
                <span>{{ role.userCount }} users</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content: Permissions + Sidebar -->
        <div class="flex gap-6" *ngIf="selectedRole">
          <!-- Left: Permissions -->
          <div class="flex-1 min-w-0 space-y-4">
            <!-- Search + Toolbar -->
            <div class="flex items-center gap-3">
              <div class="relative flex-1">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">search</span>
                <input type="text" placeholder="Search permissions..." class="input input-bordered w-full pl-10"
                       [(ngModel)]="searchTerm" (ngModelChange)="filterPermissions()" />
              </div>
              <button class="btn btn-success btn-sm gap-1" (click)="grantAll()"><span class="material-symbols-outlined text-sm">check_circle</span>Grant All</button>
              <button class="btn btn-error btn-sm gap-1" (click)="revokeAll()"><span class="material-symbols-outlined text-sm">cancel</span>Revoke All</button>
            </div>

            <!-- Domain Area Tabs -->
            <div class="bg-base-100 rounded-xl border border-base-200 shadow-sm p-1.5 overflow-x-auto">
              <div class="flex gap-1.5 min-w-max">
                <button *ngFor="let group of permGroups" type="button"
                        class="px-5 py-3 text-sm font-semibold rounded-lg whitespace-nowrap transition-all"
                        [ngClass]="selectedDomain === group.domainArea
                          ? 'bg-primary text-white shadow-md'
                          : 'text-base-content/60 hover:bg-base-200/50 hover:text-base-content'"
                        (click)="selectDomain(group.domainArea)">
                  {{ group.domainArea }}
                  <span class="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                        [ngClass]="selectedDomain === group.domainArea ? 'bg-white/20 text-white' : 'bg-base-200 text-base-content/50'">
                    {{ getGroupGranted(group) }}/{{ group.permissions.length }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Active Domain Permissions -->
            <div *ngIf="activeDomainGroup" class="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
              <!-- Domain Header -->
              <div class="flex items-center justify-between px-5 py-3 bg-base-200/20">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-bold text-primary uppercase">{{ activeDomainGroup.domainArea }}</span>
                  <span class="badge badge-sm badge-ghost">{{ getGroupGranted(activeDomainGroup) }}/{{ activeDomainGroup.permissions.length }}</span>
                </div>
                <div class="w-32 h-2 rounded-full bg-base-300 overflow-hidden">
                  <div class="h-full rounded-full bg-success transition-all" [style.width.%]="getGroupPercent(activeDomainGroup)"></div>
                </div>
              </div>

              <!-- Permission Rows -->
              <div class="divide-y divide-base-200">
                <div *ngFor="let perm of activeDomainPermissions"
                     class="flex items-center justify-between px-5 py-4 hover:bg-base-200/10 transition-colors">
                  <div class="flex-1 min-w-0 pr-4">
                    <p class="text-sm font-medium text-base-content">{{ perm.displayName }}</p>
                    <p class="text-xs text-base-content/50 mt-0.5">{{ perm.name }}</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="toggle toggle-sm toggle-success"
                           [checked]="isGranted(perm.id)"
                           (change)="onToggle(perm)" />
                  </label>
                </div>
                <div *ngIf="activeDomainPermissions.length === 0" class="px-5 py-8 text-center text-base-content/40">
                  <p>No permissions match your search in this area.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Sticky Summary Panel -->
          <div class="w-72 shrink-0 hidden lg:block">
            <div class="card bg-base-100 border border-base-200 shadow-sm sticky top-6">
              <div class="card-body p-5 space-y-4">
                <h3 class="text-sm font-bold text-base-content">Role Summary</h3>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between"><span class="text-base-content/50">Role</span><span class="font-bold">{{ formatRoleName(selectedRole.name) }}</span></div>
                  <div class="flex justify-between"><span class="text-base-content/50">Granted</span><span class="font-bold text-success">{{ getGrantedCount() }}</span></div>
                  <div class="flex justify-between"><span class="text-base-content/50">Denied</span><span class="font-bold text-error">{{ getDeniedCount() }}</span></div>
                  <div class="flex justify-between"><span class="text-base-content/50">Users</span><span class="font-bold">{{ selectedRole.userCount }}</span></div>
                  <div class="flex justify-between"><span class="text-base-content/50">Areas</span><span class="font-bold">{{ permGroups.length }}</span></div>
                  <div class="flex justify-between"><span class="text-base-content/50">Type</span><span class="badge badge-sm" [ngClass]="selectedRole.isBuiltIn?'badge-info':'badge-accent'">{{ selectedRole.isBuiltIn?'Built-in':'Custom' }}</span></div>
                </div>
                <div class="pt-3 border-t border-base-200 space-y-2">
                  <button class="btn btn-outline btn-sm w-full gap-1.5"><span class="material-symbols-outlined text-sm">content_copy</span>Clone Role</button>
                  <button class="btn btn-outline btn-sm w-full gap-1.5"><span class="material-symbols-outlined text-sm">compare_arrows</span>Compare</button>
                  <button class="btn btn-outline btn-sm w-full gap-1.5"><span class="material-symbols-outlined text-sm">download</span>Export</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class PermissionMatrixComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  matrix: IPermissionMatrix | null = null;
  loading = false;
  selectedRole: IRoleItem | null = null;
  permGroups: IPermGroup[] = [];
  filteredGroups: IPermGroup[] = [];
  searchTerm = '';
  selectedDomain = '';
  private assignmentMap = new Map<string, boolean>();

  ngOnInit(): void { this.loadMatrix(); }

  selectRole(role: IRoleItem): void {
    this.selectedRole = role;
    this.filterPermissions();
    if (this.permGroups.length > 0 && !this.selectedDomain) {
      this.selectedDomain = this.permGroups[0].domainArea;
    }
  }

  selectDomain(domain: string): void { this.selectedDomain = domain; }

  get activeDomainGroup(): IPermGroup | null {
    return this.permGroups.find(g => g.domainArea === this.selectedDomain) ?? null;
  }

  get activeDomainPermissions(): IPermissionItem[] {
    const group = this.activeDomainGroup;
    if (!group) return [];
    if (!this.searchTerm.trim()) return group.permissions;
    const t = this.searchTerm.toLowerCase();
    return group.permissions.filter(p => p.displayName.toLowerCase().includes(t) || p.name.toLowerCase().includes(t));
  }
  formatRoleName(name: string): string { return name.replace(/([a-z])([A-Z])/g, '$1 $2'); }
  getTotalPermCount(): number { return this.matrix?.permissionGroups.reduce((s, g) => s + g.permissions.length, 0) ?? 0; }

  getGrantedCount(): number {
    if (!this.selectedRole) return 0;
    let count = 0;
    this.assignmentMap.forEach((v, k) => { if (k.startsWith(this.selectedRole!.id + ':') && v) count++; });
    return count;
  }

  getDeniedCount(): number { return this.getTotalPermCount() - this.getGrantedCount(); }

  getRoleGrantedCount(roleId: string): number {
    let count = 0;
    this.assignmentMap.forEach((v, k) => { if (k.startsWith(roleId + ':') && v) count++; });
    return count;
  }

  getGroupGranted(group: IPermGroup): number {
    if (!this.selectedRole) return 0;
    return group.permissions.filter(p => this.assignmentMap.get(`${this.selectedRole!.id}:${p.id}`) === true).length;
  }

  getGroupPercent(group: IPermGroup): number {
    if (group.permissions.length === 0) return 0;
    return (this.getGroupGranted(group) / group.permissions.length) * 100;
  }

  isGranted(permId: string): boolean {
    if (!this.selectedRole) return false;
    return this.assignmentMap.get(`${this.selectedRole.id}:${permId}`) === true;
  }

  filterPermissions(): void {
    if (!this.searchTerm.trim()) { this.filteredGroups = this.permGroups.map(g => ({ ...g })); return; }
    const t = this.searchTerm.toLowerCase();
    this.filteredGroups = this.permGroups.map(g => ({
      ...g, permissions: g.permissions.filter(p => p.displayName.toLowerCase().includes(t) || p.name.toLowerCase().includes(t))
    })).filter(g => g.permissions.length > 0);
  }

  onToggle(perm: IPermissionItem): void {
    if (!this.selectedRole) return;
    const key = `${this.selectedRole.id}:${perm.id}`;
    const newState = !this.assignmentMap.get(key);
    this.assignmentMap.set(key, newState);
    this.http.put('/api/v1/permissions/toggle', {
      roleId: this.selectedRole.id, permissionId: perm.id, isGranted: newState
    }).subscribe({
      next: () => this.toast.showSuccess(newState ? 'Permission granted' : 'Permission revoked'),
      error: () => { this.assignmentMap.set(key, !newState); this.toast.showError('Failed to update'); }
    });
  }

  grantAll(): void {
    if (!this.selectedRole) return;
    this.permGroups.forEach(g => g.permissions.forEach(p => {
      this.assignmentMap.set(`${this.selectedRole!.id}:${p.id}`, true);
    }));
    this.toast.showSuccess('All permissions granted');
  }

  revokeAll(): void {
    if (!this.selectedRole) return;
    this.permGroups.forEach(g => g.permissions.forEach(p => {
      this.assignmentMap.set(`${this.selectedRole!.id}:${p.id}`, false);
    }));
    this.toast.showSuccess('All permissions revoked');
  }

  private loadMatrix(): void {
    this.loading = true;
    this.http.get<IPermissionMatrix>('/api/v1/permissions/matrix').subscribe({
      next: (matrix) => {
        this.matrix = matrix;
        this.assignmentMap.clear();
        for (const cell of matrix.cells) this.assignmentMap.set(`${cell.roleId}:${cell.permissionId}`, cell.isGranted);
        this.permGroups = matrix.permissionGroups.map(g => ({ domainArea: g.domainArea, permissions: [...g.permissions], expanded: true }));
        this.filteredGroups = this.permGroups.map(g => ({ ...g }));
        if (matrix.roles.length > 0) this.selectedRole = matrix.roles[0];
        if (this.permGroups.length > 0) this.selectedDomain = this.permGroups[0].domainArea;
        this.loading = false;
      },
      error: () => { this.loading = false; this.toast.showError('Failed to load permission matrix'); }
    });
  }
}
