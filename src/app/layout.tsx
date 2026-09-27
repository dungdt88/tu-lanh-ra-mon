import type { Metadata, Viewport } from "next";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { Splash } from "@/components/splash";
import { ThemeProvider } from "@/components/theme-provider";
import { CatalogProvider } from "@/lib/catalog-context";
import { getCatalog } from "@/lib/repo/catalog";
import { getCongThucCuaToi } from "@/lib/repo/recipe";
import { SITE_URL } from "@/lib/site";

const MO_TA =
  "Chụp ảnh tủ lạnh, nhận gợi ý mâm cơm đủ chất cho cả nhà trong 30 phút.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Tủ Lạnh Ra Món",
  description: MO_TA,
  applicationName: "Tủ Lạnh Ra Món",
  openGraph: {
    type: "website",
    siteName: "Tủ Lạnh Ra Món",
    locale: "vi_VN",
    title: "Tủ Lạnh Ra Món",
    description: MO_TA,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#feaa03" },
    { media: "(prefers-color-scheme: dark)", color: "#211f1d" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [catalog, congThuc] = await Promise.all([
    getCatalog(),
    getCongThucCuaToi(),
  ]);

  // Công thức nhà mình đi chung một rổ với danh mục để máy gợi ý chấm điểm nó
  // như mọi món khác.
  const danhMuc = { ...catalog, dishes: [...catalog.dishes, ...congThuc] };

  return (
    <html lang="vi" className="h-full" suppressHydrationWarning>
      <body className="bg-muted/40 min-h-full" suppressHydrationWarning>
        <Splash />
        <ThemeProvider>
          <CatalogProvider catalog={danhMuc}>
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
