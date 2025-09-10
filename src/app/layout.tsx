import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Sass UI Demo",
  description: "示例界面",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`antialiased font-sans`}>
        <main>{children}</main>
      </body>
    </html>
  );
}
