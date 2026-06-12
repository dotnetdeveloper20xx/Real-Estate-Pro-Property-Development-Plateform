import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { ILegalDocumentListItem } from '../../models';
import { DocumentsState } from './documents.state';
import { DocumentsActions } from './documents.actions';

/**
 * Entity adapter for normalized legal documents state management.
 * Uses 'id' as the primary key and sorts by uploadedAt descending (newest first).
 */
export const documentsAdapter: EntityAdapter<ILegalDocumentListItem> = createEntityAdapter<ILegalDocumentListItem>({
  selectId: (document: ILegalDocumentListItem) => document.id,
  sortComparer: (a: ILegalDocumentListItem, b: ILegalDocumentListItem) =>
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
});

/**
 * Initial state using EntityAdapter's getInitialState plus custom properties.
 */
export const initialDocumentsState: DocumentsState = documentsAdapter.getInitialState({
  loading: false,
  error: null
});

/**
 * Documents reducer handling all legal document-related actions.
 * Uses @ngrx/entity adapter methods for normalized CRUD operations.
 */
export const documentsReducer = createReducer(
  initialDocumentsState,

  // Load Documents For Case
  on(DocumentsActions.loadDocumentsForCase, (state): DocumentsState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(DocumentsActions.loadDocumentsForCaseSuccess, (state, { documents }): DocumentsState =>
    documentsAdapter.setAll([...documents], {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(DocumentsActions.loadDocumentsForCaseFailure, (state, { error }): DocumentsState => ({
    ...state,
    loading: false,
    error
  })),

  // Load Documents For Contract
  on(DocumentsActions.loadDocumentsForContract, (state): DocumentsState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(DocumentsActions.loadDocumentsForContractSuccess, (state, { documents }): DocumentsState =>
    documentsAdapter.setAll([...documents], {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(DocumentsActions.loadDocumentsForContractFailure, (state, { error }): DocumentsState => ({
    ...state,
    loading: false,
    error
  })),

  // Upload Document
  on(DocumentsActions.uploadDocument, (state): DocumentsState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(DocumentsActions.uploadDocumentSuccess, (state, { document }): DocumentsState =>
    documentsAdapter.addOne(document, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(DocumentsActions.uploadDocumentFailure, (state, { error }): DocumentsState => ({
    ...state,
    loading: false,
    error
  })),

  // Upload Document Version
  on(DocumentsActions.uploadDocumentVersion, (state): DocumentsState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(DocumentsActions.uploadDocumentVersionSuccess, (state, { document }): DocumentsState =>
    documentsAdapter.upsertOne(document, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(DocumentsActions.uploadDocumentVersionFailure, (state, { error }): DocumentsState => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Document
  on(DocumentsActions.deleteDocument, (state): DocumentsState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(DocumentsActions.deleteDocumentSuccess, (state, { documentId }): DocumentsState =>
    documentsAdapter.removeOne(documentId, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(DocumentsActions.deleteDocumentFailure, (state, { error }): DocumentsState => ({
    ...state,
    loading: false,
    error
  }))
);
