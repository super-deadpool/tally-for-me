import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginModalComponent } from './features/auth/login-modal.component';
import { ShellComponent } from './layout/shell/shell.component';
import { ToastContainerComponent } from './shared/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ShellComponent, LoginModalComponent, ToastContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-shell>
      <router-outlet />
    </app-shell>
    <app-login-modal />
    <ui-toast-container />
  `,
})
export class App {}
