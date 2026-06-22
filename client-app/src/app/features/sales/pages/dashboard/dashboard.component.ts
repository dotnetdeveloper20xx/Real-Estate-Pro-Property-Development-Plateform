import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent, IBadgeMapEntry } from '../../../../shared/design-system';

interface ISalesPipeline {
  readonly buyer: string;
  readonly unit: string;
  readonly status: 'Lead' | 'Viewing' | 'Reserved' | 'Exchanged' | 'Complete';
  readonly value: string;
  readonly solicitor: string;
  readonly lastActivity: string;
}

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
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
          <h1 class="text-2xl font-bold text-base-content">Sales & Marketing</h1>
          <p class="text-sm text-base-content/60 mt-1">Manage leads, viewings, reservations, and sales pipeline</p>
        </div>
        <button class="btn btn-primary gap-2">
          <span class="material-symbols-outlined text-lg">add</span>
          New Lead
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Active Leads</p>
                <p class="text-2xl font-bold text-base-content mt-1">42</p>
              </div>
              <div class="bg-primary/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-primary">people</span>
              </div>
            </div>
          </div>
        </div>

        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Viewings This Week</p>
                <p class="text-2xl font-bold text-info mt-1">8</p>
              </div>
              <div class="bg-info/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-info">visibility</span>
              </div>
            </div>
          </div>
        </div>

        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Reservations</p>
                <p class="text-2xl font-bold text-warning mt-1">12</p>
              </div>
              <div class="bg-warning/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-warning">bookmark_added</span>
              </div>
            </div>
          </div>
        </div>

        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Completions</p>
                <p class="text-2xl font-bold text-success mt-1">5</p>
              </div>
              <div class="bg-success/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-success">handshake</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sales Pipeline Table -->
      <div class="card bg-base-100 shadow-sm border border-base-300">
        <div class="card-body p-0">
          <div class="flex items-center justify-between p-4 border-b border-base-300">
            <h2 class="text-lg font-semibold text-base-content">Sales Pipeline</h2>
            <div class="flex gap-2">
              <input type="text" placeholder="Search buyers..." class="input input-bordered input-sm w-60" />
              <select class="select select-bordered select-sm">
                <option>All Stages</option>
                <option>Lead</option>
                <option>Viewing</option>
                <option>Reserved</option>
                <option>Exchanged</option>
                <option>Complete</option>
              </select>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr class="bg-base-200/50">
                  <th>Buyer</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th class="text-right">Value</th>
                  <th>Solicitor</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of pipeline" class="hover:bg-base-200/30">
                  <td class="font-medium">{{ item.buyer }}</td>
                  <td>{{ item.unit }}</td>
                  <td>
                    <app-status-badge [value]="item.status" [badgeMap]="salesBadgeMap" size="sm" />
                  </td>
                  <td class="text-right font-mono text-sm">{{ item.value }}</td>
                  <td class="text-sm">{{ item.solicitor }}</td>
                  <td class="text-sm text-base-content/70">{{ item.lastActivity }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SalesDashboardComponent {
  readonly salesBadgeMap: Record<string, IBadgeMapEntry> = {
    'Lead': { label: 'Lead', cssClass: 'badge-ghost', icon: 'person_add' },
    'Viewing': { label: 'Viewing', cssClass: 'badge-info', icon: 'visibility' },
    'Reserved': { label: 'Reserved', cssClass: 'badge-warning', icon: 'bookmark_added' },
    'Exchanged': { label: 'Exchanged', cssClass: 'badge-primary', icon: 'swap_horiz' },
    'Complete': { label: 'Complete', cssClass: 'badge-success', icon: 'handshake' },
  };

  readonly pipeline: readonly ISalesPipeline[] = [
    { buyer: 'Mr & Mrs Harrison', unit: 'Block A, Unit 12', status: 'Complete', value: '£485,000', solicitor: 'Carter & Associates', lastActivity: '2 days ago' },
    { buyer: 'David Chen', unit: 'Block B, Unit 7', status: 'Exchanged', value: '£410,000', solicitor: 'Patel Law Group', lastActivity: '1 day ago' },
    { buyer: 'Sarah Mitchell', unit: 'Block A, Unit 18', status: 'Reserved', value: '£525,000', solicitor: 'Wright & Partners', lastActivity: '3 days ago' },
    { buyer: 'James O\'Brien', unit: 'Block C, Unit 3', status: 'Reserved', value: '£335,000', solicitor: 'Morrison Solicitors', lastActivity: '5 days ago' },
    { buyer: 'Priya Sharma', unit: 'Block B, Penthouse', status: 'Viewing', value: '£925,000', solicitor: '—', lastActivity: 'Today' },
    { buyer: 'Michael Torres', unit: 'Block A, Unit 22', status: 'Lead', value: '£445,000', solicitor: '—', lastActivity: 'Yesterday' },
    { buyer: 'Emma Richardson', unit: 'Block C, Unit 9', status: 'Viewing', value: '£380,000', solicitor: '—', lastActivity: '4 days ago' },
    { buyer: 'Robert Anderson', unit: 'Block A, Unit 5', status: 'Complete', value: '£520,000', solicitor: 'Baker Hughes LLP', lastActivity: '1 week ago' }
  ];
}
