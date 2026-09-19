/**
 * Kiểm tra kết nối Supabase và xem DB đã có dữ liệu chưa.
 * Chạy: npm run db:check   (đọc .env.local)
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { DB_SCHEMA } from "@/lib/supabase/env";

try {
  process.loadEnvFile(".env.local");
} catch {
  console.log("Không thấy .env.local - sẽ đọc biến môi trường đang có.");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, key, {
  db: { schema: DB_SCHEMA },
});

const usingServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

// Bảng danh mục cấp quyền đọc cho anon; bảng cá nhân chỉ cấp cho authenticated.
// Anon key bị từ chối ở bảng cá nhân là ĐÚNG THIẾT KẾ, không phải hỏng - nên
// script phân biệt hai loại thay vì báo đỏ tất cả.
const CATALOG_TABLES = ["ingredients", "dishes", "dish_ingredients"] as const;
const PRIVATE_TABLES = ["profiles", "pantry_items", "cook_logs"] as const;
const tables = [...CATALOG_TABLES, ...PRIVATE_TABLES];

const isPrivate = (table: string): boolean =>
  (PRIVATE_TABLES as readonly string[]).includes(table);

// Bọc trong hàm async: tsx dịch script này sang CJS (package.json không đặt
// "type": "module"), mà CJS không cho await ở cấp cao nhất.
async function main() {
  let failed = false;

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (!error) {
      console.log(`✓ ${table.padEnd(17)} ${count ?? 0} dòng`);
      continue;
    }

    // Anon key bị chặn ở bảng cá nhân: đúng như thiết kế, không tính là hỏng
    if (isPrivate(table) && !usingServiceRole) {
      console.log(`○ ${table.padEnd(17)} bị chặn với anon key (đúng thiết kế)`);
      continue;
    }

    failed = true;
    // PostgREST trả HEAD rỗng khi từ chối quyền nên message hay trống - lúc đó
    // in code/hint để còn lần ra được nguyên nhân.
    const detail =
      error.message || error.code || error.hint || "không rõ nguyên nhân";
    console.log(`✗ ${table.padEnd(17)} ${detail}`);
  }

  if (failed) {
    console.log(
      `\nBảng lỗi thường do một trong ba nguyên nhân:\n` +
        `  1. Chưa chạy supabase/migrations/0001_init.sql\n` +
        `  2. Chưa thêm "${DB_SCHEMA}" vào Settings > API > Exposed schemas\n` +
        `  3. Bảng dữ liệu cá nhân chỉ đọc được khi đã đăng nhập (RLS) - đó là đúng.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    usingServiceRole
      ? "\nKết nối Supabase OK (đang dùng service_role key)."
      : "\nKết nối Supabase OK (đang dùng anon key - bảng cá nhân bị chặn là đúng).",
  );
}

main();
