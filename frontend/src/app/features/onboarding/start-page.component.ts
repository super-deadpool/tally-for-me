import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ErrorCode } from '@contract';
import { isApiRequestError } from '../../core/api/api-error';
import { formatDate, trackingEndDate } from '../../core/utils/dates';
import {
  ButtonComponent,
  CalloutComponent,
  FormFieldComponent,
  InputDirective,
  ModalComponent,
} from '../../shared/ui';
import { TrackerStore } from '../tracker/tracker.store';

/** First-run: choose the day the one-year heatmap starts. */
@Component({
  selector: 'app-start-page',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    CalloutComponent,
    FormFieldComponent,
    InputDirective,
    ModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      max-width: 320px;
    }
    .rules {
      max-width: 560px;
    }
    .rules ul {
      margin: var(--space-1) 0 0;
      padding-left: var(--space-5);
    }
  `,
  template: `
    <div class="page">
      <div class="page-icon" aria-hidden="true">🗓️</div>
      <h1 class="page-title">Choose your start date</h1>
      <p class="page-subtitle">Your heatmap covers one year from this day.</p>

      <div class="page-section rules">
        <ui-callout tone="info">
          How it works:
          <ul>
            <li>Each day you go to the gym, mark it on the heatmap.</li>
            <li>You can only mark <strong>today</strong>. Once a day passes, it's locked.</li>
            <li>The start date can't be changed later.</li>
          </ul>
        </ui-callout>
      </div>

      <form class="page-section" [formGroup]="form" (ngSubmit)="openConfirm()" novalidate>
        <ui-form-field
          label="Start date"
          for="start-date"
          [hint]="endHint()"
          [error]="error()"
        >
          <input
            ui-input
            id="start-date"
            type="date"
            formControlName="startDate"
            [min]="today() ?? ''"
            [invalid]="!!error()"
          />
        </ui-form-field>
        <div>
          <button ui-button variant="primary" type="submit" [disabled]="!today()">
            Start tracking
          </button>
        </div>
      </form>
    </div>

    <ui-modal
      [(open)]="confirmOpen"
      title="Start your year?"
      [description]="confirmText()"
    >
      <div modal-footer>
        <button ui-button (click)="confirmOpen.set(false)">Cancel</button>
        <button ui-button variant="primary" [loading]="saving()" (click)="confirm()" autofocus>
          Start tracking
        </button>
      </div>
    </ui-modal>
  `,
})
export class StartPageComponent {
  private readonly store = inject(TrackerStore);
  private readonly router = inject(Router);

  protected readonly form = inject(NonNullableFormBuilder).group({
    startDate: ['', Validators.required],
  });
  private readonly startDate = toSignal(this.form.controls.startDate.valueChanges, {
    initialValue: '',
  });

  /** Today in the user's timezone, from the server. */
  protected readonly today = this.store.today;
  protected readonly confirmOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly endHint = computed(() => {
    const start = this.startDate();
    if (!start) return 'Today or any future date.';
    return `Runs until ${formatDate(trackingEndDate(start))}.`;
  });

  protected readonly confirmText = computed(() => {
    const start = this.startDate();
    return start
      ? `Your year runs ${formatDate(start)} → ${formatDate(trackingEndDate(start))}. The start date can't be changed later.`
      : '';
  });

  constructor() {
    void this.store.load();
    // Default the field to today once we know it.
    effect(() => {
      const today = this.today();
      if (today && !this.form.controls.startDate.value) {
        this.form.controls.startDate.setValue(today);
      }
    });
  }

  protected openConfirm(): void {
    this.error.set(null);
    const { startDate } = this.form.getRawValue();
    const today = this.today();
    if (!startDate) {
      this.error.set('Pick a date.');
    } else if (today && startDate < today) {
      this.error.set("The start date can't be in the past.");
    } else {
      this.confirmOpen.set(true);
    }
  }

  protected async confirm(): Promise<void> {
    this.saving.set(true);
    try {
      await this.store.setStartDate(this.form.getRawValue().startDate);
      this.confirmOpen.set(false);
      await this.router.navigateByUrl('/tracker');
    } catch (err) {
      this.confirmOpen.set(false);
      if (isApiRequestError(err) && err.code === ErrorCode.START_DATE_ALREADY_SET) {
        await this.router.navigateByUrl('/tracker');
      } else if (isApiRequestError(err)) {
        this.error.set(err.fieldErrors['startDate'] ?? err.message);
      }
    } finally {
      this.saving.set(false);
    }
  }
}

