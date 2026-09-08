# Tủ Lạnh Ra Món

Web app gợi ý mâm cơm từ nguyên liệu đang có trong tủ lạnh.
Đối tượng: mẹ đi làm văn phòng, tan làm 5h chiều, nấu cho chồng và 2 con.

Bài toán giải quyết: *hôm nay ăn gì* — đủ chất, không lặp món, tận dụng đồ sẵn có,
và nấu xong trong khoảng 30 phút.

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build production
npm run lint
```

> Nếu gặp lỗi `Cannot find module '../lightningcss.darwin-arm64.node'` (hoặc lỗi
> native tương tự): `node_modules` đang chứa binary của HĐH khác. Chạy lại
> `rm -rf node_modules .next && npm install` trên chính máy đang dev.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (new-york), font Be Vietnam Pro self-host qua Fontsource
- Dữ liệu mock trong repo (chưa gắn DB), state tủ lạnh lưu ở `localStorage`

## Cấu trúc

```
src/
  app/
    page.tsx              Trang chủ = mâm cơm hôm nay (mở app là thấy ngay)
    quet/                 Chụp/chọn ảnh tủ lạnh -> nhận diện nguyên liệu
    tu-lanh/              Toàn bộ danh mục nguyên liệu
    mon/[slug]/           Chi tiết món: nguyên liệu, các bước, dinh dưỡng
    api/recognize/        API nhận diện nguyên liệu (BẢN MOCK)
  components/
    ui/                   shadcn/ui
    dish-card, meal-plan-card, dish-detail, bottom-nav, page-header
  data/
    ingredients.ts        Danh mục nguyên liệu (có cờ `staple` cho gia vị luôn có)
    dishes.ts             Công thức món ăn (mock data)
  lib/
    suggest.ts            Chấm điểm món + dựng mâm cơm (mặn + canh + rau)
    pantry-store.ts(x)    Store tủ lạnh (useSyncExternalStore + localStorage)
    types.ts
```

## Nguyên tắc UX: ít chạm nhất có thể

- Mở app là có sẵn mâm cơm cho bữa gần nhất (trưa trước 14h, sau đó là tối) — 0 chạm.
- Hàng chip nguyên liệu ngay trên trang chủ: 1 chạm là gợi ý đổi theo.
- "Đổi mâm khác" để xoay vòng phương án, không phải rời trang.
- Quét tủ: chạm nút quét -> chọn ảnh -> "Xem mâm cơm" là về thẳng trang chủ.
- Mâm khác và món lẻ nằm sau nút "Xem thêm" để màn đầu không bị dài.

## Cách gợi ý hoạt động

`matchDish()` chấm điểm mỗi món theo: tỉ lệ nguyên liệu chính đang có, thưởng khi
không thiếu gì, phạt theo số món phải đi mua, thời gian nấu và độ khó.
`buildMealPlans()` ghép 1 món mặn + 1 canh + 1 rau thành mâm cơm, không lặp món
giữa các mâm, và tính tổng thời gian theo kiểu nấu song song.

## Việc còn lại (roadmap ngắn)

1. Thay `src/app/api/recognize/route.ts` bằng vision API thật (giữ nguyên response shape).
2. Chuyển `src/data/*` sang DB (Supabase/Postgres) — UI chỉ gọi `getDishes()/getDishBySlug()`.
3. Lịch sử món đã nấu để tránh lặp trong tuần + kế hoạch cả tuần.
4. Danh sách đi chợ gộp theo mâm đã chọn.
5. Tài khoản người dùng, đồng bộ tủ lạnh nhiều thiết bị.
