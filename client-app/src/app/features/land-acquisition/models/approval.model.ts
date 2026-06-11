/**
 * Approval status values mirroring the backend ApprovalStatus enum.
 */
export enum ApprovalStatus {
  Pending = 'Pending',
  UnderReview = 'UnderReview',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Escalated = 'Escalated'
}

/**
 * Full approval request entity returned from the API.
 */
export interface IApprovalRequest {
  readonly id: string;
  readonly opportunityId: string;
  readonly status: ApprovalStatus;
  readonly approverUserId: string | null;
  readonly approvalTimestamp: string | null;
  readonly approvalNotes: string | null;
  readonly rejectionReason: string | null;
  readonly requestedAmount: number;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
}
