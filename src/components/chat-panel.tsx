"use client";

import * as React from "react";
import { ArrowUp, Eraser, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_CONTEXT_MESSAGES,
  newMessage,
  useChatStore,
  type ThreadKey,
} from "@/lib/chat-store";
import type { ChatRequest, ChatResponse } from "@/lib/chat-api";
import type { ChatScope } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  threadKey: ThreadKey;
  scope: ChatScope;
  /** Ngữ cảnh gửi kèm mỗi lượt - gọi lúc gửi để luôn lấy trạng thái mới nhất */
  context: () => Pick<ChatRequest, "dish" | "pantry" | "prefs">;
  placeholder: string;
  emptyTitle: string;
  emptyHint: string;
  suggestions: string[];
  onResponse?: (response: ChatResponse) => void;
  /** Chỗ để cha gắn thẻ đề xuất, nằm dưới danh sách tin nhắn */
  footer?: React.ReactNode;
  className?: string;
};

export function ChatPanel({
  threadKey,
  scope,
  context,
  placeholder,
  emptyTitle,
  emptyHint,
  suggestions,
  onResponse,
  footer,
  className,
}: Props) {
  const { messagesOf, appendMessages, clearThread, hydrated } = useChatStore();
  const messages = messagesOf(threadKey);

  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, sending, footer]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;

    setDraft("");
    setError(null);
    setSending(true);
    appendMessages(threadKey, newMessage("user", content));

    // Lấy lịch sử ngay tại đây thay vì dùng biến của lần render hiện tại
    const history = [
      ...messagesOf(threadKey),
      { role: "user" as const, content },
    ]
      .slice(-MAX_CONTEXT_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scope,
          messages: history,
          ...context(),
        } satisfies ChatRequest),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as ChatResponse;

      appendMessages(threadKey, newMessage("assistant", data.reply));
      onResponse?.(data);
    } catch {
      setError("Không gửi được. Kiểm tra mạng rồi thử lại nhé.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {hydrated && messages.length === 0 && (
          <div className="text-muted-foreground space-y-3 py-4 text-center">
            <Sparkles className="text-primary mx-auto size-6" />
            <div>
              <p className="text-foreground text-sm font-medium">
                {emptyTitle}
              </p>
              <p className="mt-1 text-xs">{emptyHint}</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted rounded-bl-sm",
              )}
            >
              {message.content}
            </p>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <span className="bg-muted text-muted-foreground rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
              Đang nghĩ…
            </span>
          </div>
        )}

        {error && (
          <p className="text-destructive px-1 text-center text-xs">{error}</p>
        )}

        {footer}

        <div ref={bottomRef} />
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 px-1 pb-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={sending}
              onClick={() => send(suggestion)}
              className="bg-secondary text-secondary-foreground min-h-9 rounded-full px-3 text-xs font-medium transition-transform active:scale-95 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 border-t pt-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send(draft);
            }
          }}
          placeholder={placeholder}
          rows={1}
          className="max-h-32 min-h-11 flex-1 resize-none"
        />
        {messages.length > 0 && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Xoá hội thoại"
            onClick={() => clearThread(threadKey)}
            className="size-11 shrink-0"
          >
            <Eraser />
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          aria-label="Gửi"
          disabled={!draft.trim() || sending}
          onClick={() => send(draft)}
          className="size-11 shrink-0"
        >
          <ArrowUp />
        </Button>
      </div>
    </div>
  );
}
