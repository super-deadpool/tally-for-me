import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent, type IconName } from '../../shared/ui';
import type { TrackerStats } from './calendar';

interface Tile {
  icon: IconName;
  label: string;
  value: string;
  hint: string;
}

@Component({
  selector: 'app-stats',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: var(--space-3);
    }
    @media (max-width: 640px) {
      :host {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    .tile {
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--color-bg-muted);
    }
    .label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
    }
    .value {
      margin-top: var(--space-1);
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
      font-variant-numeric: tabular-nums;
    }
    .hint {
      font-size: var(--text-xs);
      color: var(--color-text-tertiary);
    }
  `,
  template: `
    @for (tile of tiles(); track tile.label) {
      <div class="tile">
        <p class="label"><ui-icon [name]="tile.icon" [size]="14" />{{ tile.label }}</p>
        <p class="value">{{ tile.value }}</p>
        <p class="hint">{{ tile.hint }}</p>
      </div>
    }
  `,
})
export class StatsComponent {
  readonly stats = input.required<TrackerStats>();

  protected readonly tiles = computed<Tile[]>(() => {
    const s = this.stats();
    const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;
    return [
      { icon: 'flame', label: 'Current streak', value: days(s.currentStreak), hint: 'Keep it going' },
      { icon: 'trophy', label: 'Longest streak', value: days(s.longestStreak), hint: 'Personal best' },
      { icon: 'check-circle', label: 'Days at the gym', value: String(s.done), hint: `of ${s.totalDays} this year` },
      {
        icon: 'target',
        label: 'Consistency',
        value: `${Math.round(s.completion * 100)}%`,
        hint: `${s.missed} missed · ${s.remaining} left`,
      },
    ];
  });
}
