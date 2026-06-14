import { createActionGroup, props } from '@ngrx/store';
import {
  ILegalDocumentListItem,
  LegalDocumentType,
  ConfidentialityLevel
} from '../../models';

/**
 * NgRx action group for legal documents state management.
 * Follows the [Source] Event pattern for action naming.
 */
export const DocumentsActions = createActionGroup({
  source: 'Legal Documents',
  events: {
    /** Trigger loading documents for a specific legal case */
    'Load Documents For Case': props<{ caseId: string }>(),
    /** Successfully loaded documents for a case */
    'Load Documents For Case Success': props<{ documents: readonly ILegalDocumentListItem[] }>(),
    /** Failed to load documents for a case */
    'Load Documents For Case Failure': props<{ error: string }>(),

    /** Trigger loading documents for a specific contract */
    'Load Documents For Contract': props<{ contractId: string }>(),
    /** Successfully loaded documents for a contract */
    'Load Documents For Contract Success': props<{ documents: readonly ILegalDocumentListItem[] }>(),
    /** Failed to load documents for a contract */
    'Load Documents For Contract Failure': props<{ error: string }>(),

    /** Trigger upload of a new legal document */
    'Upload Document': props<{
      file: File;
      documentType: LegalDocumentType;
      confidentialityLevel: ConfidentialityLevel;
      legalCaseId?: string;
      contractId?: string;
      retentionExpiryDate?: string;
    }>(),
    /** Successfully uploaded a document */
    'Upload Document Success': props<{ document: ILegalDocumentListItem }>(),
    /** Failed to upload a document */
    'Upload Document Failure': props<{ error: string }>(),

    /** Trigger upload of a new version of an existing document */
    'Upload Document Version': props<{ documentId: string; file: File }>(),
    /** Successfully uploaded a new document version */
    'Upload Document Version Success': props<{ document: ILegalDocumentListItem }>(),
    /** Failed to upload a new document version */
    'Upload Document Version Failure': props<{ error: string }>(),

    /** Trigger soft-deletion of a document */
    'Delete Document': props<{ documentId: string }>(),
    /** Successfully deleted a document */
    'Delete Document Success': props<{ documentId: string }>(),
    /** Failed to delete a document */
    'Delete Document Failure': props<{ error: string }>(),
  }
});
