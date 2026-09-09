"use client";

import * as React from "react";

const subscribe = () => () => {};

/**
 * true sau khi component đã chạy ở trình duyệt.
 * Dùng cho những thứ chỉ biết được ở client (giờ hiện tại, nền sáng/tối)
 * mà không gây lệch nội dung lúc hydrate.
 */
export function useMounted(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
