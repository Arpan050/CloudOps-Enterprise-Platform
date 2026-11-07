import { readFile } from "node:fs/promises";
import { pool } from "./pool.js";

async function migrate() {
  try {
    const schema = await readFile(
      new URL("./schema.sql", import.meta.url),
      "utf8"
    );

    await pool.query(schema);

    console.log("Auth database migration completed successfully.");
  } catch (error) {
    console.error("Database migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();