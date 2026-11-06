"use client";
import { AlertCircle, Check, LoaderCircle } from "lucide-react";
import { Label } from "@/components/ui/field";

export function Notice({ kind = "error", children }) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex gap-2 rounded-xl p-3 text-sm ${kind === "error" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700"}`}
    >
      {kind === "error" ? <AlertCircle size={18} /> : <Check size={18} />}
      <span>{children}</span>
    </div>
  );
}

export function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-blue-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Spinner() {
  return (
    <div
      className="grid min-h-44 place-items-center text-blue-600"
      aria-label="Loading"
    >
      <LoaderCircle className="animate-spin" />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Loading listings"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
        >
          <div className="h-52 animate-pulse bg-slate-100" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div
      className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5"
      aria-label="Loading records"
    >
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex gap-4">
          {Array.from({ length: columns }, (_, column) => (
            <div
              key={column}
              className="h-4 flex-1 animate-pulse rounded bg-slate-100"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Empty({ label = "Nothing here yet." }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
      {label}
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
