import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { Heatmap, HeatmapDay } from '../calendar';

interface Tooltip {
  label: string;
  x: number;
  y: number;
  align: 'start' | 'center' | 'end';
}

/**
 * GitHub-style year grid: one column per week (Mon..Sun), one cell per day.
 * Only today's cell is interactive; every past day is locked.
 */
@Component({
  selector: 'app-heatmap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './heatmap.component.scss',
  templateUrl: './heatmap.component.html',
})
export class HeatmapComponent {
  readonly heatmap = input.required<Heatmap>();
  /** Whether today's cell can be clicked (false before start / after end). */
  readonly interactive = input(true, { transform: booleanAttribute });
  readonly toggling = input(false, { transform: booleanAttribute });
  readonly toggleToday = output<void>();

  protected readonly weekdays = ['Mon', '', 'Wed', '', 'Fri', '', ''];
  protected readonly tooltip = signal<Tooltip | null>(null);
  protected readonly weekCount = computed(() => this.heatmap().weeks.length);
  private readonly daysByDate = computed(() => {
    const map = new Map<string, HeatmapDay>();
    for (const week of this.heatmap().weeks) {
      for (const day of week) if (day) map.set(day.date, day);
    }
    return map;
  });

  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  constructor() {
    // On narrow screens, start scrolled so today is in view.
    afterNextRender(() => {
      const el = this.scroller().nativeElement;
      const today = el.querySelector<HTMLElement>('[data-today]');
      if (!today || el.scrollWidth <= el.clientWidth) return;
      const offset = today.getBoundingClientRect().left - el.getBoundingClientRect().left;
      el.scrollLeft += offset - el.clientWidth / 2;
    });
  }

  protected onToday(): void {
    if (!this.toggling()) this.toggleToday.emit();
  }

  /** Delegated hover/focus handler for every cell. */
  protected showTooltip(event: Event): void {
    const cell = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-date]');
    const day = cell?.dataset['date'] ? this.daysByDate().get(cell.dataset['date']) : undefined;
    if (!cell || !day) {
      this.tooltip.set(null);
      return;
    }
    const column = Number(cell.dataset['col']);
    const weeks = this.weekCount();
    this.tooltip.set({
      label: day.label,
      x: cell.offsetLeft + cell.offsetWidth / 2,
      y: cell.offsetTop,
      align: column < 4 ? 'start' : column > weeks - 5 ? 'end' : 'center',
    });
  }

  protected hideTooltip(): void {
    this.tooltip.set(null);
  }
}
