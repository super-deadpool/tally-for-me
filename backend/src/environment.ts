// Load backend/.env if present (Node >= 21.7). Real env vars take precedence.
try {
    process.loadEnvFile();
} catch {
    // No .env file — rely on the process environment.
}

function required(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

export const PORT = Number(process.env.PORT) || 3000;
export const MONGO_URI = required("MONGO_URI");
export const JWT_SECRET = required("JWT_SECRET");
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:4200";
// Timezone used to decide what "today" is for new users.
export const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "Asia/Kolkata";
