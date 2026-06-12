import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DashboardState } from './dashboard.state';

/**
 * Feature selector for the legal compliance dashboard state slice.
 */
export const selectDashboardState = createFeatureSelector<DashboardState>('legalDashboard');

/**
 * Select the full dashboard data object.
 */
export const selectDashboardData = createSelector(
  selectDashboardState,
  (state: DashboardState) => state.data
);

/**
 * Select the loading state indicator.
 */
export const selectDashboardLoading = createSelector(
  selectDashboardState,
  (state: DashboardState) => state.loading
);

/**
 * Select the current error message (null if no error).
 */
export const selectDashboardError = createSelector(
  selectDashboardState,
  (state: DashboardState) => state.error
);

// ---------- KPI Widget Selectors ----------

/**
 * Select case counts grouped by status.
 */
export const selectCaseCountsByStatus = createSelector(
  selectDashboardData,
  (data) => data?.caseCountsByStatus ?? []
);

/**
 * Select case counts grouped by priority.
 */
export const selectCaseCountsByPriority = createSelector(
  selectDashboardData,
  (data) => data?.caseCountsByPriority ?? []
);

/**
 * Select the average resolution time in days.
 */
export const selectAverageResolutionTimeDays = createSelector(
  selectDashboardData,
  (data) => data?.averageResolutionTimeDays ?? 0
);

/**
 * Select the compliance rate (percentage).
 */
export const selectComplianceRate = createSelector(
  selectDashboardData,
  (data) => data?.complianceRate ?? 0
);

/**
 * Select count of insurance policies expiring soon.
 */
export const selectExpiringInsuranceCount = createSelector(
  selectDashboardData,
  (data) => data?.expiringInsuranceCount ?? 0
);

/**
 * Select count of expired insurance policies.
 */
export const selectExpiredInsuranceCount = createSelector(
  selectDashboardData,
  (data) => data?.expiredInsuranceCount ?? 0
);

/**
 * Select contract values grouped by type.
 */
export const selectContractValuesByType = createSelector(
  selectDashboardData,
  (data) => data?.contractValuesByType ?? []
);

/**
 * Select the count of contracts awaiting approval.
 */
export const selectContractsAwaitingApproval = createSelector(
  selectDashboardData,
  (data) => data?.contractsAwaitingApproval ?? 0
);

/**
 * Select count of overdue compliance requirements.
 */
export const selectOverdueComplianceCount = createSelector(
  selectDashboardData,
  (data) => data?.overdueComplianceCount ?? 0
);

/**
 * Select count of overdue audit records.
 */
export const selectOverdueAuditCount = createSelector(
  selectDashboardData,
  (data) => data?.overdueAuditCount ?? 0
);

/**
 * Select recent activities for the activity feed.
 */
export const selectRecentActivities = createSelector(
  selectDashboardData,
  (data) => data?.recentActivities ?? []
);

/**
 * Select the risk summary items.
 */
export const selectRiskSummary = createSelector(
  selectDashboardData,
  (data) => data?.riskSummary ?? []
);

/**
 * Select total open cases count.
 */
export const selectTotalOpenCases = createSelector(
  selectDashboardData,
  (data) => data?.totalOpenCases ?? 0
);

/**
 * Select total active contracts count.
 */
export const selectTotalActiveContracts = createSelector(
  selectDashboardData,
  (data) => data?.totalActiveContracts ?? 0
);
