"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  Refrigerator,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePantry } from "@/lib/pantry-store";

const ITEMS = [
  { href: "/", label: "Hôm nay", icon: UtensilsCrossed },
  { href: "/quet", label: "Quét tủ", icon: Camera },
  { href: "/tu-lanh", label: "Tủ lạnh", icon: Refrigerator },
  { href: "/tro-ly", label: "Trợ lý", icon: Sparkles },
  { href: "/cong-dong", label: "Cộng đồng", icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();
  const { items, hydrated } = usePantry();

  return (
    <nav
      className="bg-background/95 fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg border-t backdrop-blur md:max-w-2xl md:border-x"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                prefetch
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors active:scale-95",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden />
                  {href === "/tu-lanh" && hydrated && items.length > 0 && (
                    <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-2 rounded-full px-1.5 text-[10px] leading-4 font-semibold">
                      {items.length}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
