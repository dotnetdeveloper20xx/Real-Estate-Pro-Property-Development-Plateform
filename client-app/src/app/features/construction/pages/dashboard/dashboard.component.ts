import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface IConstructionStage {
  readonly site: string;
  readonly phase: string;
  readonly progress: number;
  readonly status: 'On Track' | 'Delayed' | 'Completed' | 'At Risk';
  readonly nextMilestone: string;
  readonly dueDate: string;
}

@Component({
  selector: 'app-construction-dashboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
          <h1 class="text-2xl font-bold text-base-content">Construction Management</h1>
          <p class="text-sm text-base-content/60 mt-1">Track site progress, milestones, inspections, and snagging items</p>
        </div>
        <button class="btn btn-primary gap-2">
          <span class="material-symbols-outlined text-lg">add</span>
          Log Progress
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Active Sites</p>
                <p class="text-2xl font-bold text-base-content mt-1">3</p>
              </div>
              <div class="bg-primary/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-primary">construction</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Milestones Due</p>
                <p class="text-2xl font-bold text-warning mt-1">7</p>
              </div>
              <div class="bg-warning/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-warning">flag</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Inspections Pending</p>
                <p class="text-2xl font-bold text-info mt-1">4</p>
              </div>
              <div class="bg-info/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-info">fact_check</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Snagging Items</p>
                <p class="text-2xl font-bold text-error mt-1">12</p>
              </div>
              <div class="bg-error/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-error">report_problem</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Construction Stages Table -->
      <div class="card bg-base-100 shadow-sm border border-base-300">
        <div class="card-body p-0">
          <div class="flex items-center justify-between p-4 border-b border-base-300">
            <h2 class="text-lg font-semibold text-base-content">Construction Progress</h2>
            <div class="flex gap-2">
              <input type="text" placeholder="Search sites..." class="input input-bordered input-sm w-60" />
              <button class="btn btn-ghost btn-sm">
                <span class="material-symbols-outlined text-lg">filter_list</span>
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr class="bg-base-200/50">
                  <th>Site</th>
                  <th>Phase</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Next Milestone</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let stage of stages" class="hover:bg-base-200/30">
                  <td class="font-medium">{{ stage.site }}</td>
                  <td>{{ stage.phase }}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <progress class="progress w-20"
                        [ngClass]="{
                          'progress-success': stage.progress >= 75,
                          'progress-primary': stage.progress >= 40 && stage.progress < 75,
                          'progress-warning': stage.progress < 40
                        }"
                        [value]="stage.progress" max="100"></progress>
                      <span class="text-xs font-medium">{{ stage.progress }}%</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-sm"
                      [ngClass]="{
                        'badge-success': stage.status === 'On Track',
                        'badge-error': stage.status === 'Delayed',
                        'badge-ghost': stage.status === 'Completed',
                        'badge-warning': stage.status === 'At Risk'
                      }">
                      {{ stage.status }}
                    </span>
                  </td>
                  <td class="text-sm">{{ stage.nextMilestone }}</td>
                  <td class="text-sm text-base-content/70">{{ stage.dueDate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConstructionDashboardComponent {
  readonly stages: readonly IConstructionStage[] = [
    { site: 'Greenwich Waterfront', phase: 'Frame & Superstructure', progress: 65, status: 'On Track', nextMilestone: 'Roof completion Block A', dueDate: '15 Feb 2025' },
    { site: 'Greenwich Waterfront', phase: 'First Fix — Block B', progress: 30, status: 'On Track', nextMilestone: 'Electrical rough-in', dueDate: '28 Feb 2025' },
    { site: 'Battersea Phase 1', phase: 'Groundworks & Foundations', progress: 85, status: 'On Track', nextMilestone: 'Foundation sign-off', dueDate: '10 Jan 2025' },
    { site: 'Battersea Phase 1', phase: 'Piling Works', progress: 100, status: 'Completed', nextMilestone: '—', dueDate: 'Completed' },
    { site: 'Birmingham Mixed Use', phase: 'Second Fix & Fit-Out', progress: 45, status: 'Delayed', nextMilestone: 'Kitchen installations', dueDate: '20 Jan 2025' },
    { site: 'Birmingham Mixed Use', phase: 'External Works', progress: 20, status: 'At Risk', nextMilestone: 'Landscaping start', dueDate: '01 Mar 2025' },
    { site: 'Manchester Northern Quarter', phase: 'Demolition & Site Prep', progress: 90, status: 'On Track', nextMilestone: 'Site clearance complete', dueDate: '05 Jan 2025' },
    { site: 'Manchester Northern Quarter', phase: 'Roofing', progress: 0, status: 'On Track', nextMilestone: 'Roof truss delivery', dueDate: '15 Apr 2025' }
  ];
}
