import { cn } from "@/lib/utils";
export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-100 bg-white shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
export function CardContent({ className, ...props }) {
  return <div className={cn("p-5", className)} {...props} />;
}
