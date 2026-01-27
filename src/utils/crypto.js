const crypto = require("crypto");

function sha256Hex(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

module.exports = { sha256Hex };


