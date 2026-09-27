"use client";

import * as React from "react";
import { Check, X } from "lucide-react";

/**
 * Xác nhận sau khi quét ảnh xong.
 *
 * `ScanUploader` reset sạch sau khi xong nên không còn dấu vết gì của lần quét;
 * thiếu dòng này thì người dùng vừa thêm 8 nguyên liệu mà màn hình chỉ âm thầm
 * đổi vài con số, không biết ảnh của mình có được dùng hay không.
 */
export function ScanResultBanner({
  soLuong,
  onDong,
}: {
  soLuong: number;
  onDong: () => void;
}) {
  // Giữ callback trong ref: phía gọi truyền hàm mới mỗi lần render, để nó vào
  // deps của hẹn giờ thì giờ bị đặt lại liên tục. Gán trong effect chứ không
  // gán lúc render - React không cho sửa ref khi đang render.
  const dongRef = React.useRef(onDong);
  React.useEffect(() => {
    dongRef.current = onDong;
  }, [onDong]);

  // Tự biến mất: đây là xác nhận, không phải việc cần làm
  React.useEffect(() => {
    const hen = setTimeout(() => dongRef.current(), 6000);
    return () => clearTimeout(hen);
  }, [soLuong]);

  return (
    <div
      role="status"
      className="bg-accent/60 text-accent-foreground flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm"
    >
      <Check className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">
        Đã thêm <span className="font-semibold">{soLuong} nguyên liệu</span> từ
        ảnh. Mâm cơm dưới đây đã tính theo tủ lạnh mới.
      </span>
      <button
        type="button"
        onClick={onDong}
        aria-label="Đóng"
        className="hover:bg-accent -mr-1 shrink-0 rounded-full p-1.5"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
