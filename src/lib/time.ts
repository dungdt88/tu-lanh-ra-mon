const PHUT = 60_000;
const GIO = 60 * PHUT;
const NGAY = 24 * GIO;

/** "vừa xong", "3 giờ trước", "12/9" - đọc lướt trên feed. */
export function thoiGianTuongDoi(iso: string, now = Date.now()): string {
  const cach = now - new Date(iso).getTime();

  if (cach < PHUT) return "vừa xong";
  if (cach < GIO) return `${Math.floor(cach / PHUT)} phút trước`;
  if (cach < NGAY) return `${Math.floor(cach / GIO)} giờ trước`;
  if (cach < 7 * NGAY) return `${Math.floor(cach / NGAY)} ngày trước`;

  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
