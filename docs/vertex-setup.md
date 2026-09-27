# Cài đặt Vertex AI

Gemini trong app gọi qua **Vertex AI** (Google Cloud), không phải AI Studio.
Hướng dẫn này dựng từ đầu, khoảng 15 phút.

Chưa làm xong thì app **vẫn chạy**: nhận diện ảnh và trợ lý dùng bản mô phỏng,
kiểm duyệt còn lưới lọc từ cấm. Không có gì gấp.

---

## Vertex khác AI Studio ở đâu

| | AI Studio | Vertex AI |
| --- | --- | --- |
| Xác thực | API key trong header `x-goog-api-key` | OAuth bearer token |
| Token | không hết hạn | **hết hạn sau 1 giờ**, phải lấy mới |
| Endpoint | `generativelanguage.googleapis.com` | `{vùng}-aiplatform.googleapis.com`, mang project + location |
| Cần gì | một key | project + billing + bật API + service account có quyền |

Token hết hạn là điểm khác quan trọng nhất về mặt code: `src/lib/vertex.ts` ký
JWT từ file khoá, đổi lấy access token, giữ cache và chỉ lấy mới khi gần hết hạn.
Không cache thì mỗi lượt chat tốn thêm một vòng gọi mạng.

---

## 1. Project và billing

[console.cloud.google.com](https://console.cloud.google.com) → chọn hoặc tạo
project → ghi lại **Project ID**.

> Project ID **không phải** tên hiển thị. Nó thường có hậu tố số, ví dụ
> `tu-lanh-ra-mon-481207`. Điền tên hiển thị vào `.env.local` là lỗi 403 hoặc 404.

Vertex AI cần **bật billing** cho project, kể cả khi đang dùng credit miễn phí.

## 2. Bật Vertex AI API

```bash
gcloud services enable aiplatform.googleapis.com --project=PROJECT_ID
```

Hoặc console: **APIs & Services → Enable APIs and Services** → tìm
"Vertex AI API" → **Enable**.

## 3. Tạo service account

Cấp đúng `roles/aiplatform.user`, **đừng cấp Editor**: khoá này nằm trên máy dev,
lộ ra thì phạm vi thiệt hại bằng đúng quyền đã cấp.

```bash
gcloud iam service-accounts create tu-lanh-ra-mon \
  --display-name="Tu Lanh Ra Mon" --project=PROJECT_ID

gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:tu-lanh-ra-mon@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

Console: **IAM & Admin → Service Accounts → Create**, rồi **IAM → Grant access**
với role **Vertex AI User**.

## 4. Lấy credential

Có hai đường. **Thử ADC trước** — nhiều project không cho tạo khoá service account.

### 4a. ADC (đường đang dùng)

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project PROJECT_ID
```

Credential nằm ở `~/.config/gcloud/application_default_credentials.json`, ngoài
repo, không có gì phải gitignore. Để trống `GOOGLE_APPLICATION_CREDENTIALS` thì
`vertex.ts` tự dùng ADC.

Bước `set-quota-project` hay bị bỏ qua rồi nhận 403 khó hiểu: credential của
người dùng phải được chỉ rõ tính quota vào project nào.

Đổi lại: ADC gắn với tài khoản của bạn, không mang lên server được. Dự án này
chạy ở máy nên không sao.

### 4b. Khoá service account (nếu project cho phép)

```bash
gcloud iam service-accounts keys create ./gcp-key.json \
  --iam-account=tu-lanh-ra-mon@PROJECT_ID.iam.gserviceaccount.com
```

Rồi trỏ `GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json`.

> **Khoá này là bí mật dài hạn.** `.gitignore` đã chặn `gcp-key.json`,
> `*-key.json`, `*-service-account*.json`. Lộ thì thu hồi ngay:
> `gcloud iam service-accounts keys delete KEY_ID --iam-account=...`

**Gặp `FAILED_PRECONDITION: Key creation is not allowed on this service account`**
kèm `constraints/iam.disableServiceAccountKeyCreation`: tổ chức chặn tạo khoá.
Google bật sẵn policy này cho project tự sinh kiểu `gen-lang-client-*` (project
mà AI Studio tạo hộ). Dùng 4a, đừng cố phá policy.

Kiểm tra file khoá có thật không — `keys create` tạo file trước khi ghi nên hỏng
giữa chừng sẽ để lại file **0 byte** trông như thành công:

```bash
ls -l gcp-key.json      # 0 byte = chưa có gì
```

## 5. Điền `.env.local`

```bash
GOOGLE_CLOUD_PROJECT=tu-lanh-ra-mon-481207
# Để trống khi dùng ADC (4a); trỏ tới file khoá khi dùng 4b
GOOGLE_APPLICATION_CREDENTIALS=
```

Hai dòng dưới có mặc định sẵn, để trống cũng được:

```bash
GOOGLE_CLOUD_LOCATION=asia-southeast1   # Singapore, gần Việt Nam nhất
GEMINI_MODEL=gemini-2.5-flash
```

## 6. Kiểm tra

```bash
npm run vertex:check
```

Script này lấy token rồi gọi một lượt `generateContent` thật. Mong đợi:

```
project  tu-lanh-ra-mon-481207
location asia-southeast1
model    gemini-2.5-flash
keyFile  ./gcp-key.json

✓ Vertex trả lời: OK

Vertex AI OK.
```

Nó tách riêng khỏi app **có lý do**: app luôn lùi về bản mô phỏng khi Vertex hỏng,
nên mở app lên nhìn không đoán được lỗi nằm ở đâu.

### Gặp lỗi

| Thông báo | Nguyên nhân |
| --- | --- |
| `Vertex AI API has not been used in project ... before or it is disabled` | Chưa làm bước 2 |
| `Permission 'aiplatform.endpoints.predict' denied` | Service account thiếu `roles/aiplatform.user` |
| `Publisher Model ... not found` | Model không có ở vùng này — đổi `GEMINI_MODEL` hoặc `GOOGLE_CLOUD_LOCATION` |
| `Could not load the default credentials` | Sai đường dẫn `GOOGLE_APPLICATION_CREDENTIALS`, hoặc chưa chạy `gcloud auth application-default login` |
| `FAILED_PRECONDITION: Key creation is not allowed` | Tổ chức chặn tạo khoá — dùng ADC (4a) |
| 403 nhắc `quota project` | Chưa chạy `gcloud auth application-default set-quota-project` |
| `403 ... billing` | Project chưa bật billing |
| `404` mà mọi thứ nhìn đúng | Điền tên hiển thị thay vì Project ID |

## 7. Chạy app

```bash
npm run dev
```

Vào `/quet`, chọn một ảnh tủ lạnh: nhãn đổi từ "mô phỏng" sang "Gemini". Vào
`/tro-ly` hỏi một câu: câu trả lời không còn dòng "Đang chạy bản mẫu".

---

## Model dùng ở đâu

| Nơi | File | Timeout |
| --- | --- | --- |
| Nhận diện ảnh tủ lạnh | `src/lib/gemini.ts` | 30s (ảnh nặng) |
| Trợ lý bếp | `src/lib/gemini-chat.ts` | 30s |
| Kiểm duyệt bài / bình luận / công thức | `src/lib/moderation-core.ts` | 8s |

Cả ba đi qua `goiVertex()` trong `src/lib/vertex.ts` — đổi endpoint, vùng hay
cách lấy token thì sửa một chỗ đó.

`moderation-core.ts` cố tình **không** `import "server-only"` vì
`npm run mod:scan` chạy ở máy cũng dùng nó; nó nhận cấu hình truyền vào chứ
không tự đọc `process.env`. `moderation.ts` là bản bọc server-only đọc env.

## Đổi vùng hoặc model

Model không có ở mọi vùng. Xem model nào đang có:

```bash
gcloud ai models list --region=asia-southeast1 --project=PROJECT_ID
```

Đổi `GOOGLE_CLOUD_LOCATION` rồi chạy lại `npm run vertex:check` trước khi mở app —
sai vùng thì app không báo lỗi, chỉ im lặng lùi về bản mô phỏng.

Dùng `GOOGLE_CLOUD_LOCATION=global` thì endpoint chuyển sang
`aiplatform.googleapis.com` không có tiền tố vùng; `vertex.ts` đã xử lý.

## Chi phí

Vertex tính tiền theo token, không có bậc miễn phí như AI Studio. Với app gia
đình thì rất nhỏ, nhưng có vài chỗ đáng biết:

- **Nhận diện ảnh tốn nhất**: mỗi ảnh tủ lạnh là vài trăm đến vài nghìn token đầu
  vào. `src/lib/image.ts` nén ảnh trước khi gửi, giữ nguyên phần đó.
- **Kiểm duyệt gọi mỗi lần đăng bài / bình luận / công thức**. Lưới lọc từ cấm
  chạy trước nên bắt được sớm thì khỏi tốn một lượt gọi.
- Đặt **budget alert** trong Billing → Budgets & alerts nếu muốn ngủ ngon.

## Test không tốn quota

Ba script test (`test:chat`, `test:mod`, `test:mock`) đều stub `fetch` và đặt
`VERTEX_ACCESS_TOKEN` giả, nên `vertex.ts` không đi ký JWT lấy token thật và
không gọi mạng. Chúng chạy được khi chưa cấu hình gì.
