# Legal & Compliance Module — API Reference

## Base URL

All endpoints are prefixed with `/api/v1/`.

## Authentication

All endpoints require a valid JWT Bearer token. Include in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Format

All responses use the standard API envelope:
```json
{
  "data": { ... },
  "success": true,
  "errors": [],
  "pagination": { "page": 1, "pageSize": 10, "totalCount": 42, "totalPages": 5 }
}
```

---

## Legal Cases

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/legal-cases` | Create a new legal case | Legal Officer, Admin |
| GET | `/legal-cases` | List cases (paginated, filterable) | All legal roles |
| GET | `/legal-cases/{id}` | Get case detail with related entities | All legal roles |
| PUT | `/legal-cases/{id}` | Update case fields | Legal Officer, Admin |
| POST | `/legal-cases/{id}/transition` | Transition case status | Legal Officer, Admin |
| GET | `/legal-cases/pipeline` | Pipeline view (grouped by status) | Legal Officer |
| GET | `/legal-cases/summary/opportunity/{id}` | Summary for opportunity | All legal roles |
| GET | `/legal-cases/summary/planning/{id}` | Summary for planning app | All legal roles |

## Contracts

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/contracts` | Create a new contract | Legal Officer |
| GET | `/contracts` | List contracts (paginated) | All legal roles |
| GET | `/contracts/{id}` | Get contract detail | All legal roles |
| PUT | `/contracts/{id}` | Update contract fields | Legal Officer |
| POST | `/contracts/{id}/transition` | Transition contract status | Legal Officer, Finance Director |
| GET | `/contracts/register` | Contract register view | All legal roles |

## Compliance Requirements

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/compliance-requirements` | Create requirement | Legal Officer |
| GET | `/compliance-requirements` | List requirements (paginated) | All legal roles |
| PUT | `/compliance-requirements/{id}` | Update requirement | Legal Officer |
| POST | `/compliance-requirements/{id}/retire` | Retire/supersede | Legal Officer |
| GET | `/compliance-requirements/checklist` | Checklist view | Legal Officer |
| GET | `/compliance-requirements/summary` | Status summary | Legal Officer |

## Compliance Checks

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/compliance-checks` | Record a check | Legal Officer, Admin |
| GET | `/compliance-checks?requirementId={id}` | List checks for requirement | All legal roles |

## Insurance Records

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/insurance-records` | Create insurance record | Legal Officer, Admin |
| GET | `/insurance-records` | List records (paginated) | All legal roles |
| GET | `/insurance-records/{id}` | Get record detail | All legal roles |
| PUT | `/insurance-records/{id}` | Update record | Legal Officer, Admin |
| POST | `/insurance-records/{id}/transition` | Transition status | Legal Officer |
| POST | `/insurance-records/{id}/renew` | Renew policy | Legal Officer |

## Audit Records

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/audit-records` | Create audit record | Legal Officer |
| GET | `/audit-records` | List records (paginated) | All legal roles |
| GET | `/audit-records/{id}` | Get record detail | All legal roles |
| POST | `/audit-records/{id}/transition` | Transition status | Legal Officer |

## Legal Documents

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/legal-documents` | Upload document | All legal roles |
| GET | `/legal-documents/case/{caseId}` | List documents for case | All legal roles |
| GET | `/legal-documents/contract/{contractId}` | List documents for contract | All legal roles |
| POST | `/legal-documents/{id}/version` | Upload new version | All legal roles |
| DELETE | `/legal-documents/{id}` | Soft delete | Legal Officer |

## Dashboard

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/legal-dashboard` | Get dashboard KPI data | Legal Officer |

## Audit Trail

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/audit-trail` | Query audit history (paginated) | Legal Officer |
| GET | `/audit-trail/export` | Export CSV | Legal Officer |

---

## Query Parameters (Common)

| Parameter | Type | Description |
|-----------|------|-------------|
| pageNumber | int | Page number (1-based, default: 1) |
| pageSize | int | Items per page (default: 10) |
| sortBy | string | Field to sort by |
| sortDirection | string | "asc" or "desc" |
| search | string | Free-text search |

## Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Validation error (invalid input, business rule violation) |
| 401 | Not authenticated (missing or invalid token) |
| 403 | Not authorized (insufficient role permissions) |
| 404 | Entity not found |
| 409 | Conflict (duplicate entity, concurrency conflict) |
| 500 | Internal server error |
