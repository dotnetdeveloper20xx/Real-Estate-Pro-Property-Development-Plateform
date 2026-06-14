import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface IReportCategory {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly count: number;
  readonly lastGenerated: string;
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      animation: fade-in 0.3s ease-out;
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .kpi-card {
      animation: slide-up 0.4s ease-out backwards;
    }
    .kpi-card:nth-child(1) { animation-delay: 0ms; }
    .kpi-card:nth-child(2) { animation-delay: 80ms; }
    .kpi-card:nth-child(3) { animation-delay: 160ms; }
    .kpi-card:nth-child(4) { animation-delay: 240ms; }
  `],
  template: `
    <div class="p-6 space-y-6">
      <!-- Under Development Banner -->
      <div class="alert alert-info">
        <span class="material-symbols-outlined">info</span>
        <span>This module is under development. Displaying sample data for demonstration purposes.</span>
      </div>

      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">Reports & Analytics</h1>
          <p class="text-sm text-base-content/60 mt-1">Generate executive dashboards, financial reports, and operational insights</p>
        </div>
        <button class="btn btn-primary gap-2">
          <span class="material-symbols-outlined text-lg">add</span>
          Custom Report
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Generated This Month</p>
                <p class="text-2xl font-bold text-base-content mt-1">8</p>
              </div>
              <div class="bg-primary/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-primary">analytics</span>
              </div>
            </div>
          </div>
        </div>

        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Scheduled</p>
                <p class="text-2xl font-bold text-info mt-1">3</p>
              </div>
              <div class="bg-info/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-info">schedule</span>
              </div>
            </div>
          </div>
        </div>

        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Custom Reports</p>
                <p class="text-2xl font-bold text-warning mt-1">5</p>
              </div>
              <div class="bg-warning/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-warning">tune</span>
              </div>
            </div>
          </div>
        </div>

        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Export Queue</p>
                <p class="text-2xl font-bold text-success mt-1">0</p>
              </div>
              <div class="bg-success/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-success">download_done</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Report Categories Grid -->
      <div>
        <h2 class="text-lg font-semibold text-base-content mb-4">Report Categories</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div *ngFor="let report of reportCategories" class="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow">
            <div class="card-body p-5">
              <div class="flex items-start gap-4">
                <div class="bg-primary/10 p-3 rounded-lg">
                  <span class="material-symbols-outlined text-primary text-2xl">{{ report.icon }}</span>
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-base-content">{{ report.title }}</h3>
                  <p class="text-sm text-base-content/60 mt-1">{{ report.description }}</p>
                  <div class="flex items-center justify-between mt-3">
                    <span class="text-xs text-base-content/50">{{ report.count }} reports · Last: {{ report.lastGenerated }}</span>
                  </div>
                </div>
              </div>
              <div class="card-actions justify-end mt-3">
                <button class="btn btn-primary btn-sm gap-1">
                  <span class="material-symbols-outlined text-sm">play_arrow</span>
                  Generate
                </button>
                <button class="btn btn-ghost btn-sm gap-1">
                  <span class="material-symbols-outlined text-sm">history</span>
                  History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsDashboardComponent {
  readonly reportCategories: readonly IReportCategory[] = [
    { icon: 'summarize', title: 'Executive Summary', description: 'High-level portfolio overview for board and stakeholders', count: 12, lastGenerated: '2 days ago' },
    { icon: 'account_balance', title: 'Financial Reports', description: 'Budget tracking, cash flow, profitability, and cost analysis', count: 24, lastGenerated: '1 day ago' },
    { icon: 'construction', title: 'Construction Progress', description: 'Site progress, milestones, delays, and completion forecasts', count: 18, lastGenerated: '3 days ago' },
    { icon: 'storefront', title: 'Sales Performance', description: 'Pipeline analysis, conversion rates, and revenue projections', count: 15, lastGenerated: 'Today' },
    { icon: 'gavel', title: 'Compliance Reports', description: 'Regulatory compliance status, audit trails, and risk flags', count: 8, lastGenerated: '1 week ago' },
    { icon: 'warning', title: 'Risk Register', description: 'Active risks, mitigation status, and risk heat maps', count: 6, lastGenerated: '4 days ago' }
  ];
}
