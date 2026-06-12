/**
 * Dashboard KPI metrics returned from the planning dashboard API endpoint.
 */
export interface IDashboardMetrics {
  readonly statusCounts: Readonly<Record<string, number>>;
  readonly averageDecisionTimeDays: number | null;
  readonly approvalRatePercent: number;
  readonly appealSuccessRatePercent: number;
  readonly outstandingConditionsCount: number;
  readonly overdueMilestonesCount: number;
  readonly recentActivity: readonly IRecentActivity[];
  readonly approachingDeadlines: readonly IApproachingDeadline[];
}

/**
 * A single recent status change activity entry for the dashboard timeline.
 */
export interface IRecentActivity {
  readonly applicationId: string;
  readonly description: string;
  readonly previousStatus: string;
  readonly newStatus: string;
  readonly changedBy: string;
  readonly changedAt: string;
}

/**
 * An application approaching its target decision date.
 */
export interface IApproachingDeadline {
  readonly applicationId: string;
  readonly description: string;
  readonly targetDecisionDate: string;
  readonly daysRemaining: number;
}
