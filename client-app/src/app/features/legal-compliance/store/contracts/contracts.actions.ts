import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  IContractListItem,
  ICreateContract,
  IUpdateContract,
  ITransitionContractStatus,
  LegalContractStatus,
  LegalContractType
} from '../../models/contract.model';

/**
 * Query parameters for filtering contracts in the store.
 */
export interface IContractFilterParams {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly status?: LegalContractStatus;
  readonly contractType?: LegalContractType;
  readonly counterpartyName?: string;
  readonly legalCaseId?: string;
  readonly search?: string;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

/**
 * NgRx action group for contracts state management.
 * Follows the [Source] Event pattern for action naming.
 */
export const ContractActions = createActionGroup({
  source: 'Contracts',
  events: {
    /** Trigger loading of contracts with optional filters */
    'Load Contracts': props<{ params?: IContractFilterParams }>(),
    /** Successfully loaded contracts from API */
    'Load Contracts Success': props<{
      contracts: readonly IContractListItem[];
      totalCount: number;
      page: number;
      pageSize: number;
    }>(),
    /** Failed to load contracts */
    'Load Contracts Failure': props<{ error: string }>(),

    /** Trigger loading of contract register view */
    'Load Register': props<{ params?: IContractFilterParams }>(),
    /** Successfully loaded contract register from API */
    'Load Register Success': props<{
      contracts: readonly IContractListItem[];
      totalCount: number;
      page: number;
      pageSize: number;
    }>(),
    /** Failed to load contract register */
    'Load Register Failure': props<{ error: string }>(),

    /** Trigger creation of a new contract */
    'Create Contract': props<{ contract: ICreateContract }>(),
    /** Successfully created a contract */
    'Create Contract Success': props<{ contract: IContractListItem }>(),
    /** Failed to create a contract */
    'Create Contract Failure': props<{ error: string }>(),

    /** Trigger update of an existing contract */
    'Update Contract': props<{ id: string; changes: IUpdateContract }>(),
    /** Successfully updated a contract */
    'Update Contract Success': props<{ contract: IContractListItem }>(),
    /** Failed to update a contract */
    'Update Contract Failure': props<{ error: string }>(),

    /** Trigger a status transition on a contract */
    'Transition Status': props<{ id: string; transition: ITransitionContractStatus }>(),
    /** Successfully transitioned contract status */
    'Transition Status Success': props<{ contract: IContractListItem }>(),
    /** Failed to transition contract status */
    'Transition Status Failure': props<{ error: string }>(),

    /** Select a contract (for detail view navigation) */
    'Select Contract': props<{ id: string | null }>(),

    /** Clear any stored error */
    'Clear Error': emptyProps(),
  }
});
