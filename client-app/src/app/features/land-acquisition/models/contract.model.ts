/**
 * Contract status values mirroring the backend ContractStatus enum.
 */
export enum ContractStatus {
  Draft = 'Draft',
  UnderLegalReview = 'UnderLegalReview',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Signed = 'Signed',
  Exchanged = 'Exchanged',
  Completed = 'Completed'
}

/**
 * Full contract entity returned from the API.
 */
export interface IContract {
  readonly id: string;
  readonly opportunityId: string;
  readonly status: ContractStatus;
  readonly solicitorName: string | null;
  readonly solicitorFirm: string | null;
  readonly solicitorContact: string | null;
  readonly depositAmount: number | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
}
