import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { type RouterStateSnapshot, TitleStrategy } from '@angular/router';

const APP_NAME = 'Tally';

/**
 * Uses each route's `title` for the browser tab ("Tracker · Tally") and
 * exposes it as a signal for the top bar.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  readonly current = signal('');

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot) ?? '';
    this.current.set(pageTitle);
    this.title.setTitle(pageTitle ? `${pageTitle} · ${APP_NAME}` : APP_NAME);
  }
}
