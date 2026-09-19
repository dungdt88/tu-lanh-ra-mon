# Dựng lại video mở đầu

`public/intro.webm` / `public/intro.mp4` / `public/intro-poster.jpg` được sinh ra
từ `public/logo.svg`, không sửa tay.

## Chạy

Cần Python 3 + ffmpeg, và lần đầu thì cài:

```bash
pip install playwright pillow numpy
python -m playwright install chromium
```

Rồi:

```bash
npm run intro:render
```

## Cách hoạt động

1. `build_scene.py` nhúng `public/logo.svg` vào `scene.html` kèm hàm `setT(t)` —
   đặt toàn bộ khung hình về đúng trạng thái tại giây `t`. Không dùng CSS
   animation vì cần tua chính xác từng khung, không phụ thuộc đồng hồ thật.
2. `render.py` mở `scene.html` bằng Chromium, với mỗi khung hình chụp 3 khung phụ
   rồi trộn lại — đó là chỗ tạo ra vệt mờ chuyển động.
3. ffmpeg ghép thành `.webm` (VP9) + `.mp4` (H.264), và lấy khung cuối làm poster.

## Sửa kịch bản

Mốc thời gian nằm trong `window.setT` ở `build_scene.py`. Các id lấy thẳng từ
`logo.svg`: `#main-badge`, `#refrigerator-character`, `#fridge-open-door`,
`#egg-character`, `#flying-chicken`, `#plate-food`, `#banner-ribbon`.

Lưu ý: phải đo bbox trên phần tử BỌC NGOÀI, không phải trên chính phần tử —
`getBBox()` trả về toạ độ local trước khi transform của chính nó được áp,
lấy nhầm là các nhân vật bay sai chỗ hết.
