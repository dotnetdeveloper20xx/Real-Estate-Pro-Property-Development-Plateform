import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription, filter } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { DashboardActions, selectMetrics, selectDashboardLoading } from '../../store/dashboard';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { IDashboardMetrics } from '../../models/dashboard.model';

Chart.register(...registerables);

/**
 * Dashboard container page for the Land Acquisition module.
 * Renders a comprehensive dashboard with:
 * - Row 1: 4 KPI cards with trend indicators
 * - Row 2: Pipeline donut chart, Pipeline bar chart, Alerts
 * - Row 3: Recent Activity timeline, Top Opportunities, Activity by Type donut
 * - Footer: Real-time data timestamp
 */
@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, KpiCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-in {
      opacity: 0;
      animation: slideUp 0.5s ease-out forwards;
    }
    .delay-1 { animation-delay: 100ms; }
    .delay-2 { animation-delay: 200ms; }
    .delay-3 { animation-delay: 300ms; }
    .delay-4 { animation-delay: 400ms; }
    .delay-5 { animation-delay: 500ms; }
    .delay-6 { animation-delay: 600ms; }
    .donut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      pointer-events: none;
    }
    .timeline-line {
      position: absolute;
      left: 15px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: oklch(var(--b3));
    }
    .timeline-dot {
      position: absolute;
      left: 10px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: oklch(var(--p));
      border: 2px solid oklch(var(--b1));
      z-index: 1;
    }
  `],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-bold text-base-content">Land Acquisition Dashboard</h1>
        <p class="text-sm text-base-content/60">
          Real-time overview of acquisition pipeline, performance metrics, and alerts.
        </p>
      </div>

      <!-- Loading State -->
      <ng-container *ngIf="loading$ | async">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div *ngFor="let i of [1,2,3,4]" class="card bg-base-100 border border-base-200">
            <div class="card-body p-5 animate-pulse">
              <div class="h-4 w-28 bg-base-300 rounded mb-2"></div>
              <div class="h-8 w-20 bg-base-300 rounded"></div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Dashboard Content -->
      <ng-container *ngIf="metrics$ | async as metrics">

        <!-- ROW 1: KPI Cards -->
        <section aria-label="Key Performance Indicators"
                 class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="animate-in delay-1">
            <app-kpi-card
              label="Avg. Acquisition Cycle"
              [value]="formatCycleDays(metrics.averageAcquisitionCycleDays)"
              icon="schedule"
              [trend]="{ direction: 'neutral', value: 'vs last 30 days' }">
            </app-kpi-card>
          </div>
          <div class="animate-in delay-2">
            <app-kpi-card
              label="Total Evaluated"
              [value]="metrics.totalEvaluated.toString()"
              icon="assignment_turned_in"
              [trend]="{ direction: 'up', value: 'vs last 30 days' }">
            </app-kpi-card>
          </div>
          <div class="animate-in delay-3">
            <app-kpi-card
              label="Conversion Rate"
              [value]="formatPercent(metrics.conversionRatePercent)"
              icon="trending_up"
              [trend]="{ direction: 'up', value: 'vs last 30 days' }">
            </app-kpi-card>
          </div>
          <div class="animate-in delay-4">
            <app-kpi-card
              label="DD Pass Rate"
              [value]="formatPercent(metrics.dueDiligencePassRatePercent)"
              icon="verified"
              [trend]="{ direction: 'neutral', value: 'vs last 30 days' }">
            </app-kpi-card>
          </div>
        </section>

        <!-- ROW 2: Pipeline Summary + Pipeline Bar Chart + Alerts -->
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Pipeline and Alerts">

          <!-- Pipeline Summary (Donut) -->
          <div class="card bg-base-100 border border-base-200 animate-in delay-5">
            <div class="card-body p-5">
              <h2 class="text-lg font-semibold text-base-content mb-4">Pipeline Summary</h2>
              <div class="relative flex justify-center">
                <canvas #pipelineDonutCanvas width="220" height="220"></canvas>
                <div class="donut-center">
                  <span class="text-2xl font-bold text-base-content">{{ getPipelineTotal(metrics) }}</span>
                  <br/>
                  <span class="text-xs text-base-content/60">Total</span>
                </div>
              </div>
              <!-- Legend -->
              <div class="mt-4 grid grid-cols-2 gap-2">
                <div *ngFor="let status of pipelineStatuses"
                     class="flex items-center gap-2 text-xs text-base-content/80">
                  <span class="w-3 h-3 rounded-full shrink-0"
                        [style.background]="getStatusColor(status)"></span>
                  <span>{{ formatStatusLabel(status) }} ({{ getStatusCount(metrics, status) }})</span>
                </div>
              </div>
              <a routerLink="/land-acquisition/pipeline" class="text-sm text-primary mt-3 inline-block hover:underline cursor-pointer">
                View full pipeline →
              </a>
            </div>
          </div>

          <!-- Pipeline by Status (Bar Chart) -->
          <div class="card bg-base-100 border border-base-200 animate-in delay-5">
            <div class="card-body p-5">
              <h2 class="text-lg font-semibold text-base-content mb-4">Pipeline by Status</h2>
              <div class="flex justify-center">
                <canvas #pipelineBarCanvas width="300" height="220"></canvas>
              </div>
              <a routerLink="/land-acquisition/opportunities" class="text-sm text-primary mt-3 inline-block hover:underline cursor-pointer">
                View detailed analytics →
              </a>
            </div>
          </div>

          <!-- Alerts -->
          <div class="card bg-base-100 border border-base-200 h-full animate-in delay-5">
            <div class="card-body p-5">
              <h2 class="text-lg font-semibold text-base-content mb-4">
                <span class="material-symbols-outlined text-warning align-middle mr-1">notifications_active</span>
                Alerts
              </h2>
              <div class="space-y-3">
                <!-- Offers Expiring Soon -->
                <div class="flex items-start gap-3 p-3 rounded-lg border-l-4 border-l-warning bg-warning/5">
                  <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-warning/10">
                    <span class="material-symbols-outlined text-warning text-lg">timer</span>
                  </div>
                  <div class="flex flex-col flex-1">
                    <span class="text-sm font-medium text-base-content">Offers Expiring Soon</span>
                    <span class="text-xs text-base-content/60">Expiring within 7 days</span>
                  </div>
                  <span class="badge badge-warning badge-lg font-bold">{{ metrics.offersExpiringSoon }}</span>
                </div>

                <!-- Overdue Due Diligence -->
                <div class="flex items-start gap-3 p-3 rounded-lg border-l-4 border-l-error bg-error/5">
                  <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-error/10">
                    <span class="material-symbols-outlined text-error text-lg">warning</span>
                  </div>
                  <div class="flex flex-col flex-1">
                    <span class="text-sm font-medium text-base-content">Overdue Due Diligence</span>
                    <span class="text-xs text-base-content/60">Past expected completion</span>
                  </div>
                  <span class="badge badge-error badge-lg font-bold">{{ metrics.overdueDueDiligence }}</span>
                </div>

                <!-- Approvals Pending -->
                <div class="flex items-start gap-3 p-3 rounded-lg border-l-4 border-l-info bg-info/5">
                  <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-info/10">
                    <span class="material-symbols-outlined text-info text-lg">pending_actions</span>
                  </div>
                  <div class="flex flex-col flex-1">
                    <span class="text-sm font-medium text-base-content">Approvals Pending</span>
                    <span class="text-xs text-base-content/60">Awaiting review</span>
                  </div>
                  <span class="badge badge-info badge-lg font-bold">{{ metrics.approvalsPending }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ROW 3: Recent Activity + Top Opportunities + Activity by Type -->
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Activity and Opportunities">

          <!-- Recent Activity Timeline -->
          <div class="card bg-base-100 border border-base-200 animate-in delay-6">
            <div class="card-body p-5">
              <h2 class="text-lg font-semibold text-base-content mb-4">Recent Activity</h2>
              <div class="relative pl-8 space-y-4" *ngIf="metrics.recentActivity.length > 0">
                <div class="timeline-line"></div>
                <div *ngFor="let item of metrics.recentActivity; let i = index"
                     class="relative">
                  <div class="timeline-dot" [style.top.px]="4"></div>
                  <div class="ml-4">
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="text-xs text-base-content/50">{{ formatTimestamp(item.timestamp) }}</span>
                      <span class="badge badge-xs badge-primary">{{ formatStatusLabel(item.status) }}</span>
                    </div>
                    <p class="text-sm font-medium text-base-content">{{ item.opportunityName }}</p>
                    <p class="text-xs text-base-content/60">Status changed by {{ item.userName }}</p>
                  </div>
                </div>
              </div>
              <div *ngIf="metrics.recentActivity.length === 0"
                   class="flex flex-col items-center py-8 text-base-content/50">
                <span class="material-symbols-outlined text-3xl mb-2">history</span>
                <p class="text-sm">No recent activity.</p>
              </div>
              <a routerLink="/land-acquisition/opportunities" class="text-sm text-primary mt-3 inline-block hover:underline cursor-pointer">
                View all activity →
              </a>
            </div>
          </div>

          <!-- Top Opportunities -->
          <div class="card bg-base-100 border border-base-200 animate-in delay-6">
            <div class="card-body p-5">
              <h2 class="text-lg font-semibold text-base-content mb-4">Top Opportunities</h2>
              <div class="space-y-3" *ngIf="metrics.topOpportunities.length > 0">
                <div *ngFor="let opp of metrics.topOpportunities; let i = index"
                     class="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200/50 transition-colors">
                  <span class="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                    {{ i + 1 }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-base-content truncate">{{ opp.name }}</p>
                    <p class="text-xs text-base-content/60 truncate">{{ opp.location }}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-sm font-semibold text-base-content">{{ formatCurrency(opp.estimatedValue) }}</p>
                    <span class="badge badge-xs"
                          [ngClass]="getStatusBadgeClass(opp.status)">
                      {{ formatStatusLabel(opp.status) }}
                    </span>
                  </div>
                </div>
              </div>
              <div *ngIf="metrics.topOpportunities.length === 0"
                   class="flex flex-col items-center py-8 text-base-content/50">
                <span class="material-symbols-outlined text-3xl mb-2">leaderboard</span>
                <p class="text-sm">No opportunities with feasibility data.</p>
              </div>
              <a routerLink="/land-acquisition/opportunities" class="text-sm text-primary mt-3 inline-block hover:underline cursor-pointer">
                View all opportunities →
              </a>
            </div>
          </div>

          <!-- Activity by Type (Donut) -->
          <div class="card bg-base-100 border border-base-200 animate-in delay-6">
            <div class="card-body p-5">
              <h2 class="text-lg font-semibold text-base-content mb-4">Activity by Type (30 Days)</h2>
              <div class="relative flex justify-center">
                <canvas #activityDonutCanvas width="220" height="220"></canvas>
                <div class="donut-center">
                  <span class="text-2xl font-bold text-base-content">{{ getActivityTotal(metrics) }}</span>
                  <br/>
                  <span class="text-xs text-base-content/60">Total</span>
                </div>
              </div>
              <!-- Legend -->
              <div class="mt-4 grid grid-cols-2 gap-2">
                <div *ngFor="let entry of getActivityEntries(metrics)"
                     class="flex items-center gap-2 text-xs text-base-content/80">
                  <span class="w-3 h-3 rounded-full shrink-0"
                        [style.background]="entry.color"></span>
                  <span>{{ entry.label }} ({{ entry.count }})</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer class="text-center text-xs text-base-content/50 py-4 border-t border-base-200">
          All data is real-time and automatically updated. Last updated: Today at {{ currentTime }}
        </footer>
      </ng-container>
    </div>
  `
})
export class DashboardPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly store = inject(Store);
  private subscription: Subscription | null = null;

  private pipelineDonutChart: Chart | null = null;
  private pipelineBarChart: Chart | null = null;
  private activityDonutChart: Chart | null = null;

  @ViewChild('pipelineDonutCanvas') pipelineDonutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pipelineBarCanvas') pipelineBarCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('activityDonutCanvas') activityDonutCanvas!: ElementRef<HTMLCanvasElement>;

  readonly metrics$: Observable<IDashboardMetrics | null> = this.store.select(selectMetrics);
  readonly loading$: Observable<boolean> = this.store.select(selectDashboardLoading);

  readonly pipelineStatuses = [
    'Identified', 'InitialReview', 'DueDiligence', 'OfferMade',
    'UnderContract', 'Acquired', 'Withdrawn'
  ];

  private readonly statusColors: Record<string, string> = {
    'Identified': '#3B82F6',
    'InitialReview': '#8B5CF6',
    'DueDiligence': '#F59E0B',
    'OfferMade': '#10B981',
    'UnderContract': '#6366F1',
    'Acquired': '#22C55E',
    'Withdrawn': '#EF4444'
  };

  private readonly activityColors: Record<string, string> = {
    'Due Diligence': '#F59E0B',
    'Offers': '#10B981',
    'Documents': '#6366F1',
    'Opportunities': '#3B82F6',
    'Approvals': '#8B5CF6',
    'Other': '#94A3B8'
  };

  currentTime = '';

  ngOnInit(): void {
    this.store.dispatch(DashboardActions.loadMetrics());
    this.updateTime();
  }

  ngAfterViewInit(): void {
    this.subscription = this.metrics$.pipe(
      filter((m): m is IDashboardMetrics => m !== null)
    ).subscribe((metrics) => {
      this.renderPipelineDonut(metrics);
      this.renderPipelineBar(metrics);
      this.renderActivityDonut(metrics);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.pipelineDonutChart?.destroy();
    this.pipelineBarChart?.destroy();
    this.activityDonutChart?.destroy();
  }

  // ─── Chart Rendering ─────────────────────────────────────────────────

  private renderPipelineDonut(metrics: IDashboardMetrics): void {
    if (!this.pipelineDonutCanvas) return;
    this.pipelineDonutChart?.destroy();

    const labels = this.pipelineStatuses.map(s => this.formatStatusLabel(s));
    const data = this.pipelineStatuses.map(s => metrics.opportunitiesByStatus[s] ?? 0);
    const colors = this.pipelineStatuses.map(s => this.statusColors[s]);

    this.pipelineDonutChart = new Chart(this.pipelineDonutCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: false,
        cutout: '65%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  private renderPipelineBar(metrics: IDashboardMetrics): void {
    if (!this.pipelineBarCanvas) return;
    this.pipelineBarChart?.destroy();

    const labels = this.pipelineStatuses.map(s => this.formatStatusLabel(s));
    const data = this.pipelineStatuses.map(s => metrics.opportunitiesByStatus[s] ?? 0);
    const colors = this.pipelineStatuses.map(s => this.statusColors[s]);

    this.pipelineBarChart = new Chart(this.pipelineBarCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderRadius: 4,
          barThickness: 28
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { font: { size: 10 } },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 10 } },
            grid: { color: 'rgba(0,0,0,0.05)' }
          }
        }
      }
    });
  }

  private renderActivityDonut(metrics: IDashboardMetrics): void {
    if (!this.activityDonutCanvas) return;
    this.activityDonutChart?.destroy();

    const entries = this.getActivityEntries(metrics);
    const labels = entries.map(e => e.label);
    const data = entries.map(e => e.count);
    const colors = entries.map(e => e.color);

    this.activityDonutChart = new Chart(this.activityDonutCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: false,
        cutout: '65%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // ─── Template Helpers ────────────────────────────────────────────────

  formatCycleDays(days: number): string {
    return `${Math.round(days)} days`;
  }

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatCurrency(value: number): string {
    if (value >= 1_000_000) {
      return `£${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `£${(value / 1_000).toFixed(0)}K`;
    }
    return `£${value.toFixed(0)}`;
  }

  formatStatusLabel(status: string): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }

  getStatusColor(status: string): string {
    return this.statusColors[status] ?? '#94A3B8';
  }

  getStatusCount(metrics: IDashboardMetrics, status: string): number {
    return metrics.opportunitiesByStatus[status] ?? 0;
  }

  getPipelineTotal(metrics: IDashboardMetrics): number {
    return Object.values(metrics.opportunitiesByStatus)
      .reduce((sum, count) => sum + count, 0);
  }

  getActivityTotal(metrics: IDashboardMetrics): number {
    return Object.values(metrics.activityByType)
      .reduce((sum, count) => sum + count, 0);
  }

  getActivityEntries(metrics: IDashboardMetrics): Array<{ label: string; count: number; color: string }> {
    return Object.entries(metrics.activityByType).map(([label, count]) => ({
      label,
      count,
      color: this.activityColors[label] ?? '#94A3B8'
    }));
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Identified': return 'badge-info';
      case 'InitialReview': return 'badge-secondary';
      case 'DueDiligence': return 'badge-warning';
      case 'OfferMade': return 'badge-success';
      case 'UnderContract': return 'badge-primary';
      case 'Acquired': return 'badge-success';
      case 'Withdrawn': return 'badge-error';
      default: return 'badge-ghost';
    }
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}
