// Creates a user, or resets the password of an existing one. There is no
// registration endpoint, so this is the only way to add users.
//
//   npm run create-user -- <username> [--tz Asia/Kolkata] [--start YYYY-MM-DD]
//
// The password is prompted for (hidden), or read from stdin when piped.

import { parseArgs } from "node:util";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MONGO_URI } from "../environment.js";
import { User } from "../models/User.js";
import { isValidDate, isValidTimeZone } from "../utils/dates.js";

function promptHidden(question: string): Promise<string> {
    const stdin = process.stdin;
    stdin.setEncoding("utf8");

    if (!stdin.isTTY) {
        return new Promise((resolve) => {
            let data = "";
            stdin.on("data", (chunk) => (data += chunk));
            stdin.on("end", () => resolve(data.split(/\r?\n/)[0] ?? ""));
        });
    }

    return new Promise((resolve, reject) => {
        let input = "";
        const cleanup = () => {
            stdin.setRawMode(false);
            stdin.pause();
            stdin.off("data", onData);
        };
        const onData = (chunk: string) => {
            for (const ch of chunk) {
                if (ch === "\r" || ch === "\n") {
                    cleanup();
                    process.stdout.write("\n");
                    resolve(input);
                    return;
                }
                if (ch === "\u0003") {
                    cleanup();
                    reject(new Error("Aborted"));
                    return;
                }
                input = ch === "\u007f" || ch === "\b" ? input.slice(0, -1) : input + ch;
            }
        };
        process.stdout.write(question);
        stdin.setRawMode(true);
        stdin.resume();
        stdin.on("data", onData);
    });
}

const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
        tz: { type: "string" },
        start: { type: "string" },
    },
});

const username = positionals[0]?.trim().toLowerCase();
if (!username) {
    console.error("Usage: npm run create-user -- <username> [--tz Asia/Kolkata] [--start YYYY-MM-DD]");
    process.exit(1);
}
if (values.tz !== undefined && !isValidTimeZone(values.tz)) {
    console.error(`Invalid timezone: ${values.tz}`);
    process.exit(1);
}
if (values.start !== undefined && !isValidDate(values.start)) {
    console.error(`Invalid start date: ${values.start}`);
    process.exit(1);
}

const password = await promptHidden(`Password for ${username}: `);
if (password.length < 6) {
    console.error("Password must be at least 6 characters");
    process.exit(1);
}

await mongoose.connect(MONGO_URI);

const update: Record<string, string> = { passwordHash: await bcrypt.hash(password, 12) };
if (values.tz !== undefined) update.timezone = values.tz;
if (values.start !== undefined) update.startDate = values.start;

const existing = await User.findOne({ username });
if (existing) {
    await User.updateOne({ _id: existing._id }, { $set: update });
    console.log(`Updated user "${username}"`);
} else {
    await User.create({ username, ...update });
    console.log(`Created user "${username}"`);
}

await mongoose.disconnect();
