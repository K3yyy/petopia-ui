import { Suspense } from "react";
import PetopiaApp from "@/components/petopia-app";

export default function RoutedPage() {
  return (
    <Suspense
      fallback={<div className="p-16 text-center">Loading Petopia...</div>}
    >
      <PetopiaApp />
    </Suspense>
  );
}
