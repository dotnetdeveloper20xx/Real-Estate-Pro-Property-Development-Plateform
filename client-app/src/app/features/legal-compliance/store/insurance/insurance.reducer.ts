import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { IInsuranceRecordListItem } from '../../models/insurance-record.model';
import { InsuranceState, InsurancePagination } from './insurance.state';
import { InsuranceActions } from './insurance.actions';

/**
 * Entity adapter for normalized insurance record state management.
 * Uses 'id' as the primary key and sorts by expiryDate ascending (soonest expiry first).
 */
export const insuranceAdapter: EntityAdapter<IInsuranceRecordListItem> = createEntityAdapter<IInsuranceRecordListItem>({
  selectId: (record: IInsuranceRecordListItem) => record.id,
  sortComparer: (a: IInsuranceRecordListItem, b: IInsuranceRecordListItem) =>
    new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
});

/** Default pagination state. */
const defaultPagination: InsurancePagination = {
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  totalPages: 0
};

/**
 * Initial state using EntityAdapter's getInitialState plus custom properties.
 */
export const initialInsuranceState: InsuranceState = insuranceAdapter.getInitialState({
  loading: false,
  error: null,
  selectedId: null,
  pagination: defaultPagination
});

/**
 * Insurance reducer handling all insurance-related actions.
 * Uses @ngrx/entity adapter methods for normalized CRUD operations.
 */
export const insuranceReducer = createReducer(
  initialInsuranceState,

  // Load
  on(InsuranceActions.loadInsuranceRecords, (state): InsuranceState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(InsuranceActions.loadInsuranceRecordsSuccess, (state, { records, pagination }): InsuranceState =>
    insuranceAdapter.setAll([...records], {
      ...state,
      loading: false,
      error: null,
      pagination
    })
  ),
  on(InsuranceActions.loadInsuranceRecordsFailure, (state, { error }): InsuranceState => ({
    ...state,
    loading: false,
    error
  })),

  // Create
  on(InsuranceActions.createInsuranceRecord, (state): InsuranceState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(InsuranceActions.createInsuranceRecordSuccess, (state, { record }): InsuranceState =>
    insuranceAdapter.addOne(record, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(InsuranceActions.createInsuranceRecordFailure, (state, { error }): InsuranceState => ({
    ...state,
    loading: false,
    error
  })),

  // Update
  on(InsuranceActions.updateInsuranceRecord, (state): InsuranceState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(InsuranceActions.updateInsuranceRecordSuccess, (state, { record }): InsuranceState =>
    insuranceAdapter.upsertOne(record, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(InsuranceActions.updateInsuranceRecordFailure, (state, { error }): InsuranceState => ({
    ...state,
    loading: false,
    error
  })),

  // Transition Status
  on(InsuranceActions.transitionInsuranceStatus, (state): InsuranceState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(InsuranceActions.transitionInsuranceStatusSuccess, (state, { record }): InsuranceState =>
    insuranceAdapter.upsertOne(record, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(InsuranceActions.transitionInsuranceStatusFailure, (state, { error }): InsuranceState => ({
    ...state,
    loading: false,
    error
  })),

  // Renew
  on(InsuranceActions.renewInsuranceRecord, (state): InsuranceState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(InsuranceActions.renewInsuranceRecordSuccess, (state, { record }): InsuranceState =>
    insuranceAdapter.addOne(record, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(InsuranceActions.renewInsuranceRecordFailure, (state, { error }): InsuranceState => ({
    ...state,
    loading: false,
    error
  })),

  // Select
  on(InsuranceActions.selectInsuranceRecord, (state, { id }): InsuranceState => ({
    ...state,
    selectedId: id
  }))
);
