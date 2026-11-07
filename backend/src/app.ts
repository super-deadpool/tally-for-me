import express from "express";
import cors from "cors";
import { CLIENT_ORIGIN } from "./environment.js";
import { requestContext } from "./middleware/requestContext.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { trackerRouter } from "./routes/tracker.js";
import type { HealthResponse } from "./types/api.js";
import { handler, ok } from "./utils/handler.js";

export const app = express();

app.use(requestContext);
app.use(cors({ origin: CLIENT_ORIGIN, exposedHeaders: ["X-Request-Id"] }));
app.use(express.json());

app.get(
    "/api/health",
    handler<HealthResponse>(async () => ok({ ok: true }, "Healthy")),
);
app.use("/api/auth", authRouter);
app.use("/api/tracker", trackerRouter);

app.use(notFoundHandler);
app.use(errorHandler);
