import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DocumentsState } from './documents.state';
import { documentsAdapter } from './documents.reducer';
import { ILegalDocumentListItem, LegalDocumentType, ConfidentialityLevel } from '../../models';

/**
 * Feature selector for the legal documents state slice.
 */
export const selectDocumentsState = createFeatureSelector<DocumentsState>('legalDocuments');

/**
 * Entity adapter selectors for normalized state access.
 */
const { selectAll, selectEntities, selectTotal } = documentsAdapter.getSelectors();

/**
 * Select all legal documents as an array, sorted by the adapter's sortComparer.
 */
export const selectAllDocuments = createSelector(
  selectDocumentsState,
  selectAll
);

/**
 * Select the legal document entities dictionary (id → entity).
 */
export const selectDocumentEntities = createSelector(
  selectDocumentsState,
  selectEntities
);

/**
 * Select the total count of documents in the store.
 */
export const selectDocumentsTotal = createSelector(
  selectDocumentsState,
  selectTotal
);

/**
 * Select a document by its ID.
 */
export const selectDocumentById = (id: string) =>
  createSelector(
    selectDocumentEntities,
    (entities): ILegalDocumentListItem | undefined => entities[id]
  );

/**
 * Select the loading state indicator.
 */
export const selectDocumentsLoading = createSelector(
  selectDocumentsState,
  (state: DocumentsState) => state.loading
);

/**
 * Select the current error message (null if no error).
 */
export const selectDocumentsError = createSelector(
  selectDocumentsState,
  (state: DocumentsState) => state.error
);

/**
 * Select documents filtered by document type.
 */
export const selectDocumentsByType = (documentType: LegalDocumentType) =>
  createSelector(
    selectAllDocuments,
    (documents): readonly ILegalDocumentListItem[] =>
      documents.filter((d) => d.documentType === documentType)
  );

/**
 * Select documents filtered by confidentiality level.
 */
export const selectDocumentsByConfidentiality = (level: ConfidentialityLevel) =>
  createSelector(
    selectAllDocuments,
    (documents): readonly ILegalDocumentListItem[] =>
      documents.filter((d) => d.confidentialityLevel === level)
  );

/**
 * Select documents linked to a specific legal case.
 */
export const selectDocumentsForCase = (caseId: string) =>
  createSelector(
    selectAllDocuments,
    (documents): readonly ILegalDocumentListItem[] =>
      documents.filter((d) => d.legalCaseId === caseId)
  );

/**
 * Select documents linked to a specific contract.
 */
export const selectDocumentsForContract = (contractId: string) =>
  createSelector(
    selectAllDocuments,
    (documents): readonly ILegalDocumentListItem[] =>
      documents.filter((d) => d.contractId === contractId)
  );
