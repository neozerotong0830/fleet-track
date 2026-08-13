import { Inter } from "next/font/google";
import "./globals.css";
import { AuthShell } from "@/components/auth/AuthShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "機械部 · 設備管理系統",
  description: "部門資產、維修、證書與組織管理",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full bg-[#f3f4f6] font-sans">
        <AuthShell>{children}</AuthShell>
      </body>
    </html>
  );
}
