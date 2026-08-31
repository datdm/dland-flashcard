import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AutoImport from "@/components/AutoImport";
import GlobalSyncIndicator from "@/components/GlobalSyncIndicator";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Dland Language — Nền tảng học ngôn ngữ đa năng",
  description: "Hệ thống học ngôn ngữ đa năng (Tiếng Nhật, Tiếng Anh, Tiếng Đức...) với Flashcard SRS, Ngữ pháp và Tra cứu từ điển",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${geist.variable} antialiased h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 overflow-x-clip">
        <AuthProvider>
          <AutoImport />
          <Navbar />
          <GlobalSyncIndicator />
          <AuthModal />
          <main id="main-content" className="flex-1 md:pl-64 pb-24 md:pb-8 transition-all duration-300 ease-in-out w-full min-w-0">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}