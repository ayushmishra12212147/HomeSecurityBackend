const { Device } = require("../models/Device");
const { LocationLog } = require("../models/LocationLog");

async function summary(_req, res) {
  const total = await Device.countDocuments({});
  const online = await Device.countDocuments({ status: "ACTIVE" });
  const offline = await Device.countDocuments({ status: "OFFLINE" });
  return res.json({ total, online, offline });
}

async function listDevices(req, res) {
  const q = String(req.query.q || "").trim();
  const since = req.query.since ? new Date(String(req.query.since)) : null;
  const until = req.query.until ? new Date(String(req.query.until)) : null;

  const filter = {};
  if (q) filter.deviceName = { $regex: q, $options: "i" };
  if (since || until) filter.lastSeen = {};
  if (since) filter.lastSeen.$gte = since;
  if (until) filter.lastSeen.$lte = until;

  const devices = await Device.find(filter).sort({ lastSeen: -1 }).lean();
  return res.json({ devices });
}

async function getDevice(req, res) {
  const deviceId = req.params.deviceId;
  const device = await Device.findOne({ deviceId }).lean();
  if (!device) return res.status(404).json({ error: "Not Found" });
  return res.json({ device });
}

async function getLogs(req, res) {
  const deviceId = req.params.deviceId;
  const since = req.query.since ? new Date(String(req.query.since)) : null;
  const until = req.query.until ? new Date(String(req.query.until)) : null;

  const query = { deviceId };
  if (since || until) query.timestamp = {};
  if (since) query.timestamp.$gte = since;
  if (until) query.timestamp.$lte = until;

  const logs = await LocationLog.find(query)
    .sort({ timestamp: -1 })
    .limit(500)
    .lean();

  return res.json({ logs });
}

module.exports = { summary, listDevices, getDevice, getLogs };


