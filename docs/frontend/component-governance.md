# BuildEstate Pro — Component Governance

## Purpose

This document defines the governance rules, review processes, and enforcement mechanisms that prevent component duplication and ensure the Design System Component Library remains the single source of truth for all shared UI across BuildEstate Pro's 14 modules.

**Last Updated:** July 2025

---

## Core Governance Principles

1. **Search before create** — Always search the Component Library before proposing a new component.
2. **Prefer extension over duplication** — If an existing component covers 50%+ of required functionality, extend it.
3. **Add configuration over creating variants** — Use inputs and configuration to handle variations, not new components.
4. **Library-first development** — Generic components belong in `shared/design-system/`, not feature modules.
5. **Documentation is mandatory** — A component without documentation is incomplete and ineligible for use.

---

## Component Creation Workflow

### Step 1: Search the Library

Before creating any new component:

1. Check `docs/frontend/component-catalog.md`
2. Search `client-app/src/app/shared/design-system/` for similar components
3. Check the existing `shared/components/` compatibility layer
4. Review the barrel export at `design-system/index.ts`

**Evidence required:** Document which components were reviewed and why they don't satisfy the requirement.

### Step 2: Extension Assessment

If an existing component covers 50%+ of the requirement:

- **Extend it** with new `@Input()` properties
- **Do NOT** create a new component unless extension would:
  - Require modifying more than 3 existing inputs
  - Break existing consumers
  - Violate single responsibility principle

### Step 3: Placement Decision

| Scenario | Location |
|----------|----------|
| Generic UI (not domain-specific) | `shared/design-system/{category}/` |
| Used by 2+ modules | `shared/design-system/{category}/` |
| Domain-specific, single module | Feature module (for now) |
| Domain-specific, 2nd module needs it | Migrate to `shared/design-system/` |

### Step 4: Implementation Standards

Every new design system component must:

- Use `standalone: true`
- Use `ChangeDetectionStrategy.OnPush`
- Accept data via `@Input()` (no direct service injection for data)
- Emit events via `@Output()` (no direct parent coupling)
- Include ARIA attributes for accessibility
- Use DaisyUI + Tailwind CSS (no custom CSS unless unavoidable)
- Use Material Symbols Outlined for icons
- Include JSDoc with `@example` on public APIs

### Step 5: Documentation

Before the component is considered complete:

1. Add entry to `docs/frontend/component-catalog.md`
2. Add full documentation to `docs/frontend/component-library.md`
3. Add barrel export to `design-system/index.ts`

---

## Pull Request Review Checklist

Every PR introducing or modifying a component must answer:

| # | Question | Required Evidence |
|---|----------|-------------------|
| 1 | Was the Component Library searched? | List of components reviewed |
| 2 | Does an overlapping component exist? | Comparison of input/output contracts |
| 3 | If yes, why can't it be extended? | Technical justification |
| 4 | Is WCAG 2.1 AA met? | Keyboard nav, ARIA, contrast |
| 5 | Does it render at all breakpoints? | Desktop, Laptop, Tablet, Mobile |
| 6 | Does it render in all themes? | Light and Dark minimum |
| 7 | Is documentation updated? | Catalog + library entries |
| 8 | Is the barrel export updated? | `index.ts` includes new component |

---

## Duplication Prevention Rules

### Rule 1: Reject Duplicates

If a PR introduces a component that duplicates the input/output contract of an existing Component Library component, the PR must be rejected with a reference to the existing component.

### Rule 2: Migration on Second Use

When a component initially created within a feature module is consumed by a second module, that component must be migrated to the Component Library within the same PR.

### Rule 3: No Feature-Module UI Patterns in Multiple Places

The following patterns must always come from the Design System:

- Data tables → `app-data-table`
- Modals → `app-modal`
- Confirmation dialogs → `app-confirm-dialog` + `ConfirmDialogService`
- Status/priority/stage/risk badges → `app-*-badge`
- Loading states → `app-loading-*` / `app-skeleton-*`
- Empty states → `app-empty-state`
- Filter bars → `app-filter-bar`
- Form controls → `app-text-input`, `app-select`, etc.
- File uploads → `app-file-upload`
- Currency display/edit → `app-currency`
- Date display/picker → `app-date`, `app-date-picker`, `app-date-range`

---

## Enforcement Mechanisms

### Automated Checks

- `.kiro/steering/component-library-rules.md` enforces search-before-create during AI-assisted development
- `.kiro/steering/component-review-checklist.md` provides a review gate for new components

### Manual Review

- Architecture review board evaluates component placement decisions
- UX governance board reviews accessibility and consistency
- PR reviewers verify library search evidence

### Violation Handling

| Violation | Action |
|-----------|--------|
| New component without library search evidence | PR rejected |
| Duplicate of existing component | PR rejected, reference provided |
| Component in feature module used by 2+ modules | Migration ticket created |
| Missing documentation | Component marked incomplete |
| Missing accessibility compliance | PR rejected |

---

## Component Lifecycle

### Creation

1. Proposal → governance check → implementation → documentation → review → merge

### Extension

1. Identify need → verify backward compatibility → add input → update docs → review → merge

### Deprecation

1. Identify replacement → add `@deprecated` JSDoc → migration guide → remove after all consumers migrated

### Removal

1. Verify zero consumers → remove from barrel export → remove files → update catalog

---

## Related Documentation

- [Design System Architecture](./design-system.md)
- [Component Library Reference](./component-library.md)
- [Component Catalog](./component-catalog.md)
