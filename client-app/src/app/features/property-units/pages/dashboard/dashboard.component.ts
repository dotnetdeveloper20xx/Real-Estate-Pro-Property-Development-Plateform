import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

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
        <div class="card bg-base-100 shadow-sm border border-base-300">
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

        <div class="card bg-base-100 shadow-sm border border-base-300">
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

        <div class="card bg-base-100 shadow-sm border border-base-300">
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

        <div class="card bg-base-100 shadow-sm border border-base-300">
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
                    <span class="badge badge-sm"
                      [ngClass]="{
                        'badge-success': unit.status === 'Available',
                        'badge-warning': unit.status === 'Reserved',
                        'badge-info': unit.status === 'Sold',
                        'badge-ghost': unit.status === 'Under Offer'
                      }">
                      {{ unit.status }}
                    </span>
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
