# Planning & Approvals Module — API Endpoints

## Overview

The module exposes 25 RESTful API endpoints across 8 controllers. All endpoints follow the `api/v1/` versioning pattern, use the ApiResponse envelope, and require authentication.

## Controllers

### PlanningApplicationsController (`api/v1/planning-applications`)

| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| POST | `/` | Create new planning application | Planning_Manager, Admin_Support |
| GET | `/` | List applications (paginated, filtered, sorted, searchable) | All planning roles |
| GET | `/{id}` | Full application detail with all related entities | All planning roles |
| PUT | `/{id}` | Update application fields | Planning_Manager, Admin_Support |
| PUT | `/{id}/status` | Transition application status | Planning_Manager, Admin_Support |
| GET | `/by-opportunity/{opportunityId}` | Summary for Land Acquisition integration | All authenticated |

### PlanningConditionsController

| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| GET | `api/v1/planning-applications/{id}/conditions` | List conditions (paginated, filtered) | All planning roles |
| POST | `api/v1/planning-applications/{id}/conditions` | Create condition | Legal_Compliance_Officer, Admin_Support |
| PUT | `api/v1/planning-conditions/{id}/status` | Transition condition status | Legal_Compliance_Officer, Admin_Support |

### PlanningAppealsController

| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| GET | `api/v1/planning-applications/{id}/appeals` | List appeals (paginated) | All planning roles |
| POST | `api/v1/planning-applications/{id}/appeals` | Create appeal | Legal_Compliance_Officer |
| PUT | `api/v1/planning-appeals/{id}/status` | Transition appeal status | Legal_Compliance_Officer |

### PlanningDocumentsController

| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| GET | `api/v1/planning-applications/{id}/documents` | List documents (paginated, filtered by type) | All planning roles |
| POST | `api/v1/planning-applications/{id}/documents` | Upload document (multipart form) | Admin_Support, Planning_Manager |
| GET | `api/v1/planning-documents/{id}/download` | Download file content | All planning roles |
| DELETE | `api/v1/planning-documents/{id}` | Soft-delete document | Admin_Support, Planning_Manager |

### PlanningFeesController

| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| GET | `api/v1/planning-applications/{id}/fees` | List fees (paginated, filtered) | All planning roles |
| GET | `api/v1/planning-applications/{id}/fees/summary` | Fee totals by type and status | All planning roles |
| POST | `api/v1/planning-applications/{id}/fees` | Create fee | Planning_Manager |
| PUT | `api/v1/planning-fees/{id}/status` | Transition fee payment status | Planning_Manager |
| PUT | `api/v1/planning-fees/{id}/approve` | Approve fee payment | Finance_Director |

### PlanningMilestonesController

| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| GET | `api/v1/planning-applications/{id}/milestones` | List all milestones (ordered by TargetDate) | All planning roles |
| POST | `api/v1/planning-applications/{id}/milestones` | Create milestone | Planning_Manager |
| PUT | `api/v1/planning-milestones/{id}/complete` | Record completion with actual date | Planning_Manager |

### PlanningDashboardController (`api/v1/planning-dashboard`)

| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| GET | `/` | Dashboard KPI metrics | Planning_Manager |

### CouncilContactController (`api/v1/planning-applications/{id}/council-contact`)

| Method | Route | Purpose | Roles |
|--------|-------|---------|-------|
| POST | `/` | Create council contact | Planning_Manager |
| PUT | `/{contactId}` | Update council contact | Planning_Manager |

## Response Patterns

- **Success (list):** HTTP 200 with `PagedResult<T>` containing items, totalCount, pageNumber, pageSize
- **Success (create):** HTTP 201 with created entity DTO
- **Success (update):** HTTP 200 with updated entity DTO
- **Success (delete):** HTTP 204 No Content
- **Validation error:** HTTP 400 with structured error list
- **Not found:** HTTP 404
- **Conflict:** HTTP 409 (duplicate/active entity)
- **Unauthorized:** HTTP 401
- **Forbidden:** HTTP 403 (wrong role)
