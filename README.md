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

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (new-york), font Be Vietnam Pro self-host qua Fontsource
- Dữ liệu mock trong repo (chưa gắn DB), state tủ lạnh lưu ở `localStorage`

## Cấu trúc

```
src/
  app/
    page.tsx              Trang chủ: tủ lạnh hiện có + gợi ý nhanh
    quet/                 Chụp/chọn ảnh tủ lạnh -> nhận diện nguyên liệu
    tu-lanh/              Quản lý nguyên liệu đang có
    goi-y/                Mâm cơm gợi ý theo bữa trưa/tối + món lẻ
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
