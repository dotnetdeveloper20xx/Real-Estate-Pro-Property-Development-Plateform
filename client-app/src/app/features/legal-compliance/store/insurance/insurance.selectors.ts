import { createFeatureSelector, createSelector } from '@ngrx/store';
import { InsuranceState, InsurancePagination } from './insurance.state';
import { insuranceAdapter } from './insurance.reducer';
import { IInsuranceRecordListItem, InsuranceStatus, CoverageType } from '../../models/insurance-record.model';

/**
 * Feature selector for the insurance state slice.
 */
export const selectInsuranceState = createFeatureSelector<InsuranceState>('insurance');

/**
 * Entity adapter selectors for normalized state access.
 */
const { selectAll, selectEntities, selectTotal } = insuranceAdapter.getSelectors();

/**
 * Select all insurance records as an array, sorted by the adapter's sortComparer.
 */
export const selectAllInsuranceRecords = createSelector(
  selectInsuranceState,
  selectAll
);

/**
 * Select the insurance record entities dictionary (id → entity).
 */
export const selectInsuranceEntities = createSelector(
  selectInsuranceState,
  selectEntities
);

/**
 * Select the total count of insurance records.
 */
export const selectInsuranceTotalCount = createSelector(
  selectInsuranceState,
  selectTotal
);

/**
 * Select the currently selected insurance record ID.
 */
export const selectSelectedInsuranceId = createSelector(
  selectInsuranceState,
  (state: InsuranceState) => state.selectedId
);

/**
 * Select the currently selected insurance record entity.
 */
export const selectSelectedInsuranceRecord = createSelector(
  selectInsuranceEntities,
  selectSelectedInsuranceId,
  (entities, selectedId): IInsuranceRecordListItem | undefined =>
    selectedId ? entities[selectedId] : undefined
);

/**
 * Select an insurance record by its ID.
 */
export const selectInsuranceRecordById = (id: string) =>
  createSelector(
    selectInsuranceEntities,
    (entities): IInsuranceRecordListItem | undefined => entities[id]
  );

/**
 * Select insurance records filtered by status.
 */
export const selectInsuranceByStatus = (status: InsuranceStatus) =>
  createSelector(
    selectAllInsuranceRecords,
    (records): readonly IInsuranceRecordListItem[] =>
      records.filter((record) => record.status === status)
  );

/**
 * Select insurance records filtered by coverage type.
 */
export const selectInsuranceByCoverageType = (coverageType: CoverageType) =>
  createSelector(
    selectAllInsuranceRecords,
    (records): readonly IInsuranceRecordListItem[] =>
      records.filter((record) => record.coverageType === coverageType)
  );

/**
 * Select insurance records that are expiring soon (status = ExpiringSoon).
 */
export const selectExpiringSoonRecords = createSelector(
  selectAllInsuranceRecords,
  (records): readonly IInsuranceRecordListItem[] =>
    records.filter((record) => record.status === InsuranceStatus.ExpiringSoon)
);

/**
 * Select insurance records that have expired (status = Expired).
 */
export const selectExpiredRecords = createSelector(
  selectAllInsuranceRecords,
  (records): readonly IInsuranceRecordListItem[] =>
    records.filter((record) => record.status === InsuranceStatus.Expired)
);

/**
 * Select the count of insurance records that are expiring soon.
 * Used for dashboard KPI display.
 */
export const selectExpiringSoonCount = createSelector(
  selectExpiringSoonRecords,
  (records): number => records.length
);

/**
 * Select the count of insurance records that have expired.
 */
export const selectExpiredCount = createSelector(
  selectExpiredRecords,
  (records): number => records.length
);

/**
 * Select combined count of expiring and expired records (total requiring attention).
 */
export const selectExpiringTotalCount = createSelector(
  selectExpiringSoonCount,
  selectExpiredCount,
  (expiring, expired): number => expiring + expired
);

/**
 * Select only active insurance records (status = Active).
 */
export const selectActiveInsuranceRecords = createSelector(
  selectAllInsuranceRecords,
  (records): readonly IInsuranceRecordListItem[] =>
    records.filter((record) => record.status === InsuranceStatus.Active)
);

/**
 * Select insurance records grouped by status.
 * Returns a record mapping each InsuranceStatus to an array of records.
 */
export const selectInsuranceGroupedByStatus = createSelector(
  selectAllInsuranceRecords,
  (records): Record<InsuranceStatus, readonly IInsuranceRecordListItem[]> => {
    const grouped: Record<InsuranceStatus, IInsuranceRecordListItem[]> = {
      [InsuranceStatus.Active]: [],
      [InsuranceStatus.ExpiringSoon]: [],
      [InsuranceStatus.Expired]: [],
      [InsuranceStatus.Renewed]: [],
      [InsuranceStatus.Cancelled]: [],
      [InsuranceStatus.Closed]: []
    };

    for (const record of records) {
      grouped[record.status].push(record);
    }

    return grouped;
  }
);

/**
 * Select the loading state indicator.
 */
export const selectInsuranceLoading = createSelector(
  selectInsuranceState,
  (state: InsuranceState) => state.loading
);

/**
 * Select the current error message (null if no error).
 */
export const selectInsuranceError = createSelector(
  selectInsuranceState,
  (state: InsuranceState) => state.error
);

/**
 * Select the pagination metadata for insurance records.
 */
export const selectInsurancePagination = createSelector(
  selectInsuranceState,
  (state: InsuranceState): InsurancePagination => state.pagination
);
