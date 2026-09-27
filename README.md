# Tủ Lạnh Ra Món

Web app gợi ý mâm cơm từ nguyên liệu đang có trong tủ lạnh.
Đối tượng: mẹ đi làm văn phòng, tan làm 5h chiều, nấu cho chồng và 2 con.

Bài toán giải quyết: _hôm nay ăn gì_ — đủ chất, không lặp món, tận dụng đồ sẵn có,
và nấu xong trong khoảng 30 phút.

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build production
npm run lint
npm run dev:lan  # mở cho điện thoại cùng wifi: http://<ip-máy>:3000
```

> Nếu gặp lỗi `Cannot find module '../lightningcss.darwin-arm64.node'` (hoặc lỗi
> native tương tự): `node_modules` đang chứa binary của HĐH khác. Chạy lại
> `rm -rf node_modules .next && npm install` trên chính máy đang dev.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (new-york), font Be Vietnam Pro self-host qua Fontsource
- Nền sáng/tối bằng next-themes (mặc định theo cài đặt máy), nút chuyển ở mọi trang
- Mobile-first: chạy tốt từ 320px, có breakpoint `xs` (400px) cho máy nhỏ,
  tôn trọng safe-area của iPhone; từ `md` trở lên khung rộng hơn và bố cục 2 cột
- Dữ liệu mock trong repo (chưa gắn DB), state tủ lạnh lưu ở `localStorage`

## Điền key (làm 1 lần)

File `.env.local` đã có sẵn ở gốc repo, chỉ cần điền 3 dòng. App chạy được cả khi
để trống: chưa có Supabase thì đọc dữ liệu mock trong `src/data`, chưa có Gemini
thì nhận diện ảnh chạy bản mô phỏng.

| Biến                            | Lấy ở đâu                                             |
| ------------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | supabase.com → project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cùng trang, mục `anon public`                         |
| `GEMINI_API_KEY`                | aistudio.google.com/apikey → Create API key           |

Điền xong nhớ khởi động lại `npm run dev`.

### Supabase

1. Tạo project ở https://supabase.com (Region gần nhất: Singapore).
2. Settings → API, copy `Project URL` và `anon public` key vào `.env.local`.
3. (bỏ qua — xem bảng trên)
4. SQL Editor → New query → dán toàn bộ `supabase/migrations/0001_init.sql` → Run.
5. SQL Editor → chạy tiếp `supabase/migrations/0002_bua_sang.sql` (thêm bữa sáng
   vào enum). Chạy riêng, đừng gộp chung với seed.
6. SQL Editor → New query → dán toàn bộ `supabase/seed.sql` → Run.
   (File seed sinh từ `src/data`, chạy lại bằng `npm run seed:gen` sau khi sửa món.)
7. `npm run db:check` để kiểm tra kết nối và số dòng từng bảng.
8. `npm run dev` — log server sẽ không còn dòng "tạm dùng dữ liệu mock".

### Gemini (nhận diện ảnh tủ lạnh)

Điền `GEMINI_API_KEY` là `/quet` chuyển sang đọc ảnh thật, màn hình sẽ hiện nhãn
"Gemini" thay cho dòng nhắc mô phỏng. Model mặc định `gemini-3.6-flash`, đổi bằng
`GEMINI_MODEL`. Gemini lỗi hoặc hết quota thì API tự lùi về bản mô phỏng và ghi
log, người dùng không thấy màn hình trắng.

Thứ Gemini thấy mà không có trong danh mục được giữ lại thành nguyên liệu tự thêm
(`custom-<slug>`) chứ không bị bỏ đi.

Bảng dữ liệu cá nhân (`profiles`, `pantry_items`, `cook_logs`) đã bật RLS: mỗi
người chỉ đọc/ghi được dữ liệu của chính mình; danh mục món và nguyên liệu thì
ai cũng đọc được nhưng chỉ `service_role` mới ghi.

## Cấu trúc

```
supabase/
  migrations/0001_init.sql        Schema + RLS
  migrations/0003_cong_dong.sql   Bài đăng, thích, bình luận, theo dõi, bucket ảnh
  seed.sql                        Dữ liệu danh mục, sinh từ src/data
scripts/
  generate-seed.ts          npm run seed:gen
  check-db.ts               npm run db:check
src/
  app/
    page.tsx              Trang chủ = mâm cơm hôm nay (mở app là thấy ngay)
    quet/                 Chụp/chọn ảnh tủ lạnh -> nhận diện nguyên liệu
    tu-lanh/              Toàn bộ danh mục nguyên liệu
    mon/[slug]/           Chi tiết món: nguyên liệu, các bước, dinh dưỡng
    cong-dong/            Feed cộng đồng + trang khoe món
    bai/[id]/             Một bài khoe món + bình luận
    bep/[handle]/         Trang bếp của một người
    dang-nhap/, ho-so/    Đăng nhập bằng email, sửa hồ sơ
    auth/callback/        Đích đến của link đăng nhập trong email
    api/recognize/        API nhận diện nguyên liệu (BẢN MOCK)
  components/
    ui/                   shadcn/ui
    dish-card, meal-plan-card, dish-detail, bottom-nav, page-header
  data/
    ingredients.ts        Danh mục nguyên liệu (có cờ `staple` cho gia vị luôn có)
    dishes.ts             Công thức món ăn (mock data)
  lib/
    repo/catalog.ts       Nguồn dữ liệu: Supabase nếu có env, không thì src/data
    catalog-context.tsx   Đưa danh mục xuống các component client
    supabase/             client (browser) + server (SSR cookie) + middleware + kiểu dữ liệu
    repo/feed.ts          Đọc bài đăng, bình luận, hồ sơ bếp
    actions/post.ts       Đăng bài, thích, bình luận, theo dõi (server action)
    auth.ts               Người đang đăng nhập
    og.ts                 Font + màu cho ảnh xem trước khi chia sẻ
    suggest.ts            Chấm điểm món + dựng mâm cơm (mặn + canh + rau)
    pantry-store.ts(x)    Store tủ lạnh (useSyncExternalStore + localStorage)
    types.ts
```

## Nguyên tắc UX: ít chạm nhất có thể

- Mở app là có sẵn gợi ý cho bữa gần nhất: trước 10h là bữa sáng, trước 14h là
  bữa trưa, còn lại là bữa tối — 0 chạm.
- Bữa sáng không dựng mâm mặn + canh + rau mà gợi ý thẳng món đơn (bánh mì trứng,
  cháo, cơm rang, mì gói, miến xào, yến mạch).
- Hàng chip nguyên liệu ngay trên trang chủ: 1 chạm là gợi ý đổi theo.
- "Đổi mâm khác" để xoay vòng phương án, không phải rời trang.
- Quét tủ: chạm nút quét -> chọn ảnh -> "Xem mâm cơm" là về thẳng trang chủ.
- Mâm khác và món lẻ nằm sau nút "Xem thêm" để màn đầu không bị dài.
- Điền nguyên liệu tự do: gõ không dấu cũng được. Trùng tên gọi khác ("đậu phụ",
  "thịt heo") thì map về đúng nguyên liệu trong danh mục để engine gợi ý vẫn hiểu;
  thứ hoàn toàn mới lưu thành nguyên liệu riêng của người dùng (`custom-<slug>`).

## Cách gợi ý hoạt động

`matchDish()` chấm điểm mỗi món theo: tỉ lệ nguyên liệu chính đang có, thưởng khi
không thiếu gì, phạt theo số món phải đi mua, thời gian nấu và độ khó.
`buildMealPlans()` ghép 1 món mặn + 1 canh + 1 rau thành mâm cơm, không lặp món
giữa các mâm, và tính tổng thời gian theo kiểu nấu song song.

## Cộng đồng

Tab **Cộng đồng** là chỗ khoe mâm cơm: ảnh, tên món, nấu hết bao lâu, nguyên
liệu đã dùng. Người khác thích, bình luận, theo dõi bếp nhà mình.

- Bốn cách đăng nhập: Google, Facebook, email + mật khẩu (có đăng ký và quên mật
  khẩu), hoặc link gửi qua email — mở mail ở máy khác thì nhập mã 6 số. Cách bật
  từng cái: `docs/supabase-setup.md` mục 11.
- **Cả phần cộng đồng phải đăng nhập mới xem được**, kể cả chỉ đọc. Khách bấm
  link chia sẻ sẽ vào trang đăng nhập, xong thì rơi đúng vào bài đó. Phần nấu
  nướng (trang chủ, tủ lạnh, quét tủ, trợ lý, chi tiết món) vẫn dùng được không
  cần tài khoản.
- Bài gắn được với món trong danh mục — người đọc bấm một phát là ra công thức.
- Nút chia sẻ dùng bảng chia sẻ sẵn có của điện thoại (Zalo, Messenger, tin
  nhắn). Máy tính thì chép link hoặc đăng thẳng lên Facebook.
- Link bài và link món có ảnh xem trước riêng (`opengraph-image`) — đường dẫn
  ảnh này cố tình không bị chặn đăng nhập, nếu không Zalo/Facebook đi lấy thẻ
  chỉ thấy trang đăng nhập.
- Ảnh được thu nhỏ ngay trên máy trước khi tải lên (cạnh dài 1600px), để mạng
  3G vẫn đăng được.

Bật phần này: chạy `supabase/migrations/0003_cong_dong.sql` và bật đăng nhập
email — xem `docs/supabase-setup.md` mục 9.

## Việc còn lại (roadmap ngắn)

1. Đồng bộ tủ lạnh lên `pantry_items` (đăng nhập đã có, chỉ còn đổi chỗ lưu).
2. Ghi `cook_logs` khi nấu xong để tránh lặp món trong tuần + kế hoạch cả tuần.
3. Danh sách đi chợ gộp theo mâm đã chọn.
4. Feed phân trang (hiện lấy 20 bài mới nhất) và ảnh đại diện cho hồ sơ.
