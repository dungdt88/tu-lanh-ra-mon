/**
 * Kiểm tra kết nối Supabase và xem DB đã có dữ liệu chưa.
 * Chạy: npm run db:check   (đọc .env.local)
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

try {
  process.loadEnvFile(".env.local");
} catch {
  console.log("Không thấy .env.local - sẽ đọc biến môi trường đang có.");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, key);

const tables = [
  "ingredients",
  "dishes",
  "dish_ingredients",
  "profiles",
  "pantry_items",
  "cook_logs",
] as const;

let failed = false;

for (const table of tables) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    failed = true;
    console.log(`✗ ${table.padEnd(17)} ${error.message}`);
  } else {
    console.log(`✓ ${table.padEnd(17)} ${count ?? 0} dòng`);
  }
}

if (failed) {
  console.log(
    "\nBảng lỗi thường là do chưa chạy supabase/migrations/0001_init.sql,\n" +
      "hoặc bảng dữ liệu cá nhân chỉ đọc được khi đã đăng nhập (RLS) - đó là đúng.",
  );
} else {
  console.log("\nKết nối Supabase OK.");
}
