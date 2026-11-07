import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./db/pool.js";

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(
    `Auth service listening on port ${env.PORT}`
  );
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;

  shuttingDown = true;

  console.log(`${signal} received. Shutting down gracefully.`);

  const forceExit = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10000);

  forceExit.unref();

  server.close(async (error) => {
    try {
      await pool.end();

      if (error) {
        console.error("HTTP server shutdown error:", error);
        process.exitCode = 1;
      }

      console.log("Auth service stopped.");
    } catch (shutdownError) {
      console.error("Database shutdown error:", shutdownError);
      process.exitCode = 1;
    }
  });
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));