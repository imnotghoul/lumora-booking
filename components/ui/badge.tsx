import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/types";

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "accent" | "success" | "warning" | "danger"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", {
      "bg-slate-100 text-slate-700": tone === "neutral",
      "bg-accent-50 text-accent-700": tone === "accent",
      "bg-emerald-50 text-emerald-700": tone === "success",
      "bg-amber-50 text-amber-700": tone === "warning",
      "bg-red-50 text-red-700": tone === "danger",
    }, className)}>{children}</span>
  );
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const labels: Record<AppointmentStatus, string> = { NEW: "Новая", CONFIRMED: "Подтверждена", COMPLETED: "Завершена", CANCELLED: "Отменена" };
  const tones: Record<AppointmentStatus, "accent" | "success" | "neutral" | "danger"> = { NEW: "accent", CONFIRMED: "success", COMPLETED: "neutral", CANCELLED: "danger" };
  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}
