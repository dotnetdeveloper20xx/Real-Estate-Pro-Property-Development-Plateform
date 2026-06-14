import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  ILegalCaseListItem,
  ILegalCasePipeline,
  ICreateLegalCase,
  IUpdateLegalCase,
  ITransitionLegalCaseStatus
} from '../../models';
import { ILegalCaseQueryParams } from '../../services/legal-case.service';

/**
 * NgRx action group for legal cases state management.
 * Follows the [Source] Event pattern for action naming.
 */
export const LegalCasesActions = createActionGroup({
  source: 'Legal Cases',
  events: {
    /** Trigger loading of legal cases with optional filters */
    'Load Legal Cases': props<{ params?: ILegalCaseQueryParams }>(),
    /** Successfully loaded legal cases from API */
    'Load Legal Cases Success': props<{ cases: readonly ILegalCaseListItem[] }>(),
    /** Failed to load legal cases */
    'Load Legal Cases Failure': props<{ error: string }>(),

    /** Trigger creation of a new legal case */
    'Create Legal Case': props<{ legalCase: ICreateLegalCase }>(),
    /** Successfully created a legal case */
    'Create Legal Case Success': props<{ legalCase: ILegalCaseListItem }>(),
    /** Failed to create a legal case */
    'Create Legal Case Failure': props<{ error: string }>(),

    /** Trigger update of an existing legal case */
    'Update Legal Case': props<{ id: string; changes: IUpdateLegalCase }>(),
    /** Successfully updated a legal case */
    'Update Legal Case Success': props<{ legalCase: ILegalCaseListItem }>(),
    /** Failed to update a legal case */
    'Update Legal Case Failure': props<{ error: string }>(),

    /** Trigger a status transition on a legal case */
    'Transition Legal Case Status': props<{ id: string; transition: ITransitionLegalCaseStatus }>(),
    /** Successfully transitioned legal case status */
    'Transition Legal Case Status Success': props<{ legalCase: ILegalCaseListItem }>(),
    /** Failed to transition legal case status */
    'Transition Legal Case Status Failure': props<{ error: string }>(),

    /** Trigger loading of the pipeline view (cases grouped by status) */
    'Load Pipeline': emptyProps(),
    /** Successfully loaded pipeline data */
    'Load Pipeline Success': props<{ pipeline: readonly ILegalCasePipeline[] }>(),
    /** Failed to load pipeline data */
    'Load Pipeline Failure': props<{ error: string }>(),

    /** Select a legal case (for detail view navigation) */
    'Select Legal Case': props<{ id: string | null }>(),
  }
});
