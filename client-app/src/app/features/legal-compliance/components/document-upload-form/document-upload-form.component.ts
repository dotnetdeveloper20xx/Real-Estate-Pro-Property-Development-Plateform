import { Component, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { LegalDocumentType, ConfidentialityLevel } from '../../models/legal-document.model';

/**
 * Event payload emitted when a document upload is requested.
 */
export interface IDocumentUploadRequest {
  readonly file: File;
  readonly documentType: LegalDocumentType;
  readonly confidentialityLevel: ConfidentialityLevel;
}

/**
 * Form interface for typed reactive form.
 */
interface IDocumentUploadForm {
  documentType: FormControl<LegalDocumentType>;
  confidentialityLevel: FormControl<ConfidentialityLevel>;
}

/**
 * DocumentUploadFormComponent — A presentational form component for uploading
 * legal documents with file selection, document type, and confidentiality level.
 *
 * Uses Angular Reactive Forms with DaisyUI form styling.
 *
 * @example
 * ```html
 * <app-document-upload-form
 *   (uploadRequested)="onUpload($event)">
 * </app-document-upload-form>
 * ```
 */
@Component({
  selector: 'app-document-upload-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
      <!-- File Input -->
      <div class="form-control w-full">
        <label class="label" for="file-input">
          <span class="label-text font-medium">Document File</span>
        </label>
        <input
          id="file-input"
          type="file"
          class="file-input file-input-bordered file-input-sm w-full"
          (change)="onFileSelected($event)"
          [attr.aria-invalid]="!selectedFile && formSubmitted"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        />
        <label class="label" *ngIf="!selectedFile && formSubmitted">
          <span class="label-text-alt text-error">Please select a file to upload.</span>
        </label>
        <label class="label" *ngIf="selectedFile">
          <span class="label-text-alt text-base-content/50">
            {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
          </span>
        </label>
      </div>

      <!-- Document Type Select -->
      <div class="form-control w-full">
        <label class="label" for="document-type">
          <span class="label-text font-medium">Document Type</span>
        </label>
        <select
          id="document-type"
          class="select select-bordered select-sm w-full"
          formControlName="documentType"
        >
          <option *ngFor="let type of documentTypes" [value]="type">
            {{ formatEnumValue(type) }}
          </option>
        </select>
      </div>

      <!-- Confidentiality Level Select -->
      <div class="form-control w-full">
        <label class="label" for="confidentiality-level">
          <span class="label-text font-medium">Confidentiality Level</span>
        </label>
        <select
          id="confidentiality-level"
          class="select select-bordered select-sm w-full"
          formControlName="confidentialityLevel"
        >
          <option *ngFor="let level of confidentialityLevels" [value]="level">
            {{ formatEnumValue(level) }}
          </option>
        </select>
      </div>

      <!-- Submit Button -->
      <div class="form-control mt-4">
        <button
          type="submit"
          class="btn btn-primary btn-sm"
          [disabled]="form.invalid && formSubmitted"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Document
        </button>
      </div>
    </form>
  `
})
export class DocumentUploadFormComponent {
  /** Emits when the form is submitted with valid data. */
  @Output() uploadRequested = new EventEmitter<IDocumentUploadRequest>();

  /** Available document types for the select. */
  readonly documentTypes: readonly LegalDocumentType[] = Object.values(LegalDocumentType);

  /** Available confidentiality levels for the select. */
  readonly confidentialityLevels: readonly ConfidentialityLevel[] = Object.values(ConfidentialityLevel);

  /** The selected file from the file input. */
  selectedFile: File | null = null;

  /** Tracks whether the form has been submitted (for validation display). */
  formSubmitted = false;

  /** Typed reactive form. */
  form = new FormGroup<IDocumentUploadForm>({
    documentType: new FormControl<LegalDocumentType>(LegalDocumentType.Contract, {
      nonNullable: true,
      validators: [Validators.required]
    }),
    confidentialityLevel: new FormControl<ConfidentialityLevel>(ConfidentialityLevel.Internal, {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  /** Handles file selection from the file input. */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  /** Handles form submission. */
  onSubmit(): void {
    this.formSubmitted = true;

    if (!this.selectedFile || this.form.invalid) {
      return;
    }

    const payload: IDocumentUploadRequest = {
      file: this.selectedFile,
      documentType: this.form.controls.documentType.value,
      confidentialityLevel: this.form.controls.confidentialityLevel.value
    };

    this.uploadRequested.emit(payload);

    // Reset form state after emission
    this.selectedFile = null;
    this.formSubmitted = false;
    this.form.reset({
      documentType: LegalDocumentType.Contract,
      confidentialityLevel: ConfidentialityLevel.Internal
    });
  }

  /** Formats PascalCase enum value to a readable label. */
  formatEnumValue(value: string): string {
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /** Formats file size to a human-readable string. */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
