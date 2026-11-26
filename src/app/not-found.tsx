import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main id="main-content" className="mx-auto grid max-w-md gap-4 p-8 text-center">
      <h1 className="text-2xl font-extrabold text-ink">Page not found</h1>
      <p className="text-sm text-ink-2">The air-quality route you asked for is not here.</p>
      <Link
        href="/"
        className="mx-auto inline-flex min-h-[48px] items-center justify-center rounded-pill bg-brand px-6 font-semibold text-on-brand"
      >
        Return to Today
      </Link>
    </main>
  );
}
