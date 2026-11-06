import { cn } from "@/lib/utils";
export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50",
        className,
      )}
      {...props}
    />
  );
}
export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
        className,
      )}
      {...props}
    />
  );
}
export function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-medium text-slate-700",
        className,
      )}
      {...props}
    />
  );
}
