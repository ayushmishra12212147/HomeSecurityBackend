const express = require("express");
const rateLimit = require("express-rate-limit");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const { registerDevice, ping, postLocation, shutdown } = require("../controllers/deviceController");

const router = express.Router();

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

router.post("/register", registerDevice);
router.post("/ping", ping);
router.post("/location", postLocation);
router.post("/shutdown", shutdown);

module.exports = router;


