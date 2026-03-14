import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seed3 Web Port",
  description: "Next.js runtime shell for porting the legacy iOS game seed3 to the web.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
