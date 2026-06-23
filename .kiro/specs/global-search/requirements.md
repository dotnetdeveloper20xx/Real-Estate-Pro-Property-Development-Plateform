# Requirements Document

## Introduction

Global Search is a flagship platform capability for BuildEstate Pro that provides intelligent, fast, permission-aware search across all modules. It delivers a command palette experience accessible from every page via keyboard shortcut (Ctrl+K) and a persistent search trigger in the top navigation bar. The feature encompasses quick search (instant as-you-type results), full global search, advanced filtered search, saved searches, recent searches, and command palette navigation. It targets sub-300ms response times with layered matching algorithms including exact match, fuzzy matching, phonetic matching, synonym expansion, and weighted relevancy scoring. Results are grouped by module category, permission-filtered server-side, and presented with rich result cards including match highlighting, quick actions, and an optional preview panel.

## Glossary

- **Search_System**: The global search infrastructure comprising frontend overlay, NgRx state, search service, backend API, MediatR handlers, module search providers, and database indexing layers
- **Search_Overlay**: The modal dialog UI that appears when the user triggers search, containing the search input, tabs, results, recent searches, and command palette
- **Command_Palette**: A mode within the Search_Overlay that allows users to navigate to pages, execute commands, and find entities using a ">" prefix for commands
- **Search_Provider**: A backend module implementing ISearchProvider that registers searchable entities from a specific module (e.g., Land Acquisition, Planning, Legal)
- **Search_Scoring_Service**: The application-layer service that calculates relevancy scores using layered matching strategies and boost rules
- **Search_Synonym_Service**: The service that expands search queries with predefined synonym terms from the synonym dictionary
- **Search_Result_Card**: A UI component displaying a single search result with icon, title, subtitle, status badge, highlighted matches, timestamp, and quick actions
- **Quick_Search**: Instant search mode triggered by typing in the search input, with debounced API calls and immediate result display
- **Advanced_Search**: A search mode with filter controls for date ranges, statuses, modules, owners, tags, risk levels, and priorities
- **Saved_Search**: A user-defined search preset with query text and filter configuration persisted for reuse
- **Recent_Search**: A previously executed search query automatically stored and displayed when the Search_Overlay opens without a query
- **Module_Registry**: The system by which each BuildEstate Pro module registers its searchable entities, fields, weights, icons, categories, and permissions with the Search_System
- **Relevancy_Score**: A numeric score calculated from layered matching multipliers, field weights, and boost rules that determines result ranking
- **Permission_Filter**: Server-side filtering that removes search results the authenticated user does not have read access to, enforced within each Search_Provider
- **Result_Group**: A collection of search results belonging to the same module category, displayed as a tab with a count badge
- **Preview_Panel**: An optional side panel showing detailed information about the currently selected search result without leaving the current page

## Requirements

### Requirement 1: Search Accessibility and Activation

**User Story:** As a platform user, I want to access global search from any page via the top navigation bar or keyboard shortcut, so that I can find information quickly regardless of where I am in the application.

#### Acceptance Criteria

1. THE Search_System SHALL render a search trigger icon in the top navigation bar on every page of the application, with an accessible name of "Open search" via aria-label
2. WHEN the user clicks the search trigger icon, THE Search_Overlay SHALL open with keyboard focus on the search input field
3. WHEN the user presses Ctrl+K (Windows/Linux) or Cmd+K (macOS) from any page, THE Search_Overlay SHALL open with keyboard focus on the search input field
4. IF the keyboard shortcut Ctrl+K or Cmd+K is pressed while browser focus is inside a contenteditable element or text input field, THEN THE Search_System SHALL still open the Search_Overlay and prevent the default browser action
5. WHILE the Search_Overlay is open, THE Search_System SHALL trap keyboard focus within the overlay so that Tab and Shift+Tab cycle only through focusable elements inside the overlay
6. WHEN the user presses Escape while the Search_Overlay is open, THE Search_Overlay SHALL close and return keyboard focus to the element that triggered it
7. THE Search_Overlay SHALL include ARIA attributes: role="dialog", aria-modal="true", and aria-label="Global search"
8. THE Search_System SHALL render the search trigger in all supported themes: Light, Dark, Corporate, and Business

### Requirement 2: Quick Search with Instant Results

**User Story:** As a platform user, I want to see search results instantly as I type, so that I can find what I need without waiting for a full search to execute.

#### Acceptance Criteria

1. WHEN the user types in the search input, THE Search_System SHALL debounce the query for 300 milliseconds before dispatching an API request
2. WHEN a new character is typed before the debounce completes, THE Search_System SHALL reset the debounce timer and cancel any in-flight API request
3. WHEN the debounced query is dispatched, THE Search_System SHALL display a loading skeleton state within the results area
4. WHEN the API returns results, THE Search_System SHALL render the results within 100 milliseconds of receiving the response
5. IF the search query has fewer than 1 character, THEN THE Search_System SHALL not dispatch an API request and SHALL display up to 10 recent searches and up to 10 pinned items instead
6. THE Search_System SHALL normalize the query by converting to lowercase, trimming whitespace, and collapsing multiple spaces before dispatching, and SHALL truncate the query to a maximum of 200 characters
7. IF the API request fails or does not respond within 5 seconds, THEN THE Search_System SHALL dismiss the loading skeleton, display an error message indicating the search could not be completed, and provide a retry action
8. WHEN the API returns zero results for a valid query, THE Search_System SHALL display an empty state message indicating no results matched the query and SHALL suggest refining or modifying the search terms
9. IF the user clears the search input or presses Escape while results are displayed, THEN THE Search_System SHALL dismiss the results area and cancel any in-flight API request

### Requirement 3: Cross-Module Search with Provider Architecture

**User Story:** As a platform user, I want search to return results from all modules I have access to, so that I can find any entity in the system from a single search interface.

#### Acceptance Criteria

1. THE Search_System SHALL query all registered Search_Provider instances in parallel for each search request and return only results the authenticated user has read permission for, as determined by server-side authorization policy evaluation per provider
2. WHEN a search request specifies module filters, THE Search_System SHALL query only the Search_Provider instances matching those module identifiers
3. EACH Search_Provider SHALL implement the ISearchProvider interface declaring ModuleId, EntityName, CategoryName, Icon, and Priority (integer 1–100, where 1 is highest priority) properties
4. THE Search_System SHALL aggregate results from all providers, apply scoring via the Search_Scoring_Service, return a maximum of 50 results per category and 200 results total, and return results grouped by category ordered by the provider Priority value (ascending)
5. IF a Search_Provider exceeds a 5-second execution timeout, THEN THE Search_System SHALL cancel that provider, include a partial results indicator identifying the timed-out module in the response, and return results from the remaining providers
6. THE Search_System SHALL support the following registered modules: Land Acquisition (opportunities, owners, due diligence, offers, contracts, acquisitions), Planning and Approvals (applications, conditions), Legal and Compliance (cases, checks), User Management (users, roles), Documents (all document types), and Notifications
7. IF all queried Search_Provider instances fail or exceed the 5-second timeout, THEN THE Search_System SHALL return an error response indicating that search is temporarily unavailable

### Requirement 4: Layered Search Matching and Relevancy Scoring

**User Story:** As a platform user, I want search to find results even when I type partial words, misspellings, or synonyms, so that I do not need to remember exact names or reference numbers.

#### Acceptance Criteria

1. THE Search_Scoring_Service SHALL apply matching layers in this order with corresponding score multipliers: Exact Match (5.0x), Starts With (3.0x), Contains (1.5x), Token Matching (2.0x per token), Fuzzy Matching via Levenshtein distance (0.8x), Phonetic Matching via Soundex or Metaphone (0.5x), and Synonym Matching (0.7x)
2. THE Search_Scoring_Service SHALL calculate the final relevancy score using the formula: FinalScore equals the sum of (MatchScore multiplied by FieldWeight multiplied by LayerMultiplier) plus BoostScore
3. WHEN a multi-word query is submitted, THE Search_System SHALL split the query by whitespace and require each token to match at least one field in the entity (AND logic)
4. WHEN a multi-word query has all tokens matching within the same field, THE Search_Scoring_Service SHALL apply a bonus of 1.0 to the score
5. THE Search_System SHALL apply fuzzy matching with a maximum Levenshtein distance of 2 for words with 6 or fewer characters, and a maximum distance of 3 for longer words
6. THE Search_Synonym_Service SHALL expand queries using the predefined synonym dictionary and apply synonym matches with a 0.7x multiplier
7. THE Search_Scoring_Service SHALL apply boost rules: recently viewed by user within the last 30 days (+2.0), recently modified within 7 days (+1.5), active status (+1.0), created by user (+0.5), matches user department (+1.0), and frequently accessed defined as 10 or more views across all users within the last 30 days (+0.8)
8. THE Search_System SHALL normalize both query input and field values before matching by converting to lowercase, trimming leading and trailing whitespace, collapsing multiple spaces to a single space, and removing diacritical marks
9. IF a query contains fewer than 2 characters, THEN THE Search_System SHALL not execute a search and SHALL return an empty result set with no error
10. IF a query exceeds 200 characters, THEN THE Search_System SHALL truncate the query to 200 characters before processing and SHALL execute the search using the truncated value

### Requirement 5: Field Weights and Module Registration

**User Story:** As a platform administrator, I want each module to register its searchable fields with appropriate weights, so that primary identifiers like names and reference numbers rank higher than supplementary fields.

#### Acceptance Criteria

1. EACH Search_Provider SHALL declare searchable fields with weight values constrained to the following ranges: unique identifiers 2.5 to 3.0, names and titles 2.0 to 2.5, locations and addresses 1.5 to 2.0, status values 1.0 to 1.5, descriptions and notes 0.8 to 1.0, tags and categories 1.0 to 1.5, and each registration SHALL include at least 1 searchable field
2. THE Search_System SHALL use field weights as multipliers in the scoring formula such that a match on a field with weight W1 produces a higher relevancy score than an identical match on a field with weight W2 when W1 is greater than W2
3. WHEN a new module is added to the platform, THE Search_System SHALL require registration via the Module_Registry before the module entities become searchable
4. EACH module registration SHALL include: moduleId (unique across all registrations), entityName, entityNamePlural, icon (Material Symbols Outlined), category, searchFields with weights, resultTemplate, navigationRoute, permissionPolicy, quickActions, and enabled flag
5. IF a module registration is submitted with any required field missing or with a weight value outside the allowed range for its field type, THEN THE Search_System SHALL reject the registration and return an error message indicating which fields failed validation
6. IF a module registration is submitted with a moduleId that already exists in the Module_Registry, THEN THE Search_System SHALL reject the registration and return an error message indicating the duplicate identifier

### Requirement 6: Permission-Aware Search Results

**User Story:** As a platform user, I want search results to only show entities I have permission to access, so that no sensitive information is leaked through the search interface.

#### Acceptance Criteria

1. EACH Search_Provider SHALL filter results based on the authenticated user's claims and role permissions before returning results to the aggregator
2. THE Search_System SHALL never expose entity titles, descriptions, or any field content for entities the user lacks read permission on
3. THE Search_System SHALL enforce permission filtering on the server side; no client-side filtering SHALL be relied upon for security
4. IF a user has no access to a specific module, THEN THE Search_System SHALL exclude that module's tab and results entirely from the response, and category counts SHALL reflect only the entities the user is permitted to view
5. THE Search_System SHALL not include entities in autocomplete suggestions that the user cannot access
6. THE Search_System SHALL apply rate limiting of 10 search requests per second per authenticated user; IF a user exceeds the rate limit, THEN THE Search_System SHALL reject the request and return an error response indicating the limit has been exceeded without processing the search query
7. IF a search request is received without a valid authenticated user context, THEN THE Search_System SHALL reject the request and return an authentication error without executing any search provider

### Requirement 7: Search Results Grouping and Tabs

**User Story:** As a platform user, I want search results organized by module category with count badges on tabs, so that I can quickly identify which modules contain relevant results.

#### Acceptance Criteria

1. THE Search_System SHALL group search results by category and display them as separate tabs with count badges (e.g., "All (52)", "Land (12)", "Planning (8)")
2. THE Search_System SHALL display an "All" tab as the default active tab showing results from all categories
3. WHEN the user selects a specific category tab, THE Search_System SHALL display only results from that category
4. EACH Result_Group SHALL display a maximum of 5 results by default with a "View all" link to load the full set for that category
5. THE Search_System SHALL order category tabs by the priority value defined in each Search_Provider registration (lower priority number appears first)
6. THE tab bar SHALL use role="tablist" with role="tab" on each tab for accessibility compliance

### Requirement 8: Search Result Card Presentation

**User Story:** As a platform user, I want each search result to display rich contextual information with highlighted matches, so that I can identify the correct result without opening it.

#### Acceptance Criteria

1. EACH Search_Result_Card SHALL display: module-specific icon, entity type label, title with match highlighting, subtitle, status badge with appropriate colour variant, module badge, last updated timestamp, and breadcrumb context
2. THE Search_System SHALL highlight matched text within result titles and subtitles by wrapping matched substrings in mark elements
3. THE Search_System SHALL apply HTML encoding to non-matched portions of highlighted text to prevent cross-site scripting
4. EACH Search_Result_Card SHALL provide quick action buttons: View, Edit (permission-dependent), Open in new tab, Copy link, Favorite, and Pin
5. THE Search_Result_Card SHALL use role="option" with aria-selected on the active result for accessibility
6. WHEN the user navigates results with Arrow keys, THE Search_System SHALL update aria-selected and visual focus indicator on the active result

### Requirement 9: Command Palette Mode

**User Story:** As a platform user, I want to use the search overlay as a command palette to navigate pages and execute common actions quickly, so that I can work efficiently without using the mouse.

#### Acceptance Criteria

1. WHEN the Search_Overlay opens via Ctrl+K with no query, THE Command_Palette SHALL display up to 5 recently opened items (opened within the current session or last 7 days, ordered by most recent) and up to 5 frequently used pages (pages with the highest access count within the last 30 days, ordered by frequency)
2. WHEN the user types a query prefixed with ">", THE Command_Palette SHALL switch to command mode displaying up to 15 matching navigation and action commands that the user has permission to execute based on their assigned role
3. WHEN the user selects a navigation command, THE Command_Palette SHALL navigate the user to the specified page and close the overlay
4. WHEN the user selects an action command, THE Command_Palette SHALL initiate the specified workflow and close the overlay
5. WHEN the user types without a ">" prefix, THE Command_Palette SHALL search across entities, pages, and commands simultaneously, applying a 300ms debounce after the user stops typing, beginning search after at least 1 character is entered
6. WHILE the Command_Palette is open, THE Command_Palette SHALL support keyboard navigation: Arrow Down to move focus to the next item, Arrow Up to move focus to the previous item, Enter to execute the focused command, Tab to move focus between sections, and Escape to close the overlay and return focus to the previously focused element
7. IF the user presses Escape or clicks outside the Command_Palette overlay, THEN THE Command_Palette SHALL close the overlay without executing any command and return focus to the element that was focused before the overlay opened
8. THE Command_Palette SHALL display only commands and items that the user has permission to access based on their assigned role, hiding unauthorized commands entirely rather than showing them as disabled

### Requirement 10: Recent Searches and Pinned Items

**User Story:** As a platform user, I want my recent searches and pinned items preserved across sessions, so that I can quickly re-execute common searches or access frequently used entities.

#### Acceptance Criteria

1. WHEN the user executes a search, THE Search_System SHALL persist the query text, timestamp, and result count as a Recent_Search
2. WHEN the Search_Overlay opens without a query, THE Search_System SHALL display the user's recent searches ordered by most recent first
3. THE Search_System SHALL store recent searches on the server via the API endpoint GET /api/v1/search/recent
4. WHEN the user pins a search result, THE Search_System SHALL persist it via POST /api/v1/search/pinned and display it in the pinned items section
5. WHEN the user unpins an item, THE Search_System SHALL remove it via DELETE /api/v1/search/pinned/{id}
6. THE Search_System SHALL display pinned items in the initial state of the Search_Overlay alongside recent searches

### Requirement 11: Advanced Search with Filters

**User Story:** As a platform user, I want to apply advanced filters (date ranges, statuses, modules, owners) to narrow my search results, so that I can find specific entities when a simple text query is too broad.

#### Acceptance Criteria

1. WHEN the user activates Advanced Search mode, THE Search_System SHALL display filter controls for: modules (multi-select), statuses (multi-select), date range (from/to date pickers), created by (user selector), and tags (multi-select)
2. WHEN filters are applied, THE Search_System SHALL include them as query parameters in the search API request
3. THE Search_System SHALL support combining text query with advanced filters using AND logic
4. WHEN the user clears all filters, THE Search_System SHALL revert to unfiltered search results
5. THE Search_System SHALL validate that dateTo is not earlier than dateFrom before dispatching the request
6. THE Advanced_Search panel SHALL be accessible via an "Advanced" link visible in the Search_Overlay

### Requirement 12: Saved Searches

**User Story:** As a platform user, I want to save frequently used search queries with their filters as named presets, so that I can re-execute complex searches without reconfiguring filters each time.

#### Acceptance Criteria

1. WHEN the user saves a search, THE Search_System SHALL persist the query text, all active filters, and a user-provided name as a Saved_Search
2. THE Search_System SHALL display saved searches in a dedicated "Saved" section accessible from the Search_Overlay
3. WHEN the user selects a saved search, THE Search_System SHALL populate the search input and filters with the saved configuration and execute the search
4. WHEN the user deletes a saved search, THE Search_System SHALL remove it permanently after confirmation
5. THE Search_System SHALL allow a user to save a maximum of 50 search presets

### Requirement 13: Search Performance

**User Story:** As a platform user, I want search to respond within 300 milliseconds, so that the experience feels instant and does not interrupt my workflow.

#### Acceptance Criteria

1. THE Search_System SHALL return search results within 300 milliseconds for standard queries (3 or more characters) under normal load (up to 50 concurrent users) with datasets up to 100,000 records per module
2. WHEN the user has typed 2 or more characters into the search input, THE Search_System SHALL return autocomplete suggestions within 150 milliseconds under normal load (up to 50 concurrent users) with datasets up to 100,000 records per module
3. THE Search_System SHALL return category count queries within 200 milliseconds under normal load (up to 50 concurrent users) with datasets up to 100,000 records per module
4. EACH Search_Provider SHALL use AsNoTracking for all read queries and project only the fields needed for search results
5. THE Search_System SHALL maintain database indexes on all searchable fields including single-column indexes, full-text indexes on description fields, and composite indexes on (IsDeleted, Status) and (IsDeleted, CreatedAt DESC)
6. THE Search_System SHALL cache category counts with a time-to-live of 30 seconds
7. THE Search_System SHALL support pagination with a minimum page size of 1, a default page size of 10, and a maximum page size of 50
8. IF a search query exceeds 300 milliseconds, THEN THE Search_System SHALL return the available partial results collected up to that point along with an indication that results may be incomplete

### Requirement 14: Search State Management (NgRx)

**User Story:** As a frontend developer, I want search state managed through NgRx with proper actions, effects, and selectors, so that the search UI is predictable, testable, and integrates with the platform state architecture.

#### Acceptance Criteria

1. THE Search_System SHALL maintain search state in an NgRx store slice containing: query (string), results (array grouped by category), totalCount (number), loading (boolean), error (string or null), activeTab (string), recentSearches (maximum 10 entries), pinnedItems (maximum 25 entries), suggestions (maximum 8 entries), and advancedFilters (object)
2. THE Search_System SHALL define NgRx actions for: ExecuteSearch, ExecuteSearchSuccess, ExecuteSearchFailure, ClearSearch, SetActiveTab, AddRecentSearch, ClearRecentSearches, PinItem, UnpinItem, LoadSuggestions, LoadSuggestionsSuccess, SetAdvancedFilters, and ClearAdvancedFilters
3. THE Search_System SHALL implement NgRx effects that debounce ExecuteSearch dispatches by 300 milliseconds, cancel any in-flight search API request when a new ExecuteSearch is dispatched (using switchMap), and dispatch ExecuteSearchSuccess or ExecuteSearchFailure based on the API response
4. THE Search_System SHALL provide memoized selectors for: selectSearchResults, selectSearchLoading, selectGroupedResults, selectActiveTabResults, selectCategoryCounts, selectRecentSearches, selectPinnedItems, and selectHasResults
5. WHEN the Search_Overlay closes, THE Search_System SHALL dispatch ClearSearch to reset query to empty string, results to empty array, totalCount to zero, loading to false, error to null, and suggestions to empty array while preserving recentSearches, pinnedItems, activeTab, and advancedFilters
6. IF ExecuteSearchFailure is dispatched, THEN THE Search_System SHALL set the error field with the failure description, set loading to false, and preserve the current query and any previously loaded results

### Requirement 15: Keyboard Navigation within Search Results

**User Story:** As a platform user, I want full keyboard navigation within search results, so that I can find and open results efficiently without using a mouse.

#### Acceptance Criteria

1. WHEN the Search_Overlay is open, THE Search_System SHALL support Arrow Down to move focus to the next result and Arrow Up to move to the previous result
2. WHEN a result is focused and the user presses Enter, THE Search_System SHALL navigate to that result's detail page and close the overlay
3. WHEN a result is focused and the user presses Ctrl+Enter, THE Search_System SHALL open the result in a new browser tab
4. WHEN the user presses Tab within the Search_Overlay, THE Search_System SHALL move focus between the search input, tab bar, and results list in logical order
5. THE Search_System SHALL announce the total result count via an aria-live="polite" region when results are updated
6. THE Search_System SHALL visually indicate the currently focused result with a distinct background colour using the theme token bg-primary/10

### Requirement 16: Responsive Search Experience

**User Story:** As a platform user, I want global search to work effectively on all device sizes from desktop to mobile, so that I can search regardless of which device I am using.

#### Acceptance Criteria

1. WHILE the viewport width is 1440 pixels or greater (Desktop), THE Search_Overlay SHALL display with full width and an optional side Preview_Panel
2. WHILE the viewport width is between 1024 and 1439 pixels (Laptop), THE Search_Overlay SHALL display at full width without the Preview_Panel
3. WHILE the viewport width is between 768 and 1023 pixels (Tablet), THE Search_Overlay SHALL display as a full-screen overlay
4. WHILE the viewport width is below 768 pixels (Mobile), THE Search_Overlay SHALL display as a full-screen overlay with simplified result cards showing only title, icon, and status
5. THE Search_System SHALL use DaisyUI theme tokens for all colours and Tailwind utility classes for layout to ensure theme and responsive compatibility

### Requirement 17: Preview Panel for Search Results

**User Story:** As a platform user, I want to preview a selected search result's details in a side panel without navigating away from search, so that I can evaluate results before committing to open one.

#### Acceptance Criteria

1. WHERE the desktop viewport supports it (1440px or greater), THE Preview_Panel SHALL display alongside search results when a result is selected
2. THE Preview_Panel SHALL show: entity summary, current status, owner or assigned user, related links, available actions, and recent activity or history
3. WHEN the user selects a different result, THE Preview_Panel SHALL update to show the newly selected result's preview
4. THE Preview_Panel SHALL provide action buttons (View, Edit) that navigate to the entity's detail page
5. IF the Preview_Panel data fails to load, THEN THE Search_System SHALL display a fallback message with a retry option

### Requirement 18: Search Input Normalization and Query Parsing

**User Story:** As a platform user, I want my search queries to be intelligently parsed regardless of formatting, so that searches work whether I type in uppercase, use extra spaces, or enclose phrases in quotes.

#### Acceptance Criteria

1. THE Search_System SHALL normalize queries by converting to lowercase, removing leading and trailing whitespace, collapsing multiple spaces to a single space, and removing diacritical marks
2. WHEN a query is enclosed in double quotes, THE Search_System SHALL treat it as an exact phrase match without splitting into tokens
3. WHEN a query contains multiple unquoted words, THE Search_System SHALL split into tokens and apply AND logic requiring each token to match somewhere in the entity
4. THE Search_System SHALL expand common abbreviations using the configurable abbreviation dictionary before matching
5. THE Search_System SHALL support case-insensitive matching across all matching layers

### Requirement 19: Document Search Capabilities

**User Story:** As a platform user, I want to search for documents by file name, metadata, description, and tags, so that I can find uploaded documents across all modules.

#### Acceptance Criteria

1. THE Search_Provider for Documents SHALL index the following fields with weights: FileName (2.0), DocType (1.5), Description (1.0), and Tags (1.5)
2. WHEN the user searches for a file extension (e.g., ".pdf"), THE Search_System SHALL match documents with that extension via contains matching
3. THE Search_System SHALL support full-text search on document description fields using SQL Server Full-Text Search indexing
4. EACH document search result SHALL display: document icon based on file type, file name as title, document type as subtitle, associated module as breadcrumb, and upload date as timestamp
5. THE Document Search_Provider SHALL filter results based on the user's access to the parent entity that owns the document

### Requirement 20: Search Error Handling and Empty States

**User Story:** As a platform user, I want clear feedback when search returns no results or encounters an error, so that I understand what happened and what I can do next.

#### Acceptance Criteria

1. WHEN a search returns zero results, THE Search_System SHALL display an empty state message: "No results found for '{query}'" with suggestions to try different keywords or check spelling
2. WHEN the search API returns an error, THE Search_System SHALL display a user-friendly error message with a retry button
3. IF the search API is unreachable, THEN THE Search_System SHALL display recent searches and pinned items as a fallback with a notification that search is temporarily unavailable
4. THE Search_System SHALL never display raw server error messages, stack traces, or technical details to the user
5. WHEN results are loading, THE Search_System SHALL display skeleton loading placeholders matching the layout of result cards
6. THE empty state SHALL include a link to the Advanced Search panel as an alternative approach

### Requirement 21: Search Configuration and Feature Flags

**User Story:** As a platform administrator, I want configurable search settings, so that search features like fuzzy matching, synonyms, and phonetic matching can be enabled or disabled without code deployment.

#### Acceptance Criteria

1. THE Search_System SHALL support the following configuration options: EnableGlobalSearch, DefaultModules, ModuleWeights, MaxResults, SearchMode, EnableFuzzyMatching, EnableRecentSearches, EnableSuggestions, EnableHighlights, EnableRanking, EnableSynonyms, and EnablePhoneticMatching
2. WHEN EnableFuzzyMatching is set to false, THE Search_System SHALL skip the fuzzy matching layer during scoring
3. WHEN EnableSynonyms is set to false, THE Search_Synonym_Service SHALL not expand queries with synonym terms
4. THE Search_System SHALL load configuration from the application settings at startup and respect changes without requiring a restart (via options pattern with reload)
5. THE Search_System SHALL apply ModuleWeights to boost or demote entire module categories in the result ranking

### Requirement 22: Search Governance and Module Evolution

**User Story:** As a development team member, I want a governance process ensuring every new module registers with search, so that the search experience evolves automatically as the platform grows.

#### Acceptance Criteria

1. WHEN a new module or entity type is implemented, THE development team SHALL evaluate whether it should be searchable and register it with the Module_Registry
2. EACH module registration SHALL define: all searchable text fields with weights, result icon from Material Symbols Outlined, result category for tab grouping, navigation route for result click-through, permission policy name for access control, result template (title field, subtitle field, status field, timestamp field), and quick actions
3. THE Search_System SHALL validate at application startup that all registered Search_Providers are resolvable from the dependency injection container
4. IF a registered Search_Provider fails to resolve at startup, THEN THE Search_System SHALL log a warning and continue operating without that provider

### Requirement 23: Search API Endpoints and Validation

**User Story:** As a frontend developer, I want well-defined search API endpoints with input validation, so that the frontend can reliably integrate with the search backend.

#### Acceptance Criteria

1. THE Search_System SHALL expose the endpoint GET /api/v1/search accepting query parameters: q (required, minimum 1 character, maximum 200 characters), modules (optional CSV), statuses (optional CSV), dateFrom (optional DateTime), dateTo (optional DateTime), createdBy (optional string), page (optional integer, minimum 1, default 1), pageSize (optional integer, minimum 1, default 10, maximum 50), and maxPerCategory (optional integer, minimum 1, default 5, maximum 50)
2. THE Search_System SHALL expose GET /api/v1/search/suggestions accepting: prefix (required, minimum 2 characters, maximum 100 characters) and limit (optional integer, minimum 1, default 8, maximum 20)
3. THE Search_System SHALL expose GET /api/v1/search/recent returning at most 20 of the authenticated user's recent searches ordered by most recent first
4. THE Search_System SHALL expose GET /api/v1/search/pinned returning the authenticated user's pinned items, POST /api/v1/search/pinned accepting a request body with entityId (required, Guid) and entityType (required, string) to create a pinned item, and DELETE /api/v1/search/pinned/{id} to remove a pinned item by its identifier
5. IF a search request fails FluentValidation, THEN THE Search_System SHALL return HTTP 400 with a response body containing a errors array where each entry includes the field name and a human-readable validation message
6. IF dateFrom is provided and dateTo is provided and dateFrom is later than dateTo, THEN THE Search_System SHALL return HTTP 400 with a validation error indicating the invalid date range
7. THE Search_System SHALL require authentication via the Authorize attribute on all search endpoints and return HTTP 401 for unauthenticated requests

### Requirement 24: Role-Based Search Result Visibility

**User Story:** As a user with a specific role (e.g., Acquisition Manager, Legal Officer), I want to see only the entities relevant to my role and permissions in search results, so that I am not overwhelmed by irrelevant results and sensitive data remains protected.

#### Acceptance Criteria

1. WHEN a user with the Acquisition Manager role searches, THE Search_System SHALL include results from the Land Acquisition module and any other modules the role has read access to
2. WHEN a user with the Legal and Compliance Officer role searches, THE Search_System SHALL include results from the Legal and Compliance module and any other modules the role has read access to
3. WHEN a user with the SuperAdmin role searches, THE Search_System SHALL include results from all registered modules without restriction
4. THE Search_System SHALL derive module visibility from the user's role claims and configured authorization policies
5. THE Search_System SHALL never display a category tab for a module the user has no read access to

### Requirement 25: Search Highlighting and Text Rendering

**User Story:** As a platform user, I want matched portions of text highlighted in search results, so that I can immediately see why a result matched my query.

#### Acceptance Criteria

1. THE Search_System SHALL generate highlighted text server-side by wrapping matched substrings in HTML mark elements
2. THE Search_System SHALL support highlighting across multiple tokens in a single field (e.g., both words in a two-word query highlighted separately)
3. THE Search_System SHALL HTML-encode all non-matched text to prevent cross-site scripting when rendering highlighted results
4. THE frontend SHALL render highlighted text using the theme token bg-warning/20 for the highlight background and text-warning-content for the text colour
5. WHEN highlighting is disabled via configuration (EnableHighlights = false), THE Search_System SHALL return plain text without mark elements
