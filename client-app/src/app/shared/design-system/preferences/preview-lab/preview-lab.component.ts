import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ThemeEngineService } from '../../services/theme-engine.service';
import { FontScaleService, FontScale } from '../../services/font-scale.service';
import { DisplayPreferenceService } from '../../services/display-preference.service';

import { StatusBadgeComponent } from '../../badges/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../badges/priority-badge/priority-badge.component';
import { StageBadgeComponent } from '../../badges/stage-badge/stage-badge.component';
import { RiskBadgeComponent } from '../../badges/risk-badge/risk-badge.component';
import { LoadingSpinnerComponent } from '../../loading/loading-spinner/loading-spinner.component';
import { SkeletonCardComponent } from '../../loading/skeleton-card/skeleton-card.component';
import { SkeletonTableComponent } from '../../loading/skeleton-table/skeleton-table.component';
import { SkeletonFormComponent } from '../../loading/skeleton-form/skeleton-form.component';
import { EmptyStateComponent } from '../../empty-states/empty-state/empty-state.component';

/**
 * Preview Lab / Component Playground
 *
 * Showcases all design system components rendered with current display preferences.
 * Users can switch font scale and theme without affecting persisted preferences.
 *
 * Route: /preferences/playground
 * Also accessible as a navigable tab within the Preferences Page.
 *
 * @requirements 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7
 */
@Component({
  selector: 'app-preview-lab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadgeComponent,
    PriorityBadgeComponent,
    StageBadgeComponent,
    RiskBadgeComponent,
    LoadingSpinnerComponent,
    SkeletonCardComponent,
    SkeletonTableComponent,
    SkeletonFormComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col lg:flex-row gap-6 p-6">
      <!-- Sidebar Navigation -->
      <aside class="lg:w-56 shrink-0">
        <div class="sticky top-4">
          <h3 class="text-sm font-semibold text-base-content/70 uppercase tracking-wider mb-3">
            Categories
          </h3>
          <nav class="flex flex-row flex-wrap lg:flex-col gap-1">
            @for (cat of categories; track cat.id) {
              <a
                [href]="'#' + cat.id"
                class="btn btn-ghost btn-sm justify-start text-left"
                [class.btn-active]="activeSection() === cat.id"
                (click)="scrollToSection($event, cat.id)"
              >
                <span class="material-symbols-outlined text-sm" aria-hidden="true">{{ cat.icon }}</span>
                {{ cat.label }}
              </a>
            }
          </nav>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 min-w-0">
        <!-- Playground Controls -->
        <div class="card bg-base-200 shadow-sm mb-6">
          <div class="card-body p-4">
            <div class="flex flex-wrap items-center gap-4">
              <!-- Display Mode Selector -->
              <div class="form-control">
                <label class="label pb-1">
                  <span class="label-text text-xs font-medium">Display Mode</span>
                </label>
                <div class="join">
                  @for (mode of fontScaleModes; track mode.value) {
                    <button
                      type="button"
                      class="btn btn-sm join-item"
                      [class.btn-primary]="selectedScale() === mode.value"
                      (click)="onScaleChange(mode.value)"
                    >
                      {{ mode.label }}
                    </button>
                  }
                </div>
              </div>

              <!-- Theme Selector -->
              <div class="form-control">
                <label class="label pb-1">
                  <span class="label-text text-xs font-medium">Theme</span>
                </label>
                <select
                  class="select select-bordered select-sm"
                  [ngModel]="selectedTheme()"
                  (ngModelChange)="onThemeChange($event)"
                >
                  @for (theme of availableThemes(); track theme) {
                    <option [value]="theme">{{ theme | titlecase }}</option>
                  }
                </select>
              </div>

              <!-- Info indicator -->
              <div class="ml-auto text-xs text-base-content/50 italic">
                <span class="material-symbols-outlined text-xs align-middle" aria-hidden="true">info</span>
                Changes apply to preview only — your saved preferences are not affected.
              </div>
            </div>
          </div>
        </div>

        <!-- Category Sections -->

        <!-- Typography -->
        <section [id]="'typography'" class="mb-10">
          <h2 class="text-xl font-bold text-base-content mb-4 border-b border-base-300 pb-2">Typography</h2>
          @if (sectionErrors().has('typography')) {
            <div class="alert alert-error">
              <span class="material-symbols-outlined">error</span>
              <span>Component "Typography" failed to render.</span>
            </div>
          } @else {
            <div class="space-y-3">
              <h1 class="text-4xl font-bold">Heading 1 — Project Overview</h1>
              <h2 class="text-3xl font-semibold">Heading 2 — Section Title</h2>
              <h3 class="text-2xl font-medium">Heading 3 — Subsection</h3>
              <h4 class="text-xl">Heading 4 — Group Label</h4>
              <h5 class="text-lg">Heading 5 — Field Group</h5>
              <p class="text-base">Body text — Regular paragraph content for descriptions, explanations, and general information display.</p>
              <p class="text-sm text-base-content/70">Small text — Secondary labels, metadata, and helper text.</p>
              <p class="text-xs text-base-content/50">Caption text — Timestamps, IDs, and tertiary details.</p>
            </div>
          }
        </section>

        <!-- Buttons -->
        <section [id]="'buttons'" class="mb-10">
          <h2 class="text-xl font-bold text-base-content mb-4 border-b border-base-300 pb-2">Buttons</h2>
          @if (sectionErrors().has('buttons')) {
            <div class="alert alert-error">
              <span class="material-symbols-outlined">error</span>
              <span>Component "Buttons" failed to render.</span>
            </div>
          } @else {
            <div class="flex flex-wrap gap-3">
              <button class="btn btn-primary">Primary</button>
              <button class="btn btn-secondary">Secondary</button>
              <button class="btn btn-accent">Accent</button>
              <button class="btn btn-info">Info</button>
              <button class="btn btn-success">Success</button>
              <button class="btn btn-warning">Warning</button>
              <button class="btn btn-error">Error</button>
              <button class="btn btn-ghost">Ghost</button>
              <button class="btn btn-outline">Outline</button>
              <button class="btn btn-disabled" disabled>Disabled</button>
            </div>
            <div class="flex flex-wrap gap-3 mt-4">
              <button class="btn btn-primary btn-xs">Extra Small</button>
              <button class="btn btn-primary btn-sm">Small</button>
              <button class="btn btn-primary">Medium</button>
              <button class="btn btn-primary btn-lg">Large</button>
            </div>
          }
        </section>

        <!-- Cards -->
        <section [id]="'cards'" class="mb-10">
          <h2 class="text-xl font-bold text-base-content mb-4 border-b border-base-300 pb-2">Cards</h2>
          @if (sectionErrors().has('cards')) {
            <div class="alert alert-error">
              <span class="material-symbols-outlined">error</span>
              <span>Component "Cards" failed to render.</span>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="card bg-base-100 shadow-md">
                <div class="card-body">
                  <h3 class="card-title">Project Alpha</h3>
                  <p class="text-sm text-base-content/70">Mixed-use development in Central London. 150 residential units with ground floor retail.</p>
                  <div class="card-actions justify-end mt-2">
                    <button class="btn btn-primary btn-sm">View Details</button>
                  </div>
                </div>
              </div>
              <div class="card bg-base-100 shadow-md border border-warning/30">
                <div class="card-body">
                  <h3 class="card-title text-warning">At Risk</h3>
                  <p class="text-sm text-base-content/70">Budget overrun detected. Estimated additional £240K required for phase 2 completion.</p>
                  <div class="card-actions justify-end mt-2">
                    <button class="btn btn-warning btn-sm">Review</button>
                  </div>
                </div>
              </div>
              <div class="card bg-base-100 shadow-md border border-success/30">
                <div class="card-body">
                  <h3 class="card-title text-success">Completed</h3>
                  <p class="text-sm text-base-content/70">Planning approval granted. All conditions discharged. Ready for construction start.</p>
                  <div class="card-actions justify-end mt-2">
                    <button class="btn btn-success btn-sm">Proceed</button>
                  </div>
                </div>
              </div>
            </div>
          }
        </section>

        <!-- Tables -->
        <section [id]="'tables'" class="mb-10">
          <h2 class="text-xl font-bold text-base-content mb-4 border-b border-base-300 pb-2">Tables</h2>
          @if (sectionErrors().has('tables')) {
            <div class="alert alert-error">
              <span class="material-symbols-outlined">error</span>
              <span>Component "Tables" failed to render.</span>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="table table-zebra w-full">
                <thead>
                  <tr>
                    <th scope="col">Project</th>
                    <th scope="col">Location</th>
                    <th scope="col">Status</th>
                    <th scope="col">Value</th>
                    <th scope="col">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-medium">Riverside Quarter</td>
                    <td>Manchester</td>
                    <td><app-status-badge value="Active" /></td>
                    <td>£12,500,000</td>
                    <td>15/03/2025</td>
                  </tr>
                  <tr>
                    <td class="font-medium">King's Cross Plot B</td>
                    <td>London</td>
                    <td><app-status-badge value="Pending" /></td>
                    <td>£28,750,000</td>
                    <td>22/06/2025</td>
                  </tr>
                  <tr>
                    <td class="font-medium">Harbour View</td>
                    <td>Bristol</td>
                    <td><app-status-badge value="Completed" /></td>
                    <td>£8,200,000</td>
                    <td>01/01/2025</td>
                  </tr>
                  <tr>
                    <td class="font-medium">Eastgate Retail Park</td>
                    <td>Leeds</td>
                    <td><app-status-badge value="UnderReview" /></td>
                    <td>£5,600,000</td>
                    <td>30/09/2025</td>
                  </tr>
                </tbody>
              </table>
            </div>
          }
        </section>

        <!-- Forms -->
        <section [id]="'forms'" class="mb-10">
          <h2 class="text-xl font-bold text-base-content mb-4 border-b border-base-300 pb-2">Forms</h2>
          @if (sectionErrors().has('forms')) {
            <div class="alert alert-error">
              <span class="material-symbols-outlined">error</span>
              <span>Component "Forms" failed to render.</span>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div class="form-control">
                <label class="label"><span class="label-text">Project Name <span class="text-error">*</span></span></label>
                <input type="text" placeholder="Enter project name" class="input input-bordered" value="Riverside Quarter" />
                <label class="label"><span class="label-text-alt text-base-content/50">Required field</span></label>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Location</span></label>
                <input type="text" placeholder="City or postcode" class="input input-bordered" value="Manchester, M3" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Budget (£)</span></label>
                <input type="text" placeholder="0.00" class="input input-bordered" value="12,500,000.00" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Status</span></label>
                <select class="select select-bordered">
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Under Review</option>
                  <option>Completed</option>
                </select>
              </div>
              <div class="form-control md:col-span-2">
                <label class="label"><span class="label-text">Description</span></label>
                <textarea class="textarea textarea-bordered h-20" placeholder="Project description...">Mixed-use development including 150 residential units and ground floor retail space.</textarea>
              </div>
              <div class="form-control">
                <label class="label cursor-pointer justify-start gap-3">
                  <input type="checkbox" class="toggle toggle-primary" checked />
                  <span class="label-text">Notify on status change</span>
                </label>
              </div>
              <!-- Error state example -->
              <div class="form-control">
                <label class="label"><span class="label-text">Email <span class="text-error">*</span></span></label>
                <input type="email" class="input input-bordered input-error" value="invalid-email" />
                <label class="label"><span class="label-text-alt text-error">Please enter a valid email address</span></label>
              </div>
            </div>
          }
        </section>

        <!-- Modals -->
        <section [id]="'modals'" class="mb-10">
          <h2 class="text-xl font-bold text-base-content mb-4 border-b border-base-300 pb-2">Modals</h2>
          @if (sectionErrors().has('modals')) {
            <div class="alert alert-error">
              <span class="material-symbols-outlined">error</span>
              <span>Component "Modals" failed to render.</span>
            </div>
          } @else {
            <div class="card bg-base-100 border border-base-300 p-6 max-w-lg">
              <p class="text-sm text-base-content/60 mb-3">Modal preview (static representation)</p>
              <div class="rounded-lg border border-base-300 shadow-lg overflow-hidden">
                <div class="bg-base-200 px-4 py-3 flex items-center justify-between border-b border-base-300">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary" aria-hidden="true">edit_document</span>
                    <span class="font-semibold">Edit Opportunity</span>
                  </div>
                  <button class="btn btn-ghost btn-xs btn-circle">✕</button>
                </div>
                <div class="p-4 bg-base-100">
                  <div class="form-control mb-3">
                    <label class="label pb-1"><span class="label-text text-sm">Opportunity Name</span></label>
                    <input type="text" class="input input-bordered input-sm" value="King's Cross Plot B" />
                  </div>
                  <div class="form-control">
                    <label class="label pb-1"><span class="label-text text-sm">Expected Value</span></label>
                    <input type="text" class="input input-bordered input-sm" value="£28,750,000" />
                  </div>
                </div>
                <div class="bg-base-200 px-4 py-3 flex justify-end gap-2 border-t border-base-300">
                  <button class="btn btn-ghost btn-sm">Cancel</button>
                  <button class="btn btn-primary btn-sm">Save Changes</button>
                </div>
              </div>
            </div>
          }
        </section>

        <!-- Badges & Status Indicators -->
        <section [id]="'badges'" class="mb-10">
          <h2 class="text-xl font-bold text-base-content mb-4 border-b border-base-300 pb-2">Badges & Status Indicators</h2>
          @if (sectionErrors().has('badges')) {
            <div class="alert alert-error">
              <span class="material-symbols-outlined">error</span>
              <span>Component "Badges" failed to render.</span>
            </div>
          } @else {
            <div class="space-y-4">
              <div>
                <h4 class="text-sm font-medium text-base-content/70 mb-2">Status Badges</h4>
                <div class="flex flex-wrap gap-2">
                  <app-status-badge value="Active" />
                  <app-status-badge value="Pending" />
                  <app-status-badge value="UnderReview" />
                  <app-status-badge value="Completed" />
                  <app-status-badge value="Inactive" />
                  <app-status-badge value="Archived" />
                </div>
              </div>
              <div>
                <h4 class="text-sm font-medium text-base-content/70 mb-2">Priority Badges</h4>
                <div class="flex flex-wrap gap-2">
                  <app-priority-badge value="Critical" />
                  <app-priority-badge value="High" />
                  <app-priority-badge value="Medium" />
                  <app-priority-badge value="Low" />
                </div>
              </div>
              <div>
                <h4 class="text-sm font-medium text-base-content/70 mb-2">Stage Badges</h4>
                <div class="flex flex-wrap gap-2">
                  <app-stage-badge value="Planning" />
                  <app-stage-badge value="InProgress" />
                  <app-stage-badge value="Review" />
                  <app-stage-badge value="Complete" />
                </div>
              </div>
              <div>
                <h4 class="text-sm font-medium text-base-content/70 mb-2">Risk Badges</h4>
                <div class="flex flex-wrap gap-2">
                  <app-risk-badge value="Critical" />
                  <app-risk-badge value="High" />
                  <app-risk-badge value="Medium" />
                  <app-risk-badge value="Low" />
                </div>
              </div>
            </div>
          }
        </section>

        <!-- Charts -->
        <section [id]="'charts'" class="mb-10">
          <h2 class="text-xl font-bold text-base-content mb-4 border-b border-base-300 pb-2">Charts</h2>
          @if (sectionErrors().has('charts')) {
            <div class="alert alert-error">
              <span class="material-symbols-outlined">error</span>
              <span>Component "Charts" failed to render.</span>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="card bg-base-100 shadow-sm border border-base-300">
                <div class="card-body p-4">
                  <h4 class="text-sm font-semibold mb-3">Revenue by Quarter</h4>
                  <div class="flex items-end gap-2 h-32">
                    <div class="flex-1 bg-primary/20 rounded-t" style="height: 40%"></div>
                    <div class="flex-1 bg-primary/40 rounded-t" style="height: 60%"></div>
                    <div class="flex-1 bg-primary/60 rounded-t" style="height: 85%"></div>
                    <div class="flex-1 bg-primary rounded-t" style="height: 100%"></div>
                  </div>
                  <div class="flex justify-between text-xs text-base-content/50 mt-1">
                    <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
                  </div>
                </div>
              </div>
              <div class="card bg-base-100 shadow-sm border border-base-300">
                <div class="card-body p-4">
                  <h4 class="text-sm font-semibold mb-3">Project Distribution</h4>
                  <div class="flex items-center gap-4">
                    <div class="w-24 h-24 rounded-full border-8 border-primary border-t-success border-r-warning"></div>
                    <div class="space-y-1 text-xs">
                      <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-primary"></span> Active (45%)</div>
                      <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-success"></span> Completed (30%)</div>
                      <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-sm bg-warning"></span> At Risk (25%)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </section>

        <!-- Timelines -->
        <section [id]="'timelines'" class="mb-10">
          <h2 class="text-xl font-bold text-base-content mb-4 border-b border-base-300 pb-2">Timelines</h2>
          @if (sectionErrors().has('timelines')) {
            <div class="alert alert-error">
              <span class="material-symbols-outlined">error</span>
              <span>Component "Timelines" failed to render.</span>
            </div>
          } @else {
            <ul class="timeline timeline-vertical">
              <li>
                <div class="timeline-start text-xs text-base-content/60">10 Jan 2025</div>
                <div class="timeline-middle">
                  <span class="material-symbols-outlined text-success text-sm">check_circle</span>
                </div>
                <div class="timeline-end timeline-box">Land opportunity identified</div>
                <hr class="bg-success" />
              </li>
              <li>
                <hr class="bg-success" />
                <div class="timeline-start text-xs text-base-content/60">25 Jan 2025</div>
                <div class="timeline-middle">
                  <span class="material-symbols-outlined text-success text-sm">check_circle</span>
                </div>
                <div class="timeline-end timeline-box">Due diligence completed</div>
                <hr class="bg-success" />
              </li>
              <li>
                <hr class="bg-success" />
                <div class="timeline-start text-xs text-base-content/60">14 Feb 2025</div>
                <div class="timeline-middle">
                  <span class="material-symbols-outlined text-primary text-sm">radio_button_checked</span>
                </div>
                <div class="timeline-end timeline-box">Offer submitted — awaiting response</div>
                <hr />
              </li>
              <li>
                <hr />
                <div class="timeline-start text-xs text-base-content/60">TBD</div>
                <div class="timeline-middle">
                  <span class="material-symbols-outlined text-base-content/30 text-sm">radio_button_unchecked</span>
                </div>
                <div class="timeline-end timeline-box text-base-content/50">Contract exchange</div>
              </li>
            </ul>
          }
        </section>

        <!-- Filters -->
        <section [id]="'filters'" class="mb-10">
          <h2 class="text-xl font-bold text-base-content mb-4 border-b border-base-300 pb-2">Filters</h2>
          @if (sectionErrors().has('filters')) {
            <div class="alert alert-error">
              <span class="material-symbols-outlined">error</span>
              <span>Component "Filters" failed to render.</span>
            </div>
          } @else {
            <div class="card bg-base-100 border border-base-300 p-4">
              <div class="flex flex-wrap items-center gap-3">
                <input type="text" placeholder="Search projects..." class="input input-bordered input-sm w-48" />
                <select class="select select-bordered select-sm">
                  <option disabled selected>Status</option>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Completed</option>
                </select>
                <select class="select select-bordered select-sm">
                  <option disabled selected>Location</option>
                  <option>London</option>
                  <option>Manchester</option>
                  <option>Bristol</option>
                </select>
                <button class="btn btn-ghost btn-sm">
                  <span class="material-symbols-outlined text-sm" aria-hidden="true">filter_alt_off</span>
                  Reset
                </button>
                <div class="badge badge-primary badge-sm">3 active</div>
              </div>
              <div class="flex flex-wrap gap-2 mt-3">
                <div class="badge badge-outline gap-1">
                  Status: Active
                  <button class="btn btn-ghost btn-xs btn-circle">✕</button>
                </div>
                <div class="badge badge-outline gap-1">
                  Location: London
                  <button class="btn btn-ghost btn-xs btn-circle">✕</button>
                </div>
                <div class="badge badge-outline gap-1">
                  Value: > £1M
                  <button class="btn btn-ghost btn-xs btn-circle">✕</button>
                </div>
              </div>
            </div>
          }
        </section>

        <!-- Loading States -->
        <section [id]="'loading-states'" class="mb-10">
          <h2 class="text-xl font-bold text-base-content mb-4 border-b border-base-300 pb-2">Loading States</h2>
          @if (sectionErrors().has('loading-states')) {
            <div class="alert alert-error">
              <span class="material-symbols-outlined">error</span>
              <span>Component "Loading States" failed to render.</span>
            </div>
          } @else {
            <div class="space-y-6">
              <div>
                <h4 class="text-sm font-medium text-base-content/70 mb-2">Spinners</h4>
                <div class="flex items-center gap-4">
                  <app-loading-spinner size="sm" />
                  <app-loading-spinner size="md" />
                  <app-loading-spinner size="lg" />
                </div>
              </div>
              <div>
                <h4 class="text-sm font-medium text-base-content/70 mb-2">Skeleton Cards</h4>
                <app-skeleton-card [loading]="true" [count]="3" />
              </div>
              <div>
                <h4 class="text-sm font-medium text-base-content/70 mb-2">Skeleton Table</h4>
                <app-skeleton-table [loading]="true" [rows]="3" [columns]="4" />
              </div>
              <div>
                <h4 class="text-sm font-medium text-base-content/70 mb-2">Skeleton Form</h4>
                <app-skeleton-form [loading]="true" [fields]="3" />
              </div>
            </div>
          }
        </section>

        <!-- Empty States -->
        <section [id]="'empty-states'" class="mb-10">
          <h2 class="text-xl font-bold text-base-content mb-4 border-b border-base-300 pb-2">Empty States</h2>
          @if (sectionErrors().has('empty-states')) {
            <div class="alert alert-error">
              <span class="material-symbols-outlined">error</span>
              <span>Component "Empty States" failed to render.</span>
            </div>
          } @else {
            <div class="card bg-base-100 border border-base-300 h-64">
              <app-empty-state
                title="No Opportunities Found"
                subtitle="Create your first land opportunity to begin evaluating development sites."
                icon="landscape"
                primaryActionText="Create Opportunity"
                secondaryActionText="Import from CSV"
              />
            </div>
          }
        </section>
      </main>
    </div>
  `,
})
export class PreviewLabComponent implements OnInit, OnDestroy {
  private readonly themeEngine = inject(ThemeEngineService);
  private readonly fontScaleService = inject(FontScaleService);
  private readonly displayPreferenceService = inject(DisplayPreferenceService);

  /** Original user preferences — restored on destroy */
  private originalTheme = '';
  private originalScale: FontScale = 'regular';

  /** Current playground selections (local only, never persisted) */
  readonly selectedScale = signal<FontScale>('regular');
  readonly selectedTheme = signal<string>('light');
  readonly activeSection = signal<string>('typography');
  readonly sectionErrors = signal<Set<string>>(new Set());

  /** Available themes from ThemeEngine */
  readonly availableThemes = computed(() => [...this.themeEngine.getAvailableThemes()]);

  /** Font scale options */
  readonly fontScaleModes: { label: string; value: FontScale }[] = [
    { label: 'Small', value: 'small' },
    { label: 'Regular', value: 'regular' },
    { label: 'Large', value: 'large' },
  ];

  /** Category sections for sidebar navigation */
  readonly categories = [
    { id: 'typography', label: 'Typography', icon: 'text_fields' },
    { id: 'buttons', label: 'Buttons', icon: 'smart_button' },
    { id: 'cards', label: 'Cards', icon: 'dashboard' },
    { id: 'tables', label: 'Tables', icon: 'table_chart' },
    { id: 'forms', label: 'Forms', icon: 'edit_note' },
    { id: 'modals', label: 'Modals', icon: 'open_in_new' },
    { id: 'badges', label: 'Badges', icon: 'label' },
    { id: 'charts', label: 'Charts', icon: 'bar_chart' },
    { id: 'timelines', label: 'Timelines', icon: 'timeline' },
    { id: 'filters', label: 'Filters', icon: 'filter_list' },
    { id: 'loading-states', label: 'Loading', icon: 'hourglass_empty' },
    { id: 'empty-states', label: 'Empty States', icon: 'inbox' },
  ];

  ngOnInit(): void {
    // Capture current persisted preferences to restore on destroy
    const currentPrefs = this.displayPreferenceService.getCurrentPreferences();
    this.originalTheme = currentPrefs.theme;
    this.originalScale = currentPrefs.fontScale;

    // Initialise selectors to user's current persisted preferences (Req 16.6)
    this.selectedTheme.set(currentPrefs.theme);
    this.selectedScale.set(currentPrefs.fontScale);
  }

  ngOnDestroy(): void {
    // Restore persisted preferences when leaving playground (Req 16.3)
    this.themeEngine.applyTheme(this.originalTheme);
    this.fontScaleService.applyScale(this.originalScale);
  }

  /**
   * Handle display mode change — applies immediately without persisting (Req 16.3).
   */
  onScaleChange(scale: FontScale): void {
    this.selectedScale.set(scale);
    this.fontScaleService.applyScale(scale);
  }

  /**
   * Handle theme change — applies immediately without persisting (Req 16.3).
   */
  onThemeChange(theme: string): void {
    this.selectedTheme.set(theme);
    this.themeEngine.applyTheme(theme);
  }

  /**
   * Scroll to a category section via anchor link (Req 16.5).
   */
  scrollToSection(event: Event, sectionId: string): void {
    event.preventDefault();
    this.activeSection.set(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
