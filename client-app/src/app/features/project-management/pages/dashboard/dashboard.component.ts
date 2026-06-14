import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface IProject {
  readonly name: string;
  readonly status: 'Active' | 'Planning' | 'Completed' | 'On Hold';
  readonly budget: string;
  readonly timeline: string;
  readonly manager: string;
  readonly completion: number;
}

@Component({
  selector: 'app-project-management-dashboard',
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
          <h1 class="text-2xl font-bold text-base-content">Project Management</h1>
          <p class="text-sm text-base-content/60 mt-1">Manage projects, milestones, timelines, and resources</p>
        </div>
        <button class="btn btn-primary gap-2">
          <span class="material-symbols-outlined text-lg">add</span>
          New Project
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Active Projects</p>
                <p class="text-2xl font-bold text-base-content mt-1">5</p>
              </div>
              <div class="bg-primary/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-primary">engineering</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">On Track</p>
                <p class="text-2xl font-bold text-success mt-1">3</p>
              </div>
              <div class="bg-success/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-success">check_circle</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">At Risk</p>
                <p class="text-2xl font-bold text-warning mt-1">1</p>
              </div>
              <div class="bg-warning/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-warning">warning</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Budget Variance</p>
                <p class="text-2xl font-bold text-info mt-1">4.2%</p>
              </div>
              <div class="bg-info/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-info">trending_up</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Projects Table -->
      <div class="card bg-base-100 shadow-sm border border-base-300">
        <div class="card-body p-0">
          <div class="flex items-center justify-between p-4 border-b border-base-300">
            <h2 class="text-lg font-semibold text-base-content">Projects Overview</h2>
            <div class="flex gap-2">
              <input type="text" placeholder="Search projects..." class="input input-bordered input-sm w-60" />
              <button class="btn btn-ghost btn-sm">
                <span class="material-symbols-outlined text-lg">filter_list</span>
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr class="bg-base-200/50">
                  <th>Project Name</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Timeline</th>
                  <th>Manager</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let project of projects" class="hover:bg-base-200/30">
                  <td class="font-medium">{{ project.name }}</td>
                  <td>
                    <span class="badge badge-sm"
                      [ngClass]="{
                        'badge-success': project.status === 'Active',
                        'badge-info': project.status === 'Planning',
                        'badge-ghost': project.status === 'Completed',
                        'badge-warning': project.status === 'On Hold'
                      }">
                      {{ project.status }}
                    </span>
                  </td>
                  <td>{{ project.budget }}</td>
                  <td class="text-sm text-base-content/70">{{ project.timeline }}</td>
                  <td>{{ project.manager }}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <progress class="progress progress-primary w-16" [value]="project.completion" max="100"></progress>
                      <span class="text-xs text-base-content/60">{{ project.completion }}%</span>
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
export class ProjectManagementDashboardComponent {
  readonly projects: readonly IProject[] = [
    { name: 'Greenwich Waterfront 150 Units', status: 'Active', budget: '£18.5M', timeline: 'Jan 2024 – Dec 2025', manager: 'James Mitchell', completion: 42 },
    { name: 'Battersea Apartments Phase 1', status: 'Active', budget: '£12.3M', timeline: 'Mar 2024 – Sep 2025', manager: 'Sarah Williams', completion: 28 },
    { name: 'Manchester Northern Quarter', status: 'Planning', budget: '£8.7M', timeline: 'Q3 2024 – Q4 2025', manager: 'David Thompson', completion: 12 },
    { name: 'Birmingham City Centre Mixed Use', status: 'Active', budget: '£22.1M', timeline: 'Jun 2023 – Mar 2025', manager: 'Emma Richards', completion: 68 },
    { name: 'Leeds Waterfront Development', status: 'On Hold', budget: '£15.8M', timeline: 'TBC', manager: 'Robert Clarke', completion: 5 },
    { name: 'Bristol Harbourside Residences', status: 'Completed', budget: '£9.4M', timeline: 'Jan 2022 – Nov 2023', manager: 'Helen Foster', completion: 100 }
  ];
}
