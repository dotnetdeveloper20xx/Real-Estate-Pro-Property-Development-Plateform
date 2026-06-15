import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConfirmDialogService } from './shared/services/confirm-dialog.service';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

/**
 * Navigation item with optional children for hierarchical sidebar.
 */
interface INavChild {
  readonly label: string;
  readonly routerLink: string;
  readonly icon?: string;
}

interface INavItem {
  readonly label: string;
  readonly routerLink: string;
  readonly icon: string;
  readonly children?: INavChild[];
  readonly section?: 'implemented' | 'placeholder';
}

/**
 * Root application shell component.
 *
 * Provides the main layout structure:
 * - Collapsible sidebar with expandable sub-menus per module
 * - Top header bar with branding and user area
 * - Main content area with router-outlet
 *
 * Sub-menu behavior:
 * - Parent items expand/collapse their children on click
 * - Active module auto-expands based on current URL
 * - Collapsed sidebar hides all text and children (icon-only)
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent],
  template: `
    <div class="flex h-screen bg-base-200">
      <!-- Sidebar -->
      <aside
        class="flex flex-col bg-neutral text-neutral-content transition-all duration-300 ease-in-out"
        [class.w-64]="!sidebarCollapsed"
        [class.w-16]="sidebarCollapsed">

        <!-- Logo / Brand -->
        <div class="flex items-center h-16 px-4 border-b border-neutral-focus/30">
          <a routerLink="/home" class="flex items-center no-underline text-neutral-content hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-primary text-2xl">apartment</span>
            <span
              class="ml-3 text-lg font-bold whitespace-nowrap overflow-hidden transition-opacity duration-200"
              [class.opacity-0]="sidebarCollapsed"
              [class.w-0]="sidebarCollapsed">
              BuildEstate Pro
            </span>
          </a>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 py-4 overflow-y-auto" aria-label="Main navigation">
          <!-- MODULES section label -->
          <div
            class="text-[10px] uppercase tracking-widest text-neutral-content/40 px-4 py-1 mb-1"
            [class.hidden]="sidebarCollapsed">
            Modules
          </div>

          <ul class="menu gap-0.5 px-2">
            <ng-container *ngFor="let item of implementedModules">
              <li>
                <!-- Parent item -->
                <a
                  class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                         hover:bg-neutral-focus/50 transition-colors cursor-pointer"
                  [class.bg-primary/20]="isModuleActive(item)"
                  [class.text-primary]="isModuleActive(item)"
                  (click)="toggleModule(item)"
                  [attr.title]="sidebarCollapsed ? item.label : null"
                  [attr.aria-expanded]="isModuleExpanded(item)">
                  <span class="material-symbols-outlined text-xl">{{ item.icon }}</span>
                  <span
                    class="flex-1 whitespace-nowrap overflow-hidden transition-opacity duration-200"
                    [class.opacity-0]="sidebarCollapsed"
                    [class.hidden]="sidebarCollapsed">
                    {{ item.label }}
                  </span>
                  <span
                    class="material-symbols-outlined text-base transition-transform duration-200"
                    [class.hidden]="sidebarCollapsed"
                    [class.rotate-180]="isModuleExpanded(item)"
                    *ngIf="item.children && item.children.length > 1">
                    expand_more
                  </span>
                </a>

                <!-- Children sub-menu -->
                <ul
                  *ngIf="item.children && isModuleExpanded(item) && !sidebarCollapsed"
                  class="mt-0.5 mb-1">
                  <li *ngFor="let child of item.children">
                    <a
                      [routerLink]="child.routerLink"
                      routerLinkActive="bg-primary text-primary-content"
                      [routerLinkActiveOptions]="{ exact: true }"
                      class="flex items-center gap-2 pl-9 pr-3 py-1.5 text-xs rounded-lg
                             hover:bg-neutral-focus/50 transition-colors text-neutral-content/70">
                      <span class="material-symbols-outlined text-sm" *ngIf="child.icon">{{ child.icon }}</span>
                      <span *ngIf="!child.icon" class="w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                      {{ child.label }}
                    </a>
                  </li>
                </ul>
              </li>
            </ng-container>
          </ul>

          <!-- Divider -->
          <div class="border-t border-neutral-focus/20 my-2 mx-3"></div>

          <!-- COMING SOON section label -->
          <div
            class="text-[10px] uppercase tracking-widest text-neutral-content/40 px-4 py-1 mb-1"
            [class.hidden]="sidebarCollapsed">
            Coming Soon
          </div>

          <ul class="menu gap-0.5 px-2">
            <ng-container *ngFor="let item of placeholderModules">
              <li>
                <!-- Parent item -->
                <a
                  class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                         hover:bg-neutral-focus/50 transition-colors cursor-pointer opacity-60"
                  [class.bg-primary/20]="isModuleActive(item)"
                  [class.text-primary]="isModuleActive(item)"
                  [class.opacity-100]="isModuleActive(item)"
                  (click)="toggleModule(item)"
                  [attr.title]="sidebarCollapsed ? item.label : null"
                  [attr.aria-expanded]="isModuleExpanded(item)">
                  <span class="material-symbols-outlined text-xl">{{ item.icon }}</span>
                  <span
                    class="flex-1 whitespace-nowrap overflow-hidden transition-opacity duration-200"
                    [class.opacity-0]="sidebarCollapsed"
                    [class.hidden]="sidebarCollapsed">
                    {{ item.label }}
                  </span>
                  <span
                    class="material-symbols-outlined text-base transition-transform duration-200"
                    [class.hidden]="sidebarCollapsed"
                    [class.rotate-180]="isModuleExpanded(item)"
                    *ngIf="item.children && item.children.length > 1">
                    expand_more
                  </span>
                </a>

                <!-- Children sub-menu -->
                <ul
                  *ngIf="item.children && isModuleExpanded(item) && !sidebarCollapsed"
                  class="mt-0.5 mb-1">
                  <li *ngFor="let child of item.children">
                    <a
                      [routerLink]="child.routerLink"
                      routerLinkActive="bg-primary text-primary-content"
                      [routerLinkActiveOptions]="{ exact: true }"
                      class="flex items-center gap-2 pl-9 pr-3 py-1.5 text-xs rounded-lg
                             hover:bg-neutral-focus/50 transition-colors text-neutral-content/70">
                      <span class="material-symbols-outlined text-sm" *ngIf="child.icon">{{ child.icon }}</span>
                      <span *ngIf="!child.icon" class="w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                      {{ child.label }}
                    </a>
                  </li>
                </ul>
              </li>
            </ng-container>
          </ul>
        </nav>

        <!-- Collapse Toggle -->
        <div class="border-t border-neutral-focus/30 p-2">
          <button
            class="btn btn-ghost btn-sm w-full justify-center"
            (click)="toggleSidebar()"
            [attr.aria-label]="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
            <span class="material-symbols-outlined text-lg">
              {{ sidebarCollapsed ? 'chevron_right' : 'chevron_left' }}
            </span>
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex flex-col flex-1 overflow-hidden">
        <!-- Top Header -->
        <header class="flex items-center justify-between h-16 px-6 bg-base-100/80 backdrop-blur-sm border-b border-base-300/50 sticky top-0 z-10">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-semibold text-base-content tracking-tight">
              {{ currentPageTitle }}
            </h2>
          </div>

          <div class="flex items-center gap-2">
            <!-- Notifications Dropdown -->
            <div class="dropdown dropdown-end">
              <button tabindex="0" class="btn btn-ghost btn-circle btn-sm relative" aria-label="Notifications">
                <span class="material-symbols-outlined text-xl">notifications</span>
                <span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
              </button>
              <div tabindex="0" class="dropdown-content bg-base-100 rounded-xl z-50 w-80 shadow-xl border border-base-200 mt-2">
                <div class="p-3 border-b border-base-200">
                  <h3 class="text-sm font-semibold">Notifications</h3>
                </div>
                <div class="max-h-64 overflow-y-auto">
                  <div class="p-3 hover:bg-base-200/50 border-b border-base-200/50 cursor-pointer">
                    <p class="text-sm font-medium">New offer received</p>
                    <p class="text-xs text-base-content/50">Greenwich Site — £4.8M offer submitted</p>
                    <p class="text-xs text-base-content/40 mt-1">2 hours ago</p>
                  </div>
                  <div class="p-3 hover:bg-base-200/50 border-b border-base-200/50 cursor-pointer">
                    <p class="text-sm font-medium">DD check completed</p>
                    <p class="text-xs text-base-content/50">Environmental report ready for Battersea site</p>
                    <p class="text-xs text-base-content/40 mt-1">5 hours ago</p>
                  </div>
                  <div class="p-3 hover:bg-base-200/50 cursor-pointer">
                    <p class="text-sm font-medium">Approval required</p>
                    <p class="text-xs text-base-content/50">Investment committee review pending for £2.1M acquisition</p>
                    <p class="text-xs text-base-content/40 mt-1">1 day ago</p>
                  </div>
                </div>
                <div class="p-2 border-t border-base-200">
                  <button class="btn btn-ghost btn-sm btn-block text-xs">View All Notifications</button>
                </div>
              </div>
            </div>

            <!-- User Menu -->
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-2 pl-2 pr-3">
                <div class="avatar placeholder">
                  <div class="bg-primary text-primary-content rounded-full w-8 ring-2 ring-primary/20 ring-offset-2 ring-offset-base-100">
                    <span class="text-xs font-bold">JM</span>
                  </div>
                </div>
                <span class="text-sm font-medium text-base-content hidden sm:inline">John Mitchell</span>
                <span class="material-symbols-outlined text-xs text-base-content/50">expand_more</span>
              </div>
              <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-xl z-50 w-56 p-2 shadow-xl border border-base-200 mt-2">
                <li class="menu-title px-2 py-1">
                  <span class="text-xs text-base-content/50 uppercase tracking-wider">Account</span>
                </li>
                <li><a [routerLink]="'/profile'" class="text-sm rounded-lg">
                  <span class="material-symbols-outlined text-base">person</span>
                  My Profile
                </a></li>
                <li><a [routerLink]="'/settings'" class="text-sm rounded-lg">
                  <span class="material-symbols-outlined text-base">settings</span>
                  Settings
                </a></li>
                <li class="border-t border-base-200 mt-1 pt-1">
                  <a class="text-sm text-error rounded-lg" (click)="handleLogout()">
                    <span class="material-symbols-outlined text-base">logout</span>
                    Sign Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto bg-base-200">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <!-- Toast Notifications -->
    <app-toast-container></app-toast-container>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'BuildEstate Pro';
  sidebarCollapsed = false;

  /** Tracks which modules are expanded by routerLink key */
  expandedModules: Set<string> = new Set();

  private routerSub: Subscription | null = null;
  private currentUrl = '';

  /** Implemented modules with full sub-navigation */
  readonly implementedModules: INavItem[] = [
    {
      label: 'Land Acquisition',
      routerLink: '/land-acquisition',
      icon: 'terrain',
      section: 'implemented',
      children: [
        { label: 'Dashboard', routerLink: '/land-acquisition/dashboard', icon: 'dashboard' },
        { label: 'Pipeline', routerLink: '/land-acquisition/pipeline', icon: 'view_kanban' },
        { label: 'Opportunities', routerLink: '/land-acquisition/opportunities', icon: 'list' },
        { label: 'New Opportunity', routerLink: '/land-acquisition/opportunities/new', icon: 'add_circle' }
      ]
    },
    {
      label: 'Planning & Approvals',
      routerLink: '/planning-approvals',
      icon: 'assignment',
      section: 'implemented',
      children: [
        { label: 'Dashboard', routerLink: '/planning-approvals/dashboard', icon: 'dashboard' },
        { label: 'Applications', routerLink: '/planning-approvals/applications', icon: 'list' },
        { label: 'Pipeline', routerLink: '/planning-approvals/pipeline', icon: 'view_kanban' },
        { label: 'New Application', routerLink: '/planning-approvals/applications/create', icon: 'add_circle' }
      ]
    },
    {
      label: 'Legal & Compliance',
      routerLink: '/legal-compliance',
      icon: 'gavel',
      section: 'implemented',
      children: [
        { label: 'Dashboard', routerLink: '/legal-compliance/dashboard', icon: 'dashboard' },
        { label: 'Cases', routerLink: '/legal-compliance/cases', icon: 'work' },
        { label: 'New Case', routerLink: '/legal-compliance/cases/create', icon: 'add_circle' },
        { label: 'Contracts', routerLink: '/legal-compliance/contracts', icon: 'description' },
        { label: 'Compliance', routerLink: '/legal-compliance/compliance/checklist', icon: 'verified' },
        { label: 'Insurance', routerLink: '/legal-compliance/insurance', icon: 'shield' },
        { label: 'Audit Records', routerLink: '/legal-compliance/audit-records', icon: 'history' }
      ]
    }
  ];

  /** Placeholder modules — routes exist but no deep sub-pages yet */
  readonly placeholderModules: INavItem[] = [
    {
      label: 'Project Management',
      routerLink: '/project-management',
      icon: 'engineering',
      section: 'placeholder',
      children: [
        { label: 'Dashboard', routerLink: '/project-management', icon: 'dashboard' }
      ]
    },
    {
      label: 'Construction',
      routerLink: '/construction',
      icon: 'construction',
      section: 'placeholder',
      children: [
        { label: 'Dashboard', routerLink: '/construction', icon: 'dashboard' }
      ]
    },
    {
      label: 'Finance & Budget',
      routerLink: '/finance',
      icon: 'account_balance',
      section: 'placeholder',
      children: [
        { label: 'Dashboard', routerLink: '/finance', icon: 'dashboard' }
      ]
    },
    {
      label: 'Property Units',
      routerLink: '/property-units',
      icon: 'apartment',
      section: 'placeholder',
      children: [
        { label: 'Dashboard', routerLink: '/property-units', icon: 'dashboard' }
      ]
    },
    {
      label: 'Sales & Marketing',
      routerLink: '/sales',
      icon: 'storefront',
      section: 'placeholder',
      children: [
        { label: 'Dashboard', routerLink: '/sales', icon: 'dashboard' }
      ]
    },
    {
      label: 'Documents',
      routerLink: '/documents',
      icon: 'folder_open',
      section: 'placeholder',
      children: [
        { label: 'Dashboard', routerLink: '/documents', icon: 'dashboard' }
      ]
    },
    {
      label: 'Reports',
      routerLink: '/reports',
      icon: 'analytics',
      section: 'placeholder',
      children: [
        { label: 'Dashboard', routerLink: '/reports', icon: 'dashboard' }
      ]
    }
  ];

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    // Set initial URL and expand active module
    this.currentUrl = this.router.url;
    this.expandActiveModule();

    // Listen for route changes to auto-expand active module
    this.routerSub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;
        this.expandActiveModule();
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  get currentPageTitle(): string {
    const allModules = [...this.implementedModules, ...this.placeholderModules];
    const item = allModules.find(n => this.currentUrl.startsWith(n.routerLink));
    if (item) {
      // Check if there's an active child with a more specific label
      const activeChild = item.children?.find(c => this.currentUrl === c.routerLink);
      if (activeChild && activeChild.label !== 'Dashboard') {
        return `${item.label} — ${activeChild.label}`;
      }
      return item.label;
    }
    if (this.currentUrl.startsWith('/profile')) return 'Profile';
    if (this.currentUrl.startsWith('/settings')) return 'Settings';
    return 'Dashboard';
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleModule(item: INavItem): void {
    if (this.expandedModules.has(item.routerLink)) {
      this.expandedModules.delete(item.routerLink);
    } else {
      this.expandedModules.add(item.routerLink);
    }

    // If module has only one child (Dashboard), navigate to it directly
    if (item.children && item.children.length === 1) {
      this.router.navigate([item.children[0].routerLink]);
    }
  }

  isModuleExpanded(item: INavItem): boolean {
    return this.expandedModules.has(item.routerLink);
  }

  isModuleActive(item: INavItem): boolean {
    return this.currentUrl.startsWith(item.routerLink);
  }

  private readonly confirmDialog = inject(ConfirmDialogService);

  handleLogout(): void {
    this.confirmDialog.confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of BuildEstate Pro?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      confirmClass: 'btn-error',
      icon: 'logout',
      iconClass: 'text-error'
    }).then(confirmed => {
      if (confirmed) {
        this.router.navigate(['/']);
      }
    });
  }

  /** Auto-expand the module that matches the current URL */
  private expandActiveModule(): void {
    const allModules = [...this.implementedModules, ...this.placeholderModules];
    for (const item of allModules) {
      if (this.currentUrl.startsWith(item.routerLink)) {
        this.expandedModules.add(item.routerLink);
        return;
      }
    }
  }
}
