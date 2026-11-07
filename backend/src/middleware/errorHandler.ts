import type { ErrorRequestHandler, RequestHandler } from "express";
import { ErrorCode, type ApiError } from "../types/api.js";
import { AppError } from "../utils/AppError.js";

/** Catches requests that matched no route. */
export const notFoundHandler: RequestHandler = (req) => {
    throw AppError.notFound(`Route ${req.method} ${req.path} not found`);
};

function toAppError(err: unknown): AppError | null {
    if (err instanceof AppError) return err;
    // Thrown by express.json() on a malformed body.
    if ((err as { type?: string })?.type === "entity.parse.failed") {
        return AppError.badRequest(ErrorCode.INVALID_JSON, "Request body is not valid JSON");
    }
    return null;
}

/** Converts every error into the standard ApiError envelope. Must be registered last. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    const appError = toAppError(err);

    if (!appError) {
        // Unexpected: log everything, reveal nothing.
        console.error(`[${req.requestId}] Unhandled error on ${req.method} ${req.originalUrl}`, err);
    }

    const statusCode = appError?.statusCode ?? 500;
    const body: ApiError = {
        status: "error",
        message: appError?.message ?? "Something went wrong",
        data: null,
        error: {
            code: appError?.code ?? ErrorCode.INTERNAL_ERROR,
            requestId: req.requestId,
            ...(appError?.details ? { details: appError.details } : {}),
        },
    };
    res.status(statusCode).json(body);
};
