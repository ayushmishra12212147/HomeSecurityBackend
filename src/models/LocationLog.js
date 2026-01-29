const mongoose = require("mongoose");

const LocationLogSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String },
    timestamp: { type: Date, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// TTL = 30 days - only expire documents older than 30 days
// Note: TTL index runs every 60 seconds, so documents won't be deleted immediately
LocationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

// Ensure indexes are created
LocationLogSchema.on("index", (error) => {
  if (error) {
    console.error("[LocationLog] Index error:", error);
  } else {
    console.log("[LocationLog] Indexes created successfully");
  }
});

const LocationLog = mongoose.model("LocationLog", LocationLogSchema);

// Verify model is registered
console.log("[LocationLog] Model registered:", LocationLog ? "Yes" : "No");

module.exports = { LocationLog };


