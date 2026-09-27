"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { doiThich } from "@/lib/actions/post";
import { cn } from "@/lib/utils";

/**
 * Tim đổi màu ngay khi chạm, không chờ server.
 *
 * Người dùng vừa nấu vừa cầm điện thoại: chờ một vòng mạng mới thấy phản hồi
 * là họ bấm lại lần nữa.
 */
export function LikeButton({
  postId,
  count,
  liked,
  from,
}: {
  postId: string;
  count: number;
  liked: boolean;
  from: string;
}) {
  const [optimistic, setOptimistic] = React.useOptimistic(
    { count, liked },
    (state) => ({
      liked: !state.liked,
      count: state.count + (state.liked ? -1 : 1),
    }),
  );

  // Gọi setOptimistic bên trong action của form: React giữ trạng thái tạm cho
  // tới khi server action xong. Đặt ở onClick thì transition kết thúc sớm và
  // trái tim nháy về trạng thái cũ một nhịp.
  async function thich(formData: FormData) {
    setOptimistic(undefined);
    await doiThich(formData);
  }

  return (
    <form action={thich}>
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="from" value={from} />
      <button
        type="submit"
        aria-pressed={optimistic.liked}
        aria-label={optimistic.liked ? "Bỏ thích" : "Thích"}
        className={cn(
          "flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors active:scale-95",
          optimistic.liked
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
        )}
      >
        <Heart
          className={cn("size-4", optimistic.liked && "fill-current")}
          aria-hidden
        />
        {optimistic.count > 0 && optimistic.count}
      </button>
    </form>
  );
}
