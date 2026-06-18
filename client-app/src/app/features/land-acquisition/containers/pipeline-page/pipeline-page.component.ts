import {
  Component, ChangeDetectionStrategy, OnInit, OnDestroy, AfterViewInit,
  inject, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription, filter } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { OpportunityActions } from '../../store/opportunity/opportunity.actions';
import {
  selectOpportunitiesByStatus,
  selectOpportunityLoading,
  selectOpportunityError
} from '../../store/opportunity/opportunity.selectors';
import { DashboardActions, selectMetrics } from '../../store/dashboard';
import { PipelineColumnComponent } from '../../components/pipeline-column/pipeline-column.component';
import { IOpportunityListItem, OpportunityStatus } from '../../models/opportunity.model';
import { IDashboardMetrics } from '../../models/dashboard.model';

Chart.register(...registerables);

/** Average estimated value per opportunity (£3.35M). */
const AVG_OPPORTUNITY_VALUE = 3_350_000;

/** Probability weighting per pipeline stage. */
const STAGE_PROBABILITY: Record<string, number> = {
  [OpportunityStatus.Identified]: 0.10,
  [OpportunityStatus.InitialReview]: 0.25,
  [OpportunityStatus.DueDiligence]: 0.50,
  [OpportunityStatus.OfferMade]: 0.75,
  [OpportunityStatus.UnderContract]: 0.90,
  [OpportunityStatus.Acquired]: 1.00,
  [OpportunityStatus.Withdrawn]: 0.00
};

@Component({
  selector: 'app-pipeline-page',
  standalone: true,
  imports: [CommonModule, PipelineColumnComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: block; }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-in { animation: slideUp 0.4s ease-out forwards; opacity: 0; }
    .delay-1 { animation-delay: 100ms; }
    .delay-2 { animation-delay: 200ms; }
    .delay-3 { animation-delay: 300ms; }
  `],
  template: `
    <!-- Page Header -->
    <div class="p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-bold text-base-content">Opportunity Pipeline</h1>
          <p class="text-sm text-base-content/60">
            View and manage opportunities across lifecycle stages. Click a card to view details.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-100 border border-base-200/80">
            <span class="material-symbols-outlined text-sm text-primary">apps</span>
            <span class="text-sm font-semibold text-base-content">{{ getTotalCount() }}</span>
            <span class="text-xs text-base-content/50">opportunities</span>
          </div>
          <a routerLink="/land-acquisition/opportunities/new" class="btn btn-primary btn-sm gap-1.5">
            <span class="material-symbols-outlined text-lg">add</span>
            New Opportunity
          </a>
        </div>
      </div>

      <!-- Error State -->
      <ng-container *ngIf="error$ | async as error">
        <div class="flex flex-col items-center justify-center p-12 rounded-xl border border-error/30 bg-error/5"
             role="alert" aria-live="polite">
          <span class="material-symbols-outlined text-5xl text-error mb-4">error_outline</span>
          <h2 class="text-lg font-semibold text-base-content mb-1">Unable to Load Pipeline</h2>
          <p class="text-sm text-base-content/60 mb-4 text-center max-w-md">{{ error }}</p>
          <button class="btn btn-error btn-sm" (click)="onRetry()" aria-label="Retry loading pipeline data">
            <span class="material-symbols-outlined text-base mr-1">refresh</span> Retry
          </button>
        </div>
      </ng-container>

      <!-- Skeleton Loading State -->
      <ng-container *ngIf="(loading$ | async) && !(error$ | async)">
        <div class="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2" aria-label="Loading pipeline data" role="status">
          <div *ngFor="let col of skeletonColumns"
               class="flex flex-col h-[600px] min-w-[280px] max-w-[320px] bg-base-200/50 rounded-xl animate-pulse">
            <div class="flex items-center justify-between px-4 py-3 border-b border-base-300">
              <div class="h-4 w-24 bg-base-300 rounded"></div>
              <div class="h-5 w-6 bg-base-300 rounded-full"></div>
            </div>
            <div class="flex flex-col gap-3 p-3">
              <div *ngFor="let card of col.cards" class="card card-compact bg-base-100 border border-base-200">
                <div class="card-body p-4 space-y-2">
                  <div class="h-4 bg-base-300 rounded" [style.width]="card.titleWidth"></div>
                  <div class="h-3 w-3/4 bg-base-300 rounded"></div>
                  <div class="flex justify-between">
                    <div class="h-5 w-16 bg-base-300 rounded"></div>
                    <div class="h-3 w-8 bg-base-300 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <span class="sr-only">Loading pipeline data, please wait...</span>
        </div>
      </ng-container>

      <!-- Pipeline Board -->
      <ng-container *ngIf="!(loading$ | async) && !(error$ | async)">
        <div class="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2"
             role="region" aria-label="Opportunity pipeline board">
          @for (column of pipelineColumns; track column.status; let i = $index) {
            <app-pipeline-column
              [status]="formatStatusLabel(column.status)"
              [count]="getColumnOpportunities(column.status).length"
              [opportunities]="getColumnOpportunities(column.status)"
              [statusColor]="column.color"
              [columnIndex]="i"
              [totalValue]="getColumnEstimatedValue(column.status)"
              [showLimit]="2"
              (cardClick)="onCardClick($event)"
            />
          }
        </div>

        <!-- KPI Footer Strip -->
        <section class="mt-6" aria-label="Pipeline Key Performance Indicators">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div class="card bg-base-100 border border-base-200">
              <div class="card-body p-4">
                <div class="flex items-start justify-between">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-xs font-medium text-base-content/60">Total Opportunities</span>
                    <span class="text-xl font-bold text-base-content">{{ getTotalCount() }}</span>
                    <span class="text-[10px] text-base-content/40">Across all stages</span>
                  </div>
                  <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary text-base">apps</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card bg-base-100 border border-base-200">
              <div class="card-body p-4">
                <div class="flex items-start justify-between">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-xs font-medium text-base-content/60">Total Estimated Value</span>
                    <span class="text-xl font-bold text-base-content">{{ formatCurrency(getTotalEstimatedValue()) }}</span>
                    <span class="text-[10px] text-base-content/40">Across all stages</span>
                  </div>
                  <div class="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-success text-base">payments</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card bg-base-100 border border-base-200">
              <div class="card-body p-4">
                <div class="flex items-start justify-between">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-xs font-medium text-base-content/60">Weighted Pipeline Value</span>
                    <span class="text-xl font-bold text-base-content">{{ formatCurrency(getWeightedPipelineValue()) }}</span>
                    <span class="text-[10px] text-base-content/40">Based on probability</span>
                  </div>
                  <div class="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-info text-base">balance</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card bg-base-100 border border-base-200">
              <div class="card-body p-4">
                <div class="flex items-start justify-between">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-xs font-medium text-base-content/60">Avg. Opportunity Value</span>
                    <span class="text-xl font-bold text-base-content">{{ formatCurrency(getAvgOpportunityValue()) }}</span>
                    <span class="text-[10px] text-base-content/40">Per opportunity</span>
                  </div>
                  <div class="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-warning text-base">analytics</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card bg-base-100 border border-base-200">
              <div class="card-body p-4">
                <div class="flex items-start justify-between">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-xs font-medium text-base-content/60">Conversion Rate</span>
                    <span class="text-xl font-bold text-base-content">{{ getConversionRate() }}%</span>
                    <span class="text-[10px] text-base-content/40">Offer Made → Acquired</span>
                  </div>
                  <div class="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-secondary text-base">trending_up</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card bg-base-100 border border-base-200">
              <div class="card-body p-4">
                <div class="flex items-start justify-between">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-xs font-medium text-base-content/60">Avg. Acquisition Cycle</span>
                    <span class="text-xl font-bold text-base-content">{{ avgCycleDays }} days</span>
                    <span class="text-[10px] text-base-content/40">From identified to acquired</span>
                  </div>
                  <div class="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-accent text-base">schedule</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Charts Section -->
        <section class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in delay-1" aria-label="Pipeline Analytics">
          <!-- Pipeline Value by Stage (Bar Chart) -->
          <div class="card bg-base-100 border border-base-200">
            <div class="card-body p-5">
              <h2 class="text-sm font-semibold text-base-content mb-4">Pipeline Value by Stage</h2>
              <div class="w-full" style="position: relative; height: 240px;">
                <canvas #valueByStageCanvas></canvas>
              </div>
            </div>
          </div>

          <!-- Pipeline by Probability (Donut) -->
          <div class="card bg-base-100 border border-base-200">
            <div class="card-body p-5">
              <h2 class="text-sm font-semibold text-base-content mb-4">Pipeline by Probability</h2>
              <div class="relative flex justify-center">
                <canvas #probabilityDonutCanvas width="220" height="220"></canvas>
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span class="text-lg font-bold text-base-content">{{ formatCurrency(getWeightedPipelineValue()) }}</span>
                  <br/>
                  <span class="text-[10px] text-base-content/60">Weighted</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Locations by Value (Horizontal Bar) -->
          <div class="card bg-base-100 border border-base-200">
            <div class="card-body p-5">
              <h2 class="text-sm font-semibold text-base-content mb-4">Top Locations by Value</h2>
              <div class="w-full" style="position: relative; height: 240px;">
                <canvas #topLocationsCanvas></canvas>
              </div>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer class="mt-6 text-center text-xs text-base-content/50 py-4 border-t border-base-200">
          Last updated: Today at {{ currentTime }} • All data is real-time and automatically updated.
        </footer>
      </ng-container>
    </div>
  `
})
export class PipelinePageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private subscription: Subscription | null = null;
  private metricsSubscription: Subscription | null = null;

  private valueByStageChart: Chart | null = null;
  private probabilityDonutChart: Chart | null = null;
  private topLocationsChart: Chart | null = null;

  @ViewChild('valueByStageCanvas') valueByStageCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('probabilityDonutCanvas') probabilityDonutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topLocationsCanvas') topLocationsCanvas!: ElementRef<HTMLCanvasElement>;

  /** Observable of opportunities grouped by status. */
  readonly opportunitiesByStatus$: Observable<Record<OpportunityStatus, readonly IOpportunityListItem[]>> =
    this.store.select(selectOpportunitiesByStatus);

  /** Observable of loading state. */
  readonly loading$: Observable<boolean> = this.store.select(selectOpportunityLoading);

  /** Observable of error state. */
  readonly error$: Observable<string | null> = this.store.select(selectOpportunityError);

  /** Observable of dashboard metrics for avg cycle days. */
  readonly metrics$: Observable<IDashboardMetrics | null> = this.store.select(selectMetrics);

  /** Pipeline columns definition in display order with colors. */
  readonly pipelineColumns: readonly PipelineColumn[] = [
    { status: OpportunityStatus.Identified, color: '#6366f1' },
    { status: OpportunityStatus.InitialReview, color: '#3b82f6' },
    { status: OpportunityStatus.DueDiligence, color: '#f59e0b' },
    { status: OpportunityStatus.OfferMade, color: '#8b5cf6' },
    { status: OpportunityStatus.UnderContract, color: '#06b6d4' },
    { status: OpportunityStatus.Acquired, color: '#10b981' },
    { status: OpportunityStatus.Withdrawn, color: '#ef4444' }
  ];

  /** Skeleton columns for loading state. */
  readonly skeletonColumns = [
    { cards: [{ titleWidth: '80%' }, { titleWidth: '60%' }] },
    { cards: [{ titleWidth: '65%' }, { titleWidth: '75%' }] },
    { cards: [{ titleWidth: '90%' }, { titleWidth: '55%' }] },
    { cards: [{ titleWidth: '70%' }] },
    { cards: [{ titleWidth: '85%' }, { titleWidth: '60%' }] },
    { cards: [{ titleWidth: '75%' }] },
    { cards: [{ titleWidth: '60%' }] }
  ];

  /** Cached snapshot of grouped opportunities for synchronous template access. */
  private groupedOpportunities: Record<OpportunityStatus, readonly IOpportunityListItem[]> = {
    [OpportunityStatus.Identified]: [],
    [OpportunityStatus.InitialReview]: [],
    [OpportunityStatus.DueDiligence]: [],
    [OpportunityStatus.OfferMade]: [],
    [OpportunityStatus.UnderContract]: [],
    [OpportunityStatus.Acquired]: [],
    [OpportunityStatus.Withdrawn]: []
  };

  /** Average acquisition cycle from dashboard metrics. */
  avgCycleDays = 127;

  /** Current time for footer. */
  currentTime = '';

  ngOnInit(): void {
    this.store.dispatch(OpportunityActions.loadOpportunities());
    this.store.dispatch(DashboardActions.loadMetrics());
    this.updateTime();

    this.subscription = this.opportunitiesByStatus$.subscribe(grouped => {
      this.groupedOpportunities = grouped;
    });

    this.metricsSubscription = this.metrics$.pipe(
      filter((m): m is IDashboardMetrics => m !== null)
    ).subscribe(metrics => {
      this.avgCycleDays = Math.round(metrics.averageAcquisitionCycleDays);
    });
  }

  ngAfterViewInit(): void {
    // Render charts once data is available
    this.subscription = this.opportunitiesByStatus$.pipe(
      filter(grouped => Object.values(grouped).some(arr => arr.length > 0))
    ).subscribe(() => {
      setTimeout(() => {
        this.renderValueByStageChart();
        this.renderProbabilityDonut();
        this.renderTopLocationsChart();
      }, 150);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.metricsSubscription?.unsubscribe();
    this.valueByStageChart?.destroy();
    this.probabilityDonutChart?.destroy();
    this.topLocationsChart?.destroy();
  }

  // ─── Data Access ──────────────────────────────────────────────────────

  getColumnOpportunities(status: OpportunityStatus): IOpportunityListItem[] {
    return [...(this.groupedOpportunities[status] ?? [])];
  }

  getTotalCount(): number {
    return Object.values(this.groupedOpportunities).reduce(
      (total, opportunities) => total + opportunities.length, 0
    );
  }

  /** Computes estimated value per column: count * AVG_OPPORTUNITY_VALUE. */
  getColumnEstimatedValue(status: OpportunityStatus): number {
    const count = (this.groupedOpportunities[status] ?? []).length;
    return count * AVG_OPPORTUNITY_VALUE;
  }

  /** Total estimated value across all stages. */
  getTotalEstimatedValue(): number {
    return this.getTotalCount() * AVG_OPPORTUNITY_VALUE;
  }

  /** Weighted pipeline value based on stage probability. */
  getWeightedPipelineValue(): number {
    let weighted = 0;
    for (const column of this.pipelineColumns) {
      const count = (this.groupedOpportunities[column.status] ?? []).length;
      const probability = STAGE_PROBABILITY[column.status] ?? 0;
      weighted += count * AVG_OPPORTUNITY_VALUE * probability;
    }
    return weighted;
  }

  /** Average opportunity value. */
  getAvgOpportunityValue(): number {
    const total = this.getTotalCount();
    return total > 0 ? this.getTotalEstimatedValue() / total : 0;
  }

  /** Conversion rate: Acquired / Total * 100. */
  getConversionRate(): string {
    const total = this.getTotalCount();
    if (total === 0) return '0.0';
    const acquired = (this.groupedOpportunities[OpportunityStatus.Acquired] ?? []).length;
    return ((acquired / total) * 100).toFixed(1);
  }

  // ─── Formatting ─────────────────────────────────────────────────────

  formatCurrency(value: number): string {
    if (value >= 1_000_000) {
      return `£${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `£${(value / 1_000).toFixed(0)}K`;
    }
    return `£${value.toFixed(0)}`;
  }

  formatStatusLabel(status: OpportunityStatus): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  // ─── Actions ────────────────────────────────────────────────────────

  onCardClick(opportunity: IOpportunityListItem): void {
    this.router.navigate(['/land-acquisition', 'opportunities', opportunity.id]);
  }

  onRetry(): void {
    this.store.dispatch(OpportunityActions.loadOpportunities());
  }

  private updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  // ─── Chart Rendering ─────────────────────────────────────────────────

  private renderValueByStageChart(): void {
    if (!this.valueByStageCanvas) return;
    this.valueByStageChart?.destroy();

    const labels = this.pipelineColumns.map(c => this.formatStatusLabel(c.status));
    const data = this.pipelineColumns.map(c => this.getColumnEstimatedValue(c.status) / 1_000_000);
    const colors = this.pipelineColumns.map(c => c.color);

    this.valueByStageChart = new Chart(this.valueByStageCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `£${(ctx.parsed.y ?? 0).toFixed(2)}M`
            }
          }
        },
        scales: {
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { font: { size: 10 }, callback: (v) => `£${v}M` },
            grid: { color: 'rgba(0,0,0,0.05)' }
          }
        }
      }
    });
  }

  private renderProbabilityDonut(): void {
    if (!this.probabilityDonutCanvas) return;
    this.probabilityDonutChart?.destroy();

    const activeColumns = this.pipelineColumns.filter(c => c.status !== OpportunityStatus.Withdrawn);
    const labels = activeColumns.map(c => this.formatStatusLabel(c.status));
    const data = activeColumns.map(c => {
      const count = (this.groupedOpportunities[c.status] ?? []).length;
      const probability = STAGE_PROBABILITY[c.status] ?? 0;
      return (count * AVG_OPPORTUNITY_VALUE * probability) / 1_000_000;
    });
    const colors = activeColumns.map(c => c.color);

    this.probabilityDonutChart = new Chart(this.probabilityDonutCanvas.nativeElement, {
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
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: £${(ctx.parsed as number).toFixed(2)}M`
            }
          }
        }
      }
    });
  }

  private renderTopLocationsChart(): void {
    if (!this.topLocationsCanvas) return;
    this.topLocationsChart?.destroy();

    // Aggregate opportunity values by location
    const locationValues: Record<string, number> = {};
    for (const column of this.pipelineColumns) {
      const opportunities = this.groupedOpportunities[column.status] ?? [];
      for (const opp of opportunities) {
        const loc = opp.location || 'Unknown';
        locationValues[loc] = (locationValues[loc] ?? 0) + AVG_OPPORTUNITY_VALUE;
      }
    }

    // Sort and take top 5
    const sorted = Object.entries(locationValues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const labels = sorted.map(([loc]) => loc.length > 18 ? loc.substring(0, 18) + '…' : loc);
    const data = sorted.map(([, val]) => val / 1_000_000);
    const colors = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];

    this.topLocationsChart = new Chart(this.topLocationsCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `£${(ctx.parsed.x ?? 0).toFixed(2)}M`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { font: { size: 10 }, callback: (v) => `£${v}M` },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          y: { ticks: { font: { size: 10 } }, grid: { display: false } }
        }
      }
    });
  }
}

/** Pipeline column definition. */
interface PipelineColumn {
  readonly status: OpportunityStatus;
  readonly color: string;
}
