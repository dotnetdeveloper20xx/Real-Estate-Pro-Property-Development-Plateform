import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Navigation module card data for the quick access grid.
 */
interface IModuleCard {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly route: string;
  readonly implemented: boolean;
}

/**
 * Recent activity feed item.
 */
interface IActivityItem {
  readonly icon: string;
  readonly iconClass: string;
  readonly text: string;
  readonly time: string;
}

/**
 * Quick stat card data.
 */
interface IStatCard {
  readonly label: string;
  readonly value: number;
  readonly icon: string;
  readonly iconBg: string;
}

/**
 * Home component — Executive dashboard / landing page.
 *
 * Provides a high-level overview of the platform with:
 * - Time-based greeting
 * - Cross-module metrics
 * - Quick navigation to modules
 * - Recent activity feed
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 space-y-8" style="animation: fade-in 0.4s ease-out">
      <!-- Welcome Banner -->
      <div class="card bg-gradient-to-r from-primary to-secondary text-primary-content"
           style="animation: slide-up 0.4s ease-out backwards">
        <div class="card-body">
          <h1 class="text-2xl font-bold">{{ greeting }}, John</h1>
          <p class="text-primary-content/80">Here's what's happening across your portfolio today.</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
           style="animation: slide-up 0.4s ease-out 0.1s backwards">
        <div *ngFor="let stat of stats"
             class="card bg-base-100 border border-base-200/80">
          <div class="card-body flex-row items-center gap-4 p-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" [class]="stat.iconBg">
              <span class="material-symbols-outlined text-2xl text-white">{{ stat.icon }}</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-base-content">{{ stat.value }}</p>
              <p class="text-xs text-base-content/60">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Navigation -->
      <div style="animation: slide-up 0.4s ease-out 0.2s backwards">
        <h2 class="text-lg font-semibold mb-4">Quick Access</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a *ngFor="let module of modules"
             [routerLink]="module.route"
             class="card bg-base-100 border border-base-200/80 hover:border-primary/30 cursor-pointer group">
            <div class="card-body p-5">
              <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-2xl text-primary/80 group-hover:text-primary transition-colors">
                  {{ module.icon }}
                </span>
                <div class="flex-1">
                  <h3 class="font-semibold text-sm text-base-content group-hover:text-primary transition-colors">
                    {{ module.title }}
                  </h3>
                  <p class="text-xs text-base-content/60 mt-1">{{ module.description }}</p>
                </div>
                <span class="material-symbols-outlined text-base text-base-content/30 group-hover:text-primary/60 transition-colors">
                  arrow_forward
                </span>
              </div>
              <div *ngIf="!module.implemented" class="mt-2">
                <span class="badge badge-ghost badge-xs">Coming Soon</span>
              </div>
            </div>
          </a>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card bg-base-100 border border-base-200/80"
           style="animation: slide-up 0.4s ease-out 0.3s backwards">
        <div class="card-body">
          <h2 class="text-lg font-semibold mb-4">Recent Activity</h2>
          <div class="space-y-4">
            <div *ngFor="let activity of recentActivity"
                 class="flex items-start gap-3 pb-3 border-b border-base-200/60 last:border-0 last:pb-0">
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" [class]="activity.iconClass">
                <span class="material-symbols-outlined text-sm text-white">{{ activity.icon }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-base-content">{{ activity.text }}</p>
                <p class="text-xs text-base-content/50 mt-0.5">{{ activity.time }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent {
  /** Time-based greeting */
  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  /** Cross-module quick stats */
  readonly stats: IStatCard[] = [
    { label: 'Total Projects', value: 5, icon: 'engineering', iconBg: 'bg-primary' },
    { label: 'Active Opportunities', value: 10, icon: 'terrain', iconBg: 'bg-secondary' },
    { label: 'Open Legal Cases', value: 4, icon: 'gavel', iconBg: 'bg-warning' },
    { label: 'Pending Approvals', value: 3, icon: 'pending_actions', iconBg: 'bg-accent' }
  ];

  /** Module navigation cards */
  readonly modules: IModuleCard[] = [
    {
      title: 'Land Acquisition',
      description: 'Manage land opportunities, pipeline and due diligence',
      icon: 'terrain',
      route: '/land-acquisition',
      implemented: true
    },
    {
      title: 'Planning & Approvals',
      description: 'Track planning applications and council approvals',
      icon: 'assignment',
      route: '/planning-approvals',
      implemented: true
    },
    {
      title: 'Legal & Compliance',
      description: 'Contracts, cases, compliance checks and audit trail',
      icon: 'gavel',
      route: '/legal-compliance',
      implemented: true
    },
    {
      title: 'Project Management',
      description: 'Plan milestones, timelines and resource allocation',
      icon: 'engineering',
      route: '/project-management',
      implemented: false
    },
    {
      title: 'Construction',
      description: 'Track build stages, inspections and handover',
      icon: 'construction',
      route: '/construction',
      implemented: false
    },
    {
      title: 'Finance & Budget',
      description: 'Budget planning, cost tracking and cash flow',
      icon: 'account_balance',
      route: '/finance',
      implemented: false
    }
  ];

  /** Recent activity feed */
  readonly recentActivity: IActivityItem[] = [
    {
      icon: 'add_circle',
      iconClass: 'bg-primary',
      text: 'New opportunity "Riverside Plot" added to pipeline',
      time: '10 minutes ago'
    },
    {
      icon: 'check_circle',
      iconClass: 'bg-success',
      text: 'Planning application PA-2024-003 approved by council',
      time: '1 hour ago'
    },
    {
      icon: 'gavel',
      iconClass: 'bg-warning',
      text: 'Legal case LC-045 requires review — due diligence pending',
      time: '3 hours ago'
    },
    {
      icon: 'swap_horiz',
      iconClass: 'bg-secondary',
      text: 'Opportunity "Elm Street Site" moved to Under Contract',
      time: '5 hours ago'
    },
    {
      icon: 'description',
      iconClass: 'bg-info',
      text: 'Contract uploaded for "Maple Avenue Development"',
      time: 'Yesterday'
    }
  ];
}
