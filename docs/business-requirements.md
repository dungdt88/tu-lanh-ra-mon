# Yêu cầu nghiệp vụ — Tủ Lạnh Ra Món

Tài liệu này ghi lại **hành vi sản phẩm đang có trong code**, kèm lý do đằng sau
mỗi lựa chọn. Nó được viết ngược từ mã nguồn, nên nó mô tả sự thật hiện tại chứ
không phải kế hoạch. Phần chưa làm nằm riêng ở mục 10.

---

## 1. Bài toán và người dùng

**Người dùng đích:** mẹ đi làm văn phòng, tan làm 5h chiều, nấu cho chồng và 2 con.

**Bài toán:** *hôm nay ăn gì*. Không phải thiếu công thức — Internet đầy công
thức. Cái thiếu là một câu trả lời **dùng được đồ đang có trong tủ**, đủ chất,
không lặp món, và nấu xong trong khoảng 30 phút, quyết trong lúc còn đang đứng
trước tủ lạnh.

**Ràng buộc hình thành sản phẩm:**

| Ràng buộc | Hệ quả thiết kế |
| --- | --- |
| Đang đói, đang mệt, còn 1 tay | Mở app là thấy ngay đáp án — 0 chạm |
| Đứng trong bếp, cầm điện thoại | Mobile-first từ 320px, đích chạm to |
| Không muốn khai báo | Chụp ảnh tủ thay cho gõ tay |
| Món Việt thật, không phải công thức Tây | Đơn vị mâm cơm = mặn + canh + rau |

---

## 2. Mô hình miền

### Nguyên liệu (`Ingredient`) — 58 mục trong danh mục gốc

Phân theo 8 nhóm: `thit` (7) · `hai-san` (5) · `rau` (10) · `cu-qua` (16) ·
`trung-sua` (3) · `kho` (9) · `gia-vi` (8) · `khac` (0).

Hai thuộc tính mang tính nghiệp vụ:

- **`staple`** (16 nguyên liệu) — gia vị cơ bản, coi như bếp nào cũng có.
  Chúng tính vào việc "nấu được món này không" nhưng **không** vào danh sách đi
  chợ. Không có nó thì mọi món đều báo thiếu nước mắm, và gợi ý thành vô dụng.
- **`aliases`** — tên gọi khác: "thịt heo" → `thit-ba-chi`, "đậu phụ" → `dau-hu`.
  Người dùng gõ theo cách nhà mình gọi, không theo cách danh mục gọi.

Người dùng tự thêm được nguyên liệu ngoài danh mục; chúng mang id `custom-<slug>`
và sống ở máy người dùng. Chúng **không** làm gợi ý tốt hơn (không món nào tham
chiếu tới), nhưng người dùng vẫn ghi được đúng thứ mình có — đó là một đánh đổi
có chủ đích, ưu tiên cảm giác "app hiểu tủ lạnh của tôi".

### Món (`Dish`) — 28 món trong danh mục gốc

| Trường | Ý nghĩa nghiệp vụ |
| --- | --- |
| `role` | `man` (17) · `canh` (6) · `rau` (5) · `com` (0) — vai trò trong mâm |
| `slots` | bữa nào ăn được: `sang` (7) · `trua` (20) · `toi` (21) |
| `core` | nguyên liệu chính — **thiếu là phải đi chợ** |
| `optional` | có thì ngon hơn, không có vẫn nấu được |
| `minutes` | 5–45 phút |
| `difficulty` | 1 = rất dễ → 3 = cần tay nghề |
| `nutrition` | kcal / đạm / bột đường / béo, cho 1 món |
| `steps` | từng bước, mỗi bước một câu ngắn, **có định lượng và thời gian** |

Tách `core` / `optional` là phân biệt quan trọng nhất trong mô hình. Nó cho phép
trả lời "nấu được ngay" thay vì chỉ "gần đúng", và nó quyết định cái gì vào danh
sách đi chợ.

### Mâm cơm (`MealPlan`)

Một mâm = **1 món mặn + 1 canh + 1 rau**. Đây là hình dạng bữa cơm Việt, không
phải một lựa chọn tuỳ tiện, và nó là lý do `role` tồn tại.

---

## 3. Máy gợi ý

### Chấm điểm từng món — `matchDish()`

```
điểm = coverage × 100            tỉ lệ nguyên liệu chính đang có
     + fromFridge × 12           thưởng cho đồ người dùng THỰC SỰ có (gia vị không tính)
     + (thiếu 0 ? 25 : 0)        thưởng lớn cho món nấu được ngay
     + bonus × 4                 nguyên liệu phụ đang có
     − thiếu × 18                phạt theo số thứ phải đi mua
     − minutes × 0.4             nhanh hơn thì hơn
     − (difficulty − 1) × 5      dễ hơn thì hơn
```

Thứ tự ưu tiên đọc ra từ trọng số: **dùng đúng đồ đang có > nấu được ngay > ít
thiếu > nhanh > dễ**.

`fromFridge` cố tình chỉ đếm nguyên liệu người dùng thực sự bỏ vào tủ, không đếm
`staple`. Nếu đếm cả gia vị, mọi món đều được thưởng như nhau và phần thưởng mất
ý nghĩa phân biệt.

### Dựng mâm — `buildMealPlans()`

- Xếp hạng riêng từng vai trò, rồi lấy món cao điểm nhất chưa dùng của mỗi vai.
- `used` theo dõi món đã dùng nên **các mâm không trùng món nhau** — mục đích là
  đưa ra phương án thật sự khác, không phải hoán vị.
- Hết món chưa dùng cho một vai bất kỳ → dừng.
- Thời gian mâm: `món lâu nhất + một nửa tổng các món còn lại`. Người ta nấu song
  song, không nấu tuần tự — cộng thẳng sẽ ra con số làm nản lòng và sai.
- **Mâm đầu tiên luôn được giữ lại kể cả khi quá `maxMinutes`.** Thà đưa một mâm
  hơi lâu còn hơn màn hình trống.

### Hệ quả về dữ liệu — cần biết

Số mâm dựng được bị chặn bởi vai trò hiếm nhất:

| Bữa | mặn | canh | rau | Số mâm tối đa |
| --- | --- | --- | --- | --- |
| Sáng | 7 | 0 | 0 | **0** |
| Trưa | 10 | 6 | 4 | **4** |
| Tối | 10 | 6 | 5 | **5** |

Trang chủ xin 5 mâm nhưng bữa trưa chỉ dựng được 4 — không phải lỗi, chỉ là hết
món `rau` ăn trưa. **Muốn thêm phương án thì thêm món `canh` và `rau`, thêm món
mặn không giúp gì.**

---

## 4. Trợ lý AI và rào chắn

Hai chỗ dùng Gemini: đọc ảnh tủ lạnh (`/api/recognize`) và trợ lý bếp (`/api/chat`).

### Quy tắc bất khả xâm phạm

> **Mọi id nguyên liệu và id món do AI trả về đều phải đối chiếu lại với danh mục
> thật ở phía server trước khi dùng.**

Lý do nêu thẳng trong code: *"app nấu ăn mà để AI bịa nguyên liệu thì người dị
ứng có thể bị bỏ sót."* Đây là yêu cầu an toàn, không phải yêu cầu chất lượng.

Cách thi hành:

- Prompt hệ thống kèm **toàn bộ danh mục** dưới dạng `id = tên`, và cấm bịa id.
- Gemini bị ép theo `response_schema` với `response_mime_type: application/json`.
- Server vẫn lọc lại lần nữa bằng `keepKnown()`: id không có trong danh mục bị
  loại và gom vào mảng `dropped` trả về cho UI.
- `core` rỗng sau khi lọc → **không nhận bản chỉnh**. AI bỏ sạch nguyên liệu
  chính là vô lý.
- Ràng buộc thêm: tối đa 4 món được chọn, tối đa 15 bước, tối đa 8 ghi chú, thời
  gian nấu chặn ở 360 phút, mỗi ghi chú ≤ 300 ký tự.

Chọn tin prompt **và** lọc lại ở server là cố ý thừa: prompt giảm tần suất lỗi,
lọc server đảm bảo lỗi không bao giờ tới được người dùng.

### Hai phạm vi trò chuyện

| Phạm vi | Người dùng làm gì | Hệ thống lưu gì |
| --- | --- | --- |
| `dish` | chỉnh một món đang xem ("nhà mình không ăn được tôm") | `DishOverride` — **chỉ phần khác món gốc** |
| `meal` | nói ràng buộc lâu dài của cả nhà | `HouseholdPrefs` = `avoid[]` + `notes[]` |

`DishOverride` cố tình chỉ lưu phần sai khác, để khi món gốc được cập nhật thì
phần người dùng không chỉnh vẫn theo kịp bản mới.

`HouseholdPrefs.avoid` chứa **id đã đối chiếu danh mục**, còn `notes` là câu
tiếng Việt tự do cho thứ không quy về nguyên liệu được ("thứ 2 ăn chay", "nhà có
bé 2 tuổi"). Tách hai loại vì chỉ loại thứ nhất mới lọc máy móc được.

`filterByAvoid()` **chỉ xét `core`**: thiếu nguyên liệu phụ thì vẫn nấu được nên
không loại cả món.

### Không bao giờ chặn người dùng vì AI

Chưa có key, hoặc Gemini lỗi, hoặc quá 30 giây → trả **bản mô phỏng**, không trả
lỗi. Mọi response mang `source: "gemini" | "mock"` để UI nói rõ, và lời nhắn mô
phỏng nêu đúng lý do ("Chưa cấu hình Vertex AI..." khác với "Trợ lý đang bận...").

Hệ quả: **app chạy đủ tính năng với `.env.local` để trống**. Không Supabase thì
đọc danh mục mock; không Gemini thì nhận diện và chat chạy bản mô phỏng.

---

## 5. Luồng chính

### Mở app — 0 chạm

Suy ra bữa theo giờ máy: trước 10h → sáng, trước 14h → trưa, còn lại → tối. Hiện
ngay mâm gợi ý. Người dùng không phải khai gì trước.

Giờ chỉ đọc được ở client nên trước khi `mounted` app mặc định **bữa trưa** — đây
là cách tránh lệch nội dung lúc hydrate, không phải mặc định nghiệp vụ.

### Bữa sáng đi đường riêng

Bữa sáng **không dựng mâm** mặn + canh + rau — không ai ăn canh lúc 7h sáng. Thay
vào đó gợi ý thẳng món đơn: bánh mì trứng ốp la, mì gói thả trứng, cháo thịt băm,
cơm rang trứng, miến xào trứng, yến mạch sữa, ngũ cốc sữa.

Món sáng thường chỉ 1–2 nguyên liệu nên ngưỡng thiếu nới rộng: cho phép thiếu tối
đa **2** nguyên liệu chính (bữa khác là 1), nếu không danh sách gợi ý sẽ trống.

### Quét tủ

Chạm nút quét → chọn hoặc chụp ảnh → Gemini đọc ảnh → danh sách nguyên liệu kèm
độ tin cậy, xếp theo độ tin cậy giảm dần → chạm "Xem mâm cơm" là về thẳng trang
chủ và cuộn tới mâm vừa cập nhật.

Trên máy tính thì mở hộp chọn file, trên iPhone/iPad mở thẳng camera.

Thứ Gemini thấy mà danh mục không có **không bị vứt đi** — giữ lại thành nguyên
liệu tự thêm (`custom-<slug>`, emoji mặc định 🥘).

### Điền nguyên liệu bằng tay

Gõ không dấu cũng được. Tên gọi khác ("đậu phụ", "thịt heo") được ánh xạ về đúng
nguyên liệu trong danh mục nhờ `aliases`, nên máy gợi ý vẫn hiểu. Thứ hoàn toàn
mới lưu thành nguyên liệu riêng của người dùng.

### Xem và chỉnh món

Trang chi tiết: nguyên liệu, các bước có định lượng và thời gian, dinh dưỡng, mẹo.
Từ đây mở được trợ lý để chỉnh món cho hợp nhà mình.

---

## 6. Nguyên tắc UX

Ghi lại để lần sau khỏi tranh luận:

1. **Mở app là có đáp án** — 0 chạm.
2. **Hàng chip nguyên liệu ngay trang chủ** — 1 chạm là gợi ý đổi theo.
3. **"Đổi mâm khác" xoay vòng tại chỗ**, không rời trang.
4. **Mâm khác và món lẻ nằm sau nút "Xem thêm"** để màn đầu không dài.
5. **Gõ không dấu vẫn ra đúng** — không bắt người dùng gõ chuẩn.
6. **Không bao giờ hiện màn lỗi vì AI** — lùi về bản mô phỏng và nói thật.

---

## 7. Dữ liệu và quyền riêng tư

Hiện tại **chưa có đăng nhập**. Tủ lạnh, bản chỉnh món và tuỳ chọn của cả nhà đều
nằm ở `localStorage` trên máy người dùng:

| Khoá | Nội dung |
| --- | --- |
| `tlrm.pantry.v1` | id nguyên liệu đang có |
| `tlrm.custom.v1` | nguyên liệu người dùng tự thêm |
| `tlrm.overrides.v1` | bản chỉnh món do trợ lý đề xuất, người dùng đã nhận |
| `tlrm.prefs.v1` | tuỳ chọn của cả nhà: `avoid[]` + `notes[]` |
| `tlrm.threads.v1` | lịch sử trò chuyện với trợ lý |

Hệ quả: đổi máy là mất, và không đồng bộ giữa điện thoại với máy tính. Đổi lại,
không có tài khoản nào để tạo và không dữ liệu cá nhân nào rời khỏi máy.

Ảnh tủ lạnh **không được lưu** — gửi thẳng cho Gemini rồi bỏ.

Schema DB đã sẵn sàng cho bước đồng bộ (`profiles`, `pantry_items`, `cook_logs`),
đã bật RLS với policy `auth.uid() = user_id`, nhưng app chưa dùng tới.

---

## 8. Yêu cầu phi chức năng

| Yêu cầu | Cách thi hành |
| --- | --- |
| Chạy tốt từ màn 320px | breakpoint `xs` 400px, `truncate` mọi chữ dài |
| Tôn trọng safe-area iPhone | `viewportFit: cover` + `env(safe-area-inset-bottom)` |
| Sáng/tối theo cài đặt máy | `next-themes`, hai bảng màu OKLCH riêng |
| Tôn trọng giảm chuyển động | splash bỏ video khi `prefers-reduced-motion` |
| Mở nhanh, không phụ thuộc mạng ngoài | font self-host, không CDN |
| Chạy được khi chưa cấu hình gì | mock cho cả Supabase lẫn Gemini |
| Gọi AI không treo | `AbortSignal.timeout(30_000)` |

---

## 9. Mô hình dữ liệu trên Supabase

Tất cả nằm trong schema **`tlrm`** (không phải `public`), để dùng chung một
project Supabase với dự án khác mà không lẫn tên bảng. Cách dựng: `docs/supabase-setup.md`.

| Bảng | Nội dung | Ai đọc được |
| --- | --- | --- |
| `tlrm.ingredients` | danh mục nguyên liệu | ai cũng đọc, chỉ `service_role` ghi |
| `tlrm.dishes` | danh mục món | như trên |
| `tlrm.dish_ingredients` | nối món ↔ nguyên liệu, cờ `required` | như trên |
| `tlrm.profiles` | tên hiển thị, số người trong nhà (1–20) | chỉ chính chủ |
| `tlrm.pantry_items` | tủ lạnh của từng người | chỉ chính chủ |
| `tlrm.cook_logs` | lịch sử món đã nấu | chỉ chính chủ |

`tlrm.dish_ingredients.required` chính là ranh giới `core` / `optional` ở tầng DB.

`tlrm.pantry_items.ingredient_id` **không có khoá ngoại** — để chứa được id
`custom-<slug>` do người dùng tự thêm. Đây là chủ ý, đừng "sửa".

Profile được tạo tự động khi có người đăng ký, qua trigger `on_auth_user_created`.

---

## 10. Chưa làm (roadmap)

Theo thứ tự trong README:

1. **Đăng nhập Supabase + đồng bộ tủ lạnh lên `tlrm.pantry_items`** — bảng đã có sẵn,
   RLS đã bật. Đây là việc chặn mọi thứ phía sau.
2. **Ghi `cook_logs` khi nấu xong** để tránh lặp món trong tuần, tiến tới kế
   hoạch cả tuần. Bảng đã có, kể cả index `(user_id, cooked_on desc)`.
3. **Danh sách đi chợ gộp theo mâm đã chọn** — `shoppingList()` đã viết xong
   trong `suggest.ts`, chưa có màn hình dùng nó.
4. **Tài khoản người dùng, đồng bộ nhiều thiết bị.**

Nợ dữ liệu đáng chú ý, ảnh hưởng trực tiếp tới chất lượng gợi ý:

- **Thiếu món `canh` và `rau` ăn trưa** — chỉ 4 món `rau`, chặn số mâm trưa ở 4.
- **`role: "com"` khai trong kiểu nhưng chưa món nào dùng.**
- **Nhóm `khac` chưa có nguyên liệu nào.**
- **Màu biểu đồ `--chart-1..5` đã khai nhưng chưa dùng** — sẽ cần khi làm màn
  dinh dưỡng.
