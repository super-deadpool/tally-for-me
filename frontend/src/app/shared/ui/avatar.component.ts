import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Square initial avatar, like Notion's workspace icon. */
@Component({
  selector: 'ui-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'size() * 0.55',
  },
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border-radius: var(--radius-sm);
      background: var(--color-orange-bg);
      color: var(--color-orange);
      font-weight: var(--weight-semibold);
      line-height: 1;
      text-transform: uppercase;
    }
  `,
  template: `{{ initial() }}`,
})
export class AvatarComponent {
  readonly name = input('');
  readonly size = input(22);
  protected readonly initial = computed(() => this.name().trim().charAt(0) || '·');
}
