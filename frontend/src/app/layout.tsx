import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Securar | AI-Powered Security Readiness Platform",
  description:
    "Automated security assessments that tell you exactly where you stand before you pay for certification. Pre-audit readiness in hours, not weeks.",
  keywords: [
    "ISO 27001",
    "security assessment",
    "compliance",
    "audit readiness",
    "cyber security",
    "risk assessment",
    "ISMS",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

