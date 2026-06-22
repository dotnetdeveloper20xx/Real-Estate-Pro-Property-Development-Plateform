/**
 * Property 4: Table pagination event correctness
 *
 * For any page number within valid bounds (1 to totalPages) and any configured
 * page size from the options array, the emitted page change event SHALL contain
 * the exact requested page number and page size values, and navigation SHALL NOT
 * allow page values outside [1, totalPages].
 *
 * **Validates: Requirements 3.4**
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { DataTableComponent, IPageChangeEvent } from './data-table.component';

describe('Property 4: Table pagination event correctness', () => {
  let fixture: ComponentFixture<DataTableComponent>;
  let component: DataTableComponent;
  let emittedEvents: IPageChangeEvent[];

  /** Arbitrary for page size options (non-empty array of distinct positive integers) */
  const pageSizeOptionsArb = fc
    .uniqueArray(fc.integer({ min: 1, max: 200 }), { minLength: 1, maxLength: 6 })
    .map(arr => arr.sort((a, b) => a - b));

  /** Arbitrary for total record count */
  const totalCountArb = fc.integer({ min: 0, max: 10000 });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTableComponent);
    component = fixture.componentInstance;
    emittedEvents = [];
    component.pageChange.subscribe((event: IPageChangeEvent) => {
      emittedEvents.push(event);
    });
  });

  /**
   * Helper: initialize component with given config and trigger change detection.
   */
  function initComponent(totalCount: number, pageSizeOptions: number[]): void {
    component.totalCount = totalCount;
    component.pageSizeOptions = pageSizeOptions;
    component.columns = [{ key: 'id', label: 'ID', type: 'text', sortable: false, visible: true }];
    component.data = [];
    component.ngOnInit();
    fixture.detectChanges();
    emittedEvents = [];
  }

  it('emitted page change event contains exact requested page and pageSize for valid pages', () => {
    fc.assert(
      fc.property(
        totalCountArb,
        pageSizeOptionsArb,
        (totalCount, pageSizeOptions) => {
          initComponent(totalCount, pageSizeOptions);

          const pageSize = component.currentPageSize();
          const totalPages = component.totalPages();

          // Generate a valid page within bounds
          if (totalPages < 1) return; // skip degenerate case

          for (let page = 1; page <= Math.min(totalPages, 5); page++) {
            emittedEvents = [];
            component.onPageChange(page);

            expect(emittedEvents.length).toBe(1);
            expect(emittedEvents[0].page).toBe(page);
            expect(emittedEvents[0].pageSize).toBe(pageSize);
            expect(component.currentPage()).toBe(page);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('page change event for arbitrary valid page number contains exact values', () => {
    fc.assert(
      fc.property(
        totalCountArb.filter(tc => tc > 0),
        pageSizeOptionsArb,
        fc.integer({ min: 1, max: 500 }),
        (totalCount, pageSizeOptions, rawPage) => {
          initComponent(totalCount, pageSizeOptions);

          const totalPages = component.totalPages();
          // Constrain rawPage to valid range
          const validPage = Math.max(1, Math.min(rawPage, totalPages));

          emittedEvents = [];
          component.onPageChange(validPage);

          expect(emittedEvents.length).toBe(1);
          expect(emittedEvents[0].page).toBe(validPage);
          expect(emittedEvents[0].pageSize).toBe(component.currentPageSize());
          expect(component.currentPage()).toBe(validPage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('navigation clamps page values below 1 to 1', () => {
    fc.assert(
      fc.property(
        totalCountArb.filter(tc => tc > 0),
        pageSizeOptionsArb,
        fc.integer({ min: -100, max: 0 }),
        (totalCount, pageSizeOptions, invalidPage) => {
          initComponent(totalCount, pageSizeOptions);

          emittedEvents = [];
          component.onPageChange(invalidPage);

          expect(emittedEvents.length).toBe(1);
          expect(emittedEvents[0].page).toBe(1);
          expect(emittedEvents[0].pageSize).toBe(component.currentPageSize());
          expect(component.currentPage()).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('navigation clamps page values above totalPages to totalPages', () => {
    fc.assert(
      fc.property(
        totalCountArb.filter(tc => tc > 0),
        pageSizeOptionsArb,
        fc.integer({ min: 1, max: 200 }),
        (totalCount, pageSizeOptions, excess) => {
          initComponent(totalCount, pageSizeOptions);

          const totalPages = component.totalPages();
          const invalidPage = totalPages + excess;

          emittedEvents = [];
          component.onPageChange(invalidPage);

          expect(emittedEvents.length).toBe(1);
          expect(emittedEvents[0].page).toBe(totalPages);
          expect(emittedEvents[0].pageSize).toBe(component.currentPageSize());
          expect(component.currentPage()).toBe(totalPages);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('page size change emits event with page reset to 1 and selected pageSize', () => {
    fc.assert(
      fc.property(
        totalCountArb,
        pageSizeOptionsArb,
        (totalCount, pageSizeOptions) => {
          initComponent(totalCount, pageSizeOptions);

          // Navigate to a page > 1 first if possible
          const totalPages = component.totalPages();
          if (totalPages > 1) {
            component.onPageChange(2);
          }
          emittedEvents = [];

          // Change page size to each option and verify event
          for (const size of pageSizeOptions) {
            emittedEvents = [];
            component.onPageSizeChange(size);

            expect(emittedEvents.length).toBe(1);
            expect(emittedEvents[0].page).toBe(1);
            expect(emittedEvents[0].pageSize).toBe(size);
            expect(component.currentPage()).toBe(1);
            expect(component.currentPageSize()).toBe(size);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('emitted page is always within [1, totalPages] for any arbitrary input', () => {
    fc.assert(
      fc.property(
        totalCountArb,
        pageSizeOptionsArb,
        fc.integer({ min: -500, max: 1000 }),
        (totalCount, pageSizeOptions, anyPage) => {
          initComponent(totalCount, pageSizeOptions);

          const totalPages = component.totalPages();
          emittedEvents = [];
          component.onPageChange(anyPage);

          expect(emittedEvents.length).toBe(1);
          const emittedPage = emittedEvents[0].page;
          expect(emittedPage).toBeGreaterThanOrEqual(1);
          expect(emittedPage).toBeLessThanOrEqual(totalPages);
        }
      ),
      { numRuns: 200 }
    );
  });
});
