"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { adminRequest, AdminApiError, getErrorMessage } from "@/components/admin/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("admin@lumora.ru");
  const [password, setPassword] = useState("Lumora2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Введите корректный email";
    if (password.length < 8) nextErrors.password = "Пароль должен содержать минимум 8 символов";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await adminRequest<{ id: string; name: string; email: string }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      toast({ tone: "success", title: "Добро пожаловать в Lumora" });
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      if (error instanceof AdminApiError && error.fieldErrors) {
        setErrors(
          Object.fromEntries(
            Object.entries(error.fieldErrors).map(([key, value]) => [key, value[0]]),
          ),
        );
      }
      toast({
        tone: "error",
        title: "Не удалось войти",
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-accent-700 via-accent-600 to-indigo-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20 surface-grid" aria-hidden />
        <Link href="/" className="relative flex w-fit items-center gap-3 rounded-2xl focus-visible:outline-white">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Sparkles className="size-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">Lumora</span>
        </Link>
        <div className="relative max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-100">Мини-CRM</p>
          <h1 className="mt-5 text-5xl font-bold leading-[1.08] tracking-tight text-balance">
            Рабочий день под контролем
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-indigo-100">
            Управляйте записями, расписанием команды и услугами в одном спокойном пространстве.
          </p>
        </div>
        <p className="relative text-sm text-indigo-100">Защищённая панель администратора</p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-muted hover:text-ink lg:hidden"
          >
            <ArrowLeft className="size-4" /> На главную
          </Link>
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-11 place-items-center rounded-2xl bg-accent-600 text-white">
              <Sparkles className="size-5" />
            </span>
            <span className="text-xl font-extrabold">Lumora</span>
          </div>
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent-50 text-accent-600">
              <LockKeyhole className="size-5" aria-hidden />
            </span>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-ink">Вход для администратора</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Используйте данные демо-аккаунта или свои учётные данные.
            </p>

            <form className="mt-7 space-y-5" onSubmit={submit} noValidate>
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Email
                <span className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    className="pl-10"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "login-email-error" : undefined}
                  />
                </span>
                {errors.email ? <span id="login-email-error" className="text-xs text-danger">{errors.email}</span> : null}
              </label>

              <label className="grid gap-2 text-sm font-semibold text-ink">
                Пароль
                <span className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="pl-10 pr-11"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "login-password-error" : undefined}
                  />
                  <button
                    type="button"
                    className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-slate-100"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </span>
                {errors.password ? <span id="login-password-error" className="text-xs text-danger">{errors.password}</span> : null}
              </label>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Войти в панель
              </Button>
            </form>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-ink">Демо-доступ</p>
              <p className="mt-1 text-muted">admin@lumora.ru · Lumora2026!</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
