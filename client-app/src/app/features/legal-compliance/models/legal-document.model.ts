/**
 * Legal Document domain models and enums.
 */

export enum LegalDocumentType {
  TitleDeed = 'TitleDeed',
  SearchReport = 'SearchReport',
  Contract = 'Contract',
  LandRegistryRecord = 'LandRegistryRecord',
  InsuranceCertificate = 'InsuranceCertificate',
  ComplianceCertificate = 'ComplianceCertificate',
  LegalOpinion = 'LegalOpinion',
  Correspondence = 'Correspondence',
  CourtOrder = 'CourtOrder',
  RegulatoryFiling = 'RegulatoryFiling'
}

export enum ConfidentialityLevel {
  Public = 'Public',
  Internal = 'Internal',
  Confidential = 'Confidential',
  Restricted = 'Restricted'
}

/** Legal document entity. */
export interface ILegalDocument {
  readonly id: string;
  readonly documentType: LegalDocumentType;
  readonly confidentialityLevel: ConfidentialityLevel;
  readonly fileName: string;
  readonly contentType: string;
  readonly fileSize: number;
  readonly storagePath: string;
  readonly version: number;
  readonly uploadedAt: string;
  readonly uploadedBy: string;
  readonly retentionExpiryDate: string | null;
  readonly legalCaseId: string | null;
  readonly contractId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
}

/** Lightweight list item for table views. */
export interface ILegalDocumentListItem {
  readonly id: string;
  readonly documentType: LegalDocumentType;
  readonly confidentialityLevel: ConfidentialityLevel;
  readonly fileName: string;
  readonly contentType: string;
  readonly fileSize: number;
  readonly version: number;
  readonly uploadedAt: string;
  readonly uploadedBy: string;
  readonly legalCaseId: string | null;
  readonly contractId: string | null;
}

/** Command payload for uploading a legal document. */
export interface IUploadLegalDocument {
  readonly file: File;
  readonly documentType: LegalDocumentType;
  readonly confidentialityLevel: ConfidentialityLevel;
  readonly retentionExpiryDate?: string | null;
  readonly legalCaseId?: string | null;
  readonly contractId?: string | null;
}
