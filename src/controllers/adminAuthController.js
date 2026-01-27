const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Admin } = require("../models/Admin");
const { sha256Hex } = require("../utils/crypto");

function badRequest(res) {
  return res.status(400).json({ error: "Bad Request" });
}

function signJwt(admin) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  const expiresIn = process.env.JWT_EXPIRES_IN || "12h";
  return jwt.sign(
    { tokenVersion: admin.tokenVersion || 0 },
    secret,
    { subject: String(admin._id), expiresIn }
  );
}

async function login(req, res) {
  const { email, password, fingerprint } = req.body || {};
  if (!email || !password || !fingerprint) return badRequest(res);

  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(401).json({ error: "Unauthorized" });

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return res.status(401).json({ error: "Unauthorized" });

  const fpHash = sha256Hex(fingerprint);

  if (!admin.allowedDevices || admin.allowedDevices.length === 0) {
    admin.allowedDevices = [fpHash];
  } else if (!admin.allowedDevices.includes(fpHash)) {
    return res.status(403).json({ error: "Blocked: untrusted device" });
  }

  await admin.save();

  const token = signJwt(admin);
  return res.json({ token, email: admin.email });
}

async function changePassword(req, res) {
  const adminId = req.admin?.id;
  const { oldPassword, newPassword } = req.body || {};
  if (!adminId || !oldPassword || !newPassword) return badRequest(res);
  if (String(newPassword).length < 10) return res.status(400).json({ error: "New password too short" });

  const admin = await Admin.findById(adminId);
  if (!admin) return res.status(401).json({ error: "Unauthorized" });

  const ok = await bcrypt.compare(oldPassword, admin.passwordHash);
  if (!ok) return res.status(401).json({ error: "Unauthorized" });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  admin.passwordHash = passwordHash;
  admin.tokenVersion = (admin.tokenVersion || 0) + 1; // invalidate all existing JWTs
  await admin.save();

  const token = signJwt(admin);
  return res.json({ ok: true, token });
}

async function me(req, res) {
  return res.json({ email: req.admin.email });
}

module.exports = { login, changePassword, me };


