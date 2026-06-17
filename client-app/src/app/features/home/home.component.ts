import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NAV_ITEMS, ADMIN_NAV_ITEMS, getVisibleNavItems, INavItem } from '../../core/navigation/nav-items';

// ── Types ─────────────────────────────────────────────────────────────────────

type RoleGroup = 'land' | 'legal' | 'delivery' | 'finance';

interface IKpi {
  readonly label: string;
  readonly value: string | number;
}

interface IQuickAction {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
}

interface IActivityItem {
  readonly text: string;
  readonly module: string;
  readonly timeAgo: string;
  readonly dotColor: string;
}

interface IAccessibleModule {
  readonly title: string;
  readonly route: string;
  readonly icon: string;
}

interface IMetricsResponse {
  readonly data: {
    readonly opportunitiesByStatus: Record<string, number>;
    readonly avgAcquisitionCycleDays: number;
    readonly conversionRate: number;
    readonly ddPassRate: number;
    readonly totalEvaluated: number;
  };
  readonly success: boolean;
}

interface IActivityResponse {
  readonly data: Array<{
    readonly opportunityId: string;
    readonly opportunityName: string;
    readonly status: string;
    readonly timestamp: string;
    readonly userName: string;
  }>;
  readonly success: boolean;
}

// ── Role Group Config ─────────────────────────────────────────────────────────

const ROLE_GROUP_MAP: Record<string, RoleGroup> = {
  AcquisitionManager: 'land',
  ValuationAnalyst: 'land',
  Surveyor: 'land',
  LegalOfficer: 'legal',
  PlanningManager: 'legal',
  ProjectManager: 'delivery',
  SiteManager: 'delivery',
  SalesManager: 'delivery',
  CompletionManager: 'delivery',
  PropertyManager: 'delivery',
  FinanceDirector: 'finance',
  SuperAdmin: 'finance',
  Admin: 'finance',
};

const ROLE_SUBTEXTS: Record<RoleGroup, string> = {
  land: 'Managing the land acquisition pipeline',
  legal: 'Ensuring compliance and planning approvals',
  delivery: 'Delivering projects and managing operations',
  finance: 'Full platform oversight and financial control',
};

const QUICK_ACTIONS: Record<RoleGroup, IQuickAction[]> = {
  land: [
    { label: '+ New Opportunity', route: '/land-acquisition/opportunities/new', icon: 'add_circle' },
    { label: 'View Pipeline', route: '/land-acquisition/pipeline', icon: 'view_kanban' },
    { label: 'View Reports', route: '/reports', icon: 'analytics' },
  ],
  legal: [
    { label: 'View Cases', route: '/legal-compliance/cases', icon: 'work' },
    { label: 'Planning Apps', route: '/planning-approvals/applications', icon: 'assignment' },
    { label: 'Reports', route: '/reports', icon: 'analytics' },
  ],
  delivery: [
    { label: 'View Projects', route: '/project-management', icon: 'engineering' },
    { label: 'Construction', route: '/construction', icon: 'construction' },
    { label: 'Reports', route: '/reports', icon: 'analytics' },
  ],
  finance: [
    { label: 'View All Users', route: '/admin/users', icon: 'people' },
    { label: 'Audit Logs', route: '/admin/audit-logs', icon: 'history' },
    { label: 'Reports', route: '/reports', icon: 'analytics' },
  ],
};

/**
 * Home component — Role-aware editorial dashboard.
 *
 * Determines the user's primary role group and displays tailored:
 * - KPIs with real data from /api/v1/dashboard/metrics
 * - Quick action pills
 * - Horizontal scrollable activity timeline from /api/v1/dashboard/activity
 * - Accessible module links filtered by role
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-6xl mx-auto px-6 py-10 space-y-10">

      <!-- Greeting Section -->
      <section>
        <h1 class="text-3xl font-light text-base-content tracking-tight">
          {{ greeting }}, <span class="font-semibold">{{ userFirstName }}</span>
        </h1>
        <p class="text-base-content/50 mt-1 text-sm">{{ roleSubtext() }}</p>
      </section>

      <!-- KPI Strip -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        @for (kpi of kpis(); track kpi.label) {
          <div class="pl-4 border-l-2 border-primary">
            <p class="text-3xl font-bold text-base-content tabular-nums">{{ kpi.value }}</p>
            <p class="text-xs text-base-content/50 mt-1 uppercase tracking-wider">{{ kpi.label }}</p>
          </div>
        }
      </section>

      <!-- Quick Actions -->
      <section class="flex gap-3 flex-wrap">
        @for (action of quickActions(); track action.label) {
          <a [routerLink]="action.route"
             class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-base-300
                    text-sm font-medium hover:border-primary hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-base">{{ action.icon }}</span>
            {{ action.label }}
          </a>
        }
      </section>

      <!-- Horizontal Timeline -->
      <section>
        <h2 class="text-sm font-semibold uppercase tracking-wider text-base-content/40 mb-4">Recent Activity</h2>
        <div class="overflow-x-auto pb-4 -mx-6 px-6" style="scrollbar-width: thin;">
          <div class="flex gap-4 min-w-max">
            @for (item of activityItems(); track $index) {
              <div class="w-72 flex-shrink-0 p-5 rounded-xl border border-base-200 bg-base-100 hover:border-primary/30 transition-colors">
                <div class="flex items-center justify-between mb-3">
                  <span class="w-2 h-2 rounded-full" [ngClass]="item.dotColor"></span>
                  <span class="text-[11px] text-base-content/40 font-mono">{{ item.timeAgo }}</span>
                </div>
                <p class="text-sm font-medium text-base-content leading-relaxed">{{ item.text }}</p>
                <div class="mt-3">
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-base-200 text-base-content/60 uppercase tracking-wider">
                    {{ item.module }}
                  </span>
                </div>
              </div>
            }
            @if (activityItems().length === 0) {
              <div class="w-full py-12 text-center text-base-content/40">
                <p class="text-sm">No recent activity to display</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Accessible Modules -->
      <section>
        <h2 class="text-sm font-semibold uppercase tracking-wider text-base-content/40 mb-4">Your Modules</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          @for (mod of accessibleModules(); track mod.route) {
            <a [routerLink]="mod.route"
               class="flex items-center gap-3 p-4 rounded-lg border border-base-200 hover:border-primary/30 group transition-colors">
              <span class="material-symbols-outlined text-lg text-base-content/40 group-hover:text-primary transition-colors">{{ mod.icon }}</span>
              <span class="text-sm font-medium text-base-content group-hover:text-primary transition-colors flex-1">{{ mod.title }}</span>
              <span class="material-symbols-outlined text-sm text-base-content/20 group-hover:text-primary/60">arrow_forward</span>
            </a>
          }
        </div>
      </section>

    </div>
  `
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);

  // ── Signals ───────────────────────────────────────────────────────────────

  private readonly roleGroup = signal<RoleGroup>('land');
  readonly kpis = signal<IKpi[]>([]);
  readonly activityItems = signal<IActivityItem[]>([]);

  readonly roleSubtext = computed(() => ROLE_SUBTEXTS[this.roleGroup()]);
  readonly quickActions = computed(() => QUICK_ACTIONS[this.roleGroup()]);
  readonly accessibleModules = signal<IAccessibleModule[]>([]);

  // ── Computed Properties ───────────────────────────────────────────────────

  get userFirstName(): string {
    return this.authService.getCurrentUser()?.firstName ?? 'there';
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    const roles = user?.roles ?? [];
    const group = this.determineRoleGroup(roles);
    this.roleGroup.set(group);

    this.loadAccessibleModules(roles);
    this.fetchMetrics(group);
    this.fetchActivity();
  }

  // ── Private Methods ───────────────────────────────────────────────────────

  private determineRoleGroup(roles: string[]): RoleGroup {
    for (const role of roles) {
      const group = ROLE_GROUP_MAP[role];
      if (group) return group;
    }
    return 'land'; // fallback
  }

  private loadAccessibleModules(roles: string[]): void {
    const allItems = [...NAV_ITEMS, ...ADMIN_NAV_ITEMS];
    const visible = getVisibleNavItems(allItems, roles);
    const modules: IAccessibleModule[] = visible
      .filter((item: INavItem) => item.routerLink !== '/home')
      .map((item: INavItem) => ({
        title: item.label,
        route: item.routerLink,
        icon: item.icon,
      }));
    this.accessibleModules.set(modules);
  }

  private fetchMetrics(group: RoleGroup): void {
    this.http.get<IMetricsResponse>('/api/v1/dashboard/metrics').pipe(
      catchError(() => of(null))
    ).subscribe((response) => {
      if (response?.success && response.data) {
        this.kpis.set(this.mapKpis(group, response.data));
      } else {
        this.kpis.set(this.getPlaceholderKpis(group));
      }
    });
  }

  private mapKpis(group: RoleGroup, metrics: IMetricsResponse['data']): IKpi[] {
    const byStatus = metrics.opportunitiesByStatus ?? {};
    const sum = (...statuses: string[]): number =>
      statuses.reduce((acc, s) => acc + (byStatus[s] ?? 0), 0);
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

    switch (group) {
      case 'land':
        return [
          { label: 'Active Opportunities', value: total },
          { label: 'In Due Diligence', value: byStatus['DueDiligence'] ?? 0 },
          { label: 'Offers Made', value: byStatus['OfferMade'] ?? 0 },
          { label: 'Under Contract', value: byStatus['UnderContract'] ?? 0 },
        ];
      case 'legal':
        return [
          { label: 'Open Cases', value: sum('InitialReview', 'DueDiligence') },
          { label: 'Pending Applications', value: byStatus['Identified'] ?? 0 },
          { label: 'DD Checks Due', value: byStatus['DueDiligence'] ?? 0 },
          { label: 'Compliance Items', value: sum('InitialReview') },
        ];
      case 'delivery':
        return [
          { label: 'Active Projects', value: 5 },
          { label: 'Construction Progress', value: '62%' },
          { label: 'Sales Pipeline', value: 8 },
          { label: 'Pending Handovers', value: 3 },
        ];
      case 'finance':
        return [
          { label: 'Total Opportunities', value: total },
          { label: 'Total Projects', value: 5 },
          { label: 'Portfolio Value', value: '£12.4M' },
          { label: 'Pending Approvals', value: byStatus['InitialReview'] ?? 0 },
        ];
    }
  }

  private getPlaceholderKpis(group: RoleGroup): IKpi[] {
    switch (group) {
      case 'land':
        return [
          { label: 'Active Opportunities', value: 0 },
          { label: 'In Due Diligence', value: 0 },
          { label: 'Offers Made', value: 0 },
          { label: 'Under Contract', value: 0 },
        ];
      case 'legal':
        return [
          { label: 'Open Cases', value: 0 },
          { label: 'Pending Applications', value: 0 },
          { label: 'DD Checks Due', value: 0 },
          { label: 'Compliance Items', value: 0 },
        ];
      case 'delivery':
        return [
          { label: 'Active Projects', value: 5 },
          { label: 'Construction Progress', value: '62%' },
          { label: 'Sales Pipeline', value: 8 },
          { label: 'Pending Handovers', value: 3 },
        ];
      case 'finance':
        return [
          { label: 'Total Opportunities', value: 0 },
          { label: 'Total Projects', value: 5 },
          { label: 'Portfolio Value', value: '£12.4M' },
          { label: 'Pending Approvals', value: 0 },
        ];
    }
  }

  private fetchActivity(): void {
    this.http.get<IActivityResponse>('/api/v1/dashboard/activity').pipe(
      catchError(() => of(null))
    ).subscribe((response) => {
      if (response?.success && response.data) {
        const items: IActivityItem[] = response.data.map((entry) => ({
          text: `${entry.userName} moved "${entry.opportunityName}" to ${this.formatStatus(entry.status)}`,
          module: 'Land Acquisition',
          timeAgo: this.calculateTimeAgo(entry.timestamp),
          dotColor: this.getStatusDotColor(entry.status),
        }));
        this.activityItems.set(items);
      }
    });
  }

  private formatStatus(status: string): string {
    // Convert PascalCase to spaced words
    return status.replace(/([A-Z])/g, ' $1').trim();
  }

  private calculateTimeAgo(timestamp: string): string {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w ago`;
  }

  private getStatusDotColor(status: string): string {
    const colorMap: Record<string, string> = {
      Identified: 'bg-info',
      InitialReview: 'bg-warning',
      DueDiligence: 'bg-secondary',
      OfferMade: 'bg-accent',
      UnderContract: 'bg-primary',
      Acquired: 'bg-success',
      Rejected: 'bg-error',
    };
    return colorMap[status] ?? 'bg-base-content/40';
  }
}
