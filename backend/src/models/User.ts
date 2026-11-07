import mongoose, { Schema, type Types } from "mongoose";
import { DEFAULT_TIMEZONE } from "../environment.js";
import type { PublicUser } from "../types/api.js";
import { Models } from "./models.js";

export interface IUser {
    _id: Types.ObjectId;
    username: string;
    passwordHash: string;
    /** First day of the 1-year heatmap ("YYYY-MM-DD"); null until chosen. */
    startDate: string | null;
    /** IANA timezone used to decide which date is "today" for this user. */
    timezone: string;
}

const userSchema = new Schema<IUser>(
    {
        username: { type: String, required: true, unique: true, trim: true, lowercase: true },
        passwordHash: { type: String, required: true },
        startDate: { type: String, default: null },
        timezone: { type: String, default: DEFAULT_TIMEZONE },
    },
    { timestamps: true },
);

export const User = mongoose.model<IUser>(Models.User, userSchema);

export function toPublicUser(user: IUser): PublicUser {
    return {
        id: user._id.toString(),
        username: user.username,
        startDate: user.startDate,
        timezone: user.timezone,
    };
}
