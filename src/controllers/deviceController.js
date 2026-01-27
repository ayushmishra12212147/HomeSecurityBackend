const { Device } = require("../models/Device");
const { LocationLog } = require("../models/LocationLog");
const { distanceMeters } = require("../utils/geo");
const { alertLargeMove, alertReinstalled } = require("../services/alerts");

function badRequest(res) {
  return res.status(400).json({ error: "Bad Request" });
}

async function registerDevice(req, res) {
  const { deviceId, deviceName, model, osVersion, installDate } = req.body || {};
  if (!deviceId || !deviceName || !model || !osVersion || !installDate) return badRequest(res);

  const existingById = await Device.findOne({ deviceId });
  if (existingById) {
    existingById.status = "ACTIVE";
    existingById.lastSeen = new Date();
    await existingById.save();
    return res.json({ ok: true, deviceId, status: existingById.status });
  }

  // Reinstall-like detection: same deviceName + model currently ACTIVE but new deviceId arrives
  const previous = await Device.findOne({
    deviceName,
    model,
    status: "ACTIVE",
  }).sort({ createdAt: -1 });

  const newDevice = await Device.create({
    deviceId,
    deviceName,
    model,
    osVersion,
    installDate: new Date(installDate),
    lastSeen: new Date(),
    status: "ACTIVE",
  });

  if (previous) {
    previous.status = "REINSTALLED";
    const sent = await alertReinstalled(previous, newDevice);
    if (sent) previous.lastReinstallAlertAt = new Date();
    await previous.save();
  }

  return res.json({ ok: true, deviceId, status: newDevice.status });
}

async function ping(req, res) {
  const { deviceId } = req.body || {};
  if (!deviceId) return badRequest(res);

  const device = await Device.findOne({ deviceId });
  if (!device) return res.status(404).json({ error: "Not Found" });

  device.lastSeen = new Date();
  if (device.status !== "ACTIVE") device.status = "ACTIVE";
  await device.save();
  return res.json({ ok: true });
}

async function postLocation(req, res) {
  const { deviceId, lat, lng, address, timestamp } = req.body || {};
  if (!deviceId || typeof lat !== "number" || typeof lng !== "number" || !timestamp) return badRequest(res);

  const device = await Device.findOne({ deviceId });
  if (!device) return res.status(404).json({ error: "Not Found" });

  const newLoc = {
    lat,
    lng,
    address: address || undefined,
    timestamp: new Date(timestamp),
  };

  const prevLoc = device.lastLocation ? { ...device.lastLocation.toObject?.() } : null;
  device.lastSeen = new Date();
  device.lastLocation = newLoc;
  if (device.status !== "ACTIVE") device.status = "ACTIVE";
  await device.save();

  await LocationLog.create({
    deviceId,
    lat,
    lng,
    address: address || undefined,
    timestamp: new Date(timestamp),
  });

  // Alert on large movement
  if (prevLoc && typeof prevLoc.lat === "number" && typeof prevLoc.lng === "number") {
    const d = distanceMeters({ lat: prevLoc.lat, lng: prevLoc.lng }, { lat, lng });
    if (d != null && d >= 3000) {
      const sent = await alertLargeMove(device, d, prevLoc, newLoc);
      if (sent) {
        device.lastMoveAlertAt = new Date();
        await device.save();
      }
    }
  }

  return res.json({ ok: true });
}

async function shutdown(req, res) {
  // Same payload as location; semantics: last known before shutdown
  return await postLocation(req, res);
}

module.exports = { registerDevice, ping, postLocation, shutdown };


