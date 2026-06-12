import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ContractsState } from './contracts.state';
import { contractAdapter } from './contracts.reducer';
import { IContractListItem, LegalContractStatus, LegalContractType } from '../../models/contract.model';

/**
 * Feature selector for the contracts state slice.
 */
export const selectContractsState = createFeatureSelector<ContractsState>('contracts');

/**
 * Entity adapter selectors for normalized state access.
 */
const { selectAll, selectEntities, selectTotal } = contractAdapter.getSelectors();

/**
 * Select all contracts as an array, sorted by the adapter's sortComparer.
 */
export const selectAllContracts = createSelector(
  selectContractsState,
  selectAll
);

/**
 * Select the contracts entities dictionary (id → entity).
 */
export const selectContractEntities = createSelector(
  selectContractsState,
  selectEntities
);

/**
 * Select the total number of contracts in the current entity state.
 */
export const selectContractCount = createSelector(
  selectContractsState,
  selectTotal
);

/**
 * Select the currently selected contract ID.
 */
export const selectSelectedContractId = createSelector(
  selectContractsState,
  (state: ContractsState) => state.selectedId
);

/**
 * Select the currently selected contract entity.
 */
export const selectSelectedContract = createSelector(
  selectContractEntities,
  selectSelectedContractId,
  (entities, selectedId): IContractListItem | undefined =>
    selectedId ? entities[selectedId] : undefined
);

/**
 * Select a contract by its ID.
 */
export const selectContractById = (id: string) =>
  createSelector(
    selectContractEntities,
    (entities): IContractListItem | undefined => entities[id]
  );

/**
 * Select the loading state indicator.
 */
export const selectContractsLoading = createSelector(
  selectContractsState,
  (state: ContractsState) => state.loading
);

/**
 * Select the current error message (null if no error).
 */
export const selectContractsError = createSelector(
  selectContractsState,
  (state: ContractsState) => state.error
);

/**
 * Select pagination metadata.
 */
export const selectContractsPagination = createSelector(
  selectContractsState,
  (state: ContractsState) => ({
    totalCount: state.totalCount,
    currentPage: state.currentPage,
    pageSize: state.pageSize,
    totalPages: Math.ceil(state.totalCount / state.pageSize)
  })
);

/**
 * Select contracts filtered by status.
 */
export const selectContractsByStatus = (status: LegalContractStatus) =>
  createSelector(
    selectAllContracts,
    (contracts): readonly IContractListItem[] =>
      contracts.filter((c) => c.status === status)
  );

/**
 * Select contracts filtered by contract type.
 */
export const selectContractsByType = (contractType: LegalContractType) =>
  createSelector(
    selectAllContracts,
    (contracts): readonly IContractListItem[] =>
      contracts.filter((c) => c.contractType === contractType)
  );

/**
 * Select contracts filtered by legal case ID.
 */
export const selectContractsByLegalCaseId = (legalCaseId: string) =>
  createSelector(
    selectAllContracts,
    (contracts): readonly IContractListItem[] =>
      contracts.filter((c) => c.legalCaseId === legalCaseId)
  );

/**
 * Select the count of contracts awaiting approval (status = Approved or UnderReview).
 * Contracts in UnderReview status are pending approval decisions.
 */
export const selectAwaitingApprovalCount = createSelector(
  selectAllContracts,
  (contracts): number =>
    contracts.filter((c) => c.status === LegalContractStatus.UnderReview).length
);

/**
 * Select contracts in the register view format — all contracts with key details.
 */
export const selectContractRegisterView = createSelector(
  selectAllContracts,
  (contracts): readonly IContractListItem[] => contracts
);

/**
 * Select contracts grouped by status for summary/dashboard views.
 */
export const selectContractsGroupedByStatus = createSelector(
  selectAllContracts,
  (contracts): Record<string, readonly IContractListItem[]> => {
    const grouped: Record<string, IContractListItem[]> = {};

    for (const status of Object.values(LegalContractStatus)) {
      grouped[status] = [];
    }

    for (const contract of contracts) {
      if (grouped[contract.status]) {
        grouped[contract.status].push(contract);
      }
    }

    return grouped;
  }
);

/**
 * Select the total value of active contracts (status = Active).
 */
export const selectActiveContractsTotalValue = createSelector(
  selectAllContracts,
  (contracts): number =>
    contracts
      .filter((c) => c.status === LegalContractStatus.Active)
      .reduce((sum, c) => sum + c.contractValue, 0)
);

/**
 * Select contracts that are expiring soon (endDate within 30 days from now and status is Active).
 */
export const selectExpiringContracts = createSelector(
  selectAllContracts,
  (contracts): readonly IContractListItem[] => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return contracts.filter((c) => {
      if (c.status !== LegalContractStatus.Active) {
        return false;
      }
      const endDate = new Date(c.endDate);
      return endDate >= now && endDate <= thirtyDaysFromNow;
    });
  }
);
