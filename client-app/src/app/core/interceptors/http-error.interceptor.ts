import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';

import { ToastService } from '../services/toast.service';
import {
  HttpErrorActions,
  HttpErrorSeverity,
  IHttpErrorPayload
} from '../store/error.actions';

/** Maximum number of retry attempts for 500 errors before giving up. */
const MAX_RETRY_MESSAGE = 'A server error occurred. Please try again later or contact support.';

/**
 * Angular functional HTTP interceptor for centralized error handling.
 *
 * Responsibilities:
 * - Catches all HTTP error responses
 * - Dispatches appropriate NgRx error actions per status code
 * - Shows user-friendly toast notifications
 * - Handles 401 by redirecting to login
 * - Handles 403 with a forbidden message
 * - Handles 500 with a generic error and retry guidance
 * - Handles network errors gracefully
 *
 * Validates Requirements: 12.6, 12.7, 17.5
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const store = inject(Store);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const correlationId = error.headers?.get('X-Correlation-Id') ?? undefined;
      const timestamp = new Date().toISOString();
      const url = error.url ?? req.url;

      switch (error.status) {
        case 0:
          handleNetworkError(store, toast, url, timestamp);
          break;

        case 401:
          handleUnauthorized(store, toast, router, url, correlationId, timestamp);
          break;

        case 403:
          handleForbidden(store, toast, url, correlationId, timestamp);
          break;

        case 404:
          handleNotFound(store, toast, error, url, correlationId, timestamp);
          break;

        case 409:
          handleConflict(store, toast, error, url, correlationId, timestamp);
          break;

        case 400:
        case 422:
          handleValidationError(store, toast, error, url, correlationId, timestamp);
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          handleServerError(store, toast, error, url, correlationId, timestamp);
          break;

        default:
          handleUnknownError(store, toast, error, url, correlationId, timestamp);
          break;
      }

      return throwError(() => error);
    })
  );
};

/**
 * Extracts a user-friendly error message from the API response body.
 * Supports the standard ApiResponse envelope ({ errors: string[] })
 * and generic error shapes.
 */
function extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
  const body = error.error;

  if (body == null) {
    return fallback;
  }

  // Standard ApiResponse envelope: { errors: string[] }
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    return body.errors[0] as string;
  }

  // ASP.NET Core ProblemDetails: { title: string }
  if (typeof body.title === 'string' && body.title.length > 0) {
    return body.title;
  }

  // Simple message property
  if (typeof body.message === 'string' && body.message.length > 0) {
    return body.message;
  }

  // Raw string body
  if (typeof body === 'string' && body.length > 0 && body.length < 200) {
    return body;
  }

  return fallback;
}

/**
 * Creates the standard error payload for NgRx actions.
 */
function buildPayload(
  statusCode: number,
  message: string,
  url: string,
  severity: HttpErrorSeverity,
  correlationId?: string,
  timestamp?: string
): IHttpErrorPayload {
  return {
    statusCode,
    message,
    url,
    correlationId,
    timestamp: timestamp ?? new Date().toISOString(),
    severity
  };
}

// --- Error handlers per status code ---

function handleNetworkError(
  store: Store,
  toast: ToastService,
  url: string,
  timestamp: string
): void {
  const message = 'Unable to reach the server. Please check your internet connection.';
  const payload = buildPayload(0, message, url, 'critical', undefined, timestamp);

  store.dispatch(HttpErrorActions.networkError({ payload }));
  toast.showError(message);
}

function handleUnauthorized(
  store: Store,
  toast: ToastService,
  router: Router,
  url: string,
  correlationId: string | undefined,
  timestamp: string
): void {
  const message = 'Your session has expired. Please log in again.';
  const payload = buildPayload(401, message, url, 'warning', correlationId, timestamp);

  store.dispatch(HttpErrorActions.unauthorized({ payload }));
  toast.showWarning(message);
  router.navigate(['/login']);
}

function handleForbidden(
  store: Store,
  toast: ToastService,
  url: string,
  correlationId: string | undefined,
  timestamp: string
): void {
  const message = 'You do not have permission to perform this action.';
  const payload = buildPayload(403, message, url, 'warning', correlationId, timestamp);

  store.dispatch(HttpErrorActions.forbidden({ payload }));
  toast.showWarning(message);
}

function handleNotFound(
  store: Store,
  toast: ToastService,
  error: HttpErrorResponse,
  url: string,
  correlationId: string | undefined,
  timestamp: string
): void {
  const message = extractErrorMessage(error, 'The requested resource was not found.');
  const payload = buildPayload(404, message, url, 'warning', correlationId, timestamp);

  store.dispatch(HttpErrorActions.notFound({ payload }));
  toast.showWarning(message);
}

function handleConflict(
  store: Store,
  toast: ToastService,
  error: HttpErrorResponse,
  url: string,
  correlationId: string | undefined,
  timestamp: string
): void {
  const message = extractErrorMessage(error, 'A conflict occurred. The record may have been modified.');
  const payload = buildPayload(409, message, url, 'warning', correlationId, timestamp);

  store.dispatch(HttpErrorActions.conflict({ payload }));
  toast.showWarning(message);
}

function handleValidationError(
  store: Store,
  toast: ToastService,
  error: HttpErrorResponse,
  url: string,
  correlationId: string | undefined,
  timestamp: string
): void {
  const message = extractErrorMessage(error, 'Please check your input and try again.');
  const payload = buildPayload(error.status, message, url, 'warning', correlationId, timestamp);

  store.dispatch(HttpErrorActions.validationError({ payload }));
  toast.showError(message);
}

function handleServerError(
  store: Store,
  toast: ToastService,
  error: HttpErrorResponse,
  url: string,
  correlationId: string | undefined,
  timestamp: string
): void {
  const payload = buildPayload(
    error.status,
    MAX_RETRY_MESSAGE,
    url,
    'critical',
    correlationId,
    timestamp
  );

  store.dispatch(HttpErrorActions.serverError({ payload }));
  toast.showError(MAX_RETRY_MESSAGE);
}

function handleUnknownError(
  store: Store,
  toast: ToastService,
  error: HttpErrorResponse,
  url: string,
  correlationId: string | undefined,
  timestamp: string
): void {
  const message = extractErrorMessage(error, 'An unexpected error occurred.');
  const payload = buildPayload(error.status, message, url, 'error', correlationId, timestamp);

  store.dispatch(HttpErrorActions.unknownError({ payload }));
  toast.showError(message);
}
