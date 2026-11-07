import { ErrorCode, type ValidationIssue } from "../types/api.js";

/**
 * Throw this anywhere in a request (handler, middleware, service) and the
 * central error handler turns it into an ApiError response.
 */
export class AppError extends Error {
    readonly statusCode: number;
    readonly code: ErrorCode;
    readonly details: ValidationIssue[] | undefined;

    constructor(statusCode: number, code: ErrorCode, message: string, details?: ValidationIssue[]) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }

    static badRequest(code: ErrorCode, message: string, details?: ValidationIssue[]) {
        return new AppError(400, code, message, details);
    }
    static unauthorized(message = "Authentication required", code: ErrorCode = ErrorCode.UNAUTHORIZED) {
        return new AppError(401, code, message);
    }
    static forbidden(code: ErrorCode, message: string) {
        return new AppError(403, code, message);
    }
    static notFound(message = "Not found") {
        return new AppError(404, ErrorCode.NOT_FOUND, message);
    }
    static conflict(code: ErrorCode, message: string) {
        return new AppError(409, code, message);
    }
}
