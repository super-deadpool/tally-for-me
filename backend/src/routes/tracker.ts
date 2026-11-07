import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { CheckIn } from "../models/CheckIn.js";
import {
    ErrorCode,
    type SetStartDateRequest,
    type SetStartDateResponse,
    type ToggleDayRequest,
    type ToggleDayResponse,
    type TrackerResponse,
} from "../types/api.js";
import { AppError } from "../utils/AppError.js";
import { todayIn, trackingEndDate } from "../utils/dates.js";
import { handler, ok, type TypedRequest } from "../utils/handler.js";
import { setStartDateSchema, toggleDaySchema } from "../validation/schemas.js";

export const trackerRouter = Router();
trackerRouter.use(requireAuth);

async function currentUser(req: TypedRequest<unknown>) {
    const user = await User.findById(req.userId);
    if (!user) throw AppError.unauthorized("User no longer exists");
    return user;
}

trackerRouter.get(
    "/",
    handler<TrackerResponse>(async (req) => {
        const user = await currentUser(req);
        const today = todayIn(user.timezone);
        const { startDate } = user;
        const endDate = startDate ? trackingEndDate(startDate) : null;

        const checkIns = startDate
            ? await CheckIn.find({ user: user._id, date: { $gte: startDate, $lte: endDate } })
                  .sort({ date: 1 })
                  .select({ date: 1, _id: 0 })
                  .lean()
            : [];
        const checkedDates = checkIns.map((c) => c.date);

        return ok(
            {
                startDate,
                endDate,
                today,
                timezone: user.timezone,
                checkedDates,
                todayChecked: checkedDates.includes(today),
            },
            "Tracker fetched",
        );
    }),
);

/** Choose the heatmap start date. Can only be set once, to today or a future date. */
trackerRouter.put(
    "/start",
    handler<SetStartDateRequest, SetStartDateResponse>(setStartDateSchema, async (req) => {
        const user = await currentUser(req);
        const { startDate } = req.body;

        if (user.startDate) {
            throw AppError.conflict(ErrorCode.START_DATE_ALREADY_SET, "Start date is already set");
        }
        if (startDate < todayIn(user.timezone)) {
            throw AppError.badRequest(ErrorCode.START_DATE_IN_PAST, "Start date cannot be in the past");
        }

        // Conditional update so two concurrent requests can't both set it.
        const updated = await User.findOneAndUpdate(
            { _id: user._id, startDate: null },
            { $set: { startDate } },
            { returnDocument: "after" },
        );
        if (!updated) {
            throw AppError.conflict(ErrorCode.START_DATE_ALREADY_SET, "Start date is already set");
        }
        return ok({ startDate, endDate: trackingEndDate(startDate) }, "Start date set");
    }),
);

/**
 * Toggle a day. Only today (in the user's timezone) can be toggled — once a day
 * has passed it's locked. The client sends the date it thinks it's toggling so a
 * click just before midnight can't silently land on the next day.
 */
trackerRouter.post(
    "/toggle",
    handler<ToggleDayRequest, ToggleDayResponse>(toggleDaySchema, async (req) => {
        const user = await currentUser(req);
        const { date } = req.body;

        if (!user.startDate) {
            throw AppError.conflict(ErrorCode.START_DATE_NOT_SET, "Set a start date first");
        }
        const today = todayIn(user.timezone);
        if (date !== today) {
            throw AppError.forbidden(ErrorCode.DAY_LOCKED, `Only today (${today}) can be toggled`);
        }
        if (date < user.startDate || date > trackingEndDate(user.startDate)) {
            throw AppError.forbidden(ErrorCode.OUT_OF_RANGE, "Date is outside the tracking period");
        }

        const removed = await CheckIn.deleteOne({ user: user._id, date });
        if (removed.deletedCount > 0) {
            return ok({ date, checked: false }, "Day unmarked");
        }
        try {
            await CheckIn.create({ user: user._id, date });
        } catch (err) {
            // Duplicate key: a concurrent request already checked it in.
            if ((err as { code?: number }).code !== 11000) throw err;
        }
        return ok({ date, checked: true }, "Day marked as done");
    }),
);
