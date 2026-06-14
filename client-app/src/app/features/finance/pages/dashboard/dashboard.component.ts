import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface IBudgetLine {
  readonly project: string;
  readonly category: string;
  readonly budget: string;
  readonly actual: string;
  readonly variance: string;
  readonly varianceType: 'over' | 'under' | 'on-budget';
  readonly percentUsed: number;
}

@Component({
  selector: 'app-finance-dashboard',
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
          <h1 class="text-2xl font-bold text-base-content">Finance & Budget Control</h1>
          <p class="text-sm text-base-content/60 mt-1">Budget planning, cost tracking, cash flow, and financial oversight</p>
        </div>
        <button class="btn btn-primary gap-2">
          <span class="material-symbols-outlined text-lg">add</span>
          Record Transaction
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Total Budget</p>
                <p class="text-2xl font-bold text-base-content mt-1">£41.8M</p>
              </div>
              <div class="bg-primary/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-primary">account_balance</span>
              </div>
            </div>
          </div>
        </div>

        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Committed</p>
                <p class="text-2xl font-bold text-info mt-1">£28.2M</p>
              </div>
              <div class="bg-info/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-info">payments</span>
              </div>
            </div>
          </div>
        </div>

        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Variance</p>
                <p class="text-2xl font-bold text-error mt-1">-£320K</p>
              </div>
              <div class="bg-error/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-error">trending_down</span>
              </div>
            </div>
          </div>
        </div>

        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Cash Flow</p>
                <p class="text-2xl font-bold text-success mt-1">£4.1M</p>
              </div>
              <div class="bg-success/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-success">account_balance_wallet</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Budget Lines Table -->
      <div class="card bg-base-100 shadow-sm border border-base-300">
        <div class="card-body p-0">
          <div class="flex items-center justify-between p-4 border-b border-base-300">
            <h2 class="text-lg font-semibold text-base-content">Budget Summary</h2>
            <div class="flex gap-2">
              <input type="text" placeholder="Search budget lines..." class="input input-bordered input-sm w-60" />
              <button class="btn btn-ghost btn-sm">
                <span class="material-symbols-outlined text-lg">filter_list</span>
              </button>
              <button class="btn btn-ghost btn-sm">
                <span class="material-symbols-outlined text-lg">download</span>
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr class="bg-base-200/50">
                  <th>Project</th>
                  <th>Category</th>
                  <th class="text-right">Budget</th>
                  <th class="text-right">Actual</th>
                  <th class="text-right">Variance</th>
                  <th>% Used</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let line of budgetLines" class="hover:bg-base-200/30">
                  <td class="font-medium">{{ line.project }}</td>
                  <td>{{ line.category }}</td>
                  <td class="text-right font-mono text-sm">{{ line.budget }}</td>
                  <td class="text-right font-mono text-sm">{{ line.actual }}</td>
                  <td class="text-right font-mono text-sm">
                    <span [ngClass]="{
                      'text-error': line.varianceType === 'over',
                      'text-success': line.varianceType === 'under',
                      'text-base-content': line.varianceType === 'on-budget'
                    }">
                      {{ line.variance }}
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <progress class="progress w-16"
                        [ngClass]="{
                          'progress-error': line.percentUsed > 100,
                          'progress-warning': line.percentUsed > 85 && line.percentUsed <= 100,
                          'progress-primary': line.percentUsed <= 85
                        }"
                        [value]="line.percentUsed" max="100"></progress>
                      <span class="text-xs font-medium">{{ line.percentUsed }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FinanceDashboardComponent {
  readonly budgetLines: readonly IBudgetLine[] = [
    { project: 'Greenwich Waterfront', category: 'Land Costs', budget: '£6,200,000', actual: '£6,200,000', variance: '£0', varianceType: 'on-budget', percentUsed: 100 },
    { project: 'Greenwich Waterfront', category: 'Construction', budget: '£9,800,000', actual: '£10,120,000', variance: '-£320,000', varianceType: 'over', percentUsed: 103 },
    { project: 'Greenwich Waterfront', category: 'Professional Fees', budget: '£1,450,000', actual: '£1,280,000', variance: '+£170,000', varianceType: 'under', percentUsed: 88 },
    { project: 'Battersea Phase 1', category: 'Land Costs', budget: '£4,100,000', actual: '£4,100,000', variance: '£0', varianceType: 'on-budget', percentUsed: 100 },
    { project: 'Battersea Phase 1', category: 'Construction', budget: '£6,500,000', actual: '£4,200,000', variance: '+£2,300,000', varianceType: 'under', percentUsed: 65 },
    { project: 'Battersea Phase 1', category: 'Contingency', budget: '£850,000', actual: '£120,000', variance: '+£730,000', varianceType: 'under', percentUsed: 14 },
    { project: 'Birmingham Mixed Use', category: 'Construction', budget: '£14,200,000', actual: '£12,800,000', variance: '+£1,400,000', varianceType: 'under', percentUsed: 90 },
    { project: 'Birmingham Mixed Use', category: 'Sales & Marketing', budget: '£680,000', actual: '£540,000', variance: '+£140,000', varianceType: 'under', percentUsed: 79 }
  ];
}
