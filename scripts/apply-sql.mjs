/**
 * Chạy schema.sql + seed.sql lên Supabase qua Management API.
 *
 *   set SUPABASE_ACCESS_TOKEN=sbp_...        (Windows CMD)
 *   $env:SUPABASE_ACCESS_TOKEN="sbp_..."     (PowerShell)
 *   node scripts/apply-sql.mjs
 *
 * Lấy token tại: https://supabase.com/dashboard/account/tokens
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "tbdpwdgvoxexbsdtjkzd";

if (!TOKEN) {
  console.error("Thiếu SUPABASE_ACCESS_TOKEN (personal access token, dạng sbp_...).");
  process.exit(1);
}

async function runFile(name) {
  const sql = await readFile(join(ROOT, "supabase", name), "utf8");
  process.stdout.write(`→ ${name} … `);

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  const body = await res.text();
  if (!res.ok) {
    console.error(`LỖI ${res.status}\n${body}`);
    process.exit(1);
  }
  console.log("OK");
}

// Mặc định: schema + seed gốc. Truyền tên file để chạy riêng:
//   node scripts/apply-sql.mjs seed-yen-nghia.sql
const files = process.argv.slice(2).filter((a) => a.endsWith(".sql"));
for (const f of files.length ? files : ["schema.sql", "seed.sql"]) {
  await runFile(f);
}
console.log("\nHoàn tất. Kiểm tra lại: npm run dev → http://localhost:3000");
