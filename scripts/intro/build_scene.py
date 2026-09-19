#!/usr/bin/env python3
"""Ghép logo.svg + kịch bản chuyển động thành scene.html để render từng khung hình.

Không dùng CSS animation: cần tua chính xác tới giây t bất kỳ, không phụ thuộc
đồng hồ thật, nên toàn bộ chuyển động nằm trong hàm window.setT(t).
"""
import pathlib
import sys

ANIM = r"""
<script>
const NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("stage");

// Bọc toàn bộ nội dung vào #cam để rung/zoom cả khung hình
const cam = document.createElementNS(NS, "g");
cam.setAttribute("id", "cam");
const defs = svg.querySelector("defs");
while (svg.childNodes.length) cam.appendChild(svg.childNodes[0]);
svg.appendChild(cam);
if (defs) svg.insertBefore(defs, cam);

// Lớp loé sáng lúc cửa tủ bật mở
const flash = document.createElementNS(NS, "rect");
flash.setAttribute("x", 0); flash.setAttribute("y", 0);
flash.setAttribute("width", 1000); flash.setAttribute("height", 600);
flash.setAttribute("fill", "#ffffff");
flash.setAttribute("opacity", 0);
svg.appendChild(flash);

const IDS = ["main-badge","refrigerator-character","fridge-open-door",
             "egg-character","flying-chicken","plate-food","banner-ribbon"];
const EL = {};
for (const id of IDS) {
  const el = document.getElementById(id);
  if (!el) { console.warn("thiếu id", id); continue; }
  const w = document.createElementNS(NS, "g");
  el.parentNode.insertBefore(w, el);
  w.appendChild(el);
  // Đo bbox trên WRAPPER, không phải trên el: getBBox() của el trả về toạ độ
  // local TRƯỚC khi transform của chính nó được áp -> tâm sai hoàn toàn.
  const b = w.getBBox();
  EL[id] = { el, w, b, cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
}

const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const outCubic = p => 1 - Math.pow(1 - p, 3);
const outBack = (p, k) => { k = k === undefined ? 1.7 : k;
  return 1 + (k + 1) * Math.pow(p - 1, 3) + k * Math.pow(p - 1, 2); };
const outElastic = p => p === 0 ? 0 : p === 1 ? 1
  : Math.pow(2, -9 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI / 3)) + 1;

function xf(w, o) {
  const x = o.x || 0, y = o.y || 0, r = o.r || 0;
  const sx = o.sx === undefined ? (o.s === undefined ? 1 : o.s) : o.sx;
  const sy = o.sy === undefined ? (o.s === undefined ? 1 : o.s) : o.sy;
  const ox = o.ox || 0, oy = o.oy || 0;
  w.setAttribute("transform",
    "translate(" + (ox + x) + " " + (oy + y) + ") rotate(" + r + ") scale(" + sx + " " + sy + ") translate(" + (-ox) + " " + (-oy) + ")");
}

// Tâm khoang tủ - nơi các nhân vật bay ra
const MOUTH_X = 490, MOUTH_Y = 380;

function flyOut(key, t, t0, t1, spin) {
  const e = EL[key]; if (!e) return;
  const k = outBack(seg(t, t0, t1), 1.5);
  xf(e.w, {
    x: (MOUTH_X - e.cx) * (1 - k),
    y: (MOUTH_Y - e.cy) * (1 - k),
    s: 0.18 + 0.82 * k,
    r: spin * (1 - k),
    ox: e.cx, oy: e.cy,
  });
  e.w.setAttribute("opacity", outCubic(seg(t, t0, t0 + 0.10)));
}

window.setT = function (t) {
  // Khung hình: lùi nhẹ rồi ổn định, rung khi cửa bật
  const camP = outCubic(seg(t, 0, 0.55));
  let shake = 0;
  if (t > 0.38 && t < 0.58) shake = 6 * ((0.58 - t) / 0.20) * Math.sin(t * 120);
  xf(cam, { x: shake, y: shake * 0.45, s: 1.07 - 0.07 * camP, ox: 500, oy: 300 });
  svg.style.opacity = outCubic(seg(t, 0, 0.18));

  // Huy hiệu phóng ra
  const b = EL["main-badge"];
  if (b) {
    const p = outBack(seg(t, 0.02, 0.52), 1.9);
    xf(b.w, { s: 0.80 + 0.20 * p, ox: 500, oy: 315 });
    b.w.setAttribute("opacity", outCubic(seg(t, 0.02, 0.24)));
  }

  // Cửa tủ bật mở (giả lập 2D bằng scaleX quanh bản lề trái)
  const d = EL["fridge-open-door"];
  if (d) {
    const p = outBack(seg(t, 0.30, 0.70), 1.3);
    xf(d.w, { sx: 0.05 + 0.95 * p, sy: 1, ox: d.b.x, oy: 0 });
    d.w.setAttribute("opacity", outCubic(seg(t, 0.30, 0.40)));
  }

  // Thân tủ nhún theo lúc cửa bật
  const f = EL["refrigerator-character"];
  if (f) {
    const q = Math.sin(seg(t, 0.34, 0.66) * Math.PI) * 0.055;
    xf(f.w, { sx: 1 + q, sy: 1 - q, ox: 470, oy: 480 });
  }

  // Ba nhân vật bay vọt ra, lệch nhau
  flyOut("egg-character",  t, 0.54, 0.94, -220);
  flyOut("flying-chicken", t, 0.66, 1.04,  260);
  flyOut("plate-food",     t, 0.78, 1.16, -160);

  // Banner thả từ trên xuống
  const r = EL["banner-ribbon"];
  if (r) {
    const p = outElastic(seg(t, 0.84, 1.40));
    xf(r.w, { y: -190 * (1 - p), ox: 500, oy: 120 });
    r.w.setAttribute("opacity", outCubic(seg(t, 0.84, 0.96)));
  }

  // Loé sáng khi cửa bật
  const fl = seg(t, 0.36, 0.54);
  flash.setAttribute("opacity", (fl > 0 && fl < 1 ? Math.sin(fl * Math.PI) : 0) * 0.28);

  window.__t = t;
};

window.setT(0);
window.__ready = true;
</script>
"""


def build(src, out):
    svg = pathlib.Path(src).read_text(encoding="utf-8")
    # Ép kích thước cố định để khung hình không phụ thuộc viewport
    svg = svg.replace('width="100%" height="100%"', 'width="1000" height="600" id="stage"', 1)
    html = (
        '<!doctype html>\n<meta charset="utf-8">\n'
        "<style>html,body{margin:0;padding:0;background:#919191}#stage{display:block}</style>\n"
        f"{svg}\n{ANIM}\n"
    )
    out = pathlib.Path(out)
    out.write_text(html, encoding="utf-8")
    return out


if __name__ == "__main__":
    s = sys.argv[1] if len(sys.argv) > 1 else "../../public/logo.svg"
    o = sys.argv[2] if len(sys.argv) > 2 else "scene.html"
    print("đã ghi", build(s, o))
