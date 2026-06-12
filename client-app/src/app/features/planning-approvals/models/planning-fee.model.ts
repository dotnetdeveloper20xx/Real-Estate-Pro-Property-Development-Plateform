/**
 * Fee type values mirroring the backend FeeType enum.
 */
export enum FeeType {
  ApplicationFee = 'ApplicationFee',
  PreApplicationFee = 'PreApplicationFee',
  ConditionDischargeFee = 'ConditionDischargeFee',
  AppealFee = 'AppealFee',
  SupplementaryFee = 'SupplementaryFee'
}

/**
 * Payment status values mirroring the backend PaymentStatus enum.
 */
export enum PaymentStatus {
  Pending = 'Pending',
  AwaitingApproval = 'AwaitingApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Paid = 'Paid'
}

/**
 * Full planning fee entity returned from the API.
 */
export interface IPlanningFee {
  readonly id: string;
  readonly applicationId: string;
  readonly amount: number;
  readonly currency: string;
  readonly feeType: string;
  readonly description: string;
  readonly paymentStatus: string;
  readonly approvedBy: string | null;
  readonly approvedAt: string | null;
  readonly approvalNotes: string | null;
  readonly createdAt: string;
}

/**
 * Aggregated fee summary grouped by FeeType and PaymentStatus.
 */
export interface IFeeSummary {
  readonly feeType: string;
  readonly paymentStatus: string;
  readonly totalAmount: number;
  readonly count: number;
}

/**
 * Payload for creating a new planning fee.
 */
export interface ICreateFee {
  readonly amount: number;
  readonly currency: string;
  readonly feeType: string;
  readonly description: string;
}

/**
 * Payload for transitioning a fee payment status.
 */
export interface ITransitionFeeStatus {
  readonly newStatus: string;
}

/**
 * Payload for approving a fee.
 */
export interface IApproveFee {
  readonly approvalNotes: string;
}
