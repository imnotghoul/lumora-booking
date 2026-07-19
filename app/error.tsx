"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container-page grid min-h-[70vh] place-items-center py-16">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-danger">
          <CircleAlert className="size-6" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">Не удалось загрузить страницу</h1>
        <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
          Произошла непредвиденная ошибка. Попробуйте повторить действие — введённые данные по возможности сохранятся.
        </p>
        <Button className="mt-7" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden />
          Попробовать снова
        </Button>
      </div>
    </main>
  );
}
