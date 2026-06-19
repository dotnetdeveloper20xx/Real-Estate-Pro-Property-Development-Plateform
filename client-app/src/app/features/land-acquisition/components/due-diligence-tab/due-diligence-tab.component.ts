import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  DestroyRef,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  IDueDiligence,
  IApiResponse,
  DueDiligenceType,
  DueDiligenceStatus
} from '../../models';
import { DueDiligenceService, ITransitionDueDiligenceStatus } from '../../services';

/**
 * Permitted status transitions for due diligence checks.
 * Maps each status to the list of valid next statuses.
 */
const DD_TRANSITIONS: Record<DueDiligenceStatus, DueDiligenceStatus[]> = {
  [DueDiligenceStatus.Pending]: [DueDiligenceStatus.InProgress],
  [DueDiligenceStatus.InProgress]: [DueDiligenceStatus.Completed, DueDiligenceStatus.Failed],
  [DueDiligenceStatus.Completed]: [],
  [DueDiligenceStatus.Failed]: []
};

/**
 * Badge CSS class mapping for due diligence statuses following the UX colour system.
 */
const DD_STATUS_BADGE: Record<DueDiligenceStatus, string> = {
  [DueDiligenceStatus.Pending]: 'badge-ghost',
  [DueDiligenceStatus.InProgress]: 'badge-warning',
  [DueDiligenceStatus.Completed]: 'badge-success',
  [DueDiligenceStatus.Failed]: 'badge-error'
};

/** Typed form interface for creating a due diligence check. */
interface IDueDiligenceForm {
  type: FormControl<DueDiligenceType>;
  findings: FormControl<string>;
}

/**
 * Smart component for the Due Diligence tab within the Opportunity Detail page.
 *
 * Displays a checklist of due diligence checks grouped by type, allows creating
 * new checks, and supports status transitions via permitted actions.
 *
 * Loads its own data via DueDiligenceService.
 * Standalone, OnPush, Tailwind + DaisyUI.
 *
 * Requirements: 5.1, 5.7
 */
@Component({
  selector: 'app-due-diligence-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header with create toggle -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-base-content">Due Diligence Checks</h3>
          <p class="text-sm text-base-content/60">
            Track legal, environmental, and planning assessments for this opportunity.
          </p>
        </div>
        <button
          class="btn btn-primary btn-sm"
          (click)="toggleCreateForm()"
          [attr.aria-expanded]="showCreateForm()"
          aria-controls="dd-create-form">
          <span class="material-symbols-outlined text-sm">{{ showCreateForm() ? 'close' : 'add' }}</span>
          {{ showCreateForm() ? 'Cancel' : 'New Check' }}
        </button>
      </div>

      <!-- Create form -->
      <div
        *ngIf="showCreateForm()"
        id="dd-create-form"
        class="card bg-base-200 shadow-sm"
        role="form"
        aria-label="Create due diligence check">
        <div class="card-body p-4">
          <h4 class="card-title text-sm">Create Due Diligence Check</h4>
          <form [formGroup]="createForm" (ngSubmit)="onSubmitCreate()" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <!-- Type field -->
            <div class="form-control w-full">
              <label class="label" for="dd-type">
                <span class="label-text">Check Type <span class="text-error">*</span></span>
              </label>
              <select
                id="dd-type"
                class="select select-bordered select-sm w-full"
                formControlName="type"
                [attr.aria-invalid]="createForm.controls.type.invalid && createForm.controls.type.touched">
                <option *ngFor="let t of ddTypes" [value]="t">{{ formatEnum(t) }}</option>
              </select>
              <label class="label" *ngIf="createForm.controls.type.invalid && createForm.controls.type.touched">
                <span class="label-text-alt text-error">Please select a check type.</span>
              </label>
            </div>

            <!-- Findings field -->
            <div class="form-control w-full">
              <label class="label" for="dd-findings">
                <span class="label-text">Initial Findings</span>
              </label>
              <textarea
                id="dd-findings"
                class="textarea textarea-bordered textarea-sm w-full"
                formControlName="findings"
                placeholder="Optional initial findings or notes..."
                rows="2">
              </textarea>
            </div>

            <!-- Submit -->
            <div class="col-span-full flex justify-end gap-2">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                (click)="toggleCreateForm()">
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary btn-sm"
                [disabled]="createForm.invalid || submitting()">
                <span *ngIf="submitting()" class="loading loading-spinner loading-xs"></span>
                Create Check
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading()" class="space-y-3">
        <div *ngFor="let i of [1, 2, 3]" class="skeleton h-16 w-full rounded-lg"></div>
      </div>

      <!-- Error state -->
      <div *ngIf="error()" class="alert alert-error shadow-sm" role="alert">
        <span class="material-symbols-outlined">error</span>
        <div>
          <p class="font-medium">Failed to load due diligence checks</p>
          <p class="text-sm">{{ error() }}</p>
        </div>
        <button class="btn btn-ghost btn-sm" (click)="loadChecks()">Retry</button>
      </div>

      <!-- Empty state -->
      <div
        *ngIf="!loading() && !error() && checks().length === 0"
        class="flex flex-col items-center justify-center py-12 text-base-content/50">
        <span class="material-symbols-outlined text-5xl mb-3">fact_check</span>
        <p class="text-base font-medium">No Due Diligence Checks</p>
        <p class="text-sm mt-1">Create your first check to begin evaluating this opportunity.</p>
      </div>

      <!-- Checklist grid -->
      <div *ngIf="!loading() && !error() && checks().length > 0" class="space-y-3">
        <div
          *ngFor="let check of checks(); trackBy: trackById"
          class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow"
          [attr.aria-label]="'Due diligence check: ' + formatEnum(check.type)">
          <div class="card-body p-4">
            <div class="flex items-start justify-between gap-4">
              <!-- Check info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="font-medium text-base-content">{{ formatEnum(check.type) }}</h4>
                  <span
                    class="badge badge-sm font-medium"
                    [ngClass]="getStatusBadgeClass(check.status)"
                    role="status"
                    [attr.aria-label]="'Status: ' + formatEnum(check.status)">
                    {{ formatEnum(check.status) }}
                  </span>
                </div>
                <p *ngIf="check.findings" class="text-sm text-base-content/70 mt-1 line-clamp-2">
                  {{ check.findings }}
                </p>
                <div class="flex items-center gap-4 mt-2 text-xs text-base-content/50">
                  <span>Created: {{ check.createdAt | date:'dd MMM yyyy' }}</span>
                  <span *ngIf="check.reportDate">Completed: {{ check.reportDate | date:'dd MMM yyyy' }}</span>
                </div>
              </div>

              <!-- Status transition actions -->
              <div class="flex gap-1 flex-shrink-0" *ngIf="getPermittedTransitions(check.status).length > 0">
                <button
                  *ngFor="let nextStatus of getPermittedTransitions(check.status)"
                  class="btn btn-xs"
                  [ngClass]="getTransitionButtonClass(nextStatus)"
                  (click)="onTransitionStatus(check, nextStatus)"
                  [disabled]="transitioning()"
                  [attr.aria-label]="'Transition to ' + formatEnum(nextStatus)">
                  {{ getTransitionLabel(nextStatus) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary footer -->
      <div *ngIf="!loading() && checks().length > 0" class="stats stats-horizontal shadow-sm bg-base-200 w-full">
        <div class="stat py-2 px-4">
          <div class="stat-title text-xs">Total</div>
          <div class="stat-value text-lg">{{ checks().length }}</div>
        </div>
        <div class="stat py-2 px-4">
          <div class="stat-title text-xs">Completed</div>
          <div class="stat-value text-lg text-success">{{ completedCount() }}</div>
        </div>
        <div class="stat py-2 px-4">
          <div class="stat-title text-xs">Failed</div>
          <div class="stat-value text-lg text-error">{{ failedCount() }}</div>
        </div>
        <div class="stat py-2 px-4">
          <div class="stat-title text-xs">Pending</div>
          <div class="stat-value text-lg text-warning">{{ pendingCount() }}</div>
        </div>
      </div>
    </div>
  `
})
export class DueDiligenceTabComponent implements OnInit {
  @Input({ required: true }) opportunityId!: string;

  private readonly fb = inject(FormBuilder);
  private readonly ddService = inject(DueDiligenceService);
  private readonly destroyRef = inject(DestroyRef);

  /** All available due diligence types for the create form. */
  readonly ddTypes = Object.values(DueDiligenceType);

  /** Reactive signals for component state. */
  readonly checks = signal<IDueDiligence[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showCreateForm = signal(false);
  readonly submitting = signal(false);
  readonly transitioning = signal(false);

  /** Computed summary counts. */
  readonly completedCount = computed(() =>
    this.checks().filter((c: IDueDiligence) => c.status === DueDiligenceStatus.Completed).length
  );
  readonly failedCount = computed(() =>
    this.checks().filter((c: IDueDiligence) => c.status === DueDiligenceStatus.Failed).length
  );
  readonly pendingCount = computed(() =>
    this.checks().filter((c: IDueDiligence) =>
      c.status === DueDiligenceStatus.Pending || c.status === DueDiligenceStatus.InProgress
    ).length
  );

  /** Typed reactive form for creating a due diligence check. */
  readonly createForm: FormGroup<IDueDiligenceForm> = this.fb.group({
    type: this.fb.nonNullable.control(DueDiligenceType.Legal, [Validators.required]),
    findings: this.fb.nonNullable.control('')
  });

  ngOnInit(): void {
    this.loadChecks();
  }

  /** Loads due diligence checks from the API. */
  loadChecks(): void {
    this.loading.set(true);
    this.error.set(null);

    this.ddService
      .getByOpportunity(this.opportunityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<IDueDiligence[]>) => {
          if (response.success && response.data) {
            this.checks.set([...response.data]);
          } else {
            this.error.set(response.errors?.[0] ?? 'Unexpected error loading checks.');
          }
          this.loading.set(false);
        },
        error: (err: { message?: string }) => {
          this.error.set(err?.message ?? 'Network error. Please try again.');
          this.loading.set(false);
        }
      });
  }

  /** Toggles the create form visibility. */
  toggleCreateForm(): void {
    this.showCreateForm.update((v: boolean) => !v);
    if (!this.showCreateForm()) {
      this.createForm.reset({ type: DueDiligenceType.Legal, findings: '' });
    }
  }

  /** Submits the create form to create a new due diligence check. */
  onSubmitCreate(): void {
    if (this.createForm.invalid) return;

    this.submitting.set(true);
    const { type, findings } = this.createForm.getRawValue();

    this.ddService
      .create(this.opportunityId, {
        type,
        findings: findings || null
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<IDueDiligence>) => {
          if (response.success && response.data) {
            this.checks.update((current: IDueDiligence[]) => [...current, response.data!]);
            this.toggleCreateForm();
          }
          this.submitting.set(false);
        },
        error: () => {
          this.submitting.set(false);
        }
      });
  }

  /** Transitions a due diligence check to a new status. */
  onTransitionStatus(check: IDueDiligence, newStatus: DueDiligenceStatus): void {
    this.transitioning.set(true);

    const dto: ITransitionDueDiligenceStatus = { targetStatus: newStatus };

    this.ddService
      .transitionStatus(this.opportunityId, check.id, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<IDueDiligence>) => {
          if (response.success && response.data) {
            this.checks.update((current: IDueDiligence[]) =>
              current.map((c: IDueDiligence) => c.id === check.id ? response.data! : c)
            );
          }
          this.transitioning.set(false);
        },
        error: () => {
          this.transitioning.set(false);
        }
      });
  }

  /** Returns permitted next statuses for a given status. */
  getPermittedTransitions(status: DueDiligenceStatus): DueDiligenceStatus[] {
    return DD_TRANSITIONS[status] ?? [];
  }

  /** Returns DaisyUI badge class for a due diligence status. */
  getStatusBadgeClass(status: DueDiligenceStatus): string {
    return DD_STATUS_BADGE[status] ?? 'badge-ghost';
  }

  /** Returns a human-readable label for a transition action button. */
  getTransitionLabel(status: DueDiligenceStatus): string {
    switch (status) {
      case DueDiligenceStatus.InProgress: return 'Start';
      case DueDiligenceStatus.Completed: return 'Complete';
      case DueDiligenceStatus.Failed: return 'Mark Failed';
      default: return this.formatEnum(status);
    }
  }

  /** Returns button styling class based on the target status. */
  getTransitionButtonClass(status: DueDiligenceStatus): string {
    switch (status) {
      case DueDiligenceStatus.InProgress: return 'btn-warning';
      case DueDiligenceStatus.Completed: return 'btn-success';
      case DueDiligenceStatus.Failed: return 'btn-error';
      default: return 'btn-ghost';
    }
  }

  /** Formats an enum value from PascalCase to spaced words. */
  formatEnum(value: string): string {
    if (!value) return '';
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /** TrackBy function for ngFor performance. */
  trackById(_index: number, item: IDueDiligence): string {
    return item.id;
  }
}
