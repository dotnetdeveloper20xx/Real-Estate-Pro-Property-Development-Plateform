import {
  selectActiveTabResults,
  selectCategoryCounts,
  selectHasResults,
  selectSelectedResult
} from './search.selectors';
import { ISearchCategoryResult, ISearchResultItem } from '../models';

/**
 * Unit tests for search selectors.
 * Validates memoization contracts and derived state correctness.
 *
 * Validates: Requirements 14.4
 */
describe('Search Selectors', () => {

  describe('selectHasResults', () => {
    it('returns true when totalCount > 0', () => {
      expect(selectHasResults.projector(5)).toBe(true);
    });

    it('returns false when totalCount is 0', () => {
      expect(selectHasResults.projector(0)).toBe(false);
    });
  });

  describe('selectActiveTabResults', () => {
    const landCategory: ISearchCategoryResult = {
      category: 'Land',
      results: [],
      totalCount: 5,
      icon: 'landscape',
      priority: 1
    };

    const legalCategory: ISearchCategoryResult = {
      category: 'Legal',
      results: [],
      totalCount: 3,
      icon: 'gavel',
      priority: 2
    };

    const results: ISearchCategoryResult[] = [landCategory, legalCategory];

    it('returns all results when tab is "all"', () => {
      expect(selectActiveTabResults.projector(results, 'all')).toEqual(results);
    });

    it('filters by category when tab matches a specific category', () => {
      expect(selectActiveTabResults.projector(results, 'Land')).toEqual([landCategory]);
    });

    it('returns empty array when tab does not match any category', () => {
      expect(selectActiveTabResults.projector(results, 'Finance')).toEqual([]);
    });

    it('returns empty array when results are empty regardless of tab', () => {
      expect(selectActiveTabResults.projector([], 'Land')).toEqual([]);
    });
  });

  describe('selectCategoryCounts', () => {
    it('maps results to category count summaries', () => {
      const results: ISearchCategoryResult[] = [
        { category: 'Land', results: [], totalCount: 12, icon: 'landscape', priority: 1 },
        { category: 'Planning', results: [], totalCount: 8, icon: 'assignment', priority: 2 }
      ];

      const counts = selectCategoryCounts.projector(results);

      expect(counts).toEqual([
        { category: 'Land', count: 12, icon: 'landscape' },
        { category: 'Planning', count: 8, icon: 'assignment' }
      ]);
    });

    it('returns empty array when no results exist', () => {
      expect(selectCategoryCounts.projector([])).toEqual([]);
    });
  });

  describe('selectSelectedResult', () => {
    const mockItem: ISearchResultItem = {
      entityId: '1',
      entityType: 'LandOpportunity',
      title: 'Test Site',
      highlightedTitle: null,
      subtitle: 'London',
      highlightedSubtitle: null,
      status: 'Active',
      statusVariant: 'success',
      icon: 'landscape',
      category: 'Land',
      moduleBadge: 'Land Acquisition',
      navigationRoute: '/land/1',
      lastUpdated: '2024-01-01',
      breadcrumb: null,
      relevancyScore: 10.5,
      quickActions: []
    };

    const results: ISearchCategoryResult[] = [
      {
        category: 'Land',
        results: [mockItem],
        totalCount: 1,
        icon: 'landscape',
        priority: 1
      }
    ];

    it('returns null when selectedResultIndex is -1', () => {
      expect(selectSelectedResult.projector(results, -1)).toBeNull();
    });

    it('returns the correct result item at the given index', () => {
      expect(selectSelectedResult.projector(results, 0)).toEqual(mockItem);
    });

    it('returns null when index exceeds available results', () => {
      expect(selectSelectedResult.projector(results, 99)).toBeNull();
    });

    it('returns null when results array is empty', () => {
      expect(selectSelectedResult.projector([], 0)).toBeNull();
    });
  });
});
