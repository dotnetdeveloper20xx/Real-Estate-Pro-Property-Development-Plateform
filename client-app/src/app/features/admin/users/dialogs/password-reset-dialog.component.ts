import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';

/**
 * Password validation rule for the live checklist.
 */
interface IPasswordRule {
  readonly label: string;
  readonly validator: (value: string) => boolean;
  met: boolean;
}

/**
 * Password Reset Dialog Component
 *
 * Features:
 * - Password entry with visibility toggle
 * - Requirements checklist with live validation (300ms debounce)
 * - "Password is not shared with anyone" notice
 * - Disable confirm until all requirements met
 * - Error preservation on failure
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
@Component({
  selector: 'app-password-reset-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <dialog class="modal" [class.modal-open]="open">
      <div class="modal-box w-full max-w-md">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span class="material-symbols-outlined text-primary">lock_reset</span>
          </div>
          <div>
            <h3 class="text-lg font-bold">Reset Password</h3>
            <p class="text-xs text-base-content/60">For {{ userName }}</p>
          </div>
        </div>

        <!-- Password Input -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">New Password</span>
          </label>
          <div class="relative">
            <input
              [type]="showPassword ? 'text' : 'password'"
              class="input input-bordered w-full pr-10"
              [(ngModel)]="password"
              (ngModelChange)="onPasswordChange($event)"
              placeholder="Enter new password"
              [class.input-error]="errorMessage" />
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
          <label class="label" *ngIf="errorMessage">
            <span class="label-text-alt text-error">{{ errorMessage }}</span>
          </label>
        </div>

        <!-- Password Requirements Checklist -->
        <div class="mt-4 p-3 bg-base-200/50 rounded-lg">
          <p class="text-xs font-medium text-base-content/60 mb-2">Password Requirements</p>
          <div class="space-y-1">
            <div *ngFor="let rule of passwordRules" class="flex items-center gap-2 text-sm">
              <span class="material-symbols-outlined text-sm"
                [ngClass]="rule.met ? 'text-success' : 'text-base-content/30'">
                {{ rule.met ? 'check_circle' : 'radio_button_unchecked' }}
              </span>
              <span [ngClass]="rule.met ? 'text-success' : 'text-base-content/60'">
                {{ rule.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- Privacy notice -->
        <div class="flex items-center gap-2 mt-3 text-xs text-base-content/50">
          <span class="material-symbols-outlined text-xs">info</span>
          <span>Password is not shared with anyone</span>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" (click)="onCancel()" [disabled]="processing">
            Cancel
          </button>
          <button class="btn btn-primary" (click)="onConfirm()"
            [disabled]="processing || !allRulesMet">
            <span *ngIf="processing" class="loading loading-spinner loading-sm"></span>
            Reset Password
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button (click)="onCancel()">close</button>
      </form>
    </dialog>
  `
})
export class PasswordResetDialogComponent implements OnDestroy {
  @Input() open = false;
  @Input() userName = '';
  @Input() processing = false;
  @Input() errorMessage = '';
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  password = '';
  showPassword = false;

  private readonly destroy$ = new Subject<void>();
  private readonly passwordChange$ = new Subject<string>();

  passwordRules: IPasswordRule[] = [
    { label: 'Minimum 8 characters', validator: (v) => v.length >= 8, met: false },
    { label: 'Maximum 128 characters', validator: (v) => v.length <= 128 && v.length > 0, met: false },
    { label: 'At least 1 uppercase letter', validator: (v) => /[A-Z]/.test(v), met: false },
    { label: 'At least 1 number', validator: (v) => /[0-9]/.test(v), met: false },
    { label: 'At least 1 special character', validator: (v) => /[!@#$%^&*()\-_+=\[\]{}|;:',.<>?/`~]/.test(v), met: false }
  ];

  constructor() {
    this.passwordChange$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.updateChecklist(value);
    });
  }

  get allRulesMet(): boolean {
    return this.password.length > 0 && this.passwordRules.every(r => r.met);
  }

  onPasswordChange(value: string): void {
    this.passwordChange$.next(value);
    // Immediate update for responsiveness
    this.updateChecklist(value);
  }

  onConfirm(): void {
    if (this.allRulesMet) {
      this.confirm.emit(this.password);
    }
  }

  onCancel(): void {
    this.password = '';
    this.showPassword = false;
    this.resetChecklist();
    this.cancel.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateChecklist(value: string): void {
    this.passwordRules = this.passwordRules.map(rule => ({
      ...rule,
      met: rule.validator(value)
    }));
  }

  private resetChecklist(): void {
    this.passwordRules = this.passwordRules.map(rule => ({
      ...rule,
      met: false
    }));
  }
}
