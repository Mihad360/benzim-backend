/* eslint-disable @typescript-eslint/no-explicit-any */
import app from "./app";
import config from "./app/config";
import mongoose from "mongoose";
import { createServer, Server } from "http";
import seedSuperAdmin from "./app/DB";
import { initSocketIO } from "./app/utils/socket";

let server: Server;

async function main() {
  try {
    await mongoose.connect(config.database_url as string, {
      dbName: "benzim",
    });
    console.log("Database connected successfully");

    seedSuperAdmin().catch((err) =>
      console.error("Super admin seeding error:", err),
    );

    // ✅ CORRECT - Create ONE HTTP server
    server = createServer(app);
    await initSocketIO(server);

    // Start the server
    server.listen(config.port, () => {
      console.log(`App listening on port ${config.port}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

main();

process.on("unhandledRejection", (reason: any, promise) => {
  console.error("💥 Unhandled Rejection detected:");
  console.error("👉 Reason:", reason);
  console.error("👉 Promise:", promise);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on("uncaughtException", () => {
  console.log("uncaughtException detected.. shutting down");
  process.exit(1);
});
