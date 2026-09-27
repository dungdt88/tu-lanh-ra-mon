"use client";

import * as React from "react";
import { Check, ExternalLink, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Chia sẻ ra ngoài app.
 *
 * Điện thoại có sẵn bảng chia sẻ hệ thống (Zalo, Messenger, tin nhắn...), nên
 * ưu tiên `navigator.share`. Không nhúng SDK chia sẻ của Zalo/Facebook: nó kéo
 * script bên thứ ba vào mọi trang, trong khi bảng hệ thống đã làm đúng việc đó.
 */
export function ShareButton({
  path,
  title,
  text,
  label = "Chia sẻ",
  variant = "outline",
}: {
  /** Đường dẫn nội bộ, ví dụ /bai/abc. URL tuyệt đối dựng ở client. */
  path: string;
  title: string;
  text?: string;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  function url() {
    return `${window.location.origin}${path}`;
  }

  async function share() {
    const link = url();

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: link });
        return;
      } catch {
        // Người dùng đóng bảng chia sẻ - không phải lỗi, chỉ là thôi không chia sẻ
        return;
      }
    }

    setOpen(true);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={label ? "sm" : "icon-sm"}
        onClick={share}
        aria-label={label || "Chia sẻ"}
      >
        <Share2 className="size-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Chia sẻ</DialogTitle>
            <DialogDescription className="truncate">{title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-start"
              onClick={copy}
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Link2 className="size-4" />
              )}
              {copied ? "Đã chép link" : "Chép link"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full justify-start"
              onClick={() =>
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <ExternalLink className="size-4" />
              Đăng lên Facebook
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
