/**
 * Comprehensive dashboard metrics returned from the API.
 * Includes KPIs, pipeline data, alerts, top opportunities,
 * recent activity, and activity-by-type breakdown.
 */
export interface IDashboardMetrics {
  readonly opportunitiesByStatus: Readonly<Record<string, number>>;
  readonly averageAcquisitionCycleDays: number;
  readonly conversionRatePercent: number;
  readonly dueDiligencePassRatePercent: number;
  readonly totalEvaluated: number;

  // Alerts
  readonly offersExpiringSoon: number;
  readonly overdueDueDiligence: number;
  readonly approvalsPending: number;

  // Top Opportunities
  readonly topOpportunities: readonly ITopOpportunity[];

  // Recent Activity
  readonly recentActivity: readonly IRecentActivityItem[];

  // Activity by Type (last 30 days)
  readonly activityByType: Readonly<Record<string, number>>;
}

/**
 * A top-ranked opportunity for the dashboard.
 */
export interface ITopOpportunity {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly estimatedValue: number;
  readonly status: string;
}

/**
 * A single recent activity entry for the dashboard timeline.
 */
export interface IRecentActivityItem {
  readonly opportunityId: string;
  readonly opportunityName: string;
  readonly status: string;
  readonly timestamp: string;
  readonly userName: string;
}

/**
 * Legacy activity interface for backward compat with activity-timeline component.
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
