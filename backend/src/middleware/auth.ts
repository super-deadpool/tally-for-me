import type { RequestHandler } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../environment.js";
import { AppError } from "../utils/AppError.js";

export function signToken(userId: string): string {
    return jwt.sign({}, JWT_SECRET, {
        subject: userId,
        algorithm: "HS256",
        expiresIn: JWT_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>,
    });
}

/** Requires `Authorization: Bearer <jwt>`; sets req.userId. */
export const requireAuth: RequestHandler = (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        throw AppError.unauthorized("Missing bearer token");
    }

    let payload: string | jwt.JwtPayload;
    try {
        payload = jwt.verify(header.slice(7), JWT_SECRET, { algorithms: ["HS256"] });
    } catch (err) {
        throw AppError.unauthorized(
            err instanceof jwt.TokenExpiredError ? "Session expired, please log in again" : "Invalid token",
        );
    }
    if (typeof payload === "string" || !payload.sub) {
        throw AppError.unauthorized("Invalid token");
    }

    req.userId = payload.sub;
    next();
};
