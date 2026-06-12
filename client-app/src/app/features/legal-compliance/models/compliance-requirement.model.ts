/**
 * Compliance Requirement domain models and enums.
 */

import { ComplianceCheckOutcome } from './compliance-check.model';

export enum ComplianceCategory {
  HealthAndSafety = 'HealthAndSafety',
  Environmental = 'Environmental',
  Financial = 'Financial',
  DataProtection = 'DataProtection',
  BuildingRegulations = 'BuildingRegulations',
  PlanningCompliance = 'PlanningCompliance',
  AntiMoneyLaundering = 'AntiMoneyLaundering',
  Employment = 'Employment'
}

export enum ComplianceFrequency {
  OneOff = 'OneOff',
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Quarterly = 'Quarterly',
  Annually = 'Annually',
  Ongoing = 'Ongoing'
}

export enum ComplianceRequirementStatus {
  Active = 'Active',
  Superseded = 'Superseded',
  Retired = 'Retired'
}

/** Compliance requirement entity. */
export interface IComplianceRequirement {
  readonly id: string;
  readonly name: string;
  readonly category: ComplianceCategory;
  readonly description: string;
  readonly sourceRegulation: string;
  readonly frequency: ComplianceFrequency;
  readonly responsibleRole: string;
  readonly status: ComplianceRequirementStatus;
  readonly retirementReason: string | null;
  readonly nextDueDate: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
}

/** Checklist view item with last check info. */
export interface IComplianceChecklistItem {
  readonly id: string;
  readonly name: string;
  readonly category: ComplianceCategory;
  readonly frequency: ComplianceFrequency;
  readonly responsibleRole: string;
  readonly status: ComplianceRequirementStatus;
  readonly nextDueDate: string | null;
  readonly lastCheckDate: string | null;
  readonly lastCheckOutcome: ComplianceCheckOutcome | null;
  readonly isOverdue: boolean;
}

/** Compliance status summary per category. */
export interface IComplianceStatusSummary {
  readonly category: ComplianceCategory;
  readonly total: number;
  readonly compliant: number;
  readonly nonCompliant: number;
  readonly overdue: number;
  readonly dueSoon: number;
}

/** Command payload for creating a compliance requirement. */
export interface ICreateComplianceRequirement {
  readonly name: string;
  readonly category: ComplianceCategory;
  readonly description: string;
  readonly sourceRegulation: string;
  readonly frequency: ComplianceFrequency;
  readonly responsibleRole: string;
}

/** Command payload for updating a compliance requirement. */
export interface IUpdateComplianceRequirement {
  readonly name?: string;
  readonly category?: ComplianceCategory;
  readonly description?: string;
  readonly sourceRegulation?: string;
  readonly frequency?: ComplianceFrequency;
  readonly responsibleRole?: string;
}

/** Command payload for retiring a compliance requirement. */
export interface IRetireComplianceRequirement {
  readonly retirementReason: string;
  readonly newStatus: ComplianceRequirementStatus;
}
