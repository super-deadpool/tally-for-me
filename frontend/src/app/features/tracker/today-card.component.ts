import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { type DateString, diffDays, formatDate } from '../../core/utils/dates';
import { ButtonComponent, IconComponent } from '../../shared/ui';
import type { TrackerPhase } from './tracker.store';

/** The day's single action: mark (or unmark) today. */
@Component({
  selector: 'app-today-card',
  imports: [ButtonComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.done]': 'checked() && phase() === "active"' },
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4) var(--space-5);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-inset-border);
      transition: background var(--duration) var(--ease-out);
    }
    :host(.done) {
      background: var(--color-success-bg);
      box-shadow: none;
    }
    .check {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      border-radius: var(--radius-md);
      background: var(--color-bg-muted);
      color: var(--color-text-tertiary);
      box-shadow: var(--shadow-inset-border);
    }
    :host(.done) .check {
      background: var(--heat-done);
      color: #fff;
      box-shadow: none;
    }
    .text {
      flex: 1;
      min-width: 0;
    }
    .eyebrow {
      font-size: var(--text-xs);
      color: var(--color-text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .headline {
      font-size: var(--text-md);
      font-weight: var(--weight-semibold);
    }
    @media (max-width: 480px) {
      :host {
        flex-wrap: wrap;
      }
      button {
        width: 100%;
      }
    }
  `,
  template: `
    <div class="check" aria-hidden="true">
      <ui-icon [name]="phase() === 'active' && checked() ? 'check' : 'calendar'" [size]="20" />
    </div>
    <div class="text">
      <p class="eyebrow">{{ todayLabel() }}</p>
      <p class="headline">{{ headline() }}</p>
    </div>
    @if (phase() === 'active') {
      @if (checked()) {
        <button ui-button variant="ghost" [loading]="toggling()" (click)="toggle.emit()">
          <ui-icon name="undo" />
          Undo
        </button>
      } @else {
        <button ui-button variant="primary" [loading]="toggling()" (click)="toggle.emit()">
          <ui-icon name="check" />
          Mark today as done
        </button>
      }
    }
  `,
})
export class TodayCardComponent {
  readonly phase = input.required<TrackerPhase>();
  readonly today = input.required<DateString>();
  readonly startDate = input<DateString | null>(null);
  readonly checked = input(false);
  readonly toggling = input(false);
  readonly toggle = output<void>();

  protected readonly todayLabel = computed(() =>
    formatDate(this.today(), { weekday: 'long', month: 'long', day: 'numeric' }),
  );

  protected readonly headline = computed(() => {
    switch (this.phase()) {
      case 'upcoming': {
        const start = this.startDate();
        const days = start ? diffDays(this.today(), start) : 0;
        return `Your year starts ${start ? formatDate(start) : 'soon'} — ${days} day${days === 1 ? '' : 's'} to go.`;
      }
      case 'finished':
        return 'Your year is complete. Look at that heatmap!';
      case 'not-started':
        return 'Pick a start date to begin.';
      default:
        return this.checked()
          ? 'Done for today. See you tomorrow!'
          : 'Did you hit the gym today?';
    }
  });
}
