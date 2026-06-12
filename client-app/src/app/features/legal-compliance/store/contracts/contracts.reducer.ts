import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { IContractListItem } from '../../models/contract.model';
import { ContractsState } from './contracts.state';
import { ContractActions } from './contracts.actions';

/**
 * Entity adapter for normalized contract state management.
 * Uses 'id' as the primary key and sorts by createdAt descending (newest first).
 */
export const contractAdapter: EntityAdapter<IContractListItem> = createEntityAdapter<IContractListItem>({
  selectId: (contract: IContractListItem) => contract.id,
  sortComparer: (a: IContractListItem, b: IContractListItem) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
});

/**
 * Initial state using EntityAdapter's getInitialState plus custom properties.
 */
export const initialContractsState: ContractsState = contractAdapter.getInitialState({
  loading: false,
  error: null,
  selectedId: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 10
});

/**
 * Contracts reducer handling all contract-related actions.
 * Uses @ngrx/entity adapter methods for normalized CRUD operations.
 */
export const contractsReducer = createReducer(
  initialContractsState,

  // Load Contracts
  on(ContractActions.loadContracts, (state): ContractsState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ContractActions.loadContractsSuccess, (state, { contracts, totalCount, page, pageSize }): ContractsState =>
    contractAdapter.setAll([...contracts], {
      ...state,
      loading: false,
      error: null,
      totalCount,
      currentPage: page,
      pageSize
    })
  ),
  on(ContractActions.loadContractsFailure, (state, { error }): ContractsState => ({
    ...state,
    loading: false,
    error
  })),

  // Load Register (uses the same entity state)
  on(ContractActions.loadRegister, (state): ContractsState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ContractActions.loadRegisterSuccess, (state, { contracts, totalCount, page, pageSize }): ContractsState =>
    contractAdapter.setAll([...contracts], {
      ...state,
      loading: false,
      error: null,
      totalCount,
      currentPage: page,
      pageSize
    })
  ),
  on(ContractActions.loadRegisterFailure, (state, { error }): ContractsState => ({
    ...state,
    loading: false,
    error
  })),

  // Create
  on(ContractActions.createContract, (state): ContractsState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ContractActions.createContractSuccess, (state, { contract }): ContractsState =>
    contractAdapter.addOne(contract, {
      ...state,
      loading: false,
      error: null,
      totalCount: state.totalCount + 1
    })
  ),
  on(ContractActions.createContractFailure, (state, { error }): ContractsState => ({
    ...state,
    loading: false,
    error
  })),

  // Update
  on(ContractActions.updateContract, (state): ContractsState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ContractActions.updateContractSuccess, (state, { contract }): ContractsState =>
    contractAdapter.upsertOne(contract, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(ContractActions.updateContractFailure, (state, { error }): ContractsState => ({
    ...state,
    loading: false,
    error
  })),

  // Transition Status
  on(ContractActions.transitionStatus, (state): ContractsState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ContractActions.transitionStatusSuccess, (state, { contract }): ContractsState =>
    contractAdapter.upsertOne(contract, {
      ...state,
      loading: false,
      error: null
    })
  ),
  on(ContractActions.transitionStatusFailure, (state, { error }): ContractsState => ({
    ...state,
    loading: false,
    error
  })),

  // Select
  on(ContractActions.selectContract, (state, { id }): ContractsState => ({
    ...state,
    selectedId: id
  })),

  // Clear Error
  on(ContractActions.clearError, (state): ContractsState => ({
    ...state,
    error: null
  }))
);
