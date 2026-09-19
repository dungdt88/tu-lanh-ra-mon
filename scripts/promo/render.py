#!/usr/bin/env python3
"""Chụp từng khung hình của scene.html rồi đẩy thẳng sang ffmpeg -> MP4.

Đẩy qua stdin để không phải ghi 2000+ file PNG ra đĩa.
Dùng: python3 render.py [--fps 25] [--out video.mp4] [--frames 0,45,90]
"""
import argparse
import pathlib
import subprocess
import sys

from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
W, H = 1920, 1080


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fps", type=int, default=25)
    ap.add_argument("--dur", type=float, default=90.0)
    ap.add_argument("--out", default=str(HERE / "tu-lanh-ra-mon-gioi-thieu.mp4"))
    ap.add_argument("--scale", type=float, default=1.0, help="0.5 = render nháp cho nhanh")
    ap.add_argument("--stills", default="", help="chỉ chụp vài mốc giây, vd 5,22,45")
    args = ap.parse_args()

    scene = (HERE / "scene.html").resolve()
    if not scene.exists():
        sys.exit("chưa có scene.html — chạy build_scene.py trước")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--force-color-profile=srgb",
                                           "--font-render-hinting=none"])
        page = browser.new_page(viewport={"width": W, "height": H},
                                device_scale_factor=args.scale)
        page.goto(scene.as_uri())
        page.wait_for_function("window.READY === true")
        page.wait_for_timeout(600)  # chờ font vẽ xong

        if args.stills:
            for s in args.stills.split(","):
                t = float(s)
                page.evaluate(f"window.setT({t})")
                p = HERE / f"still-{s.replace('.', '_')}s.png"
                page.screenshot(path=str(p))
                print("đã chụp", p)
            browser.close()
            return

        total = int(args.dur * args.fps)
        ff = subprocess.Popen(
            ["ffmpeg", "-y", "-loglevel", "error",
             "-f", "image2pipe", "-framerate", str(args.fps), "-i", "-",
             "-c:v", "libx264", "-preset", "medium", "-crf", "19",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", args.out],
            stdin=subprocess.PIPE,
        )
        for i in range(total):
            page.evaluate(f"window.setT({i / args.fps})")
            ff.stdin.write(page.screenshot(type="jpeg", quality=95))
            if i % (args.fps * 10) == 0:
                print(f"  {i//args.fps}s/{int(args.dur)}s", flush=True)
        ff.stdin.close()
        ff.wait()
        browser.close()
    print("xong:", args.out)


if __name__ == "__main__":
    main()
