import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "bg-background/95 sticky top-0 z-30 border-b px-4 py-3 backdrop-blur",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Quay lại"
            className="hover:bg-muted -ml-2 rounded-full p-1.5"
          >
            <ChevronLeft className="size-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
