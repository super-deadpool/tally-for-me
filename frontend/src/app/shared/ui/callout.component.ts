import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent, type IconName } from './icon.component';

export type CalloutTone = 'default' | 'info' | 'success' | 'warning' | 'error';

const ICON_BY_TONE: Record<CalloutTone, IconName> = {
  default: 'info',
  info: 'info',
  success: 'check-circle',
  warning: 'alert-circle',
  error: 'alert-circle',
};

/** Notion-style callout block. */
@Component({
  selector: 'ui-callout',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.role]': 'tone() === "error" ? "alert" : null',
  },
  styles: `
    :host {
      display: flex;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-sm);
      background: var(--color-bg-muted);
      color: var(--color-text);
      font-size: var(--text-sm);
    }
    :host([data-tone='info']) {
      background: var(--color-info-bg);
    }
    :host([data-tone='success']) {
      background: var(--color-success-bg);
    }
    :host([data-tone='warning']) {
      background: var(--color-warning-bg);
    }
    :host([data-tone='error']) {
      background: var(--color-danger-bg);
    }
    ui-icon {
      margin-top: 2px;
    }
    :host([data-tone='info']) ui-icon {
      color: var(--color-info);
    }
    :host([data-tone='success']) ui-icon {
      color: var(--color-success);
    }
    :host([data-tone='warning']) ui-icon {
      color: var(--color-warning);
    }
    :host([data-tone='error']) ui-icon {
      color: var(--color-danger);
    }
    .content {
      flex: 1;
      min-width: 0;
    }
  `,
  template: `
    <ui-icon [name]="icon()" />
    <div class="content"><ng-content /></div>
  `,
})
export class CalloutComponent {
  readonly tone = input<CalloutTone>('default');
  protected readonly icon = computed(() => ICON_BY_TONE[this.tone()]);
}
