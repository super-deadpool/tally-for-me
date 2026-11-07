import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, type ToastTone } from '../../core/toast/toast.service';
import { IconComponent, type IconName } from './icon.component';

const ICONS: Record<ToastTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  error: 'alert-circle',
};

/** Renders ToastService messages. Mount once at the app root. */
@Component({
  selector: 'ui-toast-container',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-live': 'polite', 'aria-atomic': 'false' },
  styles: `
    :host {
      position: fixed;
      left: 50%;
      bottom: var(--space-6);
      z-index: var(--z-toast);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      transform: translateX(-50%);
      width: max-content;
      max-width: calc(100vw - 2 * var(--space-4));
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      padding: 10px var(--space-3);
      border-radius: var(--radius-md);
      background: var(--color-tooltip-bg);
      color: var(--color-tooltip-text);
      box-shadow: var(--shadow-md);
      font-size: var(--text-sm);
      pointer-events: auto;
      cursor: pointer;
      animation: toast-in var(--duration) var(--ease-out);
    }
    ui-icon {
      margin-top: 2px;
    }
    .toast[data-tone='success'] ui-icon {
      color: #6fcf97;
    }
    .toast[data-tone='error'] ui-icon {
      color: #ff7369;
    }
    .detail {
      display: block;
      margin-top: 2px;
      font-family: var(--font-mono);
      font-size: 11px;
      opacity: 0.6;
    }
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
  `,
  template: `
    @for (toast of toasts(); track toast.id) {
      <div
        class="toast"
        [attr.data-tone]="toast.tone"
        [attr.role]="toast.tone === 'error' ? 'alert' : 'status'"
        (click)="dismiss(toast.id)"
      >
        <ui-icon [name]="icons[toast.tone]" />
        <div>
          {{ toast.message }}
          @if (toast.detail) {
            <span class="detail">{{ toast.detail }}</span>
          }
        </div>
      </div>
    }
  `,
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);
  protected readonly toasts = this.toastService.toasts;
  protected readonly icons = ICONS;

  protected dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
