import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

/**
 * Styles a native control (see styles/_controls.scss) and reflects validity.
 *   <input ui-input id="name" [invalid]="!!error()" />
 */
@Directive({
  selector: 'input[ui-input], select[ui-input], textarea[ui-input]',
  host: {
    class: 'ui-input',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export class InputDirective {
  readonly invalid = input(false);
}

/**
 * Label + control + hint/error, laid out consistently.
 *   <ui-form-field label="Username" for="username" [error]="usernameError()">
 *     <input ui-input id="username" />
 *   </ui-form-field>
 */
@Component({
  selector: 'ui-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    label {
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      color: var(--color-text-secondary);
    }
    .message {
      font-size: var(--text-xs);
      color: var(--color-text-tertiary);
    }
    .message.error {
      color: var(--color-danger);
    }
  `,
  template: `
    @if (label()) {
      <label [attr.for]="for()">{{ label() }}</label>
    }
    <ng-content />
    @if (error()) {
      <p class="message error" role="alert">{{ error() }}</p>
    } @else if (hint()) {
      <p class="message">{{ hint() }}</p>
    }
  `,
})
export class FormFieldComponent {
  readonly label = input<string>();
  /** id of the control, links the label to it. */
  readonly for = input<string>();
  readonly hint = input<string>();
  readonly error = input<string | null>(null);
}
