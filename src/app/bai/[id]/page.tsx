import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CommentForm } from "@/components/comment-form";
import { LikeButton } from "@/components/like-button";
import { PageHeader } from "@/components/page-header";
import { ShareButton } from "@/components/share-button";
import { requireUser } from "@/lib/auth";
import { xoaBai } from "@/lib/actions/post";
import { getComments, getPost } from "@/lib/repo/feed";
import { getCongThuc } from "@/lib/repo/recipe";
import { thoiGianTuongDoi } from "@/lib/time";

export async function generateMetadata({ params }: PageProps<"/bai/[id]">) {
  const { id } = await params;
  const post = await getPost(id, null);

  if (!post) return { title: "Không tìm thấy bài" };

  const title = `${post.dishName} · bếp ${post.author.name}`;
  const description =
    post.caption.slice(0, 200) ||
    `${post.author.name} vừa khoe món ${post.dishName} trên Tủ Lạnh Ra Món.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "article" as const },
    twitter: { card: "summary_large_image" as const, title, description },
  };
}

export default async function BaiPage({ params }: PageProps<"/bai/[id]">) {
  const { id } = await params;
  const user = await requireUser(`/bai/${id}`);

  const [post, comments] = await Promise.all([
    getPost(id, user.id),
    getComments(id),
  ]);

  if (!post) notFound();

  // Công thức để riêng thì RLS trả null, lúc đó bài không có nút xem công thức.
  const congThuc = post.recipeId ? await getCongThuc(post.recipeId) : null;

  const laBaiCuaMinh = user?.id === post.author.id;
  const from = `/bai/${post.id}`;

  return (
    <div className="space-y-4">
      <PageHeader
        title={post.dishName}
        subtitle={`bếp ${post.author.name}`}
        backHref="/cong-dong"
        action={
          <ShareButton
            path={from}
            title={`${post.dishName} · Tủ Lạnh Ra Món`}
            text={post.caption || undefined}
            label=""
            variant="ghost"
          />
        }
      />

      <article className="space-y-4">
        {post.imageUrl && (
          <div className="bg-muted relative aspect-[4/3] w-full">
            <Image
              src={post.imageUrl}
              alt={post.dishName}
              fill
              priority
              sizes="(max-width: 672px) 100vw, 672px"
              className="object-cover"
            />
          </div>
        )}

        <div className="space-y-3 px-4">
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span>{thoiGianTuongDoi(post.createdAt)}</span>
            {post.minutes && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> {post.minutes} phút
              </span>
            )}
            {post.author.handle && (
              <Link
                href={`/bep/${post.author.handle}`}
                className="hover:text-foreground underline-offset-2 hover:underline"
              >
                @{post.author.handle}
              </Link>
            )}
          </div>

          {post.caption && (
            <p className="text-sm whitespace-pre-line">{post.caption}</p>
          )}

          {post.ingredientNames.length > 0 && (
            <p className="text-muted-foreground text-sm">
              <span className="font-medium">Nấu bằng:</span>{" "}
              {post.ingredientNames.join(", ")}
            </p>
          )}

          {post.dishSlug ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/mon/${post.dishSlug}`}>
                <UtensilsCrossed className="size-4" /> Xem công thức
              </Link>
            </Button>
          ) : (
            congThuc && (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/cong-thuc/${congThuc.recipeId}`}>
                  <UtensilsCrossed className="size-4" /> Xem công thức nhà này
                </Link>
              </Button>
            )
          )}

          <div className="flex items-center gap-1">
            <LikeButton
              postId={post.id}
              count={post.likeCount}
              liked={post.likedByMe}
              from={from}
            />
            <ShareButton
              path={from}
              title={`${post.dishName} · Tủ Lạnh Ra Món`}
              text={post.caption || undefined}
              variant="ghost"
            />
            {laBaiCuaMinh && (
              <form action={xoaBai} className="ml-auto">
                <input type="hidden" name="postId" value={post.id} />
                <Button type="submit" variant="ghost" size="sm">
                  <Trash2 className="size-4" /> Xoá
                </Button>
              </form>
            )}
          </div>
        </div>
      </article>

      <Separator />

      <section className="space-y-3 px-4">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Bình luận {comments.length > 0 && `(${comments.length})`}
        </h2>

        {comments.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Chưa có bình luận nào.
          </p>
        )}

        <div className="space-y-2">
          {comments.map((comment) => (
            <Card key={comment.id} className="gap-1 p-3">
              <div className="flex items-baseline gap-2">
                {comment.author.handle ? (
                  <Link
                    href={`/bep/${comment.author.handle}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {comment.author.name}
                  </Link>
                ) : (
                  <span className="truncate text-sm font-medium">
                    {comment.author.name}
                  </span>
                )}
                <span className="text-muted-foreground text-xs">
                  {thoiGianTuongDoi(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-line">{comment.body}</p>
            </Card>
          ))}
        </div>

        {user ? (
          <CommentForm postId={post.id} />
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/dang-nhap?next=${encodeURIComponent(from)}`}>
              Đăng nhập để bình luận
            </Link>
          </Button>
        )}
      </section>
    </div>
  );
}
