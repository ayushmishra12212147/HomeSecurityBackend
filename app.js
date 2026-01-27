const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { enforceHttps } = require("./src/middleware/enforceHttps");
const { errorHandler } = require("./src/middleware/errorHandler");

const deviceRoutes = require("./src/routes/deviceRoutes");
const adminAuthRoutes = require("./src/routes/adminAuthRoutes");
const adminDeviceRoutes = require("./src/routes/adminDeviceRoutes");

const app = express();

// If deploying behind a proxy (Render/Railway), this is required for HTTPS redirects and correct IPs
app.set("trust proxy", 1);

app.use(enforceHttps);
app.use(helmet());
app.use(express.json({ limit: "200kb" }));
app.use(morgan("combined"));

app.use(
  cors({
    origin: process.env.ADMIN_DASHBOARD_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Global rate limit (additional per-route limits can be added)
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/device", deviceRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/devices", adminDeviceRoutes);

app.use(errorHandler);

module.exports = app;


