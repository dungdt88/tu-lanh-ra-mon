/**
 * Nguyên liệu của một bài đăng có hai loại:
 *
 * - id trong danh mục, luôn là slug không dấu (vd `thit-heo`);
 * - tên nhà mình tự gõ, không có trong danh mục (vd `Cà pháo mắm tôm`).
 *
 * Cả hai nằm chung trong cột `tlrm.posts.ingredient_ids`, nên loại tự gõ mang
 * thêm tiền tố. Dấu `:` không bao giờ xuất hiện trong slug nên không thể lẫn.
 */
export const TU_DO_PREFIX = "khac:";

/** Tên tự gõ dài hơn mức này thì cắt bớt - chip dài quá sẽ vỡ giao diện. */
export const TU_DO_MAX_LEN = 40;

export function laTuDo(id: string): boolean {
  return id.startsWith(TU_DO_PREFIX);
}

/** `khac:Cà pháo` -> `Cà pháo`. Id danh mục giữ nguyên. */
export function tenTuDo(id: string): string {
  return laTuDo(id) ? id.slice(TU_DO_PREFIX.length) : id;
}

export function danhDauTuDo(name: string): string {
  return `${TU_DO_PREFIX}${name}`;
}
