import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AutoImport from "@/components/AutoImport";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "FlashCash — Nền tảng học tiếng Nhật N5 - N2",
  description: "Ứng dụng flashcard, ngữ pháp và Kanji học tiếng Nhật toàn diện",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${geist.variable} antialiased h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <AutoImport />
        <Navbar />
        <main className="flex-1 md:pl-64 pb-24 md:pb-8">{children}</main>
      </body>
    </html>
  );
}