import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PageTitleStrategy } from '../../core/layout/page-title.strategy';
import { ButtonComponent, IconComponent } from '../../shared/ui';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SidebarState } from '../sidebar-state.service';

/** App frame: sidebar + top bar + scrollable page area (projected content). */
@Component({
  selector: 'app-shell',
  imports: [SidebarComponent, ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './shell.component.scss',
  template: `
    <app-sidebar />
    @if (sidebar.mobileOpen()) {
      <div class="scrim" (click)="sidebar.closeMobile()"></div>
    }
    <div class="main">
      <header class="topbar">
        @if (sidebar.isMobile() || sidebar.collapsed()) {
          <button
            ui-button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Open sidebar"
            (click)="sidebar.show()"
          >
            <ui-icon [name]="sidebar.isMobile() ? 'menu' : 'chevrons-right'" />
          </button>
        }
        <span class="crumb">{{ pageTitle() }}</span>
      </header>
      <main class="content">
        <ng-content />
      </main>
    </div>
  `,
})
export class ShellComponent {
  protected readonly sidebar = inject(SidebarState);
  protected readonly pageTitle = inject(PageTitleStrategy).current;
}
