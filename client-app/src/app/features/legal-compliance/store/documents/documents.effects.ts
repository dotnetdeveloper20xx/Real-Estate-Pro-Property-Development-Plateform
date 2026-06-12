import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { DocumentsActions } from './documents.actions';
import { LegalDocumentService } from '../../services/legal-document.service';
import { ToastService } from '@core/services/toast.service';
import { ILegalDocumentListItem } from '../../models';

/**
 * NgRx effects for the legal documents feature.
 * Handles all side effects including API calls and toast notifications on error.
 */
@Injectable()
export class DocumentsEffects {
  private readonly actions$ = inject(Actions);
  private readonly documentService = inject(LegalDocumentService);
  private readonly toastService = inject(ToastService);

  /**
   * Load documents for a specific legal case.
   */
  readonly loadDocumentsForCase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DocumentsActions.loadDocumentsForCase),
      exhaustMap(({ caseId }) =>
        this.documentService.getAll({ legalCaseId: caseId }).pipe(
          map((response) =>
            DocumentsActions.loadDocumentsForCaseSuccess({
              documents: response.data?.items ?? []
            })
          ),
          catchError((error: { message: string }) =>
            of(DocumentsActions.loadDocumentsForCaseFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Load documents for a specific contract.
   */
  readonly loadDocumentsForContract$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DocumentsActions.loadDocumentsForContract),
      exhaustMap(({ contractId }) =>
        this.documentService.getAll({ contractId }).pipe(
          map((response) =>
            DocumentsActions.loadDocumentsForContractSuccess({
              documents: response.data?.items ?? []
            })
          ),
          catchError((error: { message: string }) =>
            of(DocumentsActions.loadDocumentsForContractFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Upload a new legal document via API.
   * Maps the full ILegalDocument response to ILegalDocumentListItem for the store.
   */
  readonly uploadDocument$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DocumentsActions.uploadDocument),
      exhaustMap(({ file, documentType, confidentialityLevel, legalCaseId, contractId, retentionExpiryDate }) =>
        this.documentService.upload(file, documentType, confidentialityLevel, {
          legalCaseId,
          contractId,
          retentionExpiryDate
        }).pipe(
          map((response) => {
            const created = response.data!;
            const listItem: ILegalDocumentListItem = {
              id: created.id,
              documentType: created.documentType,
              confidentialityLevel: created.confidentialityLevel,
              fileName: created.fileName,
              contentType: created.contentType,
              fileSize: created.fileSize,
              version: created.version,
              uploadedAt: created.uploadedAt,
              uploadedBy: created.uploadedBy,
              legalCaseId: created.legalCaseId,
              contractId: created.contractId
            };
            return DocumentsActions.uploadDocumentSuccess({ document: listItem });
          }),
          catchError((error: { message: string }) =>
            of(DocumentsActions.uploadDocumentFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Upload a new version of an existing document.
   * Maps the full ILegalDocument response to ILegalDocumentListItem for the store.
   */
  readonly uploadDocumentVersion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DocumentsActions.uploadDocumentVersion),
      exhaustMap(({ documentId, file }) =>
        this.documentService.uploadVersion(documentId, file).pipe(
          map((response) => {
            const updated = response.data!;
            const listItem: ILegalDocumentListItem = {
              id: updated.id,
              documentType: updated.documentType,
              confidentialityLevel: updated.confidentialityLevel,
              fileName: updated.fileName,
              contentType: updated.contentType,
              fileSize: updated.fileSize,
              version: updated.version,
              uploadedAt: updated.uploadedAt,
              uploadedBy: updated.uploadedBy,
              legalCaseId: updated.legalCaseId,
              contractId: updated.contractId
            };
            return DocumentsActions.uploadDocumentVersionSuccess({ document: listItem });
          }),
          catchError((error: { message: string }) =>
            of(DocumentsActions.uploadDocumentVersionFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Soft-delete a document via API.
   */
  readonly deleteDocument$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DocumentsActions.deleteDocument),
      exhaustMap(({ documentId }) =>
        this.documentService.delete(documentId).pipe(
          map(() => DocumentsActions.deleteDocumentSuccess({ documentId })),
          catchError((error: { message: string }) =>
            of(DocumentsActions.deleteDocumentFailure({ error: error.message }))
          )
        )
      )
    )
  );

  /**
   * Show toast notification on any failure action.
   */
  readonly showErrorToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          DocumentsActions.loadDocumentsForCaseFailure,
          DocumentsActions.loadDocumentsForContractFailure,
          DocumentsActions.uploadDocumentFailure,
          DocumentsActions.uploadDocumentVersionFailure,
          DocumentsActions.deleteDocumentFailure
        ),
        tap(({ error }) => {
          this.toastService.showError(error);
        })
      ),
    { dispatch: false }
  );
}
