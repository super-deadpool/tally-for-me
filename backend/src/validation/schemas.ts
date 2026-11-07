// Runtime validation for request bodies. Each schema is annotated with the
// contract interface from types/api.ts, so if the interface changes and the
// schema doesn't (or vice versa), the build fails.

import { z } from "zod";
import type { LoginRequest, SetStartDateRequest, ToggleDayRequest } from "../types/api.js";
import { isValidDate } from "../utils/dates.js";

const dateString = (field: string) =>
    z
        .string({ error: `${field} is required` })
        .refine(isValidDate, `${field} must be a valid date in YYYY-MM-DD format`);

export const loginSchema: z.ZodType<LoginRequest> = z.object({
    username: z.string({ error: "username is required" }).trim().toLowerCase().min(1, "username is required"),
    password: z.string({ error: "password is required" }).min(1, "password is required"),
});

export const setStartDateSchema: z.ZodType<SetStartDateRequest> = z.object({
    startDate: dateString("startDate"),
});

export const toggleDaySchema: z.ZodType<ToggleDayRequest> = z.object({
    date: dateString("date"),
});
