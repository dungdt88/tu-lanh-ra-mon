"use client";

import * as React from "react";

/**
 * Màn mở đầu: phát video intro (public/intro.webm|mp4) rồi tự mờ đi.
 *
 * Render cả ở server nên nó che trang chủ ngay từ khung hình đầu tiên,
 * không chờ JS hydrate - nếu để JS bật lên thì sẽ thấy nháy trang chủ
 * một cái rồi splash mới đè lên.
 */

/** Video dài 2.0s; chặn cứng ở 3s để mạng chậm hay video hỏng vẫn thoát được */
const HARD_CAP_MS = 3000;
/** Máy bật "giảm chuyển động": không phát video, chỉ cho xem poster một nhịp */
const REDUCED_MS = 700;
const FADE_MS = 320;

type Phase = "playing" | "fading" | "done";

export function Splash() {
  const [phase, setPhase] = React.useState<Phase>("playing");

  const dismiss = React.useCallback(() => {
    setPhase((p) => (p === "playing" ? "fading" : p));
  }, []);

  // Hết giờ thì thoát, kể cả khi video không chạy được
  React.useEffect(() => {
    if (phase !== "playing") return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const id = window.setTimeout(dismiss, reduced ? REDUCED_MS : HARD_CAP_MS);
    return () => window.clearTimeout(id);
  }, [phase, dismiss]);

  React.useEffect(() => {
    if (phase !== "fading") return;
    const id = window.setTimeout(() => setPhase("done"), FADE_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Khoá cuộn trang trong lúc splash còn che
  React.useEffect(() => {
    if (phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className="tlrm-splash"
      data-fading={phase === "fading" ? "" : undefined}
      onClick={dismiss}
      role="presentation"
    >
      <div className="tlrm-splash-stack">
        {/* Nằm dưới video: mạng chậm hoặc máy bật giảm chuyển động thì
            khách vẫn thấy trọn logo thay vì màn trống */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/intro-poster.jpg" alt="Tủ Lạnh Ra Món" />
        <video
          autoPlay
          muted
          playsInline
          preload="auto"
          poster="/intro-poster.jpg"
          onEnded={dismiss}
        >
          <source src="/intro.webm" type="video/webm" />
          <source src="/intro.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
