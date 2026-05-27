import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  const res = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log("Tables:");
  for (const r of res.rows) console.log("  -", r.name);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
