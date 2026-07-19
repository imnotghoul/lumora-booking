"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminPageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6" aria-label="Загрузка данных">
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="rounded-2xl border border-line bg-white p-5">
        <Skeleton className="mb-5 h-6 w-40" />
        <div className="space-y-3">
          {Array.from({ length: rows }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid min-h-[360px] place-items-center rounded-2xl border border-red-100 bg-red-50/40 px-5 py-12 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-danger shadow-sm">
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <h2 className="mt-4 font-bold text-ink">Не удалось загрузить данные</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{message}</p>
        <Button className="mt-5" variant="outline" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden />
          Повторить
        </Button>
      </div>
    </div>
  );
}
