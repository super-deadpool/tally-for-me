import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService, type ThemePreference } from '../../core/theme/theme.service';
import { formatDate } from '../../core/utils/dates';
import { AvatarComponent, ButtonComponent, IconComponent, type IconName } from '../../shared/ui';
import { SidebarState } from '../sidebar-state.service';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
}

const THEME_META: Record<ThemePreference, { label: string; icon: IconName }> = {
  system: { label: 'System', icon: 'monitor' },
  light: { label: 'Light', icon: 'sun' },
  dark: { label: 'Dark', icon: 'moon' },
};

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, AvatarComponent, ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.collapsed]': 'state.collapsed() && !state.isMobile()',
    '[class.mobile-open]': 'state.mobileOpen()',
  },
  styleUrl: './sidebar.component.scss',
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  protected readonly state = inject(SidebarState);
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);

  protected readonly username = computed(() => this.auth.user()?.username ?? '');

  protected readonly navItems = computed<NavItem[]>(() =>
    this.auth.user()?.startDate
      ? [{ label: 'Tracker', path: '/tracker', icon: 'grid' }]
      : [{ label: 'Get started', path: '/start', icon: 'calendar' }],
  );

  protected readonly startedOn = computed(() => {
    const start = this.auth.user()?.startDate;
    return start ? formatDate(start) : null;
  });

  protected readonly themeMeta = computed(() => THEME_META[this.theme.preference()]);

  protected onNavigate(): void {
    this.state.closeMobile();
  }
}
