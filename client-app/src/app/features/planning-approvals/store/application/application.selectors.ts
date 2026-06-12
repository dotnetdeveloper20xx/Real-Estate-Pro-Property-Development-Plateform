import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ApplicationState } from './application.state';
import { applicationAdapter } from './application.reducer';
import { IApplicationListItem, PlanningApplicationStatus } from '../../models/planning-application.model';

/**
 * Feature selector for the planning applications state slice.
 */
export const selectApplicationState = createFeatureSelector<ApplicationState>('planningApplications');

/**
 * Entity adapter selectors for normalized state access.
 */
const { selectAll, selectEntities } = applicationAdapter.getSelectors();

/**
 * Select all planning applications as an array, sorted by the adapter's sortComparer.
 */
export const selectAllApplications = createSelector(
  selectApplicationState,
  selectAll
);

/**
 * Select the application entities dictionary (id → entity).
 */
export const selectApplicationEntities = createSelector(
  selectApplicationState,
  selectEntities
);

/**
 * Select the currently selected application ID.
 */
export const selectSelectedApplicationId = createSelector(
  selectApplicationState,
  (state: ApplicationState) => state.selectedId
);

/**
 * Select the currently selected application entity.
 */
export const selectSelectedApplication = createSelector(
  selectApplicationEntities,
  selectSelectedApplicationId,
  (entities, selectedId): IApplicationListItem | undefined =>
    selectedId ? entities[selectedId] : undefined
);

/**
 * Select a planning application by its ID.
 */
export const selectApplicationById = (id: string) =>
  createSelector(
    selectApplicationEntities,
    (entities): IApplicationListItem | undefined => entities[id]
  );

/**
 * Select applications grouped by status for the pipeline view.
 * Returns a record mapping each PlanningApplicationStatus to an array of applications.
 */
export const selectApplicationsByStatus = createSelector(
  selectAllApplications,
  (applications): Record<PlanningApplicationStatus, readonly IApplicationListItem[]> => {
    const grouped: Record<PlanningApplicationStatus, IApplicationListItem[]> = {
      [PlanningApplicationStatus.PreApplication]: [],
      [PlanningApplicationStatus.Submitted]: [],
      [PlanningApplicationStatus.Validated]: [],
      [PlanningApplicationStatus.UnderReview]: [],
      [PlanningApplicationStatus.CommitteeReview]: [],
      [PlanningApplicationStatus.Approved]: [],
      [PlanningApplicationStatus.ApprovedWithConditions]: [],
      [PlanningApplicationStatus.Refused]: [],
      [PlanningApplicationStatus.Appeal]: [],
      [PlanningApplicationStatus.Withdrawn]: []
    };

    for (const application of applications) {
      const status = application.status as PlanningApplicationStatus;
      if (grouped[status]) {
        grouped[status].push(application);
      }
    }

    return grouped;
  }
);

/**
 * Select applications filtered by a specific status.
 */
export const selectApplicationsFiltered = (status: PlanningApplicationStatus) =>
  createSelector(
    selectAllApplications,
    (applications): readonly IApplicationListItem[] =>
      applications.filter((app) => app.status === status)
  );

/**
 * Select the loading state indicator.
 */
export const selectApplicationLoading = createSelector(
  selectApplicationState,
  (state: ApplicationState) => state.loading
);

/**
 * Select the current error message (null if no error).
 */
export const selectApplicationError = createSelector(
  selectApplicationState,
  (state: ApplicationState) => state.error
);
