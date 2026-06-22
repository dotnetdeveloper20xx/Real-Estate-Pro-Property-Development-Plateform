# Component Review Checklist

## Purpose

This checklist must be completed before any new component PR is approved. It ensures quality, consistency, and governance compliance across the BuildEstate Pro Design System.

---

## Pre-Implementation Checklist

Before writing code, verify:

- [ ] Searched `docs/frontend/component-catalog.md` — no existing component satisfies the need
- [ ] Searched `shared/design-system/` directory for similar components
- [ ] Searched `shared/components/` compatibility layer
- [ ] If overlap found (50%+), documented why extension is not feasible
- [ ] Component purpose defined in 1–3 sentences
- [ ] Inputs and outputs identified
- [ ] Placement decided: `shared/design-system/{category}/` or feature module

---

## Implementation Checklist

During development, ensure:

### Architecture

- [ ] `standalone: true` declared
- [ ] `ChangeDetectionStrategy.OnPush` set
- [ ] Data received via `@Input()` only (no direct data service injection)
- [ ] Events emitted via `@Output()` only (no direct parent coupling)
- [ ] Angular signals used for internal state where appropriate
- [ ] `ControlValueAccessor` implemented (if form control)

### Styling

- [ ] DaisyUI theme-aware classes used exclusively
- [ ] No hardcoded colour values (`#hex`, `rgb()`, named colours)
- [ ] Tailwind utility classes for spacing and layout
- [ ] CSS custom properties from `design-system-tokens.css` used for scale-dependent values
- [ ] Material Symbols Outlined for icons

### Accessibility (WCAG 2.1 AA)

- [ ] All interactive elements reachable via keyboard Tab
- [ ] Focus indicators: 2px minimum, 3:1 contrast ratio
- [ ] ARIA labels on all interactive elements
- [ ] ARIA roles on non-semantic interactive elements
- [ ] `aria-expanded` on collapsible triggers
- [ ] `aria-invalid` on form controls with errors
- [ ] `aria-describedby` linking help text and errors
- [ ] `aria-busy="true"` on loading containers
- [ ] `prefers-reduced-motion` disables animations
- [ ] Minimum 44×44px touch targets on viewports < 768px
- [ ] Colour contrast: 4.5:1 normal text, 3:1 large text

### Responsiveness

- [ ] Renders correctly at Desktop (1440px+)
- [ ] Renders correctly at Laptop (1024–1439px)
- [ ] Renders correctly at Tablet (768–1023px)
- [ ] Renders correctly at Mobile (320–767px)
- [ ] No horizontal overflow at any breakpoint
- [ ] No content clipping or overlapping

### Theming

- [ ] Renders correctly in Light theme
- [ ] Renders correctly in Dark theme
- [ ] All colours adapt automatically when theme changes
- [ ] No visual glitches during theme transition

---

## Documentation Checklist

Before marking complete:

- [ ] Entry added to `docs/frontend/component-catalog.md` (selector, purpose, file path)
- [ ] Full documentation in `docs/frontend/component-library.md` (purpose, inputs, outputs, usage example, accessibility notes)
- [ ] Barrel export added to `design-system/index.ts`
- [ ] JSDoc with `@example` on all public `@Input()` and `@Output()` properties
- [ ] Component class has JSDoc describing its purpose

---

## Testing Checklist

- [ ] Unit tests for core logic (if applicable)
- [ ] Property-based tests for universal invariants (if applicable)
- [ ] Tests pass with `ng test --watch=false`

---

## PR Review Questions

Every reviewer must verify:

1. Was the Component Library searched? (Evidence required)
2. Does an overlapping component exist in the catalog?
3. If yes, why can't the existing component be extended?
4. Does the new component duplicate the input/output contract of an existing component?
5. Is the component placed in the correct location?
6. Is all documentation present and accurate?

---

## Rejection Criteria

A PR MUST be rejected if:

- No library search evidence is provided
- Component duplicates an existing component's input/output contract
- Accessibility compliance is not met
- Documentation is missing or incomplete
- Hardcoded colours are used
- OnPush change detection is not set
- Component does not render at all four breakpoints
- Component does not render in both Light and Dark themes
