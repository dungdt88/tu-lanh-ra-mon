# Cài đặt Supabase

Hướng dẫn dựng database cho Tủ Lạnh Ra Món trong một project Supabase **đã có
sẵn**, dùng schema riêng `tlrm` để không lẫn với dự án khác.

Làm một lần, khoảng 10 phút.

---

## Trước khi bắt đầu: hiểu đúng phạm vi của anon key

> **Schema riêng cho ta sự gọn gàng về tên, KHÔNG cho ta sự cô lập về quyền.**

Một project Supabase chỉ có **một** anon key. Nó là JWT mang claim `role: anon`;
PostgREST đọc claim đó rồi `SET ROLE anon`. Vì vậy key này với tới **mọi schema**
đang được expose mà role `anon` có quyền — kể cả schema của dự án khác.

Đặt bảng vào `tlrm` giúp:

- ✅ Tên bảng không đụng nhau giữa các dự án
- ✅ Xoá/backup/di trú riêng từng dự án
- ✅ Nhìn vào là biết bảng nào của app nào

Nhưng **không** giúp:

- ❌ Key của app này không đọc được schema khác
- ❌ Key của app khác không đọc được `tlrm`

Muốn chặn thật thì xem mục 7. Muốn cô lập hoàn toàn thì phải tách project riêng.

---

## 1. Tạo schema và bảng

Supabase Dashboard → **SQL Editor** → **New query** → dán nguyên nội dung
`supabase/migrations/0001_init.sql` → **Run**.

File này tạo:

| Thứ | Tên |
| --- | --- |
| Schema | `tlrm` |
| Kiểu enum | `tlrm.ingredient_category`, `tlrm.dish_role`, `tlrm.meal_slot` |
| Bảng danh mục | `tlrm.ingredients`, `tlrm.dishes`, `tlrm.dish_ingredients` |
| Bảng người dùng | `tlrm.profiles`, `tlrm.pantry_items`, `tlrm.cook_logs` |
| Trigger | tự cập nhật `updated_at`, tự tạo profile khi đăng ký |
| Quyền | `usage` trên schema + `select`/`insert`/... theo từng nhóm bảng |
| RLS | bật trên cả 6 bảng, kèm policy |

Chạy xong nên thấy `Success. No rows returned`.

File chạy trong **một transaction** (`begin` … `commit`): hỏng ở bất kỳ dòng nào
thì toàn bộ bị huỷ, không để lại schema dựng dở. Thứ tự trong file cũng cố ý —
bật RLS **trước** rồi mới cấp quyền, để nếu có hỏng giữa chừng thì hỏng theo kiểu
đóng, không phải kiểu mở.

**Kiểm tra RLS đã bật đủ 6 bảng:**

```sql
select c.relname as bang,
       c.relrowsecurity as rls_on,
       count(p.polname) as so_policy
from pg_class c
join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'tlrm'
left join pg_policy p on p.polrelid = c.oid
where c.relkind = 'r'
group by 1, 2
order by 1;
```

Cả 6 dòng phải có `rls_on = true` và `so_policy = 1`. Dòng nào `false` là bảng đó
đang mở — dừng lại, đừng làm tiếp.

> **Vì sao phải cấp quyền bằng tay.** Schema `public` được Supabase cấu hình sẵn
> quyền cho `anon` / `authenticated`. Schema tự tạo thì **không**. Thiếu
> `grant usage on schema tlrm` là mọi truy vấn trả về lỗi permission denied hoặc
> 404, dù bảng vẫn nằm đó. Migration đã có sẵn phần này.

## 2. Thêm bữa sáng vào enum

SQL Editor → query mới → dán `supabase/migrations/0002_bua_sang.sql` → **Run**.

Phải chạy **riêng một query**, không gộp chung với bước 1: Postgres không cho
dùng giá trị enum mới ngay trong transaction vừa thêm nó.

## 3. Expose schema `tlrm` cho API

Đây là bước dễ quên nhất, và triệu chứng của nó trông y hệt "chưa tạo bảng".

**Settings → API → Exposed schemas** → thêm `tlrm` vào danh sách (bên cạnh
`public`, `graphql_public`) → **Save**.

PostgREST chỉ phục vụ schema nằm trong danh sách này. Chưa thêm thì mọi
`supabase.from("dishes")` trả 404, dù bảng đã có và quyền đã cấp đủ.

## 4. Đổ dữ liệu danh mục

SQL Editor → query mới → dán nguyên `supabase/seed.sql` → **Run**.

File này do `npm run seed:gen` sinh từ `src/data`, **đừng sửa tay**. Nó đổ 58
nguyên liệu, 28 món và 113 liên kết món ↔ nguyên liệu, và bắt đầu bằng `delete`
nên chạy lại nhiều lần được mà không nhân đôi dữ liệu. Nó không đụng tới bảng
của người dùng.

Sửa danh mục về sau: sửa `src/data/*.ts` → `npm run seed:gen` → chạy lại
`seed.sql`.

## 5. Điền key vào `.env.local`

**Settings → API**, copy 2 giá trị vào `.env.local` ở gốc repo:

| Biến | Lấy ở đâu |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | mục **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | mục **anon public** (dán cả chuỗi `eyJ...`) |

`SUPABASE_SERVICE_ROLE_KEY` chỉ cần nếu muốn `npm run db:check` đọc được cả bảng
cá nhân. Nó **không bao giờ** được để lọt ra client — `.gitignore` đã chặn
`.env.local`, giữ nguyên như vậy.

## 6. Kiểm tra

```bash
npm run db:check
```

Mong đợi:

```
✓ ingredients       58 dòng
✓ dishes            28 dòng
✓ dish_ingredients  113 dòng
✓ profiles          0 dòng
✓ pantry_items      0 dòng
✓ cook_logs         0 dòng

Kết nối Supabase OK.
```

Rồi `npm run dev` và mở app. Danh mục giờ đến từ DB chứ không từ `src/data`.
Không chắc thì tạm đổi tên một món trong `tlrm.dishes` ngay trên Dashboard và
tải lại trang — thấy tên mới là DB đang được dùng thật.

### Gặp lỗi

| Triệu chứng | Nguyên nhân |
| --- | --- |
| Mọi bảng báo 404 / `relation does not exist` | Chưa làm bước 3 (expose schema) |
| `permission denied for schema tlrm` | Bước 1 chạy thiếu phần `grant` |
| `profiles`/`pantry_items`/`cook_logs` báo lỗi, 3 bảng kia OK | Bình thường — RLS chặn khi chưa đăng nhập |
| App vẫn hiện đúng món dù DB trống | Đang rơi về mock; xem log server `[catalog] không đọc được từ Supabase` |
| `invalid input value for enum ... "sang"` | Chưa chạy bước 2 |

App **cố tình không chết** khi Supabase lỗi — nó lùi về dữ liệu mock trong
`src/data` và ghi log. Nên "app chạy bình thường" chưa chứng minh DB hoạt động;
dùng `npm run db:check` để biết chắc.

---

## 7. Vì dùng chung anon key: việc cần làm một lần

Dự án này dùng chung project và chung anon key với dự án khác. Điều đó **chấp
nhận được**, nhưng chỉ khi một điều kiện được giữ đúng ở mọi schema đang expose:

> **Mọi bảng mà `anon` với tới được đều phải bật RLS.**

Lý do: `NEXT_PUBLIC_SUPABASE_ANON_KEY` được nhúng thẳng vào JavaScript gửi xuống
trình duyệt. **Nó là khoá công khai theo thiết kế** — ai mở app cũng copy được
từ DevTools trong 5 giây. Trong mô hình Supabase, thứ bảo vệ dữ liệu không phải
là sự bí mật của key mà là RLS.

Hệ quả khi dùng chung key: ai mở app nấu ăn này cũng cầm được chiếc key đọc tới
schema của dự án khác. Bảng nào bên đó `anon` với tới mà **chưa bật RLS** thì
coi như đã công khai.

### Chạy một lần để kiểm tra

```sql
select
  t.table_schema,
  t.table_name,
  c.relrowsecurity as rls_on,
  string_agg(distinct t.privilege_type, ', ' order by t.privilege_type) as anon_can
from information_schema.role_table_grants t
join pg_class c on c.relname = t.table_name
join pg_namespace n
  on n.oid = c.relnamespace and n.nspname = t.table_schema
where t.grantee = 'anon'
  and t.table_schema not in ('pg_catalog', 'information_schema')
group by 1, 2, 3
order by c.relrowsecurity asc, 1, 2;
```

**Đọc kết quả:** những dòng `rls_on = false` ở trên cùng là thứ đang công khai
thật sự. Với schema `tlrm` thì không sao — 3 bảng danh mục vốn để ai cũng đọc,
3 bảng cá nhân đều đã bật RLS. Nguy hiểm nằm ở dòng của schema **khác**.

Thấy dòng đáng lo thì xử lý theo thứ tự này:

**a. Gỡ schema kia khỏi Exposed schemas.** Nếu dự án đó chỉ chạy server-side qua
connection string, không cần PostgREST, thì gỡ khỏi Settings → API → Exposed
schemas là xong. Không key nào với tới được qua API nữa. Nhanh nhất, không mất gì.

**b. Bật RLS cho bảng đó** kèm policy phù hợp. Đây là cách đúng nếu dự án kia
thật sự dùng anon key.

**c. Thu hồi quyền của `anon` ở schema kia.**

```sql
revoke all on all tables in schema <schema_kia> from anon;
revoke usage on schema <schema_kia> from anon;
```

Chỉ làm khi chắc chắn dự án kia không đọc bằng anon key — nếu có, nó sẽ hỏng ngay.

### Khi nào nên tách project riêng

Gói Pro tính tiền compute theo từng project, nên project thứ hai tốn thêm
~$10/tháng. Chưa cần bỏ tiền lúc này: `tlrm` hiện chỉ chứa danh mục món công
khai, 3 bảng cá nhân còn rỗng vì chưa nối đăng nhập.

Tính lại khi **dữ liệu người dùng thật bắt đầu vào `tlrm.pantry_items`**
(roadmap mục 1). Lúc đó ranh giới giữa hai dự án không còn là chuyện gọn gàng
nữa mà là chuyện dữ liệu của người khác.

---

## 8. Đổi tên schema

Tên schema nằm ở **một chỗ duy nhất**: `DB_SCHEMA` trong `src/lib/supabase/env.ts`.
Client trình duyệt, client server, `generate-seed.ts` và `check-db.ts` đều đọc
từ đó.

Đổi tên thì sửa hằng đó, sửa file trong `supabase/migrations/`, rồi chạy lại
`npm run seed:gen`.

---

## Chưa làm

Đăng nhập chưa được nối (roadmap mục 1). Hiện tại app chỉ **đọc** danh mục từ
Supabase; tủ lạnh, bản chỉnh món và tuỳ chọn cả nhà vẫn nằm ở `localStorage`.

Ba bảng `profiles`, `pantry_items`, `cook_logs` đã dựng sẵn và bật RLS đúng, chờ
bước nối Supabase Auth. Tới lúc đó RLS mới thực sự có việc để làm — bây giờ chưa
ai đăng nhập nên chúng luôn rỗng.
