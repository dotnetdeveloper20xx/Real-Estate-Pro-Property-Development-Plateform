import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DocumentService } from '../../services/document.service';
import { IDocument, IApiResponse, DocumentType } from '../../models';

/** Maximum allowed file size in bytes (25 MB). */
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/** Allowed MIME types for upload. */
const ALLOWED_CONTENT_TYPES: readonly string[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg'
];

/** Human-readable label for allowed file extensions. */
const ALLOWED_EXTENSIONS = '.pdf, .docx, .xlsx, .png, .jpg';

/**
 * Document upload component with drag-and-drop support, file type/size validation,
 * document type selection, upload progress indicator, and error display.
 *
 * Usage:
 * ```html
 * <app-document-upload
 *   [opportunityId]="opportunity.id"
 *   (uploaded)="onDocumentUploaded($event)">
 * </app-document-upload>
 * ```
 */
@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card bg-base-100 shadow-sm border border-base-300">
      <div class="card-body p-5">
        <h3 class="card-title text-lg mb-1">Upload Document</h3>
        <p class="text-sm text-base-content/60 mb-4">
          Attach documents to this opportunity. Allowed formats: PDF, DOCX, XLSX, PNG, JPG (max 25 MB).
        </p>

        <!-- Document Type Selector -->
        <div class="form-control mb-4">
          <label class="label" for="docType">
            <span class="label-text font-medium">Document Type</span>
          </label>
          <select
            id="docType"
            class="select select-bordered w-full"
            [ngModel]="selectedDocType()"
            (ngModelChange)="onDocTypeChange($event)"
            [disabled]="isUploading()"
            aria-label="Select document type">
            <option value="" disabled>Select a document type</option>
            @for (dt of documentTypes; track dt.value) {
              <option [value]="dt.value">{{ dt.label }}</option>
            }
          </select>
        </div>

        <!-- Drag and Drop Area -->
        <div
          class="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
          [class.border-primary]="isDragOver()"
          [class.bg-primary/5]="isDragOver()"
          [class.border-base-300]="!isDragOver()"
          [class.hover:border-primary/60]="!isUploading()"
          [class.opacity-50]="isUploading()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
          role="button"
          tabindex="0"
          (keydown.enter)="fileInput.click()"
          (keydown.space)="fileInput.click()"
          [attr.aria-label]="selectedFile() ? 'File selected: ' + selectedFile()!.name : 'Click or drag a file to upload'">

          <input
            #fileInput
            type="file"
            class="hidden"
            [accept]="acceptString"
            (change)="onFileSelected($event)"
            [disabled]="isUploading()"
            aria-hidden="true" />

          @if (!selectedFile()) {
            <div class="flex flex-col items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-sm font-medium text-base-content/70">
                Drag & drop a file here, or click to browse
              </p>
              <p class="text-xs text-base-content/50">{{ ALLOWED_EXTENSIONS }} — Max 25 MB</p>
            </div>
          } @else {
            <div class="flex flex-col items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-sm font-medium text-base-content">{{ selectedFile()!.name }}</p>
              <p class="text-xs text-base-content/50">{{ formatFileSize(selectedFile()!.size) }}</p>
              @if (!isUploading()) {
                <button
                  type="button"
                  class="btn btn-xs btn-ghost text-error mt-1"
                  (click)="clearFile($event)"
                  aria-label="Remove selected file">
                  Remove
                </button>
              }
            </div>
          }
        </div>

        <!-- Validation Errors -->
        @if (validationError()) {
          <div class="alert alert-error mt-3 py-2 text-sm" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ validationError() }}</span>
          </div>
        }

        <!-- Upload Error -->
        @if (uploadError()) {
          <div class="alert alert-error mt-3 py-2 text-sm" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 11-12.728 0M12 8v4m0 4h.01" />
            </svg>
            <span>{{ uploadError() }}</span>
          </div>
        }

        <!-- Upload Progress -->
        @if (isUploading()) {
          <div class="mt-4" role="progressbar" [attr.aria-valuenow]="uploadProgress()" aria-valuemin="0" aria-valuemax="100" aria-label="Upload progress">
            <div class="flex justify-between text-xs text-base-content/60 mb-1">
              <span>Uploading…</span>
              <span>{{ uploadProgress() }}%</span>
            </div>
            <progress
              class="progress progress-primary w-full"
              [value]="uploadProgress()"
              max="100">
            </progress>
          </div>
        }

        <!-- Upload Button -->
        <div class="mt-4 flex justify-end">
          <button
            type="button"
            class="btn btn-primary btn-sm"
            [disabled]="!canUpload()"
            (click)="onUpload()"
            aria-label="Upload document">
            @if (isUploading()) {
              <span class="loading loading-spinner loading-xs"></span>
              Uploading…
            } @else {
              Upload Document
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class DocumentUploadComponent {
  /** The opportunity to attach the document to. */
  @Input({ required: true }) opportunityId!: string;

  /** Emitted when a document is successfully uploaded. */
  @Output() uploaded = new EventEmitter<IDocument>();

  /** Exposed for template usage. */
  readonly ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS;
  readonly acceptString = '.pdf,.docx,.xlsx,.png,.jpg,.jpeg';

  /** Available document types for selection. */
  readonly documentTypes: readonly { value: DocumentType; label: string }[] = [
    { value: DocumentType.TitleDeed, label: 'Title Deed' },
    { value: DocumentType.SearchReport, label: 'Search Report' },
    { value: DocumentType.LegalDocument, label: 'Legal Document' },
    { value: DocumentType.EnvironmentalReport, label: 'Environmental Report' },
    { value: DocumentType.PlanningDocument, label: 'Planning Document' },
    { value: DocumentType.Contract, label: 'Contract' },
    { value: DocumentType.Valuation, label: 'Valuation' },
    { value: DocumentType.Correspondence, label: 'Correspondence' }
  ];

  /** Reactive state signals. */
  readonly selectedDocType = signal<DocumentType | ''>('');
  readonly selectedFile = signal<File | null>(null);
  readonly isDragOver = signal(false);
  readonly isUploading = signal(false);
  readonly uploadProgress = signal(0);
  readonly validationError = signal<string | null>(null);
  readonly uploadError = signal<string | null>(null);

  /** Computed: whether the upload button should be enabled. */
  readonly canUpload = computed(
    () =>
      !!this.selectedFile() &&
      !!this.selectedDocType() &&
      !this.isUploading() &&
      !this.validationError()
  );

  constructor(private readonly documentService: DocumentService) {}

  /** Handle document type dropdown change. */
  onDocTypeChange(value: DocumentType | ''): void {
    this.selectedDocType.set(value);
  }

  /** Handle file input change event. */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setFile(file);
    // Reset input so the same file can be re-selected
    input.value = '';
  }

  /** Drag over handler — prevents default and updates visual state. */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isUploading()) {
      this.isDragOver.set(true);
    }
  }

  /** Drag leave handler — resets visual state. */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  /** Drop handler — extracts file from drop event. */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (this.isUploading()) {
      return;
    }

    const file = event.dataTransfer?.files[0] ?? null;
    this.setFile(file);
  }

  /** Remove the currently selected file. */
  clearFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.validationError.set(null);
    this.uploadError.set(null);
  }

  /** Trigger the upload to the backend via DocumentService. */
  onUpload(): void {
    const file = this.selectedFile();
    const docType = this.selectedDocType();

    if (!file || !docType || this.isUploading()) {
      return;
    }

    this.uploadError.set(null);
    this.isUploading.set(true);
    this.uploadProgress.set(0);

    this.documentService.upload(this.opportunityId, file, docType as DocumentType).subscribe({
      next: (response: IApiResponse<IDocument>) => {
        if (response.success && response.data) {
          this.uploaded.emit(response.data);
          this.resetState();
        } else {
          const errorMsg = response.errors?.length
            ? response.errors.join('. ')
            : 'Upload failed. Please try again.';
          this.uploadError.set(errorMsg);
          this.isUploading.set(false);
          this.uploadProgress.set(0);
        }
      },
      error: (err: { error?: { errors?: string[] } }) => {
        const message =
          err?.error?.errors?.length
            ? err.error.errors.join('. ')
            : 'An unexpected error occurred during upload. Please try again.';
        this.uploadError.set(message);
        this.isUploading.set(false);
        this.uploadProgress.set(0);
      }
    });
  }

  /** Format bytes into a human-readable size string. */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  /** Validate and set the selected file. */
  private setFile(file: File | null): void {
    this.validationError.set(null);
    this.uploadError.set(null);

    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.validationError.set(
        `File size (${this.formatFileSize(file.size)}) exceeds the maximum allowed size of 25 MB.`
      );
      this.selectedFile.set(null);
      return;
    }

    // Validate content type
    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
      this.validationError.set(
        `File type "${file.type || 'unknown'}" is not allowed. Please upload a PDF, DOCX, XLSX, PNG, or JPG file.`
      );
      this.selectedFile.set(null);
      return;
    }

    this.selectedFile.set(file);
  }

  /** Reset all component state after a successful upload. */
  private resetState(): void {
    this.selectedFile.set(null);
    this.selectedDocType.set('');
    this.isUploading.set(false);
    this.uploadProgress.set(0);
    this.validationError.set(null);
    this.uploadError.set(null);
  }
}
