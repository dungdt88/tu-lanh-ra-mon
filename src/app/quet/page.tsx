"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ScanUploader } from "@/components/scan-uploader";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ScanPage() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quét tủ lạnh"
        subtitle="Tải ảnh lên — app đọc ra nguyên liệu"
        backHref="/"
        action={<ThemeToggle />}
      />

      <div className="px-4 pb-4">
        <ScanUploader onDone={() => router.push("/")} />
      </div>
    </div>
  );
}
