import { HttpClient } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { ApiEndpoints, ApiSuccess } from '@contract';

/**
 * Prefix for API paths. Empty by default: in dev, `ng serve` proxies /api to
 * the backend (proxy.conf.json); in prod, serve the app and API on one origin
 * or provide a full URL here.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '',
});

export type Endpoint = keyof ApiEndpoints;
export type RequestBody<E extends Endpoint> = ApiEndpoints[E]['body'];
export type ResponseData<E extends Endpoint> = ApiEndpoints[E]['response'];
type BodyArgs<E extends Endpoint> = RequestBody<E> extends undefined ? [] : [body: RequestBody<E>];

/**
 * Typed gateway to the backend. Endpoints, bodies and responses all come from
 * the shared contract, so a wrong body or a misread response is a compile error:
 *
 *   api.request('POST /api/tracker/toggle', { date })  // Observable<ToggleDayResponse>
 *
 * The envelope is unwrapped — you receive `data`. Failures arrive as
 * ApiRequestError (normalized by errorInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  request<E extends Endpoint>(endpoint: E, ...args: BodyArgs<E>): Observable<ResponseData<E>> {
    const [method, path] = endpoint.split(' ') as [string, string];
    return this.http
      .request<ApiSuccess<ResponseData<E>>>(method, this.baseUrl + path, { body: args[0] })
      .pipe(map((res) => res.data));
  }

  /** True if the URL targets our API (used to scope the auth header). */
  isApiUrl(url: string): boolean {
    return url.startsWith(`${this.baseUrl}/api/`);
  }
}
