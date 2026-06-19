# Opportunity Status State Machine Notes

## Overview

The `OpportunityStateMachine` (located in `src/BuildEstate.Infrastructure/Persistence/Services/OpportunityStateMachine.cs`) enforces valid status transitions for land opportunity entities throughout their lifecycle.

## Full Transition Map

| Current Status   | Permitted Next Statuses               |
|------------------|---------------------------------------|
| Identified       | InitialReview, **Withdrawn**          |
| InitialReview    | DueDiligence, Withdrawn               |
| DueDiligence     | OfferMade, Withdrawn                  |
| OfferMade        | UnderContract, Withdrawn              |
| UnderContract    | Acquired, Withdrawn                   |
| Acquired         | _(terminal — no transitions out)_     |
| Withdrawn        | _(terminal — no transitions out)_     |

## Terminal States

- **Acquired** — The opportunity has been successfully purchased. No further status transitions are allowed.
- **Withdrawn** — The opportunity has been removed from the pipeline. No further status transitions are allowed. This is a final state with no way to reopen or revert.

## Identified → Withdrawn Transition

### Intentional Enhancement

The **Identified → Withdrawn** transition is **intentional** and was not part of the original spec (Requirement 3.1). It was added as an enhancement to the state machine.

### Rationale

> "Allows cancellation of misidentified or duplicate opportunities before review resources are allocated."

Without this transition, an opportunity that was created in error or identified as a duplicate would need to progress through `InitialReview` before it could be withdrawn. This wastes reviewer time and clutters the pipeline with records that should never have advanced.

### Use Cases

1. **Duplicate entry** — An acquisition manager realises the same land parcel was already entered under a different name.
2. **Data entry error** — The opportunity was created with incorrect details and should be discarded rather than corrected.
3. **Immediate disqualification** — External information (e.g., the land is not actually for sale) makes the opportunity invalid before any review begins.

### Frontend Enforcement

Both the pipeline page (drag-and-drop) and the opportunity detail page respect this transition. When a user drags a card from the "Identified" column to the "Withdrawn" column, a withdrawal reason modal is displayed requiring at least 10 characters of justification before the transition is submitted.

## Notes for Developers

- The state machine is the single source of truth for valid transitions.
- Both frontend and backend enforce the same transition rules.
- The frontend mirrors the transition map in `PipelinePageComponent.validTransitions` and `OpportunityDetailPageComponent`.
- Any changes to the backend state machine must be reflected in the frontend `validTransitions` map.
- The `ValidateTransition` method throws `InvalidStateTransitionException` for invalid transitions, which the API maps to HTTP 400 Bad Request.
