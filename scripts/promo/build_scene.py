#!/usr/bin/env python3
"""Ghép font + logo + kịch bản vào scene_template.html -> scene.html.

Mọi chuyển động nằm trong window.setT(t) để renderer tua tới giây t bất kỳ,
không phụ thuộc đồng hồ thật (giống cách làm video intro).
"""
import base64
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent.parent  # gốc repo khi script nằm ở scripts/promo/

# Kịch bản 90 giây. t0/t1 tính bằng giây.
TIMELINE = [
    {
        "t0": 0, "t1": 8, "layout": "full", "full": "open",
    },
    {
        "t0": 8, "t1": 20, "layout": "split", "screen": "home",
        "kicker": "5 giờ chiều",
        "title": "Tan làm, mở tủ lạnh<br />rồi <em>đứng hình</em>",
        "bullets": [
            "Đồ ăn thì có, món thì không nghĩ ra",
            "Nghĩ mãi rồi lại quay về mấy món cũ",
            "Ghé chợ thêm lần nữa là hết buổi tối",
        ],
    },
    {
        "t0": 20, "t1": 30, "layout": "split", "screen": "scan",
        "kicker": "Bước 1",
        "title": "Chụp một tấm<br />ảnh tủ lạnh",
        "sub": "App đọc ra những thứ đang có. Không phải gõ, không phải nhớ.",
    },
    {
        "t0": 30, "t1": 40, "layout": "split", "screen": "det",
        "kicker": "Bước 2",
        "title": "Xem lại 10 giây",
        "sub": "Thiếu thì thêm, thừa thì bỏ chọn. Người chốt là bạn, không phải cái máy.",
    },
    {
        "t0": 40, "t1": 52, "layout": "split", "screen": "plan",
        "kicker": "Bước 3",
        "title": "Ra nguyên <em>mâm cơm</em>",
        "sub": "Mặn + canh + rau, kèm tổng thời gian nấu và thứ cần ghé chợ mua.",
    },
    {
        "t0": 52, "t1": 58, "layout": "split", "screen": "plan2",
        "kicker": "Chưa ưng?",
        "title": "Đổi mâm khác<br />trong một chạm",
        "sub": "Mỗi lần một mâm mới, không lặp lại món vừa ăn hôm qua.",
    },
    {
        "t0": 58, "t1": 70, "layout": "split", "screen": "chat",
        "kicker": "Nhà nào kiểu nấy",
        "title": "Nói một câu,<br />món chỉnh theo nhà mình",
        "sub": "Bé không ăn cay, ông bà kiêng mặn — nói là app ghi nhớ cho lần sau.",
        "note": "Trợ lý chỉ đề xuất — bạn bấm duyệt thì món mới đổi",
    },
    {
        "t0": 70, "t1": 80, "layout": "split", "screen": "home",
        "kicker": "Không có ảnh cũng được",
        "title": "Chạm nguyên liệu,<br />gợi ý đổi ngay",
        "sub": "Mở app là thấy mâm cơm hôm nay, không phải bấm thêm bước nào.",
    },
    {
        "t0": 80, "t1": 90, "layout": "full", "full": "close",
    },
]

FONT_DIR = ROOT / "node_modules/@fontsource/be-vietnam-pro/files"
LOGO = ROOT / "public/logo.svg"

FONTS = [
    ("be-vietnam-pro-vietnamese-400-normal.woff2", 400),
    ("be-vietnam-pro-vietnamese-600-normal.woff2", 600),
    ("be-vietnam-pro-vietnamese-700-normal.woff2", 700),
]


def font_css(assets: pathlib.Path) -> str:
    out = []
    for name, weight in FONTS:
        p = assets / name
        if not p.exists():
            p = FONT_DIR / name
        if not p.exists():
            print(f"thiếu font {p}", file=sys.stderr)
            continue
        b64 = base64.b64encode(p.read_bytes()).decode()
        out.append(
            "@font-face{font-family:'Be Vietnam Pro';font-style:normal;"
            f"font-weight:{weight};font-display:block;"
            f"src:url(data:font/woff2;base64,{b64}) format('woff2');}}"
        )
    return "".join(out)


def logo_svg(assets: pathlib.Path) -> str:
    """Lấy nguyên khối <svg> trong logo.svg để nhúng thẳng vào trang."""
    src = assets / "logo.svg"
    if not src.exists():
        src = LOGO
    raw = src.read_text()
    m = re.search(r"<svg.*?</svg>", raw, re.S)
    svg = m.group(0) if m else raw
    # Ép chiều rộng theo khung chứa, bỏ width/height cứng
    svg = re.sub(r'\s(width|height)="[^"]*"', "", svg, count=2)
    return svg.replace("<svg", '<svg style="width:100%;height:auto"', 1)


def main() -> None:
    # Mặc định lấy thẳng logo + font trong repo, không nhân bản asset
    assets = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "assets"
    tpl = (HERE / "scene_template.html").read_text()
    html = (
        tpl.replace("/*FONTS*/", font_css(assets))
        .replace("/*LOGO*/", logo_svg(assets))
        .replace("/*TIMELINE*/", json.dumps(TIMELINE, ensure_ascii=False))
    )
    out = HERE / "scene.html"
    out.write_text(html)
    print(f"đã ghi {out} ({len(html)//1024} KB), dài {TIMELINE[-1]['t1']} giây")


if __name__ == "__main__":
    main()
