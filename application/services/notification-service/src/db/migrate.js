import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

try {
  const path = fileURLToPath(new URL("./schema.sql", import.meta.url));
  const schema = await readFile(path, "utf8");
  await pool.query(schema);
  console.log("Notification database migration completed successfully.");
} catch (error) {
  console.error("Notification migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
