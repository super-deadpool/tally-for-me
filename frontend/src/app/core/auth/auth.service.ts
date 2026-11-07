import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { LoginRequest, PublicUser } from '@contract';
import { ApiService } from '../api/api.service';
import { isApiRequestError } from '../api/api-error';
import { TokenStorage } from './token-storage';

/**
 * restoring     — checking a saved token on startup (show nothing yet)
 * authenticated — user loaded
 * anonymous     — no valid session; the login modal is shown
 */
export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokens = inject(TokenStorage);
  private readonly router = inject(Router);

  private readonly _status = signal<AuthStatus>('restoring');
  private readonly _user = signal<PublicUser | null>(null);
  private readonly _notice = signal<string | null>(null);
  private waiters: (() => void)[] = [];

  readonly status = this._status.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._status() === 'authenticated');
  /** Drives the global login modal. */
  readonly loginRequired = computed(() => this._status() === 'anonymous');
  /** Why the login modal is showing (e.g. session expired), if not a fresh visit. */
  readonly loginNotice = this._notice.asReadonly();

  /** Called once at startup: validates a saved token, if any. */
  async restoreSession(): Promise<void> {
    if (!this.tokens.current()) {
      this._status.set('anonymous');
      return;
    }
    try {
      const { user } = await firstValueFrom(this.api.request('GET /api/auth/me'));
      this.setAuthenticated(user);
    } catch (err) {
      // 401s are handled by the interceptor (token cleared). Anything else
      // (server down) keeps the token so a later retry can still use it.
      if (isApiRequestError(err) && err.code === 'NETWORK_ERROR') {
        this._notice.set("Can't reach the server right now.");
      }
      this._status.set('anonymous');
    }
  }

  async login(credentials: LoginRequest): Promise<void> {
    const { token, user } = await firstValueFrom(
      this.api.request('POST /api/auth/login', credentials),
    );
    this.tokens.set(token);
    this.setAuthenticated(user);
  }

  logout(): void {
    this.clearSession(null);
    // Re-run guards so protected pages wait for the next login.
    void this.router.navigateByUrl('/');
  }

  /** Called by the error interceptor when the server rejects our token. */
  handleUnauthorized(): void {
    if (this._status() !== 'authenticated') {
      this.tokens.clear();
      return;
    }
    this.clearSession('Your session expired. Please log in again.');
  }

  /** Keep the cached user in sync after changes (e.g. start date set). */
  patchUser(patch: Partial<PublicUser>): void {
    this._user.update((u) => (u ? { ...u, ...patch } : u));
  }

  /** Resolves once a user is authenticated (immediately if already). Used by guards. */
  whenAuthenticated(): Promise<void> {
    if (this._status() === 'authenticated') return Promise.resolve();
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  private setAuthenticated(user: PublicUser): void {
    this._user.set(user);
    this._notice.set(null);
    this._status.set('authenticated');
    const waiters = this.waiters;
    this.waiters = [];
    waiters.forEach((resolve) => resolve());
  }

  private clearSession(notice: string | null): void {
    this.tokens.clear();
    this._user.set(null);
    this._notice.set(notice);
    this._status.set('anonymous');
  }
}
