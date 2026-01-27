const mongoose = require("mongoose");

const LastLocationSchema = new mongoose.Schema(
  {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
    timestamp: { type: Date },
  },
  { _id: false }
);

const DeviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    deviceName: { type: String, required: true, index: true },
    model: { type: String, required: true },
    osVersion: { type: String, required: true },
    installDate: { type: Date, required: true },

    lastSeen: { type: Date },
    lastLocation: { type: LastLocationSchema },

    status: {
      type: String,
      enum: ["ACTIVE", "OFFLINE", "REINSTALLED"],
      default: "ACTIVE",
      index: true,
    },

    // Alert throttling
    lastOfflineAlertAt: { type: Date },
    lastMoveAlertAt: { type: Date },
    lastReinstallAlertAt: { type: Date },

    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { versionKey: false }
);

const Device = mongoose.model("Device", DeviceSchema);

module.exports = { Device };


