import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistem Permohonan TNT & OT - JKSM",
  description: "Sistem Kelulusan Kerja Lebih Masa dan Tugas Luar Stesen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ms">
        <body className="antialiased bg-slate-50 text-slate-900">{children}</body>
      </html>
    </ClerkProvider>
  );
}