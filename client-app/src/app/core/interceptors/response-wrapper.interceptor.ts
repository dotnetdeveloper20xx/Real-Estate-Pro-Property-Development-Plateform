import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

/**
 * HTTP interceptor that normalizes all API responses into the IApiResponse envelope
 * expected by the frontend components: { data, success, errors, pagination }.
 *
 * The backend returns data directly (e.g., { id, name, ... } or { items: [...], totalCount })
 * but the frontend services/components expect { data: T, success: boolean, errors: [] }.
 *
 * This interceptor wraps raw responses into the expected format transparently.
 */
export const responseWrapperInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept API calls (not assets, fonts, etc.)
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body !== null && event.body !== undefined) {
        const body = event.body as Record<string, unknown>;

        // If already wrapped (has 'success' property), pass through
        if (body && typeof body === 'object' && 'success' in body) {
          return event;
        }

        // Wrap the response in IApiResponse format
        const wrapped: Record<string, unknown> = {
          data: body,
          success: true,
          errors: [] as string[],
          pagination: null as Record<string, unknown> | null
        };

        // If the response is a paginated list ({ items, totalCount, ... }),
        // extract pagination metadata
        if (body && typeof body === 'object' && 'items' in body && 'totalCount' in body) {
          wrapped['data'] = body['items'];
          wrapped['pagination'] = {
            totalCount: body['totalCount'],
            pageNumber: body['pageNumber'] ?? 1,
            pageSize: body['pageSize'] ?? 10,
            totalPages: body['totalPages'] ?? Math.ceil((body['totalCount'] as number) / ((body['pageSize'] as number) ?? 10))
          };
        }

        return event.clone({ body: wrapped });
      }
      return event;
    })
  );
};
