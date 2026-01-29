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
  try {
    const { deviceId, lat, lng, address, timestamp } = req.body || {};
    console.log("[postLocation] Received request:", { deviceId, lat, lng, timestamp, address });
    
    if (!deviceId || typeof lat !== "number" || typeof lng !== "number" || !timestamp) {
      console.error("[postLocation] Bad request - missing or invalid fields:", { deviceId, lat, lng, timestamp });
      return badRequest(res);
    }

    const device = await Device.findOne({ deviceId });
    if (!device) {
      console.error("[postLocation] Device not found:", deviceId);
      return res.status(404).json({ error: "Not Found" });
    }

    console.log("[postLocation] Device found:", device.deviceName);

    const timestampDate = new Date(timestamp);
    if (isNaN(timestampDate.getTime())) {
      console.error("[postLocation] Invalid timestamp:", timestamp);
      return badRequest(res);
    }

    const newLoc = {
      lat,
      lng,
      address: address || undefined,
      timestamp: timestampDate,
    };

    const prevLoc = device.lastLocation ? { ...device.lastLocation.toObject?.() } : null;
    device.lastSeen = new Date();
    device.lastLocation = newLoc;
    if (device.status !== "ACTIVE") device.status = "ACTIVE";
    
    console.log("[postLocation] Updating device lastLocation...");
    await device.save();
    console.log("[postLocation] Device updated successfully");

    // Save to LocationLog - wrapped in try-catch to catch validation errors
    console.log("[postLocation] Creating LocationLog entry...");
    const locationLogData = {
      deviceId,
      lat,
      lng,
      address: address || undefined,
      timestamp: timestampDate,
    };
    console.log("[postLocation] LocationLog data:", JSON.stringify(locationLogData));
    console.log("[postLocation] LocationLog model:", LocationLog ? "exists" : "missing");
    console.log("[postLocation] MongoDB connection state:", require("mongoose").connection.readyState, "(1=connected)");
    
    try {
      // Verify model before creating
      if (!LocationLog) {
        throw new Error("LocationLog model is not defined");
      }
      
      // Check MongoDB connection
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState !== 1) {
        throw new Error(`MongoDB not connected. State: ${mongoose.connection.readyState}`);
      }
      
      console.log("[postLocation] Calling LocationLog.create()...");
      const locationLog = await LocationLog.create(locationLogData);
      console.log("[postLocation] LocationLog.create() completed");
      console.log("[postLocation] LocationLog created successfully with ID:", locationLog._id);
      console.log("[postLocation] LocationLog document:", JSON.stringify(locationLog.toObject()));
      
      // Verify it was actually saved by querying it back
      const verifyLog = await LocationLog.findById(locationLog._id);
      if (verifyLog) {
        console.log("[postLocation] Verified: LocationLog exists in database");
      } else {
        console.error("[postLocation] WARNING: LocationLog was created but not found in database!");
      }
    } catch (logError) {
      console.error("[postLocation] Failed to create LocationLog:", logError);
      console.error("[postLocation] LocationLog error details:", {
        name: logError.name,
        message: logError.message,
        errors: logError.errors,
        stack: logError.stack,
      });
      // Re-throw to see if it's a critical error
      // Actually, let's not fail the request but log it clearly
      console.error("[postLocation] CRITICAL: LocationLog creation failed but continuing...");
    }

    // Alert on large movement
    if (prevLoc && typeof prevLoc.lat === "number" && typeof prevLoc.lng === "number") {
      const d = distanceMeters({ lat: prevLoc.lat, lng: prevLoc.lng }, { lat, lng });
      if (d != null && d >= 3000) {
        console.log("[postLocation] Large movement detected:", d, "meters");
        const sent = await alertLargeMove(device, d, prevLoc, newLoc);
        if (sent) {
          device.lastMoveAlertAt = new Date();
          await device.save();
        }
      }
    }

    console.log("[postLocation] Success - returning response");
    return res.json({ ok: true });
  } catch (error) {
    console.error("[postLocation] Error:", error);
    console.error("[postLocation] Error stack:", error.stack);
    console.error("[postLocation] Error name:", error.name);
    console.error("[postLocation] Error message:", error.message);
    if (error.errors) {
      console.error("[postLocation] Validation errors:", error.errors);
    }
    // Return error response directly instead of throwing
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}

async function shutdown(req, res) {
  // Same payload as location; semantics: last known before shutdown
  return await postLocation(req, res);
}

module.exports = { registerDevice, ping, postLocation, shutdown };


