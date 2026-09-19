#!/usr/bin/env python3
"""Dựng video mở đầu từ public/logo.svg.

Tua scene.html theo từng khung hình, chụp, trộn motion blur, rồi để ffmpeg ghép.
Chạy bằng: npm run intro:render
"""
import io
import pathlib
import subprocess
import sys

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
PUBLIC = ROOT / "public"

W, H = 1000, 600
FPS = 60
DUR = 2.0
SUB = 3  # số khung phụ trộn lại cho mượt (motion blur)

sys.path.insert(0, str(HERE))
from build_scene import build  # noqa: E402

scene = HERE / "scene.html"
build(PUBLIC / "logo.svg", scene)

frames = HERE / "frames"
frames.mkdir(exist_ok=True)
for old in frames.glob("*.png"):
    old.unlink()

total = int(DUR * FPS)
print(f"render {total} khung, {SUB} khung phụ mỗi khung")

with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--force-color-profile=srgb", "--disable-lcd-text"])
    pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
    pg.goto(scene.as_uri())
    pg.wait_for_function("window.__ready === true")

    for f in range(total):
        acc = None
        for k in range(SUB):
            t = (f + k / SUB) / FPS
            pg.evaluate("t => window.setT(t)", t)
            buf = pg.screenshot(clip={"x": 0, "y": 0, "width": W, "height": H})
            arr = np.asarray(Image.open(io.BytesIO(buf)).convert("RGB"), dtype=np.float32)
            acc = arr if acc is None else acc + arr
        Image.fromarray((acc / SUB).round().clip(0, 255).astype(np.uint8)).save(
            frames / f"f{f:04d}.png"
        )
        if f % 20 == 0:
            print(f"  {f}/{total}")
    b.close()

print("ghép video...")


def ff(*args):
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args], check=True)


src = str(frames / "f%04d.png")
ff("-framerate", str(FPS), "-i", src,
   "-c:v", "libvpx-vp9", "-crf", "42", "-b:v", "0", "-row-mt", "1",
   "-pix_fmt", "yuv420p", str(PUBLIC / "intro.webm"))
ff("-framerate", str(FPS), "-i", src,
   "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-profile:v", "main",
   "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(PUBLIC / "intro.mp4"))

# Poster = khung cuối: mạng chậm thì khách vẫn thấy trọn logo
Image.open(frames / f"f{total - 1:04d}.png").convert("RGB").save(
    PUBLIC / "intro-poster.jpg", quality=82, optimize=True
)

for name in ("intro.webm", "intro.mp4", "intro-poster.jpg"):
    print(f"  public/{name}: {(PUBLIC / name).stat().st_size / 1024:.0f} KB")
