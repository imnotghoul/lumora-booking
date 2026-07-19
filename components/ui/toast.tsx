"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; title: string; description?: string; tone: ToastTone };
type ToastApi = { toast: (input: Omit<ToastItem, "id">) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((input: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { ...input, id }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-3 sm:left-auto sm:w-[390px]" aria-live="polite">
        {items.map((item) => {
          const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "error" ? CircleAlert : Info;
          return (
            <div key={item.id} className="pointer-events-auto flex w-full animate-fade-up gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft">
              <Icon className={cn("mt-0.5 size-5 shrink-0", item.tone === "success" ? "text-success" : item.tone === "error" ? "text-danger" : "text-accent-600")} aria-hidden />
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.title}</p>{item.description ? <p className="mt-0.5 text-sm text-muted">{item.description}</p> : null}</div>
              <button className="grid size-7 place-items-center rounded-lg text-muted hover:bg-slate-100" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} aria-label="Закрыть уведомление"><X className="size-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
