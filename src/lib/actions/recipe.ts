"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { kiemDuyetVanBan } from "@/lib/moderation";
import { getCatalog } from "@/lib/repo/catalog";
import { createClient } from "@/lib/supabase/server";
import { capitalize, normalizeText } from "@/lib/text";
import type { Dish, MealSlot } from "@/lib/types";

export type ActionState = { error?: string };

const SLOTS: MealSlot[] = ["sang", "trua", "toi"];
const ROLES: Dish["role"][] = ["man", "canh", "rau", "com"];

const EXTRA_MAX_LEN = 40;
const MAX_NGUYEN_LIEU = 30;
const MAX_BUOC = 30;

/** Giữ lại những id có thật trong danh mục - cùng rào chắn như khi đăng bài. */
function locIdDanhMuc(values: FormDataEntryValue[], known: Set<string>) {
  return Array.from(
    new Set(values.map(String).filter((id) => known.has(id))),
  ).slice(0, MAX_NGUYEN_LIEU);
}

function locTenTuDo(values: FormDataEntryValue[]): string[] {
  const daCo = new Set<string>();
  return values
    .map((value) => capitalize(String(value)).slice(0, EXTRA_MAX_LEN).trim())
    .filter((name) => {
      const key = normalizeText(name);
      if (!key || daCo.has(key)) return false;
      daCo.add(key);
      return true;
    })
    .slice(0, MAX_NGUYEN_LIEU);
}

/** Mỗi dòng trong ô nhập là một bước; dòng trống bỏ đi. */
function tachBuoc(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_BUOC);
}

function soTrongKhoang(
  raw: string,
  min: number,
  max: number,
  macDinh: number,
): number | null {
  if (!raw) return macDinh;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

/**
 * Lưu một công thức nhà mình. Có `id` là sửa công thức cũ, không có là viết mới.
 * Lưu xong nhảy thẳng sang trang công thức đó.
 */
export async function luuCongThuc(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Chưa cấu hình Supabase." };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Cần đăng nhập trước đã." };

  const name = capitalize(String(formData.get("name") ?? ""));
  if (!name) return { error: "Công thức chưa có tên." };
  if (name.length > 120) return { error: "Tên món dài quá." };

  const summary = String(formData.get("summary") ?? "").trim();
  if (summary.length > 280) return { error: "Mô tả ngắn dài quá." };

  const tip = String(formData.get("tip") ?? "").trim();
  if (tip.length > 500) return { error: "Mẹo nhỏ dài quá." };

  const minutes = soTrongKhoang(
    String(formData.get("minutes") ?? "").trim(),
    1,
    1440,
    30,
  );
  if (minutes === null) return { error: "Thời gian nấu không hợp lệ." };

  const servings = soTrongKhoang(
    String(formData.get("servings") ?? "").trim(),
    1,
    20,
    4,
  );
  if (servings === null) return { error: "Số người ăn không hợp lệ." };

  const difficulty = soTrongKhoang(
    String(formData.get("difficulty") ?? "").trim(),
    1,
    3,
    1,
  );
  if (difficulty === null) return { error: "Độ khó không hợp lệ." };

  const roleRaw = String(formData.get("role") ?? "man");
  const role = ROLES.find((value) => value === roleRaw) ?? "man";

  const slots = SLOTS.filter((slot) =>
    formData.getAll("slots").map(String).includes(slot),
  );

  const catalog = await getCatalog();
  const known = new Set(catalog.ingredients.map((item) => item.id));
  const core = locIdDanhMuc(formData.getAll("core"), known);
  const optional = locIdDanhMuc(formData.getAll("optional"), known).filter(
    (id) => !core.includes(id),
  );
  const extras = locTenTuDo(formData.getAll("extras"));

  if (core.length === 0 && extras.length === 0) {
    return { error: "Thêm ít nhất một nguyên liệu chính." };
  }

  const ban = {
    name,
    emoji: String(formData.get("emoji") ?? "").trim() || "🍲",
    summary,
    role,
    slots: slots.length > 0 ? slots : (["trua", "toi"] as MealSlot[]),
    minutes,
    servings,
    difficulty: difficulty as 1 | 2 | 3,
    core,
    optional,
    extras,
    steps: tachBuoc(String(formData.get("steps") ?? "")),
    tip: tip || null,
    is_public: formData.get("isPublic") === "on",
  };

  // Để riêng thì không ai đọc ngoài chủ nhà, quét làm gì cho tốn quota.
  if (ban.is_public) {
    const duyet = await kiemDuyetVanBan(
      "cong-thuc",
      [ban.name, ban.summary, ...ban.steps, ban.tip ?? ""].join("\n"),
    );
    if (!duyet.ok) return { error: duyet.lyDo ?? "Nội dung không phù hợp." };
  }

  const id = String(formData.get("id") ?? "").trim();

  if (id) {
    const { error } = await supabase
      .from("recipes")
      .update(ban)
      .eq("id", id)
      .eq("author_id", auth.user.id);

    if (error) return { error: `Không lưu được: ${error.message}` };

    revalidatePath("/cong-thuc");
    revalidatePath(`/cong-thuc/${id}`);
    redirect(`/cong-thuc/${id}`);
  }

  const { data, error } = await supabase
    .from("recipes")
    .insert({ ...ban, author_id: auth.user.id })
    .select("id")
    .single();

  if (error || !data) {
    return { error: `Không lưu được: ${error?.message ?? "thử lại nhé"}` };
  }

  revalidatePath("/cong-thuc");
  redirect(`/cong-thuc/${data.id}`);
}

/** Xoá hẳn một công thức. Bài đã khoe vẫn còn, chỉ mất đường dẫn về công thức. */
export async function xoaCongThuc(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  if (!supabase) return { error: "Chưa cấu hình Supabase." };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Cần đăng nhập trước đã." };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Thiếu id công thức." };

  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .eq("author_id", auth.user.id);

  if (error) return { error: `Không xoá được: ${error.message}` };

  revalidatePath("/cong-thuc");
  redirect("/cong-thuc");
}
