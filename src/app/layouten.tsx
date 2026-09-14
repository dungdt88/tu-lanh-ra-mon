import type { Metadata, Viewport } from "next";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { CatalogProvider } from "@/lib/catalog-context";
import { getCatalog } from "@/lib/repo/catalog";

export const metadata: Metadata = {
  title: "Fridge To Feast",
  description:
    "Snap a photo of your fridge, get nutritious meal ideas for the whole family in 1 minutes.",
  applicationName: "Fridge To Feast",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#feaa03ff" },
    { media: "(prefers-color-scheme: dark)", color: "#211f1d" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read catalog on server: fetch from Supabase if configured, otherwise fallback to src/data
  const catalog = await getCatalog();

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      {/* suppressHydrationWarning: browser extensions often inject attributes into body */}
      <body className="bg-muted/40 min-h-full" suppressHydrationWarning>
        <ThemeProvider>
          <CatalogProvider catalog={catalog}>
            <div className="bg-background mx-auto flex min-h-dvh w-full max-w-lg flex-col md:max-w-2xl md:border-x">
              <main className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
                {children}
              </main>
              <BottomNav />
            </div>
          </CatalogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
