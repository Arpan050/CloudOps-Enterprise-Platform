import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

const schemaPath = new URL("./schema.sql", import.meta.url);

try {
  const schema = await readFile(fileURLToPath(schemaPath), "utf8");
  await pool.query(schema);
  console.log("Booking database migration completed successfully.");
} catch (error) {
  console.error("Booking database migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
