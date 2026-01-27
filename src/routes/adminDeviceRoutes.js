const express = require("express");
const { adminAuth } = require("../middleware/adminAuth");
const { summary, listDevices, getDevice, getLogs } = require("../controllers/adminDeviceController");

const router = express.Router();
router.use(adminAuth);

router.get("/summary", summary);
router.get("/", listDevices);
router.get("/:deviceId", getDevice);
router.get("/:deviceId/logs", getLogs);

module.exports = router;


