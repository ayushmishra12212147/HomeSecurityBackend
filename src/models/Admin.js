const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    allowedDevices: { type: [String], default: [] }, // hashed fingerprints
    tokenVersion: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { versionKey: false }
);

const Admin = mongoose.model("Admin", AdminSchema);

module.exports = { Admin };


