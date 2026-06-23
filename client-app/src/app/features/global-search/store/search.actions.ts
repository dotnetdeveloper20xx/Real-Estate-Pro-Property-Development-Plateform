import { createActionGroup, emptyProps, props } from '@ngrx/store';

import {
  IAdvancedFilters,
  IPinnedItem,
  IRecentSearch,
  ISavedSearch,
  ISearchResponse,
  ISearchResultItem,
  ISuggestion
} from '../models';
import { IPreviewData } from '../models/search-result.model';

/**
 * NgRx action group for the Global Search feature.
 * Follows the [Source] Event pattern for action naming.
 */
export const SearchActions = createActionGroup({
  source: 'Search',
  events: {
    'Open Overlay': emptyProps(),
    'Close Overlay': emptyProps(),
    'Execute Search': props<{ query: string }>(),
    'Execute Search Success': props<{ response: ISearchResponse }>(),
    'Execute Search Failure': props<{ error: string }>(),
    'Clear Search': emptyProps(),
    'Set Active Tab': props<{ tab: string }>(),
    'Add Recent Search': props<{ search: IRecentSearch }>(),
    'Clear Recent Searches': emptyProps(),
    'Load Recent Searches': emptyProps(),
    'Load Recent Searches Success': props<{ searches: IRecentSearch[] }>(),
    'Pin Item': props<{ entityId: string; entityType: string; title: string; subtitle: string | null; icon: string; category: string; navigationRoute: string }>(),
    'Pin Item Success': props<{ item: IPinnedItem }>(),
    'Unpin Item': props<{ id: string }>(),
    'Unpin Item Success': props<{ id: string }>(),
    'Load Pinned Items': emptyProps(),
    'Load Pinned Items Success': props<{ items: IPinnedItem[] }>(),
    'Load Suggestions': props<{ prefix: string }>(),
    'Load Suggestions Success': props<{ suggestions: ISuggestion[] }>(),
    'Set Advanced Filters': props<{ filters: Partial<IAdvancedFilters> }>(),
    'Clear Advanced Filters': emptyProps(),
    'Select Result': props<{ index: number }>(),
    'Navigate To Result': props<{ result: ISearchResultItem }>(),
    'Load Preview': props<{ result: ISearchResultItem }>(),
    'Load Preview Success': props<{ preview: IPreviewData }>(),
    'Load Preview Failure': props<{ error: string }>(),
    'Save Search': props<{ name: string; query: string; filters: IAdvancedFilters }>(),
    'Save Search Success': props<{ savedSearch: ISavedSearch }>(),
    'Delete Saved Search': props<{ id: string }>(),
    'Delete Saved Search Success': props<{ id: string }>(),
    'Load Saved Searches': emptyProps(),
    'Load Saved Searches Success': props<{ searches: ISavedSearch[] }>(),
    'Toggle Command Mode': props<{ enabled: boolean }>(),
  }
});
