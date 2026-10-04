import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// Khi mở app ra ngoài qua tunnel (zrok, ngrok, cloudflared), trình duyệt gửi
// Origin là tên miền tunnel chứ không phải localhost. Next chặn cả asset
// _next/* lẫn Server Action đến từ origin lạ, nên phải khai báo tên miền đó.
// Lấy từ NEXT_PUBLIC_SITE_URL để không ghi cứng địa chỉ của một phiên tunnel.
const siteHost = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host
  : undefined;

const nextConfig: NextConfig = {
  // Dockerfile chỉ chép .next/standalone vào image chạy, không mang node_modules.
  output: "standalone",

  // Ảnh món ăn nằm trong Supabase Storage. Host lấy từ env chứ không ghi cứng:
  // mỗi project Supabase là một tên miền khác.
  images: supabaseHost
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ],
      }
    : undefined,

  // Server Action gửi kèm Origin; qua tunnel nó khác Host nên Next từ chối
  // với "x-forwarded-host does not match origin" nếu không khai ở đây.
  experimental: {
    serverActions: {
      ...(siteHost ? { allowedOrigins: [siteHost] } : {}),
      // Mặc định chỉ 1MB. Ảnh món nén ở client thì lọt, nhưng máy nào không
      // nén được (HEIC trên trình duyệt cũ) gửi nguyên ảnh lên - để vừa đủ cho
      // ANH_MON_MAX_BYTES (5MB) cộng phần vỏ form, dangBai mới tự báo lỗi
      // tiếng Việt thay vì Next chặn cứng.
      bodySizeLimit: "6mb",
    },
  },

  // Cho phép mở dev server từ điện thoại/iPad cùng wifi (npm run dev:lan) và
  // qua tunnel. Không có dòng này, Next.js chặn asset _next/* khi Origin khác
  // localhost -> trang vẫn hiện (SSR) nhưng JS không chạy, mọi nút bấm im re.
  allowedDevOrigins: [
    ...(siteHost ? [siteHost] : []),
    "*.share.zrok.io",
    "*.ngrok-free.app",
    "*.trycloudflare.com",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
  ],
};

export default nextConfig;
