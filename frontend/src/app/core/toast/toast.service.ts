import { Injectable, signal } from '@angular/core';

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  /** Secondary line, e.g. a request id for debugging. */
  detail?: string;
}

interface ToastOptions {
  detail?: string;
  durationMs?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  info(message: string, options?: ToastOptions): void {
    this.show('info', message, options);
  }

  success(message: string, options?: ToastOptions): void {
    this.show('success', message, options);
  }

  error(message: string, options?: ToastOptions): void {
    this.show('error', message, { durationMs: 6000, ...options });
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(tone: ToastTone, message: string, options: ToastOptions = {}): void {
    // Don't stack identical messages (e.g. several requests failing at once).
    if (this._toasts().some((t) => t.message === message)) return;

    const toast: Toast = { id: this.nextId++, tone, message };
    if (options.detail) toast.detail = options.detail;
    this._toasts.update((list) => [...list.slice(-2), toast]);
    setTimeout(() => this.dismiss(toast.id), options.durationMs ?? 3500);
  }
}
