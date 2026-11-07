import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Icons are lists of SVG path data on a 24×24 grid, stroked with currentColor
// (Lucide style). Add new icons here.
const circle = (cx: number, cy: number, r: number) =>
  `M${cx + r} ${cy}a${r} ${r} 0 1 1-${2 * r} 0a${r} ${r} 0 1 1 ${2 * r} 0`;
const rect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1-${r} ${r}` +
  `h-${w - 2 * r}a${r} ${r} 0 0 1-${r}-${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r}-${r}z`;

const ICONS = {
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  'chevrons-left': ['m11 17-5-5 5-5', 'm18 17-5-5 5-5'],
  'chevrons-right': ['m6 17 5-5-5-5', 'm13 17 5-5-5-5'],
  grid: [rect(3, 3, 7, 7, 1), rect(14, 3, 7, 7, 1), rect(3, 14, 7, 7, 1), rect(14, 14, 7, 7, 1)],
  calendar: [rect(3, 4, 18, 18, 2), 'M16 2v4', 'M8 2v4', 'M3 10h18'],
  flame: [
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  ],
  target: [circle(12, 12, 10), circle(12, 12, 6), circle(12, 12, 2)],
  trophy: [
    'M6 9H4.5a2.5 2.5 0 0 1 0-5H6',
    'M18 9h1.5a2.5 2.5 0 0 0 0-5H18',
    'M4 22h16',
    'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22',
    'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22',
    'M18 2H6v7a6 6 0 0 0 12 0V2z',
  ],
  'check-circle': [circle(12, 12, 10), 'm9 12 2 2 4-4'],
  'alert-circle': [circle(12, 12, 10), 'M12 8v4', 'M12 16h.01'],
  info: [circle(12, 12, 10), 'M12 16v-4', 'M12 8h.01'],
  sun: [
    circle(12, 12, 4),
    'M12 2v2',
    'M12 20v2',
    'm4.93 4.93 1.41 1.41',
    'm17.66 17.66 1.41 1.41',
    'M2 12h2',
    'M20 12h2',
    'm6.34 17.66-1.41 1.41',
    'm19.07 4.93-1.41 1.41',
  ],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  monitor: [rect(2, 3, 20, 14, 2), 'M8 21h8', 'M12 17v4'],
  'log-out': ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  undo: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'ui-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }
  `,
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @for (d of paths(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(16);
  readonly strokeWidth = input(2);
  protected readonly paths = computed(() => ICONS[this.name()]);
}
