import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AutoImport from "@/components/AutoImport";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "FlashCash — Học từ vựng tiếng Nhật",
  description: "Ứng dụng flashcard học từ vựng tiếng Nhật",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${geist.variable} antialiased h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <AutoImport />
        <Navbar />
        <main className="flex-1 pb-24">{children}</main>
      </body>
    </html>
  );
}