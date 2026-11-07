import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { isApiRequestError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import {
  ButtonComponent,
  CalloutComponent,
  FormFieldComponent,
  InputDirective,
  ModalComponent,
} from '../../shared/ui';

/**
 * The app's only way in: a blocking modal over the blurred app whenever there
 * is no valid session (first visit, logout, expired token).
 */
@Component({
  selector: 'app-login-modal',
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    FormFieldComponent,
    InputDirective,
    ButtonComponent,
    CalloutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .submit {
      margin-top: var(--space-2);
    }
    .footnote {
      margin-top: var(--space-4);
      text-align: center;
      font-size: var(--text-xs);
      color: var(--color-text-tertiary);
    }
  `,
  template: `
    <ui-modal
      [open]="auth.loginRequired()"
      [dismissible]="false"
      [width]="380"
      title="Log in to Tally"
      description="Track every gym day for a year."
    >
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (auth.loginNotice(); as notice) {
          <ui-callout tone="warning">{{ notice }}</ui-callout>
        }

        <ui-form-field label="Username" for="login-username" [error]="fieldError('username')">
          <input
            ui-input
            id="login-username"
            formControlName="username"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            autofocus
            [invalid]="!!fieldError('username')"
          />
        </ui-form-field>

        <ui-form-field label="Password" for="login-password" [error]="fieldError('password')">
          <input
            ui-input
            id="login-password"
            type="password"
            formControlName="password"
            autocomplete="current-password"
            [invalid]="!!fieldError('password')"
          />
        </ui-form-field>

        @if (formError(); as error) {
          <ui-callout tone="error">{{ error }}</ui-callout>
        }

        <button ui-button variant="primary" size="lg" type="submit" fullWidth class="submit" [loading]="submitting()">
          Continue
        </button>
      </form>
      <p class="footnote">Accounts are created by the admin.</p>
    </ui-modal>
  `,
})
export class LoginModalComponent {
  protected readonly auth = inject(AuthService);

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly formError = signal<string | null>(null);
  private readonly serverFieldErrors = signal<Record<string, string>>({});

  protected fieldError(name: 'username' | 'password'): string | null {
    const server = this.serverFieldErrors()[name];
    if (server) return server;
    const control = this.form.controls[name];
    if (control.invalid && (control.touched || this.submitted())) {
      return `${name === 'username' ? 'Username' : 'Password'} is required`;
    }
    return null;
  }

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    this.formError.set(null);
    this.serverFieldErrors.set({});
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    try {
      await this.auth.login(this.form.getRawValue());
      this.form.reset();
      this.submitted.set(false);
    } catch (err) {
      if (isApiRequestError(err) && err.code === 'VALIDATION_ERROR') {
        this.serverFieldErrors.set(err.fieldErrors);
      } else {
        this.formError.set(isApiRequestError(err) ? err.message : 'Login failed. Try again.');
      }
      this.form.controls.password.reset();
    } finally {
      this.submitting.set(false);
    }
  }
}
