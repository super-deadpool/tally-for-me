import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { safeStorage } from '../utils/storage';

export type ThemePreference = 'system' | 'light' | 'dark';

// Keep in sync with the inline script in index.html.
const THEME_KEY = 'tally.theme';
const ORDER: ThemePreference[] = ['system', 'light', 'dark'];

function readPreference(): ThemePreference {
  const saved = safeStorage.get(THEME_KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');
  private readonly systemDark = signal(this.media?.matches ?? false);

  readonly preference = signal<ThemePreference>(readPreference());
  readonly resolved = computed<'light' | 'dark'>(() => {
    const pref = this.preference();
    return pref === 'system' ? (this.systemDark() ? 'dark' : 'light') : pref;
  });

  constructor() {
    this.media?.addEventListener('change', (e) => this.systemDark.set(e.matches));
    effect(() => {
      this.document.documentElement.setAttribute('data-theme', this.resolved());
    });
  }

  set(preference: ThemePreference): void {
    this.preference.set(preference);
    if (preference === 'system') safeStorage.remove(THEME_KEY);
    else safeStorage.set(THEME_KEY, preference);
  }

  /** system -> light -> dark -> system */
  cycle(): void {
    const next = ORDER[(ORDER.indexOf(this.preference()) + 1) % ORDER.length] ?? 'system';
    this.set(next);
  }
}
