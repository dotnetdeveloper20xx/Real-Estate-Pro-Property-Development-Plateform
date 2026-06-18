import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { isDevMode } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthService, ILoginResponse } from '../../core/services/auth.service';
import { AuthActions } from '../../core/store/auth';

interface ILoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
  rememberMe: FormControl<boolean>;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Dev Mode Banner -->
    <div *ngIf="isDevModeActive"
         class="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 text-center py-2 text-sm font-semibold">
      <span class="material-symbols-outlined text-base align-middle mr-1">warning</span>
      Development Mode — Authentication Bypassed
    </div>

    <div class="min-h-screen flex bg-slate-100" [class.pt-10]="isDevModeActive">
      <!-- Left Panel: Dark Branding -->
      <div class="hidden lg:flex lg:w-[300px] xl:w-[340px] flex-col items-center justify-center px-8 text-center"
           style="background: linear-gradient(180deg, #1a1f3d 0%, #252b4a 100%);">
        <div class="mb-6">
          <span class="material-symbols-outlined text-white text-6xl">apartment</span>
        </div>
        <h1 class="text-xl font-bold text-white mb-1">BuildEstate Pro</h1>
        <p class="text-sm text-blue-200/80 mb-1">Real Estate Development</p>
        <p class="text-sm text-blue-200/80 mb-6">Management Platform</p>
        <p class="text-sm font-semibold text-white mb-5">Secure. Scalable. Smart.</p>
        <ul class="text-left space-y-2.5 text-sm text-slate-300">
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Enterprise-grade security
          </li>
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Role-based access control
          </li>
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Complete audit logging
          </li>
        </ul>
      </div>

      <!-- Center Panel: Login Form -->
      <div class="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div class="w-full max-w-sm">
          <!-- Mobile brand -->
          <div class="lg:hidden text-center mb-6">
            <span class="material-symbols-outlined text-primary text-4xl">apartment</span>
            <h1 class="text-xl font-bold text-base-content mt-2">BuildEstate Pro</h1>
          </div>

          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-base-content">Welcome Back</h2>
            <p class="text-sm text-base-content/60 mt-1">Sign in to your account</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
            <!-- Email -->
            <div>
              <label class="text-sm font-medium text-base-content mb-1.5 block">Email Address</label>
              <input type="email" formControlName="email" placeholder="you@buildestate.co.uk"
                     class="input input-bordered w-full" autocomplete="email"
                     [class.input-error]="showFieldError('email')" (blur)="onEmailBlur()" />
              <p *ngIf="showFieldError('email')" class="text-xs text-error mt-1">Please enter a valid email address</p>
            </div>

            <!-- Password -->
            <div>
              <label class="text-sm font-medium text-base-content mb-1.5 block">Password</label>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" formControlName="password"
                       placeholder="••••••••••••" class="input input-bordered w-full pr-10"
                       autocomplete="current-password" [class.input-error]="showFieldError('password')" />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                        (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Hide' : 'Show'">
                  <span class="material-symbols-outlined text-xl">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              <p *ngIf="showFieldError('password')" class="text-xs text-error mt-1">Password is required</p>
            </div>

            <!-- Remember + Forgot -->
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" formControlName="rememberMe" class="checkbox checkbox-sm checkbox-primary" />
                <span class="text-sm text-base-content/70">Remember me</span>
              </label>
              <a class="text-sm text-primary hover:underline cursor-pointer">Forgot password?</a>
            </div>

            <!-- Error -->
            <div *ngIf="errorMessage" class="bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2" role="alert">
              <span class="material-symbols-outlined text-error text-lg mt-0.5">error</span>
              <span class="text-sm text-error">{{ errorMessage }}</span>
            </div>

            <!-- Submit -->
            <button type="submit" class="btn btn-primary w-full" [disabled]="isLoading">
              <span *ngIf="isLoading" class="loading loading-spinner loading-sm"></span>
              {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <!-- Dev Mode -->
          <div *ngIf="showDevModeLink" class="mt-6 text-center">
            <p class="text-xs text-base-content/40 mb-2">or</p>
            <button type="button" (click)="enterDevMode()" class="text-sm text-primary hover:underline">
              Continue without signing in (Dev Mode)
            </button>
          </div>
        </div>
      </div>

      <!-- Right Panel: Auth Flow & Security -->
      <div class="hidden xl:flex xl:w-[320px] flex-col justify-center p-8 bg-blue-50/50 border-l border-base-200">
        <!-- Authentication Flow -->
        <div class="mb-8">
          <h3 class="text-sm font-bold text-base-content mb-4">Authentication Flow</h3>
          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <span class="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <p class="text-xs font-semibold text-base-content">Enter credentials</p>
                <p class="text-[11px] text-base-content/50">User enters email &amp; password</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <span class="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <p class="text-xs font-semibold text-base-content">Validate</p>
                <p class="text-[11px] text-base-content/50">System validates credentials</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <span class="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <p class="text-xs font-semibold text-base-content">Access Token</p>
                <p class="text-[11px] text-base-content/50">JWT access token issued (Valid for 1 hour)</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <span class="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">4</span>
              <div>
                <p class="text-xs font-semibold text-base-content">Refresh Token</p>
                <p class="text-[11px] text-base-content/50">Stored securely (httpOnly cookie)</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <span class="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">5</span>
              <div>
                <p class="text-xs font-semibold text-base-content">Auto Refresh</p>
                <p class="text-[11px] text-base-content/50">Silent refresh before expiry</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <span class="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">6</span>
              <div>
                <p class="text-xs font-semibold text-base-content">Secure Access</p>
                <p class="text-[11px] text-base-content/50">Access granted to the system</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Security Features -->
        <div>
          <h3 class="text-sm font-bold text-base-content mb-3">Security Features</h3>
          <ul class="space-y-2 text-[11px] text-base-content/70">
            <li class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[14px]">check</span>
              5 failed attempts = Account locked (15 min)
            </li>
            <li class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[14px]">check</span>
              Passwords hashed (bcrypt + salt)
            </li>
            <li class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[14px]">check</span>
              Immediate session revocation
            </li>
            <li class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[14px]">check</span>
              All actions are audit logged
            </li>
            <li class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[14px]">check</span>
              HTTPS only, secure cookies, CSRF protected
            </li>
          </ul>
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

  readonly showDevModeLink = isDevMode();

  readonly loginForm: FormGroup<ILoginForm> = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false]
  });

  showFieldError(field: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[field];
    if (field === 'email') {
      return (this.submitted || this.emailTouched) && control.invalid;
    }
    return this.submitted && control.invalid;
  }

  onEmailBlur(): void {
    this.emailTouched = true;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    const { email, password } = this.loginForm.getRawValue();

    this.authService.login(email, password).subscribe({
      next: (response: ILoginResponse) => {
        this.isLoading = false;
        this.store.dispatch(AuthActions.loginSuccess({ response }));
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }

  enterDevMode(): void {
    this.isDevModeActive = true;
    this.router.navigate(['/home']);
  }

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
      if (minutesMatch) return `Account is locked. Try again in ${minutesMatch[1]} minutes.`;
      return 'Account is locked due to too many failed attempts. Try again in 15 minutes.';
    }
    if (err.status === 429) return 'Too many login attempts. Please wait and try again.';
    return 'An unexpected error occurred. Please try again later.';
  }
}
