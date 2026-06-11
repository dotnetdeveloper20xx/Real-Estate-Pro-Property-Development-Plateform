# BuildEstate Pro — Architecture Document

## Architecture Style
**Clean Architecture** with **CQRS** pattern, organized by **feature slices**.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                        │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │  Angular 20 (SPA)   │    │  ASP.NET Core Web API        │ │
│  │  NgRx Store         │◄──►│  Controllers (thin)          │ │
│  │  Standalone Comps   │    │  Swagger/OpenAPI             │ │
│  └─────────────────────┘    └──────────────┬──────────────┘ │
└──────────────────────────────────────────────┼───────────────┘
                                               │
┌──────────────────────────────────────────────┼───────────────┐
│                     APPLICATION LAYER         │               │
│  ┌───────────────────────────────────────────┼─────────────┐ │
│  │  MediatR (CQRS)                           │             │ │
│  │  ├── Commands → Handlers                  │             │ │
│  │  ├── Queries → Handlers                   │             │ │
│  │  ├── Validators (FluentValidation)        │             │ │
│  │  ├── Pipeline Behaviors                   │             │ │
│  │  └── DTOs / Mapping Profiles              │             │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                                               │
┌──────────────────────────────────────────────┼───────────────┐
│                     DOMAIN LAYER              │               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Entities (business objects)                             │ │
│  │  Value Objects                                           │ │
│  │  Enums                                                   │ │
│  │  Domain Events                                           │ │
│  │  Repository Interfaces                                   │ │
│  │  Domain Services (if needed)                             │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                                               │
┌──────────────────────────────────────────────┼───────────────┐
│                  INFRASTRUCTURE LAYER         │               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  EF Core (DbContext, Configurations)                     │ │
│  │  Repository Implementations                              │ │
│  │  Identity (ASP.NET Identity)                             │ │
│  │  External Service Integrations                           │ │
│  │  File Storage (Azure Blob / AWS S3)                      │ │
│  │  Email / Notification Services                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                                               │
┌──────────────────────────────────────────────┼───────────────┐
│                     DATA LAYER                │               │
│  ┌─────────────────────────┐  ┌─────────────┴─────────────┐ │
│  │  SQL Server             │  │  Azure Blob / AWS S3       │ │
│  │  (Relational Data)      │  │  (File Storage)            │ │
│  └─────────────────────────┘  └───────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Dependency Rule
Dependencies point inward ONLY:
- API → Application → Domain (NEVER Domain → Infrastructure)
- Infrastructure → Domain (implements domain interfaces)
- API → Infrastructure (for DI registration only)

The Domain layer has ZERO external dependencies.

## CQRS Pattern

### Commands (Write Operations)
```
HTTP POST/PUT/DELETE → Controller → MediatR → Validator → Handler → Repository → Database
```

### Queries (Read Operations)
```
HTTP GET → Controller → MediatR → Handler → DbContext (direct, with projections) → Response
```

**Why separate?**
- Commands go through full validation, domain logic, and audit
- Queries bypass business logic for performance (read-only, AsNoTracking)
- Enables independent scaling of read/write paths (future)
- Clearer intent — developers know immediately if code mutates state

## Cross-Cutting Concerns

| Concern | Implementation | Layer |
|---------|---------------|-------|
| Authentication | JWT Bearer + ASP.NET Identity | API |
| Authorization | Role-based [Authorize] | API |
| Validation | FluentValidation + Pipeline Behavior | Application |
| Exception Handling | Global Middleware | API |
| Audit Logging | EF Core SaveChanges Interceptor | Infrastructure |
| Correlation ID | Middleware + Header propagation | API |
| Caching | IMemoryCache / IDistributedCache | Infrastructure |
| File Storage | IFileStorageService abstraction | Infrastructure |

## Module Isolation
Each business module (Land Acquisition, Planning, etc.) is:
- A separate feature folder in Application layer
- A separate folder in Domain for entities
- A separate controller in API layer
- A separate feature module in Angular
- Independent — no direct dependencies between modules
- Communicates via shared domain events (future) or shared entity references (FK)

## Scalability Considerations
- Stateless API (horizontal scaling ready)
- Database connection pooling
- Async I/O throughout
- Pagination on all list queries
- Response caching for read-heavy endpoints
- File storage offloaded to blob storage
- Future: Read replicas for reporting, message queues for async processing

## Security Architecture
- HTTPS everywhere
- JWT tokens with short expiry + refresh rotation
- Role-based access at controller level
- Resource-based access at handler level where needed
- All inputs validated before processing
- Audit trail on all mutations
- Secrets in Key Vault (not source code)

## Deployment Architecture (Target)
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  CDN / Nginx    │────►│  Angular SPA    │     │  Load Balancer  │
│  (Static Files) │     │  (Azure Static) │     │  (Azure / AWS)  │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                              ┌───────────┼───────────┐
                                              │           │           │
                                        ┌─────┴─────┐ ┌──┴──┐ ┌─────┴─────┐
                                        │  API (1)  │ │ (2) │ │  API (N)  │
                                        │  Instance │ │     │ │  Instance │
                                        └─────┬─────┘ └──┬──┘ └─────┬─────┘
                                              │          │           │
                                              └──────────┼───────────┘
                                                         │
                                              ┌──────────┴──────────┐
                                              │  SQL Server         │
                                              │  (Primary + Replica)│
                                              └─────────────────────┘
```
