const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const supabaseUrl = "https://ayohrbnesgstmjqbcbod.supabase.co";
const supabaseServiceKey = "sb_secret_dL8c32FrVjgvdXa3V6XMJw_5VATF0LU";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    const sql = fs.readFileSync("./supabase-migration.sql", "utf8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc("exec", {
        command: statement,
      });

      if (error) {
        console.error("Error:", error);
      } else {
        console.log("✓ Success");
      }
    }

    console.log("\n✓ Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  }
}

runMigration();
