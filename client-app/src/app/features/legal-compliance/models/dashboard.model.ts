/**
 * Dashboard KPI and metrics models.
 */

import { LegalCaseStatus, LegalCasePriority } from './legal-case.model';
import { LegalContractType } from './contract.model';

/** Case count grouped by status. */
export interface ICaseCountByStatus {
  readonly status: LegalCaseStatus;
  readonly count: number;
}

/** Case count grouped by priority. */
export interface ICaseCountByPriority {
  readonly priority: LegalCasePriority;
  readonly count: number;
}

/** Contract value grouped by type. */
export interface IContractValueByType {
  readonly contractType: LegalContractType;
  readonly totalValue: number;
  readonly count: number;
}

/** Risk summary item. */
export interface IRiskSummaryItem {
  readonly category: string;
  readonly highCount: number;
  readonly criticalCount: number;
}

/** Recent activity entry. */
export interface IRecentActivity {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly action: string;
  readonly description: string;
  readonly performedBy: string;
  readonly performedAt: string;
}

/** Complete dashboard data. */
export interface IDashboardData {
  readonly caseCountsByStatus: readonly ICaseCountByStatus[];
  readonly caseCountsByPriority: readonly ICaseCountByPriority[];
  readonly averageResolutionTimeDays: number;
  readonly complianceRate: number;
  readonly expiringInsuranceCount: number;
  readonly expiredInsuranceCount: number;
  readonly contractValuesByType: readonly IContractValueByType[];
  readonly contractsAwaitingApproval: number;
  readonly overdueComplianceCount: number;
  readonly overdueAuditCount: number;
  readonly recentActivities: readonly IRecentActivity[];
  readonly riskSummary: readonly IRiskSummaryItem[];
  readonly totalOpenCases: number;
  readonly totalActiveContracts: number;
}
