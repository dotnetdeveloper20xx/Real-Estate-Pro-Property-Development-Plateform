import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface IDocument {
  readonly name: string;
  readonly type: string;
  readonly project: string;
  readonly uploadedBy: string;
  readonly date: string;
  readonly size: string;
  readonly status: 'Approved' | 'Pending Review' | 'Draft' | 'Expired';
}

@Component({
  selector: 'app-documents-dashboard',
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
          <h1 class="text-2xl font-bold text-base-content">Document Management</h1>
          <p class="text-sm text-base-content/60 mt-1">Centralised repository for all project documents, contracts, and reports</p>
        </div>
        <button class="btn btn-primary gap-2">
          <span class="material-symbols-outlined text-lg">upload_file</span>
          Upload Document
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Total Documents</p>
                <p class="text-2xl font-bold text-base-content mt-1">234</p>
              </div>
              <div class="bg-primary/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-primary">folder_open</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Pending Review</p>
                <p class="text-2xl font-bold text-warning mt-1">12</p>
              </div>
              <div class="bg-warning/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-warning">pending_actions</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Expiring Soon</p>
                <p class="text-2xl font-bold text-error mt-1">3</p>
              </div>
              <div class="bg-error/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-error">schedule</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-base-content/60 uppercase tracking-wide">Categories</p>
                <p class="text-2xl font-bold text-info mt-1">8</p>
              </div>
              <div class="bg-info/10 p-2.5 rounded-lg">
                <span class="material-symbols-outlined text-info">category</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Documents Table -->
      <div class="card bg-base-100 shadow-sm border border-base-300">
        <div class="card-body p-0">
          <div class="flex items-center justify-between p-4 border-b border-base-300">
            <h2 class="text-lg font-semibold text-base-content">Recent Documents</h2>
            <div class="flex gap-2">
              <input type="text" placeholder="Search documents..." class="input input-bordered input-sm w-60" />
              <select class="select select-bordered select-sm">
                <option>All Types</option>
                <option>Contracts</option>
                <option>Planning</option>
                <option>Reports</option>
                <option>Legal</option>
              </select>
              <button class="btn btn-ghost btn-sm">
                <span class="material-symbols-outlined text-lg">filter_list</span>
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr class="bg-base-200/50">
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Project</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th>Size</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let doc of documents" class="hover:bg-base-200/30">
                  <td>
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-base-content/40 text-lg">description</span>
                      <span class="font-medium">{{ doc.name }}</span>
                    </div>
                  </td>
                  <td><span class="badge badge-ghost badge-sm">{{ doc.type }}</span></td>
                  <td class="text-sm">{{ doc.project }}</td>
                  <td class="text-sm">{{ doc.uploadedBy }}</td>
                  <td class="text-sm text-base-content/70">{{ doc.date }}</td>
                  <td class="text-sm text-base-content/70">{{ doc.size }}</td>
                  <td>
                    <span class="badge badge-sm"
                      [ngClass]="{
                        'badge-success': doc.status === 'Approved',
                        'badge-warning': doc.status === 'Pending Review',
                        'badge-ghost': doc.status === 'Draft',
                        'badge-error': doc.status === 'Expired'
                      }">
                      {{ doc.status }}
                    </span>
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
export class DocumentsDashboardComponent {
  readonly documents: readonly IDocument[] = [
    { name: 'Planning Permission — Block A', type: 'Planning', project: 'Greenwich Waterfront', uploadedBy: 'Sarah Williams', date: '12 Dec 2024', size: '4.2 MB', status: 'Approved' },
    { name: 'Construction Contract Rev 3', type: 'Contract', project: 'Battersea Phase 1', uploadedBy: 'James Mitchell', date: '10 Dec 2024', size: '1.8 MB', status: 'Pending Review' },
    { name: 'Environmental Impact Assessment', type: 'Report', project: 'Greenwich Waterfront', uploadedBy: 'David Thompson', date: '08 Dec 2024', size: '12.4 MB', status: 'Approved' },
    { name: 'Topographical Survey Report', type: 'Survey', project: 'Manchester Northern Quarter', uploadedBy: 'Emma Richards', date: '05 Dec 2024', size: '8.7 MB', status: 'Approved' },
    { name: 'Fire Safety Certificate', type: 'Certificate', project: 'Birmingham Mixed Use', uploadedBy: 'Robert Clarke', date: '03 Dec 2024', size: '520 KB', status: 'Expired' },
    { name: 'S106 Agreement Draft', type: 'Legal', project: 'Leeds Waterfront', uploadedBy: 'Helen Foster', date: '01 Dec 2024', size: '2.3 MB', status: 'Draft' },
    { name: 'Structural Engineers Report', type: 'Report', project: 'Battersea Phase 1', uploadedBy: 'David Thompson', date: '28 Nov 2024', size: '6.1 MB', status: 'Approved' },
    { name: 'Warranty Documentation Pack', type: 'Warranty', project: 'Bristol Harbourside', uploadedBy: 'Sarah Williams', date: '25 Nov 2024', size: '3.4 MB', status: 'Pending Review' }
  ];
}
