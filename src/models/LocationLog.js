const mongoose = require("mongoose");

const LocationLogSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String },
    timestamp: { type: Date, required: true, index: true },
    createdAt: { type: Date, default: Date.now, },
  },
  { versionKey: false }
);

// TTL = 30 days
LocationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const LocationLog = mongoose.model("LocationLog", LocationLogSchema);

module.exports = { LocationLog };


