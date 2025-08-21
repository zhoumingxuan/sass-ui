import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Breadcrumbs from "@/components/Breadcrumbs";

const notoSans = Noto_Sans_SC({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Sass UI Demo",
  description: "示例界面",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body className={`${notoSans.variable} antialiased`}>
        <NavBar />
        <div className="mx-auto max-w-screen-xl p-4">
          <Breadcrumbs />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
