/**
 * Search result rendering helper types.
 * These models support the presentation layer for search result cards,
 * preview panels, and status variant mapping.
 */

import { IQuickAction } from './search.model';

/**
 * Valid status badge colour variants for search result cards.
 */
export type SearchResultStatusVariant = 'success' | 'info' | 'warning' | 'error' | 'ghost';

/**
 * Render configuration for a search result card's visual elements.
 */
export interface ISearchResultRenderConfig {
  readonly iconClass: string;
  readonly statusBadgeClass: string;
  readonly categoryBadgeClass: string;
}

/**
 * Data displayed in the search preview panel for a selected result.
 */
export interface IPreviewData {
  readonly entityId: string;
  readonly entityType: string;
  readonly title: string;
  readonly status: string | null;
  readonly statusVariant: SearchResultStatusVariant | null;
  readonly owner: string | null;
  readonly summary: string | null;
  readonly relatedLinks: IRelatedLink[];
  readonly actions: IQuickAction[];
  readonly recentActivity: IActivityItem[];
}

/**
 * A related link displayed in the preview panel.
 */
export interface IRelatedLink {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
}

/**
 * A recent activity entry displayed in the preview panel.
 */
export interface IActivityItem {
  readonly description: string;
  readonly timestamp: string;
  readonly user: string;
  readonly type: 'created' | 'updated' | 'status_changed' | 'comment' | 'document';
}

/**
 * Mapping from entity status values to badge colour variants.
 * Used to determine the visual presentation of status badges on search result cards.
 */
export const STATUS_VARIANT_MAP: Record<string, SearchResultStatusVariant> = {
  'Active': 'success',
  'Completed': 'success',
  'Approved': 'success',
  'Registered': 'success',
  'Identified': 'info',
  'InProgress': 'info',
  'UnderReview': 'info',
  'Pending': 'warning',
  'Draft': 'warning',
  'InitialReview': 'warning',
  'Rejected': 'error',
  'Failed': 'error',
  'Cancelled': 'error',
  'Closed': 'ghost',
  'Archived': 'ghost'
};
