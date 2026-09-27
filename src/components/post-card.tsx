import Image from "next/image";
import Link from "next/link";
import { Clock, MessageCircle, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LikeButton } from "@/components/like-button";
import { ShareButton } from "@/components/share-button";
import { thoiGianTuongDoi } from "@/lib/time";
import type { FeedPost } from "@/lib/repo/feed";

export function PostCard({ post, from }: { post: FeedPost; from: string }) {
  const bepHref = post.author.handle ? `/bep/${post.author.handle}` : null;

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex items-center gap-2 px-4 pt-4">
        <span className="bg-accent flex size-9 shrink-0 items-center justify-center rounded-full text-base">
          {post.author.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          {bepHref ? (
            <Link
              href={bepHref}
              className="truncate font-medium hover:underline"
            >
              {post.author.name}
            </Link>
          ) : (
            <span className="truncate font-medium">{post.author.name}</span>
          )}
          <p className="text-muted-foreground text-xs">
            {thoiGianTuongDoi(post.createdAt)}
          </p>
        </div>
      </div>

      <Link href={`/bai/${post.id}`} className="mt-3 block">
        {post.imageUrl && (
          <div className="bg-muted relative aspect-[4/3] w-full">
            <Image
              src={post.imageUrl}
              alt={post.dishName}
              fill
              sizes="(max-width: 672px) 100vw, 672px"
              className="object-cover"
            />
          </div>
        )}

        <div className="space-y-1 px-4 pt-3">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{post.dishName}</h3>
            {post.minutes && (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                <Clock className="size-3" /> {post.minutes} phút
              </Badge>
            )}
          </div>
          {post.caption && (
            <p className="line-clamp-3 text-sm whitespace-pre-line">
              {post.caption}
            </p>
          )}
        </div>
      </Link>

      {post.ingredientNames.length > 0 && (
        <p className="text-muted-foreground mt-2 px-4 text-xs">
          Nguyên liệu: {post.ingredientNames.join(", ")}
        </p>
      )}

      {post.dishSlug && (
        <Link
          href={`/mon/${post.dishSlug}`}
          className="text-primary mt-2 flex items-center gap-1 px-4 text-xs font-medium hover:underline"
        >
          <UtensilsCrossed className="size-3.5" /> Xem công thức món này
        </Link>
      )}

      <div className="mt-2 flex items-center gap-1 px-2 pb-2">
        <LikeButton
          postId={post.id}
          count={post.likeCount}
          liked={post.likedByMe}
          from={from}
        />
        <Link
          href={`/bai/${post.id}`}
          className="text-muted-foreground hover:text-foreground hover:bg-muted flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors"
        >
          <MessageCircle className="size-4" />
          {post.commentCount > 0 && post.commentCount}
        </Link>
        <div className="ml-auto pr-2">
          <ShareButton
            path={`/bai/${post.id}`}
            title={`${post.dishName} · Tủ Lạnh Ra Món`}
            text={post.caption || undefined}
            label=""
            variant="ghost"
          />
        </div>
      </div>
    </Card>
  );
}
