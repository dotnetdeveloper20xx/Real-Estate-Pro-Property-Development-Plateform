import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent, IBadgeMapEntry } from '../../../../shared/design-system';

interface IPropertyUnit {
  readonly block: string;
  readonly floor: string;
  readonly type: '1-Bed' | '2-Bed' | '3-Bed' | 'Penthouse' | 'Studio';
  readonly price: string;
  readonly status: 'Available' | 'Reserved' | 'Sold' | 'Under Offer';
  readonly buyer: string;
}

@Component({
  selector: 'app-property-units-dashboard',
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
          <h1 class="text-2xl font-bold text-base-content">Property Units</h1>
          <p class="text-sm text-base-content/60 mt-1">Manage unit configuration, pricing, availability, and sales status</p>
        </div>
        <button class="btn btn-primary gap-2">
          <span class="material-symbols-outlined text-lg">add</span>
          Add Unit
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Total Units</p>
                <p class="text-2xl font-bold text-base-content mt-1">195</p>
              </div>
              <div class="bg-primary/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-primary">apartment</span>
              </div>
            </div>
          </div>
        </div>

        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Available</p>
                <p class="text-2xl font-bold text-success mt-1">82</p>
              </div>
              <div class="bg-success/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-success">check_circle</span>
              </div>
            </div>
          </div>
        </div>

        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Reserved</p>
                <p class="text-2xl font-bold text-warning mt-1">28</p>
              </div>
              <div class="bg-warning/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-warning">bookmark</span>
              </div>
            </div>
          </div>
        </div>

        <div class="kpi-card card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Sold</p>
                <p class="text-2xl font-bold text-info mt-1">85</p>
              </div>
              <div class="bg-info/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-info">sell</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Units Table -->
      <div class="card bg-base-100 shadow-sm border border-base-300">
        <div class="card-body p-0">
          <div class="flex items-center justify-between p-4 border-b border-base-300">
            <h2 class="text-lg font-semibold text-base-content">Unit Register — Greenwich Waterfront</h2>
            <div class="flex gap-2">
              <input type="text" placeholder="Search units..." class="input input-bordered input-sm w-60" />
              <select class="select select-bordered select-sm">
                <option>All Statuses</option>
                <option>Available</option>
                <option>Reserved</option>
                <option>Sold</option>
              </select>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr class="bg-base-200/50">
                  <th>Block</th>
                  <th>Floor</th>
                  <th>Type</th>
                  <th class="text-right">Price</th>
                  <th>Status</th>
                  <th>Buyer / Reservation</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let unit of units" class="hover:bg-base-200/30">
                  <td class="font-medium">{{ unit.block }}</td>
                  <td>{{ unit.floor }}</td>
                  <td>
                    <span class="badge badge-ghost badge-sm">{{ unit.type }}</span>
                  </td>
                  <td class="text-right font-mono text-sm">{{ unit.price }}</td>
                  <td>
                    <app-status-badge [value]="unit.status" [badgeMap]="unitBadgeMap" size="sm" />
                  </td>
                  <td class="text-sm text-base-content/70">{{ unit.buyer || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PropertyUnitsDashboardComponent {
  readonly unitBadgeMap: Record<string, IBadgeMapEntry> = {
    'Available': { label: 'Available', cssClass: 'badge-success', icon: 'check_circle' },
    'Reserved': { label: 'Reserved', cssClass: 'badge-warning', icon: 'bookmark' },
    'Sold': { label: 'Sold', cssClass: 'badge-info', icon: 'sell' },
    'Under Offer': { label: 'Under Offer', cssClass: 'badge-ghost', icon: 'handshake' },
  };

  readonly units: readonly IPropertyUnit[] = [
    { block: 'Block A', floor: 'Ground', type: '2-Bed', price: '£425,000', status: 'Sold', buyer: 'Mr & Mrs Patel' },
    { block: 'Block A', floor: '1st', type: '1-Bed', price: '£320,000', status: 'Sold', buyer: 'J. Thompson' },
    { block: 'Block A', floor: '2nd', type: '3-Bed', price: '£585,000', status: 'Reserved', buyer: 'Chen Family' },
    { block: 'Block A', floor: '3rd', type: '2-Bed', price: '£445,000', status: 'Available', buyer: '' },
    { block: 'Block B', floor: 'Ground', type: 'Studio', price: '£245,000', status: 'Sold', buyer: 'K. Williams' },
    { block: 'Block B', floor: '1st', type: '2-Bed', price: '£410,000', status: 'Under Offer', buyer: 'A. Rahman' },
    { block: 'Block B', floor: '4th', type: 'Penthouse', price: '£925,000', status: 'Available', buyer: '' },
    { block: 'Block C', floor: '2nd', type: '1-Bed', price: '£335,000', status: 'Reserved', buyer: 'S. O\'Connor' }
  ];
}
