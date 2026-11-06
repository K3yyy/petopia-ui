import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
export function Button({
  asChild = false,
  variant = "primary",
  className,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700",
        variant === "outline" &&
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        variant === "ghost" &&
          "text-slate-600 hover:bg-blue-50 hover:text-blue-700",
        className,
      )}
      {...props}
    />
  );
}
