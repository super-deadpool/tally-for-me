import { HttpErrorResponse } from '@angular/common/http';
import type { ApiError, ErrorCode, ValidationIssue } from '@contract';

/** Server error codes plus the ones only the client can produce. */
export type ClientErrorCode = ErrorCode | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';

/**
 * The only error type API calls reject with (see errorInterceptor).
 * Branch on `code`, show `message`, and quote `requestId` when debugging —
 * it matches a line in the server log.
 */
export class ApiRequestError extends Error {
  override readonly name = 'ApiRequestError';

  constructor(
    readonly status: number,
    readonly code: ClientErrorCode,
    message: string,
    readonly requestId: string | null = null,
    readonly details: readonly ValidationIssue[] = [],
  ) {
    super(message);
  }

  /** Validation issues as { field: message }, handy for forms. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

function isApiErrorBody(body: unknown): body is ApiError {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as ApiError).status === 'error' &&
    typeof (body as ApiError).error?.code === 'string'
  );
}

/** Converts anything thrown by HttpClient into an ApiRequestError. */
export function toApiRequestError(err: unknown): ApiRequestError {
  if (err instanceof ApiRequestError) return err;

  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return new ApiRequestError(0, 'NETWORK_ERROR', "Can't reach the server. Check your connection.");
    }
    if (isApiErrorBody(err.error)) {
      const body = err.error;
      return new ApiRequestError(
        err.status,
        body.error.code,
        body.message,
        body.error.requestId,
        body.error.details ?? [],
      );
    }
    // Not our envelope (e.g. proxy error page, server down behind the proxy).
    return new ApiRequestError(
      err.status,
      'UNKNOWN_ERROR',
      err.status >= 500 ? 'The server is unavailable right now.' : err.message,
      err.headers.get('X-Request-Id'),
    );
  }

  const message = err instanceof Error ? err.message : 'Unexpected error';
  return new ApiRequestError(-1, 'UNKNOWN_ERROR', message);
}

export function isApiRequestError(err: unknown): err is ApiRequestError {
  return err instanceof ApiRequestError;
}
