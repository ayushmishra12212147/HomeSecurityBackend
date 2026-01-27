const mongoose = require("mongoose");

async function connectDb(uri) {
  if (!uri) throw new Error("MONGODB_URI is required");
  await mongoose.connect(uri);
}

module.exports = { connectDb };


