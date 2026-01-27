const express = require("express");
const rateLimit = require("express-rate-limit");
const { login, changePassword, me } = require("../controllers/adminAuthController");
const { adminAuth } = require("../middleware/adminAuth");

const router = express.Router();

router.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
  })
);

router.post("/login", login);
router.get("/me", adminAuth, me);
router.post("/change-password", adminAuth, changePassword);

module.exports = router;


