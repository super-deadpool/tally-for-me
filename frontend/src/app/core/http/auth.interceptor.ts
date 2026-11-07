import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiService } from '../api/api.service';
import { TokenStorage } from '../auth/token-storage';

/** Attaches `Authorization: Bearer <jwt>` to requests aimed at our API only. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStorage).current();
  if (!token || !inject(ApiService).isApiUrl(req.url)) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
