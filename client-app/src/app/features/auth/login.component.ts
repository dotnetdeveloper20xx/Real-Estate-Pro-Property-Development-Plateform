import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Typed form interface for the login form.
 */
interface ILoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

/**
 * Login page component for BuildEstate Pro.
 *
 * Features:
 * - Clean centered card layout with branding
 * - Email and password fields with validation
 * - Loading state during authentication
 * - Error display for invalid credentials
 * - Demo credentials shown for development convenience
 * - Redirect to home on successful login
 * - Keyboard accessible (Enter to submit)
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div class="card w-full max-w-md bg-base-100 shadow-xl">
        <div class="card-body gap-6">
          <!-- Logo & Brand -->
          <div class="text-center">
            <div class="flex items-center justify-center gap-2 mb-2">
              <span class="material-symbols-outlined text-primary text-4xl">apartment</span>
            </div>
            <h1 class="text-2xl font-bold text-base-content">BuildEstate Pro</h1>
            <p class="text-sm text-base-content/60 mt-1">
              Sign in to your account to continue
            </p>
          </div>

          <!-- Login Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
            <!-- Email Field -->
            <div class="form-control">
              <label class="label" for="email">
                <span class="label-text font-medium">Email Address</span>
              </label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-xl">mail</span>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="Enter your email"
                  class="input input-bordered w-full pl-10"
                  [class.input-error]="showFieldError('email')"
                  autocomplete="email" />
              </div>
              <label class="label" *ngIf="showFieldError('email')">
                <span class="label-text-alt text-error">Please enter a valid email address</span>
              </label>
            </div>

            <!-- Password Field -->
            <div class="form-control">
              <label class="label" for="password">
                <span class="label-text font-medium">Password</span>
              </label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-xl">lock</span>
                <input
                  id="password"
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Enter your password"
                  class="input input-bordered w-full pl-10 pr-10"
                  [class.input-error]="showFieldError('password')"
                  autocomplete="current-password" />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70"
                  (click)="showPassword = !showPassword"
                  [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'">
                  <span class="material-symbols-outlined text-xl">
                    {{ showPassword ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              <label class="label" *ngIf="showFieldError('password')">
                <span class="label-text-alt text-error">Password is required</span>
              </label>
            </div>

            <!-- Error Alert -->
            <div
              *ngIf="errorMessage"
              class="alert alert-error text-sm py-2"
              role="alert">
              <span class="material-symbols-outlined text-lg">error</span>
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              class="btn btn-primary w-full mt-2"
              [disabled]="isLoading">
              <span
                *ngIf="isLoading"
                class="loading loading-spinner loading-sm"></span>
              <span *ngIf="!isLoading">Sign In</span>
              <span *ngIf="isLoading">Signing in...</span>
            </button>
          </form>

          <!-- Forgot Password Link (placeholder) -->
          <div class="text-center">
            <a class="link link-primary text-sm cursor-pointer">
              Forgot your password?
            </a>
          </div>

          <!-- Demo Credentials -->
          <div class="border-t border-base-200 pt-4">
            <div class="bg-base-200/50 rounded-lg p-3">
              <p class="text-xs font-medium text-base-content/60 mb-1">Demo Credentials</p>
              <p class="text-xs text-base-content/80 font-mono">
                admin&#64;buildestate.co.uk / Admin&#64;123456
              </p>
            </div>
          </div>

          <!-- Skip login in dev mode -->
          <div class="text-center">
            <a
              routerLink="/home"
              class="link link-ghost text-xs text-base-content/40 hover:text-base-content/60">
              Continue without signing in (Dev Mode)
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  showPassword = false;
  isLoading = false;
  errorMessage = '';
  submitted = false;

  readonly loginForm: FormGroup<ILoginForm> = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  /**
   * Show validation error only after first submit attempt.
   */
  showFieldError(field: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[field];
    return this.submitted && control.invalid;
  }

  /**
   * Submit the login form.
   */
  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.getRawValue();

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.errorMessage = 'Invalid email or password. Please try again.';
        } else if (err.status === 423) {
          this.errorMessage = 'Account is locked. Please contact your administrator.';
        } else {
          this.errorMessage = 'An error occurred. Please try again later.';
        }
      }
    });
  }
}
