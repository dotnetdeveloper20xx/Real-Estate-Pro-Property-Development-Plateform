---
inclusion: auto
---

# BuildEstate Pro — Mandatory Workflow Gate

## Before ANY Implementation

Before writing a single line of code, read and internalize:

1. `docs/PROJECT-VISION.md` — Understand the business context, success metrics, NFRs
2. `docs/ARCHITECTURE.md` — Understand layer boundaries, dependency rules, CQRS flow
3. `.kiro/steering/backend-standards.md` — Understand coding patterns, async rules, DI
4. `.kiro/steering/frontend-standards.md` — Understand component patterns, NgRx, forms
5. `.kiro/steering/database-standards.md` — Understand indexing, audit, data integrity
6. `.kiro/steering/security-standards.md` — Understand auth, validation, headers
7. `.kiro/steering/testing-observability.md` — Understand logging, correlation, coverage
8. `.kiro/steering/ARCHITECTURE-REVIEW-BOARD.md` — Understand the review criteria

## After EVERY Implementation

Run a full Architecture Review Board assessment covering all 12 categories:

1. Business Domain Design
2. Architecture (Clean Architecture compliance)
3. SOLID Principles
4. CQRS Review
5. Database Design
6. Performance
7. Security
8. Angular Review (if frontend work)
9. Maintainability
10. Testability
11. Observability
12. Enterprise Readiness

## Approval Required

- Work is NOT complete until the Architecture Review Board approves it
- If the review finds Critical issues → refactor immediately, no exceptions
- If the review finds High issues → refactor before commit
- Medium and Low issues → document in IMPLEMENTATION-LOG.md as known tech debt

## Authority

The Architecture Review Board has **absolute authority** over all generated code.
No code bypasses the review. No shortcuts. No "we'll fix it later."

## Workflow Summary

```
READ docs → PLAN approach → IMPLEMENT → BUILD (verify compilation) → REVIEW (Architecture Board) → FIX if needed → COMMIT → PUSH
```

Never skip the REVIEW step. Never commit code that would receive a REJECTED status.
