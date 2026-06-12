import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IPlanningDocument } from '../../models/planning-document.model';

/**
 * DocumentListComponent — A presentational component that displays planning documents
 * in a DaisyUI table with document type badges, file size, upload date, uploaded by,
 * and action buttons (download/delete).
 *
 * Requirements: 15.2
 *
 * @example
 * ```html
 * <app-document-list
 *   [documents]="documents"
 *   (download)="onDownload($event)"
 *   (delete)="onDelete($event)">
 * </app-document-list>
 * ```
 */
@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-x-auto" role="region" aria-label="Documents table">
      <table class="table table-sm w-full" *ngIf="documents.length > 0; else emptyState">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Document Type</th>
            <th class="text-right">Size</th>
            <th>Uploaded</th>
            <th>Uploaded By</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            *ngFor="let doc of documents; trackBy: trackById"
            class="hover"
          >
            <td class="max-w-xs truncate" [title]="doc.fileName">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span class="truncate">{{ doc.fileName }}</span>
              </div>
            </td>
            <td>
              <span class="badge badge-sm" [ngClass]="getTypeBadgeClass(doc.documentType)">
                {{ formatDocumentType(doc.documentType) }}
              </span>
            </td>
            <td class="text-right text-sm font-mono whitespace-nowrap">
              {{ formatFileSize(doc.fileSizeBytes) }}
            </td>
            <td class="text-sm whitespace-nowrap">
              {{ doc.uploadedAt | date:'dd MMM yyyy' }}
            </td>
            <td class="text-sm truncate max-w-[120px]" [title]="doc.uploadedBy">
              {{ doc.uploadedBy }}
            </td>
            <td class="text-center">
              <div class="flex items-center justify-center gap-1">
                <button
                  class="btn btn-ghost btn-xs"
                  (click)="download.emit(doc.id)"
                  [attr.aria-label]="'Download ' + doc.fileName"
                  title="Download"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button
                  class="btn btn-ghost btn-xs text-error"
                  (click)="onDeleteClick($event, doc.id)"
                  [attr.aria-label]="'Delete ' + doc.fileName"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <ng-template #emptyState>
        <div class="text-center py-8 text-base-content/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="font-medium">No documents uploaded</p>
          <p class="text-sm mt-1">Documents will appear here once they are uploaded to this application.</p>
        </div>
      </ng-template>
    </div>
  `
})
export class DocumentListComponent {
  /** Array of planning documents to display. */
  @Input({ required: true }) documents: readonly IPlanningDocument[] = [];

  /** Emits the document ID when the download action is triggered. */
  @Output() download = new EventEmitter<string>();

  /** Emits the document ID when the delete action is triggered. */
  @Output() delete = new EventEmitter<string>();

  /** Handles delete button click, preventing event propagation. */
  onDeleteClick(event: Event, documentId: string): void {
    event.stopPropagation();
    this.delete.emit(documentId);
  }

  /** Returns the DaisyUI badge class for a document type. */
  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'SitePlan':
        return 'badge-primary';
      case 'FloorPlan':
        return 'badge-secondary';
      case 'ElevationDrawing':
        return 'badge-accent';
      case 'DesignAndAccessStatement':
        return 'badge-info';
      case 'EnvironmentalImpactAssessment':
        return 'badge-warning';
      case 'CouncilCorrespondence':
        return 'badge-success';
      case 'PlanningOfficerReport':
        return 'badge-neutral';
      case 'SupportingStatement':
        return 'badge-ghost';
      default:
        return 'badge-ghost';
    }
  }

  /** Formats PascalCase document type to readable label. */
  formatDocumentType(type: string): string {
    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  /** Formats file size in bytes to human-readable format. */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / Math.pow(k, i);
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  /** TrackBy function for ngFor. */
  trackById(_index: number, item: IPlanningDocument): string {
    return item.id;
  }
}
