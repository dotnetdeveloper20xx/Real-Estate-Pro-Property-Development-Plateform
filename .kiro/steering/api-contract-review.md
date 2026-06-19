---
inclusion: auto
---

# API Contract Review

## Verification Checklist

For every feature, verify:

- Every frontend action has a backend endpoint
- Every endpoint exists and is reachable
- Every DTO matches between frontend and backend
- Every property name matches exactly (case-sensitive)
- Enums match (string values, same names)
- Routes match (no wrong paths, no 404s)
- Response models match the expected envelope
- Status codes are handled (200, 201, 204, 400, 401, 403, 404, 409, 500)
- Validation errors are mapped to form fields
- Concurrency conflicts (409) show reload option
- No orphan endpoints (backend exists but frontend never calls it)
- No missing endpoints (frontend calls something that doesn't exist)
- No wrong URLs (path typos, wrong nesting)
- No magic strings (hardcoded URLs instead of service methods)

## Standard Response Envelope

```typescript
interface IApiResponse<T> {
  success: boolean;
  data: T | null;
  errors: string[];
  pagination?: IPaginationMeta;
}
```

## Frontend Service Rules

- One service per API resource
- All calls go through typed services (never raw HttpClient in components)
- Services return Observable<IApiResponse<T>>
- Services handle URL construction
- Services are injectable singletons (providedIn: 'root')
