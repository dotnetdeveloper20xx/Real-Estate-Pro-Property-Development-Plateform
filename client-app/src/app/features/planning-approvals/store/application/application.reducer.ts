import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { IApplicationListItem } from '../../models/planning-application.model';
import { ApplicationState } from './application.state';
import { ApplicationActions } from './application.actions';

/**
 * Entity adapter for normalized planning application state management.
 * Uses 'id' as the primary key and sorts by createdAt descending (newest first).
 */
export const applicationAdapter: EntityAdapter<IApplicationListItem> = createEntityAdapter<IApplicationListItem>({
  selectId: (application: IApplicationListItem) => application.id,
  sortComparer: (a: IApplicationListItem, b: IApplicationListItem) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
});

/**
 * Initial state using EntityAdapter's getInitialState plus custom properties.
 */
export const initialApplicationState: ApplicationState = applicationAdapter.getInitialState({
  loading: false,
  error: null,
  selectedId: null
});

/**
 * Planning application reducer handling all application-related actions.
 * Uses @ngrx/entity adapter methods for normalized CRUD operations.
 */
export const applicationReducer = createReducer(
  initialApplicationState,

  // Load
  on(ApplicationActions.loadApplications, (state): ApplicationState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ApplicationActions.loadApplicationsSuccess, (state, { applications }): ApplicationState =>
    applicationAdapter.setAll([...applications], {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(ApplicationActions.loadApplicationsFailure, (state, { error }): ApplicationState => ({
    ...state,
    loading: false,
    error
  })),

  // Create
  on(ApplicationActions.createApplication, (state): ApplicationState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ApplicationActions.createApplicationSuccess, (state, { application }): ApplicationState =>
    applicationAdapter.addOne(application, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(ApplicationActions.createApplicationFailure, (state, { error }): ApplicationState => ({
    ...state,
    loading: false,
    error
  })),

  // Update
  on(ApplicationActions.updateApplication, (state): ApplicationState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ApplicationActions.updateApplicationSuccess, (state, { application }): ApplicationState =>
    applicationAdapter.upsertOne(application, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(ApplicationActions.updateApplicationFailure, (state, { error }): ApplicationState => ({
    ...state,
    loading: false,
    error
  })),

  // Delete
  on(ApplicationActions.deleteApplication, (state): ApplicationState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ApplicationActions.deleteApplicationSuccess, (state, { id }): ApplicationState =>
    applicationAdapter.removeOne(id, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(ApplicationActions.deleteApplicationFailure, (state, { error }): ApplicationState => ({
    ...state,
    loading: false,
    error
  })),

  // Transition Status
  on(ApplicationActions.transitionStatus, (state): ApplicationState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ApplicationActions.transitionStatusSuccess, (state, { application }): ApplicationState =>
    applicationAdapter.upsertOne(application, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(ApplicationActions.transitionStatusFailure, (state, { error }): ApplicationState => ({
    ...state,
    loading: false,
    error
  })),

  // Select
  on(ApplicationActions.selectApplication, (state, { id }): ApplicationState => ({
    ...state,
    selectedId: id
  }))
);
