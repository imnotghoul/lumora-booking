import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({ label, error, hint, required, children, className }: { label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-2 text-sm font-medium text-ink", className)}>
      <span>{label}{required ? <span className="ml-1 text-danger" aria-hidden>*</span> : null}</span>
      {children}
      {error ? <span className="text-xs font-medium text-danger" role="alert">{error}</span> : hint ? <span className="text-xs font-normal text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputStyles = "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink shadow-sm outline-none placeholder:text-slate-400 focus:border-accent-400 focus:ring-4 focus:ring-accent-100 disabled:bg-slate-50 disabled:text-slate-500";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cn(inputStyles, className)} {...props} />);
Input.displayName = "Input";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => <select ref={ref} className={cn(inputStyles, "appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23657085%22 stroke-width=%222%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-[right_12px_center] bg-no-repeat pr-10", className)} {...props} />);
Select.displayName = "Select";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => <textarea ref={ref} className={cn(inputStyles, "min-h-24 resize-y py-3", className)} {...props} />);
Textarea.displayName = "Textarea";
