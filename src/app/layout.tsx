import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AutoImport from "@/components/AutoImport";
import GlobalSyncIndicator from "@/components/GlobalSyncIndicator";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import Footer from "@/components/Footer";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Dland Language — Nền tảng học ngôn ngữ đa năng",
  description: "Hệ thống học ngôn ngữ đa năng (Tiếng Nhật, Tiếng Anh, Tiếng Đức...) với Flashcard SRS, Ngữ pháp và Tra cứu từ điển",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="antialiased h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7251069941916539"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 overflow-x-clip">
        <AuthProvider>
          <AutoImport />
          <Navbar />
          <GlobalSyncIndicator />
          <AuthModal />
          <main id="main-content" className="flex-1 md:pl-64 pb-24 md:pb-8 transition-all duration-300 ease-in-out w-full min-w-0">{children}</main>
          <div className="md:pl-64">
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}