# Implementation Plan: BuildEstate Pro Developer Academy

## Overview

This plan generates 32 structured markdown documents in `docs/academy/` that serve as a comprehensive engineering university for new developers. Documents are generated in dependency order (business context → architecture → frameworks → deep-dives → quality) with a validation script ensuring structural correctness, content accuracy, and link integrity.

The implementation language is TypeScript for the validation script and tooling. The documents themselves are Markdown with Mermaid diagrams and code examples in C# and TypeScript.

## Tasks

- [x] 1. Set up academy infrastructure and validation tooling
  - [x] 1.1 Create the `docs/academy/` directory and the validation script scaffold
    - Create `docs/academy/` folder at repository root
    - Create `scripts/validate-academy.ts` with the `ValidationReport` interface from the design
    - Implement structural checks: file count (32), file naming (two-digit prefix + kebab-case), sequential numbering (00–31), content non-empty (at least one H1/H2)
    - Implement link integrity check: scan all relative markdown links `[text](./target.md)` and verify target exists in `docs/academy/`
    - Implement content minimum checks: Mermaid block presence, code example count (≥2 per doc), section structure (WHY/WHAT/HOW/WHEN/WHERE/WHO/WHAT NEXT), Common Mistakes section presence
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.1, 12.3, 12.4, 12.5_

  - [x] 1.2 Implement codebase accuracy validation helpers
    - Create file-path verification function that checks referenced paths exist in the repository
    - Create class-name verification function that searches for referenced class names in `src/` and `client-app/src/`
    - Create Angular component selector verification that checks selectors in `client-app/src/app/shared/`
    - Output unverified references with source file and line number
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 1.3 Write unit tests for validation script
    - Test file naming regex against valid and invalid filenames
    - Test link extraction and resolution logic
    - Test content minimum counting (Mermaid blocks, code blocks, section headings)
    - _Requirements: 1.2, 1.4, 12.3, 12.4_

- [x] 2. Generate Business Context documents (01–04)
  - [x] 2.1 Create `01-business-vision.md`
    - Include WHY/WHAT/HOW/WHEN/WHERE/WHO/WHAT NEXT sections
    - Document: problem solved, target market, business value propositions, 14 core modules positioning
    - Include Mermaid diagram showing platform module landscape
    - Include ≥2 code examples showing domain entity references
    - Include Common Mistakes section with ≥2 anti-patterns
    - _Requirements: 3.1, 3.5, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 2.2 Create `02-property-development-lifecycle.md`
    - Document all 9 business lifecycle phases (Opportunity through Analysis)
    - For each phase: business activities, key roles, data handoff to next phase
    - Include Mermaid diagram showing phase transitions and sequential dependencies
    - Include ≥2 code examples, Common Mistakes section
    - _Requirements: 3.2, 3.5, 12.1, 12.3, 12.4, 12.5_

  - [x] 2.3 Create `03-users-and-personas.md`
    - Document all 12 platform roles with responsibilities, modules, key workflows
    - Include Mermaid diagram showing role-to-module relationships
    - Include ≥2 code examples (e.g., role enum, guard configuration)
    - Include Common Mistakes section
    - _Requirements: 3.3, 3.5, 12.1, 12.3, 12.4, 12.5_

  - [x] 2.4 Create `04-enterprise-capabilities.md`
    - Describe cross-cutting capabilities (RBAC, workflow engine, document management, notifications, audit, search)
    - Business purpose, consuming modules, integration overview per capability
    - Include Mermaid component diagram, ≥2 code examples, Common Mistakes section
    - _Requirements: 3.4, 3.5, 12.1, 12.3, 12.4, 12.5_

- [x] 3. Generate Architecture Foundation documents (05–09)
  - [x] 3.1 Create `05-architecture-philosophy.md`
    - Problem statement, rationale (≥2 benefits per pattern), layer dependency Mermaid diagram, dependency rules
    - Reference actual codebase structure in `src/`
    - Include ≥2 code examples, Common Mistakes section
    - _Requirements: 4.1, 12.1, 12.2, 12.3, 12.4, 12.5, 13.2_

  - [x] 3.2 Create `06-technology-decisions.md`
    - Document 9 technology choices in consistent format: name, purpose, ≥2 alternatives considered, ≥2 reasons for selection
    - Include Mermaid diagram showing technology stack layers
    - Include ≥2 code examples, Common Mistakes section
    - _Requirements: 4.2, 12.1, 12.3, 12.4, 12.5_

  - [x] 3.3 Create `07-clean-architecture-explained.md`
    - Document 4 layers (Domain, Application, Infrastructure, API): purpose, dependency rules, ≥2 actual class examples with file paths
    - Include Mermaid diagram showing layer boundaries
    - Include ≥2 code examples from actual codebase, Common Mistakes section
    - _Requirements: 4.3, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2_

  - [x] 3.4 Create `08-cqrs-and-mediatr.md`
    - CQRS concept, MediatR implementation explanation
    - ≥1 complete command example (command + validator + handler) from Land Acquisition with file paths
    - ≥1 query example (query + handler) with file paths
    - Include Mermaid sequence diagram, Common Mistakes section
    - _Requirements: 4.4, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2_

  - [x] 3.5 Create `09-ngrx-and-state-management.md`
    - NgRx architecture overview (store, actions, reducers, effects, selectors)
    - ≥1 actual actions file, ≥1 reducer, ≥1 effects, ≥1 selectors example with file paths
    - Include Mermaid data flow diagram, Common Mistakes section
    - _Requirements: 4.5, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2_

- [x] 4. Checkpoint — Validate first 9 documents
  - Run validation script against `docs/academy/` for documents 01–09
  - Verify file naming, section structure, Mermaid diagrams, code examples, link integrity
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Generate Cross-Cutting Framework documents (10–17)
  - [x] 5.1 Create `10-cross-cutting-framework.md`
    - Overview of 7 shared infrastructure components
    - Mermaid component diagram showing dependencies and data flow between frameworks
    - Codebase Location section, Integration Steps section
    - Include ≥2 code examples, Common Mistakes section
    - _Requirements: 5.1, 5.9, 12.1, 12.3, 12.4, 12.5_

  - [x] 5.2 Create `11-security-framework.md`
    - Authentication (JWT), authorization (RBAC), guards, policies, role hierarchy
    - ≥3 code examples: protecting controller endpoint, defining policy, frontend route guard
    - Codebase Location section, Integration Steps section
    - Include Mermaid diagram, Common Mistakes section
    - _Requirements: 5.2, 5.9, 5.10, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2_

  - [x] 5.3 Create `12-search-framework.md`
    - Global search architecture, ISearchProvider interface, field weights, scoring, result presentation
    - ≥3 code examples: implementing ISearchProvider, registering provider in DI, rendering search results frontend
    - Codebase Location section, Integration Steps section
    - Include Mermaid diagram, Common Mistakes section
    - _Requirements: 5.3, 5.9, 5.10, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2_

  - [x] 5.4 Create `13-notification-framework.md`
    - Notification system architecture, real-time delivery, email, module integration
    - ≥2 code examples: triggering notification from command handler
    - Codebase Location section, Integration Steps section
    - Include Mermaid diagram, Common Mistakes section
    - _Requirements: 5.4, 5.9, 5.10, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2_

  - [x] 5.5 Create `14-audit-framework.md`
    - Audit trail system, interceptor middleware, captured data, querying audit data
    - ≥2 code examples: audit interceptor configuration, audit query
    - Codebase Location section, Integration Steps section
    - Include Mermaid diagram, Common Mistakes section
    - _Requirements: 5.5, 5.9, 5.10, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2_

  - [x] 5.6 Create `15-document-framework.md`
    - File upload, storage, download, document types, integration patterns
    - ≥2 code examples: integrating file upload into entity workflow
    - Codebase Location section, Integration Steps section
    - Include Mermaid diagram, Common Mistakes section
    - _Requirements: 5.6, 5.9, 5.10, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2_

  - [x] 5.7 Create `16-state-machines.md`
    - Status transitions, workflow engines, valid transition rules
    - Mermaid state diagrams for each implemented state machine (Opportunity, Offer, DueDiligence, Contract)
    - ≥2 code examples: defining state machine, validating transition
    - Codebase Location section, Integration Steps section
    - Common Mistakes section
    - _Requirements: 5.7, 5.9, 5.10, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2, 13.4_

  - [x] 5.8 Create `17-error-handling-framework.md`
    - Exception middleware, structured error responses, validation error formatting, frontend error handling
    - ≥2 code examples: backend exception handler, frontend HTTP error interceptor
    - Codebase Location section, Integration Steps section
    - Include Mermaid diagram, Common Mistakes section
    - _Requirements: 5.8, 5.9, 5.10, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2_

- [x] 6. Generate Reusable Components and Module Pattern documents (18–19)
  - [x] 6.1 Create `18-reusable-components.md`
    - Document shared design system component library with table of contents and summary table
    - List every reusable component from `client-app/src/app/shared/design-system/` and `client-app/src/app/shared/components/`
    - For each: selector, purpose, @Input() properties (name, type, default), @Output() events, usage example
    - Group by design-system subdirectory category
    - Include Mermaid component hierarchy diagram
    - Common Mistakes section
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 12.1, 12.3, 12.4, 12.5, 13.2_

  - [x] 6.2 Create `19-module-pattern.md`
    - Standard implementation pattern: Domain, Application, Infrastructure, API layers
    - Annotated backend folder structure (≥3 levels deep)
    - Annotated frontend folder structure (≥3 levels deep)
    - Full_Stack_Trace for create operation (≥8 steps through all layers)
    - Full_Stack_Trace for read/list operation (≥7 steps through all layers)
    - Include Mermaid sequence diagram, Common Mistakes section
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2, 14.1, 14.2, 14.3_

- [x] 7. Checkpoint — Validate documents 10–19
  - Run validation script against all generated documents
  - Verify cross-cutting framework docs have Codebase Location and Integration Steps sections
  - Verify reusable components doc references actual file paths
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Generate Module Deep-Dive documents (20–23)
  - [x] 8.1 Create `20-land-acquisition-deep-dive.md`
    - Module overview, data model, state machine, backend operations, API layer, frontend state management, UI components, cross-cutting integrations
    - Trace ≥3 operations (create, read-list, status-transition) through all layers with actual code snippets and file paths
    - Include ≥3 Mermaid diagrams: entity state machine, data model relationships, end-to-end request flow
    - Document search, notification, audit, permissions, reporting integration
    - Include Full_Stack_Trace with sequence diagram, error-path trace
    - Common Mistakes section
    - _Requirements: 8.1, 8.5, 8.6, 8.7, 8.8, 8.9, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.4, 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 8.2 Create `21-planning-deep-dive.md`
    - Same section structure as Land Acquisition deep-dive
    - Trace ≥3 operations through all layers with actual code and file paths
    - Include ≥3 Mermaid diagrams, cross-cutting integration documentation
    - Include Full_Stack_Trace with sequence diagram, error-path trace
    - Common Mistakes section
    - _Requirements: 8.2, 8.5, 8.6, 8.7, 8.8, 8.9, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2, 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 8.3 Create `22-legal-compliance-deep-dive.md`
    - Same section structure as Land Acquisition deep-dive
    - Trace ≥3 operations through all layers with actual code and file paths
    - Include ≥3 Mermaid diagrams, cross-cutting integration documentation
    - Include Full_Stack_Trace with sequence diagram, error-path trace
    - Common Mistakes section
    - _Requirements: 8.3, 8.5, 8.6, 8.7, 8.8, 8.9, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2, 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 8.4 Create `23-user-management-deep-dive.md`
    - Same section structure as Land Acquisition deep-dive
    - Trace ≥3 operations through all layers with actual code and file paths
    - Include ≥3 Mermaid diagrams, cross-cutting integration documentation
    - Include Full_Stack_Trace with sequence diagram, error-path trace
    - Common Mistakes section
    - _Requirements: 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 12.1, 12.3, 12.4, 12.5, 13.1, 13.2, 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 9. Generate Playbook document (24)
  - [x] 9.1 Create `24-how-to-build-the-next-module.md`
    - Sequential step-by-step guide with ≥8 numbered phases, each specifying artifacts and prerequisite phases
    - Numbered checklist in 3 ordered sections: Backend, Frontend, Cross-Cutting — each item names specific file/registration
    - ≥3 Mermaid decision tree diagrams: when to use state machine, when to add approval workflow, when to add search provider
    - Reference Definition of Done criteria from implementation-plan and search-mandatory-governance
    - Include Common Mistakes section
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 12.1, 12.3, 12.4, 12.5_

- [x] 10. Generate Quality and Process documents (25–28)
  - [x] 10.1 Create `25-definition-of-done.md`
    - ≥8 criteria organized by: backend build/tests, frontend build/tests, API/validation, authorization/audit, UI states, documentation, code review
    - Include Mermaid diagram, ≥2 code examples, Common Mistakes section
    - _Requirements: 10.1, 12.1, 12.3, 12.4, 12.5_

  - [x] 10.2 Create `26-common-mistakes.md`
    - ≥5 anti-patterns covering backend (C#, EF Core, MediatR) and frontend (Angular, NgRx, TypeScript)
    - Each with before (incorrect) and after (correct) code examples
    - Include Mermaid diagram, Common Mistakes section
    - _Requirements: 10.2, 12.1, 12.3, 12.4, 12.5_

  - [x] 10.3 Create `27-code-review-checklist.md`
    - ≥3 pass/fail items per category: backend, frontend, security, performance, architecture
    - Include Mermaid diagram, ≥2 code examples, Common Mistakes section
    - _Requirements: 10.3, 12.1, 12.3, 12.4, 12.5_

  - [x] 10.4 Create `28-debugging-guide.md`
    - Structured diagnostic for 6 layers: SQL, EF Core, MediatR, API, Angular, NgRx
    - Each with ≥1 step-by-step scenario (symptom, diagnostic steps, resolution)
    - Include Mermaid diagram, ≥2 code examples, Common Mistakes section
    - _Requirements: 10.4, 12.1, 12.3, 12.4, 12.5_

- [x] 11. Generate Testing and Production Readiness documents (29–31)
  - [x] 11.1 Create `29-testing-strategy.md`
    - Testing philosophy with ≥1 complete code example per category: command handler tests, validator tests, state transition tests, Angular component tests, NgRx reducer tests, integration tests
    - AAA pattern with naming convention `MethodName_Scenario_ExpectedResult`
    - Coverage expectations section: 90% business logic, 100% validators, 80% API integration, 70% frontend critical-path
    - Include Mermaid diagram, Common Mistakes section
    - _Requirements: 11.1, 11.2, 11.5, 12.1, 12.3, 12.4, 12.5_

  - [x] 11.2 Create `30-production-readiness.md`
    - Verifiable checklist per category: health checks, structured logging, monitoring, performance benchmarks, security hardening, deployment
    - Performance targets: <300ms API, <200ms health, <500ms reports
    - ≥5 items per deployment checklist category
    - Include Mermaid diagram, ≥2 code examples, Common Mistakes section
    - _Requirements: 11.3, 12.1, 12.3, 12.4, 12.5_

  - [x] 11.3 Create `31-future-roadmap.md`
    - 14 core modules in recommended implementation order
    - For each: shared data entities consumed, interface contracts to expose, extension points to preserve
    - Include Mermaid diagram showing module dependency order, Common Mistakes section
    - _Requirements: 11.4, 12.1, 12.3, 12.4, 12.5_

- [x] 12. Generate Learning Path document (00)
  - [x] 12.1 Create `00-learning-path.md`
    - Define reading sequence in 3–5 progressive learning phases with title, purpose (1–2 sentences), document list
    - Prerequisites per phase (1–5 items)
    - Estimated reading time per document (word count ÷ 200, rounded up)
    - Mermaid flowchart (`graph TD` or `graph LR`) showing learning progression with document nodes and directed edges
    - Mark any non-existent documents with 🚧 Planned
    - Common Mistakes section
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 12.1, 12.3, 12.5_

- [x] 13. Final validation and link resolution
  - [x] 13.1 Run full validation script against all 32 documents
    - Verify exactly 32 files with correct naming in `docs/academy/`
    - Verify all inter-document relative links resolve
    - Verify all code examples have language identifiers and ≥3 lines
    - Verify all documents have WHY/WHAT/HOW/WHEN/WHERE/WHO/WHAT NEXT sections
    - Verify all documents have ≥1 Mermaid diagram and ≥2 code examples
    - Verify all documents have Common Mistakes section
    - Generate validation report with pass/fail per check
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.1, 12.3, 12.4, 12.5_

  - [x] 13.2 Run codebase accuracy checks
    - Verify all referenced file paths exist in the repository
    - Verify all referenced class names exist in the codebase
    - Flag unverified references with warning annotations
    - Mark planned/unimplemented features with "Planned — Not Yet Implemented" callout
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 13.3 Fix broken links and resolve validation errors
    - Fix any broken inter-document links reported by validation
    - Add missing sections or content where minimums are not met
    - Ensure reading time estimates are calculated for all documents
    - _Requirements: 1.4, 1.5, 2.4, 12.1, 12.3, 12.4_

- [x] 14. Final checkpoint — Ensure all validation passes
  - Run complete validation suite (structural + content accuracy)
  - Verify all 32 documents meet Definition of Done criteria from design
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Document 00 (learning-path) is generated last because it aggregates metadata (reading times, existence checks) from all other documents
- The validation script is TypeScript and can be run with `npx ts-node scripts/validate-academy.ts`
- Documents are generated in dependency order matching the design's generation strategy
- No property-based tests are included — the design explicitly states PBT does not apply to this feature (static markdown generation has no pure functions with universal invariants)
- Unit tests validate the structural validation script only

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8"] },
    { "id": 5, "tasks": ["6.1", "6.2"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3", "8.4"] },
    { "id": 7, "tasks": ["9.1"] },
    { "id": 8, "tasks": ["10.1", "10.2", "10.3", "10.4"] },
    { "id": 9, "tasks": ["11.1", "11.2", "11.3"] },
    { "id": 10, "tasks": ["12.1"] },
    { "id": 11, "tasks": ["13.1", "13.2"] },
    { "id": 12, "tasks": ["13.3"] }
  ]
}
```
