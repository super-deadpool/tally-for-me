import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

declare global {
    namespace Express {
        interface Request {
            /** Unique per request; returned in X-Request-Id and in error bodies. */
            requestId: string;
            /** Set by requireAuth. */
            userId?: string;
        }
    }
}

/** Assigns a request id and logs one line per request when it finishes. */
export const requestContext: RequestHandler = (req, res, next) => {
    const incoming = req.header("x-request-id");
    req.requestId = incoming && incoming.length <= 64 ? incoming : randomUUID();
    res.setHeader("X-Request-Id", req.requestId);

    const started = performance.now();
    res.on("finish", () => {
        const ms = (performance.now() - started).toFixed(1);
        const user = req.userId ? ` user=${req.userId}` : "";
        console.log(`[${req.requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms${user}`);
    });
    next();
};
