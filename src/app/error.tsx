"use client";

import React from "react";
import { Button } from "@/components/ui/Primitives";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="mx-auto grid max-w-md gap-4 p-8 text-center">
      <h1 className="text-2xl font-extrabold text-ink">Something went wrong</h1>
      <p className="text-sm text-ink-2">
        Your profile stays safe in your browser. Try reloading this view.
      </p>
      <div className="flex justify-center">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
