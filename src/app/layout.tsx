import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "../components/providers/QueryProvider";
import AuthInitializer from "../components/providers/AuthInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Amdox Technologies ERP Portal",
  description: "A state-of-the-art enterprise resource planning platform with AI-driven insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <QueryProvider>
          <AuthInitializer>
            {children}
          </AuthInitializer>
        </QueryProvider>
      </body>
    </html>
  );
}

