import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { isDevMode } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthService, ILoginResponse } from '../../core/services/auth.service';
import { AuthActions } from '../../core/store/auth';

/**
 * Typed form interface for the login form.
 */
interface ILoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
  rememberMe: FormControl<boolean>;
}

/**
 * Login page component for BuildEstate Pro.
 *
 * Features:
 * - Two-column layout: branding/features (left), form (right)
 * - Dark navy theme with proper contrast
 * - 3 feature highlights with icons
 * - Authentication flow steps
 * - Security features summary section
 * - Email/password with visibility toggle, remember me, forgot password link
 * - Dev mode link (visible only in development)
 * - Dev mode banner when active
 * - Inline email validation before submit
 * - Server error messages (deactivated, locked with duration, invalid credentials)
 * - Disable submit during API call
 * - On success: store token, navigate to home
 * - Dev mode: client-side SuperAdmin session without API
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Dev Mode Banner -->
    <div
      *ngIf="isDevModeActive"
      class="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 text-center py-2 text-sm font-semibold tracking-wide">
      <span class="material-symbols-outlined text-base align-middle mr-1">warning</span>
      Development Mode — Authentication Bypassed
    </div>

    <div class="min-h-screen flex" [class.pt-10]="isDevModeActive"
         style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);">

      <!-- Left Panel: Branding & Features (hidden on mobile) -->
      <div class="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20">
        <!-- Brand -->
        <div class="mb-10">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span class="material-symbols-outlined text-white text-2xl">apartment</span>
            </div>
            <h1 class="text-3xl font-bold text-white tracking-tight">BuildEstate Pro</h1>
          </div>
          <p class="text-slate-400 text-lg">
            Enterprise property development management platform
          </p>
        </div>

        <!-- Feature Highlights -->
        <div class="space-y-5 mb-10">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-emerald-400 text-xl">shield</span>
            </div>
            <div>
              <h3 class="text-white font-semibold">Enterprise grade security</h3>
              <p class="text-slate-400 text-sm mt-0.5">Industry-standard encryption and protection for your data</p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-blue-400 text-xl">admin_panel_settings</span>
            </div>
            <div>
              <h3 class="text-white font-semibold">Role-based access control</h3>
              <p class="text-slate-400 text-sm mt-0.5">Granular permissions tailored to every team member's role</p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-purple-400 text-xl">history</span>
            </div>
            <div>
              <h3 class="text-white font-semibold">Complete audit logging</h3>
              <p class="text-slate-400 text-sm mt-0.5">Full traceability of every action for compliance and oversight</p>
            </div>
          </div>
        </div>

        <!-- Authentication Flow Steps -->
        <div class="mb-10">
          <h4 class="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-4">Authentication Flow</h4>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-semibold">1</span>
              <span class="text-slate-300 text-sm">Enter credentials</span>
            </div>
            <span class="material-symbols-outlined text-slate-600 text-base">arrow_forward</span>
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-semibold">2</span>
              <span class="text-slate-300 text-sm">Verify identity</span>
            </div>
            <span class="material-symbols-outlined text-slate-600 text-base">arrow_forward</span>
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-semibold">3</span>
              <span class="text-slate-300 text-sm">Access granted</span>
            </div>
          </div>
        </div>

        <!-- Security Features Summary -->
        <div class="border-t border-slate-700/50 pt-6">
          <h4 class="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Security Features</h4>
          <div class="flex flex-wrap gap-3">
            <span class="inline-flex items-center gap-1.5 text-slate-400 text-xs bg-slate-800/50 rounded-full px-3 py-1.5">
              <span class="material-symbols-outlined text-emerald-400 text-sm">lock</span>
              Encrypted data
            </span>
            <span class="inline-flex items-center gap-1.5 text-slate-400 text-xs bg-slate-800/50 rounded-full px-3 py-1.5">
              <span class="material-symbols-outlined text-amber-400 text-sm">block</span>
              Lockout protection
            </span>
            <span class="inline-flex items-center gap-1.5 text-slate-400 text-xs bg-slate-800/50 rounded-full px-3 py-1.5">
              <span class="material-symbols-outlined text-blue-400 text-sm">verified_user</span>
              Audit trail
            </span>
          </div>
        </div>
      </div>

      <!-- Right Panel: Login Form -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div class="w-full max-w-md">
          <!-- Mobile Brand (hidden on desktop) -->
          <div class="lg:hidden text-center mb-8">
            <div class="flex items-center justify-center gap-2 mb-2">
              <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span class="material-symbols-outlined text-white text-xl">apartment</span>
              </div>
            </div>
            <h1 class="text-2xl font-bold text-white">BuildEstate Pro</h1>
            <p class="text-slate-400 text-sm mt-1">Sign in to your account</p>
          </div>

          <!-- Form Card -->
          <div class="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 shadow-2xl shadow-black/20">
            <div class="mb-6">
              <h2 class="text-xl font-semibold text-white">Welcome back</h2>
              <p class="text-slate-400 text-sm mt-1">Sign in to your account to continue</p>
            </div>

            <!-- Login Form -->
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
              <!-- Email Field -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5" for="email">
                  Email Address
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">mail</span>
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    placeholder="you@company.com"
                    class="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    [class.border-red-500]="showFieldError('email')"
                    [class.focus:border-red-500]="showFieldError('email')"
                    [class.focus:ring-red-500]="showFieldError('email')"
                    (blur)="onEmailBlur()"
                    autocomplete="email" />
                </div>
                <p *ngIf="showFieldError('email')" class="mt-1.5 text-xs text-red-400">
                  Please enter a valid email address
                </p>
              </div>

              <!-- Password Field -->
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-1.5" for="password">
                  Password
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">lock</span>
                  <input
                    id="password"
                    [type]="showPassword ? 'text' : 'password'"
                    formControlName="password"
                    placeholder="Enter your password"
                    class="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    [class.border-red-500]="showFieldError('password')"
                    [class.focus:border-red-500]="showFieldError('password')"
                    [class.focus:ring-red-500]="showFieldError('password')"
                    autocomplete="current-password" />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    (click)="showPassword = !showPassword"
                    [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'">
                    <span class="material-symbols-outlined text-xl">
                      {{ showPassword ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
                <p *ngIf="showFieldError('password')" class="mt-1.5 text-xs text-red-400">
                  Password is required
                </p>
              </div>

              <!-- Remember Me & Forgot Password -->
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    formControlName="rememberMe"
                    class="checkbox checkbox-sm checkbox-primary border-slate-600 bg-slate-900/50" />
                  <span class="text-sm text-slate-400">Remember me</span>
                </label>
                <a class="text-sm text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">
                  Forgot password?
                </a>
              </div>

              <!-- Error Alert -->
              <div
                *ngIf="errorMessage"
                class="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
                role="alert">
                <span class="material-symbols-outlined text-red-400 text-lg mt-0.5 flex-shrink-0">error</span>
                <span class="text-sm text-red-300">{{ errorMessage }}</span>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-1"
                [disabled]="isLoading">
                <span
                  *ngIf="isLoading"
                  class="loading loading-spinner loading-sm"></span>
                <span *ngIf="!isLoading">Sign In</span>
                <span *ngIf="isLoading">Signing in...</span>
              </button>
            </form>

            <!-- Dev Mode Link (only in development) -->
            <div *ngIf="showDevModeLink" class="mt-6 pt-5 border-t border-slate-700/50 text-center">
              <button
                type="button"
                (click)="enterDevMode()"
                class="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                Continue without signing in (Dev Mode)
              </button>
            </div>
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
  private readonly store = inject(Store);

  showPassword = false;
  isLoading = false;
  errorMessage = '';
  submitted = false;
  emailTouched = false;
  isDevModeActive = false;

  /** Show dev mode link only in development environment */
  readonly showDevModeLink = isDevMode();

  readonly loginForm: FormGroup<ILoginForm> = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false]
  });

  /**
   * Show validation error for email after blur or submit,
   * and for password only after submit.
   */
  showFieldError(field: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[field];
    if (field === 'email') {
      return (this.submitted || this.emailTouched) && control.invalid;
    }
    return this.submitted && control.invalid;
  }

  /**
   * Mark email as touched on blur for inline validation.
   */
  onEmailBlur(): void {
    this.emailTouched = true;
  }

  /**
   * Submit the login form.
   * Disables submit during API call and displays server error messages.
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
      next: (response: ILoginResponse) => {
        this.isLoading = false;
        // Update NgRx store with user/roles so sidebar and directives reflect the logged-in state
        this.store.dispatch(AuthActions.loginSuccess({ response }));
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }

  /**
   * Enter dev mode: create client-side SuperAdmin session without API call.
   */
  enterDevMode(): void {
    this.isDevModeActive = true;
    this.router.navigate(['/home']);
  }

  /**
   * Parse server error responses into user-friendly messages.
   */
  private getErrorMessage(err: { status: number; error?: { message?: string } }): string {
    const serverMessage = err.error?.message?.toLowerCase() ?? '';

    if (err.status === 401) {
      if (serverMessage.includes('deactivated')) {
        return 'Account is deactivated. Please contact your administrator.';
      }
      return 'Invalid email or password. Please try again.';
    }

    if (err.status === 423) {
      const minutesMatch = serverMessage.match(/(\d+)\s*minute/);
      if (minutesMatch) {
        return `Account is locked. Try again in ${minutesMatch[1]} minutes.`;
      }
      return 'Account is locked due to too many failed attempts. Try again in 15 minutes.';
    }

    if (err.status === 429) {
      return 'Too many login attempts. Please wait and try again.';
    }

    return 'An unexpected error occurred. Please try again later.';
  }
}
