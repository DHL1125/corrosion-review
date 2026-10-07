import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "투자사업 부식검토",
  description: "RTS·MOC 사례 기반 부식검토",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
