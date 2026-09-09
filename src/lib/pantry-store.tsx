"use client";

import * as React from "react";
import { capitalize, slugify } from "@/lib/text";

const STORAGE_KEY = "tlrm.pantry.v1";
const CUSTOM_KEY = "tlrm.custom.v1";

/** Nguyên liệu người dùng tự điền, không có trong danh mục gốc */
export type CustomIngredient = {
  id: string;
  name: string;
  emoji: string;
};

type Snapshot = {
  items: string[];
  customs: CustomIngredient[];
  hydrated: boolean;
};

const EMPTY: Snapshot = { items: [], customs: [], hydrated: false };

let snapshot: Snapshot = EMPTY;
const listeners = new Set<() => void>();

function publish(next: Snapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage có thể bị chặn - app vẫn chạy được trong phiên
  }
}

function loadOnce() {
  if (snapshot.hydrated) return;
  publish({
    items: read<string[]>(STORAGE_KEY, []),
    customs: read<CustomIngredient[]>(CUSTOM_KEY, []),
    hydrated: true,
  });
}

function writeItems(items: string[], customs = snapshot.customs) {
  const unique = Array.from(new Set(items));
  save(STORAGE_KEY, unique);
  publish({ items: unique, customs, hydrated: true });
}

function writeCustoms(customs: CustomIngredient[], items = snapshot.items) {
  save(CUSTOM_KEY, customs);
  publish({ items, customs, hydrated: true });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  loadOnce();
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Trạng thái "tủ lạnh" dùng chung cho cả app: nguyên liệu trong danh mục
 * và nguyên liệu người dùng tự điền. Lưu ở localStorage.
 */
export function usePantry() {
  const { items, customs, hydrated } = React.useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );

  return React.useMemo(() => {
    const set = new Set(items);
    const customMap = new Map(customs.map((c) => [c.id, c]));

    return {
      items,
      customs,
      set,
      hydrated,
      customMap,
      has: (id: string) => set.has(id),
      add: (...ids: string[]) => writeItems([...items, ...ids]),
      remove: (id: string) => writeItems(items.filter((x) => x !== id)),
      toggle: (id: string) =>
        writeItems(
          items.includes(id) ? items.filter((x) => x !== id) : [...items, id],
        ),
      replaceAll: (ids: string[]) => writeItems(ids),
      clear: () => writeItems([]),

      /**
       * Thêm nguyên liệu người dùng tự gõ (không có trong danh mục).
       * Việc so khớp với danh mục do phía gọi làm, vì danh mục có thể
       * đến từ Supabase chứ không chỉ từ src/data.
       */
      addCustom: (rawName: string): string | null => {
        const name = capitalize(rawName);
        const slug = slugify(name);
        if (!name || !slug) return null;

        const id = `custom-${slug}`;
        const nextCustoms = customMap.has(id)
          ? customs
          : [...customs, { id, name, emoji: "🥘" }];

        save(CUSTOM_KEY, nextCustoms);
        writeItems([...items, id], nextCustoms);
        return id;
      },

      /** Xoá hẳn một nguyên liệu tự điền khỏi danh sách của người dùng */
      removeCustom: (id: string) => {
        const nextCustoms = customs.filter((c) => c.id !== id);
        writeCustoms(
          nextCustoms,
          items.filter((x) => x !== id),
        );
        save(
          STORAGE_KEY,
          items.filter((x) => x !== id),
        );
      },
    };
  }, [items, customs, hydrated]);
}
