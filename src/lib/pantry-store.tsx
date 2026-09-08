"use client";

import * as React from "react";

const STORAGE_KEY = "tlrm.pantry.v1";

type Snapshot = { items: string[]; hydrated: boolean };

const EMPTY: Snapshot = { items: [], hydrated: false };

let snapshot: Snapshot = EMPTY;
const listeners = new Set<() => void>();

function publish(next: Snapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function loadOnce() {
  if (snapshot.hydrated) return;
  let items: string[] = [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) items = JSON.parse(raw) as string[];
  } catch {
    // localStorage có thể bị chặn - vẫn chạy được với tủ lạnh rỗng
  }
  publish({ items, hydrated: true });
}

function write(items: string[]) {
  const unique = Array.from(new Set(items));
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  } catch {
    // bỏ qua
  }
  publish({ items: unique, hydrated: true });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  loadOnce();
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Trạng thái "tủ lạnh" dùng chung cho cả app.
 * Lưu ở localStorage; sau này thay bằng API/DB chỉ cần sửa file này.
 */
export function usePantry() {
  const { items, hydrated } = React.useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );

  return React.useMemo(() => {
    const set = new Set(items);
    return {
      items,
      set,
      hydrated,
      has: (id: string) => set.has(id),
      add: (...ids: string[]) => write([...items, ...ids]),
      remove: (id: string) => write(items.filter((x) => x !== id)),
      toggle: (id: string) =>
        write(
          items.includes(id) ? items.filter((x) => x !== id) : [...items, id],
        ),
      replaceAll: (ids: string[]) => write(ids),
      clear: () => write([]),
    };
  }, [items, hydrated]);
}
