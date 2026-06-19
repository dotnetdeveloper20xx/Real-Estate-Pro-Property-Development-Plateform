import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalShellComponent } from '../../../../shared/components/modal-shell/modal-shell.component';
import { DocumentService } from '../../services';
import { ToastService } from '../../../../core/services/toast.service';
import { DocumentType } from '../../models';

/** Maximum file size in bytes (25 MB) */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

/** Accepted file extensions */
const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.png';

/** Accepted MIME types for validation */
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png'
];

/**
 * Modal for uploading a document to an opportunity.
 * Features a drag-and-drop zone with file type validation and size limits.
 *
 * Usage:
 * ```html
 * <app-document-upload-modal
 *   [visible]="showUploadModal"
 *   [opportunityId]="opportunityId"
 *   (closed)="showUploadModal = false"
 *   (uploaded)="onDocumentUploaded()">
 * </app-document-upload-modal>
 * ```
 */
@Component({
  selector: 'app-document-upload-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-shell
      [visible]="visible"
      title="Upload Document"
      icon="upload_file"
      size="md"
      [loading]="loading"
      (closed)="onClose()">

      <!-- Form body -->
      <form #uploadForm="ngForm" (ngSubmit)="onSave()">
        <!-- Document Type -->
        <div class="form-control w-full mb-4">
          <label class="label" for="doc-type">
            <span class="label-text font-medium">Document Type <span class="text-error">*</span></span>
          </label>
          <select
            id="doc-type"
            class="select select-bordered select-sm w-full"
            [(ngModel)]="selectedDocType"
            name="docType"
            #docTypeField="ngModel"
            required
            aria-label="Document type">
            <option value="" disabled>Select document type</option>
            <option *ngFor="let dt of docTypeOptions" [value]="dt.value">{{ dt.label }}</option>
          </select>
          <label class="label" *ngIf="docTypeField.touched && !selectedDocType">
            <span class="label-text-alt text-error">Please select a document type</span>
          </label>
        </div>

        <!-- File upload with drag-drop zone -->
        <div class="form-control w-full mb-4">
          <label class="label">
            <span class="label-text font-medium">File <span class="text-error">*</span></span>
          </label>

          <!-- Drop zone -->
          <div
            class="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer"
            [class.border-primary]="isDragging"
            [class.bg-primary/5]="isDragging"
            [class.border-base-300]="!isDragging && !selectedFile"
            [class.border-success]="!!selectedFile && !fileError"
            [class.border-error]="!!fileError"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
            role="button"
            aria-label="Click or drag a file to upload"
            tabindex="0"
            (keydown.enter)="fileInput.click()"
            (keydown.space)="fileInput.click()">

            <input
              #fileInput
              type="file"
              class="hidden"
              [accept]="acceptedExtensions"
              (change)="onFileSelected($event)" />

            <div *ngIf="!selectedFile">
              <span class="material-symbols-outlined text-4xl text-base-content/40 mb-2">cloud_upload</span>
              <p class="text-sm text-base-content/70 font-medium">
                Drag & drop a file here, or click to browse
              </p>
              <p class="text-xs text-base-content/50 mt-1">
                Accepted: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max 25 MB)
              </p>
            </div>

            <div *ngIf="selectedFile" class="flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-success">description</span>
              <span class="text-sm font-medium truncate max-w-[200px]">{{ selectedFile.name }}</span>
              <span class="text-xs text-base-content/50">({{ formatFileSize(selectedFile.size) }})</span>
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-circle"
                (click)="removeFile($event)"
                aria-label="Remove selected file">
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>

          <!-- File error -->
          <label class="label" *ngIf="fileError">
            <span class="label-text-alt text-error">{{ fileError }}</span>
          </label>
        </div>

        <!-- Error message -->
        <div *ngIf="errorMessage" class="alert alert-error text-sm mb-4" role="alert">
          <span class="material-symbols-outlined text-sm">error</span>
          <span>{{ errorMessage }}</span>
        </div>
      </form>

      <!-- Footer -->
      <div modal-footer class="flex justify-end gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          (click)="onClose()"
          [disabled]="loading">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          (click)="onSave()"
          [disabled]="loading || !isFormValid">
          <span *ngIf="loading" class="loading loading-spinner loading-xs"></span>
          Upload
        </button>
      </div>
    </app-modal-shell>
  `
})
export class DocumentUploadModalComponent implements OnChanges {
  /** Controls modal visibility */
  @Input() visible = false;

  /** The opportunity to upload the document to */
  @Input() opportunityId = '';

  /** Emitted when the modal is closed */
  @Output() closed = new EventEmitter<void>();

  /** Emitted when a document is uploaded successfully */
  @Output() uploaded = new EventEmitter<void>();

  private readonly documentService = inject(DocumentService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Form fields */
  selectedDocType: DocumentType | '' = '';
  selectedFile: File | null = null;
  fileError = '';
  loading = false;
  errorMessage = '';
  isDragging = false;

  /** Accepted file extensions for the file input */
  readonly acceptedExtensions = ACCEPTED_EXTENSIONS;

  /** Document type options for the dropdown */
  readonly docTypeOptions: { value: DocumentType; label: string }[] = [
    { value: DocumentType.TitleDeed, label: 'Title Deed' },
    { value: DocumentType.SearchReport, label: 'Search Report' },
    { value: DocumentType.LegalDocument, label: 'Legal Document' },
    { value: DocumentType.EnvironmentalReport, label: 'Environmental Report' },
    { value: DocumentType.PlanningDocument, label: 'Planning Document' },
    { value: DocumentType.Contract, label: 'Contract' },
    { value: DocumentType.Valuation, label: 'Valuation' },
    { value: DocumentType.Correspondence, label: 'Correspondence' }
  ];

  /** Form validity check */
  get isFormValid(): boolean {
    return !!this.selectedDocType && !!this.selectedFile && !this.fileError;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
    }
  }

  /** Handle drag over event */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    this.cdr.markForCheck();
  }

  /** Handle drag leave event */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    this.cdr.markForCheck();
  }

  /** Handle file drop event */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
    this.cdr.markForCheck();
  }

  /** Handle file selected via input */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.validateAndSetFile(input.files[0]);
    }
    // Reset input so same file can be re-selected
    input.value = '';
    this.cdr.markForCheck();
  }

  /** Remove the selected file */
  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.fileError = '';
    this.cdr.markForCheck();
  }

  /** Format file size for display */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /** Handle form submission */
  onSave(): void {
    if (!this.isFormValid || this.loading || !this.selectedFile) return;

    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.documentService.upload(
      this.opportunityId,
      this.selectedFile,
      this.selectedDocType as DocumentType
    ).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.toastService.showSuccess('Document uploaded successfully');
          this.uploaded.emit();
          this.closed.emit();
        } else {
          this.errorMessage = response.errors?.[0] || 'Failed to upload document';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.errors?.[0] || 'An unexpected error occurred. Please try again.';
        this.toastService.showError('Failed to upload document');
        this.cdr.markForCheck();
      }
    });
  }

  /** Close the modal */
  onClose(): void {
    if (this.loading) return;
    this.closed.emit();
  }

  /** Validate file type and size, then set as selected */
  private validateAndSetFile(file: File): void {
    this.fileError = '';

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      this.fileError = `File is too large. Maximum size is 25 MB (selected: ${this.formatFileSize(file.size)})`;
      this.selectedFile = null;
      return;
    }

    // Check file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png'];
      if (!allowedExts.includes(ext)) {
        this.fileError = 'File type not supported. Accepted: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG';
        this.selectedFile = null;
        return;
      }
    }

    this.selectedFile = file;
  }

  /** Reset form to initial state */
  private resetForm(): void {
    this.selectedDocType = '';
    this.selectedFile = null;
    this.fileError = '';
    this.loading = false;
    this.errorMessage = '';
    this.isDragging = false;
  }
}
