# Design system — Tủ Lạnh Ra Món

Tài liệu này mô tả hệ thiết kế **đang có thật trong code**, không phải hệ thiết kế
mong muốn. Nguồn sự thật là `src/app/globals.css` và `src/components/ui/`.

Nguyên tắc bao trùm: app dùng trong bếp, một tay, vừa nấu vừa nhìn. Mọi quyết
định thiết kế đều quy về **ít chạm nhất có thể** và **đọc được ở khoảng cách một
cánh tay**.

---

## 1. Nền tảng

| Thứ | Giá trị | Ở đâu |
| --- | --- | --- |
| CSS framework | Tailwind CSS v4 (`@import "tailwindcss"`) | `globals.css` |
| Thư viện component | shadcn/ui, style `new-york`, base color `neutral` | `components.json` |
| Primitive | Radix UI (gói `radix-ui` hợp nhất) | `src/components/ui/` |
| Icon | `lucide-react`, mặc định `size-4`, trong nav `size-5` | khắp nơi |
| Font | Be Vietnam Pro (400/500/600/700), self-host qua Fontsource | `layout.tsx` |
| Animation | `tw-animate-css` | `globals.css` |
| Sáng/tối | `next-themes`, biến thể `dark` gắn vào class `.dark` | `theme-provider.tsx` |

Font được self-host chứ không gọi Google Fonts: app phải mở nhanh trên 3G và
không phụ thuộc mạng ngoài.

---

## 2. Màu

Toàn bộ màu khai báo bằng **OKLCH**, không dùng hex (trừ 2 ngoại lệ ở mục 7).
OKLCH cho phép đổi độ sáng mà giữ nguyên cảm giác màu — đó là lý do bảng tối
không phải bảng sáng đảo ngược.

Mỗi màu là một cặp `--x` / `--x-foreground`: nền và chữ nằm trên nền đó. Khi thêm
màu mới, **luôn thêm đủ cặp**, nếu không sẽ có chỗ chữ chìm vào nền ở một trong
hai chế độ.

### Bảng token ngữ nghĩa

| Token | Sáng | Tối | Dùng để |
| --- | --- | --- | --- |
| `background` / `foreground` | `oklch(0.99 0.008 90)` / `oklch(0.24 0.02 60)` | `oklch(0.19 0.015 60)` / `oklch(0.96 0.01 90)` | nền trang và chữ chính |
| `card` / `card-foreground` | trắng | `oklch(0.23 0.018 60)` | thẻ món, thẻ mâm cơm |
| `popover` / `popover-foreground` | trắng | `oklch(0.23 0.018 60)` | dialog, sheet |
| `primary` / `primary-foreground` | `oklch(0.63 0.17 42)` | `oklch(0.72 0.16 45)` | hành động chính, nhãn thương hiệu, tab đang chọn |
| `secondary` / `secondary-foreground` | `oklch(0.95 0.03 110)` | `oklch(0.29 0.03 120)` | badge phụ, nút phụ |
| `muted` / `muted-foreground` | `oklch(0.96 0.012 85)` | `oklch(0.28 0.015 60)` | nền chìm, chữ phụ |
| `accent` / `accent-foreground` | `oklch(0.93 0.06 140)` | `oklch(0.33 0.05 145)` | trạng thái hover, nhấn nhẹ |
| `destructive` | `oklch(0.58 0.21 27)` | `oklch(0.65 0.19 25)` | xoá, cảnh báo |
| `border` / `input` | `oklch(0.9 0.015 80)` | `oklch(1 0 0 / 12%)` và `/ 16%` | viền và viền ô nhập |
| `ring` | = `primary` | = `primary` | vòng focus |

**Ý đồ màu.** `primary` là cam đất (hue ~42–45) — màu thức ăn chín, màu bếp.
`secondary` và `accent` lệch về xanh lá (hue 110–145) — màu rau. Nền sáng ám vàng
rất nhẹ (hue 90, chroma 0.008) chứ không trắng tinh, để nhìn lâu đỡ chói.

Ở chế độ tối, `border` và `input` chuyển sang **trắng có alpha** thay vì một màu
đặc. Viền do đó luôn ăn theo nền bên dưới, không bị "nổi khối" khi thẻ chồng lên
nhau.

### Màu biểu đồ

`--chart-1` … `--chart-5` đã khai báo đủ cho cả hai chế độ nhưng **chưa nơi nào
dùng**. Chúng đến từ preset shadcn. Giữ lại thì tốt (dinh dưỡng sẽ cần), nhưng
đừng tưởng đó là palette đã được duyệt.

### Quy tắc

- **Không bao giờ viết màu thẳng vào component.** Không `text-orange-500`, không
  `bg-[#feaa03]`. Dùng token; nếu thiếu token thì thêm token.
- Cần một sắc độ khác thì dùng alpha của token: `bg-primary/90`, `ring-ring/50`.
- Thêm token mới phải khai ở **cả `:root` và `.dark`**, rồi ánh xạ trong
  `@theme inline` thì Tailwind mới sinh class.

---

## 3. Chữ

Một họ font duy nhất: `--font-sans` = Be Vietnam Pro. Không có font mono, không
có font hiển thị riêng.

Thang chữ dùng thật trong app, từ nhỏ đến lớn:

| Cỡ | Class | Dùng ở |
| --- | --- | --- |
| 10px | `text-[10px]` | nhãn thương hiệu (uppercase), badge đếm trên nav |
| 11px | `text-[11px]` | nhãn dưới icon ở bottom nav |
| 12px | `text-xs` | phụ đề header, chữ trong badge |
| 13→14px | `text-[13px] xs:text-sm` | nhãn tab chọn bữa |
| 18→20px | `text-lg xs:text-xl` | tiêu đề trang |

Ba cỡ dùng giá trị tuỳ ý (`text-[10px]`, `text-[11px]`, `text-[13px]`) vì thang
mặc định của Tailwind nhảy từ 12 lên 14 — quá thô cho nav 4 ô trên máy 320px.
Đây là lựa chọn có chủ đích, không phải thiếu kỷ luật.

Độ đậm: `font-medium` (500) cho nhãn, `font-semibold` (600) cho tiêu đề mục,
`font-bold` (700) cho tiêu đề trang.

Mọi chữ có thể dài đều phải `truncate` — tên món tiếng Việt dễ tràn ở 320px.

---

## 4. Bo góc và khoảng cách

Bo góc neo vào một biến duy nhất `--radius: 0.85rem` (13.6px):

| Class | Tính ra | Dùng cho |
| --- | --- | --- |
| `rounded-sm` | `--radius - 4px` | chi tiết nhỏ |
| `rounded-md` | `--radius - 2px` | nút, ô nhập |
| `rounded-lg` | `--radius` | thẻ |
| `rounded-xl` | `--radius + 4px` | khối lớn |
| `rounded-full` | — | badge, chip nguyên liệu, tab chọn bữa |

Đổi `--radius` là đổi toàn app cùng lúc — đó là mục đích của nó. Đừng viết
`rounded-[14px]` ở một chỗ riêng.

Khoảng cách: thang mặc định của Tailwind. Nhịp hay gặp là `px-4` cho lề ngang
trang, `gap-2` trong một hàng, `space-y-5` giữa các khối lớn của trang chủ.

---

## 5. Bố cục và mobile-first

```
body (bg-muted/40)
└── div  mx-auto max-w-lg md:max-w-2xl md:border-x   ← khung app
    ├── main  pb-[calc(5.5rem+env(safe-area-inset-bottom))]
    └── BottomNav  fixed bottom-0
```

- **Khung app cố định giữa màn**: `max-w-lg` (32rem) trên điện thoại,
  `md:max-w-2xl` (42rem) từ 768px. Nền ngoài khung là `bg-muted/40` nên trên máy
  tính app trông như một thiết bị đặt giữa trang.
- **Breakpoint `xs` = 400px** là breakpoint tự thêm (`@theme inline`), dành riêng
  cho iPhone SE / Galaxy A cỡ 320–390px. Dùng nó để nới chữ và khoảng cách, chứ
  không để đổi bố cục.
- **Safe area iPhone** xử lý ở hai chỗ, cả hai đều bắt buộc: `viewportFit: "cover"`
  trong `export const viewport`, và `env(safe-area-inset-bottom)` cộng vào padding
  dưới của `main` và của `BottomNav`. Bỏ một trong hai là thanh nav lọt dưới thanh
  gạt home.
- **Header dính** dùng chung một công thức: `sticky top-0 z-30 border-b backdrop-blur`
  với nền `bg-background/95`. Trong suốt một chút để thấy nội dung trôi bên dưới.

### Thang z-index

Bốn tầng, đã đủ dùng, đừng thêm số mới tuỳ tiện:

| z | Thành phần |
| --- | --- |
| 100 | `.tlrm-splash` — màn mở đầu, trên tất cả |
| 40 | `BottomNav` |
| 30 | header dính của từng trang |
| — | nội dung |

---

## 6. Component

### Primitive (`src/components/ui/`) — do shadcn CLI sinh, **không sửa tay**

`avatar` · `badge` · `button` · `card` · `checkbox` · `dialog` · `input` ·
`label` · `progress` · `separator` · `sheet` · `skeleton` · `tabs` · `textarea`

Cần đổi kiểu dáng thì đổi **token màu** hoặc `--radius`, đừng sửa file primitive —
lần chạy `shadcn add` sau sẽ ghi đè.

`Button` có 6 variant (`default` · `destructive` · `outline` · `secondary` ·
`ghost` · `link`) và 8 size, trong đó `xs`, `icon-xs`, `icon-sm`, `icon-lg` là
**bổ sung của repo này** so với shadcn gốc — thêm vào vì màn hình bếp cần nút
nhỏ đặt trong thẻ món. `Badge` có 6 variant cùng tên.

### Component nghiệp vụ (`src/components/`)

| Component | Việc của nó |
| --- | --- |
| `page-header` | header dính có nút quay lại, tiêu đề, phụ đề, slot `action` |
| `bottom-nav` | 4 tab cố định, có badge đếm nguyên liệu trên tab Tủ lạnh |
| `dish-card` | một món trong danh sách |
| `meal-plan-card` | một mâm cơm (mặn + canh + rau) |
| `dish-detail` | trang chi tiết món |
| `quick-pantry` | hàng chip nguyên liệu trên trang chủ |
| `add-ingredient` | ô thêm nguyên liệu tự gõ |
| `scan-uploader` | chọn / chụp ảnh tủ lạnh |
| `chat-panel`, `dish-chat` | giao diện trợ lý |
| `splash` | màn mở đầu có video |
| `theme-toggle`, `theme-provider` | chuyển sáng/tối |

### Quy tắc vùng chạm

- Đích chạm tối thiểu: `min-h-9` (36px) cho nút trong thẻ, `min-h-14` (56px) cho
  ô ở bottom nav. Người dùng đang cầm đũa bằng tay kia.
- Phản hồi khi chạm: `active:scale-95` trên các đích chạm lớn, `transition-colors`
  cho phần còn lại.
- Focus nhìn thấy được: `focus-visible:ring-[3px] focus-visible:ring-ring/50` —
  primitive đã lo, đừng gỡ.

---

## 7. Màn mở đầu (ngoại lệ có chủ đích)

`.tlrm-splash` trong `globals.css` là **CSS viết tay duy nhất** của dự án, và là
chỗ duy nhất dùng màu hex: `#feaa03` (sáng) và `#211f1d` (tối). Hai giá trị này
phải khớp chính xác với `themeColor` trong `layout.tsx`, nếu lệch thì thanh trạng
thái của trình duyệt sẽ nháy màu khác lúc mở app.

Vì sao không dùng Tailwind ở đây: splash chạy trước khi React hydrate, cần là CSS
tĩnh thuần.

Hành vi theo màn hình:

- **< 560px**: video tràn ngang, khung `4/3`, `object-fit: cover` — cắt hai bên
  để huy hiệu đủ to.
- **≥ 560px**: trả về khung gốc `5/3`, bo góc, đổ bóng, thành một tấm thẻ.
- **`prefers-reduced-motion: reduce`**: ẩn hẳn video, chỉ còn poster tĩnh, tắt
  luôn transition. Đây là yêu cầu tiếp cận, không phải tuỳ chọn.

---

## 8. Checklist khi thêm giao diện mới

- [ ] Chỉ dùng token màu, không hex, không màu Tailwind thô.
- [ ] Thử ở 320px trước, rồi mới tới `xs` (400px) và `md` (768px).
- [ ] Chữ có thể dài đã `truncate` chưa?
- [ ] Đích chạm ≥ 36px, ≥ 56px nếu là điều hướng chính.
- [ ] Xem lại ở cả chế độ sáng và tối — bảng tối không tự suy ra từ bảng sáng.
- [ ] Có gì chuyển động thì đã tôn trọng `prefers-reduced-motion` chưa?
- [ ] Bo góc lấy từ thang `--radius`, không phải số tuỳ ý.
- [ ] Không sửa file trong `src/components/ui/`.
