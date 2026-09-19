# Video giới thiệu cho YouTube

Dựng video 90 giây, 1920×1080, không tiếng — giao diện app được **dựng lại bằng
HTML/CSS** chứ không phải quay màn hình app thật. Đổi chữ hay nhịp thì sửa
`TIMELINE` trong `build_scene.py`, đổi giao diện thì sửa `scene_template.html`.

## Chạy

```bash
pip install playwright pillow numpy && playwright install chromium   # lần đầu
npm run promo:build      # ghép font + logo + kịch bản -> scene.html
npm run promo:render     # chụp từng khung -> tu-lanh-ra-mon-gioi-thieu.mp4
```

Xem nhanh vài mốc giây mà không render cả video:

```bash
python3 scripts/promo/render.py --stills 4,27,45,67,86
```

## Vài điểm đã cố ý làm

- **Không dùng CSS animation.** Renderer phải tua tới giây `t` bất kỳ nên mọi
  chuyển động nằm trong `window.setT(t)`, giống cách làm video intro 2 giây.
  Thêm hiệu ứng mới thì viết vào `setT`, đừng dùng `@keyframes`.
- **Khung hình đẩy thẳng sang ffmpeg qua stdin**, không ghi 2250 file PNG ra đĩa.
- Font Be Vietnam Pro và `logo.svg` lấy thẳng từ repo (`node_modules/@fontsource`
  và `public/`) rồi nhúng base64 vào `scene.html`, nên file scene tự chạy được
  offline, mở bằng trình duyệt là xem thử được.
- Hai đầu video để nền cam `#feaa03` cho khớp với video intro trong app.
- Nội dung trong video bám dữ liệu thật ở `src/data`: tên món, thời gian nấu,
  nguyên liệu. Sửa món trong `src/data/dishes.ts` thì nhớ soát lại lời thoại.

## Còn nợ

- Chưa có nhạc nền (file chỉ có track âm thanh im lặng để phần mềm dựng nhận ra).
- Cảnh quét tủ đang dùng ảnh tủ lạnh vẽ bằng CSS. Có ảnh tủ lạnh thật thì thay
  vào `#shot` sẽ thuyết phục hơn nhiều.
- Nhận diện ảnh trong video là mô phỏng — đúng với trạng thái app hiện tại
  (chưa cắm `GEMINI_API_KEY`).
