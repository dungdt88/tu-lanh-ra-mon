import type { Dish } from "@/lib/types";

/**
 * Công thức nhà mình đi chung một rổ với món danh mục khi chấm điểm, nên id
 * của nó mang tiền tố để mọi nơi biết đường nào mà dẫn tới. Id món danh mục là
 * slug tự đặt trong `src/data`, không bao giờ bắt đầu bằng chuỗi này.
 */
export const CONG_THUC_PREFIX = "rieng-";

export function laCongThucRieng(dishId: string): boolean {
  return dishId.startsWith(CONG_THUC_PREFIX);
}

/** `rieng-<uuid>` -> `<uuid>` để gọi DB. */
export function idCongThuc(dishId: string): string {
  return dishId.slice(CONG_THUC_PREFIX.length);
}

export function duongDanMon(dish: Pick<Dish, "id" | "slug">): string {
  return laCongThucRieng(dish.id)
    ? `/cong-thuc/${idCongThuc(dish.id)}`
    : `/mon/${dish.slug}`;
}
