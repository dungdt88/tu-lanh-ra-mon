"use client";

import * as React from "react";
import { Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { doiTheoDoi } from "@/lib/actions/post";

export function FollowButton({
  targetId,
  following,
  from,
}: {
  targetId: string;
  following: boolean;
  from: string;
}) {
  const [optimistic, setOptimistic] = React.useOptimistic(
    following,
    (state) => !state,
  );

  async function theoDoi(formData: FormData) {
    setOptimistic(undefined);
    await doiTheoDoi(formData);
  }

  return (
    <form action={theoDoi}>
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="from" value={from} />
      <Button
        type="submit"
        size="sm"
        variant={optimistic ? "secondary" : "default"}
      >
        {optimistic ? (
          <>
            <Check className="size-4" /> Đang theo dõi
          </>
        ) : (
          <>
            <UserPlus className="size-4" /> Theo dõi
          </>
        )}
      </Button>
    </form>
  );
}
