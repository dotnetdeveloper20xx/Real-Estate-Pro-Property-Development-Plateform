// @ts-nocheck
import { HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, throwError, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';

import { httpErrorInterceptor } from './http-error.interceptor';
import { ToastService } from '../services/toast.service';
import { HttpErrorActions } from '../store/error.actions';

describe('httpErrorInterceptor', () => {
  let store: jasmine.SpyObj<Store>;
  let router: jasmine.SpyObj<Router>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    store = jasmine.createSpyObj('Store', ['dispatch']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    toast = jasmine.createSpyObj('ToastService', [
      'showError',
      'showWarning',
      'showSuccess',
      'showInfo'
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: Store, useValue: store },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toast }
      ]
    });
  });

  function runInterceptor(
    errorResponse: HttpErrorResponse
  ): Observable<HttpEvent<unknown>> {
    const req = new HttpRequest('GET', '/api/v1/opportunities');
    const next: HttpHandlerFn = () => throwError(() => errorResponse);

    return TestBed.runInInjectionContext(() => httpErrorInterceptor(req, next));
  }

  function createErrorResponse(status: number, body?: unknown): HttpErrorResponse {
    return new HttpErrorResponse({
      status,
      statusText: 'Error',
      url: '/api/v1/opportunities',
      error: body
    });
  }

  it('should dispatch unauthorized action and redirect to login on 401', (done) => {
    const error = createErrorResponse(401);

    runInterceptor(error).subscribe({
      error: () => {
        expect(store.dispatch).toHaveBeenCalledWith(
          jasmine.objectContaining({
            type: HttpErrorActions.unauthorized.type
          })
        );
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        expect(toast.showWarning).toHaveBeenCalledWith(
          'Your session has expired. Please log in again.'
        );
        done();
      }
    });
  });

  it('should dispatch forbidden action and show warning on 403', (done) => {
    const error = createErrorResponse(403);

    runInterceptor(error).subscribe({
      error: () => {
        expect(store.dispatch).toHaveBeenCalledWith(
          jasmine.objectContaining({
            type: HttpErrorActions.forbidden.type
          })
        );
        expect(toast.showWarning).toHaveBeenCalledWith(
          'You do not have permission to perform this action.'
        );
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      }
    });
  });

  it('should dispatch server error action and show retry message on 500', (done) => {
    const error = createErrorResponse(500);

    runInterceptor(error).subscribe({
      error: () => {
        expect(store.dispatch).toHaveBeenCalledWith(
          jasmine.objectContaining({
            type: HttpErrorActions.serverError.type
          })
        );
        expect(toast.showError).toHaveBeenCalledWith(
          'A server error occurred. Please try again later or contact support.'
        );
        done();
      }
    });
  });

  it('should dispatch network error action on status 0', (done) => {
    const error = createErrorResponse(0);

    runInterceptor(error).subscribe({
      error: () => {
        expect(store.dispatch).toHaveBeenCalledWith(
          jasmine.objectContaining({
            type: HttpErrorActions.networkError.type
          })
        );
        expect(toast.showError).toHaveBeenCalledWith(
          'Unable to reach the server. Please check your internet connection.'
        );
        done();
      }
    });
  });

  it('should dispatch not found action on 404', (done) => {
    const error = createErrorResponse(404);

    runInterceptor(error).subscribe({
      error: () => {
        expect(store.dispatch).toHaveBeenCalledWith(
          jasmine.objectContaining({
            type: HttpErrorActions.notFound.type
          })
        );
        expect(toast.showWarning).toHaveBeenCalled();
        done();
      }
    });
  });

  it('should dispatch conflict action on 409', (done) => {
    const error = createErrorResponse(409, {
      errors: ['A record with this name already exists.']
    });

    runInterceptor(error).subscribe({
      error: () => {
        expect(store.dispatch).toHaveBeenCalledWith(
          jasmine.objectContaining({
            type: HttpErrorActions.conflict.type
          })
        );
        expect(toast.showWarning).toHaveBeenCalledWith(
          'A record with this name already exists.'
        );
        done();
      }
    });
  });

  it('should dispatch validation error action on 400', (done) => {
    const error = createErrorResponse(400, {
      errors: ['Name is required.']
    });

    runInterceptor(error).subscribe({
      error: () => {
        expect(store.dispatch).toHaveBeenCalledWith(
          jasmine.objectContaining({
            type: HttpErrorActions.validationError.type
          })
        );
        expect(toast.showError).toHaveBeenCalledWith('Name is required.');
        done();
      }
    });
  });

  it('should dispatch unknown error action for unhandled status codes', (done) => {
    const error = createErrorResponse(418);

    runInterceptor(error).subscribe({
      error: () => {
        expect(store.dispatch).toHaveBeenCalledWith(
          jasmine.objectContaining({
            type: HttpErrorActions.unknownError.type
          })
        );
        expect(toast.showError).toHaveBeenCalled();
        done();
      }
    });
  });

  it('should extract message from ProblemDetails format', (done) => {
    const error = createErrorResponse(400, {
      title: 'Validation failed',
      status: 400
    });

    runInterceptor(error).subscribe({
      error: () => {
        expect(toast.showError).toHaveBeenCalledWith('Validation failed');
        done();
      }
    });
  });

  it('should re-throw the error so callers can handle it', (done) => {
    const error = createErrorResponse(500);

    runInterceptor(error).subscribe({
      next: () => fail('should not emit next'),
      error: (err) => {
        expect(err).toBe(error);
        done();
      }
    });
  });
});
