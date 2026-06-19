import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

interface IRoleListItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly userCount: number;
  readonly isBuiltIn: boolean;
}

interface IRoleDetail extends IRoleListItem {
  readonly permissions: readonly IPermissionItem[];
}

interface IPermissionItem {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly domainArea: string;
}

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="mb-2">
        <h1 class="text-2xl font-bold text-base-content">Role Management</h1>
        <p class="text-sm text-base-content/60 mt-1">Configure roles and assign permissions to control platform access.</p>
      </div>

      <!-- Main 2-Panel Layout -->
      <div class="flex gap-6">
        <!-- Left: Role List -->
        <div class="flex-1 min-w-0">
          <div class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
            <!-- Search + New Role -->
            <div class="flex items-center gap-3 p-4 border-b border-base-200">
              <div class="relative flex-1">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">search</span>
                <input type="text" placeholder="Search roles..." class="input input-bordered w-full pl-10"
                       [(ngModel)]="searchTerm" (ngModelChange)="onSearchInput($event)" />
              </div>
              <button class="btn btn-primary gap-1.5" (click)="navigateToCreate()">
                <span class="material-symbols-outlined text-sm">add</span> New Role
              </button>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr class="bg-base-200/30">
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Role Name</th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60">Description</th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 text-center w-20">Users</th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <ng-container *ngIf="loading">
                    <tr *ngFor="let r of [1,2,3,4,5]" class="animate-pulse">
                      <td><div class="h-4 bg-base-300 rounded w-28"></div></td>
                      <td><div class="h-4 bg-base-300 rounded w-44"></div></td>
                      <td><div class="h-4 bg-base-300 rounded w-8 mx-auto"></div></td>
                      <td><div class="h-4 bg-base-300 rounded w-12 mx-auto"></div></td>
                    </tr>
                  </ng-container>

                  <tr *ngIf="!loading && filteredRoles.length === 0">
                    <td colspan="4" class="text-center py-8 text-base-content/50">No roles found</td>
                  </tr>

                  <ng-container *ngIf="!loading && filteredRoles.length > 0">
                    <tr *ngFor="let role of paginatedRoles; trackBy: trackById"
                        class="hover:bg-primary/5 cursor-pointer transition-colors"
                        [class.bg-primary/10]="selectedRole?.id === role.id"
                        (click)="selectRole(role)">
                      <td class="text-sm font-medium">{{ role.name }}</td>
                      <td class="text-sm text-base-content/70">{{ role.description }}</td>
                      <td class="text-center text-sm font-medium">{{ role.userCount }}</td>
                      <td class="text-center" (click)="$event.stopPropagation()">
                        <div class="flex items-center justify-center gap-1">
                          <button class="btn btn-ghost btn-xs btn-square text-primary" (click)="navigateToEdit(role.id)" aria-label="Edit">
                            <span class="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button *ngIf="!role.isBuiltIn" class="btn btn-ghost btn-xs btn-square text-error" (click)="confirmDeleteRole(role)" aria-label="Delete">
                            <span class="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </ng-container>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div *ngIf="!loading && filteredRoles.length > 0" class="flex items-center justify-between px-4 py-3 border-t border-base-200">
              <span class="text-sm text-base-content/60">Showing {{ startRecord }} to {{ endRecord }} of {{ filteredRoles.length }} roles</span>
              <div class="flex items-center gap-1">
                <button class="btn btn-ghost btn-sm btn-square" (click)="goToPage(currentPage-1)" [disabled]="currentPage===1">
                  <span class="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <ng-container *ngFor="let page of visiblePages">
                  <button class="btn btn-sm btn-square" [ngClass]="page===currentPage?'btn-primary text-white':'btn-ghost'" (click)="goToPage(page)">{{ page }}</button>
                </ng-container>
                <button class="btn btn-ghost btn-sm btn-square" (click)="goToPage(currentPage+1)" [disabled]="currentPage===totalPages">
                  <span class="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Role Details Panel -->
        <div class="w-80 shrink-0 hidden lg:block">
          <div class="card bg-base-100 shadow-sm border border-base-200 sticky top-6">
            <div class="card-body p-5">
              <ng-container *ngIf="selectedRole; else noSelection">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-base font-bold text-base-content">Role Details</h2>
                </div>

                <div class="space-y-4">
                  <!-- Role Name + Edit -->
                  <div class="flex items-center justify-between">
                    <h3 class="text-lg font-bold text-base-content">{{ selectedRole.name }}</h3>
                    <button class="text-sm text-primary hover:underline" (click)="navigateToEdit(selectedRole.id)">Edit Role</button>
                  </div>

                  <!-- Description -->
                  <div>
                    <p class="text-xs text-base-content/50 mb-1">Description</p>
                    <p class="text-sm text-base-content/80">{{ selectedRole.description || 'No description provided' }}</p>
                  </div>

                  <!-- Total Users -->
                  <div>
                    <p class="text-xs text-base-content/50 mb-1">Total Users</p>
                    <p class="text-2xl font-bold text-base-content">{{ selectedRole.userCount }}</p>
                  </div>

                  <!-- Permissions -->
                  <div *ngIf="selectedRoleDetail">
                    <p class="text-xs font-bold text-base-content mb-2">Permissions ({{ selectedRoleDetail.permissions.length }})</p>
                    <div class="space-y-1.5 max-h-48 overflow-y-auto">
                      <div *ngFor="let perm of selectedRoleDetail.permissions.slice(0, 6)"
                           class="flex items-center gap-2 text-sm">
                        <span class="material-symbols-outlined text-success text-base">check_circle</span>
                        <span class="text-primary font-medium">{{ perm.displayName }}</span>
                      </div>
                    </div>
                    <p *ngIf="selectedRoleDetail.permissions.length > 6" class="text-xs text-base-content/50 mt-2">
                      + {{ selectedRoleDetail.permissions.length - 6 }} more permissions
                    </p>
                    <button class="text-sm text-primary hover:underline mt-2" (click)="navigateToPermissionMatrix()">View All Permissions</button>
                  </div>

                  <div *ngIf="!selectedRoleDetail" class="flex justify-center py-4">
                    <span class="loading loading-spinner loading-sm text-primary"></span>
                  </div>
                </div>
              </ng-container>

              <ng-template #noSelection>
                <div class="text-center py-8 text-base-content/40">
                  <span class="material-symbols-outlined text-4xl mb-2">shield</span>
                  <p class="text-sm">Select a role to view details</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RoleListComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  roles: IRoleListItem[] = [];
  filteredRoles: IRoleListItem[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 8;
  searchTerm = '';
  selectedRole: IRoleListItem | null = null;
  selectedRoleDetail: IRoleDetail | null = null;

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => { this.searchTerm = term; this.currentPage = 1; this.applyFilter(); });
    this.loadRoles();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredRoles.length / this.pageSize)); }
  get startRecord(): number { return this.filteredRoles.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1; }
  get endRecord(): number { return Math.min(this.currentPage * this.pageSize, this.filteredRoles.length); }
  get paginatedRoles(): IRoleListItem[] { const s = (this.currentPage - 1) * this.pageSize; return this.filteredRoles.slice(s, s + this.pageSize); }
  get visiblePages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  onSearchInput(term: string): void { this.searchSubject.next(term); }
  goToPage(page: number): void { if (page >= 1 && page <= this.totalPages) this.currentPage = page; }
  trackById(_i: number, role: IRoleListItem): string { return role.id; }
  navigateToCreate(): void { this.router.navigate(['/admin/roles/create']); }
  navigateToEdit(id: string): void { this.router.navigate(['/admin/roles/create'], { queryParams: { edit: id } }); }
  navigateToPermissionMatrix(): void { this.router.navigate(['/admin/permissions']); }

  selectRole(role: IRoleListItem): void {
    this.selectedRole = role;
    this.selectedRoleDetail = null;
    this.loadRoleDetail(role.id);
  }

  confirmDeleteRole(role: IRoleListItem): void {
    this.http.delete(`/api/v1/roles/${role.id}`).subscribe({
      next: () => { this.toast.showSuccess('Role deleted'); this.loadRoles(); if (this.selectedRole?.id === role.id) this.selectedRole = null; },
      error: () => { this.toast.showError('Cannot delete built-in role'); }
    });
  }

  private applyFilter(): void {
    if (!this.searchTerm) { this.filteredRoles = [...this.roles]; return; }
    const t = this.searchTerm.toLowerCase();
    this.filteredRoles = this.roles.filter(r => r.name.toLowerCase().includes(t) || r.description.toLowerCase().includes(t));
  }

  private loadRoles(): void {
    this.loading = true;
    this.http.get<any>('/api/v1/roles').subscribe({
      next: (res) => { this.roles = res?.data ?? (Array.isArray(res) ? res : []); this.applyFilter(); this.loading = false; if (this.roles.length > 0 && !this.selectedRole) this.selectRole(this.roles[0]); },
      error: () => { this.loading = false; this.toast.showError('Failed to load roles'); }
    });
  }

  private loadRoleDetail(roleId: string): void {
    this.http.get<any>(`/api/v1/roles/${roleId}`).subscribe({
      next: (res) => { this.selectedRoleDetail = res?.data ?? res; },
      error: () => { this.selectedRoleDetail = { ...this.selectedRole!, permissions: [] }; }
    });
  }
}
