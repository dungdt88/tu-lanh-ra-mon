import type { Metadata, Viewport } from "next";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Tủ Lạnh Ra Món",
  description:
    "Chụp ảnh tủ lạnh, nhận gợi ý mâm cơm đủ chất cho cả nhà trong 30 phút.",
  applicationName: "Tủ Lạnh Ra Món",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfcfa" },
    { media: "(prefers-color-scheme: dark)", color: "#211f1d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full" suppressHydrationWarning>
      {/* suppressHydrationWarning: tiện ích trình duyệt hay chèn thuộc tính vào body */}
      <body className="bg-muted/40 min-h-full" suppressHydrationWarning>
        <ThemeProvider>
          <div className="bg-background mx-auto flex min-h-dvh w-full max-w-lg flex-col md:max-w-2xl md:border-x">
            <main className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
              {children}
            </main>
            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
