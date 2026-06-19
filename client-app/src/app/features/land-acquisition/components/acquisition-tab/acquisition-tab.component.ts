import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AcquisitionService } from '../../services/acquisition.service';
import { ToastService } from '@core/services/toast.service';
import {
  AcquisitionStatus,
  ICreateAcquisition,
  ILandAcquisitionRecord
} from '../../models/acquisition.model';
import { OpportunityStatus } from '../../models/opportunity.model';
import { IApiResponse } from '../../models/shared.model';

/**
 * Smart component for the Acquisition tab within the Opportunity Detail page.
 *
 * Displays only when opportunity status is UnderContract or Acquired.
 * Allows creating a single acquisition record with purchase details and
 * provides functionality to mark as Registered once land registry is confirmed.
 *
 * Uses template-driven forms (FormsModule) with inline validation.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
@Component({
  selector: 'app-acquisition-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Only show content when status is UnderContract or Acquired -->
    @if (!isVisibleForStatus()) {
      <div></div>
    } @else {
      <div class="space-y-6">
        <!-- Loading state -->
        @if (loading()) {
          <div class="space-y-3">
            <div class="skeleton h-16 w-full rounded-lg"></div>
            <div class="skeleton h-16 w-full rounded-lg"></div>
          </div>
        }

        <!-- Error state -->
        @if (error()) {
          <div class="alert alert-error shadow-sm" role="alert">
            <span class="material-symbols-outlined">error</span>
            <div>
              <p class="font-medium">Failed to load acquisition record</p>
              <p class="text-sm">{{ error() }}</p>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="loadAcquisition()">Retry</button>
          </div>
        }

        <!-- Record exists: display details -->
        @if (!loading() && !error() && record()) {
          <div class="card bg-base-100 border border-base-200 shadow-sm">
            <div class="card-body p-5">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-base-content flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">real_estate_agent</span>
                  Acquisition Record
                </h3>
                <span
                  class="badge font-medium"
                  [ngClass]="getStatusBadgeClass(record()!.status)"
                  role="status"
                  [attr.aria-label]="'Status: ' + record()!.status">
                  {{ record()!.status }}
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="stat bg-base-200/50 rounded-lg p-3">
                  <div class="stat-title text-xs">Purchase Price</div>
                  <div class="stat-value text-lg text-primary">{{ record()!.purchasePrice | currency:'GBP':'symbol':'1.2-2' }}</div>
                </div>
                <div class="stat bg-base-200/50 rounded-lg p-3">
                  <div class="stat-title text-xs">Completion Date</div>
                  <div class="stat-value text-lg">{{ record()!.completionDate | date:'dd MMM yyyy' }}</div>
                </div>
                <div class="stat bg-base-200/50 rounded-lg p-3">
                  <div class="stat-title text-xs">Registry Reference</div>
                  <div class="stat-value text-lg">{{ record()!.registryRef }}</div>
                </div>
              </div>

              <!-- Mark as Registered button -->
              @if (record()!.status === AcquisitionStatus.Completed) {
                <div class="flex justify-end mt-4">
                  <button
                    class="btn btn-success btn-sm gap-1"
                    (click)="markAsRegistered()"
                    [disabled]="updatingStatus()"
                    aria-label="Mark acquisition as registered">
                    @if (updatingStatus()) {
                      <span class="loading loading-spinner loading-xs"></span>
                    }
                    <span class="material-symbols-outlined text-sm">how_to_reg</span>
                    Mark as Registered
                  </button>
                </div>
              }

              <div class="text-xs text-base-content/50 mt-3">
                Created: {{ record()!.createdAt | date:'dd MMM yyyy HH:mm' }}
              </div>
            </div>
          </div>
        }

        <!-- No record: show create form -->
        @if (!loading() && !error() && !record()) {
          <div class="card bg-base-200/30 border border-primary/20 shadow-sm">
            <div class="card-body p-5">
              <h3 class="text-base font-semibold text-base-content flex items-center gap-2 mb-1">
                <span class="material-symbols-outlined text-primary">add_circle</span>
                Create Acquisition Record
              </h3>
              <p class="text-sm text-base-content/60 mb-4">
                Record the purchase details for this land opportunity. All fields are required.
              </p>

              <form
                #acquisitionForm="ngForm"
                (ngSubmit)="onSubmitCreate(acquisitionForm)"
                class="grid grid-cols-1 md:grid-cols-3 gap-4"
                novalidate>

                <!-- Purchase Price -->
                <div class="form-control w-full">
                  <label class="label" for="acq-price">
                    <span class="label-text font-medium">Purchase Price <span class="text-error">*</span></span>
                  </label>
                  <label class="input input-bordered input-sm flex items-center gap-1"
                    [class.input-error]="priceField.invalid && priceField.touched">
                    <span class="text-base-content/60 font-medium">£</span>
                    <input
                      id="acq-price"
                      type="number"
                      name="purchasePrice"
                      class="grow"
                      placeholder="e.g. 750000"
                      [(ngModel)]="formModel.purchasePrice"
                      #priceField="ngModel"
                      required
                      [min]="0.01"
                      step="0.01"
                      aria-describedby="price-help"
                      [attr.aria-invalid]="priceField.invalid && priceField.touched" />
                  </label>
                  @if (priceField.invalid && priceField.touched) {
                    <label class="label" id="price-help">
                      <span class="label-text-alt text-error">
                        Please enter a positive purchase price.
                      </span>
                    </label>
                  }
                </div>

                <!-- Completion Date -->
                <div class="form-control w-full">
                  <label class="label" for="acq-date">
                    <span class="label-text font-medium">Completion Date <span class="text-error">*</span></span>
                  </label>
                  <input
                    id="acq-date"
                    type="date"
                    name="completionDate"
                    class="input input-bordered input-sm w-full"
                    [class.input-error]="dateField.invalid && dateField.touched"
                    [(ngModel)]="formModel.completionDate"
                    #dateField="ngModel"
                    required
                    [max]="todayDate"
                    aria-describedby="date-help"
                    [attr.aria-invalid]="dateField.invalid && dateField.touched" />
                  @if (dateField.invalid && dateField.touched) {
                    <label class="label" id="date-help">
                      <span class="label-text-alt text-error">
                        Please enter a valid date (today or earlier).
                      </span>
                    </label>
                  }
                </div>

                <!-- Registry Reference -->
                <div class="form-control w-full">
                  <label class="label" for="acq-registry">
                    <span class="label-text font-medium">Registry Reference <span class="text-error">*</span></span>
                  </label>
                  <input
                    id="acq-registry"
                    type="text"
                    name="registryRef"
                    class="input input-bordered input-sm w-full"
                    [class.input-error]="registryField.invalid && registryField.touched"
                    [(ngModel)]="formModel.registryRef"
                    #registryField="ngModel"
                    required
                    minlength="3"
                    maxlength="50"
                    placeholder="e.g. LN123456"
                    aria-describedby="registry-help"
                    [attr.aria-invalid]="registryField.invalid && registryField.touched" />
                  @if (registryField.invalid && registryField.touched) {
                    <label class="label" id="registry-help">
                      <span class="label-text-alt text-error">
                        Registry reference must be between 3 and 50 characters.
                      </span>
                    </label>
                  }
                </div>

                <!-- Submit -->
                <div class="col-span-full flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    class="btn btn-primary btn-sm gap-1"
                    [disabled]="acquisitionForm.invalid || submitting()">
                    @if (submitting()) {
                      <span class="loading loading-spinner loading-xs"></span>
                    }
                    <span class="material-symbols-outlined text-sm">save</span>
                    Create Acquisition Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class AcquisitionTabComponent implements OnInit {
  @Input({ required: true }) opportunityId!: string;
  @Input({ required: true }) opportunityStatus!: OpportunityStatus;

  private readonly acquisitionService = inject(AcquisitionService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  /** Expose enum to template. */
  readonly AcquisitionStatus = AcquisitionStatus;

  /** Reactive state signals. */
  readonly record = signal<ILandAcquisitionRecord | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly updatingStatus = signal(false);

  /** Today's date in YYYY-MM-DD format for the date picker max constraint. */
  readonly todayDate = new Date().toISOString().split('T')[0];

  /** Template-driven form model. */
  formModel = {
    purchasePrice: null as number | null,
    completionDate: '',
    registryRef: ''
  };

  ngOnInit(): void {
    if (this.isVisibleForStatus()) {
      this.loadAcquisition();
    }
  }

  /**
   * Determines whether the Acquisition tab content should be visible.
   * Only shown for UnderContract or Acquired statuses.
   */
  isVisibleForStatus(): boolean {
    return (
      this.opportunityStatus === OpportunityStatus.UnderContract ||
      this.opportunityStatus === OpportunityStatus.Acquired
    );
  }

  /** Loads the existing acquisition record from the API. */
  loadAcquisition(): void {
    this.loading.set(true);
    this.error.set(null);

    this.acquisitionService
      .getByOpportunity(this.opportunityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<ILandAcquisitionRecord[]>) => {
          if (response.success && response.data && response.data.length > 0) {
            this.record.set(response.data[0]);
          } else {
            this.record.set(null);
          }
          this.loading.set(false);
        },
        error: (err: { message?: string }) => {
          this.error.set(err?.message ?? 'Network error. Please try again.');
          this.loading.set(false);
        }
      });
  }

  /** Submits the create form to create a new acquisition record. */
  onSubmitCreate(form: { valid: boolean }): void {
    if (!form.valid) return;

    this.submitting.set(true);

    const dto: ICreateAcquisition = {
      purchasePrice: this.formModel.purchasePrice!,
      completionDate: this.formModel.completionDate,
      registryRef: this.formModel.registryRef.trim()
    };

    this.acquisitionService
      .create(this.opportunityId, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<ILandAcquisitionRecord>) => {
          if (response.success && response.data) {
            this.record.set(response.data);
            this.toast.showSuccess('Acquisition record created successfully.');
          } else {
            this.toast.showError(response.errors?.[0] ?? 'Failed to create acquisition record.');
          }
          this.submitting.set(false);
        },
        error: (err: { error?: { errors?: string[] }; message?: string }) => {
          const message = err?.error?.errors?.[0] ?? err?.message ?? 'Failed to create acquisition record.';
          this.toast.showError(message);
          this.submitting.set(false);
        }
      });
  }

  /** Marks the acquisition record as Registered. */
  markAsRegistered(): void {
    const currentRecord = this.record();
    if (!currentRecord) return;

    this.updatingStatus.set(true);

    this.acquisitionService
      .updateStatus(this.opportunityId, currentRecord.id, AcquisitionStatus.Registered)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<ILandAcquisitionRecord>) => {
          if (response.success && response.data) {
            this.record.set(response.data);
            this.toast.showSuccess('Acquisition marked as registered.');
          } else {
            this.toast.showError(response.errors?.[0] ?? 'Failed to update status.');
          }
          this.updatingStatus.set(false);
        },
        error: (err: { error?: { errors?: string[] }; message?: string }) => {
          const message = err?.error?.errors?.[0] ?? err?.message ?? 'Failed to update status.';
          this.toast.showError(message);
          this.updatingStatus.set(false);
        }
      });
  }

  /** Returns DaisyUI badge class for acquisition status. */
  getStatusBadgeClass(status: AcquisitionStatus): string {
    switch (status) {
      case AcquisitionStatus.Completed:
        return 'badge-info';
      case AcquisitionStatus.Registered:
        return 'badge-success';
      default:
        return 'badge-ghost';
    }
  }
}
