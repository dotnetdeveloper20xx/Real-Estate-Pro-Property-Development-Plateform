/**
 * Document type values mirroring the backend DocumentType enum.
 */
export enum DocumentType {
  TitleDeed = 'TitleDeed',
  SearchReport = 'SearchReport',
  LegalDocument = 'LegalDocument',
  EnvironmentalReport = 'EnvironmentalReport',
  PlanningDocument = 'PlanningDocument',
  Contract = 'Contract',
  Valuation = 'Valuation',
  Correspondence = 'Correspondence'
}

/**
 * Full document entity returned from the API.
 */
export interface IDocument {
  readonly id: string;
  readonly opportunityId: string;
  readonly docType: DocumentType;
  readonly fileName: string;
  readonly filePath: string;
  readonly contentType: string;
  readonly fileSizeBytes: number;
  readonly uploadedAt: string;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
}
