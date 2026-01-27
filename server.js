require("dotenv").config();
const http = require("http");
const { connectDb } = require("./src/utils/connectDb");
const { startOfflineMonitor } = require("./src/services/offlineMonitor");
const app = require("./app");

async function main() {
  //console.log(process.env.MONGODB_URI);
  await connectDb(process.env.MONGODB_URI);

  const port = Number(process.env.PORT || 8080);
  const server = http.createServer(app);

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on port ${port}`);
  });

  startOfflineMonitor();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal startup error:", err);
  process.exit(1);
});


