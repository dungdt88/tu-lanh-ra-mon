"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";

/** Nút đổi nền sáng/tối. Lần đầu chạy theo cài đặt của máy. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Chuyển nền sáng" : "Chuyển nền tối"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "hover:bg-muted flex size-10 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95",
        className,
      )}
    >
      {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
    </button>
  );
}
