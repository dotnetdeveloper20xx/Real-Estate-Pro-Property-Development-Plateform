/**
 * Compliance check models and enums for the Legal & Compliance module.
 */

/**
 * Compliance check outcome values mirroring the backend ComplianceCheckOutcome enum.
 */
export enum ComplianceCheckOutcome {
  Compliant = 'Compliant',
  NonCompliant = 'NonCompliant',
  PartiallyCompliant = 'PartiallyCompliant',
  NotApplicable = 'NotApplicable'
}

/**
 * Full compliance check entity returned from the API.
 */
export interface IComplianceCheck {
  readonly id: string;
  readonly complianceRequirementId: string;
  readonly checkDate: string;
  readonly outcome: ComplianceCheckOutcome;
  readonly findings: string;
  readonly evidenceReference: string | null;
  readonly remediationPlan: string | null;
  readonly remediationDueDate: string | null;
  readonly reviewerUserId: string;
  readonly reviewerName: string;
  readonly createdAt: string;
  readonly createdBy: string;
}

/**
 * Lightweight compliance check item for list views.
 */
export interface IComplianceCheckListItem {
  readonly id: string;
  readonly complianceRequirementId: string;
  readonly requirementName: string;
  readonly checkDate: string;
  readonly outcome: ComplianceCheckOutcome;
  readonly reviewerName: string;
  readonly createdAt: string;
}

/**
 * Payload for creating a new compliance check.
 */
export interface ICreateComplianceCheck {
  readonly complianceRequirementId: string;
  readonly checkDate: string;
  readonly outcome: ComplianceCheckOutcome;
  readonly findings: string;
  readonly evidenceReference?: string | null;
  readonly remediationPlan?: string | null;
  readonly remediationDueDate?: string | null;
}
