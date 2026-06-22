import { Component, ChangeDetectionStrategy, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseFormControl } from '../shared/base-form-control';

/**
 * Multi-select form control component.
 *
 * Provides a checkbox-based dropdown for selecting multiple options.
 * Extends BaseFormControl<string[]> and integrates with Angular Reactive Forms.
 *
 * Uses a DaisyUI dropdown with checkboxes for each option.
 *
 * @requirements 5.1, 5.11
 */
@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-control w-full">
      <!-- Label -->
      <label class="label" [attr.for]="controlId">
        <span class="label-text">
          {{ label }}
          @if (required) {
            <span class="text-error" aria-hidden="true">*</span>
          }
        </span>
      </label>

      <!-- Multi-select dropdown -->
      <div class="dropdown w-full" [id]="controlId">
        <div
          tabindex="0"
          role="listbox"
          [attr.aria-multiselectable]="true"
          [attr.aria-expanded]="dropdownOpen()"
          [attr.aria-describedby]="ariaDescribedBy()"
          [attr.aria-invalid]="ariaInvalid()"
          [attr.aria-disabled]="ariaDisabledAttr()"
          [attr.aria-required]="required || undefined"
          [attr.aria-label]="label"
          class="select select-bordered w-full flex items-center"
          [class.select-error]="showErrors()"
          [class.opacity-50]="isDisabled()"
          [class.pointer-events-none]="isDisabled()"
          (blur)="onDropdownBlur()"
          (click)="toggleDropdown()"
          (keydown.enter)="toggleDropdown()"
          (keydown.space)="toggleDropdown(); $event.preventDefault()"
        >
          <span class="truncate flex-1 text-left">
            @if (selectedLabels().length === 0) {
              <span class="opacity-50">{{ placeholder || 'Select options...' }}</span>
            } @else {
              {{ selectedLabels().join(', ') }}
            }
          </span>
        </div>

        @if (dropdownOpen() && !isDisabled()) {
          <ul
            tabindex="0"
            class="dropdown-content menu bg-base-100 rounded-box z-10 w-full p-2 shadow-lg border border-base-300 max-h-60 overflow-y-auto"
            role="group"
            [attr.aria-label]="label + ' options'"
          >
            @for (option of options; track option.value) {
              <li>
                <label class="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    [checked]="isSelected(option.value)"
                    [attr.aria-label]="option.label"
                    (change)="toggleOption(option.value)"
                  />
                  <span class="label-text">{{ option.label }}</span>
                </label>
              </li>
            }
          </ul>
        }
      </div>

      <!-- Help Text -->
      @if (helpText) {
        <label class="label" [id]="helpTextId">
          <span class="label-text-alt">{{ helpText }}</span>
        </label>
      }

      <!-- Error Messages -->
      @if (showErrors()) {
        <label class="label" [id]="errorId">
          @for (msg of errorMessages(); track msg) {
            <span class="label-text-alt text-error">{{ msg }}</span>
          }
        </label>
      }
    </div>
  `,
})
export class MultiSelectComponent extends BaseFormControl<string[]> {
  @Input() options: { value: string; label: string }[] = [];

  readonly dropdownOpen = signal(false);

  readonly selectedLabels = computed(() => {
    const selected = this.value() ?? [];
    return this.options
      .filter((opt) => selected.includes(opt.value))
      .map((opt) => opt.label);
  });

  isSelected(optionValue: string): boolean {
    const current = this.value() ?? [];
    return current.includes(optionValue);
  }

  toggleOption(optionValue: string): void {
    const current = this.value() ?? [];
    const newValue = current.includes(optionValue)
      ? current.filter((v) => v !== optionValue)
      : [...current, optionValue];
    this.updateValue(newValue);
  }

  toggleDropdown(): void {
    if (!this.isDisabled()) {
      this.dropdownOpen.update((open) => !open);
    }
  }

  onDropdownBlur(): void {
    // Delay closing to allow checkbox clicks to register
    setTimeout(() => {
      this.dropdownOpen.set(false);
      this.markAsTouched();
    }, 200);
  }
}
