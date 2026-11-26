import { SaansApp } from "@/components/SaansApp";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const sp = await searchParams;
  const initialDemo = sp.demo === "sharma" || sp.demo === "ahmedabad" ? sp.demo : false;
  return <SaansApp initialDemo={initialDemo} />;
}
