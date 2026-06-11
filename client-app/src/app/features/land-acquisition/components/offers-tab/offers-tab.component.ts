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
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { IOffer, IApiResponse, OfferStatus } from '../../models';
import { OfferService, ITransitionOfferStatus } from '../../services';

/**
 * Permitted status transitions for offers.
 */
const OFFER_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  [OfferStatus.UnderReview]: [OfferStatus.Accepted, OfferStatus.Rejected, OfferStatus.CounterOffered],
  [OfferStatus.CounterOffered]: [OfferStatus.UnderReview, OfferStatus.Accepted, OfferStatus.Rejected],
  [OfferStatus.Accepted]: [],
  [OfferStatus.Rejected]: [],
  [OfferStatus.Expired]: []
};

/**
 * Badge CSS class mapping for offer statuses.
 */
const OFFER_STATUS_BADGE: Record<OfferStatus, string> = {
  [OfferStatus.UnderReview]: 'badge-info',
  [OfferStatus.Accepted]: 'badge-success',
  [OfferStatus.Rejected]: 'badge-error',
  [OfferStatus.CounterOffered]: 'badge-warning',
  [OfferStatus.Expired]: 'badge-ghost'
};

/** Typed form interface for creating an offer. */
interface IOfferForm {
  amount: FormControl<number>;
  currency: FormControl<string>;
  validUntil: FormControl<string>;
}

/**
 * Smart component for the Offers tab within the Opportunity Detail page.
 *
 * Displays a list of offers ordered by date descending, allows creating
 * new offers, shows counter-offer amounts, and supports status transitions.
 *
 * Loads its own data via OfferService.
 * Standalone, OnPush, Tailwind + DaisyUI.
 *
 * Requirements: 7.1, 7.6
 */
@Component({
  selector: 'app-offers-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header with create toggle -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-base-content">Offers & Negotiations</h3>
          <p class="text-sm text-base-content/60">
            Manage offers, counter-offers, and track negotiation progress.
          </p>
        </div>
        <button
          class="btn btn-primary btn-sm"
          (click)="toggleCreateForm()"
          [attr.aria-expanded]="showCreateForm()"
          aria-controls="offer-create-form">
          <span class="material-symbols-outlined text-sm">{{ showCreateForm() ? 'close' : 'add' }}</span>
          {{ showCreateForm() ? 'Cancel' : 'New Offer' }}
        </button>
      </div>

      <!-- Create offer form -->
      <div
        *ngIf="showCreateForm()"
        id="offer-create-form"
        class="card bg-base-200 shadow-sm"
        role="form"
        aria-label="Create new offer">
        <div class="card-body p-4">
          <h4 class="card-title text-sm">Submit New Offer</h4>
          <p class="text-xs text-base-content/60 mt-1">
            Enter the offer amount, currency, and validity period.
          </p>
          <form [formGroup]="createForm" (ngSubmit)="onSubmitCreate()" class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <!-- Amount -->
            <div class="form-control w-full">
              <label class="label" for="offer-amount">
                <span class="label-text">Amount <span class="text-error">*</span></span>
              </label>
              <input
                id="offer-amount"
                type="number"
                class="input input-bordered input-sm w-full"
                formControlName="amount"
                placeholder="e.g. 500000"
                min="0.01"
                step="0.01"
                [attr.aria-invalid]="createForm.controls.amount.invalid && createForm.controls.amount.touched" />
              <label class="label" *ngIf="createForm.controls.amount.invalid && createForm.controls.amount.touched">
                <span class="label-text-alt text-error">Amount must be a positive number.</span>
              </label>
            </div>

            <!-- Currency -->
            <div class="form-control w-full">
              <label class="label" for="offer-currency">
                <span class="label-text">Currency <span class="text-error">*</span></span>
              </label>
              <select
                id="offer-currency"
                class="select select-bordered select-sm w-full"
                formControlName="currency"
                [attr.aria-invalid]="createForm.controls.currency.invalid && createForm.controls.currency.touched">
                <option *ngFor="let cur of currencies" [value]="cur">{{ cur }}</option>
              </select>
              <label class="label" *ngIf="createForm.controls.currency.invalid && createForm.controls.currency.touched">
                <span class="label-text-alt text-error">Please select a currency.</span>
              </label>
            </div>

            <!-- Valid Until -->
            <div class="form-control w-full">
              <label class="label" for="offer-valid-until">
                <span class="label-text">Valid Until <span class="text-error">*</span></span>
              </label>
              <input
                id="offer-valid-until"
                type="date"
                class="input input-bordered input-sm w-full"
                formControlName="validUntil"
                [min]="minDate"
                [attr.aria-invalid]="createForm.controls.validUntil.invalid && createForm.controls.validUntil.touched" />
              <label class="label" *ngIf="createForm.controls.validUntil.invalid && createForm.controls.validUntil.touched">
                <span class="label-text-alt text-error">Must be a future date.</span>
              </label>
            </div>

            <!-- Submit row -->
            <div class="col-span-full flex justify-end gap-2">
              <button type="button" class="btn btn-ghost btn-sm" (click)="toggleCreateForm()">
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary btn-sm"
                [disabled]="createForm.invalid || submitting()">
                <span *ngIf="submitting()" class="loading loading-spinner loading-xs"></span>
                Submit Offer
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Counter-offer modal -->
      <dialog
        *ngIf="showCounterOfferModal()"
        class="modal modal-open"
        role="dialog"
        aria-label="Record counter-offer amount">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Record Counter-Offer</h3>
          <p class="py-2 text-sm text-base-content/70">
            Enter the counter-offer amount proposed by the land owner.
          </p>
          <div class="form-control w-full mt-2">
            <label class="label" for="counter-amount">
              <span class="label-text">Counter-Offer Amount <span class="text-error">*</span></span>
            </label>
            <input
              id="counter-amount"
              type="number"
              class="input input-bordered w-full"
              [formControl]="counterOfferAmountControl"
              placeholder="e.g. 550000"
              min="0.01"
              step="0.01" />
          </div>
          <div class="modal-action">
            <button class="btn btn-ghost" (click)="cancelCounterOffer()">Cancel</button>
            <button
              class="btn btn-warning"
              [disabled]="counterOfferAmountControl.invalid || transitioning()"
              (click)="confirmCounterOffer()">
              <span *ngIf="transitioning()" class="loading loading-spinner loading-xs"></span>
              Confirm Counter-Offer
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button (click)="cancelCounterOffer()">close</button>
        </form>
      </dialog>

      <!-- Loading state -->
      <div *ngIf="loading()" class="space-y-3">
        <div *ngFor="let i of [1, 2, 3]" class="skeleton h-20 w-full rounded-lg"></div>
      </div>

      <!-- Error state -->
      <div *ngIf="error()" class="alert alert-error shadow-sm" role="alert">
        <span class="material-symbols-outlined">error</span>
        <div>
          <p class="font-medium">Failed to load offers</p>
          <p class="text-sm">{{ error() }}</p>
        </div>
        <button class="btn btn-ghost btn-sm" (click)="loadOffers()">Retry</button>
      </div>

      <!-- Empty state -->
      <div
        *ngIf="!loading() && !error() && offers().length === 0"
        class="flex flex-col items-center justify-center py-12 text-base-content/50">
        <span class="material-symbols-outlined text-5xl mb-3">local_offer</span>
        <p class="text-base font-medium">No Offers Yet</p>
        <p class="text-sm mt-1">Submit your first offer to begin negotiations with the land owner.</p>
      </div>

      <!-- Offers list -->
      <div *ngIf="!loading() && !error() && offers().length > 0" class="space-y-3">
        <div
          *ngFor="let offer of sortedOffers(); trackBy: trackById"
          class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow"
          [attr.aria-label]="'Offer: ' + (offer.amount | currency:offer.currency:'symbol':'1.0-0')">
          <div class="card-body p-4">
            <div class="flex items-start justify-between gap-4">
              <!-- Offer details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 flex-wrap">
                  <span class="text-lg font-bold text-base-content">
                    {{ offer.amount | currency:offer.currency:'symbol':'1.2-2' }}
                  </span>
                  <span
                    class="badge badge-sm font-medium"
                    [ngClass]="getStatusBadgeClass(offer.status)"
                    role="status"
                    [attr.aria-label]="'Status: ' + formatEnum(offer.status)">
                    {{ formatEnum(offer.status) }}
                  </span>
                  <span
                    *ngIf="offer.originalOfferId"
                    class="badge badge-sm badge-outline"
                    aria-label="This is a counter-offer">
                    Counter-Offer
                  </span>
                </div>

                <!-- Counter-offer amount display -->
                <div
                  *ngIf="offer.counterOfferAmount"
                  class="mt-2 flex items-center gap-2 p-2 bg-warning/10 rounded-md border border-warning/20">
                  <span class="material-symbols-outlined text-warning text-sm">swap_horiz</span>
                  <span class="text-sm text-base-content/80">
                    Counter-offer:
                    <span class="font-semibold">{{ offer.counterOfferAmount | currency:offer.currency:'symbol':'1.2-2' }}</span>
                  </span>
                </div>

                <!-- Meta info -->
                <div class="flex items-center gap-4 mt-2 text-xs text-base-content/50">
                  <span>Offered: {{ offer.offerDate | date:'dd MMM yyyy' }}</span>
                  <span>Expires: {{ offer.validUntil | date:'dd MMM yyyy' }}</span>
                  <span *ngIf="isExpiringSoon(offer)" class="text-warning font-medium">
                    ⚠ Expiring soon
                  </span>
                </div>
              </div>

              <!-- Status transition actions -->
              <div class="flex gap-1 flex-shrink-0 flex-wrap" *ngIf="getPermittedTransitions(offer.status).length > 0">
                <button
                  *ngFor="let nextStatus of getPermittedTransitions(offer.status)"
                  class="btn btn-xs"
                  [ngClass]="getTransitionButtonClass(nextStatus)"
                  (click)="onTransitionStatus(offer, nextStatus)"
                  [disabled]="transitioning()"
                  [attr.aria-label]="'Transition to ' + formatEnum(nextStatus)">
                  {{ getTransitionLabel(nextStatus) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary stats -->
      <div *ngIf="!loading() && offers().length > 0" class="stats stats-horizontal shadow-sm bg-base-200 w-full">
        <div class="stat py-2 px-4">
          <div class="stat-title text-xs">Total Offers</div>
          <div class="stat-value text-lg">{{ offers().length }}</div>
        </div>
        <div class="stat py-2 px-4">
          <div class="stat-title text-xs">Under Review</div>
          <div class="stat-value text-lg text-info">{{ underReviewCount() }}</div>
        </div>
        <div class="stat py-2 px-4">
          <div class="stat-title text-xs">Accepted</div>
          <div class="stat-value text-lg text-success">{{ acceptedCount() }}</div>
        </div>
        <div class="stat py-2 px-4">
          <div class="stat-title text-xs">Highest Offer</div>
          <div class="stat-value text-lg">{{ highestOffer() | currency:'GBP':'symbol':'1.0-0' }}</div>
        </div>
      </div>
    </div>
  `
})
export class OffersTabComponent implements OnInit {
  @Input({ required: true }) opportunityId!: string;

  private readonly fb = inject(FormBuilder);
  private readonly offerService = inject(OfferService);
  private readonly destroyRef = inject(DestroyRef);

  /** Common currencies for the dropdown. */
  readonly currencies = ['GBP', 'USD', 'EUR'];

  /** Minimum date for the validUntil field (tomorrow). */
  readonly minDate: string;

  /** Reactive signals for component state. */
  readonly offers = signal<IOffer[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showCreateForm = signal(false);
  readonly submitting = signal(false);
  readonly transitioning = signal(false);
  readonly showCounterOfferModal = signal(false);

  /** Track which offer is being counter-offered. */
  private counterOfferTarget: IOffer | null = null;

  /** Form control for counter-offer amount in the modal. */
  readonly counterOfferAmountControl = new FormControl<number>(0, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(0.01)]
  });

  /** Computed sorted offers (by date descending). */
  readonly sortedOffers = computed(() =>
    [...this.offers()].sort((a: IOffer, b: IOffer) =>
      new Date(b.offerDate).getTime() - new Date(a.offerDate).getTime()
    )
  );

  /** Computed counts. */
  readonly underReviewCount = computed(() =>
    this.offers().filter((o: IOffer) => o.status === OfferStatus.UnderReview).length
  );
  readonly acceptedCount = computed(() =>
    this.offers().filter((o: IOffer) => o.status === OfferStatus.Accepted).length
  );
  readonly highestOffer = computed(() => {
    const amounts = this.offers().map((o: IOffer) => o.amount);
    return amounts.length > 0 ? Math.max(...amounts) : 0;
  });

  /** Typed reactive form for creating an offer. */
  readonly createForm: FormGroup<IOfferForm> = this.fb.group({
    amount: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0.01)]),
    currency: this.fb.nonNullable.control('GBP', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]),
    validUntil: this.fb.nonNullable.control('', [Validators.required])
  });

  constructor() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadOffers();
  }

  /** Loads offers from the API. */
  loadOffers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.offerService
      .getByOpportunity(this.opportunityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<IOffer[]>) => {
          if (response.success && response.data) {
            this.offers.set([...response.data]);
          } else {
            this.error.set(response.errors?.[0] ?? 'Unexpected error loading offers.');
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
      this.createForm.reset({ amount: 0, currency: 'GBP', validUntil: '' });
    }
  }

  /** Submits the create form to create a new offer. */
  onSubmitCreate(): void {
    if (this.createForm.invalid) return;

    this.submitting.set(true);
    const { amount, currency, validUntil } = this.createForm.getRawValue();

    this.offerService
      .create(this.opportunityId, { amount, currency, validUntil })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<IOffer>) => {
          if (response.success && response.data) {
            this.offers.update((current: IOffer[]) => [...current, response.data!]);
            this.toggleCreateForm();
          }
          this.submitting.set(false);
        },
        error: () => {
          this.submitting.set(false);
        }
      });
  }

  /** Handles status transition. For CounterOffered, opens the counter-offer modal. */
  onTransitionStatus(offer: IOffer, newStatus: OfferStatus): void {
    if (newStatus === OfferStatus.CounterOffered) {
      this.counterOfferTarget = offer;
      this.counterOfferAmountControl.reset(0);
      this.showCounterOfferModal.set(true);
      return;
    }

    this.transitioning.set(true);
    const dto: ITransitionOfferStatus = { newStatus };

    this.offerService
      .transitionStatus(this.opportunityId, offer.id, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<IOffer>) => {
          if (response.success && response.data) {
            this.offers.update((current: IOffer[]) =>
              current.map((o: IOffer) => o.id === offer.id ? response.data! : o)
            );
          }
          this.transitioning.set(false);
        },
        error: () => {
          this.transitioning.set(false);
        }
      });
  }

  /** Confirms the counter-offer with the entered amount. */
  confirmCounterOffer(): void {
    if (!this.counterOfferTarget || this.counterOfferAmountControl.invalid) return;

    this.transitioning.set(true);
    const dto: ITransitionOfferStatus = {
      newStatus: OfferStatus.CounterOffered,
      counterOfferAmount: this.counterOfferAmountControl.value
    };

    this.offerService
      .transitionStatus(this.opportunityId, this.counterOfferTarget.id, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: IApiResponse<IOffer>) => {
          if (response.success && response.data) {
            this.offers.update((current: IOffer[]) =>
              current.map((o: IOffer) => o.id === this.counterOfferTarget!.id ? response.data! : o)
            );
          }
          this.showCounterOfferModal.set(false);
          this.counterOfferTarget = null;
          this.transitioning.set(false);
        },
        error: () => {
          this.transitioning.set(false);
        }
      });
  }

  /** Cancels the counter-offer modal. */
  cancelCounterOffer(): void {
    this.showCounterOfferModal.set(false);
    this.counterOfferTarget = null;
  }

  /** Checks if an offer is expiring within 7 days. */
  isExpiringSoon(offer: IOffer): boolean {
    if (offer.status !== OfferStatus.UnderReview) return false;
    const validUntil = new Date(offer.validUntil);
    const now = new Date();
    const diffDays = (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 && diffDays > 0;
  }

  /** Returns permitted next statuses for a given status. */
  getPermittedTransitions(status: OfferStatus): OfferStatus[] {
    return OFFER_TRANSITIONS[status] ?? [];
  }

  /** Returns DaisyUI badge class for an offer status. */
  getStatusBadgeClass(status: OfferStatus): string {
    return OFFER_STATUS_BADGE[status] ?? 'badge-ghost';
  }

  /** Returns a human-readable label for a transition action button. */
  getTransitionLabel(status: OfferStatus): string {
    switch (status) {
      case OfferStatus.Accepted: return 'Accept';
      case OfferStatus.Rejected: return 'Reject';
      case OfferStatus.CounterOffered: return 'Counter-Offer';
      case OfferStatus.UnderReview: return 'Back to Review';
      default: return this.formatEnum(status);
    }
  }

  /** Returns button styling class based on the target status. */
  getTransitionButtonClass(status: OfferStatus): string {
    switch (status) {
      case OfferStatus.Accepted: return 'btn-success';
      case OfferStatus.Rejected: return 'btn-error';
      case OfferStatus.CounterOffered: return 'btn-warning';
      case OfferStatus.UnderReview: return 'btn-info';
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
  trackById(_index: number, item: IOffer): string {
    return item.id;
  }
}
