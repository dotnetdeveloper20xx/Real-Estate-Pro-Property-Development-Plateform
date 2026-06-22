# Requirements Document

## Introduction

This document defines the requirements for an Enterprise Design System and Shared Component Library for BuildEstate Pro — a real estate development platform built with Angular 20, Tailwind CSS, and DaisyUI. The design system establishes a unified, accessible, responsive, and themeable component foundation that all 14 platform modules consume. It replaces ad-hoc component implementations with governed, configurable building blocks that enforce consistency across the entire application. The system also introduces user-controlled display preferences (font scale, density, theme) and a component playground for previewing configurations.

## Glossary

- **Design_System**: The collection of design tokens, patterns, documentation, and governance rules that define the visual and interaction language of BuildEstate Pro.
- **Component_Library**: The set of Angular 20 standalone components located in `shared/design-system/` that implement the Design_System specifications.
- **Display_Preference_Service**: An Angular service that manages user-selected display preferences (theme, font scale, density) and persists them to the backend per user.
- **Theme_Engine**: The subsystem responsible for applying light, dark, and future custom DaisyUI themes to the application at runtime via `data-theme` attribute on the document root.
- **Font_Scale_System**: A CSS custom property-based system that adjusts base font sizes, spacing, and density across the application based on user preference (Small, Regular, Large).
- **Modal_System**: A single configurable modal component (`app-modal`) that replaces all feature-specific modals with a unified pattern supporting multiple sizes, loading states, dirty form warnings, and keyboard navigation.
- **Table_System**: A configurable data table component (`app-data-table`) that provides search, filters, column sorting, pagination, column visibility, export, saved views, row actions, bulk actions, and loading/empty/error states.
- **Filter_System**: A filter bar component (`app-filter-bar`) that provides text search, dropdown filters, date range filters, status chips, tag filters, reset, and saved filter presets.
- **Form_System**: A suite of form control components that wrap Angular reactive form controls with consistent validation, labelling, help text, and accessibility attributes.
- **Currency_Component**: A display and input component for monetary values with GBP default, configurable symbol, decimal precision, negative formatting, and thousand separators.
- **Date_System**: A suite of date components (display, picker, range picker) with UK date format default, relative date display, configurable locale, and calendar popup.
- **Upload_System**: File upload components supporting drag-and-drop, single/multiple files, preview, progress, validation, and error handling.
- **Status_Badge_System**: A family of badge components (status, priority, stage, risk) with configurable colour maps, icons, and sizes.
- **Confirmation_System**: A dialog component (`app-confirm-dialog`) that replaces all browser `confirm()`, `prompt()`, and `alert()` calls with styled, accessible dialogs.
- **Loading_System**: A suite of loading state components (spinner, overlay, button, skeleton-card, skeleton-table, skeleton-form) for all async operations.
- **Empty_State_Component**: A configurable component displayed when no data is available, providing title, subtitle, icon, and primary/secondary action buttons.
- **Preferences_Page**: A dedicated user profile page for configuring theme, font size, display density, notification preferences, and date format with a live preview section.
- **Preview_Lab**: A playground page displaying sample components (cards, buttons, tables, forms, modals, badges, typography, charts, timeline, filters) rendered with current display preferences for testing and validation.
- **Component_Governance**: The process requiring developers to search the Component_Library before creating new components, prefer extension over duplication, and add configuration over creating variants.
- **WCAG**: Web Content Accessibility Guidelines — the international standard for web accessibility.
- **ARIA**: Accessible Rich Internet Applications — a set of HTML attributes that define ways to make web content more accessible.

## Requirements

### Requirement 1: Design System Directory Structure and Documentation

**User Story:** As a developer, I want a well-organized design system directory structure with comprehensive documentation, so that I can discover, understand, and correctly use shared components.

#### Acceptance Criteria

1. THE Component_Library SHALL be located in `client-app/src/app/shared/design-system/` with subdirectories organized by component category (buttons, cards, tables, forms, modals, drawers, dialogs, filters, search, toolbars, inputs, uploads, notifications, charts, steppers, timelines, badges, status, empty-states, loading, dashboard, layout, profile, preferences).
2. THE Design_System SHALL include documentation files at `docs/frontend/design-system.md`, `docs/frontend/component-library.md`, and `docs/frontend/component-governance.md`.
3. THE Design_System SHALL include steering files at `.kiro/steering/component-library-rules.md`, `.kiro/steering/component-review-checklist.md`, and `.kiro/steering/accessibility-and-display-preferences.md`.
4. WHEN a new component is added to the Component_Library, THE documentation SHALL be updated to include the component purpose (1–3 sentences describing the business problem it solves), inputs (all @Input() properties with name, type, default value, and description), outputs (all @Output() events with name, payload type, and trigger condition), at least 1 usage example showing the component in a template with representative data, and accessibility notes listing keyboard interactions, ARIA attributes used, and minimum WCAG 2.1 AA compliance details.
5. THE Design_System SHALL include an index file at `client-app/src/app/shared/design-system/index.ts` that exports all public components, and a catalog file at `docs/frontend/component-catalog.md` listing every component with its category, purpose summary (1 sentence), and relative file path within the design-system directory.
6. WHEN a new component is added to the Component_Library without a corresponding entry in `docs/frontend/component-catalog.md`, THE Design_System SHALL treat the component as incomplete and not eligible for use in feature modules until the catalog entry and component documentation are present.

### Requirement 2: Modal System

**User Story:** As a developer, I want a single configurable modal component that handles all modal use cases, so that modal behaviour is consistent across all modules.

#### Acceptance Criteria

1. THE Modal_System SHALL provide a single `app-modal` component with a configurable `size` input accepting values: `sm` (max-w-sm), `md` (max-w-lg), `lg` (max-w-2xl), `xl` (max-w-4xl), and `fullscreen` (w-full h-full), defaulting to `md` when no size is specified.
2. THE Modal_System SHALL accept inputs for `title` (maximum 100 characters, truncated with ellipsis if exceeded), `subtitle` (maximum 200 characters, truncated with ellipsis if exceeded), `icon` (Material Symbols icon name string), and `iconClass` (CSS class string for icon colour).
3. THE Modal_System SHALL project body content via default Angular content projection and footer content via an attribute selector `[modal-footer]`.
4. WHEN the `loading` input is set to true, THE Modal_System SHALL display a loading overlay covering the body content area that prevents user interaction with body elements beneath it.
5. WHEN the `errors` input array contains one or more string items, THE Modal_System SHALL display an error summary section above the footer listing each error string as a visible line item.
6. WHILE a form within the modal has unsaved changes (detected via Angular reactive form dirty state), WHEN the user attempts to close the modal by any close mechanism (close button, Escape key, or backdrop click), THE Modal_System SHALL display a dirty form warning confirmation dialog before closing.
7. IF the user confirms the dirty form warning, THEN THE Modal_System SHALL close the modal and discard form state. IF the user cancels the dirty form warning, THEN THE Modal_System SHALL keep the modal open with form state preserved.
8. WHEN the user presses the Escape key and no dirty form warning is active, THE Modal_System SHALL close the modal and emit a `closed` event.
9. WHEN the user clicks the backdrop and the `disableBackdropClose` input is not set to true, THE Modal_System SHALL close the modal and emit a `closed` event.
10. WHEN the modal opens, THE Modal_System SHALL trap keyboard focus within the modal (Tab and Shift+Tab cycle within modal elements only), set initial focus to the first focusable element inside the modal body, and return focus to the element that triggered the modal on close.
11. THE Modal_System SHALL set `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` referencing the title element's id on the modal container.
12. WHEN the modal opens or closes, THE Modal_System SHALL animate the transition with a fade and scale effect completing within 200 milliseconds.

### Requirement 3: Table System

**User Story:** As a developer, I want a comprehensive data table component that handles all listing patterns, so that data display is consistent and feature-rich across all modules.

#### Acceptance Criteria

1. THE Table_System SHALL provide an `app-data-table` component that accepts column definitions (key, label, type, sortable flag, visibility default), a data source, and configuration inputs (page size options, action definitions, export formats, and empty state content).
2. THE Table_System SHALL support text search across configurable columns with debounced input (300ms delay), triggering a search event after the user stops typing, with a minimum query length of 1 character.
3. THE Table_System SHALL support column-level sorting with an ascending or descending arrow icon displayed on the currently sorted column header, and emit a sort change event containing the column key and direction.
4. THE Table_System SHALL support server-side pagination with configurable page sizes (10, 25, 50, 100) and emit page change events containing the requested page number and page size.
5. THE Table_System SHALL support a column visibility picker allowing users to show or hide columns, with a minimum of 1 column remaining visible at all times.
6. THE Table_System SHALL support CSV and Excel export of all rows matching the current search and filter criteria, limited to a maximum of 10,000 rows per export operation.
7. THE Table_System SHALL support saved views (column order, visibility, sort state, and active filters) stored per user, up to a maximum of 20 saved views per user.
8. THE Table_System SHALL support row-level actions via a configurable actions column with a dropdown menu, where each action is defined by a label, icon, and emitted event identifier.
9. THE Table_System SHALL support bulk row selection with a select-all checkbox that selects all rows on the current page, and emit bulk action events containing the array of selected row identifiers.
10. THE Table_System SHALL display a loading skeleton state with placeholder rows when data is being fetched.
11. IF no data matches the current search and filter criteria, THEN THE Table_System SHALL display a configurable empty state containing an icon, a primary message, and a secondary guidance message.
12. IF an error occurs during data loading, THEN THE Table_System SHALL display an error state with an error message indicating the failure reason and a retry button that re-emits the last data fetch request.
13. WHILE the viewport width is below 768px, THE Table_System SHALL enable horizontal scrolling on the table container to ensure all columns remain accessible without layout overflow.

### Requirement 4: Filter System

**User Story:** As a developer, I want a reusable filter bar component that standardizes filtering patterns, so that search and filter interactions are consistent across all listing pages.

#### Acceptance Criteria

1. THE Filter_System SHALL provide an `app-filter-bar` component that accepts a filter configuration array of up to 10 filter control definitions, where each definition specifies a filter type (text, dropdown, date-range, status-chip, or tag), a unique key, a display label, and type-specific options (e.g., selectable values for dropdowns, placeholder text for search).
2. THE Filter_System SHALL support a text search input that accepts up to 200 characters and emits the current search value after a 300ms debounce period following the last keystroke.
3. THE Filter_System SHALL support dropdown select filters with single-select and multi-select modes, displaying up to 200 options per dropdown and allowing up to 20 simultaneous selections in multi-select mode.
4. THE Filter_System SHALL support date range filters with start and end date pickers.
5. IF the user selects a start date that is after the end date, THEN THE Filter_System SHALL display an inline validation message indicating the invalid range and SHALL NOT emit the filter change event until the range is corrected.
6. THE Filter_System SHALL support status chip filters with multiple selection.
7. THE Filter_System SHALL support tag-based filters for multi-value categorization.
8. WHEN any filter value changes (after debounce for text search, immediately for other filter types), THE Filter_System SHALL emit a single filter-change event containing an object with the current value of every configured filter keyed by its unique key.
9. WHEN the user clicks a reset button, THE Filter_System SHALL clear all active filters to their default empty state, emit a reset event, and update the active filter count to zero.
10. THE Filter_System SHALL support up to 10 saved filter presets per user, each with a name of up to 50 characters, persisted to the backend API so presets are available across sessions and devices.
11. THE Filter_System SHALL display the count of currently active filters as a numeric badge and render a removable chip for each individual active filter value, where clicking a chip clears that specific filter and emits an updated filter-change event.

### Requirement 5: Form System

**User Story:** As a developer, I want a complete suite of form control wrapper components, so that form fields have consistent styling, validation display, accessibility labels, and help text across all modules.

#### Acceptance Criteria

1. THE Form_System SHALL provide wrapper components for: text-input, textarea, number-input, currency-input, phone-input, email-input, password-input, select, multi-select, date-picker, date-range-picker, toggle, checkbox-group, radio-group, rich-text-editor, tag-selector, address-picker, postcode-search, file-upload, image-upload, and document-upload.
2. WHEN a form control has a validation error and the field has been touched, THE Form_System SHALL display an inline error message immediately below the field, visible without scrolling the field itself out of view.
3. IF a form control has a validation error but the field has not been touched, THEN THE Form_System SHALL NOT display the inline error message for that field.
4. THE Form_System SHALL accept `label`, `placeholder`, `helpText`, `required`, and `disabled` inputs on all form controls.
5. WHEN the `required` input is set to true, THE Form_System SHALL display a visible required indicator (asterisk character) adjacent to the field label.
6. WHEN the `disabled` input is set to true, THE Form_System SHALL prevent user interaction with the control, visually indicate the disabled state through reduced opacity, and set the `aria-disabled="true"` attribute on the form control element.
7. THE Form_System SHALL generate unique IDs and associate `<label>` elements with their form controls via `for` attribute.
8. THE Form_System SHALL set `aria-describedby` on form controls referencing their help text and error message elements.
9. THE Form_System SHALL set `aria-invalid="true"` on form controls that have validation errors.
10. WHEN a `maxLength` input is provided on a text-input or textarea, THE Form_System SHALL display a character counter in the format "{currentLength}/{maxLength}" that updates on each input event.
11. THE Form_System SHALL integrate with Angular Reactive Forms via `ControlValueAccessor` interface on all custom form controls.

### Requirement 6: Currency System

**User Story:** As a user, I want currency values displayed consistently in GBP format with proper formatting, so that financial data is clear and unambiguous.

#### Acceptance Criteria

1. THE Currency_Component SHALL display monetary values with GBP (£) symbol by default, with a configurable `currencyCode` input for other currencies.
2. THE Currency_Component SHALL format values with thousand separators (comma) and configurable decimal precision (default 2 decimal places, configurable from 0 to 4), supporting a numeric range of -999,999,999.9999 to 999,999,999.9999.
3. THE Currency_Component SHALL format negative values with a minus sign prefix (e.g., -£1,234.56) with a configurable `negativeFormat` input supporting parentheses alternative (e.g., (£1,234.56)).
4. THE Currency_Component SHALL support display mode (read-only formatted text), edit mode (input field that formats the value to the configured decimal precision with thousand separators on blur), and readonly mode (disabled input with formatted value).
5. WHILE the Currency_Component is in edit mode, THE Currency_Component SHALL accept only digits (0-9), a single decimal point, and a single leading minus sign as input characters, and SHALL discard any other characters.
6. IF the user leaves the edit mode input empty or with only non-numeric characters, THEN THE Currency_Component SHALL treat the value as null and emit a null value change event to the parent form.
7. WHEN the user completes editing (on blur), THE Currency_Component SHALL emit the parsed numeric value to the parent form and display the formatted currency string in the input field.

### Requirement 7: Date System

**User Story:** As a user, I want dates displayed and selected using UK date format with relative date support, so that date information is immediately understandable.

#### Acceptance Criteria

1. THE Date_System SHALL provide `app-date` (display), `app-date-picker` (single date input), and `app-date-range` (start/end date range) components.
2. THE Date_System SHALL use UK date format (DD/MM/YYYY) as default with a configurable `locale` input that changes the display format accordingly.
3. WHEN the `relative` input is set to true and the date is within 30 days of the current date, THE Date_System SHALL display a relative label (e.g., "2 days ago", "in 3 weeks"); otherwise it SHALL display the formatted absolute date.
4. THE Date_System SHALL provide a calendar popup for date selection with month/year navigation, supporting keyboard interaction (arrow keys to navigate days, Enter to select, Escape to close the popup).
5. THE Date_System SHALL support minimum and maximum date constraints via `minDate` and `maxDate` inputs, and IF the user selects or enters a date outside the allowed range, THEN THE Date_System SHALL display an inline validation error indicating the permitted date range and prevent emission of the invalid value.
6. THE Date_System SHALL support readonly mode that displays formatted date text without interaction.
7. THE Date_System SHALL emit selected date values as ISO 8601 strings (YYYY-MM-DD format).
8. THE `app-date-picker` and `app-date-range` components SHALL implement the Angular `ControlValueAccessor` interface to integrate with Reactive Forms, supporting `formControlName` binding, validation states, and disabled state.
9. IF the user enters a value that cannot be parsed as a valid date in the `app-date-picker`, THEN THE Date_System SHALL mark the control as invalid and display an inline validation error indicating the expected format.
10. IF the end date in `app-date-range` is earlier than the start date, THEN THE Date_System SHALL mark the control as invalid and display an inline validation error indicating that the end date must be equal to or later than the start date.

### Requirement 8: Upload System

**User Story:** As a user, I want a consistent file upload experience with drag-and-drop, progress tracking, and validation, so that file uploads are reliable and user-friendly.

#### Acceptance Criteria

1. THE Upload_System SHALL provide an `app-file-upload` component supporting both click-to-browse and drag-and-drop file selection.
2. THE Upload_System SHALL support single file and multiple file upload modes via a `multiple` input, allowing a maximum of 10 files per upload batch in multiple mode.
3. THE Upload_System SHALL display file preview thumbnails (64×64 pixels) for image files (JPEG, PNG, GIF, WebP) and file type icons for non-image files.
4. THE Upload_System SHALL display upload progress as a percentage progress bar per file.
5. THE Upload_System SHALL allow users to remove selected files from the list before upload starts and after upload completes.
6. THE Upload_System SHALL validate files against configurable allowed extensions (`accept` input) and maximum file size (`maxSize` input in megabytes, default 25 MB if not configured).
7. IF one or more files in a multi-file selection fail validation, THEN THE Upload_System SHALL reject only the invalid files, retain the valid files in the selection list, and display a per-file error message indicating the specific validation failure reason for each rejected file.
8. IF a file upload fails due to a network or server error, THEN THE Upload_System SHALL display an error state on the failed file with a retry button that re-attempts the upload for that file only, without affecting other files in the batch.

### Requirement 9: Status Badge System

**User Story:** As a user, I want status, priority, stage, and risk information displayed as visually distinct badges, so that I can quickly scan and understand item states.

#### Acceptance Criteria

1. THE Status_Badge_System SHALL provide `app-status-badge`, `app-priority-badge`, `app-stage-badge`, and `app-risk-badge` components, each implemented as a standalone Angular presentational component with OnPush change detection.
2. THE Status_Badge_System SHALL accept a required `value` input (string) and an optional `badgeMap` input that maps values to objects containing a CSS colour class, a display label (maximum 30 characters), and an optional Material Symbols icon name.
3. THE Status_Badge_System SHALL support configurable sizes via a `size` input accepting values: xs, sm, md, lg, with md as the default when no size is specified.
4. WHEN an icon name is specified in the badge map entry for the current value, THE Status_Badge_System SHALL display the icon as a leading Material Symbols inline element before the label text, with `aria-hidden="true"` on the icon element.
5. THE Status_Badge_System SHALL use semantic colours consistent with the Design_System colour governance: green (badge-success) for success/active states, blue (badge-info) for informational states, amber (badge-warning) for warning/pending states, red (badge-error) for critical/error states, and grey (badge-ghost) for neutral/inactive states.
6. IF the `value` input is null, empty, or does not match any key in the provided `badgeMap`, THEN THE Status_Badge_System SHALL render the badge with badge-ghost styling and display the raw value formatted from PascalCase/camelCase to space-separated words, or display nothing if the value is null or empty.
7. THE Status_Badge_System SHALL render each badge with `role="status"` and an `aria-label` attribute containing the badge category and display label (e.g., "Status: Under Review") to support assistive technologies.

### Requirement 10: Confirmation System

**User Story:** As a user, I want confirmation dialogs that are styled consistently and accessible, so that destructive or important actions require explicit confirmation without relying on browser-native dialogs.

#### Acceptance Criteria

1. THE Confirmation_System SHALL provide an `app-confirm-dialog` component that replaces all usage of browser `confirm()`, `prompt()`, and `alert()`, rendering as a modal overlay with a backdrop that prevents interaction with underlying page content.
2. THE Confirmation_System SHALL accept inputs for title (max 100 characters), message (max 500 characters), confirm button text, cancel button text, and severity level (info, warning, danger), applying default values of "Confirm" for confirm button text, "Cancel" for cancel button text, and "info" for severity level when inputs are not provided.
3. THE Confirmation_System SHALL apply visual styling based on severity: info uses blue accent, warning uses amber accent, danger uses red accent with the confirm button rendered in the red accent colour to visually distinguish it from non-destructive actions.
4. THE Confirmation_System SHALL return a Promise or Observable that resolves with the user's decision (confirmed or cancelled), resolving as cancelled when the user clicks the backdrop overlay or presses Escape.
5. THE Confirmation_System SHALL trap focus within the dialog, support keyboard navigation (Tab to cycle between focusable elements, Enter to activate the focused button, Escape to cancel), and apply ARIA role="dialog", aria-modal="true", aria-labelledby referencing the title, and aria-describedby referencing the message for screen reader accessibility.

### Requirement 11: Loading System

**User Story:** As a user, I want clear loading indicators for all asynchronous operations, so that I know the application is processing and content will appear.

#### Acceptance Criteria

1. THE Loading_System SHALL provide `app-loading-spinner` (inline spinner), `app-loading-overlay` (full-area overlay with spinner), `app-loading-button` (button with integrated spinner state), `app-skeleton-card` (card-shaped placeholder), `app-skeleton-table` (table row placeholders), and `app-skeleton-form` (form field placeholders) components.
2. THE Loading_System SHALL accept a `size` input on spinner components supporting `sm` (16px diameter), `md` (24px diameter), and `lg` (40px diameter) variants, defaulting to `md` when no size is specified.
3. WHEN `app-loading-button` has its `loading` input set to true, THE component SHALL display a spinner replacing the button icon or preceding the label, disable the button to prevent duplicate submissions, and display the value of the optional `loadingText` input (maximum 30 characters) in place of the default button label.
4. THE Loading_System skeleton components SHALL use a shimmer animation with a cycle duration between 1 and 2 seconds to indicate loading state, repeating continuously until the `loading` input is set to false.
5. THE Loading_System SHALL set `aria-busy="true"` on the container element of every loading component while in the loading state, and provide an `aria-label` that describes the operation in progress (e.g., "Loading table data", "Saving changes"), defaulting to "Loading" when no custom label is provided.
6. WHEN the `loading` input transitions from true to false, THE Loading_System component SHALL remove the loading indicator and render the content area within a single change detection cycle, removing the `aria-busy` attribute simultaneously.
7. WHILE `app-loading-overlay` is in the loading state, THE component SHALL display a semi-transparent backdrop that intercepts all pointer and keyboard events on the covered area, preventing user interaction with the content beneath the overlay.

### Requirement 12: Empty State Component

**User Story:** As a user, I want informative empty states when no data is available, so that I understand why content is missing and what action to take.

#### Acceptance Criteria

1. THE Empty_State_Component SHALL provide an `app-empty-state` component accepting a required `title` input (maximum 100 characters), an optional `subtitle` input (maximum 200 characters), an optional `icon` input (Material Symbols icon name), an optional primary action input (button text + click event output), and an optional secondary action input (button text + click event output).
2. THE Empty_State_Component SHALL centre content vertically and horizontally within its container.
3. THE Empty_State_Component SHALL display the icon at 48px size with reduced-opacity styling (40% opacity relative to base content colour) so that it appears visually subordinate to the title text.
4. WHEN a primary action is configured, THE Empty_State_Component SHALL render a primary-styled button that emits a click event to the parent component.
5. WHEN a secondary action is configured, THE Empty_State_Component SHALL render a ghost-styled button positioned below the primary action button.
6. IF neither a primary action nor a secondary action is configured, THEN THE Empty_State_Component SHALL render only the icon, title, and subtitle without any action buttons.
7. WHEN a primary action button or secondary action button is clicked, THE Empty_State_Component SHALL emit the corresponding output event to the parent component within the same change detection cycle.
8. IF a subtitle is not provided, THEN THE Empty_State_Component SHALL render the layout with only the icon and title, maintaining vertical and horizontal centring without reserving space for the subtitle.

### Requirement 13: Display Preferences — Font Scale System

**User Story:** As a user, I want to choose between Small, Regular, and Large display modes, so that the interface adapts to my visual comfort and accessibility needs.

#### Acceptance Criteria

1. THE Font_Scale_System SHALL support three display modes: Small (scale factor 0.85x relative to Regular), Regular (1.0x baseline), and Large (scale factor 1.2x relative to Regular), where the scale factor applies to base font size, line height, spacing, padding, and table row heights.
2. THE Font_Scale_System SHALL implement scaling via CSS custom properties applied to the document root element.
3. WHEN the user selects a display mode, THE Font_Scale_System SHALL apply the change to all visible UI elements within 300 milliseconds without triggering a page reload.
4. THE Display_Preference_Service SHALL persist the selected display mode per user to the backend API.
5. IF the Display_Preference_Service fails to persist the selected display mode, THEN THE Font_Scale_System SHALL display an error notification indicating the preference was not saved while retaining the locally applied display mode for the current session.
6. WHEN the application loads, THE Display_Preference_Service SHALL retrieve and apply the user's stored display mode preference, defaulting to Regular mode if no stored preference exists or if retrieval fails.
7. THE Font_Scale_System SHALL scale typography, spacing, padding, and table row heights using the defined scale factor for the active mode, applied proportionally to the Regular mode baseline values.

### Requirement 14: Display Preferences — Theme System

**User Story:** As a user, I want to switch between Light, Dark, and future custom themes, so that I can work in a visual environment that suits my preference or conditions.

#### Acceptance Criteria

1. THE Theme_Engine SHALL support Light, Dark, and up to 10 custom themes applied via DaisyUI `data-theme` attribute on the document root (`<html>`) element.
2. WHEN the user selects a theme, THE Theme_Engine SHALL apply the selected `data-theme` value to the document root element within 100ms without triggering a page reload.
3. THE Display_Preference_Service SHALL persist the selected theme per user to the backend API after each theme change.
4. IF persisting the theme preference to the backend fails, THEN THE Display_Preference_Service SHALL display an error notification indicating the preference was not saved while retaining the locally applied theme.
5. WHEN the application loads, THE Display_Preference_Service SHALL retrieve and apply the user's stored theme preference within 2 seconds of application bootstrap.
6. IF the stored theme preference is unavailable (first login, API failure, or network timeout), THEN THE Theme_Engine SHALL apply Light as the default theme.
7. THE Theme_Engine SHALL ensure all Design_System components use only DaisyUI theme-aware CSS classes and CSS custom properties, with no hardcoded colour values, so that components adapt automatically when the active theme changes.

### Requirement 15: User Preferences Page

**User Story:** As a user, I want a dedicated preferences page where I can configure theme, font size, display density, notification preferences, and date format with live preview, so that I can customize the application to my needs.

#### Acceptance Criteria

1. THE Preferences_Page SHALL be accessible from the user profile dropdown in the top navigation bar.
2. THE Preferences_Page SHALL provide controls for: theme selection (light, dark, corporate, business), font scale selection (75%, 100%, 125%, 150%), display density selection (compact, default, comfortable), notification preferences (in-app, email, daily digest, weekly digest), and date format preference (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD).
3. WHEN the user changes any preference control value, THE Preferences_Page SHALL apply the change to the preview section within 300 milliseconds without requiring a page reload.
4. THE Preferences_Page SHALL include a preview section showing sample UI elements (card, button, table row, form field, badge) rendered with current preference selections.
5. WHEN the user clicks the save button, THE Preferences_Page SHALL persist all current preference values to the backend API and display a success notification upon completion.
6. IF saving preferences fails, THEN THE Preferences_Page SHALL display an error notification indicating the save was unsuccessful and revert all preview controls to the last successfully saved values.
7. IF the user attempts to navigate away from the Preferences_Page with unsaved changes, THEN THE Preferences_Page SHALL display a confirmation dialog warning that unsaved changes will be lost and offering options to stay or discard changes.
8. WHEN the user clicks the reset to defaults button, THE Preferences_Page SHALL revert all preference controls to factory defaults (theme: light, font scale: 100%, density: default, all notifications enabled, date format: DD/MM/YYYY) and update the preview section accordingly without persisting until the user clicks save.

### Requirement 16: Preview Lab / Display Preferences Playground

**User Story:** As a developer or user, I want a playground page that showcases all design system components rendered with current display preferences, so that I can validate visual consistency and test configurations.

#### Acceptance Criteria

1. THE Preview_Lab SHALL display sample components organized into labelled category sections: typography, buttons, cards, tables, forms, modals, badges, status indicators, charts, timelines, filters, loading states, and empty states, with each category containing at least one representative sample component.
2. THE Preview_Lab SHALL provide a display mode selector (Small, Regular, Large) and a theme selector (Light, Dark, and any configured custom themes matching those supported by the Theme_Engine) that apply the selected configuration immediately without page reload.
3. WHEN the user changes the display mode or theme via the playground selectors, THE Preview_Lab SHALL re-render all sample components using the newly selected preferences without affecting the user's persisted global display preferences.
4. THE Preview_Lab SHALL be accessible both via a dedicated route at `/preferences/playground` and as a navigable tab within the Preferences_Page.
5. THE Preview_Lab SHALL provide an in-page navigation mechanism (anchor links or sidebar) allowing the user to jump directly to any category section.
6. WHEN the Preview_Lab page loads, THE Preview_Lab SHALL initialise the playground selectors to match the user's currently persisted display preferences as the default state.
7. IF a sample component fails to render, THEN THE Preview_Lab SHALL display an error indicator within that component's section identifying the component name that failed, without preventing other category sections from rendering.

### Requirement 17: Responsiveness

**User Story:** As a user, I want the application to work correctly on Desktop, Laptop, Tablet, and Mobile viewports, so that I can access the platform from any device without broken layouts.

#### Acceptance Criteria

1. THE Component_Library SHALL render without horizontal overflow, content clipping, or overlapping elements at Desktop (1440px+), Laptop (1024px–1439px), Tablet (768px–1023px), and Mobile (320px–767px) viewport widths.
2. WHILE the viewport width is narrower than 768px, THE Table_System SHALL switch to a horizontally scrollable layout where the table scrolls independently within its container without causing page-level horizontal overflow.
3. WHILE the viewport width is narrower than 640px, THE Modal_System SHALL display at 100% viewport width and 100% viewport height regardless of configured size.
4. WHILE the viewport width is narrower than 768px, THE Filter_System SHALL collapse filter controls into an expandable panel that is collapsed by default and toggled via a visible trigger button.
5. WHILE the viewport width is narrower than 640px, THE Form_System SHALL stack form fields vertically in a single-column layout.
6. WHILE the viewport width is narrower than 768px, THE Component_Library SHALL render all interactive elements (buttons, links, inputs) with a minimum touch target size of 44×44 CSS pixels.
7. WHILE the viewport width is narrower than 768px, THE Navigation_System SHALL collapse the primary navigation into a toggleable menu (hamburger pattern) that does not obscure page content when closed.

### Requirement 18: Accessibility

**User Story:** As a user with accessibility needs, I want the application to support keyboard navigation, screen readers, high contrast, large fonts, and reduced motion, so that I can use the platform effectively regardless of ability.

#### Acceptance Criteria

1. THE Component_Library SHALL ensure all interactive elements are reachable via keyboard Tab navigation in a logical reading order (left-to-right, top-to-bottom) with focus indicators that have a minimum thickness of 2px and a contrast ratio of at least 3:1 against adjacent colours.
2. THE Component_Library SHALL provide ARIA labels, roles, and states on all interactive and dynamic content following WAI-ARIA Authoring Practices (e.g., `role="button"` on non-button clickable elements, `aria-expanded` on collapsible triggers, `aria-selected` on selectable items).
3. THE Component_Library SHALL meet WCAG 2.1 AA colour contrast requirements (4.5:1 for normal text, 3:1 for large text and non-text elements) in all supported themes.
4. IF the user has indicated a preference for reduced motion via the `prefers-reduced-motion: reduce` media query, THEN THE Component_Library SHALL replace all CSS transitions and animations with instant state changes (duration of 0ms) or reduce them to a maximum duration of 100ms with no transform-based movement.
5. THE Component_Library SHALL ensure all form controls have associated visible labels and accessible names computed via `<label>` element, `aria-label`, or `aria-labelledby` attribute.
6. WHEN the Modal_System or Confirmation_System is opened, THE system SHALL move keyboard focus to the first focusable element within the dialog and announce the dialog title to screen readers via `aria-labelledby` association.
7. THE Table_System SHALL use native `<table>`, `<thead>`, `<th>`, and `<td>` elements (or equivalent ARIA grid roles) with `scope="col"` on column headers so that screen readers can announce row/column associations during navigation.
8. THE Component_Library SHALL provide a skip navigation link as the first focusable element on each page that moves focus to the main content area, bypassing repeated navigation elements.

### Requirement 19: Component Governance

**User Story:** As a development team, we want governance rules that prevent component duplication and enforce library-first development, so that the component library remains the single source of truth.

#### Acceptance Criteria

1. WHEN a developer proposes creating a new Angular component, THE Component_Governance process SHALL require documented evidence that the Component_Library was searched and no existing component satisfies the required functionality, before the new component is created.
2. WHEN an existing component satisfies 50% or more of the required functionality, THE Component_Governance process SHALL require extending the existing component with new configuration inputs rather than creating a duplicate, unless the extension would require modifying more than 3 existing inputs or breaking existing consumers.
3. WHEN a new component is required and the component provides generic functionality not tied to a single domain entity, THE Component_Governance process SHALL require placing the component in the Component_Library within `shared/design-system/`.
4. THE Component_Governance documentation SHALL define a review checklist that verifies all of the following before a component pull request is approved: library search evidence provided, no component with overlapping functionality (same primary input/output contract) exists in the Component_Library, WCAG 2.1 AA accessibility compliance met, component renders correctly at all four supported breakpoints (Desktop 1440px+, Laptop 1024px–1439px, Tablet 768px–1023px, Mobile 320px–767px), component renders correctly in all supported DaisyUI themes (Light and Dark), and component documentation (purpose, inputs, outputs, usage example) is added to `docs/frontend/component-library.md`.
5. IF a pull request introduces a new component that duplicates the input/output contract of an existing Component_Library component, THEN THE Component_Governance process SHALL require the pull request to be rejected with a reference to the existing component until the author demonstrates why extension is not feasible.
6. WHEN a component initially created within a feature module is consumed by a second module, THE Component_Governance process SHALL require the component to be migrated to the Component_Library within the same pull request that adds the second consumption.
