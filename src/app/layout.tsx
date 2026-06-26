import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "../components/providers/QueryProvider";
import AuthInitializer from "../components/providers/AuthInitializer";

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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 font-sans">
        <QueryProvider>
          <AuthInitializer>
            {children}
          </AuthInitializer>
        </QueryProvider>
      </body>
    </html>
  );
}
