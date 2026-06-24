# Requirements Document

## Introduction

BuildEstate Pro Academy is an internal developer onboarding and study guide system — a structured `docs/academy/` folder containing 32 markdown documents that serve as a comprehensive engineering university. The goal is to enable a senior developer joining the team to become fully productive without needing another developer sitting beside them. Each document uses a mentoring style with real code examples from the actual codebase, Mermaid diagrams, and full-stack tracing through all architectural layers.

## Glossary

- **Academy**: The complete set of 32 structured markdown documents located in `docs/academy/`
- **Learning_Path**: The document (00-learning-path.md) that defines the recommended study sequence and progression order
- **Deep_Dive_Document**: A document that traces through all architectural layers for a specific module, from database through to user experience
- **Framework_Document**: A document explaining a cross-cutting platform capability (security, search, notifications, audit, etc.)
- **Architecture_Document**: A document explaining architectural patterns, philosophy, or technology decisions
- **Code_Example**: A code snippet extracted from or verified against the actual BuildEstate Pro codebase
- **Mermaid_Diagram**: A diagram rendered from Mermaid syntax showing architecture, data flow, state machines, or request flows
- **Full_Stack_Trace**: An explanation that follows a request through all layers: Database → Entity → DTO → Command → Handler → Controller → API → Angular Service → NgRx → Component → User Experience
- **Document_Generator**: The system or process responsible for creating and maintaining academy documents

## Requirements

### Requirement 1: Academy Folder Structure

**User Story:** As a new developer, I want all onboarding documentation in a single, well-organized folder, so that I can find everything I need without searching across multiple locations.

#### Acceptance Criteria

1. THE Document_Generator SHALL create a `docs/academy/` folder at the repository root containing exactly 32 markdown files, each with a `.md` extension and non-empty content of at least one markdown heading (level 1 or 2)
2. THE Document_Generator SHALL name each file with a two-digit numeric prefix (00–31), followed by a hyphen, followed by a kebab-case descriptive name between 3 and 50 lowercase alphanumeric characters (plus hyphens), ending with the `.md` extension (e.g., `00-learning-path.md`, `01-business-vision.md`)
3. THE Document_Generator SHALL number files from 00 to 31 in sequential order matching the document catalog defined in the project's specification or configuration source, with no gaps or duplicates in the numeric sequence
4. WHEN a document references another academy document, THE Document_Generator SHALL use a relative markdown link in the format `[link text](./target-filename.md)` where `target-filename.md` corresponds to an existing file within the same `docs/academy/` directory
5. IF a relative markdown link in an academy document references a target file that does not exist in `docs/academy/`, THEN THE Document_Generator SHALL treat this as a generation error and report the broken reference including the source filename and the unresolved target filename

### Requirement 2: Learning Path Document

**User Story:** As a new developer, I want a clear learning path that tells me what to read and in what order, so that I can progressively build understanding without getting lost.

#### Acceptance Criteria

1. THE Document_Generator SHALL create `00-learning-path.md` as the first document in the academy output directory
2. THE Learning_Path SHALL define a recommended reading sequence grouped into no fewer than 3 and no more than 5 progressive learning phases, where each phase has a title, a purpose statement of 1–2 sentences, and a numbered list of documents to read in order
3. THE Learning_Path SHALL explain prerequisites for each phase by listing the specific concepts or knowledge the reader must understand before starting that phase, with at least 1 and no more than 5 prerequisite items per phase
4. THE Learning_Path SHALL estimate reading time for each document in whole minutes (minimum 1 minute), calculated at a rate of 200 words per minute rounded up to the nearest minute
5. THE Learning_Path SHALL include a Mermaid flowchart diagram (using `graph TD` or `graph LR` syntax) showing the learning progression with nodes representing documents and directed edges representing reading-order dependencies
6. IF a document referenced in the learning path does not yet exist, THEN THE Learning_Path SHALL mark that entry with a visual indicator (e.g., "🚧 Planned") and omit it from the Mermaid dependency diagram

### Requirement 3: Business Context Documents

**User Story:** As a new developer, I want to understand the business domain, users, and platform vision before diving into code, so that my technical decisions are informed by business context.

#### Acceptance Criteria

1. THE Document_Generator SHALL create `01-business-vision.md` containing the following sections: the problem BuildEstate Pro solves, the target market (real estate developers managing full project lifecycles), the business value delivered (listed as specific value propositions), and the platform's position across the 14 core modules
2. THE Document_Generator SHALL create `02-property-development-lifecycle.md` explaining all 9 phases of the business lifecycle (Opportunity, Due Diligence, Planning, Design & Prep, Construction, Sales & Marketing, Completion, Operations, Analysis), including for each phase: a description of the business activities performed, the key roles involved, and the data handed over to the next phase, with a Mermaid diagram showing phase transitions and their sequential dependencies
3. THE Document_Generator SHALL create `03-users-and-personas.md` documenting all 12 platform roles (Acquisition Manager, Legal & Compliance Officer, Planning Manager, Project Manager, Site Manager, Sales Manager, Completion Manager, Property Manager, Finance Director, Valuation Analyst, Surveyor/Consultant, Admin/Support), including for each role: primary responsibilities, the modules they interact with, and their key workflows within the platform
4. THE Document_Generator SHALL create `04-enterprise-capabilities.md` describing all cross-cutting platform capabilities (RBAC, workflow engine, document management, notifications, audit, search), including for each capability: its business purpose, which modules consume it, and how it integrates into the overall platform — without covering implementation details reserved for the framework deep-dive documents (documents 10–17)
5. WHEN documenting business context in any of the 4 documents, THE Document_Generator SHALL focus on business-level concepts (what the platform does and why) rather than technical implementation details (how the code works), so that a non-technical stakeholder could also benefit from the content

### Requirement 4: Architecture Foundation Documents

**User Story:** As a new developer, I want to understand architectural decisions and their rationale before reading code, so that I can understand why the code is structured the way it is.

#### Acceptance Criteria

1. THE Document_Generator SHALL create `05-architecture-philosophy.md` containing sections for: (a) problem statement describing what challenges Clean Architecture, CQRS, and feature-based organization solve, (b) a rationale section with at least 2 specific benefits per pattern choice, (c) a Mermaid diagram showing the layer dependency flow between Domain, Application, Infrastructure, and API layers, and (d) a summary of dependency rules (which layer may reference which)
2. THE Document_Generator SHALL create `06-technology-decisions.md` documenting each of the 9 technology choices (ASP.NET Core, Angular 20, NgRx, MediatR, FluentValidation, EF Core, SQL Server, Tailwind, DaisyUI) in a consistent format containing: technology name, purpose in the platform, at least 2 alternatives that were considered, and at least 2 reasons for selection over those alternatives
3. THE Document_Generator SHALL create `07-clean-architecture-explained.md` providing for each of the 4 layers (Domain, Application, Infrastructure, API) a section containing: layer purpose, dependency rules, at least 2 actual class examples from the codebase with their file paths relative to the `src/` directory, and an explanation of what each example class demonstrates
4. THE Document_Generator SHALL create `08-cqrs-and-mediatr.md` explaining the Command/Query pattern with sections for: (a) CQRS concept and how MediatR implements it, (b) at least 1 complete command example from the Land Acquisition module showing the command class, its validator, and its handler with file paths, and (c) at least 1 query example showing the query class and handler with file paths
5. THE Document_Generator SHALL create `09-ngrx-and-state-management.md` explaining frontend state management with sections for: (a) NgRx architecture overview (store, actions, reducers, effects, selectors), (b) at least 1 actual actions file example, (c) at least 1 actual reducer example, (d) at least 1 actual effects example, and (e) at least 1 actual selectors example, each referenced by file path relative to `client-app/src/`

### Requirement 5: Cross-Cutting Framework Documents

**User Story:** As a new developer, I want detailed documentation of every shared framework component, so that I know how to integrate security, search, notifications, audit, documents, state machines, and error handling into any module I build.

#### Acceptance Criteria

1. THE Document_Generator SHALL create `10-cross-cutting-framework.md` providing an overview of all 7 shared infrastructure components (security, search, notifications, audit, documents, state machines, error handling) with a Mermaid component diagram showing dependencies and data flow between frameworks
2. THE Document_Generator SHALL create `11-security-framework.md` explaining authentication (JWT), authorization (RBAC), guards, policies, and role hierarchy with a minimum of 3 code examples from the actual auth implementation, including at least one example each for: protecting a controller endpoint, defining a policy, and checking roles in a frontend route guard
3. THE Document_Generator SHALL create `12-search-framework.md` explaining global search architecture, the ISearchProvider interface, field weights, scoring algorithms, and result presentation with a minimum of 3 code examples including at least one example each for: implementing ISearchProvider for a new entity, registering a provider in DI, and rendering search results on the frontend
4. THE Document_Generator SHALL create `13-notification-framework.md` explaining the notification system architecture, real-time delivery, email notifications, and how modules integrate with a minimum of 2 code examples including at least one example showing how a module triggers a notification from a command handler
5. THE Document_Generator SHALL create `14-audit-framework.md` explaining the audit trail system, the audit interceptor middleware, what is captured (user, timestamp, action, entity, old value, new value), and how to query audit data with a minimum of 2 code examples including at least one example showing the audit interceptor configuration and one showing an audit query
6. THE Document_Generator SHALL create `15-document-framework.md` explaining file upload, storage, download, document types, and integration patterns with a minimum of 2 code examples including at least one example showing how a module integrates file upload into an entity workflow
7. THE Document_Generator SHALL create `16-state-machines.md` explaining status transitions, workflow engines, valid transition rules, and how state machines are implemented with Mermaid state diagrams for each implemented state machine (Opportunity, Offer, DueDiligence, Contract) and a minimum of 2 code examples showing how to define a new state machine and how to validate a transition
8. THE Document_Generator SHALL create `17-error-handling-framework.md` explaining the exception middleware, structured error responses, validation error formatting, and frontend error handling patterns with a minimum of 2 code examples including at least one backend exception handler example and one frontend HTTP error interceptor example
9. WHEN generating any cross-cutting framework document (criteria 1-8), THE Document_Generator SHALL include a "Codebase Location" section listing the namespace and file path of each relevant class, and an "Integration Steps" section providing a numbered checklist a developer follows to integrate that framework into a new module
10. IF a framework component referenced in criteria 1-8 does not yet have an actual implementation in the codebase, THEN THE Document_Generator SHALL mark that section as "Planned — Not Yet Implemented" and document the intended integration pattern based on the architecture design documents

### Requirement 6: Reusable Components Document

**User Story:** As a new developer, I want to know what UI building blocks already exist, so that I reuse existing components instead of creating duplicates.

#### Acceptance Criteria

1. THE Document_Generator SHALL create `18-reusable-components.md` documenting the shared design system component library, organized with a table of contents listing all component categories and a summary table of all components with their selectors
2. THE Document_Generator SHALL list every reusable component found within `client-app/src/app/shared/design-system/` and `client-app/src/app/shared/components/` with its selector, purpose (1–3 sentences), all `@Input()` properties (name, type, default value), all `@Output()` events (name, emitted type), and a usage example showing the component's template tag with at least 2 bound inputs
3. THE Document_Generator SHALL group components by their design-system subdirectory category (e.g., badges, forms, loading, tables) with each category introduced by a heading and a 1–2 sentence description of the category's purpose
4. THE Document_Generator SHALL include a Mermaid diagram showing the component hierarchy organized by category, indicating parent-child composition relationships (where one component renders another) and shared base class inheritance relationships
5. WHEN a component exists in `client-app/src/app/shared/`, THE Document_Generator SHALL reference its actual file path relative to the repository root and document its public interface as declared in its TypeScript class (all `@Input()` and `@Output()` decorators with their TypeScript types)
6. IF a component within scope has no `@Input()` or `@Output()` properties, THEN THE Document_Generator SHALL still document it with its selector, file path, and purpose, noting that it has no configurable inputs or emitted outputs

### Requirement 7: Module Pattern Document

**User Story:** As a new developer, I want to understand the standard pattern every module follows, so that I can implement new modules consistently without inventing a new structure each time.

#### Acceptance Criteria

1. THE Document_Generator SHALL create `19-module-pattern.md` documenting the standard implementation pattern for all modules, covering at minimum: Domain layer (entities, enums, events, exceptions), Application layer (commands, queries, handlers, validators, DTOs, mappings), Infrastructure layer (EF Core configurations, DbContext registration, migrations), and API layer (controllers, middleware)
2. THE Document_Generator SHALL show the backend folder structure for a module as an annotated directory tree at least 3 levels deep from the feature root, with a one-line description of each folder's purpose, including folders for entities, commands (with sub-folders per operation containing command, handler, and validator files), queries (with sub-folders per operation), DTOs, mappings, and controllers
3. THE Document_Generator SHALL show the frontend folder structure for a module as an annotated directory tree at least 3 levels deep from the feature root, with a one-line description of each folder's purpose, including folders for containers (pages), components, services, store (actions, reducer, effects, selectors, state), models, guards, and the routes file
4. THE Document_Generator SHALL include a Full_Stack_Trace showing a create operation as a numbered sequential list of at least 8 steps covering: user action in the UI component, NgRx action dispatch and effect, API service HTTP call, controller receiving the request, MediatR dispatching to validator then command handler, EF Core persisting to database, and the response propagating back through each layer to the UI update
5. THE Document_Generator SHALL include a Full_Stack_Trace showing a read operation (list with filtering, sorting, and pagination) as a numbered sequential list of at least 7 steps covering: user action or page load trigger, NgRx action dispatch and effect, API service HTTP call with query parameters, controller receiving the request, MediatR dispatching to query handler, EF Core query with AsNoTracking and projection, and the paginated response propagating back through each layer to the UI rendering

### Requirement 8: Module Deep-Dive Documents

**User Story:** As a new developer, I want complete walkthroughs of implemented modules that trace every feature through all layers, so that I can see the pattern applied in practice.

#### Acceptance Criteria

1. THE Document_Generator SHALL create `20-land-acquisition-deep-dive.md` providing a walkthrough of the Land Acquisition module that covers module overview, data model, state machine, backend operations, API layer, frontend state management, UI components, and cross-cutting integrations
2. THE Document_Generator SHALL create `21-planning-deep-dive.md` providing a walkthrough of the Planning & Approvals module using the same section structure as the Land Acquisition deep-dive
3. THE Document_Generator SHALL create `22-legal-compliance-deep-dive.md` providing a walkthrough of the Legal & Compliance module using the same section structure as the Land Acquisition deep-dive
4. THE Document_Generator SHALL create `23-user-management-deep-dive.md` providing a walkthrough of the User Management module using the same section structure as the Land Acquisition deep-dive
5. WHEN documenting a module, THE Document_Generator SHALL trace at least three operations (create, read-list, status-transition) through each architectural layer: domain entity, command/query handler, validator, controller, Angular service, NgRx store (actions, effects, selectors), and component — including code snippets from the actual codebase for each layer
6. WHEN documenting a module, THE Document_Generator SHALL include at least three Mermaid diagrams: one for the entity state machine, one for data model relationships, and one for end-to-end request flow from UI action to database and back
7. WHEN documenting a module, THE Document_Generator SHALL document search integration, notification integration, audit integration, permissions, and reporting for that module — specifying for each integration the configuration used, the relevant source file locations, and the observable behavior produced
8. WHEN a deep-dive document references code from the codebase, THE Document_Generator SHALL include the source file path above each code snippet so a developer can locate the original file
9. IF a module does not implement one of the required integrations (search, notifications, audit, permissions, reporting), THEN THE Document_Generator SHALL state that the integration is not yet implemented for that module rather than omitting the section

### Requirement 9: Build-the-Next-Module Playbook

**User Story:** As a developer tasked with building a new module, I want a step-by-step playbook that tells me exactly what to create and in what order, so that I can deliver a compliant module without missing anything.

#### Acceptance Criteria

1. THE Document_Generator SHALL create `24-how-to-build-the-next-module.md` providing a sequential step-by-step guide of at least 8 numbered phases for building a new module from scratch, where each phase specifies the artifacts to produce and which prior phases must be complete before it can begin
2. THE Document_Generator SHALL include a numbered checklist covering items grouped into three ordered sections — Backend (domain entities, EF configuration, migration, DTOs, commands, queries, validators, handlers, controller, authorization, audit), Frontend (Angular routes, pages, components, NgRx store, service), and Cross-Cutting (search provider registration, notification integration, documentation) — where each item names the specific file or registration that constitutes its deliverable
3. THE Document_Generator SHALL include at least 3 decision trees rendered as Mermaid diagrams for the following implementation questions: when to use a state machine, when to add an approval workflow, and when to add a search provider, where each decision tree begins with a yes/no question and terminates at a concrete action or "not needed" outcome
4. THE Document_Generator SHALL reference the Definition of Done criteria by listing each verifiable condition from the project's implementation-plan and search-mandatory-governance standards (backend builds, frontend builds, tests pass, API endpoints exist, validators exist, authorization exists, audit trail exists, search provider registered, documentation updated) that must be satisfied before a module is considered complete
5. WHEN a developer completes all checklist items across the three sections and all Definition of Done criteria are satisfied, THE Document_Generator SHALL state that the module may proceed to pull request review

### Requirement 10: Quality and Process Documents

**User Story:** As a developer, I want clear definitions of done, common mistakes to avoid, code review expectations, and debugging guidance, so that I consistently produce high-quality work.

#### Acceptance Criteria

1. THE Document_Generator SHALL create `25-definition-of-done.md` listing at least 8 criteria that must be met before a feature is considered complete, organized into the following categories: backend build and tests, frontend build and tests, API endpoints and validation, authorization and audit logging, UI states (loading, empty, error), documentation, and code review approval
2. THE Document_Generator SHALL create `26-common-mistakes.md` documenting at least 5 anti-patterns observed in the codebase, covering both backend (C#, EF Core, MediatR) and frontend (Angular, NgRx, TypeScript) layers, with each anti-pattern containing a before code example showing the incorrect approach and an after code example showing the correct approach
3. THE Document_Generator SHALL create `27-code-review-checklist.md` containing at least 3 pass/fail checklist items for each of the following categories: backend (CQRS, validation, async patterns), frontend (component architecture, state management, reactive forms), security (authorization, input validation, data exposure), performance (query efficiency, change detection, pagination), and architecture (SOLID principles, layer separation, dependency flow)
4. THE Document_Generator SHALL create `28-debugging-guide.md` containing a structured diagnostic section for each of the following 6 layers: SQL, EF Core, MediatR, API, Angular, and NgRx, where each section includes at least one step-by-step troubleshooting scenario with the symptom, diagnostic steps, and resolution

### Requirement 11: Testing and Production Readiness Documents

**User Story:** As a developer, I want clear testing strategy and production readiness guidance, so that I know how to test my code and what is needed before going live.

#### Acceptance Criteria

1. THE Document_Generator SHALL create `29-testing-strategy.md` documenting the testing philosophy with at least 1 complete code example per category for: command handler tests (using xUnit, Moq, FluentAssertions), validator tests (using FluentValidation test extensions), state transition tests, Angular component tests (using Jasmine/Karma), NgRx reducer tests, and integration tests (using WebApplicationFactory)
2. THE Document_Generator SHALL include the AAA (Arrange-Act-Assert) pattern with naming convention `MethodName_Scenario_ExpectedResult` in all test examples and shall document test isolation rules requiring independent tests with no shared mutable state
3. THE Document_Generator SHALL create `30-production-readiness.md` containing a verifiable checklist for each category: health checks (specifying the `/health` endpoint and checks for database connectivity, external API availability, file storage, and memory/CPU thresholds), structured logging (specifying log levels, correlation IDs, and audit log format), monitoring (specifying request duration, error rate, and active user metrics), performance benchmarks (specifying target response times: less than 300ms for standard API calls, less than 200ms for health checks, less than 500ms for report generation), security hardening (referencing HTTPS enforcement, CORS, rate limiting, input validation, and header policies), and a deployment checklist with at least 5 items per category
4. THE Document_Generator SHALL create `31-future-roadmap.md` documenting the 14 core platform modules in their recommended implementation order, specifying for each upcoming module: the shared data entities it will consume, the interface contracts current code should expose, and the extension points developers should preserve to avoid breaking changes during integration
5. THE Document_Generator SHALL include in `29-testing-strategy.md` a coverage expectations section specifying minimum targets: 90% for business logic handlers, 100% for validators, 80% for API endpoint integration tests, and 70% for frontend critical-path components

### Requirement 12: Document Content Quality Standards

**User Story:** As a new developer reading academy documents, I want consistently high-quality content that teaches me through explanation and examples, so that I can learn effectively without external help.

#### Acceptance Criteria

1. WHEN creating any academy document, THE Document_Generator SHALL structure content into the following named sections in order: WHY (rationale for the concept), WHAT (concept definition), HOW (implementation steps), WHEN (timing and conditions for use), WHERE (location in codebase), WHO (responsible roles), and WHAT NEXT (next steps), with each section containing at least one paragraph of explanatory content
2. WHEN creating any academy document, THE Document_Generator SHALL structure explanations so that each section builds only on concepts already introduced in preceding sections, beginning with foundational context before presenting implementation details, and introducing no term or concept without first defining it or referencing a prior section where it was defined
3. WHEN creating any academy document, THE Document_Generator SHALL include at least one syntactically valid Mermaid diagram selected from: architecture diagram, data flow, state machine, sequence diagram, or request flow, where the diagram type corresponds to the dominant concept being taught (architecture for structural topics, sequence for interaction topics, state machine for lifecycle topics, data flow for pipeline topics)
4. WHEN creating any academy document, THE Document_Generator SHALL include at least 2 code examples per document, each formatted with a markdown fenced code block specifying the language identifier (csharp, typescript, sql, or json), each containing at least 3 lines of code, and each preceded by a sentence explaining what the example demonstrates
5. WHEN creating any academy document, THE Document_Generator SHALL include a "Common Mistakes" section containing at least 2 anti-patterns specific to that topic, where each anti-pattern includes a description of the mistake, a code example or scenario showing the incorrect approach, an explanation of why it is wrong, and a corrected code example or scenario showing the proper approach
6. IF a topic has no known anti-patterns or fewer than 2 documented mistakes, THEN THE Document_Generator SHALL include a "Common Mistakes" section stating that no common mistakes have been identified for this topic and instead providing at least 2 cautionary guidelines for avoiding future issues

### Requirement 13: Codebase Accuracy

**User Story:** As a new developer, I want documentation that accurately reflects the actual codebase rather than theoretical descriptions, so that I can trust what I read and immediately apply it.

#### Acceptance Criteria

1. WHEN including a Code_Example, THE Document_Generator SHALL verify that every class name, method name, and method signature referenced in the example exists in the repository, and SHALL NOT include fabricated or hypothetical type names
2. WHEN referencing a file path, THE Document_Generator SHALL use the actual file path as it exists in the repository structure (`src/BuildEstate.Domain/`, `src/BuildEstate.Application/`, `src/BuildEstate.Infrastructure/`, `src/BuildEstate.API/`, `src/BuildEstate.Shared/`, `client-app/src/app/`)
3. WHEN documenting an API endpoint, THE Document_Generator SHALL reference the actual controller class name and route pattern from the codebase
4. WHEN documenting a state machine, THE Document_Generator SHALL use the actual status values and valid transitions as defined in the domain entities
5. IF a feature described in a document is planned but not yet implemented, THEN THE Document_Generator SHALL mark it with a callout block containing the label "Planned — Not Yet Implemented" that is visually separated from surrounding content using a distinct background or border
6. IF the Document_Generator cannot verify a Code_Example or file path against the repository, THEN THE Document_Generator SHALL flag the unverified reference with a warning annotation indicating it requires manual verification before publication

### Requirement 14: Full-Stack Tracing in Deep Dives

**User Story:** As a new developer, I want to follow a single operation from user action to database and back through every layer, so that I understand how all the pieces connect.

#### Acceptance Criteria

1. WHEN documenting a Full_Stack_Trace, THE Document_Generator SHALL show the complete path as a numbered list with one entry per layer: User Action → Angular Component → NgRx Action → Effect → Angular Service → HTTP Request → API Controller → MediatR Command/Query → Handler → Entity Framework → SQL Database → Response DTO → HTTP Response → Effect Success Action → Reducer → Selector → Component Update → User Feedback
2. WHEN documenting a Full_Stack_Trace, THE Document_Generator SHALL include a Mermaid sequence diagram (using `sequenceDiagram` syntax) with participants for: User, Component, Store, Effect, Service, API, Handler, Database — showing message arrows for the request path and return path
3. WHEN documenting a Full_Stack_Trace, THE Document_Generator SHALL include actual class names and method signatures from the codebase at each layer, referenced by file path
4. THE Document_Generator SHALL include at minimum one Full_Stack_Trace per Deep_Dive_Document for a create operation and one for a list/query operation
5. WHEN documenting a Full_Stack_Trace, THE Document_Generator SHALL include at least one error-path trace showing how a validation failure or exception propagates from the handler back through each layer to the user-facing error message in the UI
