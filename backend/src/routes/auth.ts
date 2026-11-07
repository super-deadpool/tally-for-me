import { Router } from "express";
import bcrypt from "bcryptjs";
import { User, toPublicUser } from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { ErrorCode, type LoginRequest, type LoginResponse, type MeResponse } from "../types/api.js";
import { AppError } from "../utils/AppError.js";
import { handler, ok } from "../utils/handler.js";
import { loginSchema } from "../validation/schemas.js";

// Compared against when the username doesn't exist, so response time
// doesn't reveal which usernames are valid.
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

export const authRouter = Router();

// No registration endpoint: users are created with `npm run create-user`.
authRouter.post(
    "/login",
    handler<LoginRequest, LoginResponse>(loginSchema, async (req) => {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !valid) {
            throw AppError.unauthorized("Invalid username or password", ErrorCode.INVALID_CREDENTIALS);
        }
        return ok({ token: signToken(user._id.toString()), user: toPublicUser(user) }, "Logged in");
    }),
);

authRouter.get(
    "/me",
    requireAuth,
    handler<MeResponse>(async (req) => {
        const user = await User.findById(req.userId);
        if (!user) throw AppError.unauthorized("User no longer exists");
        return ok({ user: toPublicUser(user) }, "Current user");
    }),
);
