/**
 * Contract domain models and enums.
 */

export enum LegalContractStatus {
  Draft = 'Draft',
  UnderReview = 'UnderReview',
  Approved = 'Approved',
  AwaitingSignature = 'AwaitingSignature',
  Executed = 'Executed',
  Active = 'Active',
  Completed = 'Completed',
  Terminated = 'Terminated',
  Expired = 'Expired',
  UnderDispute = 'UnderDispute',
  Renewed = 'Renewed',
  Cancelled = 'Cancelled',
  Rejected = 'Rejected',
  Closed = 'Closed'
}

export enum LegalContractType {
  LandPurchase = 'LandPurchase',
  Construction = 'Construction',
  ProfessionalServices = 'ProfessionalServices',
  Insurance = 'Insurance',
  Lease = 'Lease',
  Settlement = 'Settlement',
  FrameworkAgreement = 'FrameworkAgreement'
}

/** Base contract fields. */
export interface IContract {
  readonly id: string;
  readonly contractReference: string;
  readonly title: string;
  readonly contractType: LegalContractType;
  readonly status: LegalContractStatus;
  readonly counterpartyName: string;
  readonly contractValue: number;
  readonly currency: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly renewalDate: string | null;
  readonly terminationClause: string | null;
  readonly specialConditions: string | null;
  readonly paymentTerms: string | null;
  readonly executionDate: string | null;
  readonly signatoryNames: string | null;
  readonly terminationReason: string | null;
  readonly terminationDate: string | null;
  readonly approverUserId: string | null;
  readonly approvalTimestamp: string | null;
  readonly approvalNotes: string | null;
  readonly legalCaseId: string;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
}

/** Lightweight list item for table views. */
export interface IContractListItem {
  readonly id: string;
  readonly contractReference: string;
  readonly title: string;
  readonly contractType: LegalContractType;
  readonly status: LegalContractStatus;
  readonly counterpartyName: string;
  readonly contractValue: number;
  readonly currency: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly legalCaseId: string;
  readonly caseReference: string;
  readonly createdAt: string;
}

/** Full contract detail. */
export interface IContractDetail extends IContract {
  readonly documentCount: number;
  readonly caseReference: string;
  readonly caseTitle: string;
}

/** Contract register view item. */
export interface IContractRegisterItem {
  readonly id: string;
  readonly contractReference: string;
  readonly title: string;
  readonly contractType: LegalContractType;
  readonly status: LegalContractStatus;
  readonly counterpartyName: string;
  readonly contractValue: number;
  readonly currency: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly renewalDate: string | null;
  readonly caseReference: string;
}

/** Command payload for creating a contract. */
export interface ICreateContract {
  readonly title: string;
  readonly contractType: LegalContractType;
  readonly counterpartyName: string;
  readonly contractValue: number;
  readonly currency: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly renewalDate?: string | null;
  readonly terminationClause?: string | null;
  readonly specialConditions?: string | null;
  readonly paymentTerms?: string | null;
  readonly legalCaseId: string;
}

/** Command payload for updating a contract. */
export interface IUpdateContract {
  readonly title?: string;
  readonly counterpartyName?: string;
  readonly contractValue?: number;
  readonly currency?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly renewalDate?: string | null;
  readonly terminationClause?: string | null;
  readonly specialConditions?: string | null;
  readonly paymentTerms?: string | null;
}

/** Command payload for transitioning a contract status. */
export interface ITransitionContractStatus {
  readonly newStatus: LegalContractStatus;
  readonly executionDate?: string | null;
  readonly signatoryNames?: string | null;
  readonly terminationReason?: string | null;
  readonly terminationDate?: string | null;
  readonly approvalNotes?: string | null;
}
