"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { idCongThuc, laCongThucRieng } from "@/lib/dish-link";
import { TU_DO_MAX_LEN, danhDauTuDo } from "@/lib/ingredient-id";
import { kiemDuyetAnh, kiemDuyetVanBan } from "@/lib/moderation";
import { getCatalog } from "@/lib/repo/catalog";
import { getCongThuc } from "@/lib/repo/recipe";
import { ANH_MON_BUCKET, ANH_MON_MAX_BYTES, ANH_MON_MIME } from "@/lib/storage";
import { capitalize, normalizeText } from "@/lib/text";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type ActionState = { error?: string };

/** revalidatePath chỉ nhận đường dẫn; "/cong-dong?loc=theo-doi" sẽ không khớp gì. */
function duongDan(value: string): string {
  const path = value.split("?")[0];
  return path.startsWith("/") ? path : "/cong-dong";
}

type Client = SupabaseClient<Database, "tlrm">;

async function taiKhoanHienTai(): Promise<
  { supabase: Client; userId: string } | { error: string }
> {
  const supabase = await createClient();
  if (!supabase) return { error: "Chưa cấu hình Supabase." };

  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Cần đăng nhập trước đã." };

  return { supabase: supabase as Client, userId: data.user.id };
}

/**
 * Đăng một bài khoe món.
 *
 * Mọi id món và id nguyên liệu đều đối chiếu lại với danh mục thật trước khi
 * lưu - cùng lý do như rào chắn ở /api/chat: id lạ lọt vào DB thì sau này
 * không ai biết bài đó nói về nguyên liệu gì.
 */
export async function dangBai(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const account = await taiKhoanHienTai();
  if ("error" in account) return account;
  const { supabase, userId } = account;

  const catalog = await getCatalog();

  const dishIdRaw = String(formData.get("dishId") ?? "").trim();
  const dish = catalog.dishes.find((item) => item.id === dishIdRaw);

  // Nấu theo công thức nhà mình: bài trỏ về công thức chứ không vào dish_id,
  // và chỉ nhận công thức của chính người đăng.
  const congThuc = laCongThucRieng(dishIdRaw)
    ? await getCongThuc(idCongThuc(dishIdRaw))
    : null;
  const recipeId = congThuc?.authorId === userId ? congThuc.recipeId : null;

  const dishName = (
    dish?.name ??
    (recipeId ? congThuc?.name : null) ??
    String(formData.get("dishName") ?? "")
  ).trim();

  if (!dishName) return { error: "Chưa có tên món." };
  if (dishName.length > 120) return { error: "Tên món dài quá." };

  const caption = String(formData.get("caption") ?? "").trim();
  if (caption.length > 2000) return { error: "Lời kể dài quá." };

  const minutesRaw = String(formData.get("minutes") ?? "").trim();
  const minutes = minutesRaw ? Number(minutesRaw) : null;
  if (
    minutes !== null &&
    (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)
  ) {
    return { error: "Thời gian nấu không hợp lệ." };
  }

  const knownIngredients = new Set(catalog.ingredients.map((item) => item.id));
  const tuDanhMuc = formData
    .getAll("ingredientIds")
    .map((value) => String(value))
    .filter((id) => knownIngredients.has(id));

  // Nguyên liệu nhà mình tự gõ: không có id để đối chiếu nên chỉ dọn khoảng
  // trắng, cắt độ dài và gắn tiền tố cho khỏi lẫn với id danh mục.
  const daCo = new Set<string>();
  const tenTuDo = formData
    .getAll("ingredientNames")
    .map((value) => capitalize(String(value)).slice(0, TU_DO_MAX_LEN).trim())
    .filter((name) => {
      if (!name) return false;
      const key = normalizeText(name);
      if (!key || daCo.has(key)) return false;
      daCo.add(key);
      return true;
    })
    .slice(0, 30);

  const duyet = await kiemDuyetVanBan(
    "bai",
    [dishName, caption, ...tenTuDo].join("\n"),
  );
  if (!duyet.ok) return { error: duyet.lyDo ?? "Nội dung không phù hợp." };

  const ingredientIds = Array.from(
    new Set([...tuDanhMuc, ...tenTuDo.map(danhDauTuDo)]),
  ).slice(0, 30);

  const anh = formData.get("anh");
  let imagePath: string | null = null;

  if (anh instanceof File && anh.size > 0) {
    if (!ANH_MON_MIME.includes(anh.type)) {
      return { error: "Ảnh phải là JPG, PNG hoặc WEBP." };
    }
    if (anh.size > ANH_MON_MAX_BYTES) {
      return { error: "Ảnh nặng quá 5MB." };
    }

    // Xem ảnh trước khi tải lên: ảnh bị chặn thì không để lại gì trong bucket.
    const duyetAnh = await kiemDuyetAnh(
      Buffer.from(await anh.arrayBuffer()).toString("base64"),
      anh.type,
    );
    if (!duyetAnh.ok) {
      return { error: duyetAnh.lyDo ?? "Ảnh không phù hợp." };
    }

    const ext =
      anh.type === "image/png"
        ? "png"
        : anh.type === "image/webp"
          ? "webp"
          : "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(ANH_MON_BUCKET)
      .upload(path, anh, { contentType: anh.type, upsert: false });

    if (error) return { error: `Không tải được ảnh lên: ${error.message}` };
    imagePath = path;
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: userId,
      dish_id: dish?.id ?? null,
      recipe_id: recipeId,
      dish_name: dishName,
      caption,
      image_path: imagePath,
      minutes,
      ingredient_ids: ingredientIds,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Không đăng được bài." };
  }

  revalidatePath("/cong-dong");
  redirect(`/bai/${data.id}`);
}

export async function doiThich(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const from = String(formData.get("from") ?? "/cong-dong");

  const account = await taiKhoanHienTai();
  if ("error" in account)
    redirect(`/dang-nhap?next=${encodeURIComponent(from)}`);
  const { supabase, userId } = account;

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
  } else {
    await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: userId });
  }

  revalidatePath(duongDan(from));
  revalidatePath(`/bai/${postId}`);
}

export async function binhLuan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const postId = String(formData.get("postId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return { error: "Chưa viết gì." };
  if (body.length > 1000) return { error: "Bình luận dài quá." };

  const duyet = await kiemDuyetVanBan("binh-luan", body);
  if (!duyet.ok) return { error: duyet.lyDo ?? "Bình luận không phù hợp." };

  const account = await taiKhoanHienTai();
  if ("error" in account) return account;

  const { error } = await account.supabase
    .from("post_comments")
    .insert({ post_id: postId, author_id: account.userId, body });

  if (error) return { error: error.message };

  revalidatePath(`/bai/${postId}`);
  return {};
}

export async function xoaBai(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");

  const account = await taiKhoanHienTai();
  if ("error" in account) redirect("/dang-nhap");
  const { supabase, userId } = account;

  const { data: post } = await supabase
    .from("posts")
    .select("image_path")
    .eq("id", postId)
    .eq("author_id", userId)
    .maybeSingle();

  if (!post) redirect("/cong-dong");

  await supabase.from("posts").delete().eq("id", postId);

  // Xoá ảnh sau khi xoá bài: còn ảnh mồ côi thì chỉ tốn chỗ, còn bài trỏ vào
  // ảnh đã mất thì người dùng thấy ô vỡ.
  if (post.image_path) {
    await supabase.storage.from(ANH_MON_BUCKET).remove([post.image_path]);
  }

  revalidatePath("/cong-dong");
  redirect("/cong-dong");
}

export async function doiTheoDoi(formData: FormData) {
  const targetId = String(formData.get("targetId") ?? "");
  const from = String(formData.get("from") ?? "/cong-dong");

  const account = await taiKhoanHienTai();
  if ("error" in account)
    redirect(`/dang-nhap?next=${encodeURIComponent(from)}`);
  const { supabase, userId } = account;

  if (targetId === userId) return;

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", userId)
    .eq("following_id", targetId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", targetId);
  } else {
    await supabase
      .from("follows")
      .insert({ follower_id: userId, following_id: targetId });
  }

  revalidatePath(duongDan(from));
}

export async function capNhatHoSo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const account = await taiKhoanHienTai();
  if ("error" in account) return account;
  const { supabase, userId } = account;

  const displayName = String(formData.get("displayName") ?? "").trim();
  const handle = String(formData.get("handle") ?? "")
    .trim()
    .toLowerCase();
  const bio = String(formData.get("bio") ?? "").trim();

  if (displayName.length > 60) return { error: "Tên dài quá." };
  if (bio.length > 280) return { error: "Giới thiệu dài quá." };
  if (!/^[a-z0-9][a-z0-9-]{2,23}$/.test(handle)) {
    return {
      error: "Tên bếp chỉ gồm chữ thường, số và dấu gạch ngang, 3-24 ký tự.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      handle,
      bio: bio || null,
    })
    .eq("id", userId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Tên bếp này có người dùng rồi."
          : error.message,
    };
  }

  revalidatePath("/cong-dong");
  redirect(`/bep/${handle}`);
}
