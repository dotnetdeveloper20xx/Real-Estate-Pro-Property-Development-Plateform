import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SearchOverlayComponent } from '../../components/search-overlay/search-overlay.component';

/**
 * SearchContainerComponent is the top-level orchestrator for the Global Search feature.
 * It renders the SearchOverlayComponent which internally manages the full search experience
 * (input, results, keyboard navigation, focus trapping).
 *
 * This component is placed in the root layout so the overlay is accessible from any page.
 */
@Component({
  selector: 'app-search-container',
  standalone: true,
  imports: [SearchOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-search-overlay />`
})
export class SearchContainerComponent {}
