import mongoose, { Schema, type Types } from "mongoose";
import { Models } from "./models.js";

/** One document per day the user went to the gym. */
export interface ICheckIn {
    user: Types.ObjectId;
    date: string; // "YYYY-MM-DD"
}

const checkInSchema = new Schema<ICheckIn>(
    {
        user: { type: Schema.Types.ObjectId, ref: Models.User, required: true },
        date: { type: String, required: true },
    },
    { timestamps: true },
);

checkInSchema.index({ user: 1, date: 1 }, { unique: true });

export const CheckIn = mongoose.model<ICheckIn>(Models.CheckIn, checkInSchema);
