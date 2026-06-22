# Component Library Rules

## Purpose

These rules govern how components are created, used, and maintained in the BuildEstate Pro Design System. They apply to all AI-assisted development and human developers working on the frontend.

---

## Rule 1: Search Before Create

Before creating ANY new Angular component, you MUST:

1. Search `docs/frontend/component-catalog.md` for existing components
2. Search `client-app/src/app/shared/design-system/` directory
3. Search `client-app/src/app/shared/components/` compatibility layer
4. Check the barrel export at `design-system/index.ts`

If an existing component can satisfy the requirement (even partially), use it.

---

## Rule 2: Prefer Extension Over Duplication

If an existing component covers 50% or more of the required functionality:

- **Extend it** by adding new `@Input()` properties
- **Do NOT** create a new component

Exception: Extension would require modifying more than 3 existing inputs or breaking existing consumers.

---

## Rule 3: Add Configuration Over Creating Variants

When you need a component that behaves slightly differently:

- Add a configuration input (e.g., `mode`, `variant`, `size`)
- Do NOT create `app-modal-small`, `app-modal-large` — use `<app-modal size="sm">`

---

## Rule 4: Library-First Placement

Generic components that are NOT tied to a single domain entity belong in:

```
client-app/src/app/shared/design-system/{category}/
```

NOT in feature module directories.

---

## Rule 5: Documentation is Mandatory

A component is NOT complete until:

1. Entry added to `docs/frontend/component-catalog.md`
2. Full docs added to `docs/frontend/component-library.md`
3. Barrel export added to `design-system/index.ts`

Without these, the component is ineligible for use in feature modules.

---

## Rule 6: Use Design System Components for Common Patterns

These patterns MUST use Design System components. Never implement them ad-hoc:

| Pattern | Required Component |
|---------|-------------------|
| Data tables | `<app-data-table>` |
| Modals/dialogs | `<app-modal>` |
| Confirmation prompts | `ConfirmDialogService` |
| Status/priority/stage/risk badges | `<app-*-badge>` |
| Loading spinners | `<app-loading-spinner>` |
| Loading overlays | `<app-loading-overlay>` |
| Skeleton loaders | `<app-skeleton-*>` |
| Empty states | `<app-empty-state>` |
| Filter bars | `<app-filter-bar>` |
| Form inputs | `<app-text-input>`, `<app-select>`, etc. |
| File uploads | `<app-file-upload>` |
| Currency display/edit | `<app-currency>` |
| Date display/picker | `<app-date>`, `<app-date-picker>` |

---

## Rule 7: Migration on Second Use

When a component initially created within a feature module is needed by a second module:

- Migrate it to `shared/design-system/` in the same PR
- Update all imports
- Add to catalog and documentation

---

## Rule 8: No Hardcoded Colours

All components must use DaisyUI theme tokens exclusively:

- `badge-success`, `badge-info`, `badge-warning`, `badge-error`, `badge-ghost`
- `btn-primary`, `btn-secondary`, `btn-accent`, `btn-error`
- `bg-base-100`, `bg-base-200`, `bg-base-300`
- `text-base-content`, `text-primary`, `text-error`

Never use `#hex`, `rgb()`, or named colour values.

---

## Rule 9: Accessibility is Non-Negotiable

Every component must include:

- Keyboard navigation (Tab reachable, Enter/Space activate)
- ARIA labels, roles, and states
- Focus indicators (2px minimum, 3:1 contrast)
- `prefers-reduced-motion` support
- 44×44px minimum touch targets on mobile

---

## Rule 10: OnPush Change Detection

All components must use:

```typescript
changeDetection: ChangeDetectionStrategy.OnPush
```

No exceptions.
