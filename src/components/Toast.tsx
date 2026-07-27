"use client";

import { useEffect, useState } from "react";

type Listener = (message: string) => void;
const listeners = new Set<Listener>();

/** Fire-and-forget toast helper — call from anywhere on the client. */
export function toast(message: string) {
  listeners.forEach((l) => l(message));
}

interface ToastItem {
  id: number;
  message: string;
}

let nextId = 0;

/** Mount once near the root (see layout.tsx) to render fired toasts. */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: Listener = (message) => {
      const id = nextId++;
      setItems((prev) => [...prev, { id, message }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }, 3500);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto rounded-lg bg-ink px-4 py-2 text-sm text-paper shadow-lg"
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}
