"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { readAuthSession } from "@/lib/auth-session";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const isLogin = pathname === "/login";

  useEffect(() => {
    const session = readAuthSession();
    setReady(true);
    if (!session && !isLogin) router.replace("/login");
    if (session && isLogin) router.replace("/");
  }, [isLogin, router]);

  if (!ready) {
    return <div className="min-h-full flex-1 bg-[#f3f4f6]" />;
  }

  const session = readAuthSession();
  if (!session && !isLogin) {
    return <div className="min-h-full flex-1 bg-[#f3f4f6]" />;
  }

  return (
    <>
      {!isLogin && <Sidebar />}
      <div className="flex min-h-full min-w-0 flex-1 flex-col">{children}</div>
    </>
  );
}
