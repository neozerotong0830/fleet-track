"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EngineBrandRedirectPage() {
  return (
    <Suspense>
      <Redirect />
    </Suspense>
  );
}

function Redirect() {
  const params = useParams<{ brand: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/machinery/engines?brand=${encodeURIComponent(String(params.brand))}`);
  }, [params.brand, router]);
  return <main className="p-8 text-sm text-[#6b7280]">前往引擎管理…</main>;
}
