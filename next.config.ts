import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép mở dev server từ điện thoại/iPad cùng wifi (npm run dev:lan).
  // Không có dòng này, Next.js chặn asset _next/* khi Origin khác localhost
  // -> trang vẫn hiện (SSR) nhưng JS không chạy được, mọi nút bấm im re.
  allowedDevOrigins: [
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
