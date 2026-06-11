# BuildEstate Pro — Setup Commands & Prerequisites

## Before I Start (What I Need From You)

Please confirm or adjust the following. Once you approve, I'll run everything without asking further questions.

---

## 1. Prerequisites on Your Machine

I need these installed. Please confirm (Y/N) for each:

| Tool | Required Version | Check Command |
|------|-----------------|---------------|
| .NET SDK | 8.0+ | `dotnet --version` |
| Node.js | 20+ | `node --version` |
| Angular CLI | 18+ | `ng version` |
| SQL Server | Any edition (Express is fine) | Running locally or connection string |

---

## 2. Project Location

I'll create everything inside:
```
c:\Users\Afzal Ahmed\source\repos\real-estate\
├── backend\          (ASP.NET Core solution)
└── frontend\         (Angular app)
```

Is this location correct? (Y/N)

---

## 3. Database Connection String

I need a SQL Server connection string. Pick one:

**Option A — Local SQL Server Express (default):**
```
Server=.\SQLEXPRESS;Database=BuildEstateDb;Trusted_Connection=True;TrustServerCertificate=True;
```

**Option B — Local SQL Server (named instance):**
```
Server=localhost;Database=BuildEstateDb;Trusted_Connection=True;TrustServerCertificate=True;
```

**Option C — Custom (provide your own):**
```
Server=???;Database=BuildEstateDb;User Id=???;Password=???;TrustServerCertificate=True;
```

Which option? (A / B / C + your string)

---

## 4. Angular Port & API Port

| App | Default Port |
|-----|-------------|
| Angular Frontend | 4200 |
| ASP.NET Core API | 5000 (HTTP) / 5001 (HTTPS) |

Use defaults? (Y/N)

---

## 5. Authentication Seed Data

I'll create a default admin user for development:

| Field | Default Value |
|-------|--------------|
| Email | admin@buildestate.co.uk |
| Password | Admin@123456 |
| Role | SuperAdmin |

Use these defaults? (Y/N) Or provide your own.

---

## 6. Commands I Will Run (for your awareness)

These are the shell commands I'll execute during scaffolding:

### Backend
```bash
dotnet new sln -n BuildEstate
dotnet new webapi -n BuildEstate.API
dotnet new classlib -n BuildEstate.Domain
dotnet new classlib -n BuildEstate.Application
dotnet new classlib -n BuildEstate.Infrastructure
dotnet new classlib -n BuildEstate.Shared
dotnet sln add (all projects)
dotnet add (project references between layers)
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package MediatR
dotnet add package FluentValidation.AspNetCore
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Swashbuckle.AspNetCore
dotnet add package AutoMapper.Extensions.Microsoft.DependencyInjection
dotnet build
dotnet ef migrations add InitialCreate
```

### Frontend
```bash
ng new BuildEstatePro --routing --style=scss --standalone
ng add @angular/material
npm install @ngrx/store @ngrx/effects @ngrx/entity @ngrx/store-devtools
npm install primeng primeicons
ng generate component (various components)
ng build
```

---

## 7. Summary — Your Answers Needed

| # | Question | Your Answer |
|---|----------|-------------|
| 1 | .NET 8+ SDK installed? | |
| 2 | Node.js 20+ installed? | |
| 3 | Angular CLI installed? | |
| 4 | SQL Server available? | |
| 5 | Project location OK? | |
| 6 | DB connection (A/B/C)? | |
| 7 | Default ports OK? | |
| 8 | Default admin user OK? | |
| 9 | Approve all commands above? | |

---

Once you fill in the table above (or just say "all defaults, go ahead"), I'll scaffold the entire project end-to-end without interruption.
