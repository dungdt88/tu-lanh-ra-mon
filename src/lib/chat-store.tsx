"use client";

import * as React from "react";
import type { ChatMessage, DishOverride, HouseholdPrefs } from "@/lib/types";

/**
 * Kết quả làm việc với trợ lý AI: món đã chỉnh, ràng buộc của cả nhà,
 * và lịch sử hội thoại.
 *
 * Đang lưu ở localStorage. Khi nào xong đăng nhập thì chỉ cần đổi read/save
 * bên dưới sang Supabase - phần còn lại của app chỉ chạm vào hook useChatStore.
 */

const OVERRIDES_KEY = "tlrm.overrides.v1";
const PREFS_KEY = "tlrm.prefs.v1";
const THREADS_KEY = "tlrm.threads.v1";

/** "meal" cho trợ lý chung, "dish:<id>" cho từng món */
export type ThreadKey = string;

export const MEAL_THREAD: ThreadKey = "meal";
export const dishThread = (dishId: string): ThreadKey => `dish:${dishId}`;

/** Số tin gửi lên API mỗi lượt - giữ ngữ cảnh mà không phình token */
export const MAX_CONTEXT_MESSAGES = 10;

type Snapshot = {
  overrides: Record<string, DishOverride>;
  prefs: HouseholdPrefs;
  threads: Record<ThreadKey, ChatMessage[]>;
  hydrated: boolean;
};

const EMPTY_PREFS: HouseholdPrefs = { avoid: [], notes: [] };
const EMPTY: Snapshot = {
  overrides: {},
  prefs: EMPTY_PREFS,
  threads: {},
  hydrated: false,
};

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
  const prefs = read<HouseholdPrefs>(PREFS_KEY, EMPTY_PREFS);
  publish({
    overrides: read<Record<string, DishOverride>>(OVERRIDES_KEY, {}),
    prefs: { avoid: prefs.avoid ?? [], notes: prefs.notes ?? [] },
    threads: read<Record<ThreadKey, ChatMessage[]>>(THREADS_KEY, {}),
    hydrated: true,
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  loadOnce();
  return () => {
    listeners.delete(listener);
  };
}

function writeOverrides(overrides: Record<string, DishOverride>) {
  save(OVERRIDES_KEY, overrides);
  publish({ ...snapshot, overrides, hydrated: true });
}

function writePrefs(prefs: HouseholdPrefs) {
  save(PREFS_KEY, prefs);
  publish({ ...snapshot, prefs, hydrated: true });
}

function writeThreads(threads: Record<ThreadKey, ChatMessage[]>) {
  save(THREADS_KEY, threads);
  publish({ ...snapshot, threads, hydrated: true });
}

export function newMessage(
  role: ChatMessage["role"],
  content: string,
): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    at: new Date().toISOString(),
  };
}

export function useChatStore() {
  const { overrides, prefs, threads, hydrated } = React.useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );

  return React.useMemo(
    () => ({
      overrides,
      prefs,
      threads,
      hydrated,

      messagesOf: (key: ThreadKey): ChatMessage[] => threads[key] ?? [],

      // Các hàm ghi đọc snapshot mới nhất chứ không dùng biến của lần render
      // hiện tại, để gọi liên tiếp trong cùng một sự kiện không đè lên nhau.
      appendMessages: (key: ThreadKey, ...items: ChatMessage[]) =>
        writeThreads({
          ...snapshot.threads,
          [key]: [...(snapshot.threads[key] ?? []), ...items],
        }),

      clearThread: (key: ThreadKey) => {
        const next = { ...snapshot.threads };
        delete next[key];
        writeThreads(next);
      },

      setOverride: (override: DishOverride) =>
        writeOverrides({ ...snapshot.overrides, [override.dishId]: override }),

      clearOverride: (dishId: string) => {
        const next = { ...snapshot.overrides };
        delete next[dishId];
        writeOverrides(next);
      },

      /** Gộp thêm ràng buộc mới, không xoá cái đã có */
      mergePrefs: (patch: Partial<HouseholdPrefs>) =>
        writePrefs({
          avoid: Array.from(
            new Set([...snapshot.prefs.avoid, ...(patch.avoid ?? [])]),
          ),
          notes: Array.from(
            new Set([...snapshot.prefs.notes, ...(patch.notes ?? [])]),
          ),
        }),

      removeAvoid: (id: string) =>
        writePrefs({
          ...snapshot.prefs,
          avoid: snapshot.prefs.avoid.filter((x) => x !== id),
        }),

      removeNote: (note: string) =>
        writePrefs({
          ...snapshot.prefs,
          notes: snapshot.prefs.notes.filter((x) => x !== note),
        }),
    }),
    [overrides, prefs, threads, hydrated],
  );
}
