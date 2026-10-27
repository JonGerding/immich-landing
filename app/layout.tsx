import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Julia & Jonas Hochzeitsfotos",
  description: "Hochzeitsfotos von der Hochzeit von Julia und Jonas am 15. August 2026.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`h-full antialiased`}
      translate="no"
    >
      <body>{children}</body>
    </html>
  );
}
