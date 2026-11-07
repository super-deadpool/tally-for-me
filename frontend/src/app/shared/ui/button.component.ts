import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { SpinnerComponent } from './spinner.component';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Applied to native elements so semantics stay intact:
 *   <button ui-button variant="primary" [loading]="saving()">Save</button>
 *   <a ui-button variant="ghost" routerLink="/x">Go</a>
 *   <button ui-button iconOnly aria-label="Close"><ui-icon name="x" /></button>
 */
@Component({
  selector: 'button[ui-button], a[ui-button]',
  imports: [SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-button',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[class.icon-only]': 'iconOnly()',
    '[class.full-width]': 'fullWidth()',
    '[class.loading]': 'loading()',
    '[attr.disabled]': 'disabled() || loading() ? "" : null',
    '[attr.aria-disabled]': 'disabled() || loading() ? "true" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
  styleUrl: './button.component.scss',
  template: `
    @if (loading()) {
      <ui-spinner class="spinner" [size]="14" />
    }
    <span class="content"><ng-content /></span>
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
}
