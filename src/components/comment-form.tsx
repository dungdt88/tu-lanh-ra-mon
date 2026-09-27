"use client";

import * as React from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { binhLuan, type ActionState } from "@/lib/actions/post";

const TRONG: ActionState = {};

export function CommentForm({ postId }: { postId: string }) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, action, pending] = React.useActionState(binhLuan, TRONG);

  React.useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <Textarea
        name="body"
        required
        maxLength={1000}
        rows={2}
        placeholder="Khen một câu, hoặc hỏi cách làm..."
      />
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Gửi
        </Button>
      </div>
    </form>
  );
}
