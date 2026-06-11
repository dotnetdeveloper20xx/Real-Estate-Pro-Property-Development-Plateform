# BuildEstate Pro — Quick Start for Junior Developers

## Your Learning Journey (At a Glance)

```
WEEK 1        → Read & Understand (Phases 1-4)
WEEKS 2-3     → Build Backend Foundation (Phases 5-9)
WEEKS 4-5     → Build Frontend Foundation (Phases 10-11)
WEEKS 6-8     → Build First Module: Land Acquisition (Phase 13)
WEEKS 9-22    → Build Remaining Modules (Phases 14-19)
ONGOING       → Test, Document, Polish (Phases 20-23)
```

---

## The 5 Things You Must Understand Before Coding

1. **The Business** — This is a platform for property developers to manage £50M+ projects
2. **The Architecture** — Clean Architecture + CQRS (layers that never cross boundaries)
3. **The Pattern** — Every module follows the same 10-step recipe
4. **The Standards** — Enterprise code quality (testable, secure, auditable, maintainable)
5. **The User** — Corporate users who need answers fast, not beautiful art

---

## The Single Most Important Rule

**Every module is built the same way:**

```
Entity → Configuration → Migration → DTOs → Commands → Queries → Controller → Frontend → Tests
```

Learn this pattern with Module 1 (Land Acquisition). Then repeat for modules 2-14.

---

## Folder Map (Where Things Live)

```
step-by-step-implementation/
├── 00-TABLE-OF-CONTENTS.md      ← Start here (full roadmap)
├── 01-BUSINESS-VISION.md        ← WHY this software exists
├── 02-DOMAIN-UNDERSTANDING.md   ← WHAT each module does
├── 03-ARCHITECTURE-FOUNDATIONS.md ← HOW the code is organized
├── 04-TECHNOLOGY-STACK.md       ← WHICH tools we use and WHY
├── 05-PROJECT-SETUP.md          ← Creating the project from zero
├── 06-DOMAIN-LAYER.md           ← Building entities and enums
├── 12-MODULE-IMPLEMENTATION-PATTERN.md ← THE RECIPE (most important!)
├── 23-QUALITY-GATES.md          ← How to know when you're done
├── QUICK-START.md               ← This file
└── standards/
    ├── CODING-STANDARDS.md      ← Naming, formatting, git
    ├── BACKEND-STANDARDS.md     ← C# / .NET patterns
    ├── FRONTEND-STANDARDS.md    ← Angular / TypeScript patterns
    ├── DATABASE-STANDARDS.md    ← SQL / EF Core rules
    ├── SECURITY-STANDARDS.md    ← Auth, validation, encryption
    ├── TESTING-STANDARDS.md     ← xUnit, Moq, test patterns
    └── UX-STANDARDS.md          ← UI/UX governance
```

---

## Key Commands You'll Use Daily

### Backend
```bash
dotnet build                           # Compile
dotnet test                            # Run tests
dotnet run --project src/BuildEstate.API  # Start API (https://localhost:5001)
dotnet ef migrations add <Name> --project src/BuildEstate.Infrastructure --startup-project src/BuildEstate.API
dotnet ef database update --project src/BuildEstate.Infrastructure --startup-project src/BuildEstate.API
```

### Frontend
```bash
ng serve                    # Start dev server (http://localhost:4200)
ng build                    # Production build
ng test --watch=false       # Run tests once
ng generate component <name> --standalone  # Scaffold component
```

### Git
```bash
git checkout -b feature/land-acquisition/opportunity-pipeline
git add -A
git commit -m "feat: add opportunity list endpoint with pagination"
git push -u origin feature/land-acquisition/opportunity-pipeline
```

---

## Default Login Credentials (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| SuperAdmin | admin@buildestate.co.uk | Admin@123456 |
| Acquisition Manager | acq@buildestate.co.uk | Admin@123456 |
| Legal Officer | legal@buildestate.co.uk | Admin@123456 |
| Planning Manager | planning@buildestate.co.uk | Admin@123456 |
| Project Manager | pm@buildestate.co.uk | Admin@123456 |
| Site Manager | site@buildestate.co.uk | Admin@123456 |
| Sales Manager | sales@buildestate.co.uk | Admin@123456 |
| Finance Director | finance@buildestate.co.uk | Admin@123456 |

---

## When You're Stuck

1. **Check the standards** — The answer is probably in one of the standards files
2. **Check the existing code** — Look at how Module 1 does it, then copy the pattern
3. **Check the recipe** — `12-MODULE-IMPLEMENTATION-PATTERN.md` is your bible
4. **Build and test** — Compile errors and test failures tell you exactly what's wrong
5. **Read the error** — .NET and Angular have excellent error messages. Read them carefully.

---

## Success Criteria

You've successfully completed this project when:
- Every module has working CRUD operations
- Every role can log in and do their job
- The dashboard shows real KPIs
- The help centre has articles for every module
- All tests pass
- The code would pass a senior engineer code review

---

Good luck. Build something you're proud of. 🏗️
