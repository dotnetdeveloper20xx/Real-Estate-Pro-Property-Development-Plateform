import { createActionGroup, props } from '@ngrx/store';

/**
 * HTTP error severity levels for different status codes.
 */
export type HttpErrorSeverity = 'warning' | 'error' | 'critical';

/**
 * Payload for HTTP error actions dispatched by the error interceptor.
 */
export interface IHttpErrorPayload {
  readonly statusCode: number;
  readonly message: string;
  readonly url: string;
  readonly correlationId?: string;
  readonly timestamp: string;
  readonly severity: HttpErrorSeverity;
}

/**
 * Global NgRx actions for HTTP errors captured by the error interceptor.
 * These actions are dispatched centrally and can be handled by any effect or reducer.
 */
export const HttpErrorActions = createActionGroup({
  source: 'HTTP Error',
  events: {
    /** Dispatched when the API returns 401 Unauthorized */
    'Unauthorized': props<{ payload: IHttpErrorPayload }>(),

    /** Dispatched when the API returns 403 Forbidden */
    'Forbidden': props<{ payload: IHttpErrorPayload }>(),

    /** Dispatched when the API returns 404 Not Found */
    'Not Found': props<{ payload: IHttpErrorPayload }>(),

    /** Dispatched when the API returns 409 Conflict */
    'Conflict': props<{ payload: IHttpErrorPayload }>(),

    /** Dispatched when the API returns 422 Unprocessable Entity or 400 Bad Request */
    'Validation Error': props<{ payload: IHttpErrorPayload }>(),

    /** Dispatched when the API returns 500 Internal Server Error */
    'Server Error': props<{ payload: IHttpErrorPayload }>(),

    /** Dispatched for any other unexpected HTTP error */
    'Unknown Error': props<{ payload: IHttpErrorPayload }>(),

    /** Dispatched when a network error occurs (no response from server) */
    'Network Error': props<{ payload: IHttpErrorPayload }>(),
  }
});
