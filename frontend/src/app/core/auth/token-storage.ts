import { Injectable, signal } from '@angular/core';
import { safeStorage } from '../utils/storage';

const TOKEN_KEY = 'tally.token';

/** Holds the JWT in memory and localStorage. */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private readonly token = signal<string | null>(safeStorage.get(TOKEN_KEY));
  readonly current = this.token.asReadonly();

  set(token: string): void {
    safeStorage.set(TOKEN_KEY, token);
    this.token.set(token);
  }

  clear(): void {
    safeStorage.remove(TOKEN_KEY);
    this.token.set(null);
  }
}
