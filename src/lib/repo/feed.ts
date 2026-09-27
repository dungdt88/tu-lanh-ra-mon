import "server-only";

import { laTuDo, tenTuDo } from "@/lib/ingredient-id";
import { createClient } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/repo/catalog";
import { ANH_MON_BUCKET } from "@/lib/storage";
import type {
  PostCommentRow,
  PostRow,
  PublicProfile,
} from "@/lib/supabase/database.types";
import { SUPABASE_URL } from "@/lib/supabase/env";

export type FeedAuthor = {
  id: string;
  handle: string | null;
  name: string;
  avatarUrl: string | null;
};

export type FeedPost = {
  id: string;
  author: FeedAuthor;
  dishId: string | null;
  /** Có slug nghĩa là món nằm trong danh mục, bấm vào xem được công thức */
  dishSlug: string | null;
  /** Bài nấu theo công thức nhà người đăng, nếu có */
  recipeId: string | null;
  dishName: string;
  caption: string;
  imageUrl: string | null;
  minutes: number | null;
  ingredientNames: string[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
};

export type FeedComment = {
  id: string;
  author: FeedAuthor;
  body: string;
  createdAt: string;
};

export type BepProfile = {
  id: string;
  handle: string | null;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
  followedByMe: boolean;
  isMe: boolean;
};

const PAGE_SIZE = 20;

/** Ảnh trong bucket công khai nên dựng URL thẳng, không cần gọi API. */
export function anhMonUrl(path: string | null): string | null {
  if (!path || !SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${ANH_MON_BUCKET}/${path}`;
}

function authorOf(profile: PublicProfile | undefined, id: string): FeedAuthor {
  return {
    id,
    handle: profile?.handle ?? null,
    name:
      profile?.display_name?.trim() || profile?.handle || "Người nấu ẩn danh",
    avatarUrl: profile?.avatar_url ?? null,
  };
}

/**
 * Ghép bài đăng với tác giả, tên nguyên liệu và slug món.
 *
 * posts.author_id trỏ tới auth.users chứ không phải tlrm.profiles nên PostgREST
 * không tự join được - phải lấy hồ sơ bằng một truy vấn riêng rồi ghép ở đây.
 */
async function hydratePosts(rows: PostRow[], viewerId: string | null) {
  if (rows.length === 0) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const authorIds = [...new Set(rows.map((row) => row.author_id))];
  const postIds = rows.map((row) => row.id);

  const [profilesResult, likesResult, catalog] = await Promise.all([
    supabase.from("public_profiles").select("*").in("id", authorIds),
    viewerId
      ? supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", viewerId)
          .in("post_id", postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    getCatalog(),
  ]);

  const profileById = new Map(
    (profilesResult.data ?? []).map((row) => [row.id, row]),
  );
  const likedPostIds = new Set(
    (likesResult.data ?? []).map((row) => row.post_id),
  );
  const dishById = new Map(catalog.dishes.map((dish) => [dish.id, dish]));
  const ingredientById = new Map(
    catalog.ingredients.map((ingredient) => [ingredient.id, ingredient]),
  );

  return rows.map<FeedPost>((row) => ({
    id: row.id,
    author: authorOf(profileById.get(row.author_id), row.author_id),
    dishId: row.dish_id,
    dishSlug: row.dish_id ? (dishById.get(row.dish_id)?.slug ?? null) : null,
    recipeId: row.recipe_id,
    dishName: row.dish_name,
    caption: row.caption,
    imageUrl: anhMonUrl(row.image_path),
    minutes: row.minutes,
    ingredientNames: row.ingredient_ids.map((id) =>
      laTuDo(id) ? tenTuDo(id) : (ingredientById.get(id)?.name ?? id),
    ),
    likeCount: row.like_count,
    commentCount: row.comment_count,
    likedByMe: likedPostIds.has(row.id),
    createdAt: row.created_at,
  }));
}

/** Feed mới nhất. `followingOf` chỉ lấy bài của những bếp người đó theo dõi. */
export async function getFeed(options?: {
  authorId?: string;
  followingOf?: string;
  viewerId?: string | null;
  limit?: number;
}): Promise<FeedPost[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  let authorFilter: string[] | null = null;
  if (options?.followingOf) {
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", options.followingOf);
    authorFilter = (data ?? []).map((row) => row.following_id);
    if (authorFilter.length === 0) return [];
  }

  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? PAGE_SIZE);

  if (options?.authorId) query = query.eq("author_id", options.authorId);
  if (authorFilter) query = query.in("author_id", authorFilter);

  const { data, error } = await query;
  if (error || !data) {
    if (error) console.error("[feed] không đọc được bài đăng:", error.message);
    return [];
  }

  return hydratePosts(data, options?.viewerId ?? null);
}

export async function getPost(
  id: string,
  viewerId: string | null,
): Promise<FeedPost | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const [post] = await hydratePosts([data], viewerId);
  return post ?? null;
}

export async function getComments(postId: string): Promise<FeedComment[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const rows: PostCommentRow[] = data ?? [];
  if (rows.length === 0) return [];

  const { data: profiles } = await supabase
    .from("public_profiles")
    .select("*")
    .in("id", [...new Set(rows.map((row) => row.author_id))]);

  const profileById = new Map((profiles ?? []).map((row) => [row.id, row]));

  return rows.map((row) => ({
    id: row.id,
    author: authorOf(profileById.get(row.author_id), row.author_id),
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function getBepByHandle(
  handle: string,
  viewerId: string | null,
): Promise<BepProfile | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: profile } = await supabase
    .from("public_profiles")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) return null;

  const [posts, followers, following, mine] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", profile.id),
    supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    viewerId
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", viewerId)
          .eq("following_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    id: profile.id,
    handle: profile.handle,
    name: profile.display_name?.trim() || profile.handle || "Người nấu ẩn danh",
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    postCount: posts.count ?? 0,
    followerCount: followers.count ?? 0,
    followingCount: following.count ?? 0,
    followedByMe: Boolean(mine.data),
    isMe: viewerId === profile.id,
  };
}
