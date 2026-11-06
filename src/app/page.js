import { Suspense } from "react";
import PetopiaApp from "@/components/petopia-app";

export default function HomePage() {
  return (
    <Suspense
      fallback={<div className="p-16 text-center">Loading Petopia…</div>}
    >
      <PetopiaApp />
    </Suspense>
  );
}
