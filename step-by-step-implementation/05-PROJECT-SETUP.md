# Phase 5: Project Setup — Creating Everything From Zero

## What You'll Build In This Phase

By the end of this phase, you'll have:
- A .NET solution with 5 projects (correct layer separation)
- All NuGet packages installed
- An Angular 20 application scaffolded
- All npm packages installed
- A working "hello world" from both backend and frontend
- Git repository initialized

---

## Step 1: Create the Solution Structure

Open a terminal in your workspace folder.

### Create the .NET Solution

```bash
# Create solution file
mkdir backend
cd backend
dotnet new slnx -n BuildEstate

# Create projects (one per architectural layer)
dotnet new classlib -n BuildEstate.Domain -o src/BuildEstate.Domain
dotnet new classlib -n BuildEstate.Application -o src/BuildEstate.Application
dotnet new classlib -n BuildEstate.Infrastructure -o src/BuildEstate.Infrastructure
dotnet new classlib -n BuildEstate.Shared -o src/BuildEstate.Shared
dotnet new webapi -n BuildEstate.API -o src/BuildEstate.API

# Create test project
dotnet new xunit -n BuildEstate.Tests -o tests/BuildEstate.Tests

# Add all projects to solution
dotnet sln add src/BuildEstate.Domain
dotnet sln add src/BuildEstate.Application
dotnet sln add src/BuildEstate.Infrastructure
dotnet sln add src/BuildEstate.Shared
dotnet sln add src/BuildEstate.API
dotnet sln add tests/BuildEstate.Tests
```

### Set Up Project References (Dependency Flow)

```bash
# Domain has NO references (zero dependencies)

# Application references Domain only
cd src/BuildEstate.Application
dotnet add reference ../BuildEstate.Domain

# Infrastructure references Domain (implements its interfaces)
cd ../BuildEstate.Infrastructure
dotnet add reference ../BuildEstate.Domain
dotnet add reference ../BuildEstate.Application

# Shared has no references (utility types only)

# API references Application, Infrastructure, and Shared
cd ../BuildEstate.API
dotnet add reference ../BuildEstate.Application
dotnet add reference ../BuildEstate.Infrastructure
dotnet add reference ../BuildEstate.Shared

# Tests reference everything (for testing)
cd ../../tests/BuildEstate.Tests
dotnet add reference ../../src/BuildEstate.Domain
dotnet add reference ../../src/BuildEstate.Application
dotnet add reference ../../src/BuildEstate.Infrastructure
dotnet add reference ../../src/BuildEstate.Shared
```

---

## Step 2: Install NuGet Packages

### BuildEstate.Domain (.csproj)
```xml
<!-- Domain has ZERO packages. Pure C# only. -->
<PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
</PropertyGroup>
```

### BuildEstate.Application (.csproj)
```xml
<ItemGroup>
    <PackageReference Include="MediatR" Version="12.4.0" />
    <PackageReference Include="FluentValidation" Version="11.9.0" />
    <PackageReference Include="FluentValidation.DependencyInjectionExtensions" Version="11.9.0" />
    <PackageReference Include="AutoMapper" Version="13.0.1" />
    <PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="12.0.1" />
</ItemGroup>
```

### BuildEstate.Infrastructure (.csproj)
```xml
<ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="10.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="10.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="10.0.0" />
    <PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="10.0.0" />
</ItemGroup>
```

### BuildEstate.API (.csproj)
```xml
<ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.0.0" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.0.0" />
    <PackageReference Include="Microsoft.AspNetCore.Diagnostics.EntityFrameworkCore" Version="10.0.0" />
</ItemGroup>
```

### BuildEstate.Tests (.csproj)
```xml
<ItemGroup>
    <PackageReference Include="xunit" Version="2.9.0" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.0" />
    <PackageReference Include="Moq" Version="4.20.0" />
    <PackageReference Include="FluentAssertions" Version="6.12.0" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.11.0" />
</ItemGroup>
```

### Verify Everything Compiles

```bash
cd backend
dotnet restore
dotnet build
```

If this succeeds with 0 errors, your backend skeleton is ready.

---

## Step 3: Create the Angular Frontend

```bash
# From workspace root
ng new frontend --style=scss --routing=true --standalone

cd frontend

# Install core dependencies
npm install @ngrx/store @ngrx/effects @ngrx/entity @ngrx/store-devtools
npm install tailwindcss postcss autoprefixer
npm install daisyui

# Development dependencies
npm install -D @types/node
```

### Configure Tailwind CSS

Create `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["corporate", "dark"],
  },
}
```

Update `src/styles.scss`:
```scss
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Verify Frontend Compiles

```bash
cd frontend
ng build
```

If this succeeds, your frontend skeleton is ready.

---

## Step 4: Create the Folder Structure

### Backend Folder Structure

```
backend/src/BuildEstate.Domain/
├── Common/
│   ├── BaseEntity.cs
│   └── IAuditableEntity.cs
├── Entities/
│   └── (empty — we'll add these in Phase 6)
├── Enums/
│   └── (empty)
└── Interfaces/
    ├── IRepository.cs
    └── IUnitOfWork.cs

backend/src/BuildEstate.Application/
├── Behaviors/
│   └── ValidationBehavior.cs
├── Features/
│   └── (empty — we'll add these in Phase 8)
├── Interfaces/
│   └── ICurrentUserService.cs
└── DependencyInjection.cs

backend/src/BuildEstate.Infrastructure/
├── Persistence/
│   ├── BuildEstateDbContext.cs
│   ├── Configurations/
│   └── Interceptors/
├── Identity/
├── Services/
├── Migrations/
└── DependencyInjection.cs

backend/src/BuildEstate.API/
├── Controllers/
├── Middleware/
│   ├── GlobalExceptionHandler.cs
│   ├── CorrelationIdMiddleware.cs
│   └── SecurityHeadersMiddleware.cs
├── Services/
│   └── CurrentUserService.cs
├── Authorization/
└── Program.cs

backend/src/BuildEstate.Shared/
├── Models/
│   └── ApiResponse.cs
└── Exceptions/
    ├── NotFoundException.cs
    ├── ConflictException.cs
    └── ForbiddenException.cs
```

### Frontend Folder Structure

```
frontend/src/app/
├── core/
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── toast.service.ts
│   │   ├── loading.service.ts
│   │   └── permission.service.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── unsaved-changes.guard.ts
│   ├── interceptors/
│   │   ├── auth.interceptor.ts
│   │   └── error.interceptor.ts
│   └── models/
│       └── api-response.model.ts
├── shared/
│   └── components/
│       ├── page-header/
│       ├── data-grid/
│       ├── metric-card/
│       ├── status-badge/
│       ├── empty-state/
│       ├── loading-spinner/
│       └── confirmation-dialog/
├── layout/
│   ├── main-layout/
│   └── auth-layout/
├── design-system/
│   └── tokens/
├── features/
│   └── (empty — we'll add these in module implementation)
├── app.config.ts
├── app.routes.ts
└── app.ts
```

---

## Step 5: Essential Base Files

### BaseEntity.cs (Domain Layer)

```csharp
namespace BuildEstate.Domain.Common;

public abstract class BaseEntity : IAuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
```

### IAuditableEntity.cs (Domain Layer)

```csharp
namespace BuildEstate.Domain.Common;

public interface IAuditableEntity
{
    DateTime CreatedAt { get; set; }
    string CreatedBy { get; set; }
    DateTime? UpdatedAt { get; set; }
    string? UpdatedBy { get; set; }
}
```

### IRepository.cs (Domain Layer)

```csharp
namespace BuildEstate.Domain.Interfaces;

public interface IRepository<T> where T : Common.BaseEntity
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<T>> GetAllAsync(CancellationToken cancellationToken = default);
    IQueryable<T> Query();
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    void Update(T entity);
    void Delete(T entity);
}
```

### IUnitOfWork.cs (Domain Layer)

```csharp
namespace BuildEstate.Domain.Interfaces;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

---

## Step 6: Verify the Build

```bash
# Backend
cd backend
dotnet build
# Expected: Build succeeded. 0 Warning(s). 0 Error(s).

# Frontend
cd frontend
ng build
# Expected: Build complete.
```

---

## Step 7: Initialize Git

```bash
# From workspace root
git init
git add .
git commit -m "feat: initial project scaffold with clean architecture structure"
```

Create `.gitignore`:
```
# .NET
**/bin/
**/obj/
*.user
*.vs/

# Node
node_modules/
dist/

# IDE
.idea/
.vscode/

# Environment
*.env
appsettings.*.local.json
```

---

## Checkpoint: What You Should Have

At this point:
- [x] 5 backend projects with correct references
- [x] All NuGet packages installed
- [x] Angular frontend scaffolded with Tailwind + DaisyUI
- [x] Base entity and interfaces in Domain layer
- [x] Folder structure created for all layers
- [x] Both backend and frontend compile successfully
- [x] Git initialized with first commit

---

*Next: Phase 6 — Building the Domain Layer (entities, enums, business rules)...*
