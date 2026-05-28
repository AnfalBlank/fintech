import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db, schema } = await import("../db");
  const { eq } = await import("drizzle-orm");
  const row = (
    await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, "app"))
      .limit(1)
  )[0];
  if (row) {
    const v = JSON.parse(row.value);
    v.midtransServerKey = "";
    await db
      .update(schema.settings)
      .set({ value: JSON.stringify(v) })
      .where(eq(schema.settings.key, "app"));
    console.log("Server key cleared from DB. Env fallback will take effect.");
  } else {
    console.log("No settings row found.");
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
