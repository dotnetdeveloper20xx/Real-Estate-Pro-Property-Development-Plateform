import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';

interface IRoleOption {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

interface IUserForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
  status: FormControl<string>;
  roles: FormControl<string[]>;
}

interface IUserData {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly roles: string[];
  readonly isActive: boolean;
}

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6">
      <!-- Page Header -->
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-lg">3</span>
        </div>
        <h1 class="text-xl font-bold text-base-content uppercase tracking-wide">Create / Edit User</h1>
      </div>

      <!-- Tabs -->
      <div class="border-b border-base-200">
        <div class="flex gap-0">
          <button type="button" class="px-5 py-2.5 text-sm font-medium border-b-2 transition-colors"
                  [ngClass]="!isEditMode ? 'border-primary text-primary' : 'border-transparent text-base-content/60 hover:text-base-content'"
                  (click)="switchToCreate()">Create User</button>
          <button type="button" class="px-5 py-2.5 text-sm font-medium border-b-2 transition-colors"
                  [ngClass]="isEditMode ? 'border-primary text-primary' : 'border-transparent text-base-content/60 hover:text-base-content'"
                  (click)="switchToEdit()">Edit User</button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex items-center justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Form -->
      <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Left: Form Fields -->
          <div class="space-y-5">
            <div>
              <label class="text-sm font-semibold text-base-content mb-1.5 block">First Name <span class="text-error">*</span></label>
              <input type="text" formControlName="firstName" placeholder="John"
                     class="input input-bordered w-full" [class.input-error]="isFieldInvalid('firstName')" />
              <p *ngIf="isFieldInvalid('firstName')" class="text-xs text-error mt-1">First name is required</p>
            </div>

            <div>
              <label class="text-sm font-semibold text-base-content mb-1.5 block">Last Name <span class="text-error">*</span></label>
              <input type="text" formControlName="lastName" placeholder="Mitchell"
                     class="input input-bordered w-full" [class.input-error]="isFieldInvalid('lastName')" />
              <p *ngIf="isFieldInvalid('lastName')" class="text-xs text-error mt-1">Last name is required</p>
            </div>

            <div>
              <label class="text-sm font-semibold text-base-content mb-1.5 block">Email Address <span class="text-error">*</span></label>
              <input type="email" formControlName="email" placeholder="john.mitchell@buildestate.co.uk"
                     class="input input-bordered w-full" [class.input-error]="isFieldInvalid('email')" />
              <p *ngIf="isFieldInvalid('email')" class="text-xs text-error mt-1">{{ getEmailError() }}</p>
            </div>

            <div>
              <label class="text-sm font-semibold text-base-content mb-1.5 block">Password <span class="text-error">*</span></label>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" formControlName="password"
                       placeholder="••••••••" class="input input-bordered w-full pr-10"
                       [class.input-error]="isFieldInvalid('password')" />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                        (click)="showPassword = !showPassword">
                  <span class="material-symbols-outlined text-xl">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              <p *ngIf="isFieldInvalid('password')" class="text-xs text-error mt-1">Password must be at least 8 characters</p>
            </div>

            <div>
              <label class="text-sm font-semibold text-base-content mb-1.5 block">Confirm Password <span class="text-error">*</span></label>
              <div class="relative">
                <input [type]="showConfirmPassword ? 'text' : 'password'" formControlName="confirmPassword"
                       placeholder="••••••••" class="input input-bordered w-full pr-10"
                       [class.input-error]="isFieldInvalid('confirmPassword')" />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                        (click)="showConfirmPassword = !showConfirmPassword">
                  <span class="material-symbols-outlined text-xl">{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              <p *ngIf="isFieldInvalid('confirmPassword')" class="text-xs text-error mt-1">Passwords must match</p>
            </div>

            <div>
              <label class="text-sm font-semibold text-base-content mb-1.5 block">Status</label>
              <select formControlName="status" class="select select-bordered w-full">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <!-- Right: Role Assignment -->
          <div>
            <label class="text-sm font-semibold text-base-content mb-3 block">Assign Roles <span class="text-error">*</span></label>
            <div class="relative mb-3">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40">search</span>
              <input type="text" placeholder="Search roles..." class="input input-bordered w-full pl-10"
                     [(ngModel)]="roleSearchTerm" [ngModelOptions]="{standalone: true}" />
            </div>
            <div class="border border-base-200 rounded-lg max-h-[400px] overflow-y-auto">
              <label *ngFor="let role of filteredRoles"
                     class="flex items-center gap-3 px-4 py-3 border-b border-base-200/50 last:border-b-0 hover:bg-base-200/30 cursor-pointer transition-colors">
                <input type="checkbox" class="checkbox checkbox-sm checkbox-primary"
                       [checked]="isRoleSelected(role.name)" (change)="toggleRole(role.name)" />
                <span class="text-sm font-medium text-base-content">{{ role.name }}</span>
              </label>
            </div>
            <p class="text-xs text-base-content/50 mt-2" *ngIf="selectedRolesCount > 0">
              {{ selectedRolesCount }} role(s) selected
            </p>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-base-200">
          <button type="button" class="btn btn-ghost" (click)="navigateBack()">Cancel</button>
          <button type="submit" class="btn btn-primary px-6" [disabled]="submitting || form.invalid">
            <span *ngIf="submitting" class="loading loading-spinner loading-sm"></span>
            {{ isEditMode ? 'Save User' : 'Save User' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class UserCreateComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  showPassword = false;
  showConfirmPassword = false;
  submitting = false;
  loading = false;
  roleSearchTerm = '';
  isEditMode = false;
  userId: string | null = null;
  userData: IUserData | null = null;

  availableRoles: IRoleOption[] = [];

  form: FormGroup<IUserForm> = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
    status: ['active'],
    roles: [[] as string[]]
  }, { validators: [this.passwordMatchValidator] });

  get filteredRoles(): IRoleOption[] {
    if (!this.roleSearchTerm.trim()) return this.availableRoles;
    const term = this.roleSearchTerm.toLowerCase();
    return this.availableRoles.filter(r => r.name.toLowerCase().includes(term));
  }

  get selectedRolesCount(): number {
    return this.form.controls.roles.value.length;
  }

  ngOnInit(): void {
    this.loadRoles();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.userId = id;
      this.loading = true;
      this.loadUser(id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  switchToCreate(): void {
    if (this.isEditMode) {
      this.router.navigate(['/admin/users/create']);
    }
  }

  switchToEdit(): void {
    if (!this.isEditMode) {
      this.toast.showError('Select a user from the list to edit');
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    const { firstName, lastName, email, password, status, roles } = this.form.getRawValue();

    if (this.isEditMode && this.userId) {
      this.http.put(`/api/v1/users/${this.userId}`, {
        firstName, lastName, email, isActive: status === 'active'
      }).subscribe({
        next: () => {
          this.http.put(`/api/v1/users/${this.userId}/roles`, { roles }).subscribe({
            next: () => { this.submitting = false; this.toast.showSuccess('User updated successfully'); this.router.navigate(['/admin/users']); },
            error: () => { this.submitting = false; this.toast.showSuccess('User updated but roles failed'); this.router.navigate(['/admin/users']); }
          });
        },
        error: (err) => { this.submitting = false; this.toast.showError(err?.error?.errors?.[0] ?? 'Failed to update user'); }
      });
    } else {
      this.http.post('/api/v1/users', { firstName, lastName, email, password, roles }).subscribe({
        next: () => { this.submitting = false; this.toast.showSuccess('User created successfully'); this.router.navigate(['/admin/users']); },
        error: (err) => { this.submitting = false; this.toast.showError(err?.error?.errors?.[0] ?? 'Failed to create user'); }
      });
    }
  }

  navigateBack(): void { this.router.navigate(['/admin/users']); }

  isRoleSelected(roleName: string): boolean {
    return this.form.controls.roles.value.includes(roleName);
  }

  toggleRole(roleName: string): void {
    const current = [...this.form.controls.roles.value];
    const idx = current.indexOf(roleName);
    if (idx >= 0) current.splice(idx, 1); else current.push(roleName);
    this.form.controls.roles.setValue(current);
  }

  isFieldInvalid(field: keyof IUserForm): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  getEmailError(): string {
    const c = this.form.controls.email;
    if (c.hasError('required')) return 'Email is required';
    if (c.hasError('email')) return 'Please enter a valid email address';
    return '';
  }

  private loadUser(id: string): void {
    this.http.get<any>(`/api/v1/users/${id}`).subscribe({
      next: (response) => {
        const user = response.data ?? response;
        this.userData = user;
        this.form.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: user.isActive ? 'active' : 'inactive',
          roles: [...user.roles]
        });
        // In edit mode, password is optional
        this.form.controls.password.clearValidators();
        this.form.controls.password.updateValueAndValidity();
        this.form.controls.confirmPassword.clearValidators();
        this.form.controls.confirmPassword.updateValueAndValidity();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.showError('Failed to load user');
        this.router.navigate(['/admin/users']);
      }
    });
  }

  private loadRoles(): void {
    this.http.get<any>('/api/v1/roles').subscribe({
      next: (response) => {
        this.availableRoles = response.data ?? (Array.isArray(response) ? response : []);
      },
      error: () => {
        this.availableRoles = [
          { id: '1', name: 'SuperAdmin', description: 'Full system access' },
          { id: '2', name: 'AcquisitionManager', description: 'Land opportunities' },
          { id: '3', name: 'LegalOfficer', description: 'Legal & compliance' },
          { id: '4', name: 'PlanningManager', description: 'Planning approvals' },
          { id: '5', name: 'ProjectManager', description: 'Project execution' },
          { id: '6', name: 'SiteManager', description: 'Construction sites' },
          { id: '7', name: 'SalesManager', description: 'Sales & marketing' },
          { id: '8', name: 'CompletionManager', description: 'Handover' },
          { id: '9', name: 'PropertyManager', description: 'Property ops' },
          { id: '10', name: 'FinanceDirector', description: 'Finance' },
          { id: '11', name: 'ValuationAnalyst', description: 'Valuations' },
          { id: '12', name: 'Surveyor', description: 'Assessments' },
          { id: '13', name: 'Admin', description: 'Admin' }
        ];
      }
    });
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    if (pw && cpw && pw !== cpw) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }
}
