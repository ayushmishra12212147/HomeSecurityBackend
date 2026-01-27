const { sendAlertEmail } = require("./mailer");

function minutes(n) {
  return n * 60 * 1000;
}

function throttleOk(lastAt, throttleMinutes) {
  if (!lastAt) return true;
  return Date.now() - new Date(lastAt).getTime() > minutes(throttleMinutes);
}

async function alertOffline(device) {
  const throttleMinutes = Number(process.env.ALERT_THROTTLE_MINUTES || 120);
  if (!throttleOk(device.lastOfflineAlertAt, throttleMinutes)) return false;

  const subject = `[ALERT] Device offline: ${device.deviceName}`;
  const text = `Device "${device.deviceName}" (${device.deviceId}) appears OFFLINE.\nLast seen: ${device.lastSeen || "unknown"}\nStatus: ${device.status}\n`;
  return await sendAlertEmail(subject, text);
}

async function alertReinstalled(oldDevice, newDevice) {
  const throttleMinutes = Number(process.env.ALERT_THROTTLE_MINUTES || 120);
  if (!throttleOk(oldDevice.lastReinstallAlertAt, throttleMinutes)) return false;

  const subject = `[ALERT] App reinstalled detected: ${oldDevice.deviceName}`;
  const text =
    `A reinstall-like event was detected.\n\n` +
    `Old deviceId: ${oldDevice.deviceId} (marked REINSTALLED)\n` +
    `New deviceId: ${newDevice.deviceId}\n` +
    `Device name: ${oldDevice.deviceName}\n` +
    `Model: ${oldDevice.model}\n`;
  return await sendAlertEmail(subject, text);
}

async function alertLargeMove(device, distanceM, fromLoc, toLoc) {
  const throttleMinutes = Number(process.env.ALERT_THROTTLE_MINUTES || 120);
  if (!throttleOk(device.lastMoveAlertAt, throttleMinutes)) return false;

  const subject = `[ALERT] Large location change: ${device.deviceName}`;
  const text =
    `Device "${device.deviceName}" moved ~${Math.round(distanceM)} meters.\n\n` +
    `From: ${fromLoc.lat},${fromLoc.lng} at ${fromLoc.timestamp}\n` +
    `To: ${toLoc.lat},${toLoc.lng} at ${toLoc.timestamp}\n` +
    `DeviceId: ${device.deviceId}\n`;
  return await sendAlertEmail(subject, text);
}

module.exports = { alertOffline, alertReinstalled, alertLargeMove };


