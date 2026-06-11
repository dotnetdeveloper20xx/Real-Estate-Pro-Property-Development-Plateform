import { OpportunityStatus } from './opportunity.model';

/**
 * Dashboard KPI metrics returned from the API.
 */
export interface IDashboardMetrics {
  readonly opportunitiesByStatus: Readonly<Record<OpportunityStatus, number>>;
  readonly averageAcquisitionCycleDays: number;
  readonly conversionRatePercent: number;
  readonly dueDiligencePassRatePercent: number;
  readonly totalEvaluated: number;
}

/**
 * A single recent activity entry for the dashboard timeline.
 */
export interface IRecentActivity {
  readonly id: string;
  readonly opportunityId: string;
  readonly opportunityName: string;
  readonly previousStatus: string;
  readonly newStatus: string;
  readonly changedBy: string;
  readonly changedAt: string;
}
