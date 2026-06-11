# Phase 22: Deployment & Production Readiness

## What This Phase Covers

Getting from "it works on my machine" to "it's running reliably in production." This covers CI/CD, environment configuration, database management, monitoring, and production operations.

---

## Environment Strategy

| Environment | Purpose | Database | URL |
|-------------|---------|----------|-----|
| Local | Development | SQL Server Express (local) | https://localhost:5001 |
| Development | Integration testing | Shared dev database | https://dev-api.buildestate.co.uk |
| Staging | Pre-production testing | Staging database (production clone) | https://staging-api.buildestate.co.uk |
| Production | Live users | Production database | https://api.buildestate.co.uk |

---

## Configuration Per Environment

### appsettings.json (Base — shared settings)
```json
{
    "JwtSettings": {
        "Issuer": "BuildEstatePro",
        "Audience": "BuildEstateProUsers",
        "ExpiryMinutes": 60
    },
    "Logging": {
        "LogLevel": {
            "Default": "Information"
        }
    }
}
```

### appsettings.Development.json (Local dev only)
```json
{
    "ConnectionStrings": {
        "DefaultConnection": "Server=.\\SQLEXPRESS;Database=BuildEstateDb;Trusted_Connection=True;TrustServerCertificate=True;"
    },
    "JwtSettings": {
        "Secret": "development-only-secret-key-min-32-characters-long!"
    }
}
```

### Production (Environment Variables / Key Vault)
```
ConnectionStrings__DefaultConnection=<from Key Vault>
JwtSettings__Secret=<from Key Vault>
```

**Rule:** NEVER commit production secrets to source code. Use environment variables or Key Vault.

---

## CI/CD Pipeline (GitHub Actions Example)

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'
      - run: dotnet restore
        working-directory: backend
      - run: dotnet build --no-restore
        working-directory: backend
      - run: dotnet test --no-build
        working-directory: backend

  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
        working-directory: frontend
      - run: npm run build
        working-directory: frontend
      - run: npm run test -- --watch=false
        working-directory: frontend

  deploy:
    needs: [build-backend, build-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Azure / AWS
        # Deploy backend to App Service / ECS
        # Deploy frontend to Static Web App / S3 + CloudFront
```

---

## Database Migration Strategy (Production)

### Rules
1. Never run `dotnet ef database update` in production directly
2. Generate migration scripts and review before applying
3. Always test migrations against a production-like dataset
4. Have a rollback plan (Down migration)
5. Take database backup before applying migrations

### Generate Migration Script
```bash
dotnet ef migrations script --idempotent \
    --project src/BuildEstate.Infrastructure \
    --startup-project src/BuildEstate.API \
    --output migrations.sql
```

### Apply in Production
```sql
-- Review the generated SQL first!
-- Then apply via SSMS or Azure SQL management
```

---

## Production Checklist

### Before Go-Live
- [ ] All secrets in Key Vault (not source code)
- [ ] Connection strings use production database
- [ ] JWT secret is strong (64+ random characters)
- [ ] HTTPS enforced (no HTTP)
- [ ] CORS restricted to production frontend URL only
- [ ] Rate limiting configured
- [ ] Security headers active
- [ ] Swagger disabled in production
- [ ] Error details hidden from clients (generic messages)
- [ ] Structured logging configured (to cloud logging service)
- [ ] Health check endpoint responds
- [ ] Database backups scheduled (daily minimum)
- [ ] SSL certificates valid and auto-renewing

### Performance
- [ ] Database indexes exist for all frequent queries
- [ ] Response caching configured for read-heavy endpoints
- [ ] Frontend bundle optimized (tree shaking, lazy loading)
- [ ] CDN configured for frontend static assets
- [ ] Connection pooling configured

### Monitoring
- [ ] Application logs shipping to central logging (Azure Monitor / CloudWatch)
- [ ] Error alerting configured (email/Slack on 500 errors)
- [ ] Health check monitoring (alert if /health fails)
- [ ] Database monitoring (connection pool, slow queries)
- [ ] Uptime monitoring (external ping every 5 minutes)

---

## Deployment Architecture

```
                    ┌─────────────────┐
                    │   CDN           │
                    │   (CloudFront / │
                    │    Azure CDN)   │
                    └────────┬────────┘
                             │
┌────────────────────────────┼────────────────────────────┐
│                            │                             │
│    ┌───────────────┐       │       ┌─────────────────┐  │
│    │ Frontend SPA  │       │       │  Load Balancer  │  │
│    │ (Static Files)│       │       │  (ALB / Azure)  │  │
│    └───────────────┘       │       └────────┬────────┘  │
│                            │                │            │
│                            │       ┌────────┼────────┐  │
│                            │       │        │        │  │
│                            │    ┌──┴──┐  ┌──┴──┐  ┌─┴──┐│
│                            │    │API 1│  │API 2│  │API N││
│                            │    └──┬──┘  └──┬──┘  └─┬──┘│
│                            │       └────────┼────────┘  │
│                            │                │            │
│                            │       ┌────────┴────────┐  │
│                            │       │  SQL Server     │  │
│                            │       │  (Primary +     │  │
│                            │       │   Read Replica) │  │
│                            │       └─────────────────┘  │
└────────────────────────────┼────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │  Blob Storage   │
                    │  (Documents)    │
                    └─────────────────┘
```

---

## Backup & Recovery

| What | Frequency | Retention | RTO | RPO |
|------|-----------|-----------|-----|-----|
| Database (full) | Daily | 30 days | 4 hours | 1 hour |
| Database (differential) | Every 6 hours | 7 days | 2 hours | 6 hours |
| Transaction logs | Every 15 minutes | 7 days | 30 minutes | 15 minutes |
| File storage | Daily sync | 90 days | 4 hours | 24 hours |
| Configuration | On every change | Indefinite | 1 hour | 0 |

---

## Incident Response

When something goes wrong in production:

1. **Detect** — Monitoring alerts fire
2. **Assess** — Check health endpoint, logs, error rate
3. **Communicate** — Inform stakeholders if user-facing
4. **Mitigate** — Rollback if deployment caused it, or apply hotfix
5. **Resolve** — Fix root cause
6. **Post-mortem** — Document what happened and how to prevent it

---

## Scaling Strategy

| Growth Stage | Infrastructure | When |
|-------------|---------------|------|
| Small (< 50 users) | Single API instance, single DB | Launch |
| Medium (50-200 users) | 2 API instances, read replica | 6 months |
| Large (200-500 users) | Auto-scaling, caching layer, CDN | 12 months |
| Enterprise (500+ users) | Multi-region, message queues, microservices consideration | 24 months |

---

*The platform is designed stateless (JWT, no server sessions) so horizontal scaling is straightforward — add more API instances behind the load balancer.*
