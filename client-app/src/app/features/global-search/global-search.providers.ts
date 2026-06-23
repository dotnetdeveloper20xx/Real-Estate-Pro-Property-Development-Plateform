import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { searchReducer } from './store/search.reducer';
import { SearchEffects } from './store/search.effects';

/**
 * Provides the Global Search NgRx feature state and effects.
 * Call this in the root app configuration to register the search store slice
 * and its side-effect handlers at application bootstrap.
 */
export function provideGlobalSearch(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideState('search', searchReducer),
    provideEffects(SearchEffects)
  ]);
}
