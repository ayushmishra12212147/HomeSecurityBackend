require("dotenv").config();
const bcrypt = require("bcrypt");
const { connectDb } = require("./connectDb");
const { Admin } = require("../models/Admin");

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

async function main() {
  const email = arg("email");
  const password = arg("password");
  if (!email || !password) {
    // eslint-disable-next-line no-console
    console.error('Usage: npm run create-admin -- --email you@example.com --password "StrongPassword"');
    process.exit(1);
  }

  await connectDb(process.env.MONGODB_URI);

  const existing = await Admin.findOne({ email });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log("Admin already exists:", email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await Admin.create({ email, passwordHash, allowedDevices: [] });
  // eslint-disable-next-line no-console
  console.log("Created admin:", email);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


