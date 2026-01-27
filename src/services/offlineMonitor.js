const { Device } = require("../models/Device");
const { alertOffline } = require("./alerts");

function minutes(n) {
  return n * 60 * 1000;
}

function startOfflineMonitor() {
  const offlineAfterMinutes = Number(process.env.OFFLINE_AFTER_MINUTES || 90);

  // Run every 10 minutes
  setInterval(async () => {
    const cutoff = new Date(Date.now() - minutes(offlineAfterMinutes));
    const candidates = await Device.find({
      status: { $in: ["ACTIVE", "OFFLINE"] },
      lastSeen: { $exists: true, $lt: cutoff },
    });

    for (const d of candidates) {
      if (d.status !== "OFFLINE") {
        d.status = "OFFLINE";
      }
      const sent = await alertOffline(d);
      if (sent) d.lastOfflineAlertAt = new Date();
      await d.save();
    }
  }, minutes(10)).unref();
}

module.exports = { startOfflineMonitor };


