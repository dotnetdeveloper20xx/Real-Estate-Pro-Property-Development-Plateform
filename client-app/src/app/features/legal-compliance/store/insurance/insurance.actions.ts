import { createActionGroup, props } from '@ngrx/store';
import {
  IInsuranceRecordListItem,
  ICreateInsuranceRecord,
  IUpdateInsuranceRecord,
  ITransitionInsuranceStatus,
  IRenewInsuranceRecord,
  InsuranceStatus,
  CoverageType
} from '../../models/insurance-record.model';
import { InsurancePagination } from './insurance.state';

/**
 * Query parameters for filtering insurance records in the store.
 */
export interface IInsuranceFilterParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly status?: InsuranceStatus;
  readonly coverageType?: CoverageType;
  readonly insurer?: string;
  readonly search?: string;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

/**
 * NgRx action group for insurance record state management.
 * Follows the [Source] Event pattern for action naming.
 */
export const InsuranceActions = createActionGroup({
  source: 'Insurance',
  events: {
    /** Trigger loading of insurance records with optional filters */
    'Load Insurance Records': props<{ params?: IInsuranceFilterParams }>(),
    /** Successfully loaded insurance records from API */
    'Load Insurance Records Success': props<{ records: readonly IInsuranceRecordListItem[]; pagination: InsurancePagination }>(),
    /** Failed to load insurance records */
    'Load Insurance Records Failure': props<{ error: string }>(),

    /** Trigger creation of a new insurance record */
    'Create Insurance Record': props<{ record: ICreateInsuranceRecord }>(),
    /** Successfully created an insurance record */
    'Create Insurance Record Success': props<{ record: IInsuranceRecordListItem }>(),
    /** Failed to create an insurance record */
    'Create Insurance Record Failure': props<{ error: string }>(),

    /** Trigger update of an existing insurance record */
    'Update Insurance Record': props<{ id: string; changes: IUpdateInsuranceRecord }>(),
    /** Successfully updated an insurance record */
    'Update Insurance Record Success': props<{ record: IInsuranceRecordListItem }>(),
    /** Failed to update an insurance record */
    'Update Insurance Record Failure': props<{ error: string }>(),

    /** Trigger a status transition on an insurance record */
    'Transition Insurance Status': props<{ id: string; payload: ITransitionInsuranceStatus }>(),
    /** Successfully transitioned insurance status */
    'Transition Insurance Status Success': props<{ record: IInsuranceRecordListItem }>(),
    /** Failed to transition insurance status */
    'Transition Insurance Status Failure': props<{ error: string }>(),

    /** Trigger renewal of an insurance record */
    'Renew Insurance Record': props<{ id: string; payload: IRenewInsuranceRecord }>(),
    /** Successfully renewed an insurance record */
    'Renew Insurance Record Success': props<{ record: IInsuranceRecordListItem }>(),
    /** Failed to renew an insurance record */
    'Renew Insurance Record Failure': props<{ error: string }>(),

    /** Select an insurance record (for detail view navigation) */
    'Select Insurance Record': props<{ id: string | null }>(),
  }
});
