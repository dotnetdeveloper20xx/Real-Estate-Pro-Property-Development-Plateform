import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ICouncilContact, ICreateUpdateCouncilContact } from '../../models/council-contact.model';

/**
 * Form interface for strict typed reactive form controls.
 */
interface ICouncilContactForm {
  councilName: FormControl<string>;
  planningOfficerName: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  address: FormControl<string>;
}

/**
 * CouncilContactFormComponent — A presentational reactive form for council contact details.
 *
 * Validates:
 * - CouncilName: 3–200 characters (required)
 * - PlanningOfficerName: 2–150 characters (required)
 * - Email: valid email format (required)
 * - Phone: 7–20 characters (required)
 * - Address: 10–500 characters (required)
 *
 * Requirements: 4.1, 4.2, 16.1
 *
 * @example
 * ```html
 * <app-council-contact-form
 *   [contact]="existingContact"
 *   (save)="onSaveContact($event)">
 * </app-council-contact-form>
 * ```
 */
@Component({
  selector: 'app-council-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4" novalidate>
      <!-- Council Name -->
      <div class="form-control w-full">
        <label class="label" for="councilName">
          <span class="label-text font-medium">Council Name <span class="text-error">*</span></span>
        </label>
        <input
          id="councilName"
          type="text"
          formControlName="councilName"
          class="input input-bordered w-full"
          [class.input-error]="isFieldInvalid('councilName')"
          placeholder="e.g. London Borough of Camden"
          aria-required="true"
          [attr.aria-invalid]="isFieldInvalid('councilName')"
          [attr.aria-describedby]="isFieldInvalid('councilName') ? 'councilName-error' : null"
        />
        <label class="label" *ngIf="isFieldInvalid('councilName')" id="councilName-error">
          <span class="label-text-alt text-error">
            <ng-container *ngIf="form.controls.councilName.errors?.['required']">Council name is required.</ng-container>
            <ng-container *ngIf="form.controls.councilName.errors?.['minlength']">Council name must be at least 3 characters.</ng-container>
            <ng-container *ngIf="form.controls.councilName.errors?.['maxlength']">Council name must not exceed 200 characters.</ng-container>
          </span>
        </label>
      </div>

      <!-- Planning Officer Name -->
      <div class="form-control w-full">
        <label class="label" for="planningOfficerName">
          <span class="label-text font-medium">Planning Officer Name <span class="text-error">*</span></span>
        </label>
        <input
          id="planningOfficerName"
          type="text"
          formControlName="planningOfficerName"
          class="input input-bordered w-full"
          [class.input-error]="isFieldInvalid('planningOfficerName')"
          placeholder="e.g. John Smith"
          aria-required="true"
          [attr.aria-invalid]="isFieldInvalid('planningOfficerName')"
          [attr.aria-describedby]="isFieldInvalid('planningOfficerName') ? 'planningOfficerName-error' : null"
        />
        <label class="label" *ngIf="isFieldInvalid('planningOfficerName')" id="planningOfficerName-error">
          <span class="label-text-alt text-error">
            <ng-container *ngIf="form.controls.planningOfficerName.errors?.['required']">Planning officer name is required.</ng-container>
            <ng-container *ngIf="form.controls.planningOfficerName.errors?.['minlength']">Planning officer name must be at least 2 characters.</ng-container>
            <ng-container *ngIf="form.controls.planningOfficerName.errors?.['maxlength']">Planning officer name must not exceed 150 characters.</ng-container>
          </span>
        </label>
      </div>

      <!-- Email -->
      <div class="form-control w-full">
        <label class="label" for="email">
          <span class="label-text font-medium">Email <span class="text-error">*</span></span>
        </label>
        <input
          id="email"
          type="email"
          formControlName="email"
          class="input input-bordered w-full"
          [class.input-error]="isFieldInvalid('email')"
          placeholder="e.g. planning&#64;council.gov.uk"
          aria-required="true"
          [attr.aria-invalid]="isFieldInvalid('email')"
          [attr.aria-describedby]="isFieldInvalid('email') ? 'email-error' : null"
        />
        <label class="label" *ngIf="isFieldInvalid('email')" id="email-error">
          <span class="label-text-alt text-error">
            <ng-container *ngIf="form.controls.email.errors?.['required']">Email address is required.</ng-container>
            <ng-container *ngIf="form.controls.email.errors?.['email']">Please enter a valid email address.</ng-container>
          </span>
        </label>
      </div>

      <!-- Phone -->
      <div class="form-control w-full">
        <label class="label" for="phone">
          <span class="label-text font-medium">Phone <span class="text-error">*</span></span>
        </label>
        <input
          id="phone"
          type="tel"
          formControlName="phone"
          class="input input-bordered w-full"
          [class.input-error]="isFieldInvalid('phone')"
          placeholder="e.g. 020 7974 4444"
          aria-required="true"
          [attr.aria-invalid]="isFieldInvalid('phone')"
          [attr.aria-describedby]="isFieldInvalid('phone') ? 'phone-error' : null"
        />
        <label class="label" *ngIf="isFieldInvalid('phone')" id="phone-error">
          <span class="label-text-alt text-error">
            <ng-container *ngIf="form.controls.phone.errors?.['required']">Phone number is required.</ng-container>
            <ng-container *ngIf="form.controls.phone.errors?.['minlength']">Phone number must be at least 7 characters.</ng-container>
            <ng-container *ngIf="form.controls.phone.errors?.['maxlength']">Phone number must not exceed 20 characters.</ng-container>
          </span>
        </label>
      </div>

      <!-- Address -->
      <div class="form-control w-full">
        <label class="label" for="address">
          <span class="label-text font-medium">Address <span class="text-error">*</span></span>
        </label>
        <textarea
          id="address"
          formControlName="address"
          class="textarea textarea-bordered w-full h-24"
          [class.textarea-error]="isFieldInvalid('address')"
          placeholder="e.g. 5 Pancras Square, London, N1C 4AG"
          aria-required="true"
          [attr.aria-invalid]="isFieldInvalid('address')"
          [attr.aria-describedby]="isFieldInvalid('address') ? 'address-error' : null"
        ></textarea>
        <label class="label" *ngIf="isFieldInvalid('address')" id="address-error">
          <span class="label-text-alt text-error">
            <ng-container *ngIf="form.controls.address.errors?.['required']">Address is required.</ng-container>
            <ng-container *ngIf="form.controls.address.errors?.['minlength']">Address must be at least 10 characters.</ng-container>
            <ng-container *ngIf="form.controls.address.errors?.['maxlength']">Address must not exceed 500 characters.</ng-container>
          </span>
        </label>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end pt-2">
        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="form.invalid || form.pristine"
          aria-label="Save council contact"
        >
          Save Council Contact
        </button>
      </div>
    </form>
  `
})
export class CouncilContactFormComponent implements OnInit, OnChanges {
  /** Existing council contact to pre-fill the form (for edit mode). */
  @Input() contact: ICouncilContact | null = null;

  /** Emits the form payload when the user submits a valid form. */
  @Output() save = new EventEmitter<ICreateUpdateCouncilContact>();

  form!: FormGroup<ICouncilContactForm>;

  private submitted = false;

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contact'] && this.form) {
      this.patchForm();
    }
  }

  /** Checks if a field should display as invalid (touched or submitted and has errors). */
  isFieldInvalid(fieldName: keyof ICouncilContactForm): boolean {
    const control = this.form.controls[fieldName];
    return control.invalid && (control.touched || this.submitted);
  }

  /** Handles form submission. */
  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: ICreateUpdateCouncilContact = {
      councilName: this.form.controls.councilName.value.trim(),
      planningOfficerName: this.form.controls.planningOfficerName.value.trim(),
      email: this.form.controls.email.value.trim(),
      phone: this.form.controls.phone.value.trim(),
      address: this.form.controls.address.value.trim()
    };
    this.save.emit(payload);
  }

  /** Initializes the reactive form with validation rules matching backend. */
  private initForm(): void {
    this.form = this.fb.group<ICouncilContactForm>({
      councilName: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)]
      }),
      planningOfficerName: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(150)]
      }),
      email: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email]
      }),
      phone: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(7), Validators.maxLength(20)]
      }),
      address: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)]
      })
    });

    this.patchForm();
  }

  /** Patches the form with existing contact data for edit mode. */
  private patchForm(): void {
    if (this.contact) {
      this.form.patchValue({
        councilName: this.contact.councilName,
        planningOfficerName: this.contact.planningOfficerName,
        email: this.contact.email,
        phone: this.contact.phone,
        address: this.contact.address
      });
      this.form.markAsPristine();
      this.submitted = false;
    }
  }
}
