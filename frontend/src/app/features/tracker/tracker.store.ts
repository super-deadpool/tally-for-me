import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ErrorCode, type TrackerResponse } from '@contract';
import { ApiService } from '../../core/api/api.service';
import { type ApiRequestError, toApiRequestError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/toast/toast.service';
import type { DateString } from '../../core/utils/dates';
import { type TrackingWindow, buildHeatmap, computeStats, isWithin } from './calendar';

/**
 * not-started — no start date chosen
 * upcoming    — start date is in the future
 * active      — today is inside the tracking year
 * finished    — the year is over
 */
export type TrackerPhase = 'not-started' | 'upcoming' | 'active' | 'finished';

/** Server state for the tracker: load, set start date, toggle today. */
@Injectable({ providedIn: 'root' })
export class TrackerStore {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  private readonly _data = signal<TrackerResponse | null>(null);
  readonly data = this._data.asReadonly();
  readonly loading = signal(false);
  readonly error = signal<ApiRequestError | null>(null);
  readonly toggling = signal(false);

  readonly today = computed(() => this._data()?.today ?? null);
  readonly todayChecked = computed(() => this._data()?.todayChecked ?? false);

  private readonly window = computed<TrackingWindow | null>(() => {
    const d = this._data();
    if (!d?.startDate || !d.endDate) return null;
    return {
      startDate: d.startDate,
      endDate: d.endDate,
      today: d.today,
      checked: new Set(d.checkedDates),
    };
  });

  readonly heatmap = computed(() => {
    const w = this.window();
    return w ? buildHeatmap(w) : null;
  });

  readonly stats = computed(() => {
    const w = this.window();
    return w ? computeStats(w) : null;
  });

  readonly phase = computed<TrackerPhase>(() => {
    const d = this._data();
    if (!d?.startDate || !d.endDate) return 'not-started';
    if (d.today < d.startDate) return 'upcoming';
    if (d.today > d.endDate) return 'finished';
    return 'active';
  });

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this._data.set(await firstValueFrom(this.api.request('GET /api/tracker')));
    } catch (err) {
      this.error.set(toApiRequestError(err));
    } finally {
      this.loading.set(false);
    }
  }

  reset(): void {
    this._data.set(null);
    this.error.set(null);
  }

  /** Throws ApiRequestError so the form can show field errors. */
  async setStartDate(startDate: DateString): Promise<void> {
    const res = await firstValueFrom(this.api.request('PUT /api/tracker/start', { startDate }));
    this.auth.patchUser({ startDate: res.startDate });
    await this.load();
  }

  /** Optimistically toggles today, rolling back if the server refuses. */
  async toggleToday(): Promise<void> {
    const data = this._data();
    if (!data || this.toggling() || this.phase() !== 'active') return;

    const { today: date, todayChecked: wasChecked } = data;
    this.applyToggle(date, !wasChecked);
    this.toggling.set(true);
    try {
      const res = await firstValueFrom(this.api.request('POST /api/tracker/toggle', { date }));
      this.applyToggle(res.date, res.checked);
      if (res.checked) this.toast.success('Nice work — today is marked as done.');
    } catch (raw) {
      this.applyToggle(date, wasChecked);
      const err = toApiRequestError(raw);
      if (err.code === ErrorCode.DAY_LOCKED || err.code === ErrorCode.OUT_OF_RANGE) {
        this.toast.info('The day has changed — refreshing your tracker.');
        await this.load();
      } else if (err.status >= 400 && err.status < 500 && err.status !== 401) {
        // 401 / 5xx / network are already handled by the error interceptor.
        this.toast.error(err.message);
      }
    } finally {
      this.toggling.set(false);
    }
  }

  private applyToggle(date: DateString, checked: boolean): void {
    this._data.update((d) => {
      if (!d || !d.startDate || !d.endDate || !isWithin(date, d.startDate, d.endDate)) return d;
      const set = new Set(d.checkedDates);
      if (checked) set.add(date);
      else set.delete(date);
      return {
        ...d,
        checkedDates: [...set].sort(),
        todayChecked: date === d.today ? checked : d.todayChecked,
      };
    });
  }
}
