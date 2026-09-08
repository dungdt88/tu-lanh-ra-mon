import type { Metadata, Viewport } from "next";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: "Tủ Lạnh Ra Món",
  description:
    "Chụp ảnh tủ lạnh, nhận gợi ý mâm cơm đủ chất cho cả nhà trong 30 phút.",
  applicationName: "Tủ Lạnh Ra Món",
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full" suppressHydrationWarning>
      <body className="bg-muted/40 min-h-full">
        <div className="bg-background mx-auto flex min-h-dvh w-full max-w-lg flex-col shadow-sm">
          <main className="flex-1 pb-24">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
