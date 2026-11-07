import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { formatDate } from '../../core/utils/dates';
import { ButtonComponent, CalloutComponent } from '../../shared/ui';
import { HeatmapComponent } from './heatmap/heatmap.component';
import { StatsComponent } from './stats.component';
import { TodayCardComponent } from './today-card.component';
import { TrackerStore } from './tracker.store';

@Component({
  selector: 'app-tracker-page',
  imports: [ButtonComponent, CalloutComponent, HeatmapComponent, StatsComponent, TodayCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .skeleton-card {
      height: 70px;
      margin-top: var(--space-8);
    }
    .skeleton-grid {
      height: 150px;
      margin-top: var(--space-8);
    }
    ui-callout button {
      margin-top: var(--space-2);
    }
  `,
  template: `
    <div class="page">
      <div class="page-icon" aria-hidden="true">🏋️</div>
      <h1 class="page-title">Gym tracker</h1>
      <p class="page-subtitle">
        @if (range(); as r) {
          {{ r }} · Missed days can't be filled in later.
        } @else {
          One year, one square per day.
        }
      </p>

      @if (store.data(); as data) {
        <div class="page-section">
          <app-today-card
            [phase]="store.phase()"
            [today]="data.today"
            [startDate]="data.startDate"
            [checked]="store.todayChecked()"
            [toggling]="store.toggling()"
            (toggle)="store.toggleToday()"
          />
        </div>

        @if (store.stats(); as stats) {
          <div class="page-section">
            <app-stats [stats]="stats" />
          </div>
        }

        @if (store.heatmap(); as heatmap) {
          <section class="page-section">
            <h2 class="section-title">Your year</h2>
            <app-heatmap
              [heatmap]="heatmap"
              [interactive]="store.phase() === 'active'"
              [toggling]="store.toggling()"
              (toggleToday)="store.toggleToday()"
            />
          </section>
        }
      } @else if (store.error(); as error) {
        <div class="page-section">
          <ui-callout tone="error">
            <p>Couldn't load your tracker. {{ error.message }}</p>
            <button ui-button size="sm" (click)="store.load()" [loading]="store.loading()">
              Try again
            </button>
          </ui-callout>
        </div>
      } @else {
        <div class="skeleton skeleton-card"></div>
        <div class="skeleton skeleton-grid"></div>
      }
    </div>
  `,
})
export class TrackerPageComponent {
  protected readonly store = inject(TrackerStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly range = computed(() => {
    const d = this.store.data();
    return d?.startDate && d.endDate ? `${formatDate(d.startDate)} → ${formatDate(d.endDate)}` : null;
  });

  constructor() {
    // Load for whoever is logged in; clear when logged out (data stays hidden
    // behind the login modal), reload after re-login.
    effect(() => {
      const user = this.auth.user();
      untracked(() => (user ? void this.store.load() : this.store.reset()));
    });

    // A different user may log in without a start date.
    effect(() => {
      const data = this.store.data();
      if (data && !data.startDate) void this.router.navigateByUrl('/start');
    });

    // Coming back to the tab (possibly on a new day): refresh "today".
    const document = inject(DOCUMENT);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && this.auth.isAuthenticated()) {
        void this.store.load();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
  }
}
