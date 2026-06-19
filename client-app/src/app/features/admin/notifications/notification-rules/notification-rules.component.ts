import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NotificationAdminService, INotificationRule, INotificationTemplate } from '../../services/notification-admin.service';
import { ModalShellComponent } from '../../../../shared/components/modal-shell/modal-shell.component';

/**
 * Notification Rules management page.
 * Allows SuperAdmin to view, create, edit, toggle, and delete notification rules.
 * Provides module filtering and an inline toggle for active/inactive state.
 */
@Component({
  selector: 'app-notification-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="p-6 pb-0">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-base-content">Notification Rules</h1>
          <p class="text-sm text-base-content/60 mt-1">
            Configure which events trigger notifications and who receives them.
          </p>
        </div>
        <button class="btn btn-primary btn-sm gap-2" (click)="openCreateModal()">
          <span class="material-symbols-outlined text-sm">add</span>
          Add Rule
        </button>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-3 mb-4">
        <select
          class="select select-bordered select-sm w-48"
          [(ngModel)]="moduleFilter"
          (ngModelChange)="loadRules()">
          <option value="">All Modules</option>
          <option *ngFor="let m of availableModules" [value]="m">{{ m }}</option>
        </select>
        <span class="text-sm text-base-content/50">
          {{ rules.length }} rule{{ rules.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- Rules Table -->
    <div class="px-6 pb-6">
      <!-- Loading -->
      <div *ngIf="loading" class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-md text-primary"></span>
        <span class="ml-3 text-sm text-base-content/60">Loading rules...</span>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && rules.length === 0" class="card bg-base-100 border border-base-200 p-12 text-center">
        <span class="material-symbols-outlined text-5xl text-base-content/20 mb-3">rule</span>
        <p class="text-base-content/60 font-medium">No notification rules configured</p>
        <p class="text-sm text-base-content/40 mt-1">Create your first rule to start routing notifications to users.</p>
        <button class="btn btn-primary btn-sm mt-4" (click)="openCreateModal()">
          <span class="material-symbols-outlined text-sm">add</span>
          Create Rule
        </button>
      </div>

      <!-- Rules Table -->
      <div *ngIf="!loading && rules.length > 0" class="card bg-base-100 border border-base-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr class="bg-base-200/50">
                <th class="font-semibold text-xs uppercase tracking-wider">Event Type</th>
                <th class="font-semibold text-xs uppercase tracking-wider">Module</th>
                <th class="font-semibold text-xs uppercase tracking-wider">Recipient</th>
                <th class="font-semibold text-xs uppercase tracking-wider">Channel</th>
                <th class="font-semibold text-xs uppercase tracking-wider">Priority</th>
                <th class="font-semibold text-xs uppercase tracking-wider">Template</th>
                <th class="font-semibold text-xs uppercase tracking-wider text-center">Active</th>
                <th class="font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let rule of rules; trackBy: trackById" class="hover:bg-base-200/30">
                <td>
                  <span class="font-mono text-xs bg-base-200 px-2 py-0.5 rounded">{{ rule.eventType }}</span>
                </td>
                <td>
                  <span class="badge badge-sm badge-outline">{{ rule.module }}</span>
                </td>
                <td>
                  <div class="text-sm">
                    <span class="text-base-content/60 text-xs">{{ rule.recipientType }}:</span>
                    <span class="ml-1 font-medium">{{ rule.recipientValue }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge badge-sm" [ngClass]="getChannelBadgeClass(rule.channel)">
                    {{ rule.channel }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-sm" [ngClass]="getPriorityBadgeClass(rule.priority)">
                    {{ rule.priority }}
                  </span>
                </td>
                <td>
                  <span *ngIf="rule.templateName" class="text-xs text-base-content/70">{{ rule.templateName }}</span>
                  <span *ngIf="!rule.templateName" class="text-xs text-base-content/30 italic">None</span>
                </td>
                <td class="text-center">
                  <input
                    type="checkbox"
                    class="toggle toggle-primary toggle-sm"
                    [checked]="rule.isActive"
                    (change)="toggleRule(rule)"
                    [attr.aria-label]="'Toggle rule ' + rule.eventType" />
                </td>
                <td class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      class="btn btn-ghost btn-xs btn-square"
                      (click)="openEditModal(rule)"
                      aria-label="Edit rule">
                      <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      class="btn btn-ghost btn-xs btn-square text-error"
                      (click)="confirmDelete(rule)"
                      aria-label="Delete rule">
                      <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Rule Modal -->
    <app-modal-shell
      *ngIf="modalOpen"
      [visible]="modalOpen"
      [title]="editingRule ? 'Edit Notification Rule' : 'Create Notification Rule'"
      [subtitle]="editingRule ? 'Update rule configuration' : 'Define a new notification routing rule'"
      [loading]="modalSaving"
      (closed)="closeModal()">

      <div class="space-y-4">
        <!-- Event Type -->
        <div class="form-control">
          <label class="label"><span class="label-text font-medium">Event Type</span></label>
          <input
            type="text"
            class="input input-bordered input-sm w-full"
            [(ngModel)]="formData.eventType"
            placeholder="e.g., OfferAccepted, OpportunityCreated" />
          <label class="label"><span class="label-text-alt text-base-content/50">The domain event that triggers this rule</span></label>
        </div>

        <!-- Module -->
        <div class="form-control">
          <label class="label"><span class="label-text font-medium">Module</span></label>
          <select class="select select-bordered select-sm w-full" [(ngModel)]="formData.module">
            <option value="">Select module</option>
            <option *ngFor="let m of allModules" [value]="m">{{ m }}</option>
          </select>
        </div>

        <!-- Description -->
        <div class="form-control">
          <label class="label"><span class="label-text font-medium">Description</span></label>
          <input
            type="text"
            class="input input-bordered input-sm w-full"
            [(ngModel)]="formData.description"
            placeholder="Human-readable description of what this rule does" />
        </div>

        <!-- Recipient Type + Value -->
        <div class="grid grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">Recipient Type</span></label>
            <select class="select select-bordered select-sm w-full" [(ngModel)]="formData.recipientType">
              <option value="Role">Role</option>
              <option value="SpecificUser">Specific User</option>
              <option value="EventCreator">Event Creator</option>
              <option value="EntityOwner">Entity Owner</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">Recipient Value</span></label>
            <input
              type="text"
              class="input input-bordered input-sm w-full"
              [(ngModel)]="formData.recipientValue"
              placeholder="e.g., FinanceDirector or userId" />
          </div>
        </div>

        <!-- Channel + Priority -->
        <div class="grid grid-cols-2 gap-3">
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">Channel</span></label>
            <select class="select select-bordered select-sm w-full" [(ngModel)]="formData.channel">
              <option value="InApp">In-App</option>
              <option value="Email">Email</option>
              <option value="Both">Both</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">Priority</span></label>
            <select class="select select-bordered select-sm w-full" [(ngModel)]="formData.priority">
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        <!-- Template -->
        <div class="form-control">
          <label class="label"><span class="label-text font-medium">Template</span></label>
          <select class="select select-bordered select-sm w-full" [(ngModel)]="formData.templateId">
            <option [ngValue]="null">No template (use default)</option>
            <option *ngFor="let t of templates" [ngValue]="t.id">{{ t.name }} ({{ t.eventType }})</option>
          </select>
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
            (click)="saveRule()">
            {{ modalSaving ? 'Saving...' : (editingRule ? 'Update Rule' : 'Create Rule') }}
          </button>
        </div>
      </div>
    </app-modal-shell>

    <!-- Delete Confirmation Modal -->
    <app-modal-shell
      *ngIf="deleteModalOpen"
      [visible]="deleteModalOpen"
      title="Delete Notification Rule"
      subtitle="This action cannot be undone"
      [loading]="deleteSaving"
      (closed)="deleteModalOpen = false">
      <div class="py-2">
        <p class="text-sm text-base-content/70">
          Are you sure you want to delete the rule for
          <span class="font-semibold">{{ deletingRule?.eventType }}</span>
          in module <span class="font-semibold">{{ deletingRule?.module }}</span>?
        </p>
      </div>
      <div modal-footer>
        <div class="flex items-center justify-end gap-2">
          <button class="btn btn-ghost btn-sm" (click)="deleteModalOpen = false">Cancel</button>
          <button class="btn btn-error btn-sm" [disabled]="deleteSaving" (click)="deleteRule()">
            {{ deleteSaving ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </app-modal-shell>
  `
})
export class NotificationRulesComponent implements OnInit, OnDestroy {
  rules: INotificationRule[] = [];
  templates: INotificationTemplate[] = [];
  loading = false;
  moduleFilter = '';

  // Modal state
  modalOpen = false;
  modalSaving = false;
  editingRule: INotificationRule | null = null;
  formData = this.getEmptyFormData();

  // Delete modal
  deleteModalOpen = false;
  deleteSaving = false;
  deletingRule: INotificationRule | null = null;

  readonly availableModules = [
    'LandAcquisition', 'PlanningApprovals', 'LegalCompliance',
    'ProjectManagement', 'Construction', 'Finance',
    'PropertyUnits', 'Sales', 'Documents'
  ];

  readonly allModules = this.availableModules;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly service: NotificationAdminService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRules();
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRules(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.service.getRules(this.moduleFilter || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.rules = res.data ?? [];
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadTemplates(): void {
    this.service.getTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.templates = res.data ?? [];
          this.cdr.markForCheck();
        }
      });
  }

  toggleRule(rule: INotificationRule): void {
    this.service.toggleRule(rule.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.rules = this.rules.map(r =>
              r.id === rule.id ? { ...r, isActive: res.data!.isActive } : r
            );
            this.cdr.markForCheck();
          }
        }
      });
  }

  openCreateModal(): void {
    this.editingRule = null;
    this.formData = this.getEmptyFormData();
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  openEditModal(rule: INotificationRule): void {
    this.editingRule = rule;
    this.formData = {
      eventType: rule.eventType,
      module: rule.module,
      description: rule.description,
      recipientType: rule.recipientType,
      recipientValue: rule.recipientValue,
      channel: rule.channel,
      priority: rule.priority,
      templateId: rule.templateId,
      isActive: rule.isActive
    };
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingRule = null;
    this.cdr.markForCheck();
  }

  isFormValid(): boolean {
    return !!(this.formData.eventType && this.formData.module && this.formData.recipientType && this.formData.recipientValue);
  }

  saveRule(): void {
    if (!this.isFormValid()) return;
    this.modalSaving = true;
    this.cdr.markForCheck();

    const obs = this.editingRule
      ? this.service.updateRule(this.editingRule.id, this.formData)
      : this.service.createRule(this.formData as any);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.modalSaving = false;
        this.modalOpen = false;
        this.editingRule = null;
        this.loadRules();
        this.cdr.markForCheck();
      },
      error: () => {
        this.modalSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  confirmDelete(rule: INotificationRule): void {
    this.deletingRule = rule;
    this.deleteModalOpen = true;
    this.cdr.markForCheck();
  }

  deleteRule(): void {
    if (!this.deletingRule) return;
    this.deleteSaving = true;
    this.cdr.markForCheck();

    this.service.deleteRule(this.deletingRule.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleteSaving = false;
          this.deleteModalOpen = false;
          this.deletingRule = null;
          this.loadRules();
          this.cdr.markForCheck();
        },
        error: () => {
          this.deleteSaving = false;
          this.cdr.markForCheck();
        }
      });
  }

  getChannelBadgeClass(channel: string): string {
    switch (channel) {
      case 'InApp': return 'badge-info';
      case 'Email': return 'badge-secondary';
      case 'Both': return 'badge-primary';
      default: return 'badge-ghost';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'Low': return 'badge-ghost';
      case 'Normal': return 'badge-info';
      case 'High': return 'badge-warning';
      case 'Urgent': return 'badge-error';
      default: return 'badge-ghost';
    }
  }

  trackById(_: number, item: INotificationRule): string {
    return item.id;
  }

  private getEmptyFormData() {
    return {
      eventType: '',
      module: '',
      description: '',
      recipientType: 'Role',
      recipientValue: '',
      channel: 'InApp',
      priority: 'Normal',
      templateId: null as string | null,
      isActive: true
    };
  }
}
