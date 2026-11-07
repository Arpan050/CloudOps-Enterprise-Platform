import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Booking service listening on port ${env.PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down Booking service.`);

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
