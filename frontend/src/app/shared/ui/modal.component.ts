import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  booleanAttribute,
  effect,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { ButtonComponent } from './button.component';
import { IconComponent } from './icon.component';

let nextId = 0;

/**
 * Accessible modal built on native <dialog> (focus trap, Escape, top layer).
 * The page behind is dimmed and blurred.
 *
 *   <ui-modal [(open)]="confirmOpen" title="Delete?" description="...">
 *     body content
 *     <div modal-footer> <button ui-button>Cancel</button> ... </div>
 *   </ui-modal>
 *
 * Set [dismissible]="false" for blocking modals (no Escape/backdrop/close button).
 * Put `autofocus` on the element that should receive focus when it opens.
 */
@Component({
  selector: 'ui-modal',
  imports: [ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './modal.component.scss',
  template: `
    <dialog
      #dialog
      class="dialog"
      [attr.aria-labelledby]="title() ? titleId : null"
      [attr.aria-describedby]="description() ? descriptionId : null"
      (cancel)="onCancel($event)"
      (click)="onDialogClick($event)"
    >
      <div class="panel" [style.max-width.px]="width()">
        @if (title() || dismissible()) {
          <header class="header">
            <div class="heading">
              @if (title()) {
                <h2 class="title" [id]="titleId">{{ title() }}</h2>
              }
              @if (description()) {
                <p class="description" [id]="descriptionId">{{ description() }}</p>
              }
            </div>
            @if (dismissible()) {
              <button
                ui-button
                variant="ghost"
                size="sm"
                iconOnly
                class="close"
                aria-label="Close"
                (click)="dismiss()"
              >
                <ui-icon name="x" />
              </button>
            }
          </header>
        }
        <div class="body"><ng-content /></div>
        <footer class="footer"><ng-content select="[modal-footer]" /></footer>
      </div>
    </dialog>
  `,
})
export class ModalComponent {
  readonly open = model(false);
  readonly title = input<string>();
  readonly description = input<string>();
  readonly dismissible = input(true, { transform: booleanAttribute });
  readonly width = input(420);
  /** Emitted when the user dismisses the modal (Escape, backdrop, close button). */
  readonly dismissed = output<void>();

  protected readonly titleId = `ui-modal-title-${nextId}`;
  protected readonly descriptionId = `ui-modal-desc-${nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) el.showModal();
      else if (!this.open() && el.open) el.close();
    });
  }

  dismiss(): void {
    if (!this.dismissible()) return;
    this.open.set(false);
    this.dismissed.emit();
  }

  protected onCancel(event: Event): void {
    event.preventDefault(); // we control closing ourselves
    this.dismiss();
  }

  protected onDialogClick(event: MouseEvent): void {
    // The dialog element itself only receives clicks on the backdrop area.
    if (event.target === this.dialog().nativeElement) this.dismiss();
  }
}
