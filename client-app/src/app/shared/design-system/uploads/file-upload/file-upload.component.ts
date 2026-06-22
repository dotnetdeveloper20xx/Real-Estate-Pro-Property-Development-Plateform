import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Represents the state of a file in the upload queue.
 */
export type FileUploadStatus = 'pending' | 'uploading' | 'complete' | 'error';

/**
 * Tracks state for each file in the upload list.
 */
export interface IFileEntry {
  /** The native File object */
  file: File;
  /** Current upload status */
  status: FileUploadStatus;
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Error message if validation or upload failed */
  error: string | null;
  /** Whether this is an image file that can be previewed */
  isImage: boolean;
  /** Object URL for image thumbnail preview */
  thumbnailUrl: string | null;
  /** Server response payload after successful upload */
  response: unknown;
}

/** Image MIME types eligible for thumbnail preview */
export const IMAGE_MIME_TYPES_SET = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

/** @internal Alias for backward compatibility within the component */
const IMAGE_MIME_TYPES = IMAGE_MIME_TYPES_SET;

/**
 * File Upload Component (`app-file-upload`)
 *
 * Provides a click-to-browse and drag-and-drop file selection UI with
 * per-file progress bars, image thumbnails, validation, removal, and retry.
 *
 * This component does NOT perform the actual HTTP upload. It provides
 * the UI and emits events — the parent handles upload HTTP calls and
 * feeds back progress/completion/error via public methods.
 *
 * @requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */
@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Drop Zone -->
    <div
      class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
      [class.border-primary]="isDragOver()"
      [class.border-base-300]="!isDragOver()"
      [class.bg-base-200]="isDragOver()"
      (click)="openFileBrowser()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      role="button"
      tabindex="0"
      (keydown.enter)="openFileBrowser()"
      (keydown.space)="openFileBrowser()"
      [attr.aria-label]="multiple ? 'Drop files here or click to browse (max ' + maxFiles + ' files)' : 'Drop a file here or click to browse'"
    >
      <span class="material-symbols-outlined text-base-content/40 mb-2" style="font-size: 40px;" aria-hidden="true">
        cloud_upload
      </span>
      <p class="text-sm text-base-content/70">
        {{ multiple ? 'Drag & drop files here, or click to browse' : 'Drag & drop a file here, or click to browse' }}
      </p>
      <p class="text-xs text-base-content/50 mt-1">
        @if (accept) {
          Allowed: {{ accept }}
        }
        @if (maxSize) {
          &nbsp;| Max size: {{ maxSize }}MB
        }
      </p>
    </div>

    <!-- Hidden file input -->
    <input
      #fileInput
      type="file"
      class="hidden"
      [attr.multiple]="multiple ? '' : null"
      [attr.accept]="accept || null"
      (change)="onFileInputChange($event)"
      aria-hidden="true"
      tabindex="-1"
    />

    <!-- File List -->
    @if (fileEntries().length > 0) {
      <ul class="mt-4 space-y-2" role="list" aria-label="Selected files">
        @for (entry of fileEntries(); track entry.file.name + entry.file.lastModified) {
          <li class="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
            <!-- Preview / Icon -->
            <div class="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded overflow-hidden bg-base-300">
              @if (entry.isImage && entry.thumbnailUrl) {
                <img
                  [src]="entry.thumbnailUrl"
                  [alt]="entry.file.name"
                  class="w-16 h-16 object-cover"
                />
              } @else {
                <span class="material-symbols-outlined text-base-content/50" style="font-size: 32px;" aria-hidden="true">
                  {{ getFileIcon(entry.file) }}
                </span>
              }
            </div>

            <!-- File Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-base-content truncate">{{ entry.file.name }}</p>
              <p class="text-xs text-base-content/60">{{ formatFileSize(entry.file.size) }}</p>

              <!-- Progress Bar -->
              @if (entry.status === 'uploading') {
                <div class="w-full bg-base-300 rounded-full h-2 mt-1" role="progressbar"
                     [attr.aria-valuenow]="entry.progress"
                     aria-valuemin="0"
                     aria-valuemax="100"
                     [attr.aria-label]="'Uploading ' + entry.file.name + ': ' + entry.progress + '%'"
                >
                  <div
                    class="bg-primary h-2 rounded-full transition-all duration-300"
                    [style.width.%]="entry.progress"
                  ></div>
                </div>
                <p class="text-xs text-base-content/60 mt-0.5">{{ entry.progress }}%</p>
              }

              <!-- Complete indicator -->
              @if (entry.status === 'complete') {
                <p class="text-xs text-success mt-1 flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs" aria-hidden="true">check_circle</span>
                  Upload complete
                </p>
              }

              <!-- Error message -->
              @if (entry.error) {
                <p class="text-xs text-error mt-1" role="alert">{{ entry.error }}</p>
              }
            </div>

            <!-- Actions -->
            <div class="flex-shrink-0 flex items-center gap-1">
              <!-- Retry button (only on error from upload failure) -->
              @if (entry.status === 'error' && !isValidationError(entry)) {
                <button
                  type="button"
                  class="btn btn-ghost btn-xs"
                  (click)="onRetry(entry)"
                  [attr.aria-label]="'Retry upload for ' + entry.file.name"
                >
                  <span class="material-symbols-outlined text-sm" aria-hidden="true">refresh</span>
                </button>
              }

              <!-- Remove button -->
              @if (entry.status !== 'uploading') {
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-error"
                  (click)="onRemove(entry)"
                  [attr.aria-label]="'Remove ' + entry.file.name"
                >
                  <span class="material-symbols-outlined text-sm" aria-hidden="true">close</span>
                </button>
              }
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class FileUploadComponent {
  // ─── Inputs ──────────────────────────────────────────────────────────────────

  /** Whether multiple file selection is allowed */
  @Input() multiple = false;

  /** Maximum number of files allowed in multiple mode (default 10) */
  @Input() maxFiles = 10;

  /** Accepted file extensions (e.g. '.pdf,.docx,.jpg') */
  @Input() accept = '';

  /** Maximum file size in megabytes (default 25 MB) */
  @Input() maxSize = 25;

  // ─── Outputs ─────────────────────────────────────────────────────────────────

  /** Emitted when valid files are selected (after validation filtering) */
  @Output() filesSelected = new EventEmitter<File[]>();

  /** Emitted when a file is removed from the list */
  @Output() fileRemoved = new EventEmitter<File>();

  /** Emitted to report upload progress for a file */
  @Output() uploadProgress = new EventEmitter<{ file: File; progress: number }>();

  /** Emitted when a file upload completes successfully */
  @Output() uploadComplete = new EventEmitter<{ file: File; response: unknown }>();

  /** Emitted when a file upload fails */
  @Output() uploadError = new EventEmitter<{ file: File; error: string }>();

  /** Emitted when retry is requested for a failed file */
  @Output() retryUpload = new EventEmitter<File>();

  // ─── View Children ───────────────────────────────────────────────────────────

  @ViewChild('fileInput', { static: true }) fileInputRef!: ElementRef<HTMLInputElement>;

  // ─── State ───────────────────────────────────────────────────────────────────

  /** Tracks whether user is dragging over the drop zone */
  readonly isDragOver = signal(false);

  /** Internal list of file entries with state */
  readonly fileEntries = signal<IFileEntry[]>([]);

  // ─── Public Methods (called by parent to update state) ───────────────────────

  /**
   * Update progress for a specific file.
   * Called by parent component when upload progress events arrive.
   */
  setProgress(file: File, progress: number): void {
    this.updateEntry(file, { status: 'uploading', progress });
    this.uploadProgress.emit({ file, progress });
  }

  /**
   * Mark a file as upload complete.
   * Called by parent component when upload succeeds.
   */
  setComplete(file: File, response: unknown): void {
    this.updateEntry(file, { status: 'complete', progress: 100, response });
    this.uploadComplete.emit({ file, response });
  }

  /**
   * Mark a file as having an upload error.
   * Called by parent component when upload fails.
   */
  setError(file: File, error: string): void {
    this.updateEntry(file, { status: 'error', error, progress: 0 });
    this.uploadError.emit({ file, error });
  }

  /**
   * Mark a file as uploading (called by parent when starting upload).
   */
  setUploading(file: File): void {
    this.updateEntry(file, { status: 'uploading', progress: 0, error: null });
  }

  // ─── Event Handlers ──────────────────────────────────────────────────────────

  openFileBrowser(): void {
    this.fileInputRef.nativeElement.value = '';
    this.fileInputRef.nativeElement.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(Array.from(input.files));
    }
  }

  onRemove(entry: IFileEntry): void {
    // Revoke object URL to prevent memory leaks
    if (entry.thumbnailUrl) {
      URL.revokeObjectURL(entry.thumbnailUrl);
    }
    const updated = this.fileEntries().filter(e => e !== entry);
    this.fileEntries.set(updated);
    this.fileRemoved.emit(entry.file);
  }

  onRetry(entry: IFileEntry): void {
    this.updateEntry(entry.file, { status: 'pending', error: null, progress: 0 });
    this.retryUpload.emit(entry.file);
  }

  // ─── Utility Methods ─────────────────────────────────────────────────────────

  /**
   * Determines whether an entry's error is from validation (not a network/server error).
   * Validation errors are set at selection time and should not show retry.
   */
  isValidationError(entry: IFileEntry): boolean {
    return entry.status === 'error' && entry.progress === 0 && entry.error !== null && !entry.error.startsWith('Upload failed');
  }

  /**
   * Returns the appropriate Material Symbols icon name based on file type.
   */
  getFileIcon(file: File): string {
    const ext = this.getExtension(file.name).toLowerCase();
    if (['.pdf'].includes(ext)) return 'picture_as_pdf';
    if (['.doc', '.docx'].includes(ext)) return 'description';
    if (['.xls', '.xlsx'].includes(ext)) return 'table_chart';
    if (['.ppt', '.pptx'].includes(ext)) return 'slideshow';
    if (['.zip', '.rar', '.7z'].includes(ext)) return 'folder_zip';
    if (['.mp4', '.avi', '.mov', '.wmv'].includes(ext)) return 'movie';
    if (['.mp3', '.wav', '.ogg'].includes(ext)) return 'audio_file';
    if (['.txt', '.csv'].includes(ext)) return 'article';
    return 'insert_drive_file';
  }

  /**
   * Formats file size to human-readable string.
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  // ─── Private Methods ─────────────────────────────────────────────────────────

  private processFiles(files: File[]): void {
    const currentEntries = this.fileEntries();
    const maxAllowed = this.multiple ? this.maxFiles : 1;

    // In single mode, replace the current file
    let availableSlots: number;
    if (!this.multiple) {
      availableSlots = 1;
    } else {
      availableSlots = maxAllowed - currentEntries.length;
    }

    // Limit incoming files to available slots
    const filesToProcess = files.slice(0, Math.max(0, availableSlots));

    if (filesToProcess.length === 0) return;

    const validEntries: IFileEntry[] = [];
    const invalidEntries: IFileEntry[] = [];

    for (const file of filesToProcess) {
      const validationError = this.validateFile(file);
      const isImage = IMAGE_MIME_TYPES.has(file.type);
      const thumbnailUrl = isImage ? URL.createObjectURL(file) : null;

      if (validationError) {
        invalidEntries.push({
          file,
          status: 'error',
          progress: 0,
          error: validationError,
          isImage,
          thumbnailUrl,
          response: null,
        });
      } else {
        validEntries.push({
          file,
          status: 'pending',
          progress: 0,
          error: null,
          isImage,
          thumbnailUrl,
          response: null,
        });
      }
    }

    // In single mode, replace existing entries
    if (!this.multiple) {
      // Revoke old thumbnail URLs
      for (const entry of currentEntries) {
        if (entry.thumbnailUrl) {
          URL.revokeObjectURL(entry.thumbnailUrl);
        }
      }
      this.fileEntries.set([...validEntries, ...invalidEntries]);
    } else {
      this.fileEntries.set([...currentEntries, ...validEntries, ...invalidEntries]);
    }

    // Emit valid files for the parent to start uploading
    if (validEntries.length > 0) {
      this.filesSelected.emit(validEntries.map(e => e.file));
    }
  }

  /**
   * Validates a file against accept extensions and maxSize.
   * Returns an error message string if invalid, or null if valid.
   */
  private validateFile(file: File): string | null {
    // Validate extension
    if (this.accept) {
      const allowedExtensions = this.accept
        .split(',')
        .map(ext => ext.trim().toLowerCase())
        .filter(ext => ext.length > 0);

      if (allowedExtensions.length > 0) {
        const fileExt = this.getExtension(file.name).toLowerCase();
        if (!allowedExtensions.includes(fileExt)) {
          return `File type "${fileExt}" is not allowed. Accepted: ${this.accept}`;
        }
      }
    }

    // Validate size
    const maxSizeBytes = this.maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size of ${this.maxSize} MB`;
    }

    return null;
  }

  /**
   * Extracts the file extension including the dot (e.g., ".pdf").
   */
  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.substring(lastDot);
  }

  /**
   * Updates properties on an existing file entry.
   */
  private updateEntry(file: File, updates: Partial<IFileEntry>): void {
    const entries = this.fileEntries();
    const index = entries.findIndex(e => e.file === file);
    if (index === -1) return;

    const updated = [...entries];
    updated[index] = { ...updated[index], ...updates };
    this.fileEntries.set(updated);
  }
}
