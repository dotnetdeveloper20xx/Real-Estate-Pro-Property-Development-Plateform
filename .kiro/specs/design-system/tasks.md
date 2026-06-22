# Implementation Plan: Enterprise Design System and Shared Component Library

## Overview

This plan implements the BuildEstate Pro design system as a comprehensive, accessible, themeable component library in Angular 20 with TypeScript. The implementation follows an incremental approach: core services and infrastructure first, then individual component systems, then the preferences UI layer, and finally integration wiring. All components use OnPush change detection, Angular signals where appropriate, and DaisyUI theming via CSS custom properties.

## Tasks

- [x] 1. Set up design system directory structure and core services
  - [x] 1.1 Create design system directory structure and barrel exports
    - Create `client-app/src/app/shared/design-system/` directory with all subdirectories (modals, tables, filters, forms, currency, dates, uploads, badges, dialogs, loading, empty-states, preferences, services)
    - Create `index.ts` barrel export file at the root of the design-system directory
    - Create CSS custom properties file for font scale tokens (`:root`, `[data-scale="small"]`, `[data-scale="large"]`)
    - _Requirements: 1.1, 1.5, 13.1, 13.2_

  - [x] 1.2 Implement DisplayPreferenceService, ThemeEngine, and FontScaleService
    - Create `services/display-preference.service.ts` with `IUserPreferences` interface, `preferences$` observable, `loadPreferences()`, `savePreferences()`, `applyTheme()`, `applyFontScale()`, `applyDensity()` methods
    - Create `services/theme-engine.service.ts` that manages `data-theme` attribute on `<html>` element
    - Create `services/font-scale.service.ts` that manages `data-scale` attribute and CSS custom properties on `:root`
    - Implement fallback to defaults (Light theme, Regular scale) when API load fails
    - _Requirements: 13.2, 13.3, 13.6, 14.1, 14.2, 14.5, 14.6_

  - [x] 1.3 Set up NgRx preferences state (actions, reducer, effects, selectors)
    - Create `IPreferencesState` with `preferences`, `loading`, `saving`, `error`, `lastSaved` fields
    - Define actions: `loadPreferences`, `loadPreferencesSuccess`, `loadPreferencesFailure`, `savePreferences`, `savePreferencesSuccess`, `savePreferencesFailure`
    - Create effects connecting to `DisplayPreferenceService` for API calls (`GET /api/v1/user-preferences`, `PUT /api/v1/user-preferences`)
    - Create selectors for preferences, loading state, error state
    - _Requirements: 13.4, 13.5, 14.3, 14.4_

  - [x] 1.4 Write unit tests for core services and NgRx preferences store
    - Test ThemeEngine applies `data-theme` attribute correctly
    - Test FontScaleService applies `data-scale` attribute and CSS properties
    - Test DisplayPreferenceService fallback to defaults on API failure
    - Test NgRx reducer state transitions and selectors
    - _Requirements: 13.6, 14.6_

- [x] 2. Implement Modal System
  - [x] 2.1 Implement `app-modal` component
    - Create `modals/modal/modal.component.ts` with size input (`sm` | `md` | `lg` | `xl` | `fullscreen`), title, subtitle, icon, iconClass, loading, errors, disableBackdropClose, formGroup inputs
    - Implement size-to-CSS class mapping (sm→max-w-sm, md→max-w-lg, lg→max-w-2xl, xl→max-w-4xl, fullscreen→w-full h-full)
    - Implement content projection (default slot for body, `[modal-footer]` for footer)
    - Implement error summary section above footer rendering all error strings
    - Implement loading overlay on body when `loading=true`
    - Implement focus trap using `@angular/cdk` `CdkTrapFocus`
    - Implement Escape key close, backdrop click close (respecting `disableBackdropClose`)
    - Implement dirty form detection via passed `FormGroup` and confirmation dialog integration
    - Implement fade+scale animation (200ms)
    - Set `role="dialog"`, `aria-modal="true"`, `aria-labelledby` referencing title element ID
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_

  - [x] 2.2 Write property test for modal size mapping
    - **Property 1: Modal size maps to correct CSS class**
    - **Validates: Requirements 2.1**

  - [x] 2.3 Write property test for modal error array rendering
    - **Property 2: Modal error array rendering completeness**
    - **Validates: Requirements 2.5**

- [x] 3. Implement Table System
  - [x] 3.1 Implement `app-data-table` component
    - Create `tables/data-table/data-table.component.ts` with column definitions, data source, pagination, sorting, searching, actions, bulk select, export, saved views, column visibility inputs
    - Implement server-side pagination with configurable page sizes (10, 25, 50, 100) and page change event emission
    - Implement column sorting with ascending/descending toggle and sort change event emission
    - Implement debounced text search (300ms) with search change event emission
    - Implement column visibility picker (minimum 1 column visible)
    - Implement row actions dropdown menu
    - Implement bulk select with select-all checkbox per page
    - Implement CSV/Excel export (max 10,000 rows)
    - Implement saved views (column order, visibility, sort, filters) — max 20 per user
    - Implement loading skeleton state, empty state, and error state with retry button
    - Implement horizontal scroll for viewports < 768px
    - Use native `<table>`, `<thead>`, `<th scope="col">`, `<td>` for accessibility
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 17.2, 18.7_

  - [x] 3.2 Write property test for table sort direction toggle
    - **Property 3: Table sort direction toggle**
    - **Validates: Requirements 3.3**

  - [x] 3.3 Write property test for table pagination event correctness
    - **Property 4: Table pagination event correctness**
    - **Validates: Requirements 3.4**

  - [x] 3.4 Write property test for table column visibility invariant
    - **Property 5: Table column visibility invariant**
    - **Validates: Requirements 3.5**

- [x] 4. Implement Filter System
  - [x] 4.1 Implement `app-filter-bar` component
    - Create `filters/filter-bar/filter-bar.component.ts` with filter definitions array (max 10), saved presets input
    - Implement text search filter with 300ms debounce and max 200 chars
    - Implement dropdown filter (single/multi-select, max 200 options, max 20 selections)
    - Implement date range filter with start/end pickers and end >= start validation
    - Implement status chip filter with multiple selection
    - Implement tag filter for multi-value categorization
    - Implement filter change event emission with all filter values keyed by unique key
    - Implement reset button clearing all filters and emitting reset event
    - Implement active filter count badge and removable chips per active filter
    - Implement saved filter presets (max 10 per user, max 50 char name) with backend persistence
    - Implement collapsible panel for viewports < 768px
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 17.4_

  - [x] 4.2 Write property test for date range validation
    - **Property 6: Date range validation (end ≥ start)**
    - **Validates: Requirements 4.5, 7.10**

  - [x] 4.3 Write property test for filter change event completeness
    - **Property 7: Filter change event completeness**
    - **Validates: Requirements 4.8**

  - [x] 4.4 Write property test for filter reset
    - **Property 8: Filter reset produces empty state**
    - **Validates: Requirements 4.9**

  - [x] 4.5 Write property test for filter active count accuracy
    - **Property 9: Filter active count accuracy**
    - **Validates: Requirements 4.11**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Form System
  - [x] 6.1 Implement base form control infrastructure and shared form control wrapper
    - Create `forms/shared/base-form-control.ts` abstract class implementing `ControlValueAccessor` with unique ID generation, label association via `for`, `aria-describedby` for help/error, `aria-invalid`, `aria-disabled`, required indicator (asterisk), character counter logic
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11_

  - [x] 6.2 Implement text-input, textarea, number-input, email-input, password-input, phone-input form controls
    - Create each component extending base form control
    - Implement touched-only error display logic
    - Implement character counter for maxLength fields
    - Implement single-column stack for viewports < 640px
    - _Requirements: 5.1, 5.2, 5.3, 5.10, 17.5_

  - [x] 6.3 Implement select, multi-select, toggle, checkbox-group, radio-group form controls
    - Create each component extending base form control
    - Implement proper ARIA roles and keyboard interaction
    - _Requirements: 5.1, 5.11_

  - [x] 6.4 Write property test for form control error visibility rule
    - **Property 10: Form control error visibility rule**
    - **Validates: Requirements 5.2, 5.3**

  - [x] 6.5 Write property test for form control accessibility attributes
    - **Property 11: Form control accessibility attributes**
    - **Validates: Requirements 5.7, 5.8, 5.9**

  - [x] 6.6 Write property test for form character counter accuracy
    - **Property 12: Form character counter accuracy**
    - **Validates: Requirements 5.10**

- [x] 7. Implement Currency System
  - [x] 7.1 Implement `app-currency` component (display, edit, readonly modes)
    - Create `currency/currency-display/currency-display.component.ts` implementing ControlValueAccessor
    - Implement GBP default with configurable `currencyCode` and `symbol`
    - Implement thousand separators, configurable decimal precision (0–4), range (-999,999,999.9999 to 999,999,999.9999)
    - Implement negative format: minus prefix or parentheses
    - Implement edit mode character filtering (digits, single decimal, single leading minus only)
    - Implement null emission for empty/non-numeric input on blur
    - Implement format-on-blur with parsed value emission
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 7.2 Write property test for currency input character filtering
    - **Property 13: Currency input character filtering**
    - **Validates: Requirements 6.5**

  - [x] 7.3 Write property test for currency null on non-numeric input
    - **Property 14: Currency null on non-numeric input**
    - **Validates: Requirements 6.6**

  - [x] 7.4 Write property test for currency format round-trip
    - **Property 15: Currency format round-trip**
    - **Validates: Requirements 6.2, 6.3, 6.7**

- [x] 8. Implement Date System
  - [x] 8.1 Implement `app-date`, `app-date-picker`, and `app-date-range` components
    - Create `dates/date-display/date-display.component.ts` with locale input (default en-GB → DD/MM/YYYY), relative date display (within 30 days shows relative)
    - Create `dates/date-picker/date-picker.component.ts` implementing ControlValueAccessor, with calendar popup, min/max date constraints, keyboard navigation, ISO 8601 emission (YYYY-MM-DD)
    - Create `dates/date-range/date-range.component.ts` implementing ControlValueAccessor, emitting `{ start, end }`, validating end >= start
    - Implement invalid date parsing detection and inline error
    - Implement readonly mode
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_

  - [x] 8.2 Write property test for date display format matching locale
    - **Property 16: Date display format matches locale**
    - **Validates: Requirements 7.2**

  - [x] 8.3 Write property test for date relative vs absolute display threshold
    - **Property 17: Date relative vs absolute display threshold**
    - **Validates: Requirements 7.3**

  - [x] 8.4 Write property test for date min/max constraint validation
    - **Property 18: Date min/max constraint validation**
    - **Validates: Requirements 7.5**

  - [x] 8.5 Write property test for date ISO 8601 emission
    - **Property 19: Date emits ISO 8601 format**
    - **Validates: Requirements 7.7**

  - [x] 8.6 Write property test for date invalid input validation
    - **Property 20: Date invalid input validation**
    - **Validates: Requirements 7.9**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Upload System
  - [x] 10.1 Implement `app-file-upload` component
    - Create `uploads/file-upload/file-upload.component.ts` with click-to-browse and drag-and-drop
    - Implement single/multiple file mode (`multiple` input, max 10 files)
    - Implement file preview: 64×64 thumbnail for images (JPEG, PNG, GIF, WebP), file type icon for others
    - Implement per-file progress bar
    - Implement file removal before and after upload
    - Implement validation against `accept` extensions and `maxSize` (default 25MB)
    - Implement per-file error messages for invalid files (retain valid files in batch)
    - Implement retry button for network/server upload failures
    - Emit `filesSelected`, `fileRemoved`, `uploadProgress`, `uploadComplete`, `uploadError`, `retryUpload` events
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [x] 10.2 Write property test for file validation (extension and size)
    - **Property 21: File validation (extension and size)**
    - **Validates: Requirements 8.6, 8.7**

  - [x] 10.3 Write property test for file preview type differentiation
    - **Property 22: File preview type differentiation**
    - **Validates: Requirements 8.3**

- [x] 11. Implement Status Badge System
  - [x] 11.1 Implement `app-status-badge`, `app-priority-badge`, `app-stage-badge`, `app-risk-badge` components
    - Create `badges/base-badge.component.ts` abstract class with `value`, `badgeMap`, `size` (xs/sm/md/lg) inputs
    - Create four badge components extending base with different default badge maps
    - Implement badge map rendering: label, CSS class, optional icon with `aria-hidden="true"`
    - Implement fallback for unknown values: `badge-ghost` style, PascalCase/camelCase → space-separated words
    - Implement empty/null value handling (display nothing)
    - Set `role="status"` and `aria-label` containing category + display label
    - Use DaisyUI semantic colour classes (badge-success, badge-info, badge-warning, badge-error, badge-ghost)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 11.2 Write property test for badge map rendering
    - **Property 23: Badge map rendering**
    - **Validates: Requirements 9.2, 9.4**

  - [x] 11.3 Write property test for badge fallback for unknown values
    - **Property 24: Badge fallback for unknown values**
    - **Validates: Requirements 9.6**

  - [x] 11.4 Write property test for badge ARIA attributes
    - **Property 25: Badge ARIA attributes**
    - **Validates: Requirements 9.7**

- [x] 12. Implement Confirmation System
  - [x] 12.1 Implement `app-confirm-dialog` component and ConfirmDialogService
    - Create `dialogs/confirm-dialog/confirm-dialog.component.ts` with title, message, confirmText, cancelText, severity inputs
    - Create `services/confirm-dialog.service.ts` returning `Observable<boolean>`
    - Implement severity styling: info (blue), warning (amber), danger (red confirm button)
    - Implement resolution mapping: confirm→true, cancel→false, backdrop→false, Escape→false
    - Implement focus trap, Tab cycling, Enter to activate, Escape to cancel
    - Set `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 12.2 Write property test for confirmation dialog resolution mapping
    - **Property 26: Confirmation dialog resolution mapping**
    - **Validates: Requirements 10.4**

- [x] 13. Implement Loading System
  - [x] 13.1 Implement loading components (spinner, overlay, button, skeleton-card, skeleton-table, skeleton-form)
    - Create `loading/loading-spinner/loading-spinner.component.ts` with size input (sm=16px, md=24px, lg=40px)
    - Create `loading/loading-overlay/loading-overlay.component.ts` with semi-transparent backdrop intercepting all events
    - Create `loading/loading-button/loading-button.component.ts` with spinner replacing icon, disabling button, showing loadingText
    - Create `loading/skeleton-card/skeleton-card.component.ts` with count input
    - Create `loading/skeleton-table/skeleton-table.component.ts` with rows and columns inputs
    - Create `loading/skeleton-form/skeleton-form.component.ts` with fields input
    - Implement shimmer animation (1–2s cycle) on skeletons
    - Set `aria-busy="true"` and `aria-label` on all loading containers
    - Remove loading indicators within single change detection cycle on transition to loaded
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 13.2 Write property test for loading component ARIA attributes
    - **Property 27: Loading component ARIA attributes**
    - **Validates: Requirements 11.5**

- [x] 14. Implement Empty State Component
  - [x] 14.1 Implement `app-empty-state` component
    - Create `empty-states/empty-state/empty-state.component.ts` with title (required, max 100 chars), subtitle (max 200 chars), icon (48px, 40% opacity), primaryActionText, secondaryActionText inputs
    - Implement centred layout (vertical + horizontal)
    - Implement primary-styled button and ghost-styled secondary button
    - Emit `primaryAction` and `secondaryAction` events
    - Handle missing subtitle/actions gracefully (no reserved space)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [x] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implement Preferences UI and Preview Lab
  - [x] 16.1 Implement Preferences Page component
    - Create `preferences/preferences-page/preferences-page.component.ts`
    - Implement controls for: theme selection, font scale selection, display density, notification preferences (inApp, email, dailyDigest, weeklyDigest), date format preference
    - Implement live preview section with sample card, button, table row, form field, badge
    - Implement save button with success/error notifications
    - Implement unsaved changes detection with confirmation dialog on navigate-away
    - Implement reset to defaults button (theme: light, font scale: Regular, density: default, all notifications enabled, date format: DD/MM/YYYY)
    - Wire to NgRx preferences store for persistence
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

  - [x] 16.2 Implement Preview Lab (Component Playground) page
    - Create `preferences/preview-lab/preview-lab.component.ts`
    - Implement category sections: typography, buttons, cards, tables, forms, modals, badges, status indicators, charts, timelines, filters, loading states, empty states
    - Implement display mode selector (Small, Regular, Large) and theme selector
    - Apply selections immediately without affecting persisted preferences
    - Implement in-page navigation (anchor links/sidebar) for category jumping
    - Initialise selectors to user's current persisted preferences
    - Implement per-component error indicator on render failure
    - Route: `/preferences/playground` and navigable tab within Preferences Page
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_

  - [x] 16.3 Write property test for font scale proportional CSS properties
    - **Property 28: Font scale proportional CSS properties**
    - **Validates: Requirements 13.1, 13.7**

- [x] 17. Integration, routing, migration, and governance documentation
  - [x] 17.1 Wire design system into application routing and shared module
    - Add route for Preferences Page (accessible from profile dropdown)
    - Add route for Preview Lab at `/preferences/playground`
    - Update `shared/components/index.ts` compatibility layer with re-exports from new design-system locations
    - Register NgRx preferences feature state in app configuration
    - Load user preferences on app bootstrap via effect
    - _Requirements: 1.5, 15.1, 16.4, 13.6, 14.5_

  - [x] 17.2 Implement responsive and accessibility cross-cutting concerns
    - Implement modal fullscreen for viewports < 640px
    - Implement minimum 44×44px touch targets for viewports < 768px
    - Implement skip navigation link as first focusable element
    - Implement `prefers-reduced-motion` support (0ms or max 100ms transitions)
    - Verify WCAG 2.1 AA colour contrast in Light and Dark themes
    - _Requirements: 17.3, 17.6, 18.1, 18.4, 18.8_

  - [x] 17.3 Create governance documentation and component catalog
    - Create `docs/frontend/design-system.md` describing architecture, tokens, theming
    - Create `docs/frontend/component-library.md` with per-component documentation (purpose, inputs, outputs, usage example, accessibility notes)
    - Create `docs/frontend/component-governance.md` with governance rules
    - Create `docs/frontend/component-catalog.md` listing all components with category, purpose, file path
    - Create `.kiro/steering/component-library-rules.md`, `.kiro/steering/component-review-checklist.md`, `.kiro/steering/accessibility-and-display-preferences.md`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

- [x] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using the `fast-check` library
- Unit tests validate specific examples and edge cases using Jasmine/Karma
- All components use OnPush change detection and Angular signals where appropriate
- All form controls implement ControlValueAccessor for Reactive Forms integration
- DaisyUI theme tokens are used exclusively — no hardcoded colours
- The compatibility layer in `shared/components/index.ts` ensures zero breaking changes during migration

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4", "6.1"] },
    { "id": 3, "tasks": ["2.1", "11.1", "13.1", "14.1"] },
    { "id": 4, "tasks": ["2.2", "2.3", "11.2", "11.3", "11.4", "13.2", "12.1"] },
    { "id": 5, "tasks": ["12.2", "3.1", "4.1", "6.2", "6.3"] },
    { "id": 6, "tasks": ["3.2", "3.3", "3.4", "4.2", "4.3", "4.4", "4.5", "6.4", "6.5", "6.6"] },
    { "id": 7, "tasks": ["7.1", "8.1", "10.1"] },
    { "id": 8, "tasks": ["7.2", "7.3", "7.4", "8.2", "8.3", "8.4", "8.5", "8.6", "10.2", "10.3"] },
    { "id": 9, "tasks": ["16.1", "16.2"] },
    { "id": 10, "tasks": ["16.3", "17.1", "17.2"] },
    { "id": 11, "tasks": ["17.3"] }
  ]
}
```
