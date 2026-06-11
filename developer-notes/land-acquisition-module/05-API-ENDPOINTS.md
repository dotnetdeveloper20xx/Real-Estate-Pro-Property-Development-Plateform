# 05 — API Endpoints (How Frontend Talks to Backend)

## What This Section Covers

The API is the bridge between what users see (the frontend) and where the data lives (the backend). Every button click, every form submission, every page load — they all call an API endpoint. Think of endpoints like specific phone numbers — you dial the right one to get a specific service.

## Security First

Every single endpoint requires authentication. If you're not logged in, you get a 401 "Unauthorized" response. Period.

Beyond that, specific operations require specific roles. If you're logged in but don't have the right role, you get a 403 "Forbidden" response.

## The 10 Controllers (Groups of Endpoints)

### 1. Opportunities Controller

This handles all the main opportunity operations.

| What You Can Do | URL | Who Can Do It |
|-----------------|-----|---------------|
| Create a new opportunity | POST /api/v1/opportunities | Acquisition Manager, Admin |
| List all opportunities (with search/filter/sort) | GET /api/v1/opportunities | All roles |
| Get one opportunity's full details | GET /api/v1/opportunities/{id} | All roles |
| Update an opportunity | PUT /api/v1/opportunities/{id} | Acquisition Manager, Admin |
| Delete an opportunity | DELETE /api/v1/opportunities/{id} | Acquisition Manager, Admin |
| Change an opportunity's status | PATCH /api/v1/opportunities/{id}/status | Acquisition Manager, Admin |

### 2. Land Owners Controller

| What You Can Do | URL | Who Can Do It |
|-----------------|-----|---------------|
| Add a land owner to an opportunity | POST /api/v1/opportunities/{id}/owners | Acquisition Manager, Admin |
| Update a land owner's details | PUT /api/v1/opportunities/{id}/owners/{ownerId} | Acquisition Manager, Admin |

### 3. Due Diligence Controller

| What You Can Do | URL | Who Can Do It |
|-----------------|-----|---------------|
| List all DD checks for an opportunity | GET /api/v1/opportunities/{id}/due-diligence | All roles |
| Create a new DD check | POST /api/v1/opportunities/{id}/due-diligence | Legal Officer, Admin |
| Change a DD check's status | PATCH /api/v1/opportunities/{id}/due-diligence/{ddId}/status | Legal Officer, Admin |

### 4. Offers Controller

| What You Can Do | URL | Who Can Do It |
|-----------------|-----|---------------|
| List all offers for an opportunity | GET /api/v1/opportunities/{id}/offers | All roles |
| Submit a new offer | POST /api/v1/opportunities/{id}/offers | Acquisition Manager, Admin |
| Change an offer's status | PATCH /api/v1/opportunities/{id}/offers/{offerId}/status | Acquisition Manager, Admin |

### 5. Contracts Controller

| What You Can Do | URL | Who Can Do It |
|-----------------|-----|---------------|
| Create a contract | POST /api/v1/opportunities/{id}/contracts | Legal Officer, Admin |
| Change a contract's status | PATCH /api/v1/opportunities/{id}/contracts/{contractId}/status | Legal Officer, Admin |

### 6. Documents Controller

| What You Can Do | URL | Who Can Do It |
|-----------------|-----|---------------|
| List documents for an opportunity | GET /api/v1/opportunities/{id}/documents | All roles |
| Upload a document | POST /api/v1/opportunities/{id}/documents | All roles |
| Download a document | GET /api/v1/opportunities/{id}/documents/{docId}/download | All roles |
| Delete a document | DELETE /api/v1/opportunities/{id}/documents/{docId} | Admin only |

### 7. Acquisitions Controller

| What You Can Do | URL | Who Can Do It |
|-----------------|-----|---------------|
| Record a land purchase | POST /api/v1/opportunities/{id}/acquisitions | Admin only |
| Update acquisition status | PATCH /api/v1/opportunities/{id}/acquisitions/{acqId}/status | Admin only |

### 8. Feasibility Controller

| What You Can Do | URL | Who Can Do It |
|-----------------|-----|---------------|
| Create/update feasibility assessment | POST /api/v1/opportunities/{id}/feasibility | Valuation Analyst, Finance Director |
| Get feasibility assessment | GET /api/v1/opportunities/{id}/feasibility | All roles |

### 9. Approvals Controller

| What You Can Do | URL | Who Can Do It |
|-----------------|-----|---------------|
| Create an approval request | POST /api/v1/approvals | Any authenticated user (usually system-triggered) |
| Approve or reject | PATCH /api/v1/approvals/{id} | Finance Director only |
| List pending approvals | GET /api/v1/approvals/pending | Finance Director only |

### 10. Dashboard Controller

| What You Can Do | URL | Who Can Do It |
|-----------------|-----|---------------|
| Get KPI metrics | GET /api/v1/dashboard/metrics | All roles |
| Get recent activity | GET /api/v1/dashboard/activity | All roles |

## How Errors Are Returned

The API uses standard HTTP status codes:
- **200 OK** — Success, here's your data
- **201 Created** — Successfully created something new
- **204 No Content** — Successfully deleted (nothing to return)
- **400 Bad Request** — Your input failed validation (with details about what's wrong)
- **401 Unauthorized** — You're not logged in
- **403 Forbidden** — You're logged in but don't have permission
- **404 Not Found** — That record doesn't exist
- **409 Conflict** — Duplicate or concurrency issue

## The Controller Design Principle

Each controller is deliberately thin — it does NOTHING except:
1. Receive the HTTP request
2. Pass it to the right business logic handler
3. Return the HTTP response

No business rules live in controllers. All rules are in the handlers (see section 04). This means the same rules apply whether you call the API from the web app, a mobile app, or directly via Postman.

## Questions to Ask the Developer

- "Fire up Swagger (the API documentation) and show me the full list of endpoints"
- "Call POST /opportunities with a user that only has the LegalComplianceOfficer role — what happens?"
- "Call GET /opportunities without any authentication — what happens?"
- "Show me what a validation error response looks like"
- "Show me how the API responses are structured — what's the envelope format?"
