import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NotificationAdminService, INotificationTemplate } from '../../services/notification-admin.service';
import { ModalShellComponent } from '../../../../shared/components/modal-shell/modal-shell.component';

/**
 * Notification Templates management page.
 * Allows SuperAdmin to view, create, edit, and delete notification message templates.
 * Templates define the title/body with variable substitution for dynamic content.
 */
@Component({
  selector: 'app-notification-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="p-6 pb-0">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-base-content">Notification Templates</h1>
          <p class="text-sm text-base-content/60 mt-1">
            Manage message templates used for notification content. Use {{ '{' }}variable{{ '}' }} syntax for dynamic values.
          </p>
        </div>
        <button class="btn btn-primary btn-sm gap-2" (click)="openCreateModal()">
          <span class="material-symbols-outlined text-sm">add</span>
          Add Template
        </button>
      </div>

      <!-- Filter -->
      <div class="flex items-center gap-3 mb-4">
        <input
          type="text"
          class="input input-bordered input-sm w-64"
          [(ngModel)]="searchFilter"
          (ngModelChange)="filterTemplates()"
          placeholder="Search templates..." />
        <span class="text-sm text-base-content/50">
          {{ filteredTemplates.length }} template{{ filteredTemplates.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- Templates Grid -->
    <div class="px-6 pb-6">
      <!-- Loading -->
      <div *ngIf="loading" class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-md text-primary"></span>
        <span class="ml-3 text-sm text-base-content/60">Loading templates...</span>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && filteredTemplates.length === 0" class="card bg-base-100 border border-base-200 p-12 text-center">
        <span class="material-symbols-outlined text-5xl text-base-content/20 mb-3">description</span>
        <p class="text-base-content/60 font-medium">No notification templates found</p>
        <p class="text-sm text-base-content/40 mt-1">Create templates to customize notification messages.</p>
        <button class="btn btn-primary btn-sm mt-4" (click)="openCreateModal()">
          <span class="material-symbols-outlined text-sm">add</span>
          Create Template
        </button>
      </div>

      <!-- Templates Cards -->
      <div *ngIf="!loading && filteredTemplates.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          *ngFor="let template of filteredTemplates; trackBy: trackById"
          class="card bg-base-100 border border-base-200 hover:border-primary/30 transition-colors">
          <div class="card-body p-4">
            <!-- Header -->
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full flex items-center justify-center"
                     [ngClass]="getSeverityBgClass(template.severity)">
                  <span class="material-symbols-outlined text-sm">{{ template.iconName || 'notifications' }}</span>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-base-content">{{ template.name }}</h3>
                  <span class="font-mono text-xs text-base-content/50">{{ template.eventType }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <span class="badge badge-xs" [ngClass]="getSeverityBadgeClass(template.severity)">
                  {{ template.severity }}
                </span>
                <span class="badge badge-xs" [class.badge-success]="template.isActive" [class.badge-ghost]="!template.isActive">
                  {{ template.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>

            <!-- Template Preview -->
            <div class="mt-3 bg-base-200/50 rounded-lg p-3">
              <p class="text-xs font-medium text-base-content/70 mb-1">Title:</p>
              <p class="text-sm text-base-content">{{ template.titleTemplate }}</p>
              <p class="text-xs font-medium text-base-content/70 mt-2 mb-1">Body:</p>
              <p class="text-sm text-base-content/80">{{ template.bodyTemplate }}</p>
            </div>

            <!-- Variables -->
            <div *ngIf="getVariables(template.variables).length > 0" class="mt-2">
              <p class="text-xs text-base-content/50 mb-1">Variables:</p>
              <div class="flex flex-wrap gap-1">
                <span
                  *ngFor="let v of getVariables(template.variables)"
                  class="badge badge-xs badge-outline font-mono">
                  {{ '{' }}{{ v }}{{ '}' }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="card-actions justify-end mt-3 pt-2 border-t border-base-200">
              <button class="btn btn-ghost btn-xs gap-1" (click)="openEditModal(template)">
                <span class="material-symbols-outlined text-sm">edit</span>
                Edit
              </button>
              <button class="btn btn-ghost btn-xs gap-1 text-error" (click)="confirmDelete(template)">
                <span class="material-symbols-outlined text-sm">delete</span>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Template Modal -->
    <app-modal-shell
      *ngIf="modalOpen"
      [visible]="modalOpen"
      [title]="editingTemplate ? 'Edit Notification Template' : 'Create Notification Template'"
      [subtitle]="editingTemplate ? 'Update template content and settings' : 'Define a new message template'"
      [loading]="modalSaving"
      size="lg"
      (closed)="closeModal()">

      <div class="space-y-4">
        <!-- Name -->
        <div class="form-control">
          <label class="label"><span class="label-text font-medium">Template Name</span></label>
          <input
            type="text"
            class="input input-bordered input-sm w-full"
            [(ngModel)]="formData.name"
            placeholder="e.g., Offer Accepted Notification" />
        </div>

        <!-- Event Type -->
        <div class="form-control">
          <label class="label"><span class="label-text font-medium">Event Type</span></label>
          <input
            type="text"
            class="input input-bordered input-sm w-full"
            [(ngModel)]="formData.eventType"
            placeholder="e.g., OfferAccepted" />
        </div>

        <!-- Title Template -->
        <div class="form-control">
          <label class="label"><span class="label-text font-medium">Title Template</span></label>
          <input
            type="text"
            class="input input-bordered input-sm w-full"
            [(ngModel)]="formData.titleTemplate"
            placeholder="e.g., Offer accepted for {opportunityName}" />
          <label class="label"><span class="label-text-alt text-base-content/50">Use {{ '{' }}variableName{{ '}' }} for dynamic content</span></label>
        </div>

        <!-- Body Template -->
        <div class="form-control">
          <label class="label"><span class="label-text font-medium">Body Template</span></label>
          <textarea
            class="textarea textarea-bordered w-full text-sm"
            rows="3"
            [(ngModel)]="formData.bodyTemplate"
            placeholder="e.g., An offer of £{amount} has been accepted for {opportunityName}"></textarea>
        </div>

        <!-- Icon + Severity -->
        <div class="grid grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">Icon Name</span></label>
            <input
              type="text"
              class="input input-bordered input-sm w-full"
              [(ngModel)]="formData.iconName"
              placeholder="e.g., check_circle" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">Severity</span></label>
            <select class="select select-bordered select-sm w-full" [(ngModel)]="formData.severity">
              <option value="Info">Info</option>
              <option value="Success">Success</option>
              <option value="Warning">Warning</option>
              <option value="Error">Error</option>
            </select>
          </div>
        </div>

        <!-- Variables (JSON) -->
        <div class="form-control">
          <label class="label"><span class="label-text font-medium">Variables (JSON array)</span></label>
          <input
            type="text"
            class="input input-bordered input-sm w-full font-mono text-xs"
            [(ngModel)]="formData.variables"
            placeholder='["opportunityName", "amount", "currency"]' />
        </div>

        <!-- Active -->
        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-3">
            <input type="checkbox" class="toggle toggle-primary toggle-sm" [(ngModel)]="formData.isActive" />
            <span class="label-text font-medium">Active</span>
          </label>
        </div>
      </div>

      <div modal-footer>
        <div class="flex items-center justify-end gap-2">
          <button class="btn btn-ghost btn-sm" (click)="closeModal()">Cancel</button>
          <button
            class="btn btn-primary btn-sm"
            [disabled]="!isFormValid() || modalSaving"
            (click)="saveTemplate()">
            {{ modalSaving ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template') }}
          </button>
        </div>
      </div>
    </app-modal-shell>

    <!-- Delete Confirmation -->
    <app-modal-shell
      *ngIf="deleteModalOpen"
      [visible]="deleteModalOpen"
      title="Delete Notification Template"
      subtitle="This action cannot be undone"
      [loading]="deleteSaving"
      (closed)="deleteModalOpen = false">
      <div class="py-2">
        <p class="text-sm text-base-content/70">
          Are you sure you want to delete the template
          <span class="font-semibold">"{{ deletingTemplate?.name }}"</span>?
        </p>
        <p class="text-xs text-base-content/50 mt-2">
          Any rules referencing this template will fall back to default messages.
        </p>
      </div>
      <div modal-footer>
        <div class="flex items-center justify-end gap-2">
          <button class="btn btn-ghost btn-sm" (click)="deleteModalOpen = false">Cancel</button>
          <button class="btn btn-error btn-sm" [disabled]="deleteSaving" (click)="deleteTemplate()">
            {{ deleteSaving ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </app-modal-shell>
  `
})
export class NotificationTemplatesComponent implements OnInit, OnDestroy {
  templates: INotificationTemplate[] = [];
  filteredTemplates: INotificationTemplate[] = [];
  loading = false;
  searchFilter = '';

  // Modal
  modalOpen = false;
  modalSaving = false;
  editingTemplate: INotificationTemplate | null = null;
  formData = this.getEmptyFormData();

  // Delete
  deleteModalOpen = false;
  deleteSaving = false;
  deletingTemplate: INotificationTemplate | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly service: NotificationAdminService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTemplates(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.service.getTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.templates = res.data ?? [];
          this.filterTemplates();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  filterTemplates(): void {
    const search = this.searchFilter.toLowerCase();
    this.filteredTemplates = this.templates.filter(t =>
      t.name.toLowerCase().includes(search) ||
      t.eventType.toLowerCase().includes(search) ||
      t.titleTemplate.toLowerCase().includes(search)
    );
  }

  openCreateModal(): void {
    this.editingTemplate = null;
    this.formData = this.getEmptyFormData();
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  openEditModal(template: INotificationTemplate): void {
    this.editingTemplate = template;
    this.formData = {
      name: template.name,
      eventType: template.eventType,
      titleTemplate: template.titleTemplate,
      bodyTemplate: template.bodyTemplate,
      iconName: template.iconName,
      severity: template.severity,
      variables: template.variables,
      isActive: template.isActive
    };
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingTemplate = null;
    this.cdr.markForCheck();
  }

  isFormValid(): boolean {
    return !!(this.formData.name && this.formData.eventType && this.formData.titleTemplate && this.formData.bodyTemplate);
  }

  saveTemplate(): void {
    if (!this.isFormValid()) return;
    this.modalSaving = true;
    this.cdr.markForCheck();

    const obs = this.editingTemplate
      ? this.service.updateTemplate(this.editingTemplate.id, this.formData)
      : this.service.createTemplate(this.formData as any);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.modalSaving = false;
        this.modalOpen = false;
        this.editingTemplate = null;
        this.loadTemplates();
        this.cdr.markForCheck();
      },
      error: () => {
        this.modalSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  confirmDelete(template: INotificationTemplate): void {
    this.deletingTemplate = template;
    this.deleteModalOpen = true;
    this.cdr.markForCheck();
  }

  deleteTemplate(): void {
    if (!this.deletingTemplate) return;
    this.deleteSaving = true;
    this.cdr.markForCheck();

    this.service.deleteTemplate(this.deletingTemplate.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleteSaving = false;
          this.deleteModalOpen = false;
          this.deletingTemplate = null;
          this.loadTemplates();
          this.cdr.markForCheck();
        },
        error: () => {
          this.deleteSaving = false;
          this.cdr.markForCheck();
        }
      });
  }

  getVariables(variablesJson: string): string[] {
    try {
      const parsed = JSON.parse(variablesJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  getSeverityBgClass(severity: string): string {
    switch (severity) {
      case 'Info': return 'bg-info/10 text-info';
      case 'Success': return 'bg-success/10 text-success';
      case 'Warning': return 'bg-warning/10 text-warning';
      case 'Error': return 'bg-error/10 text-error';
      default: return 'bg-base-200 text-base-content/60';
    }
  }

  getSeverityBadgeClass(severity: string): string {
    switch (severity) {
      case 'Info': return 'badge-info';
      case 'Success': return 'badge-success';
      case 'Warning': return 'badge-warning';
      case 'Error': return 'badge-error';
      default: return 'badge-ghost';
    }
  }

  trackById(_: number, item: INotificationTemplate): string {
    return item.id;
  }

  private getEmptyFormData() {
    return {
      name: '',
      eventType: '',
      titleTemplate: '',
      bodyTemplate: '',
      iconName: 'notifications',
      severity: 'Info',
      variables: '[]',
      isActive: true
    };
  }
}
