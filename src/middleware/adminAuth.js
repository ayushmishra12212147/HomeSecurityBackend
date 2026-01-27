const jwt = require("jsonwebtoken");
const { Admin } = require("../models/Admin");

async function adminAuth(req, res, next) {
  const auth = req.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = auth.slice("bearer ".length).trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(payload.sub).lean();
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    if ((admin.tokenVersion || 0) !== (payload.tokenVersion || 0)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.admin = { id: String(admin._id), email: admin.email };
    return next();
  } catch (_e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = { adminAuth };


