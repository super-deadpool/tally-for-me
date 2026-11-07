import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    'aria-label': 'Loading',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
  styles: `
    :host {
      display: inline-block;
      flex-shrink: 0;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      opacity: 0.7;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
  template: '',
})
export class SpinnerComponent {
  readonly size = input(16);
}
