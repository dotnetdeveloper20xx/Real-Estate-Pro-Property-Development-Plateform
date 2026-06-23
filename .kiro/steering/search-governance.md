# BuildEstate Pro — Search Governance

## Purpose

Search is a flagship platform capability of BuildEstate Pro. It is NOT a secondary feature. It is NOT a simple SQL LIKE query. It is an intelligent, fast, organized, and professional search experience that rivals Jira, Azure DevOps, GitHub, Salesforce, HubSpot, and Confluence.

This document governs all search-related decisions, implementations, and reviews across the platform.

---

## Search Quality Standards

### Target Benchmarks

- Response time: < 300ms for all search operations
- Relevancy: Top 3 results must contain what the user intended in 95%+ of queries
- Availability: Search must be accessible from every page
- Keyboard shortcut: Ctrl+K opens command palette / global search
- Zero information leakage: Permission-aware results only

### Search Must Feel

- Fast
- Elegant
- Helpful
- Organized
- Predictable
- Premium
- Never overwhelming

---

## Search Configuration

```typescript
interface SearchConfiguration {
  enableGlobalSearch: boolean;
  defaultModules: string[];
  moduleWeights: Record<string, number>;
  maxResults: number;
  searchMode: 'quick' | 'global' | 'advanced';
  enableFuzzyMatching: boolean;
  enableRecentSearches: boolean;
  enableSuggestions: boolean;
  enableHighlights: boolean;
  enableRanking: boolean;
  enableSynonyms: boolean;
  enablePhoneticMatching: boolean;
}
```

Default behaviour: Search all registered modules with weighted ranking.

---

## Module Registration Requirement

Every module MUST register itself with the search infrastructure.

A module is NOT complete until:
- Its searchable entities are registered
- Search fields are defined with weights
- Result templates are configured
- Permissions are mapped
- Navigation routes are linked
- Icons and categories are assigned

---

## Mandatory Search Update Trigger

Whenever a new module, entity, page, or feature is implemented:

**STOP.**

Ask:
1. Should this be searchable?
2. What fields should be searchable?
3. What keywords should be indexed?
4. Should this entity appear in global search?
5. What permissions affect visibility?
6. Should it appear in the command palette?
7. Should it appear in recent items?
8. Should it support advanced search?
9. Should it support quick actions?

Update the search infrastructure accordingly.

**Search must evolve automatically with the application. Search is never considered complete.**

---

## Search Architecture Pattern

```
Component
    ↓
Search Store (NgRx)
    ↓
Effects
    ↓
Search Service
    ↓
Search API (Controller)
    ↓
Application Layer (MediatR)
    ↓
Search Handlers
    ↓
Module Providers
    ↓
Repositories
    ↓
Database (with indexes)
```

Never bypass this architecture.

---

## Search Modes

| Mode | Purpose | Trigger |
|------|---------|---------|
| Quick Search | Instant results as you type | Click search bar or Ctrl+K |
| Global Search | Full search across all modules | Enter key or "Search All" |
| Advanced Search | Filtered search with criteria | "Advanced" link or filters panel |
| Saved Searches | User-defined search presets | "Saved" tab |
| Recent Searches | Previously executed searches | Auto-displayed on focus |
| Command Palette | Navigate pages, commands, entities | Ctrl+K |

---

## Permission Enforcement

- Search results MUST be filtered server-side based on user permissions
- Never show results a user cannot access
- No information leakage through search suggestions
- No entity titles visible without read permission
- Role-based module visibility in search tabs

---

## Result Presentation Rules

Results must NOT be one long list.

### Grouping Strategy

Group results by module/category with tabs:
- All (total count)
- Land Opportunities (count)
- Planning Applications (count)
- Projects (count)
- Documents (count)
- Users (count)
- Finance (count)
- Reports (count)
- Notifications (count)

### Result Card Requirements

Each result card must display:
- Icon (module-specific)
- Entity type label
- Title (with match highlighting)
- Subtitle / description
- Status badge
- Module badge
- Last updated timestamp
- Quick actions (View, Edit, Copy link)
- Breadcrumb / context

---

## Search Evolution Rule

Search governance files must be updated whenever:
- A new module is added
- A new entity type is created
- Search algorithms are modified
- New search modes are introduced
- Performance benchmarks change
- UX patterns are updated

---

## Technical Director Review Criteria

After any search implementation, review:
- Relevancy quality
- Ranking accuracy
- Performance metrics
- UX polish
- Architecture compliance
- Permission enforcement
- Maintainability
- Scalability
- Grouping quality
- Preview usefulness

**The question to answer:**
"Would users say: Wow, this search makes the application easy to use."

If not, continue improving.
