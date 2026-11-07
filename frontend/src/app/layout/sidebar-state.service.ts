import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { safeStorage } from '../core/utils/storage';

const COLLAPSED_KEY = 'tally.sidebarCollapsed';
const MOBILE_QUERY = '(max-width: 768px)';

/**
 * Desktop: sidebar is docked and can be collapsed (remembered).
 * Mobile:  sidebar is an off-canvas drawer.
 */
@Injectable({ providedIn: 'root' })
export class SidebarState {
  private readonly media = inject(DOCUMENT).defaultView?.matchMedia(MOBILE_QUERY);

  readonly isMobile = signal(this.media?.matches ?? false);
  readonly collapsed = signal(safeStorage.get(COLLAPSED_KEY) === 'true');
  readonly mobileOpen = signal(false);

  constructor() {
    this.media?.addEventListener('change', (e) => {
      this.isMobile.set(e.matches);
      this.mobileOpen.set(false);
    });
  }

  show(): void {
    if (this.isMobile()) this.mobileOpen.set(true);
    else this.setCollapsed(false);
  }

  hide(): void {
    if (this.isMobile()) this.mobileOpen.set(false);
    else this.setCollapsed(true);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  private setCollapsed(value: boolean): void {
    this.collapsed.set(value);
    safeStorage.set(COLLAPSED_KEY, String(value));
  }
}
