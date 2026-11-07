// =============================================================================
// API contract shared between backend and frontend.
//
// This file must stay dependency-free (no imports) so the frontend can import
// or copy it as-is. Every endpoint's request body and response `data` is
// described here; the backend's validation schemas are type-checked against
// these interfaces, so they cannot drift apart.
// =============================================================================

// ---------------------------------------------------------------------------
// Response envelope — every response has this shape.
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> {
    status: "success";
    message: string;
    data: T;
}

export interface ApiError {
    status: "error";
    message: string;
    data: null;
    error: {
        code: ErrorCode;
        /** Also sent as the X-Request-Id header; matches server log lines. */
        requestId: string;
        /** Present for VALIDATION_ERROR: which fields were wrong and why. */
        details?: ValidationIssue[];
    };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface ValidationIssue {
    /** Dot path of the offending field, e.g. "startDate". */
    field: string;
    message: string;
}

export const ErrorCode = {
    /** 400 — body failed validation; see error.details. */
    VALIDATION_ERROR: "VALIDATION_ERROR",
    /** 400 — body was not valid JSON. */
    INVALID_JSON: "INVALID_JSON",
    /** 401 — missing, invalid or expired token. Show the login modal. */
    UNAUTHORIZED: "UNAUTHORIZED",
    /** 401 — wrong username or password. */
    INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
    /** 400 — start date must be today or later. */
    START_DATE_IN_PAST: "START_DATE_IN_PAST",
    /** 409 — start date can only be set once. */
    START_DATE_ALREADY_SET: "START_DATE_ALREADY_SET",
    /** 409 — tracking hasn't started; set a start date first. */
    START_DATE_NOT_SET: "START_DATE_NOT_SET",
    /** 403 — only today can be toggled; past days are locked. */
    DAY_LOCKED: "DAY_LOCKED",
    /** 403 — date is outside the one-year tracking window. */
    OUT_OF_RANGE: "OUT_OF_RANGE",
    /** 404 — no such route. */
    NOT_FOUND: "NOT_FOUND",
    /** 500 — unexpected server error; check logs for the requestId. */
    INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ---------------------------------------------------------------------------
// Shared models
// ---------------------------------------------------------------------------

/** Calendar date in "YYYY-MM-DD" format. */
export type DateString = string;

export interface PublicUser {
    id: string;
    username: string;
    /** First day of the heatmap; null until the user picks one. */
    startDate: DateString | null;
    /** IANA timezone that decides what "today" is, e.g. "Asia/Kolkata". */
    timezone: string;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** POST /api/auth/login (public) */
export interface LoginRequest {
    username: string;
    password: string;
}
export interface LoginResponse {
    /** JWT — send as `Authorization: Bearer <token>` on every other request. */
    token: string;
    user: PublicUser;
}

/** GET /api/auth/me */
export interface MeResponse {
    user: PublicUser;
}

// ---------------------------------------------------------------------------
// Tracker
// ---------------------------------------------------------------------------

/**
 * GET /api/tracker
 *
 * Render every day from startDate to endDate:
 *   in checkedDates            -> went to the gym
 *   before today, not checked  -> missed (locked forever)
 *   === today                  -> toggleable
 *   after today                -> future
 */
export interface TrackerResponse {
    startDate: DateString | null;
    /** Last day (inclusive) of the one-year window; null if not started. */
    endDate: DateString | null;
    /** Today in the user's timezone — use this, not the browser's clock. */
    today: DateString;
    timezone: string;
    /** Sorted ascending. */
    checkedDates: DateString[];
    todayChecked: boolean;
}

/** PUT /api/tracker/start — can only be set once, to today or later. */
export interface SetStartDateRequest {
    startDate: DateString;
}
export interface SetStartDateResponse {
    startDate: DateString;
    endDate: DateString;
}

/** POST /api/tracker/toggle — `date` must equal TrackerResponse.today. */
export interface ToggleDayRequest {
    date: DateString;
}
export interface ToggleDayResponse {
    date: DateString;
    checked: boolean;
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/** GET /api/health (public) */
export interface HealthResponse {
    ok: true;
}

// ---------------------------------------------------------------------------
// Endpoint map — lets the frontend build a fully typed fetch helper:
//   api<"POST /api/tracker/toggle">(body) -> Promise<ApiResponse<ToggleDayResponse>>
// ---------------------------------------------------------------------------

export interface ApiEndpoints {
    "GET /api/health": { body: undefined; response: HealthResponse };
    "POST /api/auth/login": { body: LoginRequest; response: LoginResponse };
    "GET /api/auth/me": { body: undefined; response: MeResponse };
    "GET /api/tracker": { body: undefined; response: TrackerResponse };
    "PUT /api/tracker/start": { body: SetStartDateRequest; response: SetStartDateResponse };
    "POST /api/tracker/toggle": { body: ToggleDayRequest; response: ToggleDayResponse };
}
