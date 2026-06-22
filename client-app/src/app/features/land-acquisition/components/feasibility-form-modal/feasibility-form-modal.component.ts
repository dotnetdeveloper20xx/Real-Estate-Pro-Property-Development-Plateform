import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalComponent, CurrencyDisplayComponent } from '../../../../shared/design-system';
import { FeasibilityService } from '../../services';
import { ToastService } from '../../../../core/services/toast.service';
import { IFeasibilityAssessment, FeasibilityScenario, ICreateFeasibility } from '../../models';

/**
 * Modal for creating or editing a feasibility assessment on an opportunity.
 * Includes auto-calculated summary fields: Total Costs, Profit, and ROI%.
 *
 * Usage:
 * ```html
 * <app-feasibility-form-modal
 *   [visible]="showFeasibilityModal"
 *   [opportunityId]="opportunityId"
 *   [editMode]="true"
 *   [existingAssessment]="selectedAssessment"
 *   (closed)="showFeasibilityModal = false"
 *   (saved)="onFeasibilitySaved()">
 * </app-feasibility-form-modal>
 * ```
 */
@Component({
  selector: 'app-feasibility-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CurrencyDisplayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [visible]="visible"
      [title]="editMode ? 'Edit Feasibility Assessment' : 'Create Feasibility Assessment'"
      icon="analytics"
      size="lg"
      [loading]="loading"
      (closed)="onClose()">

      <!-- Form body -->
      <form #feasibilityForm="ngForm" (ngSubmit)="onSave()">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Estimated Land Cost -->
          <div class="form-control w-full">
            <label class="label" for="feas-land-cost">
              <span class="label-text font-medium">Estimated Land Cost (£) <span class="text-error">*</span></span>
            </label>
            <app-currency
              mode="edit"
              [(ngModel)]="estimatedLandCost"
              name="estimatedLandCost"
              #landCostField="ngModel"
              [required]="true">
            </app-currency>
            <label class="label" *ngIf="landCostField.touched && estimatedLandCost <= 0">
              <span class="label-text-alt text-error">Please enter a positive amount</span>
            </label>
          </div>

          <!-- Estimated Build Cost -->
          <div class="form-control w-full">
            <label class="label" for="feas-build-cost">
              <span class="label-text font-medium">Estimated Build Cost (£) <span class="text-error">*</span></span>
            </label>
            <app-currency
              mode="edit"
              [(ngModel)]="estimatedBuildCost"
              name="estimatedBuildCost"
              #buildCostField="ngModel"
              [required]="true">
            </app-currency>
            <label class="label" *ngIf="buildCostField.touched && estimatedBuildCost <= 0">
              <span class="label-text-alt text-error">Please enter a positive amount</span>
            </label>
          </div>

          <!-- Professional Fees -->
          <div class="form-control w-full">
            <label class="label" for="feas-fees">
              <span class="label-text font-medium">Professional Fees (£) <span class="text-error">*</span></span>
            </label>
            <app-currency
              mode="edit"
              [(ngModel)]="professionalFees"
              name="professionalFees"
              #feesField="ngModel"
              [required]="true">
            </app-currency>
            <label class="label" *ngIf="feesField.touched && professionalFees < 0">
              <span class="label-text-alt text-error">Please enter a valid amount</span>
            </label>
          </div>

          <!-- Finance Costs -->
          <div class="form-control w-full">
            <label class="label" for="feas-finance">
              <span class="label-text font-medium">Finance Costs (£) <span class="text-error">*</span></span>
            </label>
            <app-currency
              mode="edit"
              [(ngModel)]="financeCosts"
              name="financeCosts"
              #financeField="ngModel"
              [required]="true">
            </app-currency>
            <label class="label" *ngIf="financeField.touched && financeCosts < 0">
              <span class="label-text-alt text-error">Please enter a valid amount</span>
            </label>
          </div>

          <!-- Expected Sales Revenue -->
          <div class="form-control w-full">
            <label class="label" for="feas-revenue">
              <span class="label-text font-medium">Expected Sales Revenue (£) <span class="text-error">*</span></span>
            </label>
            <app-currency
              mode="edit"
              [(ngModel)]="expectedSalesRevenue"
              name="expectedSalesRevenue"
              #revenueField="ngModel"
              [required]="true">
            </app-currency>
            <label class="label" *ngIf="revenueField.touched && expectedSalesRevenue <= 0">
              <span class="label-text-alt text-error">Please enter a positive amount</span>
            </label>
          </div>

          <!-- Scenario -->
          <div class="form-control w-full">
            <label class="label" for="feas-scenario">
              <span class="label-text font-medium">Scenario <span class="text-error">*</span></span>
            </label>
            <select
              id="feas-scenario"
              class="select select-bordered select-sm w-full"
              [(ngModel)]="scenario"
              name="scenario"
              #scenarioField="ngModel"
              required
              aria-label="Feasibility scenario">
              <option value="" disabled>Select scenario</option>
              <option [value]="FeasibilityScenario.BestCase">Best Case</option>
              <option [value]="FeasibilityScenario.Expected">Expected</option>
              <option [value]="FeasibilityScenario.WorstCase">Worst Case</option>
            </select>
            <label class="label" *ngIf="scenarioField.touched && !scenario">
              <span class="label-text-alt text-error">Please select a scenario</span>
            </label>
          </div>
        </div>

        <!-- Auto-Calculated Summary -->
        <div class="divider text-xs text-base-content/50 my-4">Calculated Summary</div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="stat bg-base-200/50 rounded-lg p-3">
            <div class="stat-title text-xs">Total Costs</div>
            <div class="stat-value text-sm font-bold">£{{ totalCosts | number:'1.0-0' }}</div>
          </div>
          <div class="stat rounded-lg p-3" [class.bg-success/10]="profit > 0" [class.bg-error/10]="profit <= 0">
            <div class="stat-title text-xs">Profit</div>
            <div class="stat-value text-sm font-bold" [class.text-success]="profit > 0" [class.text-error]="profit <= 0">
              £{{ profit | number:'1.0-0' }}
            </div>
          </div>
          <div class="stat rounded-lg p-3" [class.bg-success/10]="roi > 0" [class.bg-error/10]="roi <= 0">
            <div class="stat-title text-xs">ROI</div>
            <div class="stat-value text-sm font-bold" [class.text-success]="roi > 0" [class.text-error]="roi <= 0">
              {{ roi | number:'1.1-1' }}%
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div *ngIf="errorMessage" class="alert alert-error text-sm mt-4" role="alert">
          <span class="material-symbols-outlined text-sm">error</span>
          <span>{{ errorMessage }}</span>
        </div>
      </form>

      <!-- Footer -->
      <div modal-footer class="flex justify-end gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          (click)="onClose()"
          [disabled]="loading">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          (click)="onSave()"
          [disabled]="loading || !isFormValid">
          <span *ngIf="loading" class="loading loading-spinner loading-xs"></span>
          {{ editMode ? 'Update Assessment' : 'Save Assessment' }}
        </button>
      </div>
    </app-modal>
  `
})
export class FeasibilityFormModalComponent implements OnChanges {
  /** Controls modal visibility */
  @Input() visible = false;

  /** The opportunity this assessment belongs to */
  @Input() opportunityId = '';

  /** Whether this modal is in edit mode */
  @Input() editMode = false;

  /** Existing assessment data for edit mode */
  @Input() existingAssessment: IFeasibilityAssessment | null = null;

  /** Emitted when the modal is closed */
  @Output() closed = new EventEmitter<void>();

  /** Emitted on successful save */
  @Output() saved = new EventEmitter<void>();

  private readonly feasibilityService = inject(FeasibilityService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Expose enum to template */
  readonly FeasibilityScenario = FeasibilityScenario;

  /** Form fields */
  estimatedLandCost = 0;
  estimatedBuildCost = 0;
  professionalFees = 0;
  financeCosts = 0;
  expectedSalesRevenue = 0;
  scenario: FeasibilityScenario | '' = '';
  loading = false;
  errorMessage = '';

  /** Auto-calculated: Total Costs */
  get totalCosts(): number {
    return this.estimatedLandCost + this.estimatedBuildCost + this.professionalFees + this.financeCosts;
  }

  /** Auto-calculated: Profit */
  get profit(): number {
    return this.expectedSalesRevenue - this.totalCosts;
  }

  /** Auto-calculated: ROI % */
  get roi(): number {
    if (this.totalCosts === 0) return 0;
    return (this.profit / this.totalCosts) * 100;
  }

  /** Form validity check */
  get isFormValid(): boolean {
    return (
      this.estimatedLandCost > 0 &&
      this.estimatedBuildCost > 0 &&
      this.professionalFees >= 0 &&
      this.financeCosts >= 0 &&
      this.expectedSalesRevenue > 0 &&
      !!this.scenario
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
      if (this.editMode && this.existingAssessment) {
        this.estimatedLandCost = this.existingAssessment.estimatedLandCost;
        this.estimatedBuildCost = this.existingAssessment.estimatedBuildCost;
        this.professionalFees = this.existingAssessment.professionalFees;
        this.financeCosts = this.existingAssessment.financeCosts;
        this.expectedSalesRevenue = this.existingAssessment.expectedSalesRevenue;
        this.scenario = this.existingAssessment.scenario;
      }
    }
  }

  /** Handle form submission */
  onSave(): void {
    if (!this.isFormValid || this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const dto: ICreateFeasibility = {
      estimatedLandCost: this.estimatedLandCost,
      estimatedBuildCost: this.estimatedBuildCost,
      professionalFees: this.professionalFees,
      financeCosts: this.financeCosts,
      expectedSalesRevenue: this.expectedSalesRevenue,
      scenario: this.scenario as FeasibilityScenario
    };

    this.feasibilityService.createOrUpdate(this.opportunityId, dto).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.toastService.showSuccess(
            this.editMode ? 'Feasibility assessment updated successfully' : 'Feasibility assessment created successfully'
          );
          this.saved.emit();
          this.closed.emit();
        } else {
          this.errorMessage = response.errors?.[0] || 'Failed to save feasibility assessment';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.errors?.[0] || 'An unexpected error occurred. Please try again.';
        this.toastService.showError('Failed to save feasibility assessment');
        this.cdr.markForCheck();
      }
    });
  }

  /** Close the modal */
  onClose(): void {
    if (this.loading) return;
    this.closed.emit();
  }

  /** Reset form to initial state */
  private resetForm(): void {
    this.estimatedLandCost = 0;
    this.estimatedBuildCost = 0;
    this.professionalFees = 0;
    this.financeCosts = 0;
    this.expectedSalesRevenue = 0;
    this.scenario = '';
    this.loading = false;
    this.errorMessage = '';
  }
}
