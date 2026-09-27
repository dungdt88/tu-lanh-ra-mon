/**
 * Quét lại nội dung đã đăng bằng cùng bộ luật với lúc đăng.
 *
 * Chạy: npm run mod:scan          -- chỉ liệt kê, không đụng dữ liệu
 *       npm run mod:scan -- --xoa -- xoá thật những thứ bị chặn
 *
 * Cần SUPABASE_SERVICE_ROLE_KEY trong .env.local để xoá; không có thì vẫn quét
 * được phần ai cũng đọc (bài, bình luận, công thức công khai) nhưng chỉ báo cáo.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { DB_SCHEMA } from "@/lib/supabase/env";
import { ANH_MON_BUCKET } from "@/lib/storage";
import {
  kiemDuyetAnhVoi,
  kiemDuyetVanBanVoi,
  type CauHinhKiemDuyet,
} from "@/lib/moderation-core";

try {
  process.loadEnvFile(".env.local");
} catch {
  console.log("Không thấy .env.local - sẽ đọc biến môi trường đang có.");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const key = serviceRole || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc key trong .env.local");
  process.exit(1);
}

const xoaThat = process.argv.includes("--xoa");
const boQuaAnh = process.argv.includes("--bo-anh");

if (xoaThat && !serviceRole) {
  console.error("Muốn --xoa thì phải có SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient<Database>(url, key, {
  db: { schema: DB_SCHEMA },
});

const cauHinh: CauHinhKiemDuyet = {
  apiKey: process.env.GEMINI_API_KEY ?? "",
  model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  baseUrl:
    process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com",
};

type ViPham = {
  bang: "posts" | "post_comments" | "recipes";
  id: string;
  mo_ta: string;
  lyDo: string;
};

const viPham: ViPham[] = [];

function bao(dat: boolean, nhan: string, lyDo?: string) {
  console.log(`${dat ? "✓" : "✗"} ${nhan}${lyDo ? ` - ${lyDo}` : ""}`);
}

async function anhBase64(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(ANH_MON_BUCKET)
    .download(path);

  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer()).toString("base64");
}

async function quetBai() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, dish_name, caption, image_path")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Không đọc được bài đăng:", error.message);
    return;
  }

  for (const post of data ?? []) {
    const nhan = `bài "${post.dish_name}"`;
    const duyet = await kiemDuyetVanBanVoi(
      cauHinh,
      "bai",
      `${post.dish_name}\n${post.caption}`,
    );

    if (!duyet.ok) {
      bao(false, nhan, duyet.lyDo);
      viPham.push({
        bang: "posts",
        id: post.id,
        mo_ta: nhan,
        lyDo: duyet.lyDo ?? "",
      });
      continue;
    }

    if (boQuaAnh || !post.image_path) {
      bao(true, nhan);
      continue;
    }

    const base64 = await anhBase64(post.image_path);
    if (!base64) {
      bao(true, `${nhan} (không tải được ảnh)`);
      continue;
    }

    const duyetAnh = await kiemDuyetAnhVoi(cauHinh, base64, "image/jpeg");
    if (duyetAnh.ok) {
      bao(true, nhan);
    } else {
      bao(false, `${nhan} (ảnh)`, duyetAnh.lyDo);
      viPham.push({
        bang: "posts",
        id: post.id,
        mo_ta: `${nhan} (ảnh)`,
        lyDo: duyetAnh.lyDo ?? "",
      });
    }
  }
}

async function quetBinhLuan() {
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, body")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Không đọc được bình luận:", error.message);
    return;
  }

  for (const comment of data ?? []) {
    const nhan = `bình luận "${comment.body.slice(0, 40)}"`;
    const duyet = await kiemDuyetVanBanVoi(cauHinh, "binh-luan", comment.body);
    bao(duyet.ok, nhan, duyet.lyDo);
    if (!duyet.ok) {
      viPham.push({
        bang: "post_comments",
        id: comment.id,
        mo_ta: nhan,
        lyDo: duyet.lyDo ?? "",
      });
    }
  }
}

async function quetCongThuc() {
  const { data, error } = await supabase
    .from("recipes")
    .select("id, name, summary, steps, tip")
    .eq("is_public", true);

  if (error) {
    console.error("Không đọc được công thức:", error.message);
    return;
  }

  for (const recipe of data ?? []) {
    const nhan = `công thức "${recipe.name}"`;
    const duyet = await kiemDuyetVanBanVoi(
      cauHinh,
      "cong-thuc",
      [recipe.name, recipe.summary, ...recipe.steps, recipe.tip ?? ""].join(
        "\n",
      ),
    );
    bao(duyet.ok, nhan, duyet.lyDo);
    if (!duyet.ok) {
      viPham.push({
        bang: "recipes",
        id: recipe.id,
        mo_ta: nhan,
        lyDo: duyet.lyDo ?? "",
      });
    }
  }
}

async function main() {
  if (!cauHinh.apiKey) {
    console.log("Chưa có GEMINI_API_KEY - chỉ chạy lưới lọc từ cấm.\n");
  }

  await quetBai();
  await quetBinhLuan();
  await quetCongThuc();

  console.log(`\n${viPham.length} mục bị chặn.`);
  if (viPham.length === 0) return;

  if (!xoaThat) {
    console.log("Chạy lại với --xoa để xoá hẳn những mục trên.");
    return;
  }

  for (const item of viPham) {
    const { error } = await supabase.from(item.bang).delete().eq("id", item.id);
    console.log(
      error
        ? `Không xoá được ${item.mo_ta}: ${error.message}`
        : `Đã xoá ${item.mo_ta}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
