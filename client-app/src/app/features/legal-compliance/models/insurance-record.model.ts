/**
 * Insurance Record domain models and enums.
 */

export enum InsuranceStatus {
  Active = 'Active',
  ExpiringSoon = 'ExpiringSoon',
  Expired = 'Expired',
  Renewed = 'Renewed',
  Cancelled = 'Cancelled',
  Closed = 'Closed'
}

export enum CoverageType {
  ProfessionalIndemnity = 'ProfessionalIndemnity',
  PublicLiability = 'PublicLiability',
  EmployersLiability = 'EmployersLiability',
  BuildingInsurance = 'BuildingInsurance',
  TitleInsurance = 'TitleInsurance',
  ContractorsAllRisk = 'ContractorsAllRisk',
  LegalExpenses = 'LegalExpenses'
}

/** Insurance record entity. */
export interface IInsuranceRecord {
  readonly id: string;
  readonly policyNumber: string;
  readonly insurer: string;
  readonly coverageType: CoverageType;
  readonly coverAmount: number;
  readonly premium: number;
  readonly currency: string;
  readonly startDate: string;
  readonly expiryDate: string;
  readonly status: InsuranceStatus;
  readonly previousPolicyId: string | null;
  readonly opportunityId: string | null;
  readonly legalCaseId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
}

/** Lightweight list item for table views. */
export interface IInsuranceRecordListItem {
  readonly id: string;
  readonly policyNumber: string;
  readonly insurer: string;
  readonly coverageType: CoverageType;
  readonly coverAmount: number;
  readonly premium: number;
  readonly currency: string;
  readonly startDate: string;
  readonly expiryDate: string;
  readonly status: InsuranceStatus;
  readonly legalCaseId: string | null;
}

/** Full insurance detail. */
export interface IInsuranceRecordDetail extends IInsuranceRecord {
  readonly caseReference: string | null;
  readonly caseTitle: string | null;
  readonly daysUntilExpiry: number;
}

/** Command payload for creating an insurance record. */
export interface ICreateInsuranceRecord {
  readonly policyNumber: string;
  readonly insurer: string;
  readonly coverageType: CoverageType;
  readonly coverAmount: number;
  readonly premium: number;
  readonly currency: string;
  readonly startDate: string;
  readonly expiryDate: string;
  readonly opportunityId?: string | null;
  readonly legalCaseId?: string | null;
}

/** Command payload for updating an insurance record. */
export interface IUpdateInsuranceRecord {
  readonly insurer?: string;
  readonly coverAmount?: number;
  readonly premium?: number;
  readonly currency?: string;
  readonly startDate?: string;
  readonly expiryDate?: string;
}

/** Command payload for transitioning insurance status. */
export interface ITransitionInsuranceStatus {
  readonly newStatus: InsuranceStatus;
}

/** Command payload for renewing an insurance record. */
export interface IRenewInsuranceRecord {
  readonly coverAmount: number;
  readonly premium: number;
  readonly startDate: string;
  readonly expiryDate: string;
}
