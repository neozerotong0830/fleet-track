"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Construction, Eye, EyeOff, Lock, QrCode, Settings, User } from "lucide-react";
import { writeAuthSession } from "@/lib/auth-session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setHint(null);
    if (!email.trim() || !password) {
      setError("請輸入帳號／電郵及密碼");
      return;
    }
    setError(null);
    writeAuthSession(email, remember);
    router.replace("/");
  }

  return (
    <div className="flex min-h-screen">
      <section
        className="relative hidden min-h-full flex-1 flex-col justify-between bg-cover bg-center p-20 text-white lg:flex"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(27, 58, 42, 0.85) 0%, rgba(15, 38, 24, 0.96) 100%), url(/login-hero.png)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
          <span className="text-xs font-medium tracking-[0.08em] text-white/80">SYSTEM ONLINE · v4.12.0</span>
        </div>
        <div className="flex flex-col gap-6">
          <div className="w-fit rounded-2xl bg-white/10 p-3">
            <Construction size={40} />
          </div>
          <div>
            <div className="text-[44px] leading-tight font-extrabold tracking-tight">機械部</div>
            <div className="text-4xl font-bold text-white/90">設備管理系統</div>
          </div>
          <div className="h-1 w-[120px] bg-[#16a34a]" />
          <p className="text-lg font-medium tracking-[0.22em] text-white/85">高效管理 · 安全運作 · 智慧維護</p>
        </div>
        <div className="flex items-center gap-10">
          <div>
            <div className="text-2xl font-extrabold">100%</div>
            <div className="text-[13px] text-white/70">設備履歷追蹤</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <div className="text-2xl font-extrabold">0.1s</div>
            <div className="text-[13px] text-white/70">雲端同步速度</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <div className="text-2xl font-extrabold">Real-time</div>
            <div className="text-[13px] text-white/70">異常警報即時通知</div>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-full flex-1 flex-col items-center justify-center bg-white px-8 py-16 lg:px-[100px]">
        <form onSubmit={handleLogin} className="flex w-full max-w-[480px] flex-col gap-10">
          <div className="flex flex-col gap-4">
            <div className="w-fit rounded-xl bg-[#E8F5E9] p-3">
              <Settings size={32} className="text-[#1B3A2A]" />
            </div>
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-[#111827]">歡迎回來</h1>
              <p className="mt-1.5 text-base font-semibold text-[#4b5563]">請登入您的設備管理員帳號</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <label className="flex flex-col gap-2 text-base font-semibold text-[#111827]">
              帳號 / 電郵
              <span className="flex h-12 items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-white px-4">
                <User size={18} className="text-[#9ca3af]" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="請輸入您的帳號或電郵地址"
                  autoComplete="username"
                  className="w-full text-sm font-medium outline-none placeholder:text-[#9ca3af]"
                />
              </span>
            </label>
            <label className="flex flex-col gap-2 text-base font-semibold text-[#111827]">
              密碼
              <span className="flex h-12 items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-white px-4">
                <Lock size={18} className="text-[#9ca3af]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入您的密碼"
                  autoComplete="current-password"
                  className="w-full text-sm font-medium outline-none placeholder:text-[#9ca3af]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[#9ca3af]"
                  aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-[#4b5563]">
                <button
                  type="button"
                  onClick={() => setRemember((v) => !v)}
                  className="flex h-[18px] w-[18px] items-center justify-center rounded border-2 border-[#1B3A2A] bg-white"
                  aria-pressed={remember}
                >
                  {remember && <span className="h-2.5 w-2.5 rounded-sm bg-[#1B3A2A]" />}
                </button>
                記住我
              </label>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setHint("請聯絡系統管理員重設密碼");
                }}
                className="text-sm font-semibold text-[#16a34a]"
              >
                忘記密碼？
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {error && <p className="text-sm font-semibold text-[#dc2626]">{error}</p>}
            {hint && <p className="text-sm font-semibold text-[#4b5563]">{hint}</p>}
            <button
              type="submit"
              className="h-[50px] rounded-lg bg-[#1B3A2A] text-base font-semibold text-white shadow-[0_4px_12px_rgba(27,58,42,0.15)]"
            >
              登入系統
            </button>
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-[#e5e7eb]" />
              <span className="text-[13px] text-[#9ca3af]">或</span>
              <div className="h-px flex-1 bg-[#e5e7eb]" />
            </div>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setHint("QR Code 掃碼登入尚未開放");
              }}
              className="flex h-[50px] items-center justify-center gap-2.5 rounded-lg border border-[#1B3A2A] text-base font-semibold text-[#1B3A2A]"
            >
              <QrCode size={18} />
              QR Code 掃碼快速登入
            </button>
          </div>
        </form>
        <p className="absolute bottom-6 text-[13px] text-[#9ca3af]">© 2026 機械部設備管理系統 版權所有</p>
      </section>
    </div>
  );
}
