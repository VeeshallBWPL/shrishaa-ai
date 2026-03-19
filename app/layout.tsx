import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Shrishaa AI",
  description: "AI-powered fashion content generation dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-60 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
