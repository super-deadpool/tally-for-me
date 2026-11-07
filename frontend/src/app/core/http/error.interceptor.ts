import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorCode } from '@contract';
import { toApiRequestError } from '../api/api-error';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../toast/toast.service';

/**
 * Normalizes every HTTP failure into ApiRequestError and handles the
 * cross-cutting cases so features don't have to:
 *   401 UNAUTHORIZED   -> end the session (login modal opens)
 *   network / 5xx      -> toast with the request id for debugging
 * Feature-specific errors (validation, DAY_LOCKED, ...) are rethrown untouched.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((raw: unknown) => {
      const error = toApiRequestError(raw);

      console.warn(
        `[api] ${req.method} ${req.urlWithParams} -> ${error.status} ${error.code}`,
        error.requestId ? `(requestId ${error.requestId})` : '',
      );

      if (error.status === 401 && error.code === ErrorCode.UNAUTHORIZED) {
        auth.handleUnauthorized();
      } else if (!auth.loginRequired() && (error.code === 'NETWORK_ERROR' || error.status >= 500)) {
        toast.error(error.message, error.requestId ? { detail: `Ref ${error.requestId}` } : {});
      }

      return throwError(() => error);
    }),
  );
};
