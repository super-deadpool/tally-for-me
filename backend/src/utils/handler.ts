import type { Request, RequestHandler } from "express";
import type { z } from "zod";
import { ErrorCode, type ApiSuccess } from "../types/api.js";
import { AppError } from "./AppError.js";

export interface HandlerResult<Data> {
    data: Data;
    message: string;
    statusCode?: number;
}

export type TypedRequest<Body> = Request<Request["params"], unknown, Body>;

type HandlerFn<Body, Data> = (req: TypedRequest<Body>) => Promise<HandlerResult<Data>>;

/** Shorthand for building a handler's return value. */
export function ok<Data>(data: Data, message: string, statusCode?: number): HandlerResult<Data> {
    return statusCode === undefined ? { data, message } : { data, message, statusCode };
}

/**
 * Wraps a route so that:
 *  - the body is validated against `schema` (400 VALIDATION_ERROR on failure),
 *  - `req.body` is typed as the contract's request interface,
 *  - the return value is sent in the standard ApiSuccess envelope,
 *  - anything thrown goes to the central error handler.
 *
 *   handler<ToggleDayRequest, ToggleDayResponse>(toggleDaySchema, async (req) => ok(...))
 */
export function handler<Body, Data>(schema: z.ZodType<Body>, fn: HandlerFn<Body, Data>): RequestHandler;
export function handler<Data>(fn: HandlerFn<unknown, Data>): RequestHandler;
export function handler(
    schemaOrFn: z.ZodType | HandlerFn<unknown, unknown>,
    maybeFn?: HandlerFn<unknown, unknown>,
): RequestHandler {
    const schema = maybeFn ? (schemaOrFn as z.ZodType) : null;
    const fn = maybeFn ?? (schemaOrFn as HandlerFn<unknown, unknown>);

    return async (req, res) => {
        if (schema) {
            const parsed = schema.safeParse(req.body ?? {});
            if (!parsed.success) {
                throw AppError.badRequest(
                    ErrorCode.VALIDATION_ERROR,
                    "Request body is invalid",
                    parsed.error.issues.map((i) => ({
                        field: i.path.join(".") || "(body)",
                        message: i.message,
                    })),
                );
            }
            req.body = parsed.data;
        }

        const result = await fn(req);
        const body: ApiSuccess<unknown> = { status: "success", message: result.message, data: result.data };
        res.status(result.statusCode ?? 200).json(body);
    };
}
