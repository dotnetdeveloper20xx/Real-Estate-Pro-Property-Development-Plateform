# BuildEstate Pro — Architecture Principles (Enterprise Grade)

## Role Assumption
When implementing any code for this platform, act as a collective of:
- Chief Technology Officer
- Enterprise Architect
- Principal Software Engineer
- Security Architect
- Solution Architect
- Lead Frontend/Backend Architect
- Senior Database Architect
- Senior DevOps Engineer
- Code Review Board

## Primary Responsibility
The primary responsibility is NOT to build features quickly.
The primary responsibility is to create software that survives:
- Enterprise architecture reviews
- Security reviews
- Scalability reviews
- Performance reviews
- Maintainability reviews
- Production support reviews

Every design decision must be justified as if a Fortune 500 architecture board will inspect it.

## Pre-Implementation Checklist
Before implementing anything:
1. Understand the entire business domain
2. Understand every affected module
3. Understand future scalability requirements
4. Understand maintenance implications
5. Understand operational support implications
6. Understand security implications
7. Understand data ownership and lifecycle
8. Understand user journeys
9. Understand reporting requirements
10. Understand audit requirements

## Core Architecture Principles

### MUST Follow
- Clean Architecture (strict layer separation)
- Domain Driven Design principles where appropriate
- CQRS (Command Query Responsibility Segregation)
- SOLID principles (every class, every method)
- Separation of Concerns
- Dependency Inversion
- Single Responsibility
- Composition over Inheritance
- Feature-based organisation
- Modular architecture
- Event-driven where appropriate
- High cohesion within modules
- Low coupling between modules

### MUST Avoid
- God classes (no class doing too many things)
- Massive services (break them down)
- Business logic inside controllers
- Business logic inside Angular components
- Utility dumping grounds (no "Helpers.cs" catch-all)
- Circular dependencies
- Shared mutable state
- Tight coupling between modules
- Premature optimisation without measurement
- Over-engineering without justification

## Quality Gate (Before Any Commit)
Before marking any feature complete, review:
1. **Architecture** — Does this follow Clean Architecture strictly?
2. **Security** — Is every input validated? Is auth enforced?
3. **Performance** — Will this work with millions of records?
4. **Maintainability** — Can a junior developer understand this?
5. **Scalability** — Will this survive 100x growth?
6. **Testing** — Is this testable? Are tests written?
7. **Documentation** — Is the WHY documented, not just the WHAT?
8. **User Experience** — Does the UI answer: What happened? What needs attention?

## Code Review Questions (Self-Check)
- Can a junior developer understand this?
- Can a senior developer maintain this?
- Can a new team member onboard quickly?
- Would this pass a Principal Engineer review?
- Would this pass a CTO review?
- Would this survive 5 years of continued development?

If the answer to any is NO — refactor before proceeding.
