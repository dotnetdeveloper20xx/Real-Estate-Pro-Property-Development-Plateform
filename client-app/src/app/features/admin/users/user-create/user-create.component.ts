import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, switchMap, of, takeUntil, Observable, map, catchError } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Role option for the assignment panel.
 */
interface IRoleOption {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

/**
 * Create user form interface with strong typing.
 */
interface ICreateUserForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
  roles: FormControl<string[]>;
}

/**
 * Password validation rule for the live checklist.
 */
interface IPasswordRule {
  readonly label: string;
  readonly validator: (value: string) => boolean;
  met: boolean;
}

/**
 * User Create Page Component
 *
 * Features:
 * - Form fields: First Name, Last Name, Email, Password (with visibility toggle), Confirm Password
 * - Searchable role assignment panel with checkboxes for all 13 roles
 * - Real-time password policy validation with checkmarks per requirement
 * - Email uniqueness validation (async)
 * - Submit → create user → success notification → navigate to list
 *
 * Requirements: 4.2, 4.3, 4.4, 4.10
 */
@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto space-y-6">
      <!-- Page Header -->
      <div class="flex items-center gap-4">
        <button class="btn btn-ghost btn-sm btn-square" (click)="navigateBack()" aria-label="Back to users list">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 class="text-2xl font-bold text-base-content">Create New User</h1>
          <p class="text-sm text-base-content/60 mt-1">
            Add a new user account and assign roles
          </p>
        </div>
      </div>

      <!-- Create User Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Personal Information Card -->
        <div class="card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body">
            <h2 class="card-title text-base">Personal Information</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <!-- First Name -->
              <div class="form-control">
                <label class="label" for="firstName">
                  <span class="label-text font-medium">First Name <span class="text-error">*</span></span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  formControlName="firstName"
                  placeholder="Enter first name"
                  class="input input-bordered w-full"
                  [class.input-error]="isFieldInvalid('firstName')" />
                <label class="label" *ngIf="isFieldInvalid('firstName')">
                  <span class="label-text-alt text-error">First name is required</span>
                </label>
              </div>

              <!-- Last Name -->
              <div class="form-control">
                <label class="label" for="lastName">
                  <span class="label-text font-medium">Last Name <span class="text-error">*</span></span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  formControlName="lastName"
                  placeholder="Enter last name"
                  class="input input-bordered w-full"
                  [class.input-error]="isFieldInvalid('lastName')" />
                <label class="label" *ngIf="isFieldInvalid('lastName')">
                  <span class="label-text-alt text-error">Last name is required</span>
                </label>
              </div>
            </div>

            <!-- Email -->
            <div class="form-control mt-4">
              <label class="label" for="email">
                <span class="label-text font-medium">Email Address <span class="text-error">*</span></span>
              </label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="user&#64;buildestate.co.uk"
                class="input input-bordered w-full"
                [class.input-error]="isFieldInvalid('email')" />
              <label class="label" *ngIf="isFieldInvalid('email')">
                <span class="label-text-alt text-error">
                  {{ getEmailError() }}
                </span>
              </label>
              <label class="label" *ngIf="form.controls.email.pending">
                <span class="label-text-alt text-info">Checking email availability...</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Password Card -->
        <div class="card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body">
            <h2 class="card-title text-base">Password</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <!-- Password -->
              <div class="form-control">
                <label class="label" for="password">
                  <span class="label-text font-medium">Password <span class="text-error">*</span></span>
                </label>
                <div class="relative">
                  <input
                    id="password"
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="password"
                    placeholder="Enter password"
                    class="input input-bordered w-full pr-10"
                    [class.input-error]="isFieldInvalid('password')" />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-square"
                    (click)="showPassword = !showPassword"
                    [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'">
                    <span class="material-symbols-outlined text-sm">
                      {{ showPassword ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
              </div>

              <!-- Confirm Password -->
              <div class="form-control">
                <label class="label" for="confirmPassword">
                  <span class="label-text font-medium">Confirm Password <span class="text-error">*</span></span>
                </label>
                <div class="relative">
                  <input
                    id="confirmPassword"
                    [type]="showConfirmPassword ? 'text' : 'password'"
                    formControlName="confirmPassword"
                    placeholder="Re-enter password"
                    class="input input-bordered w-full pr-10"
                    [class.input-error]="isFieldInvalid('confirmPassword')" />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-square"
                    (click)="showConfirmPassword = !showConfirmPassword"
                    [attr.aria-label]="showConfirmPassword ? 'Hide password' : 'Show password'">
                    <span class="material-symbols-outlined text-sm">
                      {{ showConfirmPassword ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
                <label class="label" *ngIf="isFieldInvalid('confirmPassword')">
                  <span class="label-text-alt text-error">Passwords must match</span>
                </label>
              </div>
            </div>

            <!-- Password Requirements Checklist -->
            <div class="mt-4 p-3 bg-base-200/50 rounded-lg">
              <p class="text-xs font-medium text-base-content/60 mb-2">Password Requirements</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1">
                <div
                  *ngFor="let rule of passwordRules"
                  class="flex items-center gap-2 text-sm">
                  <span
                    class="material-symbols-outlined text-sm"
                    [ngClass]="rule.met ? 'text-success' : 'text-base-content/30'">
                    {{ rule.met ? 'check_circle' : 'radio_button_unchecked' }}
                  </span>
                  <span [ngClass]="rule.met ? 'text-success' : 'text-base-content/60'">
                    {{ rule.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Role Assignment Card -->
        <div class="card bg-base-100 shadow-sm border border-base-200/80">
          <div class="card-body">
            <h2 class="card-title text-base">Role Assignment</h2>
            <p class="text-sm text-base-content/60">
              Assign one or more roles to define the user's access permissions
            </p>

            <!-- Role search -->
            <div class="form-control mt-3">
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm">search</span>
                <input
                  type="text"
                  placeholder="Search roles..."
                  class="input input-bordered input-sm pl-9 w-full max-w-xs"
                  [(ngModel)]="roleSearchTerm"
                  [ngModelOptions]="{standalone: true}"
                  aria-label="Search roles" />
              </div>
            </div>

            <!-- Roles Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
              <label
                *ngFor="let role of filteredRoles"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-primary"
                  [checked]="isRoleSelected(role.name)"
                  (change)="toggleRole(role.name)" />
                <div>
                  <span class="text-sm font-medium">{{ formatRoleName(role.name) }}</span>
                  <p class="text-xs text-base-content/50" *ngIf="role.description">{{ role.description }}</p>
                </div>
              </label>
            </div>

            <p class="text-xs text-base-content/50 mt-2" *ngIf="selectedRolesCount > 0">
              {{ selectedRolesCount }} role(s) selected
            </p>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex items-center justify-end gap-3">
          <button type="button" class="btn btn-ghost" (click)="navigateBack()">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="submitting || form.invalid">
            <span *ngIf="submitting" class="loading loading-spinner loading-sm"></span>
            Create User
          </button>
        </div>
      </form>
    </div>
  `
})
export class UserCreateComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  // UI state
  showPassword = false;
  showConfirmPassword = false;
  submitting = false;
  roleSearchTerm = '';

  // Available roles
  availableRoles: IRoleOption[] = [];

  // Password validation rules (updated in real-time)
  passwordRules: IPasswordRule[] = [
    { label: 'Minimum 8 characters', validator: (v) => v.length >= 8, met: false },
    { label: 'Maximum 128 characters', validator: (v) => v.length <= 128 && v.length > 0, met: false },
    { label: 'At least 1 uppercase letter', validator: (v) => /[A-Z]/.test(v), met: false },
    { label: 'At least 1 number', validator: (v) => /[0-9]/.test(v), met: false },
    { label: 'At least 1 special character', validator: (v) => /[!@#$%^&*()\-_+=\[\]{}|;:',.<>?/`~]/.test(v), met: false }
  ];

  /** Reactive form for user creation. */
  form: FormGroup<ICreateUserForm> = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email], [this.emailUniqueValidator()]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmPassword: ['', [Validators.required]],
    roles: [[] as string[]]
  }, {
    validators: [this.passwordMatchValidator]
  });

  get filteredRoles(): IRoleOption[] {
    if (!this.roleSearchTerm.trim()) return this.availableRoles;
    const term = this.roleSearchTerm.toLowerCase();
    return this.availableRoles.filter(r =>
      r.name.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term)
    );
  }

  get selectedRolesCount(): number {
    return this.form.controls.roles.value.length;
  }

  ngOnInit(): void {
    this.loadRoles();

    // Live password validation checklist (with debounce for performance)
    this.form.controls.password.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.updatePasswordChecklist(value);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Form submission ─────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const { firstName, lastName, email, password, roles } = this.form.getRawValue();

    this.http.post('/api/v1/users', {
      firstName,
      lastName,
      email,
      password,
      roles
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.showSuccess('User created successfully');
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        this.submitting = false;
        const message = err?.error?.errors?.[0] ?? 'Failed to create user. Please try again.';
        this.toast.showError(message);
      }
    });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  navigateBack(): void {
    this.router.navigate(['/admin/users']);
  }

  // ── Role management ─────────────────────────────────────────────────────────

  isRoleSelected(roleName: string): boolean {
    return this.form.controls.roles.value.includes(roleName);
  }

  toggleRole(roleName: string): void {
    const current = [...this.form.controls.roles.value];
    const index = current.indexOf(roleName);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(roleName);
    }
    this.form.controls.roles.setValue(current);
  }

  formatRoleName(role: string): string {
    return role.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  // ── Validation helpers ──────────────────────────────────────────────────────

  isFieldInvalid(field: keyof ICreateUserForm): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  getEmailError(): string {
    const control = this.form.controls.email;
    if (control.hasError('required')) return 'Email is required';
    if (control.hasError('email')) return 'Please enter a valid email address';
    if (control.hasError('emailTaken')) return 'This email is already in use';
    return '';
  }

  // ── Private methods ─────────────────────────────────────────────────────────

  private updatePasswordChecklist(value: string): void {
    this.passwordRules = this.passwordRules.map(rule => ({
      ...rule,
      met: rule.validator(value)
    }));
  }

  private loadRoles(): void {
    this.http.get<IRoleOption[]>('/api/v1/roles').subscribe({
      next: (roles) => {
        this.availableRoles = roles;
      },
      error: () => {
        // Provide defaults if API is unavailable
        this.availableRoles = [
          { id: '1', name: 'SuperAdmin', description: 'Full system access' },
          { id: '2', name: 'AcquisitionManager', description: 'Manages land opportunities' },
          { id: '3', name: 'LegalOfficer', description: 'Legal & compliance management' },
          { id: '4', name: 'PlanningManager', description: 'Planning applications & approvals' },
          { id: '5', name: 'ProjectManager', description: 'Project planning & execution' },
          { id: '6', name: 'SiteManager', description: 'Construction site management' },
          { id: '7', name: 'SalesManager', description: 'Sales & marketing' },
          { id: '8', name: 'CompletionManager', description: 'Handover & completion' },
          { id: '9', name: 'PropertyManager', description: 'Property operations' },
          { id: '10', name: 'FinanceDirector', description: 'Financial oversight' },
          { id: '11', name: 'ValuationAnalyst', description: 'Valuations & feasibility' },
          { id: '12', name: 'Surveyor', description: 'Technical assessments' },
          { id: '13', name: 'Admin', description: 'System administration' }
        ];
      }
    });
  }

  /** Cross-field validator: password and confirmPassword must match. */
  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (password && confirm && password !== confirm) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  /** Async validator for email uniqueness. */
  private emailUniqueValidator(): (control: AbstractControl) => Observable<ValidationErrors | null> {
    return (control: AbstractControl) => {
      if (!control.value || control.hasError('email')) {
        return of(null);
      }
      return of(control.value).pipe(
        debounceTime(500),
        switchMap(email =>
          this.http.get<{ available: boolean }>(`/api/v1/users/check-email`, {
            params: { email }
          }).pipe(
            map(response => response.available ? null : { emailTaken: true }),
            catchError(() => of(null))
          )
        )
      );
    };
  }
}
