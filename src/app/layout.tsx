import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.scss";

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
      <body className={`${notoSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
