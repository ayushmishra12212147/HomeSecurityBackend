const express = require("express");
const rateLimit = require("express-rate-limit");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const { registerDevice, ping, postLocation, shutdown } = require("../controllers/deviceController");

const router = express.Router();

// Wrapper to catch async errors and pass to error handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.use(apiKeyAuth);

// Slightly stricter for device endpoints
router.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Add logging middleware to track requests
router.use((req, res, next) => {
  console.log(`[DeviceRoutes] ${req.method} ${req.path}`, {
    body: req.body,
    headers: { "x-api-key": req.get("x-api-key") ? "***" : "missing" },
  });
  next();
});

router.post("/register", asyncHandler(registerDevice));
router.post("/ping", asyncHandler(ping));
router.post("/location", asyncHandler(postLocation));
router.post("/shutdown", asyncHandler(shutdown));

// Test endpoint to verify LocationLog model
router.get("/test-locationlog", asyncHandler(async (req, res) => {
  const { LocationLog } = require("../models/LocationLog");
  const mongoose = require("mongoose");
  
  const testData = {
    modelExists: !!LocationLog,
    mongooseConnected: mongoose.connection.readyState === 1,
    connectionState: mongoose.connection.readyState,
    totalLogs: await LocationLog.countDocuments({}),
    recentLogs: await LocationLog.find({}).sort({ createdAt: -1 }).limit(5).lean(),
  };
  
  console.log("[test-locationlog] Test data:", testData);
  res.json(testData);
}));

module.exports = router;


